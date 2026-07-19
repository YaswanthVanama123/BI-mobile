import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, AsyncState, DataTable, Card, Badge, SectionTitle, Muted,
} from '@/components';
import theme from '@/theme';
import { statusTone } from '@/utils/format';

const dt = (v) => (v ? new Date(v).toLocaleString() : '—');
const dur = (ms) => {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
};
const summaryText = (s) => (s && typeof s === 'object' ? Object.entries(s).filter(([, v]) => v != null && v !== '').map(([kk, v]) => `${kk}: ${v}`).join(' · ') : '');

export default function SyncStatusScreen() {
  const { data, loading, error, reload } = useApi(() => biService.syncStatus({}), []);
  const pollRef = useRef(null);
  const running = (data && data.running) || [];
  const history = (data && data.history) || [];
  const watermarks = (data && data.watermarks) || [];

  useEffect(() => {
    if (!running.length) { if (pollRef.current) clearInterval(pollRef.current); return undefined; }
    pollRef.current = setInterval(() => reload(), 5000);
    return () => clearInterval(pollRef.current);
  }, [running.length, reload]);

  const historyColumns = [
    { key: 'label', header: 'Sync', width: 160 },
    { key: 'status', header: 'Status', width: 110, render: (r) => <Badge tone={statusTone(r.status === 'done' ? 'ok' : r.status)}>{r.status}</Badge> },
    { key: 'startedAt', header: 'Started', width: 170, render: (r) => dt(r.startedAt) },
    { key: 'finishedAt', header: 'Finished', width: 170, render: (r) => dt(r.finishedAt) },
    { key: 'durationMs', header: 'Duration', align: 'right', width: 100, render: (r) => dur(r.durationMs) },
    { key: 'summary', header: 'Result', width: 240, render: (r) => (r.error ? <Text style={styles.errText}>{r.error}</Text> : <Text style={styles.resultText}>{summaryText(r.summary)}</Text>) },
  ];

  const watermarkColumns = [
    { key: 'type', header: 'Sync', width: 160, render: (r) => r.type || r.label || r.key || '—' },
    { key: 'watermark', header: 'Watermark', width: 200, render: (r) => (r.watermark != null ? dt(r.watermark) : (r.value != null ? String(r.value) : '—')) },
    { key: 'updatedAt', header: 'Updated', width: 170, render: (r) => dt(r.updatedAt) },
  ];

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Sync Status" subtitle="Background sync jobs — what's running now and the recent run history. Pull to refresh." />
      <AsyncState loading={loading} error={error} empty={!loading && !error && !data} onRetry={reload}>
        {data ? (
          <View style={{ gap: 18 }}>
            <View>
              <SectionTitle>In progress</SectionTitle>
              {running.length ? (
                <View style={{ gap: 12 }}>
                  {running.map((j) => (
                    <Card key={j.type}>
                      <View style={styles.jobHead}>
                        <View style={styles.jobTitleRow}>
                          <ActivityIndicator size="small" color={theme.colors.primary[600]} />
                          <Text style={styles.jobTitle}>{j.label}</Text>
                        </View>
                        <Badge tone="info">{j.phase}</Badge>
                      </View>
                      {summaryText(j.progress) ? <Text style={styles.jobProgress}>{summaryText(j.progress)}</Text> : null}
                      <Muted style={{ marginTop: 4 }}>started {dt(j.startedAt)}</Muted>
                    </Card>
                  ))}
                </View>
              ) : (
                <Card><Muted>No sync running right now.</Muted></Card>
              )}
            </View>

            <View>
              <SectionTitle>Run history</SectionTitle>
              {history.length ? (
                <DataTable columns={historyColumns} rows={history} maxRows={500} keyExtractor={(r, i) => r._id || i} />
              ) : (
                <Card><Muted>No sync runs recorded yet — trigger a Sync (Customers or Distances) and it will appear here.</Muted></Card>
              )}
            </View>

            {watermarks.length ? (
              <View>
                <SectionTitle>Watermarks</SectionTitle>
                <DataTable columns={watermarkColumns} rows={watermarks} maxRows={500} keyExtractor={(r, i) => r.type || r.key || i} />
              </View>
            ) : null}
          </View>
        ) : null}
      </AsyncState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  jobHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  jobTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  jobTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.dark[800], flexShrink: 1 },
  jobProgress: { fontSize: 13, color: theme.colors.dark[600], marginTop: 8 },
  errText: { fontSize: 12.5, color: theme.colors.danger[600] },
  resultText: { fontSize: 12.5, color: theme.colors.dark[600] },
});
