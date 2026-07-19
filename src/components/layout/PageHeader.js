import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '@/theme';

export default function PageHeader({ title, subtitle, right }) {
  return (
    <View style={styles.wrap}>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 8 },
  title: { fontSize: 20, fontWeight: '700', color: theme.text },
  subtitle: { fontSize: 12.5, color: theme.textMuted, marginTop: 3, lineHeight: 17 },
});
