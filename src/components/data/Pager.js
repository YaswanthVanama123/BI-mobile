import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import theme from '@/theme';
import { formatNumber } from '@/utils/format';

export default function Pager({ page, totalPages, total, onPrev, onNext, loading }) {
  if (!total) return null;
  const atStart = page <= 1;
  const atEnd = page >= totalPages;
  return (
    <View style={styles.wrap}>
      <Text style={styles.info}>
        Page {page} of {totalPages} · {formatNumber(total)} total
      </Text>
      <View style={styles.btns}>
        <TouchableOpacity
          style={[styles.btn, (atStart || loading) && styles.btnDisabled]}
          disabled={atStart || loading}
          onPress={onPrev}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={16} color={atStart || loading ? theme.textFaint : theme.colors.primary[600]} />
          <Text style={[styles.btnText, (atStart || loading) && styles.btnTextDisabled]}>Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, (atEnd || loading) && styles.btnDisabled]}
          disabled={atEnd || loading}
          onPress={onNext}
          activeOpacity={0.7}
        >
          <Text style={[styles.btnText, (atEnd || loading) && styles.btnTextDisabled]}>Next</Text>
          <Ionicons name="chevron-forward" size={16} color={atEnd || loading ? theme.textFaint : theme.colors.primary[600]} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  info: { fontSize: 12, color: theme.textMuted, flex: 1, fontWeight: '600' },
  btns: { flexDirection: 'row', gap: 8 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.card },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary[600] },
  btnTextDisabled: { color: theme.textFaint },
});
