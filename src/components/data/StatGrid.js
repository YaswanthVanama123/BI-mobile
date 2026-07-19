import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function StatGrid({ children, columns = 2, gap = 10 }) {
  const items = React.Children.toArray(children);
  return (
    <View style={[styles.grid, { marginHorizontal: -gap / 2 }]}>
      {items.map((child, i) => (
        <View key={i} style={{ width: `${100 / columns}%`, paddingHorizontal: gap / 2, marginBottom: gap }}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
});
