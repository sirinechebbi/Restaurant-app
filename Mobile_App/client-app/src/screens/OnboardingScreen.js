import { useRef, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../ui';

const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

// Pour changer une photo : remplace l'identifiant, ou mets { uri: '...' } / require('../../assets/images/ma-photo.jpg')
const SLIDES = [
  {
    key: '1',
    emoji: '🍽️',
    image: { uri: photo('photo-1414235077428-338989a2e8c0') },
    title: 'Vos plats préférés',
    text: 'Choisissez parmi les menus de vos restaurants et commandez en quelques clics.',
  },
  {
    key: '2',
    emoji: '🥘',
    image: { uri: photo('photo-1504674900247-0877df9cc836') },
    title: 'Commandez facilement',
    text: 'Remplissez votre panier, partagez votre position et payez en ligne ou à la livraison.',
  },
  {
    key: '3',
    emoji: '🛵',
    image: { uri: photo('photo-1513104890138-7c749659a591') },
    title: 'Livré rapidement',
    text: 'Suivez votre commande en direct : un livreur vous apporte vos plats chez vous.',
  },
];

function SlidePhoto({ item, style }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <View style={[style, s.fallback]}>
        <Text style={s.fallbackEmoji}>{item.emoji}</Text>
      </View>
    );
  }
  return <Image source={item.image} style={style} resizeMode="cover" onError={() => setFailed(true)} />;
}

export default function OnboardingScreen({ onDone }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  function next() {
    if (last) return onDone();
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    setIndex(index + 1);
  }

  const photoHeight = height * 0.62;
  const sheetHeight = height * 0.42;

  return (
    <View style={s.root}>
      <StatusBar style="light" />

      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.key}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item, index: slideIndex }) => (
          <View style={{ width, height }}>
            <SlidePhoto item={item} style={{ width, height: photoHeight }} />

            <View style={[s.sheet, { height: sheetHeight, paddingBottom: insets.bottom + 20 }]}>
              <View style={s.dots}>
                {SLIDES.map((d, i) => (
                  <View key={d.key} style={[s.dot, i === slideIndex && s.dotActive]} />
                ))}
              </View>
              <Text style={s.title}>{item.title}</Text>
              <Text style={s.text}>{item.text}</Text>

              <Pressable style={s.button} onPress={next}>
                <Text style={s.buttonText}>{slideIndex === SLIDES.length - 1 ? 'Commencer' : 'Suivant'}</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
        )}
      />

      <Pressable style={[s.skip, { top: insets.top + 10 }]} onPress={onDone} hitSlop={10}>
        <Text style={s.skipText}>Passer</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  fallback: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  fallbackEmoji: { fontSize: 96 },
  skip: {
    position: 'absolute', right: 20, backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 6,
  },
  skipText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 28, paddingTop: 18,
    alignItems: 'center',
  },
  dots: { flexDirection: 'row', gap: 6, marginBottom: 18 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primarySoft },
  dotActive: { width: 26, backgroundColor: colors.primary },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center' },
  text: { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 22, marginTop: 10 },
  button: {
    marginTop: 'auto', width: '100%', backgroundColor: colors.primary, borderRadius: 999,
    paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});