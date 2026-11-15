const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { attachDetails } = require('../lib/orders');

const router = express.Router();

// Toutes les routes de ce fichier sont réservées au SuperAdmin
router.use(authenticate, authorize('SUPER_ADMIN'));

// Convertit un id reçu (texte ou nombre) en BigInt, ou null s'il est invalide
function toId(value) {
  try { return BigInt(value); } catch { return null; }
}

// Retire le mot de passe haché avant d'envoyer un utilisateur
function withoutHash(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

// Crée un compte ADMIN ou DRIVER 
async function createAccount(req, res, role) {
  try {
    const { full_name, email, phone, password } = req.body;
    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mot de passe trop court (6 caractères minimum)' });
    }

    let restaurant_id = null;
    if (role === 'ADMIN') {
      restaurant_id = toId(req.body.restaurant_id);
      if (!restaurant_id) {
        return res.status(400).json({ message: 'restaurant_id obligatoire pour un Admin' });
      }
      const restaurant = await prisma.restaurants.findUnique({ where: { id: restaurant_id } });
      if (!restaurant) return res.status(404).json({ message: 'Restaurant introuvable' });
    }

    const exists = await prisma.users.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Cet email est déjà utilisé' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      data: { full_name, email, phone, password_hash, role, restaurant_id },
    });
    res.status(201).json(withoutHash(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// creation des restaurants 

router.post('/restaurants', async (req, res) => {
  try {
    const { name, description, address, phone, logo_url, latitude, longitude } = req.body;
    if (!name) return res.status(400).json({ message: 'Le nom est obligatoire' });

    const restaurant = await prisma.restaurants.create({
      data: { name, description, address, phone, logo_url, latitude, longitude },
    });
    res.status(201).json(restaurant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Lister tous les restaurants
router.get('/restaurants', async (req, res) => {
  const restaurants = await prisma.restaurants.findMany({ orderBy: { id: 'asc' } });
  res.json(restaurants);
});

// Modifier un restaurant, ou le suspendre avec { "is_active": false }
router.put('/restaurants/:id', async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Id invalide' });

  const allowed = ['name', 'description', 'address', 'phone', 'logo_url',
                   'latitude', 'longitude', 'is_active', 'is_open'];
  const data = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }

  try {
    const restaurant = await prisma.restaurants.update({ where: { id }, data });
    res.json(restaurant);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Restaurant introuvable' });
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// COMPTES ADMIN 

router.post('/admins', (req, res) => createAccount(req, res, 'ADMIN'));

router.get('/admins', async (req, res) => {
  const admins = await prisma.users.findMany({ where: { role: 'ADMIN' }, orderBy: { id: 'asc' } });
  res.json(admins.map(withoutHash));
});

// LIVREURS

router.post('/drivers', (req, res) => createAccount(req, res, 'DRIVER'));

router.get('/drivers', async (req, res) => {
  const drivers = await prisma.users.findMany({ where: { role: 'DRIVER' }, orderBy: { id: 'asc' } });
  res.json(drivers.map(withoutHash));
});

// ACTIVER / DÉSACTIVER UN COMPTE 

router.put('/users/:id/active', async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Id invalide' });
  if (typeof req.body.is_active !== 'boolean') {
    return res.status(400).json({ message: 'is_active doit être true ou false' });
  }

  const user = await prisma.users.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
  if (user.role === 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Impossible de modifier un SuperAdmin' });
  }
  const updated = await prisma.users.update({
    where: { id },
    data: { is_active: req.body.is_active },
  });
  res.json(withoutHash(updated));
});

// ---------- SUPPRESSIONS ----------

// Supprime un compte ADMIN ou DRIVER
async function deleteAccount(req, res, role) {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Id invalide' });

    const user = await prisma.users.findFirst({ where: { id, role } });
    if (!user) return res.status(404).json({ message: 'Compte introuvable' });

    if (role === 'DRIVER') {
      const deliveries = await prisma.orders.count({ where: { driver_id: id } });
      if (deliveries > 0) {
        return res.status(409).json({
          message: 'Ce livreur a déjà des livraisons : désactive son compte au lieu de le supprimer',
        });
      }
    }

    await prisma.users.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

router.delete('/admins/:id', (req, res) => deleteAccount(req, res, 'ADMIN'));
router.delete('/drivers/:id', (req, res) => deleteAccount(req, res, 'DRIVER'));

router.delete('/restaurants/:id', async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Id invalide' });

    const restaurant = await prisma.restaurants.findUnique({ where: { id } });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant introuvable' });

    const orders = await prisma.orders.count({ where: { restaurant_id: id } });
    if (orders > 0) {
      return res.status(409).json({
        message: 'Ce restaurant a déjà des commandes : suspends-le au lieu de le supprimer',
      });
    }

    await prisma.$transaction([
      prisma.menu_items.deleteMany({ where: { restaurant_id: id } }),
      prisma.categories.deleteMany({ where: { restaurant_id: id } }),
      prisma.users.deleteMany({ where: { restaurant_id: id, role: 'ADMIN' } }),
      prisma.restaurants.delete({ where: { id } }),
    ]);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
// ---------- SUPERVISION ----------

// Toutes les commandes de la plateforme (filtres : status, restaurant_id)
router.get('/orders', async (req, res) => {
  try {
    const where = {};
    if (req.query.status) where.status = String(req.query.status).toUpperCase();
    if (req.query.restaurant_id) {
      const restaurantId = toId(req.query.restaurant_id);
      if (!restaurantId) return res.status(400).json({ message: 'restaurant_id invalide' });
      where.restaurant_id = restaurantId;
    }
    const orders = await prisma.orders.findMany({ where, orderBy: { created_at: 'desc' }, take: 200 });
    res.json(await attachDetails(orders));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/clients', async (req, res) => {
  try {
    const clients = await prisma.users.findMany({ where: { role: 'CLIENT' }, orderBy: { id: 'asc' } });
    res.json(clients.map(withoutHash));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Statistiques globales : le chiffre d'affaires compte uniquement les commandes livrées
router.get('/stats', async (req, res) => {
  try {
    const [byStatus, revenue, perRestaurant, perDriver, restaurants, drivers, clients] = await Promise.all([
      prisma.orders.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.orders.aggregate({ where: { status: 'DELIVERED' }, _sum: { total: true } }),
      prisma.orders.groupBy({
        by: ['restaurant_id'], where: { status: 'DELIVERED' },
        _count: { _all: true }, _sum: { total: true },
      }),
      prisma.orders.groupBy({ by: ['driver_id'], where: { status: 'DELIVERED' }, _count: { _all: true } }),
      prisma.restaurants.findMany({ select: { id: true, name: true }, orderBy: { id: 'asc' } }),
      prisma.users.findMany({ where: { role: 'DRIVER' }, select: { id: true, full_name: true }, orderBy: { id: 'asc' } }),
      prisma.users.count({ where: { role: 'CLIENT' } }),
    ]);

    const restaurantStats = new Map(perRestaurant.map((r) => [r.restaurant_id, r]));
    const driverStats = new Map(perDriver.map((d) => [d.driver_id, d]));

    res.json({
      total_orders: byStatus.reduce((sum, s) => sum + s._count._all, 0),
      by_status: Object.fromEntries(byStatus.map((s) => [s.status, s._count._all])),
      revenue: Number(revenue._sum.total || 0),
      clients,
      restaurants: restaurants.map((r) => ({
        id: r.id,
        name: r.name,
        delivered_orders: restaurantStats.get(r.id)?._count._all || 0,
        revenue: Number(restaurantStats.get(r.id)?._sum.total || 0),
      })),
      drivers: drivers.map((d) => ({
        id: d.id,
        name: d.full_name,
        deliveries: driverStats.get(d.id)?._count._all || 0,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;