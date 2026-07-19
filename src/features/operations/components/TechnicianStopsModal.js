import React, { useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import { DetailModal, AsyncState, DataTable, Badge } from '@/components';
import { formatCurrency, formatDateShort, formatNumber, statusTone } from '@/utils/format';
import InvoiceLinesModal from '@/features/revenue/components/InvoiceLinesModal';

const stopColumns = [
  { key: 'invoiceNumber', header: 'Invoice #', width: 110 },
  { key: 'invoiceDate', header: 'Date', width: 100, render: (r) => formatDateShort(r.invoiceDate) },
  { key: 'customer', header: 'Customer', width: 170 },
  { key: 'status', header: 'Status', width: 120, render: (r) => (r.status ? <Badge tone={statusTone(r.status)}>{r.status}</Badge> : '-') },
  { key: 'arrivalTime', header: 'Arrival', width: 90, render: (r) => r.arrivalTime || '-' },
  { key: 'departureTime', header: 'Departure', width: 90, render: (r) => r.departureTime || '-' },
  { key: 'lineItemCount', header: 'Lines', align: 'right', width: 60, render: (r) => formatNumber(r.lineItemCount) },
  { key: 'total', header: 'Total', align: 'right', width: 100, render: (r) => formatCurrency(r.total) },
];

export default function TechnicianStopsModal({ technician, range, onClose }) {
  const { from, to } = range || {};
  const { data, loading, error, reload } = useApi(
    () => biService.closedInvoices({ from, to, routeCode: technician, pageSize: 'all' }),
    [technician, from, to],
  );
  const [invoice, setInvoice] = useState(null);
  const rows = data || [];
  return (
    <DetailModal
      visible={!!technician}
      onClose={onClose}
      title={`Stops — ${technician}`}
      subtitle={`${rows.length} closed invoices — tap a row for line items`}
    >
      <AsyncState loading={loading} error={error} empty={!loading && !error && rows.length === 0} onRetry={reload}>
        {rows.length ? (
          <DataTable title="Stops (invoices)" columns={stopColumns} rows={rows} onRowClick={(r) => setInvoice(r.invoiceNumber)} />
        ) : null}
      </AsyncState>
      {invoice ? <InvoiceLinesModal invoiceNumber={invoice} onClose={() => setInvoice(null)} /> : null}
    </DetailModal>
  );
}
