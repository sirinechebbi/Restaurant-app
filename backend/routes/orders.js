const express = require('express');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { toId, wrap, errorHandler, attachDetails } = require('../lib/orders');

const router = express.Router();
router.use(authenticate, authorize('CLIENT'));

function parseCoord(value, min, max) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

// Créer une commande
router.post('/', wrap(async (req, res) => {
  const { phone, address_details, payment_method, items } = req.body;
  const restaurantId = toId(req.body.restaurant_id);
  const latitude = parseCoord(req.body.latitude, -90, 90);
  const longitude = parseCoord(req.body.longitude, -180, 180);

  if (!restaurantId) return res.status(400).json({ message: 'restaurant_id obligatoire' });
  if (!phone || !String(phone).trim()) {
    return res.status(400).json({ message: 'Le numéro de téléphone est obligatoire' });
  }
  if (latitude === null || longitude === null) {
    return res.status(400).json({ message: 'La localisation (latitude, longitude) est obligatoire' });
  }
  if (!['ONLINE', 'CASH'].includes(payment_method)) {
    return res.status(400).json({ message: 'payment_method doit être ONLINE ou CASH' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Le panier est vide' });
  }

  // Regroupe les plats identiques et vérifie les quantités
  const wanted = new Map();
  for (const it of items) {
    const menuItemId = toId(it.menu_item_id);
    const qty = Number(it.quantity);
    if (!menuItemId || !Number.isInteger(qty) || qty < 1 || qty > 50) {
      return res.status(400).json({ message: 'Panier invalide (plat ou quantité incorrecte)' });
    }
    const key = menuItemId.toString();
    wanted.set(key, (wanted.get(key) || 0) + qty);
  }

  const restaurant = await prisma.restaurants.findFirst({ where: { id: restaurantId, is_active: true } });
  if (!restaurant) return res.status(404).json({ message: 'Restaurant introuvable' });
  if (!restaurant.is_open) return res.status(409).json({ message: 'Ce restaurant est fermé' });

  // Tous les plats doivent exister, être disponibles et appartenir à ce restaurant (RG3, RG10)
  const menuItems = await prisma.menu_items.findMany({
    where: {
      id: { in: [...wanted.keys()].map((k) => BigInt(k)) },
      restaurant_id: restaurantId,
      is_available: true,
    },
  });
  if (menuItems.length !== wanted.size) {
    return res.status(400).json({
      message: "Un ou plusieurs plats sont indisponibles ou n'appartiennent pas à ce restaurant",
    });
  }

  // Le total est calculé ici
  let totalCents = 0;
  const lines = menuItems.map((m) => {
    const quantity = wanted.get(m.id.toString());
    const unitCents = Math.round(Number(m.price) * 100);
    totalCents += unitCents * quantity;
    return { menu_item_id: m.id, quantity, unit_price: unitCents / 100 };
  });
  const total = totalCents / 100;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.orders.create({
      data: {
        client_id: BigInt(req.user.id),
        restaurant_id: restaurantId,
        phone: String(phone).trim(),
        latitude,
        longitude,
        address_details,
        payment_method,
        total,
      },
    });
    await tx.order_items.createMany({
      data: lines.map((l) => ({ order_id: created.id, ...l })),
    });
    await tx.payments.create({
      data: { order_id: created.id, amount: total, method: payment_method, status: 'PENDING' },
    });
    return created;
  });

  const [full] = await attachDetails([order]);
  res.status(201).json(full);
}));

// Mes commandes
router.get('/my', wrap(async (req, res) => {
  const orders = await prisma.orders.findMany({
    where: { client_id: BigInt(req.user.id) },
    orderBy: { created_at: 'desc' },
  });
  res.json(await attachDetails(orders));
}));

// Détail d'une de mes commandes
router.get('/:id', wrap(async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Id invalide' });
  const order = await prisma.orders.findFirst({ where: { id, client_id: BigInt(req.user.id) } });
  if (!order) return res.status(404).json({ message: 'Commande introuvable' });
  const [full] = await attachDetails([order]);
  res.json(full);
}));

// Paiement en ligne . Une fois payée, la commande devient visible pour les livreurs 
router.post('/:id/pay', wrap(async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Id invalide' });

  const order = await prisma.orders.findFirst({ where: { id, client_id: BigInt(req.user.id) } });
  if (!order) return res.status(404).json({ message: 'Commande introuvable' });
  if (order.payment_method !== 'ONLINE') {
    return res.status(400).json({ message: 'Cette commande se paie à la livraison' });
  }

  const paid = await prisma.$transaction(async (tx) => {
    const r = await tx.orders.updateMany({
      where: { id, status: 'PENDING', payment_status: 'UNPAID' },
      data: { payment_status: 'PAID' },
    });
    if (r.count === 0) return false;
    await tx.payments.updateMany({
      where: { order_id: id },
      data: { status: 'PAID', paid_at: new Date(), transaction_reference: `SIM-${Date.now()}` },
    });
    return true;
  });

  if (!paid) return res.status(409).json({ message: 'Paiement impossible (déjà payée ou commande annulée)' });
  const [full] = await attachDetails([await prisma.orders.findUnique({ where: { id } })]);
  res.json(full);
}));

// Annuler tant qu'aucun livreur n'a accepté (RF-C13)
router.put('/:id/cancel', wrap(async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Id invalide' });

  const result = await prisma.orders.updateMany({
    where: { id, client_id: BigInt(req.user.id), status: 'PENDING' },
    data: { status: 'CANCELLED' },
  });
  if (result.count === 0) {
    return res.status(409).json({ message: 'Impossible d\'annuler cette commande (introuvable ou déjà acceptée)' });
  }
  const [full] = await attachDetails([await prisma.orders.findUnique({ where: { id } })]);
  res.json(full);
}));

router.use(errorHandler);
module.exports = router;