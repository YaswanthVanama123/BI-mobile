import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import DateTimePickerModal from '@/components/overlays/DateTimePickerModal';
import { DATE_PRESETS, rangeForPreset } from '@/utils/dateRanges';
import theme from '@/theme';

export default function DateRangeFilter({ value, onChange, min, max }) {
  const preset = (value && value.preset) || 'this_year';
  const from = (value && value.from) || '';
  const to = (value && value.to) || '';
  const [picker, setPicker] = useState(null);

  const selectPreset = (p) => {
    if (p === 'custom') { onChange({ preset: 'custom', from, to }); return; }
    const r = rangeForPreset(p, undefined, { min, max });
    onChange({ preset: p, from: r.from, to: r.to });
  };

  return (
    <View>
      <Text style={styles.label}>Period</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {DATE_PRESETS.map((p) => {
          const active = preset === p.value;
          return (
            <TouchableOpacity key={p.value} onPress={() => selectPreset(p.value)} style={[styles.chip, active && styles.chipActive]} activeOpacity={0.7}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {preset === 'custom' ? (
        <View style={styles.customRow}>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setPicker('from')}>
            <Text style={styles.dateLbl}>From</Text>
            <Text style={styles.dateVal}>{from || 'Select'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setPicker('to')}>
            <Text style={styles.dateLbl}>To</Text>
            <Text style={styles.dateVal}>{to || 'Select'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      <DateTimePickerModal
        visible={!!picker}
        value={picker === 'from' ? from : to}
        onCancel={() => setPicker(null)}
        onConfirm={(d) => {
          if (picker === 'from') onChange({ preset: 'custom', from: d, to });
          else onChange({ preset: 'custom', from, to: d });
          setPicker(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '700', color: theme.colors.dark[500], textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 },
  row: { gap: 8, paddingRight: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.card, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
  chipActive: { backgroundColor: theme.colors.primary[600], borderColor: theme.colors.primary[600] },
  chipText: { fontSize: 12.5, color: theme.colors.dark[600], fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  customRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  dateBtn: { flex: 1, backgroundColor: theme.card, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, borderRadius: 8, padding: 10 },
  dateLbl: { fontSize: 10.5, color: theme.textFaint, textTransform: 'uppercase' },
  dateVal: { fontSize: 13.5, color: theme.text, marginTop: 2, fontWeight: '600' },
});
