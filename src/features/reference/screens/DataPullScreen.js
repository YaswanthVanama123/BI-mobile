import React, { useEffect, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, AsyncState, DataTable, Pager, Muted,
} from '@/components';
import { formatCurrency, formatDateShort, formatMinutes, formatNumber } from '@/utils/format';
import InvoiceLinesModal from '@/features/revenue/components/InvoiceLinesModal';

const PAGE_SIZE = 50;

const columns = [
  { key: 'serviceDate', header: 'Service date', width: 110, render: (r) => formatDateShort(r.serviceDate) },
  { key: 'stopId', header: 'Stop ID', width: 110 },
  { key: 'customerId', header: 'Customer ID', width: 120 },
  { key: 'customerName', header: 'Customer name', width: 180 },
  { key: 'serviceAddress', header: 'Service address', width: 220, render: (r) => r.serviceAddress || '—' },
  { key: 'routeId', header: 'Route ID', width: 90 },
  { key: 'stopSequence', header: 'Seq', align: 'right', width: 60, render: (r) => formatNumber(r.stopSequence) },
  { key: 'technicianId', header: 'Technician ID', width: 120 },
  { key: 'serviceNotes', header: 'Technician type', width: 220, render: (r) => r.serviceNotes || '—' },
  { key: 'checkIn', header: 'Check-in', width: 150, render: (r) => r.checkIn || '—' },
  { key: 'checkOut', header: 'Check-out', width: 150, render: (r) => r.checkOut || '—' },
  { key: 'travelMinutes', header: 'Travel time', align: 'right', width: 100, render: (r) => (r.travelMinutes != null ? formatMinutes(r.travelMinutes) : '—'), csv: (r) => (r.travelMinutes != null ? formatMinutes(r.travelMinutes) : '') },
  { key: 'travelMiles', header: 'Travel mi', align: 'right', width: 90, render: (r) => (r.travelMiles != null ? formatNumber(r.travelMiles) : '—') },
  { key: 'serviceCategory', header: 'Service category', width: 180, render: (r) => r.serviceCategory || '—' },
  { key: 'serviceFrequency', header: 'Service frequency', width: 130, render: (r) => r.serviceFrequency || '—' },
  { key: 'servicePhase', header: 'Service phase', width: 120, render: (r) => r.servicePhase || '—' },
  { key: 'revenueAmount', header: 'Revenue', align: 'right', width: 100, render: (r) => formatCurrency(r.revenueAmount) },
  { key: 'chemicalSupplyCost', header: 'Chemical/supply cost', align: 'right', width: 150, render: (r) => (r.chemicalSupplyCost != null ? formatCurrency(r.chemicalSupplyCost) : '—') },
  { key: 'accountStatus', header: 'Account status', width: 120, render: (r) => r.accountStatus || '—' },
  { key: 'statusDate', header: 'Status date', width: 110, render: (r) => (r.statusDate ? formatDateShort(r.statusDate) : '—') },
  { key: 'billingCadence', header: 'Billing cadence', width: 120, render: (r) => r.billingCadence || '—' },
  { key: 'billingAmount', header: 'Billing amount', align: 'right', width: 110, render: (r) => (r.billingAmount != null ? formatCurrency(r.billingAmount) : '—') },
];

export default function DataPullScreen() {
  const [range, setRange] = useState({ preset: 'this_year', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const { from, to } = range;

  useEffect(() => { setPage(1); }, [from, to]);
  const { data, meta, page: pageInfo, loading, error, reload } = useApi(
    () => biService.dataPull({ from: from || undefined, to: to || undefined, page, pageSize: PAGE_SIZE }),
    [from, to, page],
  );
  const rows = data || [];
  const total = (pageInfo && pageInfo.total) || (meta && meta.total) || 0;
  const totalPages = (pageInfo && pageInfo.totalPages) || 1;

  const exportAll = async () => {
    const res = await biService.dataPull({ from: from || undefined, to: to || undefined, pageSize: 'all' });
    return (res && res.data) || [];
  };

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Data Export" subtitle={`One row per completed stop. ${formatNumber(total)} stops. Export downloads all rows.`} />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} />
      </FilterBar>
      <Muted style={{ marginBottom: 8 }}>Chemical cost comes from an external source not yet connected — shown as “—”. Status date is the customer’s most recent activity date. Service phase is derived from frequency.</Muted>

      <AsyncState loading={loading} error={error} empty={!loading && !error && rows.length === 0} onRetry={reload}>
        {rows.length ? (
          <>
            <DataTable title="Data pull" columns={columns} rows={rows} paginated={false} searchable={false} onExportAll={exportAll} exportName="bi-data-pull" onRowClick={(r) => r.stopId && setSelected(r.stopId)} />
            <Pager page={page} totalPages={totalPages} total={total} loading={loading} onPrev={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(totalPages, p + 1))} />
          </>
        ) : null}
      </AsyncState>
      {selected ? <InvoiceLinesModal invoiceNumber={selected} onClose={() => setSelected(null)} /> : null}
    </Screen>
  );
}
