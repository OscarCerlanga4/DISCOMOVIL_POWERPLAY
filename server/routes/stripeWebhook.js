const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabase } = require('../db/supabase');

router.post('/', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send({ ok: false, error: `Webhook error: ${err.message}` });
    }

    if (event.type !== 'payment_intent.succeeded') {
        return res.json({ received: true });
    }

    const intent = event.data.object;
    const id_factura = parseInt(intent.metadata.id_factura);
    const importe = intent.amount_received / 100;

    supabase
        .from('pago')
        .insert({
            id_factura,
            metodo_pago: 'stripe',
            importe,
            referencia_pago: intent.id
        })
        .then(({ error: pagoError }) => {
            if (pagoError) {
                return res.status(500).send({ ok: false, error: pagoError.message });
            }

            return supabase
                .from('factura')
                .select('total')
                .eq('id_factura', id_factura)
                .then(({ data: facturaData, error: facturaError }) => {
                    if (facturaError || !facturaData.length) {
                        return res.status(404).send({ ok: false, error: 'Factura no encontrada' });
                    }

                    return supabase
                        .from('pago')
                        .select('importe')
                        .eq('id_factura', id_factura)
                        .then(({ data: pagos, error: pagosError }) => {
                            if (pagosError) {
                                return res.status(500).send({ ok: false, error: pagosError.message });
                            }

                            const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.importe), 0);

                            if (totalPagado >= parseFloat(facturaData[0].total)) {
                                return supabase
                                    .from('factura')
                                    .update({ estado_factura: 'pagada' })
                                    .eq('id_factura', id_factura)
                                    .then(() => res.json({ received: true }));
                            }

                            res.json({ received: true });
                        });
                });
        })
        .catch(() => {
            res.status(500).send({ ok: false, error: 'Error al procesar el webhook' });
        });
});

module.exports = router;