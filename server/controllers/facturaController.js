// Controlador de facturas. getAll incluye relaciones completas (pago, presupuesto, reserva)
// para evitar peticiones adicionales en el panel de admin.
// getMisFacturas filtra por usuario navegando la cadena: factura → presupuesto → reserva → id_usuario.

const { supabase } = require('../db/supabase');

const getAll = (req, res) => {
    supabase
        .from('factura')
        .select('*, pago(*), presupuesto(id_presupuesto, base_imponible, detalle_presupuesto(*), reserva(cliente_nombre, cliente_email, cliente_dni_nie_cif, cliente_telefono, cliente_direccion, cliente_codigo_postal, cliente_localidad, cliente_provincia, fecha_inicio, fecha_fin, ubicacion))')
        .order('id_factura', { ascending: false })
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

const getById = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('factura')
            .select('*, presupuesto(reserva(id_usuario))')
            .eq('id_factura', req.params.id);
        if (error) {
            return res.status(500).send({ ok: false, error: error.message });
        }
        if (data.length === 0) {
            return res.status(404).send({ ok: false, error: 'Factura no encontrada' });
        }

        const { data: rolData } = await supabase
            .from('usuario').select('rol').eq('id_usuario', req.user.id);
        const rol = rolData?.[0]?.rol;

        const ownerId = data[0].presupuesto?.reserva?.id_usuario;
        if (rol !== 'admin' && ownerId !== req.user.id) {
            return res.status(403).send({ ok: false, error: 'No tienes permiso para ver esta factura' });
        }

        // Devolver solo los campos de la factura (sin el join usado para el check)
        const { presupuesto: _presupuesto, ...facturaData } = data[0];
        res.status(200).send({ ok: true, result: facturaData });
    } catch (error) {
        res.status(500).send({ ok: false, error: 'Error al obtener la factura' });
    }
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

const getMisFacturas = (req, res) => {
    supabase
        .from('factura')
        .select('*, presupuesto!inner(id_reserva, reserva!inner(id_usuario))')
        .eq('presupuesto.reserva.id_usuario', req.user.id)
        .order('id_factura', { ascending: false })
        .then(({ data, error }) => {
            if (error) {
                return res.status(500).send({ ok: false, error: error.message });
            }
            res.status(200).send({ ok: true, result: data });
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al obtener las facturas' });
        });
};

module.exports = { getAll, getById, create, update, remove, getMisFacturas };
