import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from './ui';

export default function Photo({ uri, style, emoji = '🍽️', fontSize = 40 }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return (
      <View style={[style, s.placeholder]}>
        <Text style={{ fontSize }}>{emoji}</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={style} resizeMode="cover" onError={() => setFailed(true)} />;
}

const s = StyleSheet.create({
  placeholder: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
});