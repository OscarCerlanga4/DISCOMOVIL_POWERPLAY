const supabase = require('../db/supabase');

const getAll = (req, res) => {
    supabase
        .from('factura')
        .select('*')
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al obtener las facturas' });
        });
};

const getById = (req, res) => {
    supabase
        .from('factura')
        .select('*')
        .eq('id_factura', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else if (data.length === 0) {
                res.status(404).send({ ok: false, error: 'Factura no encontrada' });
            } else {
                res.status(200).send({ ok: true, result: data[0] });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al obtener la factura' });
        });
};

const create = (req, res) => {
    supabase
        .from('factura')
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
            res.status(500).send({ ok: false, error: 'Error al crear la factura' });
        });
};

const update = (req, res) => {
    supabase
        .from('factura')
        .update(req.body)
        .eq('id_factura', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al actualizar la factura' });
        });
};

const remove = (req, res) => {
    supabase
        .from('factura')
        .delete()
        .eq('id_factura', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al eliminar la factura' });
        });
};

module.exports = { getAll, getById, create, update, remove };
