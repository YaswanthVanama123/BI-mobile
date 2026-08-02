import React, { useEffect, useState } from 'react';
import useApi from '@/hooks/useApi';
import useDebounce from '@/hooks/useDebounce';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, SearchInput, RouteTabs, AsyncState, DataTable, Pager, Badge,
} from '@/components';
import { formatCurrency, formatDateShort, formatNumber, statusTone } from '@/utils/format';
import InvoiceLinesModal from '@/features/revenue/components/InvoiceLinesModal';

const PAGE_SIZE = 25;

const columns = [
  { key: 'invoiceNumber', header: 'Invoice #', width: 110 },
  { key: 'dateCompleted', header: 'Completed', width: 110, render: (r) => formatDateShort(r.dateCompleted) },
  { key: 'customer', header: 'Customer', width: 170 },
  { key: 'assignedTo', header: 'Technician', width: 140 },
  { key: 'invoiceType', header: 'Type', width: 110 },
  { key: 'status', header: 'Status', width: 120, render: (r) => (r.status ? <Badge tone={statusTone(r.status)}>{r.status}</Badge> : '-') },
  { key: 'arrivalTime', header: 'Arrival', width: 90 },
  { key: 'departureTime', header: 'Departure', width: 90 },
  { key: 'elapsedTime', header: 'Elapsed', width: 90 },
  { key: 'lineItemCount', header: 'Items', align: 'right', width: 70 },
  { key: 'subtotal', header: 'Subtotal', align: 'right', width: 100, render: (r) => formatCurrency(r.subtotal) },
  { key: 'total', header: 'Total', align: 'right', width: 100, render: (r) => formatCurrency(r.total) },
];

export default function ClosedInvoicesScreen() {
  const [q, setQ] = useState('');
  const dq = useDebounce(q, 400);
  const [range, setRange] = useState({ preset: 'all_time', from: '', to: '' });
  const [route, setRoute] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const { from, to } = range;
  useEffect(() => { setPage(1); }, [dq, from, to, route]);

  const opts = useApi(() => biService.checkinOptions(), []);
  const routes = (opts.data && opts.data.routes) || [];

  const { data, meta, page: pageInfo, loading, error, reload } = useApi(
    () => biService.closedInvoices({ q: dq || undefined, from: from || undefined, to: to || undefined, routeCode: route !== 'all' ? route : undefined, page, pageSize: PAGE_SIZE }),
    [dq, from, to, route, page],
  );

  const rows = data || [];
  const total = (pageInfo && pageInfo.total) || (meta && meta.total) || 0;
  const totalPages = (pageInfo && pageInfo.totalPages) || 1;
  const subtitle = `Read directly from RouteStar (inventory_db). ${formatNumber(total)} closed invoices. Tap a row for line items.`;

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Closed Invoices" subtitle={subtitle} />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} />
        <SearchInput label="Search" value={q} onChangeText={setQ} placeholder="Invoice # / customer…" />
      </FilterBar>
      <RouteTabs routes={routes} value={route} onChange={setRoute} allLabel="All" />

      <AsyncState loading={loading} error={error} empty={!loading && !error && rows.length === 0} onRetry={reload}>
        {rows.length ? (
          <>
            <DataTable title="Closed invoices" columns={columns} rows={rows} paginated={false} searchable={false} onRowClick={(r) => setSelected(r.invoiceNumber)} />
            <Pager page={page} totalPages={totalPages} total={total} loading={loading} onPrev={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(totalPages, p + 1))} />
          </>
        ) : null}
      </AsyncState>

      {selected ? <InvoiceLinesModal invoiceNumber={selected} onClose={() => setSelected(null)} /> : null}
    </Screen>
  );
}
