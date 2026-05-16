const { supabase, supabaseAuth } = require('../db/supabase');

const register = async (req, res) => {
    const { email, password, nombre, telefono, dni_nie_cif, direccion, codigo_postal, localidad, provincia } = req.body;

    try {
        const { data, error } = await supabaseAuth.auth.signUp({ email, password });
        if (error) return res.status(400).send({ ok: false, error: error.message });

        const { error: dbError } = await supabase
            .from('usuario')
            .insert({
                id_usuario: data.user.id,
                email, nombre, telefono, dni_nie_cif, direccion, codigo_postal, localidad, provincia,
                rol: 'usuario'
            });

        if (dbError) return res.status(400).send({ ok: false, error: dbError.message });
        res.status(200).send({ ok: true, result: "Usuario registrado correctamente" });
    } catch (error) {
        res.status(500).send({ ok: false, error: "Error al registrar el usuario" });
    }
};

const login = (req, res)=>{
    const { email, password } = req.body;

    supabaseAuth.auth.signInWithPassword({
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

const me = (req, res) => {
  supabase
    .from('usuario')
    .select('*')
    .eq('id_usuario', req.user.id)
    .single()
    .then(({ data, error }) => {
      if (error) return res.status(404).send({ ok: false, error: 'Usuario no encontrado' })
      res.status(200).send({ ok: true, usuario: data })
    })
}

module.exports = { register, login, me };