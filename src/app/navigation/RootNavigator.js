import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NAV, NAV_ITEMS } from '@/app/navigation/navConfig';
import theme from '@/theme';

const Drawer = createDrawerNavigator();

function DrawerContent(props) {
  const insets = useSafeAreaInsets();
  const current = props.state.routeNames[props.state.index];
  return (
    <View style={{ flex: 1, backgroundColor: theme.card }}>
      <View style={[styles.brand, { paddingTop: insets.top + 14 }]}>
        <View style={styles.logo}><Text style={styles.logoText}>EM</Text></View>
        <View>
          <Text style={styles.brandTitle}>EnviroMaster BI</Text>
          <Text style={styles.brandSub}>Operational & Financial</Text>
        </View>
      </View>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 4 }}>
        {NAV.map((group) => (
          <View key={group.section} style={styles.group}>
            <Text style={styles.groupTitle}>{group.section}</Text>
            {group.items.map((item) => {
              const active = current === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.item, active && styles.itemActive]}
                  onPress={() => props.navigation.navigate(item.name)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={18} color={active ? theme.colors.primary[600] : theme.colors.dark[500]} />
                  <Text style={[styles.itemText, active && styles.itemTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </DrawerContentScrollView>
    </View>
  );
}

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: theme.bg, card: theme.card, text: theme.text, border: theme.border, primary: theme.colors.primary[600] },
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Drawer.Navigator
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={{
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: '700', fontSize: 16 },
          drawerType: 'front',
          drawerStyle: { width: 300 },
          sceneContainerStyle: { backgroundColor: theme.bg },
        }}
      >
        {NAV_ITEMS.map((item) => (
          <Drawer.Screen key={item.name} name={item.name} component={item.component} options={{ title: item.label }} />
        ))}
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
  logo: { width: 38, height: 38, borderRadius: 9, backgroundColor: theme.colors.primary[600], alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  brandTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
  brandSub: { fontSize: 11, color: theme.textFaint },
  group: { marginBottom: 6 },
  groupTitle: { fontSize: 10.5, fontWeight: '700', color: theme.textFaint, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 8, marginHorizontal: 8 },
  itemActive: { backgroundColor: theme.colors.primary[50] },
  itemText: { fontSize: 14, color: theme.colors.dark[700] },
  itemTextActive: { color: theme.colors.primary[700], fontWeight: '700' },
});
