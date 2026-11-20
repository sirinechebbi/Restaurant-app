import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const MAX_QTY = 50;

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null); // { id, name }
  const [lines, setLines] = useState([]);             // { id, name, price, quantity }

  // Le panier est vidé à la déconnexion
  useEffect(() => {
    if (!user) {
      setLines([]);
      setRestaurant(null);
    }
  }, [user]);

   const newLine = (item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    quantity: 1,
    image_url: item.image_url || null,
  });
  
  function addItem(item, rest) {
    // Un panier = un seul restaurant (RG10)
    if (restaurant && restaurant.id !== rest.id && lines.length > 0) {
      Alert.alert(
        'Changer de restaurant ?',
        `Ton panier contient des plats de ${restaurant.name}. Le vider pour commander chez ${rest.name} ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Vider et continuer',
            style: 'destructive',
            onPress: () => {
              setRestaurant({ id: rest.id, name: rest.name });
              setLines([newLine(item)]);
            },
          },
        ]
      );
      return;
    }
    setRestaurant({ id: rest.id, name: rest.name });
    setLines((prev) => {
      const found = prev.find((l) => l.id === item.id);
      if (found) {
        return prev.map((l) => (l.id === item.id ? { ...l, quantity: Math.min(l.quantity + 1, MAX_QTY) } : l));
      }
      return [...prev, newLine(item)];
    });
  }

  function changeQty(id, delta) {
    const next = lines
      .map((l) => (l.id === id ? { ...l, quantity: Math.min(l.quantity + delta, MAX_QTY) } : l))
      .filter((l) => l.quantity > 0);
    setLines(next);
    if (next.length === 0) setRestaurant(null);
  }

  function clear() {
    setLines([]);
    setRestaurant(null);
  }

  const count = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);
  // Calcul en centimes pour éviter les erreurs d'arrondi
  const total = useMemo(
    () => lines.reduce((sum, l) => sum + Math.round(l.price * 100) * l.quantity, 0) / 100,
    [lines]
  );

  const quantityOf = (id) => lines.find((l) => l.id === id)?.quantity || 0;

  return (
    <CartContext.Provider value={{ restaurant, lines, count, total, addItem, changeQty, clear, quantityOf }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);