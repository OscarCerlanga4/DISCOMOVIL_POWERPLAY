const supabase = require('../db/supabase');

const getAll = (req, res) => {
    supabase
        .from('detalle_presupuesto')
        .select('*')
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al obtener los detalles de presupuesto' });
        });
};

const getById = (req, res) => {
    supabase
        .from('detalle_presupuesto')
        .select('*')
        .eq('id_detalle', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else if (data.length === 0) {
                res.status(404).send({ ok: false, error: 'Detalle no encontrado' });
            } else {
                res.status(200).send({ ok: true, result: data[0] });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al obtener el detalle' });
        });
};

const create = (req, res) => {
    supabase
        .from('detalle_presupuesto')
        .insert(req.body)
        .select()
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data[0] });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al crear el detalle' });
        });
};

const update = (req, res) => {
    supabase
        .from('detalle_presupuesto')
        .update(req.body)
        .eq('id_detalle', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al actualizar el detalle' });
        });
};

const remove = (req, res) => {
    supabase
        .from('detalle_presupuesto')
        .delete()
        .eq('id_detalle', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al eliminar el detalle' });
        });
};

module.exports = { getAll, getById, create, update, remove };
