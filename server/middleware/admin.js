const { supabase } = require('../db/supabase');

const verificarAdmin = (req, res, next)=>{
    supabase
        .from('usuario')
        .select('rol')
        .eq('id_usuario', req.user.id)
        .then(({ data, error })=>{
            if(error || !data){
                res.status(401).send({ ok: false, error: "Usuario no encontrado" });
            }else if(data[0].rol !== "admin"){
                res.status(403).send({ ok: false, error: "Acceso denegado" });
            }else{
                req.isAdmin = true;
                next();
            }
        })
        .catch(error=>{
            res.status(500).send({ ok: false, error: "Error al verificar el rol" });
        })
}

module.exports = { verificarAdmin };