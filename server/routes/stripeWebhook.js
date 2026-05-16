const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabase } = require('../db/supabase');
const { llamarN8N } = require('../utils/n8n');

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send({ ok: false, error: `Webhook error: ${err.message}` });
    }

    if (event.type !== 'payment_intent.succeeded') {
        return res.json({ received: true });
    }

    const intent = event.data.object;
    const id_factura = parseInt(intent.metadata.id_factura);
    const importe = intent.amount_received / 100;

    try {
        const { data: pagoExistente } = await supabase
            .from('pago')
            .select('id_pago')
            .eq('referencia_pago', intent.id);

        if (pagoExistente && pagoExistente.length > 0) {
            return res.json({ received: true });
        }

        const { error: pagoError } = await supabase
            .from('pago')
            .insert({ id_factura, metodo_pago: 'tarjeta', importe, referencia_pago: intent.id });

        if (pagoError) {
            return res.status(500).send({ ok: false, error: pagoError.message });
        }

        const { data: facturaData, error: facturaError } = await supabase
            .from('factura')
            .select('total')
            .eq('id_factura', id_factura);

        if (facturaError || !facturaData.length) {
            return res.status(404).send({ ok: false, error: 'Factura no encontrada' });
        }

        const { data: pagos, error: pagosError } = await supabase
            .from('pago')
            .select('importe')
            .eq('id_factura', id_factura);

        if (pagosError) {
            return res.status(500).send({ ok: false, error: pagosError.message });
        }

        const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.importe), 0);

        if (totalPagado >= parseFloat(facturaData[0].total)) {
            await supabase
                .from('factura')
                .update({ estado_factura: 'pagada' })
                .eq('id_factura', id_factura);

            res.json({ received: true });

            supabase
                .from('factura')
                .select('*, presupuesto(*, reserva(cliente_nombre, cliente_email, fecha_inicio, fecha_fin, ubicacion, cliente_dni_nie_cif, cliente_direccion, cliente_codigo_postal, cliente_localidad, cliente_provincia), detalle_presupuesto(*))')
                .eq('id_factura', id_factura)
                .single()
                .then(({ data: facturaCompleta }) => {
                    if (!facturaCompleta) return;
                    return supabase.from('datos_empresa').select('*').single()
                        .then(({ data: empresa }) => llamarN8N(process.env.N8N_WEBHOOK_FACTURA_PAGADA, {
                            cliente_email: facturaCompleta.presupuesto?.reserva?.cliente_email,
                            cliente_nombre: facturaCompleta.presupuesto?.reserva?.cliente_nombre,
                            numero_factura: facturaCompleta.numero_factura,
                            total: facturaCompleta.total,
                            importe_pagado: importe,
                            nombre_empresa: empresa?.nombre_empresa || 'Power Play',
                            admin_email: empresa?.email
                        }));
                })
                .catch(err => console.error('Error llamando a N8N (factura pagada):', err.message));

            return;
        }

        res.json({ received: true });

        supabase
            .from('factura')
            .select('*, presupuesto(*, reserva(cliente_nombre, cliente_email, fecha_inicio))')
            .eq('id_factura', id_factura)
            .single()
            .then(({ data: facturaCompleta }) => {
                if (!facturaCompleta) return;
                return supabase.from('datos_empresa').select('*').single()
                    .then(({ data: empresa }) => llamarN8N(process.env.N8N_WEBHOOK_PAGO_REGISTRADO, {
                        cliente_email: facturaCompleta.presupuesto?.reserva?.cliente_email,
                        cliente_nombre: facturaCompleta.presupuesto?.reserva?.cliente_nombre,
                        numero_factura: facturaCompleta.numero_factura,
                        importe_pagado: importe,
                        total: facturaCompleta.total,
                        nombre_empresa: empresa?.nombre_empresa || 'Power Play',
                        admin_email: empresa?.email
                    }));
            })
            .catch(err => console.error('Error llamando a N8N (pago registrado):', err.message));

    } catch (err) {
        console.error('Error en webhook de Stripe:', err);
        res.status(500).send({ ok: false, error: 'Error al procesar el webhook' });
    }
});

module.exports = router;
