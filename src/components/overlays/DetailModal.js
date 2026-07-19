import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import theme from '@/theme';

export default function DetailModal({ visible, title, subtitle, onClose, children }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={[styles.root, { paddingTop: insets.top ? 0 : 12 }]}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.close} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.closeText}>Done</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 40 }}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: theme.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border, gap: 8 },
  title: { fontSize: 17, fontWeight: '700', color: theme.text },
  subtitle: { fontSize: 12, color: theme.textMuted, marginTop: 2 },
  close: { paddingHorizontal: 6, paddingVertical: 4 },
  closeText: { color: theme.colors.primary[600], fontWeight: '700', fontSize: 15 },
});
