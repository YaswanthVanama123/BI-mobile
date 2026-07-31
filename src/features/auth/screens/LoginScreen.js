import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import theme from '@/theme';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!username.trim() || !password) return;
    setError(null); setBusy(true);
    try {
      await login(username.trim(), password);
    } catch (e) {
      setError((e && e.message) || 'Invalid username or password.');
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.wrap, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <View style={styles.logo}><Text style={styles.logoText}>EM</Text></View>
          <View>
            <Text style={styles.brandTitle}>EnviroMaster BI</Text>
            <Text style={styles.brandSub}>Operational &amp; Financial</Text>
          </View>
        </View>

        <Text style={styles.h1}>Sign in</Text>
        <Text style={styles.sub}>Enter your credentials to access the dashboard.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Username</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={16} color={theme.textFaint} />
            <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="admin"
              placeholderTextColor={theme.textFaint} autoCapitalize="none" autoCorrect={false} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={16} color={theme.textFaint} />
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••"
              placeholderTextColor={theme.textFaint} secureTextEntry autoCapitalize="none" onSubmitEditing={onSubmit} />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={[styles.btn, (busy || !username || !password) && styles.btnDisabled]} onPress={onSubmit} disabled={busy || !username || !password} activeOpacity={0.8}>
          {busy ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="log-in-outline" size={18} color="#fff" />}
          <Text style={styles.btnText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.bg },
  wrap: { paddingHorizontal: 24, flexGrow: 1, justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
  logo: { width: 44, height: 44, borderRadius: 11, backgroundColor: theme.colors.primary[600], alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  brandTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
  brandSub: { fontSize: 11.5, color: theme.textFaint },
  h1: { fontSize: 24, fontWeight: '800', color: theme.text },
  sub: { fontSize: 13.5, color: theme.textFaint, marginTop: 4, marginBottom: 20 },
  field: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', color: theme.colors.dark[500], textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, borderRadius: 10, backgroundColor: theme.card, paddingHorizontal: 12, paddingVertical: 12 },
  input: { flex: 1, fontSize: 15, color: theme.text, padding: 0 },
  error: { color: theme.colors.danger ? theme.colors.danger[600] : '#dc2626', fontSize: 13, marginBottom: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.primary[600], borderRadius: 10, paddingVertical: 14, marginTop: 6 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
