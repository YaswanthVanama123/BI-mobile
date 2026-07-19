import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, Select, AsyncState, DataTable,
  StatGrid, StatCard, Badge, Card, Muted,
} from '@/components';
import theme from '@/theme';
import { formatMinutes, formatNumber, formatDateShort, statusTone } from '@/utils/format';

const PAGE_SIZE = 25;
const STATUS_OPTIONS = ['all', 'synced', 'pending', 'ok', 'same_location', 'missing_coords', 'mapbox_failed'];

const columns = [
  { key: 'fromCompany', header: 'From company', width: 170 },
  { key: 'toCompany', header: 'To company', width: 170 },
  { key: 'distanceMiles', header: 'Distance (mi)', align: 'right', width: 110, render: (r) => (r.distanceMiles != null ? formatNumber(r.distanceMiles) : '—') },
  { key: 'drivingMinutes', header: 'Driving time', align: 'right', width: 110, render: (r) => (r.drivingMinutes != null ? formatMinutes(r.drivingMinutes) : 'null') },
  { key: 'status', header: 'Status', width: 130, render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  { key: 'syncedAt', header: 'Synced', width: 120, render: (r) => (r.syncedAt ? formatDateShort(r.syncedAt) : '—') },
];

function jobMessage(job) {
  if (!job) return null;
  if (job.phase === 'discovering') return 'Sync running in background: discovering company pairs…';
  if (job.phase === 'syncing') return `Sync running in background: ${formatNumber(job.synced || 0)} driving times computed, ${job.remaining != null ? formatNumber(job.remaining) : '…'} still pending. You can leave this screen — it keeps running.`;
  if (job.phase === 'error') return `Sync failed: ${job.error || 'error'}`;
  if (job.phase === 'done') return `Sync complete: ${formatNumber(job.synced || 0)} driving times computed${job.failed ? `, ${formatNumber(job.failed)} could not be resolved` : ''}.`;
  return null;
}

export default function CompanyDistancesScreen() {
  const [status, setStatus] = useState('all');
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [page, setPage] = useState(1);
  const [job, setJob] = useState(null);
  const pollRef = useRef(null);

  const running = !!(job && job.running);

  const opts = useApi(() => biService.companyDistanceOptions(), []);
  const fromOptions = useMemo(() => [{ value: '', label: 'All companies' }, ...(((opts.data && opts.data.from) || []).map((o) => ({ value: o.id, label: o.name })))], [opts.data]);
  const toOptions = useMemo(() => [{ value: '', label: 'All destinations' }, ...(((opts.data && opts.data.to) || []).map((o) => ({ value: o.id, label: o.name })))], [opts.data]);

  const { data, meta, page: pageMeta, loading, error, reload } = useApi(
    () => biService.companyDistances({ status, from: fromId, to: toId, page, pageSize: PAGE_SIZE }),
    [status, fromId, toId, page],
  );

  const fetchStatus = useCallback(async () => {
    try { const res = await biService.companyDistanceSyncStatus(); setJob((res && res.data) || null); return (res && res.data) || null; }
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
      const res = await biService.syncCompanyDistances();
      setJob((res && res.data && res.data.job) || { running: true, phase: 'discovering' });
    } catch (e) {
      setJob({ running: false, phase: 'error', error: (e && e.message) || 'could not start' });
    }
  };

  const totalPages = (pageMeta && pageMeta.totalPages) || 1;
  const filtered = (pageMeta && pageMeta.total) || 0;
  const msg = jobMessage(job);
  const rows = data || [];

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Distances / Driving Time" subtitle="RouteStar from→to company pairs. Distance is from RouteStar; driving time is null until you Sync. Sync runs in the background and computes only the pairs still pending." />

      <TouchableOpacity style={[styles.syncBtn, running && styles.syncBtnDisabled]} disabled={running} onPress={onSync} activeOpacity={0.7}>
        {running ? <ActivityIndicator size="small" color="#fff" /> : null}
        <Text style={styles.syncText}>{running ? 'Syncing…' : 'Sync with Mapbox'}</Text>
      </TouchableOpacity>

      {meta ? (
        <StatGrid columns={2}>
          <StatCard label="Total pairs" value={formatNumber(meta.total)} tone="info" />
          <StatCard label="Synced" value={formatNumber(meta.synced)} tone="success" />
          <StatCard label="Pending (null)" value={formatNumber(meta.pending)} tone={meta.pending ? 'warning' : 'success'} />
        </StatGrid>
      ) : null}

      {msg ? (
        <Card>
          <View style={styles.msgRow}>
            {running ? <ActivityIndicator size="small" color={theme.colors.primary[600]} /> : null}
            <Text style={styles.msgText}>{msg}</Text>
          </View>
        </Card>
      ) : null}

      <FilterBar>
        <Select label="Status" value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={STATUS_OPTIONS.map((s) => ({ value: s, label: s === 'synced' ? 'synced (has driving time)' : s }))} />
        <Select label="From company" value={fromId} onChange={(v) => { setFromId(v); setPage(1); }} options={fromOptions} placeholder="All companies" />
        <Select label="Destination company" value={toId} onChange={(v) => { setToId(v); setPage(1); }} options={toOptions} placeholder="All destinations" />
      </FilterBar>

      <AsyncState loading={loading} error={error} empty={!loading && !error && rows.length === 0} onRetry={reload}>
        {rows.length ? (
          <>
            <DataTable title="Company distances" columns={columns} rows={rows} paginated={false} maxRows={PAGE_SIZE} />
            <View style={styles.pager}>
              <Text style={styles.pagerText}>{filtered === 0 ? 'No matching pairs' : `Page ${page} of ${totalPages} · ${formatNumber(filtered)} pairs`}</Text>
              <View style={styles.pagerBtns}>
                <TouchableOpacity style={[styles.pageBtn, (page <= 1 || loading) && styles.pageBtnDisabled]} disabled={page <= 1 || loading} onPress={() => setPage((p) => Math.max(1, p - 1))} activeOpacity={0.7}>
                  <Text style={styles.pageBtnText}>‹ Prev</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.pageBtn, (page >= totalPages || loading) && styles.pageBtnDisabled]} disabled={page >= totalPages || loading} onPress={() => setPage((p) => Math.min(totalPages, p + 1))} activeOpacity={0.7}>
                  <Text style={styles.pageBtnText}>Next ›</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <Muted>No matching pairs</Muted>
        )}
      </AsyncState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  syncBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.primary[600], borderRadius: 8, paddingVertical: 12, marginBottom: 14 },
  syncBtnDisabled: { opacity: 0.6 },
  syncText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  msgText: { flex: 1, fontSize: 12.5, color: theme.colors.dark[600] },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  pagerText: { fontSize: 12, color: theme.textMuted, flex: 1 },
  pagerBtns: { flexDirection: 'row', gap: 8 },
  pageBtn: { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: theme.card },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { fontSize: 13, fontWeight: '600', color: theme.text },
});
