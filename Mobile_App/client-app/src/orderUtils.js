import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './ui';

export const STATUS_LABEL = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée par un livreur',
  ON_DELIVERY: 'En livraison',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

const STATUS_COLOR = {
  PENDING: { bg: '#fef3c7', fg: '#92400e' },
  ACCEPTED: { bg: '#dbeafe', fg: '#1e40af' },
  ON_DELIVERY: { bg: '#e0e7ff', fg: '#3730a3' },
  DELIVERED: { bg: '#dcfce7', fg: '#166534' },
  CANCELLED: { bg: '#fee2e2', fg: '#991b1b' },
};

export const money = (n) => `${Number(n).toFixed(2)} DT`;

export function paymentLabel(order) {
  if (order.payment_method === 'CASH') {
    return order.payment_status === 'PAID' ? 'Payée à la livraison' : 'À payer à la livraison';
  }
  return order.payment_status === 'PAID' ? 'Payée en ligne' : 'Paiement en ligne en attente';
}

export function StatusBadge({ status }) {
  const c = STATUS_COLOR[status] || STATUS_COLOR.PENDING;
  return (
    <Text style={[s.badge, { backgroundColor: c.bg, color: c.fg }]}>{STATUS_LABEL[status] || status}</Text>
  );
}

const STEPS = ['PENDING', 'ACCEPTED', 'ON_DELIVERY', 'DELIVERED'];
const STEP_LABEL = { PENDING: 'Reçue', ACCEPTED: 'Acceptée', ON_DELIVERY: 'En livraison', DELIVERED: 'Livrée' };

// Suivi en 4 étapes : les étapes déjà atteintes sont colorées
export function StatusTracker({ status }) {
  const current = STEPS.indexOf(status);
  return (
    <View style={t.row}>
      {STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <View key={step} style={t.item}>
            <View style={t.top}>
              <View style={[t.line, i === 0 && t.hidden, done && t.lineOn]} />
              <View style={[t.dot, done && t.dotOn]}>
                {done && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <View style={[t.line, i === STEPS.length - 1 && t.hidden, i < current && t.lineOn]} />
            </View>
            <Text style={[t.label, done && t.labelOn]} numberOfLines={1}>{STEP_LABEL[step]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 999, overflow: 'hidden', alignSelf: 'flex-start',
  },
});

const t = StyleSheet.create({
  row: { flexDirection: 'row' },
  item: { flex: 1, alignItems: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  line: { flex: 1, height: 3, backgroundColor: colors.border },
  lineOn: { backgroundColor: colors.primary },
  hidden: { opacity: 0 },
  dot: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dotOn: { backgroundColor: colors.primary },
  label: { marginTop: 6, fontSize: 11, color: colors.muted, textAlign: 'center' },
  labelOn: { color: colors.text, fontWeight: '700' },
});