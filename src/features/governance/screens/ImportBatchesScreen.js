import React, { useMemo } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, AsyncState, DataTable, StatGrid, StatCard, Badge,
} from '@/components';
import { formatDateShort, formatNumber, statusTone } from '@/utils/format';

const columns = [
  { key: 'sourceSystem', header: 'Source', width: 140 },
  { key: 'sourceEntity', header: 'Entity', width: 140 },
  { key: 'status', header: 'Status', width: 120, render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  { key: 'startedAt', header: 'Started', width: 130, render: (r) => formatDateShort(r.startedAt) },
  { key: 'read', header: 'Read', align: 'right', width: 90, render: (r) => formatNumber(r.counts && r.counts.read) },
  { key: 'inserted', header: 'Inserted', align: 'right', width: 90, render: (r) => formatNumber(r.counts && r.counts.inserted) },
  { key: 'updated', header: 'Updated', align: 'right', width: 90, render: (r) => formatNumber(r.counts && r.counts.updated) },
  { key: 'unchanged', header: 'Unchanged', align: 'right', width: 100, render: (r) => formatNumber(r.counts && r.counts.unchanged) },
  { key: 'rejected', header: 'Rejected', align: 'right', width: 90, render: (r) => formatNumber(r.counts && r.counts.rejected) },
];

export default function ImportBatchesScreen() {
  const { data, loading, error, reload } = useApi(() => biService.importBatches({}), []);
  const rows = data || [];

  const k = useMemo(() => {
    const sum = (key) => rows.reduce((t, r) => t + (Number(r.counts && r.counts[key]) || 0), 0);
    return {
      batches: rows.length,
      inserted: sum('inserted'),
      updated: sum('updated'),
      rejected: sum('rejected'),
    };
  }, [rows]);

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Import Batches" subtitle="ETL run history and reconciliation counts per source." />
      <AsyncState loading={loading} error={error} empty={!loading && !error && rows.length === 0} onRetry={reload}>
        {rows.length ? (
          <>
            <StatGrid columns={2}>
              <StatCard label="Batches" value={formatNumber(k.batches)} tone="info" />
              <StatCard label="Inserted" value={formatNumber(k.inserted)} tone="success" />
              <StatCard label="Updated" value={formatNumber(k.updated)} />
              <StatCard label="Rejected" value={formatNumber(k.rejected)} tone={k.rejected ? 'danger' : 'success'} />
            </StatGrid>
            <DataTable title="Batches" columns={columns} rows={rows} maxRows={500} keyExtractor={(r, i) => r._id || i} />
          </>
        ) : null}
      </AsyncState>
    </Screen>
  );
}
