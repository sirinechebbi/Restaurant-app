import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api, { errorMessage } from '../api';
import { StatusBadge, money } from '../orderUtils';
import { Button, ErrorBox, colors } from '../ui';

const ACTIVE = ['PENDING', 'ACCEPTED', 'ON_DELIVERY'];
const TABS = [
  { key: 'active', label: 'En cours' },
  { key: 'done', label: 'Historique' },
];

function itemsSummary(items) {
  if (!items || items.length === 0) return '';
  const first = items.slice(0, 2).map((i) => `${i.quantity} × ${i.name}`).join(', ');
  return items.length > 2 ? `${first} +${items.length - 2}` : first;
}

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('active');
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/orders/my');
      setOrders(data);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoaded(true);
    }
  }, []);

  // Charge à l'ouverture de l'écran, puis toutes les 10 secondes tant qu'il est visible
  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(load, 10000);
      return () => clearInterval(timer);
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const activeCount = orders.filter((o) => ACTIVE.includes(o.status)).length;
  const shown = orders.filter((o) => (tab === 'active') === ACTIVE.includes(o.status));

  return (
    <SafeAreaView edges={['top']} style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Mes commandes</Text>
      </View>

      <View style={s.tabs}>
        {TABS.map((t) => (
          <Pressable key={t.key} style={[s.tab, tab === t.key && s.tabOn]} onPress={() => setTab(t.key)}>
            <Text style={[s.tabText, tab === t.key && s.tabTextOn]}>
              {t.label}{t.key === 'active' && activeCount > 0 ? ` (${activeCount})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      <ErrorBox message={error} />

      <FlatList
        data={shown}
        keyExtractor={(o) => o.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loaded || error ? null : (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <Ionicons name="receipt-outline" size={40} color={colors.primary} />
              </View>
              <Text style={s.emptyTitle}>
                {tab === 'active' ? 'Aucune commande en cours' : 'Aucune commande terminée'}
              </Text>
              <Text style={s.emptyText}>
                {tab === 'active' ? "Passe une commande, elle apparaîtra ici." : 'Tes commandes livrées ou annulées apparaîtront ici.'}
              </Text>
              {tab === 'active' && (
                <View style={{ width: '100%', marginTop: 20 }}>
                  <Button title="Voir les restaurants" onPress={() => navigation.navigate('Restaurants')} />
                </View>
              )}
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable style={s.card} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
            <View style={s.cardIcon}>
              <Ionicons name="restaurant-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={s.row}>
                <Text style={s.name} numberOfLines={1}>{item.restaurant?.name}</Text>
                <Text style={s.total}>{money(item.total)}</Text>
              </View>
              <Text style={s.items} numberOfLines={1}>{itemsSummary(item.items)}</Text>
              <Text style={s.muted}>
                #{item.id} · {new Date(item.created_at).toLocaleString('fr-FR')}
              </Text>
              <View style={{ marginTop: 4 }}>
                <StatusBadge status={item.status} />
              </View>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },

  tabs: {
    flexDirection: 'row', marginHorizontal: 16, backgroundColor: colors.border,
    borderRadius: 12, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  tabOn: { backgroundColor: '#fff' },
  tabText: { color: colors.muted, fontWeight: '600' },
  tabTextOn: { color: colors.primary, fontWeight: '800' },

  card: {
    flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  cardIcon: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text },
  total: { fontWeight: '800', color: colors.primary },
  items: { color: colors.text, fontSize: 13 },
  muted: { color: colors.muted, fontSize: 12 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptyText: { color: colors.muted, textAlign: 'center', marginTop: 6 },
});