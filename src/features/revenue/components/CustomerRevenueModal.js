import React, { useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import { DetailModal, AsyncState, DataTable, StatGrid, StatCard, Badge, SectionTitle } from '@/components';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import InvoiceLinesModal from '@/features/revenue/components/InvoiceLinesModal';

const pctTone = (p) => (p == null ? 'neutral' : p >= 90 ? 'success' : p >= 50 ? 'warning' : 'danger');

const itemColumns = [
  { key: 'item', header: 'Item', width: 160 },
  { key: 'category', header: 'Category', width: 130 },
  { key: 'frequency', header: 'Frequency', width: 100, render: (r) => r.frequency || '—' },
  { key: 'expected', header: 'Expected', align: 'right', width: 100, render: (r) => formatCurrency(r.expected) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', width: 100, render: (r) => formatCurrency(r.invoiced) },
  { key: 'remaining', header: 'Remaining', align: 'right', width: 100, render: (r) => formatCurrency(r.remaining) },
];
const invoiceColumns = [
  { key: 'invoiceNumber', header: 'Invoice #', width: 110 },
  { key: 'date', header: 'Date', width: 100 },
  { key: 'route', header: 'Route', width: 80 },
  { key: 'lineCount', header: 'Lines', align: 'right', width: 60, render: (r) => formatNumber(r.lineCount) },
  { key: 'total', header: 'Total', align: 'right', width: 100, render: (r) => formatCurrency(r.total) },
];

export default function CustomerRevenueModal({ customerId, range, onClose }) {
  const { from, to } = range || {};
  const { data, loading, error, reload } = useApi(() => biService.revenueCustomerDetail(customerId, { from, to }), [customerId, from, to]);
  const [invoice, setInvoice] = useState(null);
  return (
    <DetailModal
      visible={!!customerId}
      onClose={onClose}
      title={(data && data.customer) || 'Customer'}
      subtitle={data ? `Route ${data.routeCode}` : ''}
    >
      <AsyncState loading={loading} error={error} empty={!loading && !error && !data} onRetry={reload}>
        {data ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Expected (yr)" value={formatCurrency(data.expected)} tone="info" />
              <StatCard label="Invoiced" value={formatCurrency(data.invoiced)} tone="success" />
              <StatCard label="Remaining" value={formatCurrency(data.remaining)} tone={data.remaining > 0 ? 'warning' : 'success'} />
              <StatCard label="Collected" value={data.pct != null ? formatPercent(data.pct) : '—'} tone={pctTone(data.pct)} />
            </StatGrid>
            <SectionTitle style={{ marginTop: 8 }}>Per item — expected vs invoiced vs remaining ({(data.items || []).length})</SectionTitle>
            <DataTable columns={itemColumns} rows={data.items || []} />
            <SectionTitle style={{ marginTop: 16 }}>Invoices ({(data.invoices || []).length}) — tap for line items</SectionTitle>
            <DataTable columns={invoiceColumns} rows={data.invoices || []} onRowClick={(r) => setInvoice(r.invoiceNumber)} />
          </>
        ) : null}
      </AsyncState>
      {invoice ? <InvoiceLinesModal invoiceNumber={invoice} onClose={() => setInvoice(null)} /> : null}
    </DetailModal>
  );
}
