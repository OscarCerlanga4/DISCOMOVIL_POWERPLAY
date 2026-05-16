const { supabase } = require('../db/supabase');
const { llamarN8N } = require('../utils/n8n');

const getAll = (req, res) => {
    supabase
        .from('pago')
        .select('*')
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al obtener los pagos' });
        });
};

const getById = (req, res) => {
    supabase
        .from('pago')
        .select('*')
        .eq('id_pago', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else if (data.length === 0) {
                res.status(404).send({ ok: false, error: 'Pago no encontrado' });
            } else {
                res.status(200).send({ ok: true, result: data[0] });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al obtener el pago' });
        });
};

const create = async (req, res) => {
    const { id_factura, metodo_pago, importe } = req.body;

    try {
        const { data: usuarioData, error: usuarioError } = await supabase
            .from('usuario').select('rol').eq('id_usuario', req.user.id);
        if (usuarioError || !usuarioData.length) {
            return res.status(500).send({ ok: false, error: 'Error al obtener el usuario' });
        }
        const esAdmin = usuarioData[0].rol === 'admin';

        const { data: facturaArr, error: facturaError } = await supabase
            .from('factura')
            .select('*, presupuesto(id_reserva, base_imponible, total, detalle_presupuesto(*), reserva(id_usuario, cliente_nombre, cliente_email, fecha_inicio, fecha_fin, ubicacion, cliente_dni_nie_cif, cliente_direccion, cliente_codigo_postal, cliente_localidad, cliente_provincia))')
            .eq('id_factura', id_factura);
        if (facturaError || !facturaArr.length) {
            return res.status(404).send({ ok: false, error: 'Factura no encontrada' });
        }
        const factura = facturaArr[0];

        if (!esAdmin && factura.presupuesto.reserva.id_usuario !== req.user.id) {
            return res.status(403).send({ ok: false, error: 'No tienes permiso para pagar esta factura' });
        }
        if (factura.estado_factura === 'pagada') {
            return res.status(400).send({ ok: false, error: 'Esta factura ya está pagada' });
        }

        const { data: pagoData, error: pagoError } = await supabase
            .from('pago').insert({ id_factura, metodo_pago, importe }).select();
        if (pagoError) return res.status(500).send({ ok: false, error: pagoError.message });

        const { data: pagos, error: pagosError } = await supabase
            .from('pago').select('importe').eq('id_factura', id_factura);
        if (pagosError) return res.status(500).send({ ok: false, error: pagosError.message });

        const totalPagado = pagos.reduce((suma, p) => suma + parseFloat(p.importe), 0);

        if (totalPagado >= parseFloat(factura.total)) {
            await supabase.from('factura').update({ estado_factura: 'pagada' }).eq('id_factura', id_factura);

            res.status(200).send({ ok: true, result: { pago: pagoData[0], factura_pagada: true } });

            // Fire-and-forget N8N factura pagada
            supabase.from('datos_empresa').select('*').single()
                .then(({ data: empresa }) => llamarN8N(process.env.N8N_WEBHOOK_FACTURA_PAGADA, {
                    cliente_email: factura.presupuesto?.reserva?.cliente_email,
                    cliente_nombre: factura.presupuesto?.reserva?.cliente_nombre,
                    numero_factura: factura.numero_factura,
                    total: factura.total,
                    importe_pagado: importe,
                    nombre_empresa: empresa?.nombre_empresa || 'Power Play',
                    admin_email: empresa?.email
                }))
                .catch(err => console.error('Error llamando a N8N (factura pagada - manual):', err.message));

            return;
        }

        res.status(200).send({ ok: true, result: { pago: pagoData[0], factura_pagada: false, total_pagado: totalPagado } });

        // Fire-and-forget N8N pago registrado
        supabase.from('datos_empresa').select('*').single()
            .then(({ data: empresa }) => llamarN8N(process.env.N8N_WEBHOOK_PAGO_REGISTRADO, {
                cliente_email: factura.presupuesto?.reserva?.cliente_email,
                cliente_nombre: factura.presupuesto?.reserva?.cliente_nombre,
                numero_factura: factura.numero_factura,
                importe_pagado: importe,
                total: factura.total,
                nombre_empresa: empresa?.nombre_empresa || 'Power Play',
                admin_email: empresa?.email
            }))
            .catch(err => console.error('Error llamando a N8N (pago registrado - manual):', err.message));

    } catch (error) {
        res.status(500).send({ ok: false, error: 'Error al crear el pago' });
    }
};

const update = (req, res) => {
    supabase
        .from('pago')
        .update(req.body)
        .eq('id_pago', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al actualizar el pago' });
        });
};

const remove = (req, res) => {
    supabase
        .from('pago')
        .delete()
        .eq('id_pago', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al eliminar el pago' });
        });
};

const crearIntencion = async (req, res) => {
    const { id_factura, importe } = req.body;

    if (!id_factura || !importe) return res.status(400).send({ ok: false, error: 'Faltan datos' });
    if (importe <= 0) return res.status(400).send({ ok: false, error: 'El importe debe ser mayor que cero' });

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    try {
        const { data: facturaData, error: facturaError } = await supabase
            .from('factura').select('total').eq('id_factura', id_factura);
        if (facturaError || !facturaData.length) {
            return res.status(404).send({ ok: false, error: 'Factura no encontrada' });
        }

        const { data: pagos, error: pagosError } = await supabase
            .from('pago').select('importe').eq('id_factura', id_factura);
        if (pagosError) return res.status(500).send({ ok: false, error: pagosError.message });

        const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.importe), 0);
        const pendiente = parseFloat(facturaData[0].total) - totalPagado;

        if (importe > pendiente + 0.01) {
            return res.status(400).send({ ok: false, error: `El importe no puede superar el saldo pendiente de ${pendiente.toFixed(2)}€` });
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(importe * 100),
            currency: 'eur',
            metadata: { id_factura: String(id_factura), id_usuario: String(req.user.id) }
        });

        res.status(200).send({ ok: true, clientSecret: paymentIntent.client_secret });
    } catch (err) {
        res.status(500).send({ ok: false, error: err.message || 'Error al validar la factura' });
    }
};

const getByFactura = (req, res) => {
    supabase
        .from('pago')
        .select('*')
        .eq('id_factura', req.params.id_factura)
        .then(({ data, error }) => {
            if (error) return res.status(500).send({ ok: false, error: error.message });
            res.status(200).send({ ok: true, result: data });
        })
        .catch(() => res.status(500).send({ ok: false, error: 'Error al obtener los pagos' }));
};

module.exports = { getAll, getById, create, update, remove, crearIntencion, getByFactura };
