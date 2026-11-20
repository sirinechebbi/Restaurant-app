import { useCallback, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api, { errorMessage } from '../api';
import { StatusBadge, StatusTracker, money, paymentLabel } from '../orderUtils';
import { Button, ErrorBox, colors } from '../ui';

function Card({ icon, title, children }) {
  return (
    <View style={s.card}>
      {title ? (
        <View style={s.cardHead}>
          <View style={s.cardIcon}>
            <Ionicons name={icon} size={16} color={colors.primary} />
          </View>
          <Text style={s.cardTitle}>{title}</Text>
        </View>
      ) : null}
      {children}
    </View>
  );
}

export default function OrderDetailScreen({ route }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setOrder(data);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(load, 10000);
      return () => clearInterval(timer);
    }, [load])
  );

  async function act(request) {
    setError('');
    setBusy(true);
    try {
      const { data } = await request();
      setOrder(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const pay = () => act(() => api.post(`/orders/${orderId}/pay`));

  function cancel() {
    Alert.alert('Annuler la commande ?', 'Cette action est définitive.', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui, annuler', style: 'destructive', onPress: () => act(() => api.put(`/orders/${orderId}/cancel`)) },
    ]);
  }

  if (!order) {
    return <Text style={{ padding: 24, textAlign: 'center' }}>{error || 'Chargement...'}</Text>;
  }

  const canPay = order.status === 'PENDING' && order.payment_method === 'ONLINE' && order.payment_status === 'UNPAID';
  const cancelled = order.status === 'CANCELLED';

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={s.container}
                showsVerticalScrollIndicator={false}>
      <ErrorBox message={error} />

      <Card>
        <View style={s.row}>
          <Text style={s.title} numberOfLines={1}>{order.restaurant?.name}</Text>
          <StatusBadge status={order.status} />
        </View>
        <Text style={s.muted}>
          Commande #{order.id} · {new Date(order.created_at).toLocaleString('fr-FR')}
        </Text>
      </Card>

      <Card icon="navigate-outline" title="Suivi">
        {cancelled ? (
          <View style={s.cancelled}>
            <Ionicons name="close-circle" size={22} color="#991b1b" />
            <Text style={s.cancelledText}>Cette commande a été annulée.</Text>
          </View>
        ) : (
          <>
            <StatusTracker status={order.status} />
            {order.status === 'PENDING' && <Text style={s.hint}>En attente d'un livreur...</Text>}
            {order.status === 'DELIVERED' && <Text style={s.done}>Ta commande a été livrée. Bon appétit !</Text>}
          </>
        )}
      </Card>

      {order.driver && (
        <Card icon="bicycle-outline" title="Ton livreur">
          <View style={s.driver}>
            <View style={s.avatar}>
              <Ionicons name="person" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.driverName}>{order.driver.full_name}</Text>
              <Text style={s.muted}>{order.driver.phone}</Text>
            </View>
          </View>
          <Button title={`Appeler ${order.driver.phone}`}
                  onPress={() => Linking.openURL(`tel:${order.driver.phone}`)} secondary />
        </Card>
      )}

      <Card icon="restaurant-outline" title="Plats">
        {order.items.map((i) => (
          <View style={s.row} key={i.menu_item_id}>
            <Text style={s.item}>{i.quantity} × {i.name}</Text>
            <Text style={s.item}>{money(i.unit_price * i.quantity)}</Text>
          </View>
        ))}
        <View style={[s.row, s.totalRow]}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalValue}>{money(order.total)}</Text>
        </View>
        <View style={s.payment}>
          <Ionicons name={order.payment_method === 'CASH' ? 'cash-outline' : 'card-outline'} size={18} color={colors.muted} />
          <Text style={s.muted}>{paymentLabel(order)}</Text>
        </View>
      </Card>

      <Card icon="location-outline" title="Livraison">
        <Text style={s.item}>Téléphone : {order.phone}</Text>
        {order.address_details ? <Text style={s.item}>Adresse : {order.address_details}</Text> : null}
      </Card>

      {canPay && <Button title={`Payer ${money(order.total)} (simulation)`} onPress={pay} loading={busy} />}
      {order.status === 'PENDING' && <Button title="Annuler la commande" onPress={cancel} loading={busy} secondary />}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  cardIcon: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 19, fontWeight: '800', color: colors.text },
  muted: { color: colors.muted, fontSize: 13 },
  item: { color: colors.text },
  hint: { color: colors.muted, textAlign: 'center', marginTop: 4 },
  done: { color: '#166534', fontWeight: '700', textAlign: 'center', marginTop: 4 },
  cancelled: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fee2e2',
    borderRadius: 12, padding: 12,
  },
  cancelledText: { color: '#991b1b', fontWeight: '700' },
  driver: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  driverName: { fontSize: 16, fontWeight: '800', color: colors.text },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  totalLabel: { fontWeight: '800', color: colors.text },
  totalValue: { fontWeight: '800', color: colors.primary },
  payment: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});