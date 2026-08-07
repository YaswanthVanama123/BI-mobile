import React from 'react';
import { View } from 'react-native';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import { DetailModal, AsyncState, DataTable, Muted } from '@/components';
import { formatNumber } from '@/utils/format';

const fetchRowCols = [
  { key: 'customerName', header: 'Customer', width: 180 },
  { key: 'accountNumber', header: 'Account #', width: 110, render: (r) => r.accountNumber || '—' },
  { key: 'pricingCount', header: 'Pricing', align: 'right', width: 80, render: (r) => formatNumber(r.pricingCount) },
  { key: 'routesCount', header: 'Routes', align: 'right', width: 80, render: (r) => formatNumber(r.routesCount) },
  { key: 'activityCount', header: 'Activity', align: 'right', width: 80, render: (r) => formatNumber(r.activityCount) },
  { key: 'status', header: 'Status', width: 100, render: (r) => r.status || '—' },
];

export default function FetchRowsModal({ runId, onClose }) {
  const { data, meta, loading, error, reload } = useApi(
    () => biService.accountFetchRows({ runId: runId || undefined, pageSize: 'all' }),
    [runId],
  );
  const rows = data || [];
  const run = meta && meta.run;
  const total = (meta && meta.total) || rows.length;
  return (
    <DetailModal visible onClose={onClose} title="Data stored in this sync">
      <AsyncState loading={loading} error={error} empty={!loading && !error && rows.length === 0} onRetry={reload}>
        <View style={{ gap: 10 }}>
          <Muted>{`${formatNumber(total)} customer(s) stored${meta && meta.runId ? ` · run ${meta.runId}` : ''}`}</Muted>
          {run ? <Muted>{`Started ${new Date(run.startedAt).toLocaleString()} · ${run.status}${run.summary ? ` · discovered ${formatNumber(run.summary.discovered || 0)}, fetched ${formatNumber(run.summary.stored || 0)}` : ''}`}</Muted> : null}
          {rows.length ? <DataTable title="Fetched rows" columns={fetchRowCols} rows={rows} maxRows={1000} /> : null}
        </View>
      </AsyncState>
    </DetailModal>
  );
}
