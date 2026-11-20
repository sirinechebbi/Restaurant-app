import { useCallback, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import api, { errorMessage } from '../api';
import { useAuth } from '../AuthContext';

// Couleurs de l'écran. Pour le fuchsia : PRIMARY = '#D81B79' et SOFT = '#FCE4F0'
const PRIMARY = '#E11D48';
const SOFT = '#FFE4E6';
const TEXT = '#1f2937';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';
const BG = '#f8fafc';
const DANGER = '#dc2626';

const ACTIVE = ['PENDING', 'ACCEPTED', 'ON_DELIVERY'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ]{8,18}$/;

function initials(name) {
  return (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

function memberSince(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={s.infoRow}>
      <View style={s.iconCircle}>
        <Ionicons name={icon} size={18} color={PRIMARY} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const [stats, setStats] = useState(null);

  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Compteurs calculés avec les commandes déjà disponibles côté serveur
  useFocusEffect(
    useCallback(() => {
      api.get('/orders/my')
        .then(({ data }) => setStats({
          total: data.length,
          active: data.filter((o) => ACTIVE.includes(o.status)).length,
          delivered: data.filter((o) => o.status === 'DELIVERED').length,
        }))
        .catch(() => {});
    }, [])
  );

  function confirmLogout() {
    Alert.alert('Se déconnecter ?', 'Tu devras te reconnecter pour commander.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => logout() },
    ]);
  }

  function openEdit() {
    setEmail(user.email);
    setPhone(user.phone);
    setPassword('');
    setError('');
    setEditing(true);
  }

  function closeEdit() {
    if (!saving) setEditing(false);
  }

  const emailChanged = email.trim() !== user.email;

  async function save() {
    setError('');
    const newEmail = email.trim();
    const newPhone = phone.trim();

    if (!EMAIL_RE.test(newEmail)) return setError('Email invalide');
    if (!PHONE_RE.test(newPhone)) return setError('Téléphone invalide (chiffres uniquement, 8 minimum)');

    const changedEmail = newEmail !== user.email;
    const changedPhone = newPhone !== user.phone;
    if (!changedEmail && !changedPhone) return setError('Aucune modification');
    if (changedEmail && !password) return setError('Saisis ton mot de passe pour changer ton email');

    const body = {};
    if (changedEmail) {
      body.email = newEmail;
      body.current_password = password;
    }
    if (changedPhone) body.phone = newPhone;

    setSaving(true);
    try {
      await updateProfile(body);
      setEditing(false);
      Alert.alert('Enregistré', 'Tes informations ont été mises à jour.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const since = memberSince(user.created_at);
  const value = (n) => (stats ? n : '–');

  return (
    <View style={s.root}>
      {/* Icônes de la barre d'état en blanc sur le bandeau, uniquement quand cet onglet est affiché */}
      {focused && !editing && <StatusBar style="light" />}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={[s.band, { paddingTop: insets.top + 16 }]}>
          <Text style={s.bandTitle}>Mon profil</Text>
        </View>

        <View style={s.content}>
          <View style={s.card}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials(user.full_name)}</Text>
            </View>
            <Text style={s.name}>{user.full_name}</Text>
            <Text style={s.email}>{user.email}</Text>
            {since && <Text style={s.since}>Membre depuis {since}</Text>}

            <View style={s.stats}>
              <View style={s.stat}>
                <Text style={s.statValue}>{value(stats?.total)}</Text>
                <Text style={s.statLabel}>Commandes</Text>
              </View>
              <View style={s.divider} />
              <View style={s.stat}>
                <Text style={s.statValue}>{value(stats?.active)}</Text>
                <Text style={s.statLabel}>En cours</Text>
              </View>
              <View style={s.divider} />
              <View style={s.stat}>
                <Text style={s.statValue}>{value(stats?.delivered)}</Text>
                <Text style={s.statLabel}>Livrées</Text>
              </View>
            </View>
          </View>

          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Mes informations</Text>
            <Pressable style={s.editBtn} onPress={openEdit} hitSlop={8}>
              <Ionicons name="create-outline" size={16} color={PRIMARY} />
              <Text style={s.editText}>Modifier</Text>
            </Pressable>
          </View>
          <View style={s.box}>
            <InfoRow icon="mail-outline" label="Email" value={user.email} />
            <View style={s.separator} />
            <InfoRow icon="call-outline" label="Téléphone" value={user.phone} />
          </View>

          <Pressable style={s.menuRow} onPress={() => navigation.navigate('Orders')}>
            <View style={s.iconCircle}>
              <Ionicons name="receipt-outline" size={18} color={PRIMARY} />
            </View>
            <Text style={s.menuText}>Mes commandes</Text>
            <Ionicons name="chevron-forward" size={20} color={MUTED} />
          </Pressable>

          <Pressable style={s.logout} onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={20} color={DANGER} />
            <Text style={s.logoutText}>Se déconnecter</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Fenêtre de modification */}
      <Modal visible={editing} animationType="slide" transparent onRequestClose={closeEdit}>
        <KeyboardAvoidingView style={s.modalWrap} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={s.backdrop} onPress={closeEdit} />

          <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle}>Modifier mes informations</Text>
              <Pressable onPress={closeEdit} hitSlop={10}>
                <Ionicons name="close" size={24} color={MUTED} />
              </Pressable>
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <Text style={s.fieldLabel}>Email</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor="#9ca3af"
            />

            <Text style={s.fieldLabel}>Téléphone</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Téléphone"
              placeholderTextColor="#9ca3af"
            />

            {emailChanged && (
              <>
                <Text style={s.fieldLabel}>Mot de passe actuel</Text>
                <TextInput
                  style={s.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholder="Nécessaire pour changer l'email"
                  placeholderTextColor="#9ca3af"
                />
              </>
            )}

            <View style={s.actions}>
              <Pressable style={[s.btn, s.btnGhost]} onPress={closeEdit} disabled={saving}>
                <Text style={s.btnGhostText}>Annuler</Text>
              </Pressable>
              <Pressable style={[s.btn, s.btnPrimary, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
                <Text style={s.btnPrimaryText}>{saving ? 'Enregistrement...' : 'Enregistrer'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  band: { backgroundColor: PRIMARY, paddingHorizontal: 20, paddingBottom: 70 },
  bandTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },

  content: { paddingHorizontal: 16, marginTop: -50, gap: 14 },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, paddingTop: 0, alignItems: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: SOFT, marginTop: -44,
    borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: PRIMARY, fontSize: 30, fontWeight: '800' },
  name: { fontSize: 21, fontWeight: '800', color: TEXT, marginTop: 10 },
  email: { color: MUTED, marginTop: 2 },
  since: { color: MUTED, fontSize: 12, marginTop: 6 },

  stats: {
    flexDirection: 'row', alignSelf: 'stretch', marginTop: 18, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: PRIMARY },
  statLabel: { color: MUTED, fontSize: 12, marginTop: 2 },
  divider: { width: 1, backgroundColor: BORDER },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: TEXT },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editText: { color: PRIMARY, fontWeight: '700', fontSize: 14 },

  box: { backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: BORDER },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: SOFT,
    alignItems: 'center', justifyContent: 'center',
  },
  infoLabel: { color: MUTED, fontSize: 12 },
  infoValue: { color: TEXT, fontSize: 15, fontWeight: '600' },
  separator: { height: 1, backgroundColor: BORDER, marginVertical: 12 },

  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16,
    padding: 14, borderWidth: 1, borderColor: BORDER,
  },
  menuText: { flex: 1, color: TEXT, fontSize: 15, fontWeight: '700' },

  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#fecaca',
  },
  logoutText: { color: DANGER, fontWeight: '700', fontSize: 16 },

  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, gap: 8,
  },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: TEXT },
  fieldLabel: { color: MUTED, fontSize: 13, fontWeight: '600', marginTop: 6 },
  input: {
    borderWidth: 1, borderColor: BORDER, backgroundColor: '#fff', borderRadius: 12,
    padding: 14, fontSize: 16, color: TEXT,
  },
  error: { backgroundColor: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center' },
  btnGhost: { backgroundColor: BORDER },
  btnGhostText: { color: TEXT, fontWeight: '600', fontSize: 16 },
  btnPrimary: { backgroundColor: PRIMARY },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});