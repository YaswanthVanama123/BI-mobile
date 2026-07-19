import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import useApi from '@/hooks/useApi';
import useDebounce from '@/hooks/useDebounce';
import biService from '@/api/biService';
import {
  Screen, PageHeader, SearchInput, AsyncState, DataTable, Pager,
  Badge, Card, DetailModal, SectionTitle, Muted,
} from '@/components';
import theme from '@/theme';
import { statusTone, formatNumber } from '@/utils/format';

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

const addrLine = (a) => [a && a.line1, a && a.line2, a && a.line3].filter(Boolean).join(', ');
const cityLine = (a) => [a && a.city, a && a.state, a && a.zip].filter(Boolean).join(', ');

const ROUTE_PREFERRED = ['Route', 'Frequency', 'Day', 'Date', 'Assigned To', 'Stop', 'Category', 'StartTime', 'Budget (mins).', 'Drive Time (mins).', 'Account #', 'Notes'];
function routeColumns(routes) {
  const keys = new Set();
  routes.forEach((r) => Object.keys(r).forEach((k) => { if (r[k] != null && String(r[k]).trim() !== '') keys.add(k); }));
  const ordered = [...ROUTE_PREFERRED.filter((k) => keys.has(k)), ...[...keys].filter((k) => !ROUTE_PREFERRED.includes(k))];
  return ordered.map((k) => ({ key: k, header: k.replace(/\.$/, ''), width: 140, render: (r) => (r[k] != null && r[k] !== '' ? String(r[k]) : '—') }));
}

function CustomerDetailModal({ customerId, onClose }) {
  const { data, loading, error, reload } = useApi(() => biService.customerAccount(customerId), [customerId]);
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

            <View>
              <SectionTitle>Pricing ({(data.pricing && data.pricing.length) || 0})</SectionTitle>
              {data.pricing && data.pricing.length
                ? <DataTable columns={pricingColumns} rows={data.pricing} maxRows={500} />
                : <Muted>No pricing captured yet — run Sync to fetch it.</Muted>}
            </View>

            <View>
              <SectionTitle>Routes ({(data.routes && data.routes.length) || 0})</SectionTitle>
              {data.routes && data.routes.length
                ? <DataTable columns={routeColumns(data.routes)} rows={data.routes} maxRows={500} />
                : <Muted>No routes for this customer.</Muted>}
            </View>

            <Muted>Source: {data.source}{data.fetchedAt ? ` · fetched ${new Date(data.fetchedAt).toLocaleString()}` : ''}</Muted>
          </View>
        ) : null}
      </AsyncState>
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
