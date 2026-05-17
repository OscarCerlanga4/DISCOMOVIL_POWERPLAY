// Controlador CRUD de usuarios. update usa una lista blanca de campos permitidos para evitar
// modificaciones no autorizadas; si se actualiza el email también se sincroniza en Supabase Auth.
// deleteAccount elimina al usuario de Supabase Auth (la fila en 'usuario' se elimina en cascada).

const { supabase } = require('../db/supabase');

const getAll = (req, res)=>{
    supabase 
        .from('usuario')
        .select('*')
        .then(({ data, error })=>{
            if(error){
                res.status(500).send({ ok: false, error: error.message });
            }else{
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error =>{
            res.status(500).send({ ok: false, error: 'Error al obtener usuarios' });
        });
};

const getById = (req, res)=>{
    supabase
        .from('usuario')
        .select('*')
        .eq('id_usuario', req.params.id)
        .then(({ data, error})=>{
            if(error){
                res.status(500).send({ ok: false, error: error.message });
            }else if(data.length === 0){
                res.status(404).send({ ok: false, error: "Usuario no encontrado" });
            }else{
                res.status(200).send({ ok: true, result: data[0] });
            }
        })
        .catch(error=>{
            res.status(500).send({ ok: false, error: "Error al obtener el usuario" } );
        });
};

const update = async (req, res) => {
    const camposPermitidos = ['nombre', 'telefono', 'dni_nie_cif', 'direccion', 'codigo_postal', 'localidad', 'provincia', 'email'];
    const datosActualizar = {};

    camposPermitidos.forEach(campo => {
        if (req.body[campo] !== undefined) datosActualizar[campo] = req.body[campo];
    });

    if (Object.keys(datosActualizar).length === 0) {
        return res.status(400).send({ ok: false, error: 'No hay campos válidos para actualizar' });
    }

    try {
        const promesas = [
            supabase.from('usuario').update(datosActualizar).eq('id_usuario', req.params.id)
        ];
        if (datosActualizar.email) {
            promesas.push(supabase.auth.admin.updateUserById(req.params.id, { email: datosActualizar.email }));
        }

        const resultados = await Promise.all(promesas);
        for (const { error } of resultados) {
            if (error) return res.status(500).send({ ok: false, error: error.message });
        }

        res.status(200).send({ ok: true, result: 'Usuario actualizado correctamente' });
    } catch (error) {
        res.status(500).send({ ok: false, error: error.message });
    }
};

const remove = (req, res)=>{
    supabase
        .from('usuario')
        .delete()
        .eq('id_usuario', req.params.id)
        .then(({ data, error })=>{
            if(error){
                res.status(500).send({ ok: false, error: error.message });
            }else{
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error=>{
            res.status(500).send({ ok: false, error: "Error al eliminar usuario" });
        });
};

const deleteAccount = (req, res) => {
    const id = req.user.id

    supabase.auth.admin.deleteUser(id)
        .then(({ error }) => {
            if (error) {
                return res.status(500).send({ ok: false, error: error.message })
            }
            res.status(200).send({ ok: true, result: 'Cuenta eliminada correctamente' })
        })
        .catch(() => {
            res.status(500).send({ ok: false, error: 'Error al eliminar la cuenta' })
        })
}

module.exports = { getAll, getById, update, remove, deleteAccount };