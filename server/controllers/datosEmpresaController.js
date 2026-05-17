// Controlador de datos de la empresa. Siempre opera sobre el único registro existente (id_empresa = 1).
// GET no requiere autenticación; PUT está protegido por el middleware de admin.

const { supabase } = require('../db/supabase');

const getAll = (req, res) => {
    supabase
        .from('datos_empresa')
        .select('*')
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data[0] });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al obtener los datos de empresa' });
        });
};

const update = (req, res) => {
    supabase
        .from('datos_empresa')
        .update(req.body)
        .eq('id_empresa', 1)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al actualizar los datos de empresa' });
        });
};

module.exports = { getAll, update };