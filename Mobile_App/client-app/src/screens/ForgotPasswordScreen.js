import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import api, { errorMessage } from '../api';
import { Button, ErrorBox, Input, colors } from '../ui';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1 : email, 2 : code + nouveau mot de passe, 3 : terminé
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    setError('');
    setInfo('');
    if (!email.trim()) return setError('Saisis ton email');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setInfo(data.message);
      setStep(2);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    setError('');
    if (!code.trim()) return setError('Saisis le code reçu par email');
    if (password.length < 6) return setError('Mot de passe trop court (6 caractères minimum)');
    if (password !== confirm) return setError('Les deux mots de passe ne sont pas identiques');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email: email.trim(), code: code.trim(), password });
      setStep(3);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={s.container}
                keyboardShouldPersistTaps="handled">
      <ErrorBox message={error} />

      {step === 1 && (
        <View style={s.form}>
          <Text style={s.text}>Saisis ton email : tu recevras un code de vérification.</Text>
          <Input placeholder="Email" value={email} onChangeText={setEmail}
                 autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
          <Button title="Envoyer le code" onPress={sendCode} loading={loading} />
        </View>
      )}

      {step === 2 && (
        <View style={s.form}>
          {info ? <Text style={s.info}>{info}</Text> : null}
          <Input placeholder="Code reçu par email (6 chiffres)" value={code} onChangeText={setCode}
                 keyboardType="number-pad" maxLength={6} textContentType="oneTimeCode" />
          <Input placeholder="Nouveau mot de passe (6 caractères min.)" value={password}
                 onChangeText={setPassword} secureTextEntry />
          <Input placeholder="Confirmer le mot de passe" value={confirm}
                 onChangeText={setConfirm} secureTextEntry />
          <Button title="Changer le mot de passe" onPress={reset} loading={loading} />
          <Button title="Renvoyer le code" onPress={sendCode} disabled={loading} secondary />
          <Text style={s.hint}>Pense à regarder dans tes spams. Attends une minute avant de redemander un code.</Text>
        </View>
      )}

      {step === 3 && (
        <View style={s.form}>
          <Text style={s.info}>Mot de passe modifié. Tu peux maintenant te connecter.</Text>
          <Button title="Retour à la connexion" onPress={() => navigation.popToTop()} />
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 24 },
  form: { gap: 12 },
  text: { color: colors.text, fontSize: 16 },
  info: { backgroundColor: '#dcfce7', color: '#166534', padding: 10, borderRadius: 8 },
  hint: { color: colors.muted, fontSize: 12 },
});