const { supabase } = require('../db/supabase');

const getAll = (req, res) => {
    supabase
        .from('evento')
        .select('*')
        .order('fecha', { ascending: true })
        .then(({ data, error }) => {
            if (error) return res.status(500).send({ ok: false, error: error.message });
            res.status(200).send({ ok: true, result: data });
        })
        .catch(() => res.status(500).send({ ok: false, error: 'Error al obtener los eventos' }));
};

const getById = (req, res) => {
    supabase
        .from('evento')
        .select('*')
        .eq('id_evento', req.params.id)
        .then(({ data, error }) => {
            if (error) return res.status(500).send({ ok: false, error: error.message });
            if (!data.length) return res.status(404).send({ ok: false, error: 'Evento no encontrado' });
            res.status(200).send({ ok: true, result: data[0] });
        })
        .catch(() => res.status(500).send({ ok: false, error: 'Error al obtener el evento' }));
};

const create = (req, res) => {
    supabase
        .from('evento')
        .insert(req.body)
        .select()
        .then(({ data, error }) => {
            if (error) return res.status(500).send({ ok: false, error: error.message });
            res.status(200).send({ ok: true, result: data[0] });
        })
        .catch(() => res.status(500).send({ ok: false, error: 'Error al crear el evento' }));
};

const update = (req, res) => {
    supabase
        .from('evento')
        .update(req.body)
        .eq('id_evento', req.params.id)
        .select()
        .then(({ data, error }) => {
            if (error) return res.status(500).send({ ok: false, error: error.message });
            if (!data.length) return res.status(404).send({ ok: false, error: 'Evento no encontrado' });
            res.status(200).send({ ok: true, result: data[0] });
        })
        .catch(() => res.status(500).send({ ok: false, error: 'Error al actualizar el evento' }));
};

const remove = (req, res) => {
    supabase
        .from('evento')
        .delete()
        .eq('id_evento', req.params.id)
        .then(({ data, error }) => {
            if (error) return res.status(500).send({ ok: false, error: error.message });
            res.status(200).send({ ok: true, result: data });
        })
        .catch(() => res.status(500).send({ ok: false, error: 'Error al eliminar el evento' }));
};

module.exports = { getAll, getById, create, update, remove };