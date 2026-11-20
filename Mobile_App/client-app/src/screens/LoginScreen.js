import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../AuthContext';
import { errorMessage } from '../api';
import { images } from '../assets';
import { Button, ErrorBox, IconInput, colors } from '../ui';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Formes décoratives pêche, comme sur la maquette */}
      <View style={[s.blob, s.blobTop]} />
      <View style={[s.blob, s.blobBottom]} />

      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Image source={images.chef} style={s.chef} resizeMode="contain" />
        <Text style={s.title}>Bienvenue !</Text>
        <Text style={s.subtitle}>Connectez-vous pour continuer</Text>

        <ErrorBox message={error} />

        <View style={s.form}>
          <IconInput icon="mail-outline" placeholder="Email" value={email} onChangeText={setEmail}
                     autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
          <IconInput icon="lock-closed-outline" secure placeholder="Mot de passe"
                     value={password} onChangeText={setPassword} />
          <Button title="Se connecter" onPress={submit} loading={loading} />

          <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
            <Text style={s.link}>Mot de passe oublié ?</Text>
          </Pressable>

          <View style={s.separator}>
            <View style={s.line} />
            <Text style={s.or}>ou</Text>
            <View style={s.line} />
          </View>

          <Pressable onPress={() => navigation.navigate('Register')} hitSlop={8}>
            <Text style={s.linkBold}>Créer un compte</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  blob: { position: 'absolute', backgroundColor: colors.primarySoft, borderRadius: 999 },
  blobTop: { width: 260, height: 260, top: -90, left: -110 },
  blobBottom: { width: 280, height: 280, bottom: -110, right: -120 },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  chef: { width: 150, height: 150, alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  form: { gap: 14 },
  link: { color: colors.text, textAlign: 'center', fontSize: 14 },
  linkBold: { color: colors.text, textAlign: 'center', fontSize: 15, fontWeight: '700' },
  separator: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { color: colors.muted, fontSize: 13 },
});