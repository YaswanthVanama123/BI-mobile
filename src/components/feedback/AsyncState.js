import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import theme from '@/theme';

export default function AsyncState({ loading, error, empty, onRetry, children, emptyText = 'No data for this selection.' }) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        <Text style={styles.msg}>Loading…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errTitle}>Couldn’t load data</Text>
        <Text style={styles.msg}>{error.message || 'Request failed'}</Text>
        {onRetry ? (
          <TouchableOpacity style={styles.retry} onPress={onRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
  if (empty) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>{emptyText}</Text>
      </View>
    );
  }
  return children;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 8 },
  msg: { fontSize: 13, color: theme.textMuted, textAlign: 'center' },
  errTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.danger[600] },
  retry: { marginTop: 8, backgroundColor: theme.colors.primary[600], paddingHorizontal: 18, paddingVertical: 9, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
});
