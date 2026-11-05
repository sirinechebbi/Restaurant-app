const express = require('express');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { toId, wrap, errorHandler, attachDetails } = require('../lib/orders');

const router = express.Router();
router.use(authenticate, authorize('DRIVER'));


async function availableWhere() {
  const active = await prisma.restaurants.findMany({ where: { is_active: true }, select: { id: true } });
  return {
    status: 'PENDING',
    driver_id: null,
    restaurant_id: { in: active.map((r) => r.id) },
    OR: [{ payment_method: 'CASH' }, { payment_status: 'PAID' }],
  };
}

// Liste des commandes disponibles 
router.get('/orders/available', wrap(async (req, res) => {
  const orders = await prisma.orders.findMany({
    where: await availableWhere(),
    orderBy: { created_at: 'asc' },
  });
  const detailed = await attachDetails(orders);
  res.json(detailed.map((o) => ({
    id: o.id,
    created_at: o.created_at,
    total: o.total,
    payment_method: o.payment_method,
    restaurant: o.restaurant && {
      name: o.restaurant.name,
      address: o.restaurant.address,
      latitude: o.restaurant.latitude,
      longitude: o.restaurant.longitude,
    },
    items_count: o.items.reduce((sum, i) => sum + i.quantity, 0),
  })));
}));

// Accepter une commande
router.put('/orders/:id/accept', wrap(async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Id invalide' });
  const result = await prisma.orders.updateMany({
    where: { ...(await availableWhere()), id },
    data: { driver_id: BigInt(req.user.id), status: 'ACCEPTED', accepted_at: new Date() },
  });
  if (result.count === 0) {
    return res.status(409).json({ message: "Cette commande n'est plus disponible" });
  }

  //le livreur voit le téléphone et la position du client
  const [full] = await attachDetails([await prisma.orders.findUnique({ where: { id } })]);
  res.json(full);
}));

// Mes livraisons (en cours et historique), avec les coordonnées du client
router.get('/orders/my', wrap(async (req, res) => {
  const orders = await prisma.orders.findMany({
    where: { driver_id: BigInt(req.user.id) },
    orderBy: { created_at: 'desc' },
  });
  res.json(await attachDetails(orders));
}));

// ACCEPTED -> ON_DELIVERY -> DELIVERED
const PREVIOUS = { ON_DELIVERY: 'ACCEPTED', DELIVERED: 'ON_DELIVERY' };

router.put('/orders/:id/status', wrap(async (req, res) => {
  const id = toId(req.params.id);
  const { status } = req.body;
  if (!id) return res.status(400).json({ message: 'Id invalide' });
  if (!PREVIOUS[status]) {
    return res.status(400).json({ message: 'status doit être ON_DELIVERY ou DELIVERED' });
  }

  const changed = await prisma.$transaction(async (tx) => {
    const data = status === 'DELIVERED' ? { status, delivered_at: new Date() } : { status };
    const r = await tx.orders.updateMany({
      where: { id, driver_id: BigInt(req.user.id), status: PREVIOUS[status] },
      data,
    });
    if (r.count === 0) return false;

    if (status === 'DELIVERED') {
      await tx.orders.updateMany({ where: { id, payment_method: 'CASH' }, data: { payment_status: 'PAID' } });
      await tx.payments.updateMany({
        where: { order_id: id, method: 'CASH' },
        data: { status: 'PAID', paid_at: new Date() },
      });
    }
    return true;
  });

  if (!changed) {
    return res.status(409).json({
      message: "Changement impossible : commande introuvable, qui n'est pas la tienne, ou statuts dans le mauvais ordre",
    });
  }
  const [full] = await attachDetails([await prisma.orders.findUnique({ where: { id } })]);
  res.json(full);
}));

router.use(errorHandler);
module.exports = router;