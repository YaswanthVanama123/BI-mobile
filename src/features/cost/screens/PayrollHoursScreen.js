import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, AsyncState, DataTable, StatGrid, StatCard, Muted,
} from '@/components';
import theme from '@/theme';
import { formatMinutes, formatNumber } from '@/utils/format';
import { getPayrollAnchor, subscribePayrollAnchor } from '@/utils/appSettings';

const toYMD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseYMD = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmtShort = (ymd) => parseYMD(ymd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

function buildPeriods(anchorYMD, count = 12) {
  const anchor = anchorYMD ? parseYMD(anchorYMD) : new Date();
  const out = [];
  for (let k = 0; k < count; k++) {
    const end = addDays(anchor, -14 * k);
    const start = addDays(end, -13);
    out.push({ from: toYMD(start), to: toYMD(end), label: `${fmtShort(toYMD(start))} – ${fmtShort(toYMD(end))}` });
  }
  return out;
}

const columns = [
  { key: 'technician', header: 'Technician', width: 130 },
  { key: 'days', header: 'Days', align: 'right', width: 70, render: (r) => formatNumber(r.days) },
  { key: 'stops', header: 'Stops', align: 'right', width: 70, render: (r) => formatNumber(r.stops) },
  { key: 'serviceMinutes', header: 'Service', align: 'right', width: 110, render: (r) => formatMinutes(r.serviceMinutes) },
  { key: 'drivingMinutes', header: 'Driving', align: 'right', width: 110, render: (r) => formatMinutes(r.drivingMinutes) },
  { key: 'lunchMinutes', header: 'Lunch', align: 'right', width: 100, render: (r) => formatMinutes(r.lunchMinutes) },
  { key: 'totalMinutes', header: 'Total hours', align: 'right', width: 120, render: (r) => formatMinutes(r.totalMinutes) },
];

export default function PayrollHoursScreen() {
  const [anchor, setAnchor] = useState(getPayrollAnchor());
  useEffect(() => subscribePayrollAnchor(setAnchor), []);
  const periods = useMemo(() => buildPeriods(anchor), [anchor]);
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [anchor]);
  const period = periods[idx] || periods[0];

  const { data, meta, loading, error, reload } = useApi(
    () => biService.payrollHours({ from: period.from, to: period.to }),
    [period.from, period.to],
  );
  const rows = data || [];
  const exportAll = async () => rows;

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Payroll Hours" subtitle="Estimated hours per technician for a bi-weekly payroll period — service time + driving time + 1h lunch/day." />

      <View style={styles.stepper}>
        <TouchableOpacity style={[styles.stepBtn, idx <= 0 && styles.stepBtnDisabled]} disabled={idx <= 0} onPress={() => setIdx((i) => Math.max(0, i - 1))} activeOpacity={0.7}>
          <Text style={styles.stepText}>‹ Newer</Text>
        </TouchableOpacity>
        <Text style={styles.periodLabel}>{period ? period.label : ''}{idx === 0 ? '  (latest)' : ''}</Text>
        <TouchableOpacity style={[styles.stepBtn, idx >= periods.length - 1 && styles.stepBtnDisabled]} disabled={idx >= periods.length - 1} onPress={() => setIdx((i) => Math.min(periods.length - 1, i + 1))} activeOpacity={0.7}>
          <Text style={styles.stepText}>Older ›</Text>
        </TouchableOpacity>
      </View>
      {!anchor ? <Muted style={{ marginBottom: 10 }}>No payroll anchor set — using today. Set the payroll date in Data Connections for accurate periods.</Muted> : null}

      <AsyncState loading={loading} error={error} empty={!loading && !error && rows.length === 0} onRetry={reload}>
        {rows.length ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Total hours" value={formatMinutes((meta && meta.totalMinutes) || 0)} tone="success" />
              <StatCard label="Technicians" value={formatNumber((meta && meta.technicians) || rows.length)} />
              <StatCard label="Days worked" value={formatNumber((meta && meta.days) || 0)} />
              <StatCard label="Stops" value={formatNumber((meta && meta.stops) || 0)} />
            </StatGrid>
            <DataTable title="By technician" columns={columns} rows={rows} maxRows={500} onExportAll={exportAll} exportName={`payroll-hours-${period.from}_${period.to}`} />
          </>
        ) : null}
      </AsyncState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  stepBtn: { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.card },
  stepBtnDisabled: { opacity: 0.4 },
  stepText: { fontSize: 13, fontWeight: '700', color: theme.colors.dark[700] },
  periodLabel: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600', color: theme.colors.dark[800] },
});
