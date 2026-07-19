import React, { useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import { DetailModal, AsyncState, DataTable, StatGrid, StatCard, Badge } from '@/components';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import CustomerRevenueModal from '@/features/revenue/components/CustomerRevenueModal';

const pctTone = (p) => (p == null ? 'neutral' : p >= 90 ? 'success' : p >= 50 ? 'warning' : 'danger');

const customerColumns = [
  { key: 'customer', header: 'Customer', width: 170 },
  { key: 'expected', header: 'Expected', align: 'right', width: 100, render: (r) => formatCurrency(r.expected) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', width: 100, render: (r) => formatCurrency(r.invoiced) },
  { key: 'remaining', header: 'Remaining', align: 'right', width: 100, render: (r) => formatCurrency(r.remaining) },
  { key: 'pct', header: 'Collected', align: 'right', width: 90, render: (r) => (r.pct != null ? <Badge tone={pctTone(r.pct)}>{formatPercent(r.pct)}</Badge> : '—') },
  { key: 'invoices', header: 'Stops', align: 'right', width: 60, render: (r) => formatNumber(r.invoices) },
];

export default function RouteRevenueModal({ routeCode, range, onClose }) {
  const { from, to } = range || {};
  const { data, loading, error, reload } = useApi(() => biService.revenueByCustomer({ from, to, routeCode }), [routeCode, from, to]);
  const [customer, setCustomer] = useState(null);
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  return (
    <DetailModal
      visible={!!routeCode}
      onClose={onClose}
      title={`Route ${routeCode}`}
      subtitle="Customers on this route — tap for items & invoices"
    >
      <AsyncState loading={loading} error={error} empty={!loading && !error && !k} onRetry={reload}>
        {k ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Expected (yr)" value={formatCurrency(k.expected)} tone="info" />
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} tone="success" />
              <StatCard label="Remaining" value={formatCurrency(k.remaining)} tone={k.remaining > 0 ? 'warning' : 'success'} />
              <StatCard label="Customers" value={formatNumber(k.customers)} />
            </StatGrid>
            <DataTable columns={customerColumns} rows={rows} onRowClick={(r) => setCustomer(r.customerId)} />
          </>
        ) : null}
      </AsyncState>
      {customer ? <CustomerRevenueModal customerId={customer} range={range} onClose={() => setCustomer(null)} /> : null}
    </DetailModal>
  );
}
