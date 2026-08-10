import React, { useEffect, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, RouteTabs, AsyncState, DataTable, Pager,
  StatGrid, StatCard, Badge, Card, SectionTitle, Muted,
} from '@/components';
import { BarChartCard } from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatMinutes, formatNumber, formatDateShort, statusTone, toNumber } from '@/utils/format';
import DrillModal from '@/features/revenue/components/DrillModal';

const legColumns = [
  { key: 'fromInvoiceNumber', header: 'From #', width: 100 },
  { key: 'fromCustomer', header: 'From customer', width: 160 },
  { key: 'toInvoiceNumber', header: 'To #', width: 100 },
  { key: 'toCustomer', header: 'To customer', width: 160 },
  { key: 'fromDeparture', header: 'Departure', width: 90, render: (r) => r.fromDeparture || '-' },
  { key: 'toArrival', header: 'Next arrival', width: 90, render: (r) => r.toArrival || '-' },
  { key: 'observedGapMinutes', header: 'Observed gap', align: 'right', width: 100, render: (r) => (r.observedGapMinutes != null ? formatMinutes(r.observedGapMinutes) : '-'), csv: (r) => formatMinutes(r.observedGapMinutes) },
  { key: 'drivingMinutes', header: 'Driving', align: 'right', width: 80, render: (r) => (r.drivingMinutes != null ? formatMinutes(r.drivingMinutes) : '-'), csv: (r) => formatMinutes(r.drivingMinutes) },
  { key: 'distanceMiles', header: 'Miles', align: 'right', width: 70, render: (r) => (r.distanceMiles != null ? formatNumber(r.distanceMiles) : '-') },
  {
    key: 'extraTimeMinutes', header: 'Extra (idle)', align: 'right', width: 100,
    render: (r) => (r.extraTimeMinutes != null ? <Badge tone={r.extraTimeMinutes > 15 ? 'warning' : 'neutral'}>{formatMinutes(r.extraTimeMinutes)}</Badge> : '-'),
    csv: (r) => formatMinutes(r.extraTimeMinutes),
  },
  { key: 'status', header: 'Status', width: 110, render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
];

const summaryColumns = [
  { key: 'date', header: 'Completed', width: 110, render: (r) => formatDateShort(r.date) },
  { key: 'routeCode', header: 'Route', width: 80 },
  { key: 'legCount', header: 'Legs', align: 'right', width: 70, render: (r) => formatNumber(r.legCount) },
  { key: 'invoiceNumbers', header: 'Invoice #', width: 150, render: (r) => ((r.invoiceNumbers && r.invoiceNumbers.length) ? r.invoiceNumbers.join(', ') : '-') },
  { key: 'drivingMinutes', header: 'Driving', align: 'right', width: 80, render: (r) => formatMinutes(r.drivingMinutes), csv: (r) => formatMinutes(r.drivingMinutes) },
  { key: 'observedGapMinutes', header: 'Observed gap', align: 'right', width: 100, render: (r) => formatMinutes(r.observedGapMinutes), csv: (r) => formatMinutes(r.observedGapMinutes) },
  { key: 'extraTimeMinutes', header: 'Extra (idle)', align: 'right', width: 100, render: (r) => <Badge tone={toNumber(r.extraTimeMinutes) > 60 ? 'warning' : 'neutral'}>{formatMinutes(r.extraTimeMinutes)}</Badge>, csv: (r) => formatMinutes(r.extraTimeMinutes) },
  { key: 'distanceMiles', header: 'Miles', align: 'right', width: 70, render: (r) => formatNumber(r.distanceMiles) },
];

const allLegColumns = [
  { key: 'date', header: 'Completed', width: 110, render: (r) => formatDateShort(r.date) },
  { key: 'routeCode', header: 'Route', width: 80 },
  ...legColumns,
];

export default function DriveTimeScreen() {
  const { range, setRange } = useFilters();
  const [routeCode, setRouteCode] = useState('all');
  const [sumPage, setSumPage] = useState(1);
  const [sumQ, setSumQ] = useState('');
  const [drill, setDrill] = useState(null);
  const { from, to } = range;

  const opts = useApi(() => biService.driveTimeOptions(), []);
  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.driveTime({ from, to, routeCode }) : Promise.resolve({ data: null })),
    [from, to, routeCode],
  );
  useEffect(() => { setSumPage(1); }, [from, to, routeCode, sumQ]);
  const summaryApi = useApi(
    () => (from && to ? biService.driveTime({ from, to, routeCode, q: sumQ || undefined, page: sumPage, pageSize: 25 }) : Promise.resolve({ data: null })),
    [from, to, routeCode, sumQ, sumPage],
  );
  const summaryRows = (summaryApi.data && summaryApi.data.summary) || [];
  const summaryTotal = (summaryApi.page && summaryApi.page.total) || 0;
  const summaryTotalPages = (summaryApi.page && summaryApi.page.totalPages) || 1;
  const exportSummary = async () => {
    const res = await biService.driveTime({ from, to, routeCode, q: sumQ || undefined, pageSize: 'all' });
    return (res && res.data && res.data.summary) || [];
  };
  const legsApi = useApi(
    () => (from && to ? biService.driveTimeLegs({ from, to, routeCode, pageSize: 'all' }) : Promise.resolve({ data: [] })),
    [from, to, routeCode],
  );

  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const hasData = opts.data && opts.data.latestDate;
  const kpi = (data && data.kpis) || { legs: 0, driving: 0, observed: 0, extra: 0, distance: 0, avgExtra: 0 };
  const perRoute = (data && data.perRoute) || [];
  const allLegs = legsApi.data || [];

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
        <AsyncState loading={loading || opts.loading} error={error} empty={!loading && !error && !data} onRetry={reload}>
          {data ? (
            <>
              <StatGrid columns={2}>
                <StatCard label="Legs" value={formatNumber(kpi.legs)} tone="info" />
                <StatCard label="Driving time" value={formatMinutes(kpi.driving)} tone="success" />
                <StatCard label="Observed gap" value={formatMinutes(kpi.observed)} sublabel="departure → next arrival" />
                <StatCard label="Extra (idle) time" value={formatMinutes(kpi.extra)} tone="warning" />
                <StatCard label="Avg extra / leg" value={formatMinutes(kpi.avgExtra)} tone={kpi.avgExtra > 15 ? 'warning' : 'neutral'} />
                <StatCard label="Distance" value={`${formatNumber(kpi.distance)} mi`} />
              </StatGrid>

              <BarChartCard title="Extra (idle) time by route" subtitle="gap beyond driving, over range" data={perRoute} xKey="routeCode" bars={[{ key: 'extra', label: 'Extra (min)', color: '#F59E0B' }]} valueFormatter={formatMinutes} />
              <BarChartCard title="Driving vs extra by route (min)" data={perRoute} xKey="routeCode"
                bars={[{ key: 'driving', label: 'Driving (min)', color: '#2563EB' }, { key: 'extra', label: 'Extra (min)', color: '#F59E0B' }]} valueFormatter={formatMinutes} />

              <DataTable title="Route / day summary" columns={summaryColumns} rows={summaryRows} onServerSearch={setSumQ} searchPlaceholder="Search route / invoice…" onRowClick={(r) => setDrill(r)} onExportAll={exportSummary} exportName="drive-time-summary" />
              {summaryTotalPages > 1 ? (
                <Pager page={sumPage} totalPages={summaryTotalPages} total={summaryTotal} loading={summaryApi.loading} onPrev={() => setSumPage((p) => Math.max(1, p - 1))} onNext={() => setSumPage((p) => Math.min(summaryTotalPages, p + 1))} />
              ) : null}

              <SectionTitle>Leg detail (all routes)</SectionTitle>
              <DataTable title="Legs" columns={allLegColumns} rows={allLegs} maxRows={2000} />
            </>
          ) : null}
        </AsyncState>
      ) : null}
      {drill ? (
        <DrillModal
          title={`${drill.routeCode} · ${formatDateShort(drill.date)}`}
          subtitle="Invoices completed by this route on the selected day"
          filter={{ routeCode: drill.routeCode }}
          range={{ from: drill.date, to: drill.date }}
          defaultTab="invoices"
          onClose={() => setDrill(null)}
        />
      ) : null}
    </Screen>
  );
}
