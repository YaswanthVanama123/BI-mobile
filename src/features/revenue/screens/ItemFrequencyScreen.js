import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, RouteTabs, AsyncState, DataTable, StatGrid, StatCard,
} from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatCurrency, formatNumber } from '@/utils/format';
import DrillModal from '@/features/revenue/components/DrillModal';

const columns = [
  { key: 'item', header: 'Item', width: 180 },
  { key: 'category', header: 'Category', width: 140 },
  { key: 'frequency', header: 'Frequency', width: 120, render: (r) => r.frequency || '—' },
  { key: 'perYear', header: 'Per year', align: 'right', width: 80, render: (r) => (r.perYear ? formatNumber(r.perYear) : '—') },
  { key: 'invoices', header: 'Invoices', align: 'right', width: 80, render: (r) => formatNumber(r.invoices) },
  { key: 'customers', header: 'Customers', align: 'right', width: 90, render: (r) => formatNumber(r.customers) },
  { key: 'qty', header: 'Qty', align: 'right', width: 70, render: (r) => formatNumber(r.qty) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', width: 100, render: (r) => formatCurrency(r.invoiced) },
];

export default function ItemFrequencyScreen() {
  const { range, setRange } = useFilters();
  const { from, to } = range;
  const [freq, setFreq] = useState('all');
  const [selected, setSelected] = useState(null);

  const { data, loading, error, reload } = useApi(() => biService.itemFrequency({ from, to }), [from, to]);
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  const freqOptions = useMemo(() => [...new Set(rows.map((r) => r.frequency).filter(Boolean))].sort(), [rows]);
  const filtered = useMemo(() => rows.filter((r) => freq === 'all' || r.frequency === freq), [rows, freq]);

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Item Frequency" subtitle="Every service item invoiced in the selected period, with its billing frequency and how many invoices/customers it appears on. Tap an item to see the invoices that contain it." />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} />
      </FilterBar>
      <RouteTabs routes={freqOptions} value={freq} onChange={setFreq} allLabel="All" />

      <AsyncState loading={loading} error={error} empty={!loading && !error && !k} onRetry={reload}>
        {k ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Items" value={formatNumber(k.items)} tone="info" />
              <StatCard label="Line occurrences" value={formatNumber(k.occurrences)} />
              <StatCard label="Invoices" value={formatNumber(k.invoices)} />
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} tone="success" />
            </StatGrid>
            <DataTable title="Items by frequency" columns={columns} rows={filtered} maxRows={2000} onRowClick={(r) => setSelected(r)} />
          </>
        ) : null}
      </AsyncState>

      {selected ? (
        <DrillModal
          title={`${selected.item}${selected.frequency ? ` · ${selected.frequency}` : ''}`}
          subtitle="Invoices containing this item at this frequency"
          filter={{ category: selected.item, frequency: selected.frequency || '(none)' }}
          range={range}
          defaultTab="invoices"
          onClose={() => setSelected(null)}
        />
      ) : null}
    </Screen>
  );
}
