// Controlador de la tabla pivote contrata (DJ ↔ reserva).
// Gestiona qué DJs están asignados a cada reserva.

const { supabase } = require('../db/supabase');

const getByReserva = (req, res) => {
    supabase
        .from('contrata')
        .select('*')
        .eq('id_reserva', req.params.id_reserva)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al obtener los DJs de la reserva' });
        });
};

const create = (req, res) => {
    const { id_reserva, id_dj } = req.body;
    supabase
        .from('contrata')
        .insert({ id_reserva, id_dj })
        .select()
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data[0] });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al añadir DJ a la reserva' });
        });
};

const remove = (req, res) => {
    supabase
        .from('contrata')
        .delete()
        .eq('id_reserva', req.params.id_reserva)
        .eq('id_dj', req.params.id_dj)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al eliminar DJ de la reserva' });
        });
};

module.exports = { getByReserva, create, remove };
