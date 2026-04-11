const { supabase } = require('../db/supabase');

const register = (req, res)=>{
    const { email, password, nombre, telefono, dni_nie_cif, direccion, codigo_postal, localidad, provincia } = req.body;

    supabase.auth.signUp({
        email: email,
        password: password
    }).then(({ data, error })=>{
        if(error){
            res.status(400).send({ ok: false, error: error.message });
        }else{
            return supabase
                .from('usuario')
                .insert({
                    id_usuario: data.user.id,
                    email: email,
                    nombre: nombre,
                    telefono: telefono,
                    dni_nie_cif: dni_nie_cif,
                    direccion: direccion,
                    codigo_postal: codigo_postal,
                    localidad: localidad,
                    provincia: provincia,
                    rol: 'usuario'
                })
                .then(({ error: dbError })=>{
                    if(dbError){
                        res.status(400).send({ ok: false, error: dbError.message });
                    }else{
                        res.status(200).send({ ok: true, result: "Usuario registrado correctamente" });
                    }
                })
        }
    })
    .catch(error=>{
        res.status(500).send({ ok: false, error: "Error al registrar el usuario" });
    });
};

const login = (req, res)=>{
    const { email, password } = req.body;

    supabase.auth.signInWithPassword({
        email: email,
        password: password
    }).then(({ data, error })=>{
        if(error){
            res.status(400).send({ ok: false, error: error.message });
        }else{
            res.status(200).send({ ok: true, result: data });
        }
    }).catch(error=>{
        res.status(500).send({ ok: false, error: "Error al iniciar sesion" });
    })
}

module.exports = { register, login };