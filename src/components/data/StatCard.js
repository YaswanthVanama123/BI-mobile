import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme, { tone as toneMap } from '@/theme';
import Card from '@/components/primitives/Card';

export default function StatCard({ label, value, sublabel, tone = 'neutral', style }) {
  const t = toneMap[tone] || toneMap.neutral;
  return (
    <Card style={[styles.card, style]}>
      <View style={[styles.accent, { backgroundColor: t.solid }]} />
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <Text style={[styles.value, { color: tone === 'neutral' ? theme.text : t.fg }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sublabel ? <Text style={styles.sublabel} numberOfLines={1}>{sublabel}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingLeft: 14, overflow: 'hidden', justifyContent: 'center', minHeight: 78 },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  label: { fontSize: 11.5, color: theme.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  value: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  sublabel: { fontSize: 11.5, color: theme.textFaint, marginTop: 3 },
});
