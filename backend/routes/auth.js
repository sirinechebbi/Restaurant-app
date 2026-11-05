const express = require('express');//creer les routes API
const bcrypt = require('bcryptjs');//hash mot de passe
const jwt = require('jsonwebtoken');//cree le token
const prisma = require('../prisma');//communiquer avec la bd
const { authenticate } = require('../middleware/auth');

const router = express.Router(); //cree le routeur

router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;
    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }
    if (password.length < 6 ) {
      return res.status(400).json({ message: 'Mot de passe trop court (6 caractères minimum)' });
    }
    const regexPhone = /^\d+$/;
    if (!regexPhone.test(phone)) {
      return res.status(400).json({ message: 'Le numéro de téléphone doit contenir uniquement des chiffres' });
    }

    const exists = await prisma.users.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Cet email est déjà utilisé' });

    const password_hash = await bcrypt.hash(password, 10);
    //ajout  d'un user dans la base 
    const user = await prisma.users.create({
      data: { full_name, email, phone, password_hash, role: 'CLIENT' },
    });

    const { password_hash: _, ...safeUser } = user; // on n'envoie jamais le hash
    res.status(201).json(safeUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Connexion : pour tous les rôles
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe obligatoires' });
    }

    const user = await prisma.users.findUnique({ where: { email } });
    const valid = user && (await bcrypt.compare(password, user.password_hash));
    if (!valid) return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    if (!user.is_active) return res.status(403).json({ message: 'Compte désactivé' });

    const token = jwt.sign(
      {
        id: user.id.toString(),
        role: user.role,
        restaurantId: user.restaurant_id ? user.restaurant_id.toString() : null,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const {password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Profil de l'utilisateur connecté
router.get('/me', authenticate, async (req, res) => {
  //findUnique() recherche l'utilisateur dans la base de données
  const user = await prisma.users.findUnique({ where: { id: BigInt(req.user.id) } });
  if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
  const { password_hash, ...safeUser } = user;
  res.json(safeUser);
});

module.exports = router;