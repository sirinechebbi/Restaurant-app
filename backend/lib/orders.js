const prisma = require('../prisma');

function toId(value) {
  try { return BigInt(value); } catch { return null; }
}

// Envoie les erreurs async vers le gestionnaire d'erreurs
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Erreur serveur' });
};

// Ajoute à chaque commande : restaurant, client, livreur et plats 

async function attachDetails(orders) {
  if (orders.length === 0) return [];

  const orderIds = orders.map((o) => o.id);
  const items = await prisma.order_items.findMany({ where: { order_id: { in: orderIds } } });

  const menuIds = [...new Set(items.map((i) => i.menu_item_id))];
  const menu = await prisma.menu_items.findMany({
    where: { id: { in: menuIds } },
    select: { id: true, name: true },
  });

  const restaurantIds = [...new Set(orders.map((o) => o.restaurant_id))];
  const restaurants = await prisma.restaurants.findMany({
    where: { id: { in: restaurantIds } },
    select: { id: true, name: true, address: true, phone: true, latitude: true, longitude: true },
  });

  const userIds = [...new Set(orders.flatMap((o) => [o.client_id, o.driver_id]).filter(Boolean))];
  const users = await prisma.users.findMany({
    where: { id: { in: userIds } },
    select: { id: true, full_name: true, phone: true },
  });

  const menuById = new Map(menu.map((m) => [m.id, m]));
  const restaurantById = new Map(restaurants.map((r) => [r.id, r]));
  const userById = new Map(users.map((u) => [u.id, u]));

  return orders.map((o) => ({
    ...o,
    restaurant: restaurantById.get(o.restaurant_id) || null,
    client: userById.get(o.client_id) || null,
    driver: o.driver_id ? userById.get(o.driver_id) || null : null,
    items: items
      .filter((i) => i.order_id === o.id)
      .map((i) => ({
        menu_item_id: i.menu_item_id,
        name: menuById.get(i.menu_item_id)?.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
      })),
  }));
}

module.exports = { toId, wrap, errorHandler, attachDetails };