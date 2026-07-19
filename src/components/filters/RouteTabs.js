import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import theme from '@/theme';

export default function RouteTabs({ routes = [], value = 'all', onChange, allLabel = 'All' }) {
  const items = [{ v: 'all', label: allLabel }, ...routes.map((r) => ({ v: r, label: r }))];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((it) => {
        const active = value === it.v;
        return (
          <TouchableOpacity key={it.v} onPress={() => onChange(it.v)} style={[styles.tab, active && styles.tabActive]} activeOpacity={0.7}>
            <Text style={[styles.text, active && styles.textActive]}>{it.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: theme.card, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
  tabActive: { backgroundColor: theme.colors.dark[800], borderColor: theme.colors.dark[800] },
  text: { fontSize: 12.5, color: theme.colors.dark[600], fontWeight: '600' },
  textActive: { color: '#fff' },
});
