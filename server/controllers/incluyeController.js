// Controlador de la tabla pivote incluye (equipo ↔ reserva).
// Gestiona qué equipos y en qué cantidad están asignados a cada reserva.

const { supabase } = require('../db/supabase');

const getByReserva = (req, res) => {
    supabase
        .from('incluye')
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
            res.status(500).send({ ok: false, error: 'Error al obtener los equipos de la reserva' });
        });
};

const create = (req, res) => {
    supabase
        .from('incluye')
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
            res.status(500).send({ ok: false, error: 'Error al añadir equipo a la reserva' });
        });
};

const remove = (req, res) => {
    supabase
        .from('incluye')
        .delete()
        .eq('id_reserva', req.params.id_reserva)
        .eq('id_equipo', req.params.id_equipo)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al eliminar equipo de la reserva' });
        });
};

module.exports = { getByReserva, create, remove };
