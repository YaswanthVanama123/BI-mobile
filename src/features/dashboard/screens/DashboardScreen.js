import React from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, AsyncState,
  StatGrid, StatCard, LineChartCard, PieChartCard, BarChartCard,
} from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatCurrency, formatNumber, formatPercent, formatMinutes } from '@/utils/format';

export default function DashboardScreen() {
  const { range, setRange } = useFilters();
  const { from, to } = range;
  const ready = !!(from && to);
  const call = (fn, extra) => () => (ready ? fn({ from, to, ...extra }) : Promise.resolve({ data: null }));

  const route = useApi(call(biService.revenueByRoute), [from, to]);
  const category = useApi(call(biService.revenueByCategory), [from, to]);
  const volume = useApi(call(biService.stopVolumeTrends, { granularity: 'month' }), [from, to]);
  const util = useApi(call(biService.technicianUtilization), [from, to]);
  const svc = useApi(call(biService.serviceVsDriveTime, { granularity: 'month' }), [from, to]);

  const loading = route.loading || category.loading || volume.loading || util.loading || svc.loading;
  const error = route.error || category.error || volume.error || util.error || svc.error;
  const reload = () => { route.reload(); category.reload(); volume.reload(); util.reload(); svc.reload(); };

  const rk = route.data && route.data.kpis;
  const vk = volume.data && volume.data.kpis;
  const uk = util.data && util.data.kpis;
  const sk = svc.data && svc.data.kpis;

  const catPie = ((category.data && category.data.rows) || []).slice(0, 8).map((r) => ({ name: r.category, value: r.invoiced }));
  const splitPie = sk ? [
    { name: 'Service', value: sk.serviceMinutes }, { name: 'Drive', value: sk.driveMinutes }, { name: 'Idle', value: sk.idleMinutes },
  ] : [];
  const utilBars = ((util.data && util.data.rows) || []).slice(0, 12);
  const anyData = rk || vk || uk || sk;

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Operations & Finance" subtitle="Revenue, capacity, and time-use at a glance — straight from RouteStar closed invoices." />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} />
      </FilterBar>

      <AsyncState loading={loading} error={error} empty={!loading && !error && !anyData} onRetry={reload}>
        {anyData ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Invoiced revenue" value={formatCurrency((rk && rk.invoiced) || 0)} sublabel={rk ? `expected ${formatCurrency(rk.expected)}` : ''} tone="success" />
              <StatCard label="Stops" value={formatNumber((vk && vk.stops) || (rk && rk.stops) || 0)} sublabel={`${formatNumber((vk && vk.routes) || (rk && rk.routes) || 0)} routes`} tone="info" />
              <StatCard label="Revenue / stop" value={formatCurrency(vk && vk.stops && rk && rk.invoiced ? rk.invoiced / vk.stops : 0)} />
              <StatCard label="Avg utilization" value={formatPercent((uk && uk.avgUtilizationPct) || 0)} tone={((uk && uk.avgUtilizationPct) || 0) >= 60 ? 'success' : 'warning'} sublabel={`${formatNumber((uk && uk.technicians) || 0)} techs`} />
            </StatGrid>

            <LineChartCard title="Stop volume by month" data={(volume.data && volume.data.series) || []} xKey="bucket" lines={[{ key: 'stops', label: 'Stops', color: '#2563EB' }]} />
            <PieChartCard title="Revenue by category" subtitle="top 8" data={catPie} nameKey="name" valueKey="value" />
            <BarChartCard title="Revenue by route" data={(route.data && route.data.rows) || []} xKey="routeCode" bars={[{ key: 'invoiced', label: 'Invoiced', color: '#2563EB' }]} />
            <PieChartCard title="Where the day goes" subtitle="service vs drive vs idle" data={splitPie} nameKey="name" valueKey="value" />
            <BarChartCard title="Technician utilization (%)" data={utilBars} xKey="technician" bars={[{ key: 'utilizationPct', label: 'Utilization %', color: '#10B981' }]} />
          </>
        ) : null}
      </AsyncState>
    </Screen>
  );
}
