import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import theme from '@/theme';

const isValid = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00`).getTime());
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function DateTimePickerModal({ visible, value, onConfirm, onCancel }) {
  const [text, setText] = useState(value || todayIso());
  useEffect(() => { if (visible) setText(value || todayIso()); }, [visible, value]);
  const ok = isValid(text);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Pick a date</Text>
          <Text style={styles.hint}>Format: YYYY-MM-DD</Text>
          <TextInput
            style={[styles.input, !ok && text ? styles.inputBad : null]}
            value={text}
            onChangeText={setText}
            placeholder="2026-01-31"
            placeholderTextColor={theme.textFaint}
            autoCapitalize="none"
            keyboardType="numbers-and-punctuation"
          />
          <TouchableOpacity onPress={() => setText(todayIso())}><Text style={styles.today}>Use today</Text></TouchableOpacity>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btn} onPress={onCancel}><Text style={styles.btnGhost}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary, !ok && styles.btnDisabled]} disabled={!ok} onPress={() => onConfirm(text)}>
              <Text style={styles.btnPrimaryText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, backgroundColor: theme.card, borderRadius: theme.radius, padding: 18 },
  title: { fontSize: 16, fontWeight: '700', color: theme.text },
  hint: { fontSize: 11.5, color: theme.textFaint, marginTop: 2, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: theme.text },
  inputBad: { borderColor: theme.colors.danger[400] },
  today: { color: theme.colors.primary[600], fontSize: 12.5, fontWeight: '600', marginTop: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  btn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8 },
  btnGhost: { color: theme.textMuted, fontWeight: '600' },
  btnPrimary: { backgroundColor: theme.colors.primary[600] },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },
});
