import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import theme from '@/theme';

export default function Select({ label, value, options, onChange, placeholder = 'Select' }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={{ flex: 1 }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={styles.field} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={styles.value} numberOfLines={1}>{current ? current.label : placeholder}</Text>
        <Text style={styles.caret}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            {label ? <Text style={styles.sheetTitle}>{label}</Text> : null}
            <ScrollView style={{ maxHeight: 360 }}>
              {options.map((o) => (
                <TouchableOpacity key={String(o.value)} style={styles.option} onPress={() => { onChange(o.value); setOpen(false); }}>
                  <Text style={[styles.optionText, o.value === value && styles.optionActive]}>{o.label}</Text>
                  {o.value === value ? <Text style={styles.check}>✓</Text> : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '700', color: theme.colors.dark[500], textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 },
  field: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.card, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  value: { fontSize: 13.5, color: theme.text, fontWeight: '600', flex: 1 },
  caret: { fontSize: 12, color: theme.textMuted, marginLeft: 6 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: theme.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, paddingBottom: 30 },
  sheetTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.dark[500], textTransform: 'uppercase', marginBottom: 8 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.dark[100] },
  optionText: { fontSize: 15, color: theme.text },
  optionActive: { color: theme.colors.primary[600], fontWeight: '700' },
  check: { color: theme.colors.primary[600], fontWeight: '700', fontSize: 15 },
});
