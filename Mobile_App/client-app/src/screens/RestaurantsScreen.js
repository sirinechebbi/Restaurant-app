import { useCallback, useState } from 'react';
import { Image, ImageBackground,Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api, { errorMessage } from '../api';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import { ErrorBox, IconInput, colors } from '../ui';

const HERO_URI =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80';

// Photo avec un repli si le lien est absent ou cassé
function Photo({ uri, style, emoji = '🍽️', bg }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return (
      <View style={[style, s.placeholder, { backgroundColor: bg || colors.primarySoft }]}>
        <Text style={s.emoji}>{emoji}</Text>
      </View>
    );
  }
  return <Image source={{ uri }} style={style} resizeMode="cover" onError={() => setFailed(true)} />;
}

function RestaurantCard({ item, onPress }) {
  return (
    <Pressable style={s.card} onPress={onPress}>
      <View>
        <Photo key={item.logo_url || 'none'} uri={item.logo_url} style={s.cardPhoto} />
        {!item.is_open && (
          <View style={s.closedOverlay}>
            <Text style={s.closedOverlayText}>Fermé pour le moment</Text>
          </View>
        )}
      </View>

      <View style={s.cardBody}>
        <View style={s.nameRow}>
          <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={[s.badge, item.is_open ? s.open : s.closed]}>
            {item.is_open ? 'Ouvert' : 'Fermé'}
          </Text>
        </View>

        {item.address ? (
          <View style={s.addressRow}>
            <Ionicons name="location-outline" size={14} color={colors.muted} />
            <Text style={s.cardAddress} numberOfLines={1}>{item.address}</Text>
          </View>
        ) : null}

        {item.description ? (
          <Text style={s.cardDescription} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function RestaurantsScreen({ navigation }) {
  const { user } = useAuth();
  const { count } = useCart();

  const [restaurants, setRestaurants] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' ou 'open'

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/restaurants');
      setRestaurants(data);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoaded(true);
    }
  }, []);

  // Recharge la liste chaque fois que l'écran redevient visible
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const q = query.trim().toLowerCase();
  const openCount = restaurants.filter((r) => r.is_open).length;

  // Recherche, filtre, puis tri : les restaurants ouverts d'abord, ensuite l'ordre alphabétique
  const list = restaurants
    .filter((r) => `${r.name} ${r.address || ''}`.toLowerCase().includes(q))
    .filter((r) => filter === 'all' || r.is_open)
    .sort((a, b) => Number(b.is_open) - Number(a.is_open) || a.name.localeCompare(b.name));

  const emptyText = q
    ? 'Aucun résultat.'
    : filter === 'open'
      ? 'Aucun restaurant ouvert pour le moment.'
      : 'Aucun restaurant disponible.';

  const firstName = (user.full_name || '').split(' ')[0];

  return (
    <SafeAreaView edges={['top']} style={s.safe}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* En-tête */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.hello}>Bonjour,</Text>
            <Text style={s.name} numberOfLines={1}>{firstName} 👋</Text>
          </View>
          <Pressable style={s.cartBtn} onPress={() => navigation.navigate('Cart')} hitSlop={8}>
            <Ionicons name="cart-outline" size={24} color={colors.text} />
            {count > 0 && (
              <View style={s.cartBadge}>
                <Text style={s.cartBadgeText}>{count}</Text>
              </View>
            )}
          </Pressable>
        </View>

       {/* Bannière */}
<ImageBackground
  source={{ uri: HERO_URI }}
  style={s.hero}
  imageStyle={s.heroImage}
  resizeMode="cover"
>
  <View style={s.heroOverlay} />

  <Text style={s.heroTitle}>
    {'Découvrez\nnos meilleurs\nplats'}
  </Text>
</ImageBackground>

        {/* Recherche */}
        <View style={s.searchWrap}>
          <IconInput icon="search-outline" placeholder="Rechercher un restaurant" value={query}
                     onChangeText={setQuery} autoCorrect={false} />
        </View>

        {/* Filtres */}
        <View style={s.filters}>
          <Pressable style={[s.chip, filter === 'all' && s.chipOn]} onPress={() => setFilter('all')}>
            <Text style={[s.chipText, filter === 'all' && s.chipTextOn]}>Tous ({restaurants.length})</Text>
          </Pressable>
          <Pressable style={[s.chip, filter === 'open' && s.chipOn]} onPress={() => setFilter('open')}>
            <Text style={[s.chipText, filter === 'open' && s.chipTextOn]}>Ouverts ({openCount})</Text>
          </Pressable>
        </View>

        <ErrorBox message={error} />

        {/* Liste verticale */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>{q ? 'Résultats' : 'Nos restaurants'}</Text>
          {loaded && (
            <Text style={s.count}>{list.length} restaurant{list.length > 1 ? 's' : ''}</Text>
          )}
        </View>

        {!loaded ? (
          <Text style={s.empty}>Chargement...</Text>
        ) : list.length === 0 ? (
          !error && <Text style={s.empty}>{emptyText}</Text>
        ) : (
          <View style={s.list}>
            {list.map((r) => (
              <RestaurantCard
                key={r.id}
                item={r}
                onPress={() => navigation.navigate('Menu', { restaurant: r })}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 40 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  hello: { color: colors.muted, fontSize: 14 },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  cartBtn: { padding: 8 },
  cartBadge: {
    position: 'absolute', top: 0, right: 0, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  cartBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  hero: {
  marginHorizontal: 16,
  height: 150,
  borderRadius: 18,
  overflow: 'hidden',
  padding: 29,
  textAlign: 'center',
  //justifyContent: 'flex-end',
},
heroImage: {
  borderRadius: 18,
  
},
heroOverlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgb(255, 255, 255)',
},
heroTitle: {
  color: '#fffdfd',
  fontSize: 30,
  fontWeight: '800',
  lineHeight: 32,
},
  searchWrap: { paddingHorizontal: 16, paddingTop: 16 },

  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  chipTextOn: { color: '#fff' },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 22, paddingBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  count: { color: colors.muted, fontSize: 13 },

  list: { paddingHorizontal: 16, gap: 14 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
  },
  cardPhoto: { width: '100%', height: 160 },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  closedOverlayText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cardBody: { padding: 14, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardName: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text },
  badge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  open: { backgroundColor: '#dcfce7', color: '#166534' },
  closed: { backgroundColor: '#fee2e2', color: '#991b1b' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardAddress: { flex: 1, color: colors.muted, fontSize: 13 },
  cardDescription: { color: colors.text, fontSize: 14, lineHeight: 20 },
});