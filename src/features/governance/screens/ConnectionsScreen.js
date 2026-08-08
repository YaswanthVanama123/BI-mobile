import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, AsyncState, Card, Badge, Muted,
} from '@/components';
import theme from '@/theme';
import { formatNumber } from '@/utils/format';
import useExportFormat from '@/hooks/useExportFormat';
import { setExportFormat, getPayrollAnchor, setPayrollAnchor, subscribePayrollAnchor } from '@/utils/appSettings';

function ExportFormatSetting() {
  const fmt = useExportFormat();
  const option = (val, title, desc) => {
    const active = fmt === val;
    return (
      <TouchableOpacity
        key={val}
        onPress={() => setExportFormat(val)}
        activeOpacity={0.7}
        style={[styles.optCard, active && styles.optCardActive]}
      >
        <View style={styles.optHead}>
          <Text style={styles.optTitle}>{title}</Text>
          {active ? <Badge tone="success">Default</Badge> : null}
        </View>
        <Text style={styles.optDesc}>{desc}</Text>
      </TouchableOpacity>
    );
  };
  return (
    <Card style={{ marginBottom: 12 }}>
      <Text style={styles.settingTitle}>Default export format</Text>
      <Text style={styles.settingSub}>Applies to every Export button. Excel files open with column filters enabled automatically.</Text>
      <View style={styles.optRow}>
        {option('excel', 'Excel (.xlsx)', 'Filters on; numbers & dates typed.')}
        {option('csv', 'CSV (.csv)', 'Plain values; opens anywhere.')}
      </View>
    </Card>
  );
}

function PayrollAnchorSetting() {
  const [anchor, setAnchor] = React.useState(getPayrollAnchor());
  React.useEffect(() => subscribePayrollAnchor(setAnchor), []);
  return (
    <Card style={{ marginBottom: 12 }}>
      <Text style={styles.settingTitle}>Payroll anchor date</Text>
      <Text style={styles.settingSub}>The most recent payroll date (YYYY-MM-DD). The Payroll Hours screen builds bi-weekly periods backward from this date.</Text>
      <TextInput
        style={styles.dateInput}
        value={anchor}
        onChangeText={setAnchor}
        onEndEditing={(e) => setPayrollAnchor((e.nativeEvent.text || '').trim())}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={theme.textFaint}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </Card>
  );
}

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
      <ExportFormatSetting />
      <PayrollAnchorSetting />
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
  settingTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.dark[800] },
  settingSub: { fontSize: 12, color: theme.textFaint, marginTop: 4, marginBottom: 12 },
  dateInput: { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: theme.text },
  optRow: { flexDirection: 'row', gap: 10 },
  optCard: { flex: 1, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  optCardActive: { borderColor: theme.colors.primary[500], backgroundColor: theme.colors.primary[50] },
  optHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  optTitle: { fontSize: 13.5, fontWeight: '700', color: theme.colors.dark[800] },
  optDesc: { fontSize: 11.5, color: theme.textFaint, marginTop: 4 },
});
