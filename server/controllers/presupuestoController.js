const { supabase } = require('../db/supabase');

const getAll = (req, res) => {
    supabase
        .from('presupuesto')
        .select('*, reserva(id_reserva, fecha_inicio, fecha_fin, ubicacion, cliente_nombre, cliente_email, cliente_telefono, cliente_dni_nie_cif, cliente_direccion, cliente_codigo_postal, cliente_localidad, cliente_provincia), detalle_presupuesto(*), factura(id_factura, estado_factura)')
        .order('id_presupuesto', { ascending: false })
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(() => {
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
        .catch(() => {
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
        .catch(() => {
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

                            // ── Admin confirma presupuesto ──────────────────────────────
                            if (rol === 'admin' && req.body.estado === 'aceptado') {

                                const año = new Date().getFullYear();
                                const numero_factura = `FAC-${año}-${String(presupuestoActualizado.id_presupuesto).padStart(4, '0')}`;

                                // Actualizar reserva + comprobar si ya existe factura en paralelo
                                return Promise.all([
                                    supabase
                                        .from('reserva')
                                        .update({ estado_reserva: 'confirmada' })
                                        .eq('id_reserva', presupuestoActualizado.id_reserva),
                                    supabase
                                        .from('factura')
                                        .select('id_factura')
                                        .eq('id_presupuesto', presupuestoActualizado.id_presupuesto)
                                ]).then(([reservaResult, facturaExistenteResult]) => {
                                    if (reservaResult.error) {
                                        return res.status(500).send({ ok: false, error: reservaResult.error.message });
                                    }

                                    // Si ya existe una factura para este presupuesto, no crear otra
                                    if (facturaExistenteResult.data && facturaExistenteResult.data.length > 0) {
                                        return res.status(200).send({ ok: true, result: presupuestoActualizado });
                                    }

                                    // Generar la factura automáticamente
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
                                            return res.status(200).send({ ok: true, result: presupuestoActualizado });
                                        });
                                });
                            }

                            res.status(200).send({ ok: true, result: presupuestoActualizado });
                        });
                });
        })
        .catch(() => {
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
        .catch(() => {
            res.status(500).send({ ok: false, error: 'Error al eliminar el presupuesto' });
        });
};

const getMisPresupuestos = (req, res) => {
    supabase
        .from('presupuesto')
        .select('*, reserva(id_usuario, fecha_inicio, fecha_fin, ubicacion, cliente_nombre, cliente_email, cliente_telefono, cliente_dni_nie_cif, cliente_direccion, cliente_codigo_postal, cliente_localidad, cliente_provincia), detalle_presupuesto(*), factura(*)')
        .then(({ data, error }) => {
            if (error) {
                return res.status(500).send({ ok: false, error: error.message });
            }

            const misPresupuestos = data.filter(p => p.reserva.id_usuario === req.user.id);
            res.status(200).send({ ok: true, result: misPresupuestos });
        })
        .catch(() => {
            res.status(500).send({ ok: false, error: 'Error al obtener los presupuestos' });
        });
};

const generarFactura = (req, res) => {
    supabase
        .from('presupuesto')
        .select('*')
        .eq('id_presupuesto', req.params.id)
        .then(({ data, error }) => {
            if (error || !data.length) {
                return res.status(404).send({ ok: false, error: 'Presupuesto no encontrado' });
            }

            const presupuesto = data[0];

            if (presupuesto.estado !== 'aceptado') {
                return res.status(400).send({ ok: false, error: 'El presupuesto debe estar aceptado para generar la factura' });
            }

            const año = new Date().getFullYear();
            const numero_factura = `FAC-${año}-${String(presupuesto.id_presupuesto).padStart(4, '0')}`;

            // Comprobar si ya existe
            return supabase
                .from('factura')
                .select('id_factura')
                .eq('id_presupuesto', presupuesto.id_presupuesto)
                .then(({ data: existente }) => {
                    if (existente && existente.length > 0) {
                        return res.status(400).send({ ok: false, error: 'Ya existe una factura para este presupuesto' });
                    }

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
                            if (facturaError) return res.status(500).send({ ok: false, error: facturaError.message });
                            res.status(200).send({ ok: true, result: facturaData[0] });
                        });
                });
        })
        .catch(() => res.status(500).send({ ok: false, error: 'Error al generar la factura' }));
};

module.exports = { getAll, getById, create, update, remove, getMisPresupuestos, generarFactura };