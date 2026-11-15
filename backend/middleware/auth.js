const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
//verifie le token JWT
// Vérifie le token, puis que le compte existe toujours et est actif
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Token manquant' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: BigInt(payload.id) },
      select: { is_active: true, role: true, restaurant_id: true },
    });
    if (!user || !user.is_active) {
      return res.status(401).json({ message: 'Compte supprimé ou désactivé' });
    }
    // Rôle et restaurant lus dans la base : toujours à jour
    req.user = {
      id: payload.id,
      role: user.role,
      restaurantId: user.restaurant_id ? user.restaurant_id.toString() : null,
    };
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
//verifie les permission du user par son role
function authorize(...roles){
    return(req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return res.status(403).json({ message:'Accès refusé'});
        }
        next()
    };
}
module.exports = {authenticate, authorize};