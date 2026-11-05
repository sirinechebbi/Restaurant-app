const jwt = require('jsonwebtoken');
//verifie le token JWT
function authenticate(req, res, next){
    const header = req.headers.authorization || '';
    //condition ternaire pour extraire le token
    const token = header.startsWith('Bearer') ? header.slice(7) : null;
    if(!token) return res.status(401).json({ message: 'token manquant'});
    
    try{
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    }
    //si jwt.verify declenche un erreur on catch
    catch(err){
        res.status(401).json({ message: 'Token invalide ou expiré'});
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