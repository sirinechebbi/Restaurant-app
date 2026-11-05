const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
const { authenticate, authorize } = require('../middleware/auth');

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

module.exports = router;