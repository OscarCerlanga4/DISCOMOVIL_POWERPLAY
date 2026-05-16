const { supabase } = require('../db/supabase');
const { llamarN8N } = require('../utils/n8n');
const { generarPdfPresupuesto, generarPdfFactura } = require('../utils/generarPdf');

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

const update = async (req, res) => {
    try {
        const { data: usuarioData, error: usuarioError } = await supabase
            .from('usuario').select('rol').eq('id_usuario', req.user.id);
        if (usuarioError || !usuarioData.length) {
            return res.status(500).send({ ok: false, error: 'Error al obtener el usuario' });
        }
        const rol = usuarioData[0].rol;

        const { data: presupuestoData, error: presupuestoError } = await supabase
            .from('presupuesto').select('*, reserva(id_usuario)').eq('id_presupuesto', req.params.id);
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

        const { data: updatedData, error: updateError } = await supabase
            .from('presupuesto').update({ estado: req.body.estado }).eq('id_presupuesto', req.params.id).select();
        if (updateError) return res.status(500).send({ ok: false, error: updateError.message });

        const presupuestoActualizado = updatedData[0];

        // ── Presupuesto rechazado → cancelar reserva ──
        if (req.body.estado === 'rechazado') {
            await supabase.from('reserva').update({ estado_reserva: 'cancelada' }).eq('id_reserva', presupuestoActualizado.id_reserva);

            res.status(200).send({ ok: true, result: presupuestoActualizado });

            // Fire-and-forget N8N
            supabase.from('presupuesto')
                .select('*, reserva(id_usuario, fecha_inicio, fecha_fin, ubicacion, cliente_nombre, cliente_email, cliente_telefono, cliente_dni_nie_cif, cliente_direccion, cliente_codigo_postal, cliente_localidad, cliente_provincia), detalle_presupuesto(*)')
                .eq('id_presupuesto', presupuestoActualizado.id_presupuesto).single()
                .then(({ data: presupuestoCompleto }) => {
                    if (!presupuestoCompleto) return;
                    return llamarN8N(process.env.N8N_WEBHOOK_RECHAZADO, {
                        cliente_email: presupuestoCompleto.reserva?.cliente_email,
                        cliente_nombre: presupuestoCompleto.reserva?.cliente_nombre,
                        fecha_evento: presupuestoCompleto.reserva?.fecha_inicio
                    });
                })
                .catch(err => console.error('Error llamando a N8N (rechazado):', err.message));
            return;
        }

        // ── Cliente acepta presupuesto ──
        if (req.body.estado === 'aceptado_cliente') {
            res.status(200).send({ ok: true, result: presupuestoActualizado });

            // Fire-and-forget N8N
            supabase.from('presupuesto')
                .select('*, reserva(id_usuario, fecha_inicio, fecha_fin, ubicacion, cliente_nombre, cliente_email, cliente_telefono, cliente_dni_nie_cif, cliente_direccion, cliente_codigo_postal, cliente_localidad, cliente_provincia), detalle_presupuesto(*)')
                .eq('id_presupuesto', presupuestoActualizado.id_presupuesto).single()
                .then(({ data: presupuestoCompleto }) => {
                    if (!presupuestoCompleto) return;
                    return supabase.from('datos_empresa').select('*').single()
                        .then(({ data: empresa }) => generarPdfPresupuesto(presupuestoCompleto)
                            .then(pdfBase64 => {
                                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                                return llamarN8N(process.env.N8N_WEBHOOK_CLIENTE_ACEPTA, {
                                    cliente_nombre: presupuestoCompleto.reserva?.cliente_nombre,
                                    fecha_evento: presupuestoCompleto.reserva?.fecha_inicio,
                                    total: presupuestoCompleto.total,
                                    admin_email: empresa?.email,
                                    nombre_empresa: empresa?.nombre_empresa || 'Power Play',
                                    pdf_base64: pdfBase64,
                                    url_presupuesto: `${frontendUrl}/admin?presupuesto=${presupuestoCompleto.id_presupuesto}`
                                });
                            })
                        );
                })
                .catch(err => console.error('Error llamando a N8N (cliente acepta):', err.message));
            return;
        }

        // ── Admin confirma presupuesto ──
        if (rol === 'admin' && req.body.estado === 'aceptado') {
            const año = new Date().getFullYear();
            const numero_factura = `FAC-${año}-${String(presupuestoActualizado.id_presupuesto).padStart(4, '0')}`;

            const [reservaResult, facturaExistenteResult] = await Promise.all([
                supabase.from('reserva').update({ estado_reserva: 'confirmada' }).eq('id_reserva', presupuestoActualizado.id_reserva),
                supabase.from('factura').select('id_factura').eq('id_presupuesto', presupuestoActualizado.id_presupuesto)
            ]);
            if (reservaResult.error) {
                return res.status(500).send({ ok: false, error: reservaResult.error.message });
            }
            if (facturaExistenteResult.data && facturaExistenteResult.data.length > 0) {
                return res.status(200).send({ ok: true, result: presupuestoActualizado });
            }

            const { data: facturaData, error: facturaError } = await supabase
                .from('factura')
                .insert({
                    numero_factura,
                    base_imponible: presupuestoActualizado.base_imponible,
                    total: presupuestoActualizado.total,
                    id_presupuesto: presupuestoActualizado.id_presupuesto,
                    estado_factura: 'pendiente'
                })
                .select();
            if (facturaError) return res.status(500).send({ ok: false, error: facturaError.message });

            res.status(200).send({ ok: true, result: presupuestoActualizado });

            // Fire-and-forget N8N
            supabase.from('presupuesto')
                .select('*, reserva(id_usuario, fecha_inicio, fecha_fin, ubicacion, cliente_nombre, cliente_email, cliente_telefono, cliente_dni_nie_cif, cliente_direccion, cliente_codigo_postal, cliente_localidad, cliente_provincia), detalle_presupuesto(*), factura(*)')
                .eq('id_presupuesto', presupuestoActualizado.id_presupuesto).single()
                .then(({ data: presupuestoCompleto }) => {
                    if (!presupuestoCompleto) return;
                    return supabase.from('datos_empresa').select('*').single()
                        .then(({ data: empresa }) => generarPdfFactura(presupuestoCompleto)
                            .then(pdfBase64 => llamarN8N(process.env.N8N_WEBHOOK_ADMIN_ACEPTA, {
                                cliente_email: presupuestoCompleto.reserva?.cliente_email,
                                cliente_nombre: presupuestoCompleto.reserva?.cliente_nombre,
                                fecha_evento: presupuestoCompleto.reserva?.fecha_inicio,
                                numero_factura: presupuestoCompleto.factura?.numero_factura,
                                total: presupuestoCompleto.factura?.total,
                                pdf_base64: pdfBase64,
                                nombre_empresa: empresa?.nombre_empresa || 'Power Play',
                                url_pago: `${process.env.FRONTEND_URL}/pago/${presupuestoCompleto.factura?.id_factura}`
                            }))
                        );
                })
                .catch(err => console.error('Error llamando a N8N (admin acepta):', err.message));
            return;
        }

        res.status(200).send({ ok: true, result: presupuestoActualizado });
    } catch (error) {
        res.status(500).send({ ok: false, error: 'Error al actualizar el presupuesto' });
    }
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

const generarFactura = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('presupuesto').select('*').eq('id_presupuesto', req.params.id);
        if (error || !data.length) {
            return res.status(404).send({ ok: false, error: 'Presupuesto no encontrado' });
        }
        const presupuesto = data[0];

        if (presupuesto.estado !== 'aceptado') {
            return res.status(400).send({ ok: false, error: 'El presupuesto debe estar aceptado para generar la factura' });
        }

        const año = new Date().getFullYear();
        const numero_factura = `FAC-${año}-${String(presupuesto.id_presupuesto).padStart(4, '0')}`;

        const { data: existente } = await supabase
            .from('factura').select('id_factura').eq('id_presupuesto', presupuesto.id_presupuesto);
        if (existente && existente.length > 0) {
            return res.status(400).send({ ok: false, error: 'Ya existe una factura para este presupuesto' });
        }

        const { data: facturaData, error: facturaError } = await supabase
            .from('factura')
            .insert({
                numero_factura,
                base_imponible: presupuesto.base_imponible,
                total: presupuesto.total,
                id_presupuesto: presupuesto.id_presupuesto,
                estado_factura: 'pendiente'
            })
            .select();
        if (facturaError) return res.status(500).send({ ok: false, error: facturaError.message });

        res.status(200).send({ ok: true, result: facturaData[0] });
    } catch (error) {
        res.status(500).send({ ok: false, error: 'Error al generar la factura' });
    }
};

module.exports = { getAll, getById, create, update, remove, getMisPresupuestos, generarFactura };