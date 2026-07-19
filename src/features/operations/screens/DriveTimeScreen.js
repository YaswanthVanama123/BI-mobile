import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, RouteTabs, AsyncState, DataTable,
  StatGrid, StatCard, Badge, Card, SectionTitle, Muted,
} from '@/components';
import { BarChartCard } from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatMinutes, formatNumber, formatDateShort, statusTone, toNumber } from '@/utils/format';

const legColumns = [
  { key: 'fromInvoiceNumber', header: 'From #', width: 100 },
  { key: 'fromCustomer', header: 'From customer', width: 160 },
  { key: 'toInvoiceNumber', header: 'To #', width: 100 },
  { key: 'toCustomer', header: 'To customer', width: 160 },
  { key: 'fromDeparture', header: 'Departure', width: 90, render: (r) => r.fromDeparture || '-' },
  { key: 'toArrival', header: 'Next arrival', width: 90, render: (r) => r.toArrival || '-' },
  { key: 'observedGapMinutes', header: 'Observed gap', align: 'right', width: 100, render: (r) => (r.observedGapMinutes != null ? formatMinutes(r.observedGapMinutes) : '-') },
  { key: 'drivingMinutes', header: 'Driving', align: 'right', width: 80, render: (r) => (r.drivingMinutes != null ? formatMinutes(r.drivingMinutes) : '-') },
  { key: 'distanceMiles', header: 'Miles', align: 'right', width: 70, render: (r) => (r.distanceMiles != null ? formatNumber(r.distanceMiles) : '-') },
  {
    key: 'extraTimeMinutes', header: 'Extra (idle)', align: 'right', width: 100,
    render: (r) => (r.extraTimeMinutes != null ? <Badge tone={r.extraTimeMinutes > 15 ? 'warning' : 'neutral'}>{formatMinutes(r.extraTimeMinutes)}</Badge> : '-'),
  },
  { key: 'status', header: 'Status', width: 110, render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
];

const summaryColumns = [
  { key: 'date', header: 'Date', width: 110, render: (r) => formatDateShort(r.date) },
  { key: 'routeCode', header: 'Route', width: 80 },
  { key: 'legCount', header: 'Legs', align: 'right', width: 70, render: (r) => formatNumber(r.legCount) },
  { key: 'invoiceNumbers', header: 'Invoice #', width: 150, render: (r) => ((r.invoiceNumbers && r.invoiceNumbers.length) ? r.invoiceNumbers.join(', ') : '-') },
  { key: 'drivingMinutes', header: 'Driving', align: 'right', width: 80, render: (r) => formatMinutes(r.drivingMinutes) },
  { key: 'observedGapMinutes', header: 'Observed gap', align: 'right', width: 100, render: (r) => formatMinutes(r.observedGapMinutes) },
  { key: 'extraTimeMinutes', header: 'Extra (idle)', align: 'right', width: 100, render: (r) => <Badge tone={toNumber(r.extraTimeMinutes) > 60 ? 'warning' : 'neutral'}>{formatMinutes(r.extraTimeMinutes)}</Badge> },
  { key: 'distanceMiles', header: 'Miles', align: 'right', width: 70, render: (r) => formatNumber(r.distanceMiles) },
];

export default function DriveTimeScreen() {
  const { range, setRange } = useFilters();
  const [routeCode, setRouteCode] = useState('all');
  const { from, to } = range;

  const opts = useApi(() => biService.driveTimeOptions(), []);
  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.driveTime({ from, to, routeCode }) : Promise.resolve({ data: [] })),
    [from, to, routeCode],
  );

  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const groups = data || [];
  const hasData = opts.data && opts.data.latestDate;

  const kpi = useMemo(() => {
    const legs = groups.reduce((t, g) => t + g.legCount, 0);
    const driving = groups.reduce((t, g) => t + (g.drivingMinutes || 0), 0);
    const observed = groups.reduce((t, g) => t + (g.observedGapMinutes || 0), 0);
    const extra = groups.reduce((t, g) => t + (g.extraTimeMinutes || 0), 0);
    const distance = groups.reduce((t, g) => t + (g.distanceMiles || 0), 0);
    return { legs, driving, observed, extra, distance, avgExtra: legs ? extra / legs : 0 };
  }, [groups]);

  const perRoute = useMemo(() => {
    const m = new Map();
    for (const g of groups) {
      const a = m.get(g.routeCode) || { routeCode: g.routeCode, driving: 0, extra: 0, distance: 0, legs: 0 };
      a.driving += g.drivingMinutes || 0; a.extra += g.extraTimeMinutes || 0; a.distance += g.distanceMiles || 0; a.legs += g.legCount;
      m.set(g.routeCode, a);
    }
    return [...m.values()].sort((a, b) => b.extra - a.extra);
  }, [groups]);

  return (
    <Screen loading={loading || opts.loading} onRefresh={reload}>
      <PageHeader
        title="Drive Time by Route"
        subtitle="Mapbox driving time between consecutive stops (same route, same day). Extra = observed gap (next arrival − prev departure) − driving time."
      />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} min={opts.data && opts.data.earliestDate} max={opts.data && opts.data.latestDate} />
      </FilterBar>
      <RouteTabs routes={routeCodes} value={routeCode} onChange={setRouteCode} />

      {!opts.loading && !hasData ? (
        <Card>
          <Muted>No drive-time data yet. Run npm run compute:drive-time -- --from=YYYY-MM-DD --to=YYYY-MM-DD (needs MAPBOX_TOKEN) to compute & cache legs.</Muted>
        </Card>
      ) : null}

      {hasData ? (
        <AsyncState loading={loading || opts.loading} error={error} empty={!loading && !error && groups.length === 0} onRetry={reload}>
          {groups.length ? (
            <>
              <StatGrid columns={2}>
                <StatCard label="Legs" value={formatNumber(kpi.legs)} tone="info" />
                <StatCard label="Driving time" value={formatMinutes(kpi.driving)} tone="success" />
                <StatCard label="Observed gap" value={formatMinutes(kpi.observed)} sublabel="departure → next arrival" />
                <StatCard label="Extra (idle) time" value={formatMinutes(kpi.extra)} tone="warning" />
                <StatCard label="Avg extra / leg" value={formatMinutes(kpi.avgExtra)} tone={kpi.avgExtra > 15 ? 'warning' : 'neutral'} />
                <StatCard label="Distance" value={`${formatNumber(kpi.distance)} mi`} />
              </StatGrid>

              <BarChartCard title="Extra (idle) time by route" subtitle="gap beyond driving, over range" data={perRoute} xKey="routeCode" bars={[{ key: 'extra', label: 'Extra (min)', color: '#F59E0B' }]} />
              <BarChartCard title="Driving vs extra by route (min)" data={perRoute} xKey="routeCode"
                bars={[{ key: 'driving', label: 'Driving (min)', color: '#2563EB' }, { key: 'extra', label: 'Extra (min)', color: '#F59E0B' }]} />

              <DataTable title="Route / day summary" columns={summaryColumns} rows={groups} />

              <SectionTitle>Leg detail</SectionTitle>
              {groups.map((g) => (
                <Card key={`${g.routeCode}|${g.date}`} padded={false} style={styles.groupCard}>
                  <View style={styles.groupHead}>
                    <Text style={styles.groupTitle}>Route {g.routeCode}</Text>
                    <View style={styles.groupMeta}>
                      <Text style={styles.metaText}>{formatDateShort(g.date)}</Text>
                      <Text style={styles.metaText}>{formatNumber(g.legCount)} legs</Text>
                      <Text style={styles.metaText}>driving {formatMinutes(g.drivingMinutes)}</Text>
                      <Text style={styles.metaText}>extra {formatMinutes(g.extraTimeMinutes)}</Text>
                      <Text style={styles.metaText}>{formatNumber(g.distanceMiles)} mi</Text>
                    </View>
                  </View>
                  <DataTable columns={legColumns} rows={g.legs} maxRows={500} />
                </Card>
              ))}
            </>
          ) : null}
        </AsyncState>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  groupCard: { marginBottom: 12, overflow: 'hidden' },
  groupHead: { padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
  groupTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  groupMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaText: { fontSize: 11.5, color: '#6B7280' },
});
