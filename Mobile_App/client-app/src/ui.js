import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const colors = {
  primary: '#E11D48',
  primarySoft: '#FFE4E6',
  text: '#1f2937',
  muted: '#6b7280',
  border: '#e5e7eb',
  bg: '#f8fafc',
  danger: '#dc2626',
};

export function Button({ title, onPress, loading, secondary, disabled }) {
  const off = loading || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={[s.button, secondary && s.buttonSecondary, off && { opacity: 0.6 }]}
    >
      {loading ? (
        <ActivityIndicator color={secondary ? colors.text : '#fff'} />
      ) : (
        <Text style={[s.buttonText, secondary && { color: colors.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Input(props) {
  return <TextInput placeholderTextColor="#9ca3af" {...props} style={[s.input, props.style]} />;
}

// Champ avec une icône à gauche, et un oeil pour afficher le mot de passe si secure est activé
export function IconInput({ icon, secure, style, ...props }) {
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={[s.iconInput, style]}>
      <Ionicons name={icon} size={20} color={colors.muted} />
      <TextInput
        placeholderTextColor="#9ca3af"
        {...props}
        secureTextEntry={hidden}
        style={s.iconInputText}
      />
      {secure && (
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
          <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return <Text style={s.error}>{message}</Text>;
}

const s = StyleSheet.create({
  button: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonSecondary: { backgroundColor: colors.border },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  input: {
    borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff',
    borderRadius: 12, padding: 14, fontSize: 16, color: colors.text,
  },
  iconInput: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff',
    borderRadius: 12, paddingHorizontal: 14,
  },
  iconInputText: { flex: 1, paddingVertical: 14, fontSize: 16, color: colors.text },
  error: { backgroundColor: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 8, marginVertical: 8 },
});