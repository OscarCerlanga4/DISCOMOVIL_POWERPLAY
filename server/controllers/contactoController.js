const { supabase } = require('../db/supabase');
const { llamarN8N } = require('../utils/n8n');

const getAll = (req, res) => {
    supabase
        .from('contacto')
        .select('*')
        .order('fecha', { ascending: false })
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(() => {
            res.status(500).send({ ok: false, error: 'Error al obtener los contactos' });
        });
};

const getById = (req, res) => {
    supabase
        .from('contacto')
        .select('*')
        .eq('id_contacto', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else if (data.length === 0) {
                res.status(404).send({ ok: false, error: 'Contacto no encontrado' });
            } else {
                res.status(200).send({ ok: true, result: data[0] });
            }
        })
        .catch(() => {
            res.status(500).send({ ok: false, error: 'Error al obtener el contacto' });
        });
};

const create = (req, res) => {
    const { nombre, email, titulo_problema, tipo_contacto, descripcion } = req.body;

    supabase
        .from('contacto')
        .insert({ nombre, email, titulo_problema, tipo_contacto, descripcion })
        .select()
        .then(({ data, error }) => {
            if (error) {
                return res.status(500).send({ ok: false, error: error.message });
            }

            res.status(200).send({ ok: true, result: data[0] });

            supabase
                .from('datos_empresa')
                .select('*')
                .single()
                .then(({ data: empresa }) => {
                    return llamarN8N(process.env.N8N_WEBHOOK_CONTACTO_RECIBIDO, {
                        nombre,
                        email,
                        titulo_problema,
                        tipo_contacto,
                        descripcion,
                        nombre_empresa: empresa?.nombre_empresa || 'Power Play',
                        admin_email: empresa?.email
                    });
                })
                .catch(err => console.error('Error llamando a N8N (contacto recibido):', err.message));
        })
        .catch(() => {
            res.status(500).send({ ok: false, error: 'Error al crear el contacto' });
        });
};

const responder = (req, res) => {
    const { id } = req.params;
    const { respuesta } = req.body;

    if (!respuesta || !respuesta.trim()) {
        return res.status(400).send({ ok: false, error: 'La respuesta no puede estar vacía' });
    }

    supabase
        .from('contacto')
        .update({ respondido: true, respuesta })
        .eq('id_contacto', id)
        .select()
        .then(({ data, error }) => {
            if (error || !data.length) {
                return res.status(500).send({ ok: false, error: 'Error al guardar la respuesta' });
            }

            const contacto = data[0];

            res.status(200).send({ ok: true, result: contacto });

            supabase
                .from('datos_empresa')
                .select('*')
                .single()
                .then(({ data: empresa }) => {
                    return llamarN8N(process.env.N8N_WEBHOOK_CONTACTO_RESPONDIDO, {
                        nombre: contacto.nombre,
                        email: contacto.email,
                        titulo_problema: contacto.titulo_problema,
                        respuesta,
                        nombre_empresa: empresa?.nombre_empresa || 'Power Play'
                    });
                })
                .catch(err => console.error('Error llamando a N8N (contacto respondido):', err.message));
        })
        .catch(() => {
            res.status(500).send({ ok: false, error: 'Error al responder el contacto' });
        });
};

const remove = (req, res) => {
    supabase
        .from('contacto')
        .delete()
        .eq('id_contacto', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(() => {
            res.status(500).send({ ok: false, error: 'Error al eliminar el contacto' });
        });
};

module.exports = { getAll, getById, create, responder, remove };