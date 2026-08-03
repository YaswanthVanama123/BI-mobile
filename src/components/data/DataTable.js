import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import theme from '@/theme';
import { exportTable } from '@/utils/exportData';
import useExportFormat from '@/hooks/useExportFormat';

const DEFAULT_W = 130;

export default function DataTable({
  columns, rows, onRowClick, title, keyExtractor, exportName, onExportAll,
  paginated = true, pageSize = 25, maxRows = 500, searchable = true, searchPlaceholder = 'Search…',
}) {
  const allData = Array.isArray(rows) ? rows : [];
  const [query, setQuery] = useState('');
  const qq = query.trim().toLowerCase();
  const showSearch = searchable && allData.length > 5;
  const data = qq
    ? allData.filter((row) => Object.values(row).some((v) => v != null && typeof v !== 'object' && String(v).toLowerCase().includes(qq)))
    : allData;
  const total = data.length;
  const totalPages = paginated ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const [page, setPage] = useState(0);
  useEffect(() => { setPage(0); }, [total]);
  const safePage = Math.min(page, totalPages - 1);
  const start = paginated ? safePage * pageSize : 0;
  const shown = paginated ? data.slice(start, start + pageSize) : data.slice(0, maxRows);
  const totalW = columns.reduce((t, c) => t + (c.width || DEFAULT_W), 0);

  const alignItemsFor = (a) => (a === 'right' ? 'flex-end' : a === 'center' ? 'center' : 'flex-start');
  const exportFmt = useExportFormat();

  const cellContent = (col, row) => {
    if (col.render) return col.render(row);
    const v = col.accessor ? col.accessor(row) : row[col.key];
    return v == null ? '-' : String(v);
  };

  const onExport = async () => {
    try {
      const rowsToExport = onExportAll ? await onExportAll() : data;
      if (!rowsToExport || !rowsToExport.length) return;
      await exportTable(columns, rowsToExport, exportName || title || 'export');
    } catch (e) {
      Alert.alert('Export failed', (e && e.message) || 'Could not export the table.');
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={styles.title} numberOfLines={1}>{title || 'Data'}</Text>
        <View style={styles.headRight}>
          <Text style={styles.count}>{total} rows</Text>
          {total ? (
            <TouchableOpacity style={styles.exportBtn} onPress={onExport} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="share-outline" size={14} color={theme.colors.primary[600]} />
              <Text style={styles.exportText}>{exportFmt === 'csv' ? 'CSV' : 'Excel'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {showSearch ? (
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={15} color={theme.textFaint} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={theme.textFaint}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator bounces={false} contentContainerStyle={styles.scrollContent}>
        <View style={{ width: totalW }}>
          <View style={styles.headerRow}>
            {columns.map((c) => (
              <View key={c.key} style={[styles.cell, { width: c.width || DEFAULT_W, alignItems: alignItemsFor(c.align) }]}>
                <Text style={[styles.th, { textAlign: c.align || 'left' }]} numberOfLines={1}>{c.header}</Text>
              </View>
            ))}
          </View>
          {shown.map((row, ri) => {
            const Row = onRowClick ? TouchableOpacity : View;
            return (
              <Row
                key={keyExtractor ? keyExtractor(row, start + ri) : start + ri}
                style={[styles.tr, ri % 2 === 1 && styles.trAlt]}
                onPress={onRowClick ? () => onRowClick(row) : undefined}
                activeOpacity={0.6}
              >
                {columns.map((c) => {
                  const content = cellContent(c, row);
                  return (
                    <View key={c.key} style={[styles.cell, { width: c.width || DEFAULT_W, alignItems: alignItemsFor(c.align) }]}>
                      {typeof content === 'string' || typeof content === 'number'
                        ? <Text style={[styles.td, { textAlign: c.align || 'left' }]} numberOfLines={2}>{content}</Text>
                        : content}
                    </View>
                  );
                })}
              </Row>
            );
          })}
          {shown.length === 0 ? <Text style={styles.more}>No rows</Text> : null}
        </View>
      </ScrollView>

      {paginated && totalPages > 1 ? (
        <View style={styles.pager}>
          <TouchableOpacity
            style={[styles.pageBtn, safePage === 0 && styles.pageBtnDisabled]}
            disabled={safePage === 0}
            onPress={() => setPage(safePage - 1)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={16} color={safePage === 0 ? theme.textFaint : theme.colors.primary[600]} />
            <Text style={[styles.pageBtnText, safePage === 0 && styles.pageBtnTextDisabled]}>Prev</Text>
          </TouchableOpacity>

          <Text style={styles.pageInfo}>
            {start + 1}–{Math.min(start + pageSize, total)} of {total}  ·  Page {safePage + 1}/{totalPages}
          </Text>

          <TouchableOpacity
            style={[styles.pageBtn, safePage >= totalPages - 1 && styles.pageBtnDisabled]}
            disabled={safePage >= totalPages - 1}
            onPress={() => setPage(safePage + 1)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pageBtnText, safePage >= totalPages - 1 && styles.pageBtnTextDisabled]}>Next</Text>
            <Ionicons name="chevron-forward" size={16} color={safePage >= totalPages - 1 ? theme.textFaint : theme.colors.primary[600]} />
          </TouchableOpacity>
        </View>
      ) : null}

      {!paginated && total > maxRows ? (
        <Text style={styles.more}>Showing first {maxRows} of {total} rows</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.card,
    borderRadius: theme.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.border,
    overflow: 'hidden',
    ...theme.shadow,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border, backgroundColor: theme.card },
  searchInput: { flex: 1, fontSize: 13, color: theme.text, paddingVertical: 2 },
  title: { fontSize: 13.5, fontWeight: '700', color: theme.colors.dark[700], flex: 1, marginRight: 10 },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  count: { fontSize: 11.5, color: theme.textFaint },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 7, backgroundColor: theme.colors.primary[50] },
  exportText: { fontSize: 12, fontWeight: '700', color: theme.colors.primary[600] },
  scrollContent: { paddingHorizontal: 12 },
  headerRow: { flexDirection: 'row', backgroundColor: theme.colors.dark[50], paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
  th: { fontSize: 11, fontWeight: '700', color: theme.colors.dark[500], textTransform: 'uppercase', letterSpacing: 0.2 },
  tr: { flexDirection: 'row', paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.dark[100] },
  trAlt: { backgroundColor: theme.colors.dark[50] },
  cell: { paddingHorizontal: 10, justifyContent: 'center' },
  td: { fontSize: 12.5, color: theme.text },
  more: { fontSize: 11.5, color: theme.textFaint, padding: 12, textAlign: 'center' },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border, backgroundColor: theme.colors.dark[50] },
  pageBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: theme.card, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
  pageBtnDisabled: { opacity: 0.45 },
  pageBtnText: { fontSize: 12.5, fontWeight: '700', color: theme.colors.primary[600] },
  pageBtnTextDisabled: { color: theme.textFaint },
  pageInfo: { fontSize: 11.5, color: theme.colors.dark[600], fontWeight: '600' },
});
