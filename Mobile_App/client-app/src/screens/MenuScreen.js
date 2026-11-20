import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import api, { errorMessage } from '../api';
import { useCart } from '../CartContext';
import Photo from '../Photo';
import { money } from '../orderUtils';
import { ErrorBox, colors } from '../ui';

export default function MenuScreen({ route, navigation }) {
  const { restaurant } = route.params;
  const insets = useSafeAreaInsets();
  const { addItem, changeQty, quantityOf, restaurant: cartRestaurant, count, total } = useCart();
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState('all');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/restaurants/${restaurant.id}/menu`);
      setMenu(data);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [restaurant.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const current = menu?.restaurant || restaurant;
  const isOpen = current.is_open;
  const categories = menu?.categories || [];
  // Si la catégorie choisie a disparu (plat retiré), on revient à "Tout"
  const activeId = categories.some((c) => c.id === selected) ? selected : 'all';

  const rows = useMemo(() => {
    const list = [];
    for (const c of menu?.categories || []) {
      if (activeId !== 'all' && c.id !== activeId) continue;
      if (activeId === 'all') list.push({ type: 'header', key: `h${c.id}`, title: c.name });
      for (const item of c.items) list.push({ type: 'item', key: `i${item.id}`, item });
    }
    return list;
  }, [menu, activeId]);

  const showCartBar = count > 0 && cartRestaurant?.id === restaurant.id;

  const header = (
    <View>
      <Photo key={current.logo_url || 'none'} uri={current.logo_url} style={s.hero} fontSize={64} />

      <View style={s.sheet}>
        <View style={s.nameRow}>
          <Text style={s.name}>{current.name}</Text>
          <Text style={[s.badge, isOpen ? s.open : s.closed]}>{isOpen ? 'Ouvert' : 'Fermé'}</Text>
        </View>
        {current.address ? (
          <View style={s.line}>
            <Ionicons name="location-outline" size={15} color={colors.muted} />
            <Text style={s.lineText}>{current.address}</Text>
          </View>
        ) : null}
        {current.description ? <Text style={s.description}>{current.description}</Text> : null}
        {!isOpen && (
          <Text style={s.closedBanner}>Ce restaurant est fermé : tu ne peux pas commander pour le moment.</Text>
        )}
        <ErrorBox message={error} />

        {categories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
            {[{ id: 'all', name: 'Tout' }, ...categories].map((c) => (
              <Pressable key={c.id} onPress={() => setSelected(c.id)}
                         style={[s.chip, activeId === c.id && s.chipOn]}>
                <Text style={[s.chipText, activeId === c.id && s.chipTextOn]}>{c.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );

  function renderRow({ item: row }) {
    if (row.type === 'header') return <Text style={s.section}>{row.title}</Text>;

    const item = row.item;
    const qty = quantityOf(item.id);
    return (
      <View style={s.item}>
        <Photo key={item.image_url || 'none'} uri={item.image_url} style={s.thumb} fontSize={28} />
        <View style={{ flex: 1 }}>
          <Text style={s.itemName} numberOfLines={2}>{item.name}</Text>
          {item.description ? <Text style={s.itemDescription} numberOfLines={2}>{item.description}</Text> : null}
          <Text style={s.price}>{money(item.price)}</Text>
        </View>
        {isOpen && (
          qty === 0 ? (
            <Pressable style={s.add} onPress={() => addItem(item, current)}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          ) : (
            <View style={s.qtyBox}>
              <Pressable style={s.minus} onPress={() => changeQty(item.id, -1)}>
                <Ionicons name="remove" size={18} color={colors.text} />
              </Pressable>
              <Text style={s.qty}>{qty}</Text>
              <Pressable style={s.addSmall} onPress={() => addItem(item, current)}>
                <Ionicons name="add" size={18} color="#fff" />
              </Pressable>
            </View>
          )
        )}
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        renderItem={renderRow}
        ListHeaderComponent={header}
        ListEmptyComponent={error || !menu ? null : <Text style={s.empty}>Aucun plat disponible.</Text>}
        contentContainerStyle={{ paddingBottom: showCartBar ? 110 : 24 }}
        showsVerticalScrollIndicator={false}
      />

      <Pressable style={[s.back, { top: insets.top + 10 }]} onPress={() => navigation.goBack()} hitSlop={10}>
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </Pressable>

      {showCartBar && (
        <View style={[s.bar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={s.barLeft}>
            <Ionicons name="cart-outline" size={28} color={colors.text} />
            <View>
              <Text style={s.barCount}>{count} article{count > 1 ? 's' : ''}</Text>
              <Text style={s.barTotal}>{money(total)}</Text>
            </View>
          </View>
          <Pressable style={s.barBtn} onPress={() => navigation.navigate('Cart')}>
            <Text style={s.barBtnText}>Voir le panier</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  hero: { width: '100%', height: 240 },
  back: {
    position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },

  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    marginTop: -24, paddingTop: 20, paddingHorizontal: 16, paddingBottom: 4,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  name: { flex: 1, fontSize: 24, fontWeight: '800', color: colors.text },
  badge: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  open: { backgroundColor: '#dcfce7', color: '#166534' },
  closed: { backgroundColor: '#fee2e2', color: '#991b1b' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  lineText: { color: colors.muted, fontSize: 14 },
  description: { color: colors.text, marginTop: 8, lineHeight: 20 },
  closedBanner: {
    backgroundColor: '#fef3c7', color: '#92400e', padding: 10, borderRadius: 10, marginTop: 12, textAlign: 'center',
  },

  chips: { gap: 8, paddingTop: 16, paddingBottom: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  chipTextOn: { color: '#fff' },

  section: { fontSize: 18, fontWeight: '800', color: colors.text, paddingHorizontal: 16, marginTop: 18, marginBottom: 8 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginBottom: 10, padding: 10,
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: colors.border,
  },
  thumb: { width: 76, height: 76, borderRadius: 12 },
  itemName: { fontSize: 15, fontWeight: '700', color: colors.text },
  itemDescription: { color: colors.muted, fontSize: 12, marginTop: 2 },
  price: { color: colors.primary, fontWeight: '800', marginTop: 4 },

  add: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  qtyBox: { alignItems: 'center', gap: 6 },
  addSmall: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  minus: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  qty: { fontWeight: '800', color: colors.text, minWidth: 18, textAlign: 'center' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },

  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border,
  },
  barLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barCount: { color: colors.muted, fontSize: 12 },
  barTotal: { color: colors.text, fontSize: 17, fontWeight: '800' },
  barBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  barBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});