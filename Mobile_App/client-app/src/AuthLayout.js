import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './ui';

// Photo de restaurant (Unsplash). Pour la changer : remplace l'identifiant,
// ou utilise require('../assets/images/ma-photo.jpg')
const HEADER_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
};
const HEADER_HEIGHT = 270;

export default function AuthLayout({ title, subtitle, onBack, children }) {
  const insets = useSafeAreaInsets();
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* Photo de fond, fixe derrière le formulaire */}
      <View style={[s.photoWrap, { height: HEADER_HEIGHT + 40 }]}>
        {!photoFailed && (
          <Image source={HEADER_PHOTO} style={s.photo} resizeMode="cover" onError={() => setPhotoFailed(true)} />
        )}
        <View style={s.overlay} />
      </View>

      {onBack && (
        <Pressable style={[s.back, { top: insets.top + 10 }]} onPress={onBack} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>
          <View style={[s.header, { height: HEADER_HEIGHT, paddingTop: insets.top + 10 }]}>
            <View style={s.logo}>
              <Ionicons name="restaurant" size={28} color="#fff" />
            </View>
            <Text style={s.title}>{title}</Text>
            {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
          </View>

          <View style={s.sheet}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  photoWrap: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.primary },
  photo: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  back: {
    position: 'absolute', left: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  header: { justifyContent: 'flex-end', paddingHorizontal: 28, paddingBottom: 48 },
  logo: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  title: { color: '#fff', fontSize: 30, fontWeight: '800' },
  subtitle: { color: '#fff', fontSize: 15, marginTop: 4, opacity: 0.92 },
  sheet: {
    flexGrow: 1, backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    marginTop: -28, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 32, gap: 14,
  },
});