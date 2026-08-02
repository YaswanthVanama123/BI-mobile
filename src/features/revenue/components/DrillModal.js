import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import { DetailModal, AsyncState, DataTable, StatGrid, StatCard } from '@/components';
import theme from '@/theme';
import { formatCurrency, formatNumber } from '@/utils/format';
import InvoiceLinesModal from '@/features/revenue/components/InvoiceLinesModal';

const customerColumns = [
  { key: 'customer', header: 'Customer', width: 180 },
  { key: 'invoiced', header: 'Invoiced', align: 'right', width: 110, render: (r) => formatCurrency(r.invoiced) },
  { key: 'stops', header: 'Stops', align: 'right', width: 70, render: (r) => formatNumber(r.stops) },
];
const invoiceColumns = [
  { key: 'invoiceNumber', header: 'Invoice #', width: 110 },
  { key: 'customer', header: 'Customer', width: 160 },
  { key: 'date', header: 'Completed', width: 100 },
  { key: 'lineCount', header: 'Lines', align: 'right', width: 60, render: (r) => formatNumber(r.lineCount) },
  { key: 'total', header: 'Total', align: 'right', width: 100, render: (r) => formatCurrency(r.total) },
];
const itemColumns = [
  { key: 'item', header: 'Item', width: 180 },
  { key: 'category', header: 'Category', width: 140 },
  { key: 'qty', header: 'Qty', align: 'right', width: 60, render: (r) => formatNumber(r.qty) },
  { key: 'lines', header: 'Lines', align: 'right', width: 60, render: (r) => formatNumber(r.lines) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', width: 100, render: (r) => formatCurrency(r.invoiced) },
];

function Tabs({ tabs, tab, onChange }) {
  return (
    <View style={styles.tabRow}>
      {tabs.map((it) => {
        const active = tab === it.v;
        return (
          <TouchableOpacity key={it.v} onPress={() => onChange(it.v)} style={[styles.tab, active && styles.tabActive]} activeOpacity={0.7}>
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function DrillModal({ title, subtitle, filter, range, onClose, defaultTab }) {
  const { from, to } = range || {};
  const showCustomers = !filter.customerId;
  const { data, loading, error, reload } = useApi(
    () => biService.revenueDrill({ ...filter, from, to }),
    [filter.routeCode, filter.customerId, filter.category, from, to],
  );
  const [tab, setTab] = useState(defaultTab || (showCustomers ? 'customers' : 'invoices'));
  const [drillCustomer, setDrillCustomer] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const k = data && data.kpis;
  const customers = (data && data.customers) || [];
  const invoices = (data && data.invoices) || [];
  const items = (data && data.items) || [];
  const resolvedTitle = title || (customers[0] && customers[0].customer) || 'Details';
  const hasFilter = !!(filter.routeCode || filter.customerId || filter.category);
  const tabs = [
    ...(showCustomers ? [{ v: 'customers', label: `Customers (${customers.length})` }] : []),
    { v: 'invoices', label: `Invoices (${invoices.length})` },
    { v: 'items', label: `Items (${items.length})` },
  ];

  return (
    <DetailModal visible={hasFilter} onClose={onClose} title={resolvedTitle} subtitle={subtitle || 'Invoiced work for the selected period'}>
      <AsyncState loading={loading} error={error} empty={!loading && !error && !k} onRetry={reload}>
        {k ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} tone="success" />
              <StatCard label="Stops" value={formatNumber(k.stops)} />
              {showCustomers ? <StatCard label="Customers" value={formatNumber(k.customers)} /> : null}
              <StatCard label="Items" value={formatNumber(k.items)} />
            </StatGrid>
            <Tabs tabs={tabs} tab={tab} onChange={setTab} />
            {tab === 'customers' ? (
              <DataTable columns={customerColumns} rows={customers} onRowClick={(r) => setDrillCustomer(r)} />
            ) : tab === 'invoices' ? (
              <DataTable columns={invoiceColumns} rows={invoices} onRowClick={(r) => setInvoice(r.invoiceNumber)} />
            ) : (
              <DataTable columns={itemColumns} rows={items} />
            )}
          </>
        ) : null}
      </AsyncState>
      {drillCustomer ? (
        <DrillModal
          title={drillCustomer.customer}
          subtitle={`${formatNumber(drillCustomer.stops)} stop(s) for the selected period`}
          filter={{ ...filter, customerId: drillCustomer.customerId }}
          range={range}
          onClose={() => setDrillCustomer(null)}
        />
      ) : null}
      {invoice ? <InvoiceLinesModal invoiceNumber={invoice} onClose={() => setInvoice(null)} /> : null}
    </DetailModal>
  );
}

const styles = StyleSheet.create({
  tabRow: { flexDirection: 'row', gap: 8, marginVertical: 4, flexWrap: 'wrap' },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.card, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
  tabActive: { backgroundColor: theme.colors.dark[800], borderColor: theme.colors.dark[800] },
  tabText: { fontSize: 12.5, color: theme.colors.dark[600], fontWeight: '600' },
  tabTextActive: { color: '#fff' },
});
