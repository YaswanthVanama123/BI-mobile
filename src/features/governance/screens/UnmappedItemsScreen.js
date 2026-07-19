import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import {
  Screen, PageHeader, AsyncState, DataTable, Select, DetailModal, SectionTitle, Muted,
} from '@/components';
import theme from '@/theme';
import { formatNumber } from '@/utils/format';

const columns = [
  { key: 'sourceItemCode', header: 'Source item code', width: 180 },
  { key: 'sourceDescription', header: 'Description', width: 260 },
  { key: 'count', header: 'Lines affected', align: 'right', width: 120, render: (r) => formatNumber(r.count) },
];

function MappingModal({ item, categoryOptions, onSaved, onClose }) {
  const [category, setCategory] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!category) { Alert.alert('Pick a category', 'Choose a service category to map this item to.'); return; }
    setBusy(true);
    try {
      await biService.createItemCategoryMapping({ matchType: 'exact_code', matchValue: item.sourceItemCode, serviceCategoryId: category, priority: 100, reviewStatus: 'approved' });
      await onSaved();
      onClose();
    } catch (e) {
      Alert.alert('Save failed', (e && e.message) || 'Could not create mapping.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <DetailModal visible={!!item} onClose={onClose} title={item.sourceItemCode} subtitle={item.sourceDescription}>
      <View style={{ gap: 14 }}>
        <View>
          <Text style={styles.fieldLabel}>Lines affected</Text>
          <Text style={styles.value}>{formatNumber(item.count)}</Text>
        </View>
        <Select label="Service category" value={category} onChange={setCategory} options={categoryOptions} placeholder="Select a category" />
        <TouchableOpacity style={[styles.saveBtn, busy && styles.btnDisabled]} disabled={busy} onPress={save} activeOpacity={0.7}>
          <Text style={styles.saveText}>{busy ? 'Saving…' : 'Save mapping'}</Text>
        </TouchableOpacity>
      </View>
    </DetailModal>
  );
}

export default function UnmappedItemsScreen() {
  const [selected, setSelected] = useState(null);
  const { data, loading, error, reload } = useApi(() => biService.unmappedServiceItems({}), []);
  const cats = useApi(() => biService.serviceCategories({}), []);
  const rows = data || [];

  const categoryOptions = ((cats.data || [])).map((c) => {
    const val = typeof c === 'string' ? c : (c._id || c.serviceCategoryId || c.categoryCode || c.name);
    const lbl = typeof c === 'string' ? c : (c.name || c.categoryCode || String(val));
    return { value: val, label: lbl };
  });

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="Unmapped Service Items" subtitle="RouteStar items with no category mapping — tap a row to add a mapping and pull it out of the Unmapped bucket." />
      <AsyncState loading={loading} error={error} empty={!loading && !error && rows.length === 0} onRetry={reload}>
        {rows.length ? (
          <DataTable title="Unmapped items" columns={columns} rows={rows} maxRows={500} keyExtractor={(r, i) => r.sourceItemCode || i} onRowClick={(r) => setSelected(r)} />
        ) : null}
      </AsyncState>
      {selected ? <MappingModal item={selected} categoryOptions={categoryOptions} onSaved={reload} onClose={() => setSelected(null)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 11, fontWeight: '700', color: theme.colors.dark[500], textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 },
  value: { fontSize: 14, color: theme.colors.dark[700] },
  saveBtn: { backgroundColor: theme.colors.primary[600], borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  btnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
