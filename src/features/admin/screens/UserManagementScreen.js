import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useApi from '@/hooks/useApi';
import biService from '@/api/biService';
import { Screen, PageHeader, AsyncState, DataTable, Badge, DetailModal } from '@/components';
import theme from '@/theme';
import { useAuth } from '@/context/AuthContext';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

function UserForm({ user, onClose, onSaved }) {
  const editing = !!user;
  const [username, setUsername] = useState(user ? user.username : '');
  const [name, setName] = useState(user ? user.name : '');
  const [role, setRole] = useState(user ? user.role : 'user');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null); setBusy(true);
    try {
      if (editing) {
        const body = { name, role };
        if (password) body.password = password;
        await biService.updateUser(user.id, body);
      } else {
        await biService.createUser({ username: username.trim(), name, role, password });
      }
      onSaved(); onClose();
    } catch (e) { setError((e && e.message) || 'Could not save user.'); }
    finally { setBusy(false); }
  };

  return (
    <DetailModal visible onClose={onClose} title={editing ? `Edit ${user.username}` : 'Add user'}>
      <View style={{ gap: 12 }}>
        {!editing ? (
          <View>
            <Text style={styles.label}>Username</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="jsmith" placeholderTextColor={theme.textFaint} />
          </View>
        ) : null}
        <View>
          <Text style={styles.label}>Full name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Jane Smith" placeholderTextColor={theme.textFaint} />
        </View>
        <View>
          <Text style={styles.label}>Role</Text>
          <View style={styles.roleRow}>
            {['user', 'admin'].map((r) => (
              <TouchableOpacity key={r} style={[styles.roleBtn, role === r && styles.roleBtnActive]} onPress={() => setRole(r)}>
                <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View>
          <Text style={styles.label}>{editing ? 'New password (blank = keep)' : 'Password'}</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder={editing ? '••••••••' : 'min 6 chars'} placeholderTextColor={theme.textFaint} autoCapitalize="none" />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={[styles.saveBtn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy} activeOpacity={0.8}>
          <Text style={styles.saveText}>{busy ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </DetailModal>
  );
}

export default function UserManagementScreen() {
  const { user: current } = useAuth();
  const { data, loading, error, reload } = useApi(() => biService.users(), []);
  const [editing, setEditing] = useState(null);
  const rows = (data && (data.data || data)) || [];

  const remove = (u) => {
    Alert.alert('Delete user', `Delete "${u.username}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await biService.deleteUser(u.id); reload(); } catch (e) { Alert.alert('Error', (e && e.message) || 'Failed'); } } },
    ]);
  };

  const columns = [
    { key: 'username', header: 'Username', width: 140 },
    { key: 'name', header: 'Name', width: 160 },
    { key: 'role', header: 'Role', width: 80, render: (r) => <Badge tone={r.role === 'admin' ? 'info' : 'neutral'}>{r.role}</Badge> },
    { key: 'active', header: 'Status', width: 90, render: (r) => <Badge tone={r.active ? 'success' : 'danger'}>{r.active ? 'active' : 'off'}</Badge> },
    { key: 'lastLoginAt', header: 'Last login', width: 110, render: (r) => fmtDate(r.lastLoginAt) },
    { key: '_del', header: '', width: 44, render: (r) => (r.id !== (current && current.id)
      ? <TouchableOpacity onPress={() => remove(r)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}><Ionicons name="trash-outline" size={16} color="#dc2626" /></TouchableOpacity>
      : null) },
  ];

  return (
    <Screen loading={loading} onRefresh={reload}>
      <PageHeader title="User Management" subtitle="Create and manage login accounts." />
      <TouchableOpacity style={styles.addBtn} onPress={() => setEditing({})} activeOpacity={0.8}>
        <Ionicons name="person-add-outline" size={16} color="#fff" />
        <Text style={styles.addText}>Add user</Text>
      </TouchableOpacity>
      <AsyncState loading={loading} error={error} empty={!loading && !error && rows.length === 0} onRetry={reload}>
        {rows.length ? <DataTable title="Users" columns={columns} rows={rows} searchable={rows.length > 5} onRowClick={(r) => setEditing(r)} /> : null}
      </AsyncState>
      {editing ? <UserForm user={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={reload} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.primary[600], borderRadius: 8, paddingVertical: 11, marginBottom: 12 },
  addText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  label: { fontSize: 11, fontWeight: '700', color: theme.colors.dark[500], textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, borderRadius: 9, backgroundColor: theme.card, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: theme.text },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border, backgroundColor: theme.card },
  roleBtnActive: { backgroundColor: theme.colors.primary[600], borderColor: theme.colors.primary[600] },
  roleText: { fontSize: 13.5, color: theme.colors.dark[600], fontWeight: '600', textTransform: 'capitalize' },
  roleTextActive: { color: '#fff' },
  error: { color: '#dc2626', fontSize: 13 },
  saveBtn: { backgroundColor: theme.colors.primary[600], borderRadius: 9, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
