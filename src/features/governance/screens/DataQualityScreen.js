import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, Select, AsyncState, DataTable,
  Badge, DetailModal, SectionTitle, Muted,
} from '@/components';
import theme from '@/theme';
import { severityTone, formatDateShort, statusTone } from '@/utils/format';

const SEVERITIES = ['all', 'critical', 'error', 'warning', 'info'];
const STATUSES = ['all', 'open', 'acknowledged', 'resolved', 'ignored'];

function IssueDetailModal({ issue, resolved, onResolve, onClose }) {
  const [busy, setBusy] = useState(false);
  const isResolved = resolved[issue._id] || issue.resolutionStatus === 'resolved';
  const doResolve = async () => {
    setBusy(true);
    try {
      await onResolve(issue._id);
      onClose();
    } catch (e) {
      Alert.alert('Resolve failed', (e && e.message) || 'Could not resolve issue.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <DetailModal visible={!!issue} onClose={onClose} title={issue.issueType || 'Issue'} subtitle={issue.collectionName}>
      <View style={{ gap: 12 }}>
        <View style={styles.row}>
          <Text style={styles.fieldLabel}>Severity</Text>
          <Badge tone={severityTone(issue.severity)}>{issue.severity}</Badge>
        </View>
        <View style={styles.row}>
          <Text style={styles.fieldLabel}>Status</Text>
          <Badge tone={isResolved ? 'success' : statusTone(issue.resolutionStatus)}>{isResolved ? 'resolved' : issue.resolutionStatus}</Badge>
        </View>
        <View>
          <Text style={styles.fieldLabel}>Description</Text>
          <Text style={styles.value}>{issue.description || '—'}</Text>
        </View>
        <View>
          <Text style={styles.fieldLabel}>Detected</Text>
          <Text style={styles.value}>{formatDateShort(issue.detectedAt)}</Text>
        </View>
        {isResolved ? (
          <Muted>This issue is resolved.</Muted>
        ) : (
          <TouchableOpacity style={[styles.resolveBtn, busy && styles.btnDisabled]} disabled={busy} onPress={doResolve} activeOpacity={0.7}>
            <Text style={styles.resolveText}>{busy ? 'Resolving…' : 'Resolve'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </DetailModal>
  );
}

export default function DataQualityScreen() {
  const [severity, setSeverity] = useState('all');
  const [status, setStatus] = useState('open');
  const [resolved, setResolved] = useState({});
  const [selected, setSelected] = useState(null);

  const params = { ...(severity !== 'all' && { severity }), ...(status !== 'all' && { resolutionStatus: status }) };
  const { data, loading, error, reload } = useApi(() => biService.dataQualityIssues(params), [severity, status]);
  const rows = data || [];

  const resolve = async (id) => {
    await biService.resolveDataQualityIssue(id, { resolutionStatus: 'resolved', resolvedBy: 'ui', resolutionNotes: 'Resolved from dashboard' });
    setResolved((r) => ({ ...r, [id]: true }));
  };

  const columns = [
    { key: 'severity', header: 'Severity', width: 100, render: (r) => <Badge tone={severityTone(r.severity)}>{r.severity}</Badge> },
    { key: 'issueType', header: 'Type', width: 160 },
    { key: 'collectionName', header: 'Collection', width: 150 },
    { key: 'description', header: 'Description', width: 240 },
    { key: 'detectedAt', header: 'Detected', width: 120, render: (r) => formatDateShort(r.detectedAt) },
    { key: 'resolutionStatus', header: 'Status', width: 120, render: (r) => <Badge tone={resolved[r._id] ? 'success' : statusTone(r.resolutionStatus)}>{resolved[r._id] ? 'resolved' : r.resolutionStatus}</Badge> },
  ];

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Data Quality" subtitle="Automated checks & reconciliation issues — tap a row to resolve." />
      <FilterBar>
        <Select label="Severity" value={severity} onChange={setSeverity} options={SEVERITIES.map((s) => ({ value: s, label: s === 'all' ? 'All severities' : s }))} />
        <Select label="Status" value={status} onChange={setStatus} options={STATUSES.map((s) => ({ value: s, label: s === 'all' ? 'All statuses' : s }))} />
      </FilterBar>
      <AsyncState loading={loading} error={error} empty={!loading && !error && rows.length === 0} onRetry={reload}>
        {rows.length ? (
          <DataTable title="Issues" columns={columns} rows={rows} maxRows={500} keyExtractor={(r, i) => r._id || i} onRowClick={(r) => setSelected(r)} />
        ) : null}
      </AsyncState>
      {selected ? <IssueDetailModal issue={selected} resolved={resolved} onResolve={async (id) => { await resolve(id); reload(); }} onClose={() => setSelected(null)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.dark[500], textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 },
  value: { fontSize: 14, color: theme.colors.dark[700] },
  resolveBtn: { backgroundColor: theme.colors.primary[600], borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  btnDisabled: { opacity: 0.6 },
  resolveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
