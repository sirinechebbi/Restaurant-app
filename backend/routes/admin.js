const express = require('express');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');
const { attachDetails } = require('../lib/orders');
const router = express.Router();

router.use(authenticate, authorize('ADMIN'));

//recupere le restau depuis le token 
router.use((req, res, next) => {
  if (!req.user.restaurantId) {
    return res.status(403).json({ message: 'Aucun restaurant associé à ce compte' });
  }
  req.restaurantId = BigInt(req.user.restaurantId);
  next();
});

//les erreurs des fonctions async 
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function toId(value) {
  try { return BigInt(value); } catch { return null; }
}

// Garde uniquement les champs autorisés
function pick(body, keys) {
  const data = {};
  for (const key of keys) if (body[key] !== undefined) data[key] = body[key];
  return data;
}

router.get('/restaurant', wrap(async (req, res) => {
  res.json(await prisma.restaurants.findUnique({ where: { id: req.restaurantId } }));
}));

router.put('/restaurant', wrap(async (req, res) => {
  const data = pick(req.body, ['description', 'address', 'phone', 'logo_url',
                               'latitude', 'longitude', 'is_open']);
  res.json(await prisma.restaurants.update({ where: { id: req.restaurantId }, data }));
}));

// catégories 

router.post('/categories', wrap(async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Le nom est obligatoire' });
  const category = await prisma.categories.create({
    data: { restaurant_id: req.restaurantId, name, description },
  });
  res.status(201).json(category);
}));

router.get('/categories', wrap(async (req, res) => {
  res.json(await prisma.categories.findMany({
    where: { restaurant_id: req.restaurantId },
    orderBy: { id: 'asc' },
  }));
}));

router.put('/categories/:id', wrap(async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Id invalide' });

  const own = await prisma.categories.findFirst({ where: { id, restaurant_id: req.restaurantId } });
  if (!own) return res.status(404).json({ message: 'Catégorie introuvable' });

  const data = pick(req.body, ['name', 'description']);
  res.json(await prisma.categories.update({ where: { id }, data }));
}));

router.delete('/categories/:id', wrap(async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Id invalide' });

  const own = await prisma.categories.findFirst({ where: { id, restaurant_id: req.restaurantId } });
  if (!own) return res.status(404).json({ message: 'Catégorie introuvable' });

  const count = await prisma.menu_items.count({ where: { category_id: id } });
  if (count > 0) {
    return res.status(409).json({ message: 'Cette catégorie contient encore des plats' });
  }
  await prisma.categories.delete({ where: { id } });
  res.status(204).end();
}));

//  PLATS 

router.post('/menu-items', wrap(async (req, res) => {
  const { name, description, image_url, is_available } = req.body;
  const price = Number(req.body.price);
  const category_id = toId(req.body.category_id);

  if (!name || req.body.price === undefined || Number.isNaN(price) || price < 0) {
    return res.status(400).json({ message: 'Nom et prix valide obligatoires' });
  }
  if (!category_id) return res.status(400).json({ message: 'category_id obligatoire' });

  // La catégorie doit appartenir à CE restaurant
  const category = await prisma.categories.findFirst({
    where: { id: category_id, restaurant_id: req.restaurantId },
  });
  if (!category) return res.status(404).json({ message: 'Catégorie introuvable' });

  const item = await prisma.menu_items.create({
    data: { restaurant_id: req.restaurantId, category_id, name, description, price, image_url, is_available },
  });
  res.status(201).json(item);
}));

// Liste complète, y compris les plats indisponibles
router.get('/menu-items', wrap(async (req, res) => {
  res.json(await prisma.menu_items.findMany({
    where: { restaurant_id: req.restaurantId },
    orderBy: [{ category_id: 'asc' }, { id: 'asc' }],
  }));
}));

router.put('/menu-items/:id', wrap(async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Id invalide' });

  const own = await prisma.menu_items.findFirst({ where: { id, restaurant_id: req.restaurantId } });
  if (!own) return res.status(404).json({ message: 'Plat introuvable' });

  const data = pick(req.body, ['name', 'description', 'price', 'image_url', 'is_available', 'category_id']);

  if (data.price !== undefined) {
    data.price = Number(data.price);
    if (Number.isNaN(data.price) || data.price < 0) {
      return res.status(400).json({ message: 'Prix invalide' });
    }
  }
  if (data.category_id !== undefined) {
    const category_id = toId(data.category_id);
    const category = category_id && await prisma.categories.findFirst({
      where: { id: category_id, restaurant_id: req.restaurantId },
    });
    if (!category) return res.status(404).json({ message: 'Catégorie introuvable' });
    data.category_id = category_id;
  }

  res.json(await prisma.menu_items.update({ where: { id }, data }));
}));
//delete un plat
router.delete('/menu-items/:id', wrap(async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Id invalide' });

  const own = await prisma.menu_items.findFirst({ where: { id, restaurant_id: req.restaurantId } });
  if (!own) return res.status(404).json({ message: 'Plat introuvable' });

  // Un plat déjà commandé fait partie de l'historique : on ne le supprime pas
  const ordered = await prisma.order_items.count({ where: { menu_item_id: id } });
  if (ordered > 0) {
    return res.status(409).json({
      message: 'Ce plat a déjà été commandé : rends-le indisponible (is_available: false) au lieu de le supprimer',
    });
  }
  await prisma.menu_items.delete({ where: { id } });
  res.status(204).end();
}));
//  COMMANDES DE MON RESTAURANT 

router.get('/orders', wrap(async (req, res) => {
  const where = { restaurant_id: req.restaurantId };
  if (req.query.status) where.status = String(req.query.status).toUpperCase();
  const orders = await prisma.orders.findMany({ where, orderBy: { created_at: 'desc' }, take: 100 });
  res.json(await attachDetails(orders));
}));

router.get('/orders/:id', wrap(async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Id invalide' });
  const order = await prisma.orders.findFirst({ where: { id, restaurant_id: req.restaurantId } });
  if (!order) return res.status(404).json({ message: 'Commande introuvable' });
  const [full] = await attachDetails([order]);
  res.json(full);
}));

// l'Admin peut annuler tant que la commande n'est pas en livraison
router.put('/orders/:id/cancel', wrap(async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ message: 'Id invalide' });
  const result = await prisma.orders.updateMany({
    where: { id, restaurant_id: req.restaurantId, status: { in: ['PENDING', 'ACCEPTED'] } },
    data: { status: 'CANCELLED' },
  });
  if (result.count === 0) {
    return res.status(409).json({ message: 'Impossible d\'annuler cette commande' });
  }
  const [full] = await attachDetails([await prisma.orders.findUnique({ where: { id } })]);
  res.json(full);
}));
// ---------- GESTION DES ERREURS ----------

router.use((err, req, res, next) => {
  if (err.code === 'P2002') return res.status(409).json({ message: 'Cet élément existe déjà' });
  if (err.code === 'P2025') return res.status(404).json({ message: 'Introuvable' });
  console.error(err);
  res.status(500).json({ message: 'Erreur serveur' });
});

module.exports = router;