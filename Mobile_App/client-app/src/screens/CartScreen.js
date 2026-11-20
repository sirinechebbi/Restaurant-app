import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../CartContext';
import Photo from '../Photo';
import { money } from '../orderUtils';
import { Button, colors } from '../ui';

export default function CartScreen({ navigation }) {
  const { lines, restaurant, count, total, changeQty, clear } = useCart();
  const insets = useSafeAreaInsets();

  function confirmClear() {
    Alert.alert('Vider le panier ?', 'Tous les plats seront retirés.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Vider', style: 'destructive', onPress: () => clear() },
    ]);
  }

  if (lines.length === 0) {
    return (
      <View style={s.empty}>
        <View style={s.emptyIcon}>
          <Ionicons name="cart-outline" size={44} color={colors.primary} />
        </View>
        <Text style={s.emptyTitle}>Ton panier est vide</Text>
        <Text style={s.emptyText}>Ajoute des plats depuis le menu d'un restaurant.</Text>
        <View style={{ width: '100%', marginTop: 20 }}>
          <Button title="Voir les restaurants" onPress={() => navigation.popToTop()} />
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <FlatList
        data={lines}
        keyExtractor={(l) => l.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 130 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={s.restaurant}>
            <View style={s.restaurantIcon}>
              <Ionicons name="storefront-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.restaurantLabel}>Commande chez</Text>
              <Text style={s.restaurantName} numberOfLines={1}>{restaurant?.name}</Text>
            </View>
            <Pressable onPress={confirmClear} hitSlop={8}>
              <Text style={s.clear}>Vider</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.line}>
            <Photo key={item.image_url || 'none'} uri={item.image_url} style={s.thumb} fontSize={26} />
            <View style={{ flex: 1 }}>
              <Text style={s.name} numberOfLines={2}>{item.name}</Text>
              <Text style={s.unit}>{money(item.price)} l'unité</Text>
              <Text style={s.lineTotal}>{money(item.price * item.quantity)}</Text>
            </View>
            <View style={s.qtyBox}>
              <Pressable style={s.minus} onPress={() => changeQty(item.id, -1)} hitSlop={6}>
                <Ionicons
                  name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                  size={18}
                  color={item.quantity === 1 ? colors.danger : colors.text}
                />
              </Pressable>
              <Text style={s.qty}>{item.quantity}</Text>
              <Pressable style={s.plus} onPress={() => changeQty(item.id, 1)} hitSlop={6}>
                <Ionicons name="add" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={s.summary}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Articles</Text>
              <Text style={s.summaryValue}>{count}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Sous-total</Text>
              <Text style={s.summaryValue}>{money(total)}</Text>
            </View>
          </View>
        }
      />

      <View style={[s.bar, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={s.barLabel}>Total</Text>
          <Text style={s.barTotal}>{money(total)}</Text>
        </View>
        <Pressable style={s.barBtn} onPress={() => navigation.navigate('Checkout')}>
          <Text style={s.barBtnText}>Continuer</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  empty: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  emptyText: { color: colors.muted, textAlign: 'center', marginTop: 6 },

  restaurant: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff',
    borderRadius: 14, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: colors.border,
  },
  restaurantIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  restaurantLabel: { color: colors.muted, fontSize: 12 },
  restaurantName: { color: colors.text, fontSize: 16, fontWeight: '800' },
  clear: { color: colors.danger, fontWeight: '700' },

  line: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14,
    padding: 10, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  thumb: { width: 68, height: 68, borderRadius: 12 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  unit: { color: colors.muted, fontSize: 12, marginTop: 2 },
  lineTotal: { color: colors.primary, fontWeight: '800', marginTop: 4 },
  qtyBox: { alignItems: 'center', gap: 6 },
  plus: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  minus: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  qty: { fontWeight: '800', color: colors.text, minWidth: 18, textAlign: 'center' },

  summary: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 4, gap: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: colors.muted },
  summaryValue: { color: colors.text, fontWeight: '700' },

  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border,
  },
  barLabel: { color: colors.muted, fontSize: 12 },
  barTotal: { color: colors.text, fontSize: 20, fontWeight: '800' },
  barBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary,
    borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14,
  },
  barBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});