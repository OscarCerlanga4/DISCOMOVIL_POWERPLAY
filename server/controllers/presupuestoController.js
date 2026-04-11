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
        .from('usuario')
        .select('rol')
        .eq('id_usuario', req.user.id)
        .then(({ data: usuarioData, error: usuarioError }) => {
            if (usuarioError || !usuarioData.length) {
                return res.status(500).send({ ok: false, error: 'Error al obtener el usuario' });
            }

            const rol = usuarioData[0].rol;

            return supabase
                .from('presupuesto')
                .select('*, reserva(id_usuario)')
                .eq('id_presupuesto', req.params.id)
                .then(({ data: presupuestoData, error: presupuestoError }) => {
                    if (presupuestoError || !presupuestoData.length) {
                        return res.status(404).send({ ok: false, error: 'Presupuesto no encontrado' });
                    }

                    const presupuesto = presupuestoData[0];

                    if (rol === 'usuario') {
                        if (presupuesto.reserva.id_usuario !== req.user.id) {
                            return res.status(403).send({ ok: false, error: 'No tienes permiso para modificar este presupuesto' });
                        }
                        if (!['aceptado_cliente', 'rechazado'].includes(req.body.estado)) {
                            return res.status(403).send({ ok: false, error: 'Solo puedes aceptar o rechazar el presupuesto' });
                        }
                    }

                    return supabase
                        .from('presupuesto')
                        .update({ estado: req.body.estado })
                        .eq('id_presupuesto', req.params.id)
                        .select()
                        .then(({ data: updatedData, error: updateError }) => {
                            if (updateError) {
                                return res.status(500).send({ ok: false, error: updateError.message });
                            }

                            const presupuestoActualizado = updatedData[0];

                            if (rol === 'admin' && req.body.estado === 'aceptado') {
                                const año = new Date().getFullYear();
                                const numero_factura = `FAC-${año}-${String(presupuestoActualizado.id_presupuesto).padStart(4, '0')}`;

                                return supabase
                                    .from('factura')
                                    .insert({
                                        numero_factura,
                                        base_imponible: presupuestoActualizado.base_imponible,
                                        total: presupuestoActualizado.total,
                                        id_presupuesto: presupuestoActualizado.id_presupuesto,
                                        estado_factura: 'pendiente'
                                    })
                                    .select()
                                    .then(({ data: facturaData, error: facturaError }) => {
                                        if (facturaError) {
                                            return res.status(500).send({ ok: false, error: facturaError.message });
                                        }
                                        res.status(200).send({ ok: true, result: { presupuesto: presupuestoActualizado, factura: facturaData[0] } });
                                    });
                            }

                            res.status(200).send({ ok: true, result: presupuestoActualizado });
                        });
                });
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

const getMisPresupuestos = (req, res) => {
    supabase
        .from('presupuesto')
        .select('*, reserva(id_usuario)')
        .then(({ data, error }) => {
            if (error) {
                return res.status(500).send({ ok: false, error: error.message });
            }

            const misPresupuestos = data.filter(p => p.reserva.id_usuario === req.user.id);

            res.status(200).send({ ok: true, result: misPresupuestos });
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al obtener los presupuestos' });
        });
};

module.exports = { getAll, getById, create, update, remove, getMisPresupuestos };
