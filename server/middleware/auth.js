const { supabaseAuth } = require('../db/supabase');

const verificarToken = (req, res, next)=>{
    const authHeader = req.headers['authorization'];

    if(!authHeader){
        return res.status(401).send({ ok: false, error: "No se proporcionó token" });
    }

    const token = authHeader.split(' ')[1];

    supabaseAuth.auth.getUser(token)
        .then(({ data, error })=>{
            if(error || !data){
                return res.status(401).send({ ok: false, error: "Token invalido o expirado" });
            }else{
                req.user = data.user;
                next();
            }
        })
        .catch(error=>{
            res.status(500).send({ ok: false, error: "Error al verificar token" });
        })
}

module.exports = { verificarToken };