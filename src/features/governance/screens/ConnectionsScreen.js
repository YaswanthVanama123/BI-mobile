import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, AsyncState, Card, Badge, Muted,
} from '@/components';
import theme from '@/theme';
import { formatNumber } from '@/utils/format';

function SourceCard({ s }) {
  const ok = s.connected;
  return (
    <Card style={{ marginBottom: 12 }}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{s.label}</Text>
          <Text style={styles.role}>{s.role}</Text>
        </View>
        <Badge tone={ok ? 'success' : 'danger'}>{ok ? 'Connected' : 'Not connected'}</Badge>
      </View>

      <View style={styles.dl}>
        <Row k="Cluster" v={s.cluster} />
        <Row k="Database" v={s.db} />
        <Row k="Configured" v={s.configured ? 'yes' : 'no'} />
        {s.readyState ? <Row k="State" v={s.readyState} /> : null}
      </View>

      {s.collections ? (
        <View style={{ marginTop: 12 }}>
          <Text style={styles.fieldLabel}>Collections (live counts)</Text>
          <View style={{ marginTop: 4 }}>
            {Object.entries(s.collections).map(([name, n]) => (
              <View key={name} style={styles.collRow}>
                <Text style={styles.collName}>{name}</Text>
                <Text style={styles.collNum}>{n == null ? '—' : formatNumber(n)}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {s.error ? (
        <View style={styles.errBox}>
          <Text style={styles.errText}>{s.error}</Text>
        </View>
      ) : null}
    </Card>
  );
}

function Row({ k, v }) {
  return (
    <View style={styles.dlRow}>
      <Text style={styles.dt}>{k}</Text>
      <Text style={styles.dd} numberOfLines={1}>{v}</Text>
    </View>
  );
}

export default function ConnectionsScreen() {
  const { data, meta, loading, error, reload } = useApi(() => biService.connections(), []);
  const rows = data || [];
  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Data Connections" subtitle="Live status of every database the BI platform reads: the inventory / RouteStar source and the EnviroMaster server (mapdistance) source. Green means the API connected and can read that DB." />
      {meta && meta.generatedAt ? <Muted style={{ marginBottom: 12 }}>Checked {new Date(meta.generatedAt).toLocaleString()}</Muted> : null}
      <AsyncState loading={loading} error={error} empty={!loading && !error && rows.length === 0} onRetry={reload}>
        {rows.length ? (
          <View>
            {rows.map((s) => <SourceCard key={s.key} s={s} />)}
          </View>
        ) : null}
      </AsyncState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  label: { fontSize: 15, fontWeight: '700', color: theme.colors.dark[800] },
  role: { fontSize: 11.5, color: theme.textFaint, marginTop: 2 },
  dl: { marginTop: 14, gap: 6 },
  dlRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  dt: { fontSize: 13, color: theme.textFaint },
  dd: { fontSize: 13, color: theme.colors.dark[700], flexShrink: 1, textAlign: 'right' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.dark[500], textTransform: 'uppercase', letterSpacing: 0.3 },
  collRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.colors.dark[100], paddingVertical: 6 },
  collName: { fontSize: 13, color: theme.colors.dark[600] },
  collNum: { fontSize: 13, fontWeight: '600', color: theme.colors.dark[800] },
  errBox: { marginTop: 12, backgroundColor: theme.colors.danger[50], borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 },
  errText: { fontSize: 13, color: theme.colors.danger[600] },
});
