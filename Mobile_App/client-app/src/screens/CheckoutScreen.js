import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import api, { errorMessage } from '../api';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import { money } from '../orderUtils';
import { Button, ErrorBox, IconInput, colors } from '../ui';

const PAYMENTS = [
  { key: 'CASH', icon: 'cash-outline', title: 'À la livraison', hint: 'Tu paies le livreur en espèces' },
  { key: 'ONLINE', icon: 'card-outline', title: 'En ligne', hint: 'Paiement simulé (mode test)' },
];

function Card({ icon, title, children }) {
  return (
    <View style={s.card}>
      <View style={s.cardHead}>
        <View style={s.cardIcon}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={s.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function CheckoutScreen({ navigation }) {
  const { user } = useAuth();
  const { lines, restaurant, total, clear } = useCart();
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState(user.phone || '');
  const [details, setDetails] = useState('');
  const [coords, setCoords] = useState(null);
  const [payment, setPayment] = useState('CASH');
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function locate() {
    setError('');
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError("Autorise l'accès à la position, sinon le livreur ne pourra pas te trouver.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch (err) {
      setError("Impossible d'obtenir ta position. Active le GPS et réessaie.");
    } finally {
      setLocating(false);
    }
  }

  async function submit() {
    setError('');
    if (!phone.trim()) return setError('Le numéro de téléphone est obligatoire');
    if (!coords) return setError('Partage ta position pour que le livreur te trouve');

    setLoading(true);
    try {
      const { data: order } = await api.post('/orders', {
        restaurant_id: restaurant.id,
        items: lines.map((l) => ({ menu_item_id: l.id, quantity: l.quantity })),
        phone: phone.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
        address_details: details.trim() || undefined,
        payment_method: payment,
      });

      // Paiement en ligne SIMULÉ : s'il échoue, le bouton « Payer » reste disponible dans la commande
      if (payment === 'ONLINE') {
        try { await api.post(`/orders/${order.id}/pay`); } catch (e) { /* géré dans le détail */ }
      }

      clear();
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Home', params: { screen: 'Orders' } },
          { name: 'OrderDetail', params: { orderId: order.id } },
        ],
      });
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  }

  if (lines.length === 0) {
    return <Text style={{ padding: 24, textAlign: 'center' }}>Ton panier est vide.</Text>;
  }

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={[s.container, { paddingBottom: 120 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ErrorBox message={error} />

        <Card icon="call-outline" title="Téléphone">
          <Text style={s.hint}>Le livreur t'appellera à ce numéro.</Text>
          <IconInput icon="call-outline" placeholder="Téléphone" value={phone}
                     onChangeText={setPhone} keyboardType="phone-pad" />
        </Card>

        <Card icon="location-outline" title="Ma position">
          {coords ? (
            <View style={s.located}>
              <Ionicons name="checkmark-circle" size={20} color="#166534" />
              <View style={{ flex: 1 }}>
                <Text style={s.locatedTitle}>Position enregistrée</Text>
                <Text style={s.locatedCoords}>
                  {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                </Text>
              </View>
              <Pressable
                onPress={() => Linking.openURL(`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`)}
                hitSlop={8}
              >
                <Text style={s.link}>Vérifier</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={s.hint}>Partage ta position pour que le livreur te trouve facilement.</Text>
          )}
          <Button title={coords ? 'Mettre à jour ma position' : 'Utiliser ma position'}
                  onPress={locate} loading={locating} secondary={!!coords} />
          <IconInput icon="home-outline" placeholder="Précisions : étage, point de repère (facultatif)"
                     value={details} onChangeText={setDetails} />
        </Card>

        <Card icon="card-outline" title="Paiement">
          {PAYMENTS.map((o) => {
            const on = payment === o.key;
            return (
              <Pressable key={o.key} style={[s.option, on && s.optionOn]} onPress={() => setPayment(o.key)}>
                <Ionicons name={o.icon} size={22} color={on ? colors.primary : colors.muted} />
                <View style={{ flex: 1 }}>
                  <Text style={s.optionTitle}>{o.title}</Text>
                  <Text style={s.optionHint}>{o.hint}</Text>
                </View>
                <View style={[s.radio, on && s.radioOn]}>
                  {on && <View style={s.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </Card>

        <Card icon="receipt-outline" title={`Récapitulatif · ${restaurant?.name}`}>
          {lines.map((l) => (
            <View style={s.summaryRow} key={l.id}>
              <Text style={s.summaryText} numberOfLines={1}>{l.quantity} × {l.name}</Text>
              <Text style={s.summaryText}>{money(l.price * l.quantity)}</Text>
            </View>
          ))}
          <View style={[s.summaryRow, s.summaryTotal]}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>{money(total)}</Text>
          </View>
        </Card>
      </ScrollView>

      <View style={[s.bar, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={s.barLabel}>Total à payer</Text>
          <Text style={s.barTotal}>{money(total)}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 20 }}>
          <Button title="Confirmer la commande" onPress={submit} loading={loading} />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 16, gap: 14 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text },
  hint: { color: colors.muted, fontSize: 13 },

  located: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdf4',
    borderRadius: 12, padding: 12,
  },
  locatedTitle: { color: '#166534', fontWeight: '700' },
  locatedCoords: { color: colors.muted, fontSize: 12, marginTop: 2 },
  link: { color: colors.primary, fontWeight: '700' },

  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff',
  },
  optionOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionTitle: { fontWeight: '700', color: colors.text },
  optionHint: { color: colors.muted, fontSize: 12, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  summaryText: { color: colors.text, flexShrink: 1 },
  summaryTotal: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  totalLabel: { fontWeight: '800', color: colors.text },
  totalValue: { fontWeight: '800', color: colors.primary },

  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  barLabel: { color: colors.muted, fontSize: 12 },
  barTotal: { color: colors.text, fontSize: 18, fontWeight: '800' },
});