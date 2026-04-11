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

const update = (req, res)=>{
    supabase 
        .from('usuario')
        .update(req.body)
        .eq('id_usuario', req.params.id)
        .then(({ data, error })=>{
            if(error){
                res.status(500).send({ ok: false, error: error.message });
            }else{
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error=>{
            res.status(500).send({ ok: false, error: "Error al actualizar usuario" });
        });
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

module.exports = { getAll, getById, update, remove };