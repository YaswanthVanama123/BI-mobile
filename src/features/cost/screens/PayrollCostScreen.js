import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, FilterBar, DateRangeFilter, AsyncState, DataTable,
  StatGrid, StatCard, Muted, Button, Card, SectionTitle,
} from '@/components';
import { useFilters } from '@/context/FiltersContext';
import { formatCurrency, formatNumber, toNumber } from '@/utils/format';
import { pickCsvFile } from '@/utils/file';
import theme from '@/theme';

const columns = [
  { key: 'employee', header: 'Employee', width: 170 },
  { key: 'department', header: 'Department', width: 140 },
  { key: 'appliedRate', header: 'Rate', align: 'right', width: 90, render: (r) => formatCurrency(r.appliedRate) },
  { key: 'regularHours', header: 'Regular hrs', align: 'right', width: 110, render: (r) => formatNumber(r.regularHours) },
  { key: 'overtimeHours', header: 'OT hrs', align: 'right', width: 90, render: (r) => formatNumber(r.overtimeHours) },
  { key: 'grossPay', header: 'Gross pay', align: 'right', width: 110, render: (r) => formatCurrency(r.grossPay) },
  { key: 'burdenedCost', header: 'Burdened cost', align: 'right', width: 130, render: (r) => formatCurrency(r.burdenedCost) },
];

export default function PayrollCostScreen() {
  const { range, setRange } = useFilters();
  const { from, to } = range;
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const { data, loading, error, reload } = useApi(() => biService.payrollCost({ from, to }), [from, to]);
  const [uploading, setUploading] = useState(false);
  const [picked, setPicked] = useState(null);

  const rows = data || [];
  const totalGross = rows.reduce((s, r) => s + (toNumber(r.grossPay) || 0), 0);
  const totalBurdened = rows.reduce((s, r) => s + (toNumber(r.burdenedCost) || 0), 0);
  const totalRegular = rows.reduce((s, r) => s + (toNumber(r.regularHours) || 0), 0);

  const onUpload = async () => {
    try {
      const file = await pickCsvFile();
      if (!file) return;
      setPicked(file);
      setUploading(true);
      const res = await biService.uploadPayrollCsv(file);
      const summary = res && (res.data || res);
      const inserted = (summary && (summary.inserted ?? summary.entries ?? summary.rows)) ?? null;
      Alert.alert('Payroll uploaded', inserted != null ? `${file.name}\nProcessed ${formatNumber(inserted)} row(s).` : `${file.name} uploaded successfully.`);
      reload();
    } catch (err) {
      Alert.alert('Upload failed', (err && err.message) || 'Could not upload the payroll CSV.');
    } finally {
      setUploading(false);
      setPicked(null);
    }
  };

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Payroll Cost" subtitle="ADP payroll by employee. Burdened labor cost folds into utilization." />
      <FilterBar>
        <DateRangeFilter value={range} onChange={setRange} min={opts.data && opts.data.earliestDate} max={opts.data && opts.data.latestDate} />
      </FilterBar>

      <Card style={{ marginBottom: 12 }}>
        <SectionTitle>Import ADP payroll</SectionTitle>
        <Muted style={{ marginBottom: 10 }}>Pick an ADP CSV export. Headers are auto-mapped; employees link to invoice technicians by name.</Muted>
        <Button
          title={uploading ? 'Uploading…' : 'Upload payroll CSV'}
          onPress={onUpload}
          loading={uploading}
          icon={<Ionicons name="cloud-upload-outline" size={18} color="#fff" />}
        />
        {picked ? <Muted style={{ marginTop: 8 }}>{picked.name}</Muted> : null}
      </Card>

      <AsyncState loading={loading} error={error} empty={!loading && !error && rows.length === 0} onRetry={reload} emptyText="No payroll yet — upload an ADP CSV above.">
        {rows.length ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Employees" value={formatNumber(rows.length)} tone="info" />
              <StatCard label="Regular hrs" value={formatNumber(totalRegular)} />
              <StatCard label="Gross pay" value={formatCurrency(totalGross)} />
              <StatCard label="Burdened cost" value={formatCurrency(totalBurdened)} tone="warning" />
            </StatGrid>
            <DataTable title="Payroll by employee" columns={columns} rows={rows} />
          </>
        ) : null}
      </AsyncState>
    </Screen>
  );
}
