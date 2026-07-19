import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import theme, { tone as toneMap } from '@/theme';

export default function Button({ title, onPress, tone = 'primary', variant = 'solid', loading, disabled, icon, style, size = 'md' }) {
  const palette = tone === 'primary'
    ? { solid: theme.colors.primary[600], fg: theme.colors.primary[700], bg: theme.colors.primary[50] }
    : (toneMap[tone] || toneMap.neutral);
  const isSolid = variant === 'solid';
  const bg = isSolid ? palette.solid : palette.bg;
  const fg = isSolid ? '#fff' : palette.fg;
  const isDisabled = disabled || loading;
  const pad = size === 'sm' ? { paddingVertical: 8, paddingHorizontal: 12 } : { paddingVertical: 12, paddingHorizontal: 18 };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[styles.btn, pad, { backgroundColor: bg }, !isSolid && { borderWidth: 1, borderColor: palette.solid }, isDisabled && styles.disabled, style]}
    >
      <View style={styles.row}>
        {loading ? <ActivityIndicator size="small" color={fg} /> : icon}
        <Text style={[styles.text, { color: fg }, size === 'sm' && { fontSize: 13 }]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontSize: 14.5, fontWeight: '700' },
  disabled: { opacity: 0.5 },
});
