const { supabase } = require('../db/supabase');

const getAll = (req, res) => {
    supabase
        .from('presupuesto')
        .select('*')
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al obtener los presupuestos' });
        });
};

const getById = (req, res) => {
    supabase
        .from('presupuesto')
        .select('*')
        .eq('id_presupuesto', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else if (data.length === 0) {
                res.status(404).send({ ok: false, error: 'Presupuesto no encontrado' });
            } else {
                res.status(200).send({ ok: true, result: data[0] });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al obtener el presupuesto' });
        });
};

const create = (req, res) => {
    supabase
        .from('presupuesto')
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
            res.status(500).send({ ok: false, error: 'Error al crear el presupuesto' });
        });
};

const update = (req, res) => {
    supabase
        .from('presupuesto')
        .update(req.body)
        .eq('id_presupuesto', req.params.id)
        .select()
        .then(({ data, error }) => {
            if (error) {
                return res.status(500).send({ ok: false, error: error.message });
            }

            const presupuesto = data[0];

            if (req.body.estado === 'aceptado') {
                const año = new Date().getFullYear();
                const numero_factura = `FAC-${año}-${String(presupuesto.id_presupuesto).padStart(4, '0')}`;

                return supabase
                    .from('factura')
                    .insert({
                        numero_factura,
                        base_imponible: presupuesto.base_imponible,
                        total: presupuesto.total,
                        id_presupuesto: presupuesto.id_presupuesto,
                        estado_factura: 'pendiente'
                    })
                    .select()
                    .then(({ data: facturaData, error: facturaError }) => {
                        if (facturaError) {
                            return res.status(500).send({ ok: false, error: facturaError.message });
                        }
                        res.status(200).send({ ok: true, result: { presupuesto, factura: facturaData[0] } });
                    });
            }

            res.status(200).send({ ok: true, result: presupuesto });
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al actualizar el presupuesto' });
        });
};

const remove = (req, res) => {
    supabase
        .from('presupuesto')
        .delete()
        .eq('id_presupuesto', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al eliminar el presupuesto' });
        });
};

module.exports = { getAll, getById, create, update, remove };
