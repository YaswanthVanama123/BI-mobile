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
              <StatCard label="Technician" value={data.assignedTo || '—'} tone="info" />
              <StatCard label="Completed" value={data.dateCompleted ? formatDateShort(data.dateCompleted) : '—'} />
              <StatCard label="Subtotal" value={formatCurrency(data.subtotal)} />
              <StatCard label="Total" value={formatCurrency(data.total)} tone="success" />
            </StatGrid>
            <DataTable title={`Line items (${(data.lineItems || []).length})`} columns={lineColumns} rows={data.lineItems || []} />
          </>
        ) : null}
      </AsyncState>
    </DetailModal>
  );
}
