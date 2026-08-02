import React from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import { DetailModal, AsyncState, DataTable, StatGrid, StatCard } from '@/components';
import { formatCurrency, formatNumber, formatDateShort } from '@/utils/format';

const lineColumns = [
  { key: 'name', header: 'Item', width: 150 },
  { key: 'quantity', header: 'Qty', align: 'right', width: 60, render: (r) => formatNumber(r.quantity) },
  { key: 'rate', header: 'Rate', align: 'right', width: 90, render: (r) => formatCurrency(r.rate) },
  { key: 'amount', header: 'Amount', align: 'right', width: 100, render: (r) => formatCurrency(r.amount) },
  { key: 'frequency', header: 'Frequency', width: 110, render: (r) => r.frequency || '—' },
];

export default function InvoiceLinesModal({ invoiceNumber, onClose }) {
  const { data, loading, error, reload } = useApi(() => biService.invoiceDetail(invoiceNumber), [invoiceNumber]);
  return (
    <DetailModal
      visible={!!invoiceNumber}
      onClose={onClose}
      title={`Invoice ${invoiceNumber}`}
      subtitle={data ? `${data.customer || ''} · ${formatCurrency(data.total)}` : ''}
    >
      <AsyncState loading={loading} error={error} empty={!loading && !error && !data} onRetry={reload}>
        {data ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Customer" value={data.customer || '—'} tone="info" />
              <StatCard label="Technician" value={data.assignedTo || '—'} />
              <StatCard label="Status" value={data.status || '—'} />
              <StatCard label="Type" value={data.invoiceType || '—'} />
              <StatCard label="Invoice date" value={data.invoiceDate ? formatDateShort(data.invoiceDate) : '—'} />
              <StatCard label="Completed" value={data.dateCompleted ? formatDateShort(data.dateCompleted) : '—'} />
              <StatCard label="Arrival" value={data.arrivalTime || '—'} />
              <StatCard label="Departure" value={data.departureTime || '—'} />
              <StatCard label="Elapsed" value={data.elapsedTime || '—'} />
              <StatCard label="Subtotal" value={formatCurrency(data.subtotal)} />
              <StatCard label="Tax" value={formatCurrency(data.tax)} />
              <StatCard label="Total" value={formatCurrency(data.total)} tone="success" />
            </StatGrid>
            <DataTable title={`Items (${(data.lineItems || []).length})`} columns={lineColumns} rows={data.lineItems || []} />
          </>
        ) : null}
      </AsyncState>
    </DetailModal>
  );
}
