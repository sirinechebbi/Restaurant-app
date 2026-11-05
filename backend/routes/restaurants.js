const express = require('express');
const prisma = require('../prisma');

const router = express.Router();

function toId(value) {
  try { return BigInt(value); } catch { return null; }
}

// Liste des restaurants actifs  is_open indique s'ils sont ouverts
router.get('/', async (req, res) => {
  try {
    const restaurants = await prisma.restaurants.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });
    res.json(restaurants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Menu d'un restaurant : catégories avec leurs plats disponibles
router.get('/:id/menu', async (req, res) => {
  try {
    const id = toId(req.params.id);
    if (!id) return res.status(400).json({ message: 'Id invalide' });

    const restaurant = await prisma.restaurants.findFirst({ where: { id, is_active: true } });
    if (!restaurant) return res.status(404).json({ message: 'Restaurant introuvable' });

    const categories = await prisma.categories.findMany({
      where: { restaurant_id: id },
      orderBy: { id: 'asc' },
    });
    const items = await prisma.menu_items.findMany({
      where: { restaurant_id: id, is_available: true },
      orderBy: { id: 'asc' },
    });

    res.json({
      restaurant,
      categories: categories
        .map((c) => ({ ...c, items: items.filter((i) => i.category_id === c.id) }))
        .filter((c) => c.items.length > 0), // on cache les catégories vides
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;