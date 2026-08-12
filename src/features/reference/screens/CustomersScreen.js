import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, DateRangeFilter, AsyncState, DataTable, Pager,
  Badge, Card, DetailModal, SectionTitle, Muted, StatGrid, StatCard,
} from '@/components';
import theme from '@/theme';
import { statusTone, formatNumber, formatCurrency } from '@/utils/format';
import InvoiceLinesModal from '@/features/revenue/components/InvoiceLinesModal';
import FetchRowsModal from '@/features/reference/components/FetchRowsModal';

const PAGE_SIZE = 25;

const columns = [
  { key: 'customerName', header: 'Customer', width: 190 },
  { key: 'routeStarCustomerId', header: 'RouteStar ID', width: 130 },
  { key: 'routeStarAccountNumber', header: 'Account #', width: 120, render: (r) => (r.routeStarAccountNumber || '—') },
  { key: 'routeCode', header: 'Route', width: 90 },
  { key: 'frequency', header: 'Frequency', width: 120 },
  { key: 'customerStatus', header: 'Status', width: 110, render: (r) => <Badge tone={statusTone(r.customerStatus)}>{r.customerStatus}</Badge> },
  { key: 'createdDate', header: 'Created', width: 110, render: (r) => r.createdDate || '—' },
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
  { key: 'date', header: 'Completed', width: 100 },
  { key: 'checkIn', header: 'Check-in', width: 100, render: (r) => r.checkIn || '-' },
  { key: 'checkOut', header: 'Check-out', width: 100, render: (r) => r.checkOut || '-' },
  { key: 'lineCount', header: 'Items', align: 'right', width: 60, render: (r) => formatNumber(r.lineCount) },
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
  const [range, setRange] = useState({ preset: 'all_time', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [job, setJob] = useState(null);
  const [cdJob, setCdJob] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState(null);
  const [rowsOpen, setRowsOpen] = useState(false);
  const pollRef = useRef(null);
  const cdPollRef = useRef(null);
  const running = !!(job && job.running);
  const cdRunning = !!(cdJob && cdJob.running);
  const { from, to } = range;
  useEffect(() => { setPage(1); }, [q, from, to]);

  const { data, page: pageInfo, meta, loading, error, reload } = useApi(
    () => biService.customers({ q: q || undefined, from: from || undefined, to: to || undefined, page, pageSize: PAGE_SIZE }),
    [q, from, to, page],
  );
  const rows = data || [];
  const total = (pageInfo && pageInfo.total) || (meta && meta.total) || 0;
  const totalPages = (pageInfo && pageInfo.totalPages) || 1;

  const exportAll = async () => {
    const res = await biService.customers({ q: q || undefined, from: from || undefined, to: to || undefined, pageSize: 'all' });
    return (res && res.data) || [];
  };

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
      setJob((res && res.data && res.data.job) || { running: true, phase: 'discovering' });
    } catch (e) {
      setJob({ running: false, phase: 'error', error: (e && e.message) || 'could not start' });
    }
  };

  const onReFetchAll = () => {
    if (running || cdRunning) return;
    Alert.alert(
      'Re-fetch all customers?',
      'Re-fetches every customer from RouteStar (account #, pricing, routes, activity) to backfill older records. Runs in the background and never removes existing data.',
      [{ text: 'Cancel', style: 'cancel' }, {
        text: 'Re-fetch all',
        onPress: async () => {
          try {
            const res = await biService.syncCustomerAccounts({ all: true });
            setJob((res && res.data && res.data.job) || { running: true, phase: 'discovering' });
          } catch (e) {
            setJob({ running: false, phase: 'error', error: (e && e.message) || 'could not start' });
          }
        },
      }],
    );
  };

  const doDeleteAll = async () => {
    setDeleting(true); setDeleteMsg(null);
    try {
      const res = await biService.deleteAllCustomerAccounts();
      setDeleteMsg(`Deleted ${formatNumber((res && res.data && res.data.deleted) || 0)} fetched customer records.`);
      reload();
    } catch (e) {
      const m = (e && e.response && e.response.data && e.response.data.error && e.response.data.error.message) || (e && e.message) || 'error';
      setDeleteMsg(`Delete failed: ${m}`);
    } finally { setDeleting(false); }
  };

  const onDeleteAll = () => {
    if (running || cdRunning || deleting) return;
    Alert.alert(
      'Delete all customer data?',
      'Removes all fetched account #, service address, pricing, routes and activity from the BI database. This cannot be undone. RouteStar itself is not touched — you can re-fetch with "Fetch all data".',
      [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete all', style: 'destructive', onPress: doDeleteAll }],
    );
  };

  const msg = job && (job.phase === 'discovering'
    ? `Step 1 — checking all customers (create/update)… ${formatNumber(job.scanned || 0)} scanned, ${formatNumber(job.discovered || 0)} new.`
    : job.phase === 'fetching'
    ? `Step 2 — fetching details for customers without data… ${formatNumber(job.stored || 0)}/${formatNumber(job.total || 0)} done${job.discovered ? ` (${formatNumber(job.discovered)} new found)` : ''}. You can leave this screen.`
    : job.phase === 'done' ? `Fetch complete: ${formatNumber(job.stored || 0)} customers fetched${job.discovered ? `, ${formatNumber(job.discovered)} newly discovered` : ''} (${formatNumber(job.withAccount || 0)} with an account #).`
    : job.phase === 'error' ? `Fetch failed: ${job.error || 'error'}` : null);

  const fetchCdStatus = useCallback(async () => {
    try { const res = await biService.customerCreatedDatesSyncStatus(); setCdJob((res && res.data) || null); return (res && res.data) || null; }
    catch { return null; }
  }, []);
  useEffect(() => { fetchCdStatus(); }, [fetchCdStatus]);
  useEffect(() => {
    if (!cdRunning) return undefined;
    cdPollRef.current = setInterval(async () => {
      const j = await fetchCdStatus();
      if (j && !j.running) { clearInterval(cdPollRef.current); reload(); }
    }, 4000);
    return () => clearInterval(cdPollRef.current);
  }, [cdRunning, fetchCdStatus, reload]);

  const onFetchCreated = async () => {
    try {
      const res = await biService.syncCustomerCreatedDates();
      setCdJob((res && res.data && res.data.job) || { running: true, phase: 'fetching' });
    } catch (e) {
      setCdJob({ running: false, phase: 'error', error: (e && e.message) || 'could not start' });
    }
  };

  const cdMsg = cdJob && (cdJob.phase === 'fetching'
    ? `Fetching created dates in the background… ${formatNumber(cdJob.stored || 0)} stored / ${formatNumber(cdJob.scanned || 0)} scanned. You can leave this screen.`
    : cdJob.phase === 'done' ? `Created dates fetched: ${formatNumber(cdJob.stored || 0)} customers updated.`
    : cdJob.phase === 'error' ? `Created-date fetch failed: ${cdJob.error || 'error'}` : null);

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Customers" subtitle="Keyed on stable RouteStar IDs — never on display name. Tap a row for service address + pricing." />

      <View style={styles.btnRow}>
        <TouchableOpacity style={[styles.syncBtn, styles.syncBtnHalf, styles.syncBtnAlt, cdRunning && styles.syncBtnDisabled]} disabled={cdRunning} onPress={onFetchCreated} activeOpacity={0.7}>
          {cdRunning ? <ActivityIndicator size="small" color={theme.colors.primary[600]} /> : null}
          <Text style={styles.syncTextAlt}>{cdRunning ? 'Fetching…' : 'Fetch created dates'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.syncBtn, styles.syncBtnHalf, running && styles.syncBtnDisabled]} disabled={running} onPress={onSync} activeOpacity={0.7}>
          {running ? <ActivityIndicator size="small" color="#fff" /> : null}
          <Text style={styles.syncText}>{running ? 'Fetching…' : 'Fetch customer data'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.syncBtn, styles.syncBtnAlt, (running || cdRunning) && styles.syncBtnDisabled]} disabled={running || cdRunning} onPress={onReFetchAll} activeOpacity={0.7}>
        <Text style={styles.syncTextAlt}>Re-fetch all customers</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.syncBtn, styles.rowsBtn]} onPress={() => setRowsOpen(true)} activeOpacity={0.7}>
        <Text style={styles.rowsText}>View fetched rows</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.syncBtn, styles.deleteBtn, (deleting || running || cdRunning) && styles.syncBtnDisabled]} disabled={deleting || running || cdRunning} onPress={onDeleteAll} activeOpacity={0.7}>
        {deleting ? <ActivityIndicator size="small" color={theme.colors.danger ? theme.colors.danger[600] : '#dc2626'} /> : null}
        <Text style={styles.deleteText}>{deleting ? 'Deleting…' : 'Delete all fetched data'}</Text>
      </TouchableOpacity>

      <View style={{ marginBottom: 12, gap: 10 }}>
        <DateRangeFilter value={range} onChange={setRange} />
      </View>

      {msg ? (
        <Card style={{ marginBottom: 12 }}>
          <View style={styles.msgRow}>
            {running ? <ActivityIndicator size="small" color={theme.colors.primary[600]} /> : null}
            <Text style={styles.msgText}>{msg}</Text>
          </View>
        </Card>
      ) : null}
      {cdMsg ? (
        <Card style={{ marginBottom: 12 }}>
          <View style={styles.msgRow}>
            {cdRunning ? <ActivityIndicator size="small" color={theme.colors.primary[600]} /> : null}
            <Text style={styles.msgText}>{cdMsg}</Text>
          </View>
        </Card>
      ) : null}
      {deleteMsg ? (
        <Card style={{ marginBottom: 12 }}>
          <View style={styles.msgRow}>
            {deleting ? <ActivityIndicator size="small" color="#dc2626" /> : null}
            <Text style={styles.msgText}>{deleteMsg}</Text>
          </View>
        </Card>
      ) : null}

      <AsyncState loading={loading} error={error} hasData={rows.length > 0} onRetry={reload}>
        <>
          <DataTable title="Customers" columns={columns} rows={rows} paginated={false} onServerSearch={setQ} searchPlaceholder="Search name / account # / RouteStar ID…" onRowClick={(r) => setSelected(r.routeStarCustomerId)} onExportAll={exportAll} exportName="customers" />
          {totalPages > 1 ? (
            <Pager page={page} totalPages={totalPages} total={total} loading={loading} onPrev={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(totalPages, p + 1))} />
          ) : null}
        </>
      </AsyncState>

      {selected ? <CustomerDetailModal customerId={selected} onClose={() => setSelected(null)} /> : null}
      {rowsOpen ? <FetchRowsModal runId={job && job.runId} onClose={() => setRowsOpen(false)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  syncBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.primary[600], borderRadius: 8, paddingVertical: 12, marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 8 },
  syncBtnHalf: { flex: 1 },
  syncBtnAlt: { backgroundColor: theme.card, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.primary[600] },
  syncTextAlt: { color: theme.colors.primary[600], fontWeight: '700', fontSize: 13 },
  syncBtnDisabled: { opacity: 0.6 },
  syncText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  deleteBtn: { backgroundColor: theme.card, borderWidth: StyleSheet.hairlineWidth, borderColor: '#dc2626' },
  deleteText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },
  rowsBtn: { backgroundColor: theme.card, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
  rowsText: { color: theme.colors.dark[700], fontWeight: '700', fontSize: 13 },
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
