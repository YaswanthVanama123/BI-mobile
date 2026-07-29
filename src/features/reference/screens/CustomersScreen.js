import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import useApi from '@/hooks/useApi';
import useDebounce from '@/hooks/useDebounce';
import biService from '@/api/biService';
import {
  Screen, PageHeader, SearchInput, AsyncState, DataTable, Pager,
  Badge, Card, DetailModal, SectionTitle, Muted, StatGrid, StatCard,
} from '@/components';
import theme from '@/theme';
import { statusTone, formatNumber, formatCurrency } from '@/utils/format';
import InvoiceLinesModal from '@/features/revenue/components/InvoiceLinesModal';

const PAGE_SIZE = 25;

const columns = [
  { key: 'customerName', header: 'Customer', width: 190 },
  { key: 'routeStarCustomerId', header: 'RouteStar ID', width: 130 },
  { key: 'routeStarAccountNumber', header: 'Account #', width: 120, render: (r) => (r.routeStarAccountNumber || '—') },
  { key: 'routeCode', header: 'Route', width: 90 },
  { key: 'frequency', header: 'Frequency', width: 120 },
  { key: 'customerStatus', header: 'Status', width: 110, render: (r) => <Badge tone={statusTone(r.customerStatus)}>{r.customerStatus}</Badge> },
];

const pricingColumns = [
  { key: 'item', header: 'Item', width: 140 },
  { key: 'description', header: 'Description', width: 200 },
  { key: 'salesPrice', header: 'Price', align: 'right', width: 100, render: (r) => (r.salesPrice != null ? `$${formatNumber(r.salesPrice)}` : '—') },
  { key: 'defaultQty', header: 'Qty', align: 'right', width: 70, render: (r) => r.defaultQty || '—' },
  { key: 'frequency', header: 'Frequency', width: 120, render: (r) => r.frequency || '—' },
];
const invoiceColumns = [
  { key: 'invoiceNumber', header: 'Invoice #', width: 110 },
  { key: 'date', header: 'Date', width: 100 },
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

const addrLine = (a) => [a && a.line1, a && a.line2, a && a.line3].filter(Boolean).join(', ');
const cityLine = (a) => [a && a.city, a && a.state, a && a.zip].filter(Boolean).join(', ');

const ROUTE_PREFERRED = ['Route', 'Frequency', 'Day', 'Date', 'Assigned To', 'Stop', 'Category', 'StartTime', 'Budget (mins).', 'Drive Time (mins).', 'Account #', 'Notes'];
function routeColumns(routes) {
  const keys = new Set();
  routes.forEach((r) => Object.keys(r).forEach((k) => { if (r[k] != null && String(r[k]).trim() !== '') keys.add(k); }));
  const ordered = [...ROUTE_PREFERRED.filter((k) => keys.has(k)), ...[...keys].filter((k) => !ROUTE_PREFERRED.includes(k))];
  return ordered.map((k) => ({ key: k, header: k.replace(/\.$/, ''), width: 140, render: (r) => (r[k] != null && r[k] !== '' ? String(r[k]) : '—') }));
}

function TabBtn({ active, onPress, children }) {
  return (
    <TouchableOpacity onPress={onPress} style={[tabStyles.tab, active && tabStyles.tabActive]} activeOpacity={0.7}>
      <Text style={[tabStyles.tabText, active && tabStyles.tabTextActive]}>{children}</Text>
    </TouchableOpacity>
  );
}

function CustomerDetailModal({ customerId, onClose }) {
  const { data, loading, error, reload } = useApi(() => biService.customerAccount(customerId), [customerId]);
  const drill = useApi(() => biService.revenueDrill({ customerId }), [customerId]);
  const [tab, setTab] = useState('invoices');
  const [invoice, setInvoice] = useState(null);
  const invoices = (drill.data && drill.data.invoices) || [];
  const items = (drill.data && drill.data.items) || [];
  const dk = drill.data && drill.data.kpis;
  return (
    <DetailModal visible={!!customerId} onClose={onClose} title={(data && data.customerName) || 'Customer detail'}>
      <AsyncState loading={loading} error={error} empty={!loading && !error && !data} onRetry={reload}>
        {data ? (
          <View style={{ gap: 14 }}>
            <View style={styles.pairRow}>
              <View style={styles.pair}>
                <Text style={styles.fieldLabel}>Account #</Text>
                <Text style={styles.fieldValue}>{data.accountNumber || '—'}</Text>
              </View>
              <View style={styles.pair}>
                <Text style={styles.fieldLabel}>RouteStar ID</Text>
                <Text style={styles.fieldValue}>{data.customerId}</Text>
              </View>
            </View>

            <Card>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Service address</Text>
              </View>
              <Text style={styles.addr}>{addrLine(data.service) || '—'}</Text>
              <Muted>{cityLine(data.service)}</Muted>
              {data.service && data.service.latitude != null ? (
                <Text style={styles.latlng}>lat {data.service.latitude}, lng {data.service.longitude}{data.service.zone ? ` · zone ${data.service.zone}` : ''}</Text>
              ) : null}
            </Card>

            <Card>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Billing address</Text>
              </View>
              <Text style={styles.addr}>{addrLine(data.billing) || '—'}</Text>
              <Muted>{cityLine(data.billing)}</Muted>
            </Card>

            {dk ? (
              <StatGrid columns={3}>
                <StatCard label="Invoiced" value={formatCurrency(dk.invoiced)} tone="success" />
                <StatCard label="Invoices" value={formatNumber(dk.stops)} />
                <StatCard label="Items" value={formatNumber(dk.items)} />
              </StatGrid>
            ) : null}

            <View style={tabStyles.row}>
              <TabBtn active={tab === 'invoices'} onPress={() => setTab('invoices')}>Invoices ({invoices.length})</TabBtn>
              <TabBtn active={tab === 'items'} onPress={() => setTab('items')}>Items ({items.length})</TabBtn>
              <TabBtn active={tab === 'routes'} onPress={() => setTab('routes')}>Routes ({(data.routes && data.routes.length) || 0})</TabBtn>
              <TabBtn active={tab === 'pricing'} onPress={() => setTab('pricing')}>Pricing ({(data.pricing && data.pricing.length) || 0})</TabBtn>
            </View>

            {tab === 'invoices' ? (
              drill.loading ? <Muted>Loading invoices…</Muted>
                : invoices.length ? <DataTable columns={invoiceColumns} rows={invoices} maxRows={500} onRowClick={(r) => setInvoice(r.invoiceNumber)} />
                : <Muted>No invoices created for this customer.</Muted>
            ) : null}
            {tab === 'items' ? (
              drill.loading ? <Muted>Loading items…</Muted>
                : items.length ? <DataTable columns={itemColumns} rows={items} maxRows={500} />
                : <Muted>No invoiced items for this customer.</Muted>
            ) : null}
            {tab === 'routes' ? (
              data.routes && data.routes.length
                ? <DataTable columns={routeColumns(data.routes)} rows={data.routes} maxRows={500} />
                : <Muted>No routes for this customer.</Muted>
            ) : null}
            {tab === 'pricing' ? (
              data.pricing && data.pricing.length
                ? <DataTable columns={pricingColumns} rows={data.pricing} maxRows={500} />
                : <Muted>No pricing captured yet — run Sync to fetch it.</Muted>
            ) : null}

            <Muted>Source: {data.source}{data.fetchedAt ? ` · fetched ${new Date(data.fetchedAt).toLocaleString()}` : ''}</Muted>
          </View>
        ) : null}
      </AsyncState>
      {invoice ? <InvoiceLinesModal invoiceNumber={invoice} onClose={() => setInvoice(null)} /> : null}
    </DetailModal>
  );
}

export default function CustomersScreen() {
  const [q, setQ] = useState('');
  const dq = useDebounce(q, 400);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [job, setJob] = useState(null);
  const pollRef = useRef(null);
  const running = !!(job && job.running);
  useEffect(() => { setPage(1); }, [dq]);

  const { data, page: pageInfo, meta, loading, error, reload } = useApi(
    () => biService.customers({ q: dq || undefined, page, pageSize: PAGE_SIZE }),
    [dq, page],
  );
  const rows = data || [];
  const total = (pageInfo && pageInfo.total) || (meta && meta.total) || 0;
  const totalPages = (pageInfo && pageInfo.totalPages) || 1;

  const fetchStatus = useCallback(async () => {
    try { const res = await biService.customerAccountSyncStatus(); setJob((res && res.data) || null); return (res && res.data) || null; }
    catch { return null; }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  useEffect(() => {
    if (!running) return undefined;
    pollRef.current = setInterval(async () => {
      const j = await fetchStatus();
      if (j && !j.running) { clearInterval(pollRef.current); reload(); }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [running, fetchStatus, reload]);

  const onSync = async () => {
    try {
      const res = await biService.syncCustomerAccounts();
      setJob((res && res.data && res.data.job) || { running: true, phase: 'fetching' });
    } catch (e) {
      setJob({ running: false, phase: 'error', error: (e && e.message) || 'could not start' });
    }
  };

  const msg = job && (job.phase === 'fetching'
    ? `Syncing account numbers in the background… ${formatNumber(job.stored || 0)}/${formatNumber(job.total || 0)} done. You can leave this screen.`
    : job.phase === 'done' ? `Sync complete: ${formatNumber(job.stored || 0)} customers updated (${formatNumber(job.withAccount || 0)} with an account #).`
    : job.phase === 'error' ? `Sync failed: ${job.error || 'error'}` : null);

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Customers" subtitle="Keyed on stable RouteStar IDs — never on display name. Tap a row for service address + pricing." />

      <TouchableOpacity style={[styles.syncBtn, running && styles.syncBtnDisabled]} disabled={running} onPress={onSync} activeOpacity={0.7}>
        {running ? <ActivityIndicator size="small" color="#fff" /> : null}
        <Text style={styles.syncText}>{running ? 'Syncing…' : 'Sync account numbers'}</Text>
      </TouchableOpacity>

      <View style={{ marginBottom: 12 }}>
        <SearchInput value={q} onChangeText={setQ} placeholder="Search name / account # / RouteStar ID…" />
      </View>

      {msg ? (
        <Card style={{ marginBottom: 12 }}>
          <View style={styles.msgRow}>
            {running ? <ActivityIndicator size="small" color={theme.colors.primary[600]} /> : null}
            <Text style={styles.msgText}>{msg}</Text>
          </View>
        </Card>
      ) : null}

      <AsyncState loading={loading} error={error} empty={!loading && !error && rows.length === 0} onRetry={reload}>
        {rows.length ? (
          <>
            <DataTable title="Customers" columns={columns} rows={rows} paginated={false} onRowClick={(r) => setSelected(r.routeStarCustomerId)} />
            <Pager page={page} totalPages={totalPages} total={total} loading={loading} onPrev={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(totalPages, p + 1))} />
          </>
        ) : null}
      </AsyncState>

      {selected ? <CustomerDetailModal customerId={selected} onClose={() => setSelected(null)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  syncBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.primary[600], borderRadius: 8, paddingVertical: 12, marginBottom: 12 },
  syncBtnDisabled: { opacity: 0.6 },
  syncText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  msgText: { flex: 1, fontSize: 12.5, color: theme.colors.dark[600] },
  pairRow: { flexDirection: 'row', gap: 12 },
  pair: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.dark[500], textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 },
  fieldValue: { fontSize: 14, color: theme.text },
  cardHead: { marginBottom: 6 },
  cardHeadText: { fontSize: 13.5, fontWeight: '700', color: theme.colors.dark[700] },
  addr: { fontSize: 14, color: theme.colors.dark[700] },
  latlng: { fontSize: 11.5, color: theme.textFaint, marginTop: 4 },
});

const tabStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.card, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
  tabActive: { backgroundColor: theme.colors.dark[800], borderColor: theme.colors.dark[800] },
  tabText: { fontSize: 12.5, color: theme.colors.dark[600], fontWeight: '600' },
  tabTextActive: { color: '#fff' },
});
