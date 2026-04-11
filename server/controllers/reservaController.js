const { supabase } = require('../db/supabase');

const getAll = (req, res) => {
    supabase
        .from('reserva')
        .select('*')
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al obtener las reservas' });
        });
};

const getById = (req, res) => {
    supabase
        .from('reserva')
        .select('*')
        .eq('id_reserva', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else if (data.length === 0) {
                res.status(404).send({ ok: false, error: 'Reserva no encontrada' });
            } else {
                res.status(200).send({ ok: true, result: data[0] });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al obtener la reserva' });
        });
};

const create = (req, res) => {
    supabase
        .from('reserva')
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
            res.status(500).send({ ok: false, error: 'Error al crear la reserva' });
        });
};

const update = (req, res) => {
    supabase
        .from('reserva')
        .update(req.body)
        .eq('id_reserva', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al actualizar la reserva' });
        });
};

const remove = (req, res) => {
    supabase
        .from('reserva')
        .delete()
        .eq('id_reserva', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al eliminar la reserva' });
        });
};

module.exports = { getAll, getById, create, update, remove };