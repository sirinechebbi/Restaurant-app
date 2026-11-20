import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAuth } from '../AuthContext';
import { errorMessage } from '../api';
import AuthLayout from '../AuthLayout';
import { Button, ErrorBox, IconInput, colors } from '../ui';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (key) => (value) => setForm({ ...form, [key]: value });

  async function submit() {
    setError('');
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim() || !form.password) {
      return setError('Tous les champs sont obligatoires');
    }
    if (form.password.length < 6) return setError('Mot de passe trop court (6 caractères minimum)');
    if (form.password !== form.confirm) return setError('Les deux mots de passe ne sont pas identiques');

    setLoading(true);
    try {
      await register(form.fullName, form.email, form.phone, form.password);
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Créer un compte" subtitle="Rejoins-nous pour commander" onBack={() => navigation.goBack()}>
      <ErrorBox message={error} />

      <IconInput icon="person-outline" placeholder="Nom complet" value={form.fullName}
                 onChangeText={setField('fullName')} />
      <IconInput icon="mail-outline" placeholder="Email" value={form.email} onChangeText={setField('email')}
                 autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
      <IconInput icon="call-outline" placeholder="Téléphone" value={form.phone}
                 onChangeText={setField('phone')} keyboardType="phone-pad" />
      <IconInput icon="lock-closed-outline" secure placeholder="Mot de passe (6 caractères min.)"
                 value={form.password} onChangeText={setField('password')} />
      <IconInput icon="lock-closed-outline" secure placeholder="Confirmer le mot de passe"
                 value={form.confirm} onChangeText={setField('confirm')} />

      <Button title="Créer mon compte" onPress={submit} loading={loading} />

      <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
        <Text style={s.login}>
          Déjà un compte ? <Text style={s.loginBold}>Se connecter</Text>
        </Text>
      </Pressable>
    </AuthLayout>
  );
}

const s = StyleSheet.create({
  login: { textAlign: 'center', color: colors.muted, fontSize: 15 },
  loginBold: { color: colors.primary, fontWeight: '700' },
});