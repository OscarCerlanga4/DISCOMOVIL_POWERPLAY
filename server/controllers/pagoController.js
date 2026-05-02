const { supabase } = require('../db/supabase');

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

const create = (req, res) => {
    const { id_factura, metodo_pago, importe } = req.body;

    supabase
        .from('usuario')
        .select('rol')
        .eq('id_usuario', req.user.id)
        .then(({ data: usuarioData, error: usuarioError }) => {
            if (usuarioError || !usuarioData.length) {
                return res.status(500).send({ ok: false, error: 'Error al obtener el usuario' });
            }

            const esAdmin = usuarioData[0].rol === 'admin';

            return supabase
                .from('factura')
                .select('*, presupuesto(id_reserva, reserva(id_usuario))')
                .eq('id_factura', id_factura)
                .then(({ data, error }) => {
                    if (error || !data.length) {
                        return res.status(404).send({ ok: false, error: 'Factura no encontrada' });
                    }

                    const factura = data[0];

                    if (!esAdmin && factura.presupuesto.reserva.id_usuario !== req.user.id) {
                        return res.status(403).send({ ok: false, error: 'No tienes permiso para pagar esta factura' });
                    }

                    if (factura.estado_factura === 'pagada') {
                        return res.status(400).send({ ok: false, error: 'Esta factura ya está pagada' });
                    }

                    return supabase
                        .from('pago')
                        .insert({ id_factura, metodo_pago, importe })
                        .select()
                        .then(({ data: pagoData, error: pagoError }) => {
                            if (pagoError) {
                                return res.status(500).send({ ok: false, error: pagoError.message });
                            }

                            return supabase
                                .from('pago')
                                .select('importe')
                                .eq('id_factura', id_factura)
                                .then(({ data: pagos, error: pagosError }) => {
                                    if (pagosError) {
                                        return res.status(500).send({ ok: false, error: pagosError.message });
                                    }

                                    const totalPagado = pagos.reduce((suma, p) => suma + parseFloat(p.importe), 0);

                                    if (totalPagado >= parseFloat(factura.total)) {
                                        return supabase
                                            .from('factura')
                                            .update({ estado_factura: 'pagada' })
                                            .eq('id_factura', id_factura)
                                            .then(() => {
                                                res.status(200).send({ ok: true, result: { pago: pagoData[0], factura_pagada: true } });
                                            });
                                    }

                                    res.status(200).send({ ok: true, result: { pago: pagoData[0], factura_pagada: false, total_pagado: totalPagado } });
                                });
                        });
                });
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al crear el pago' });
        });
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

const crearIntencion = (req, res) => {
    const { id_factura, importe } = req.body;

    if (!id_factura || !importe) {
        return res.status(400).send({ ok: false, error: 'Faltan datos' });
    }

    if (importe <= 0) {
        return res.status(400).send({ ok: false, error: 'El importe debe ser mayor que cero' });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    supabase
        .from('factura')
        .select('total')
        .eq('id_factura', id_factura)
        .then(({ data, error }) => {
            if (error || !data.length) {
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
                    const pendiente = parseFloat(data[0].total) - totalPagado;

                    if (importe > pendiente + 0.01) {
                        return res.status(400).send({ ok: false, error: `El importe no puede superar el saldo pendiente de ${pendiente.toFixed(2)}€` });
                    }

                    stripe.paymentIntents.create({
                        amount: Math.round(importe * 100),
                        currency: 'eur',
                        metadata: {
                            id_factura: String(id_factura),
                            id_usuario: String(req.user.id)
                        }
                    })
                        .then(paymentIntent => {
                            res.status(200).send({ ok: true, clientSecret: paymentIntent.client_secret });
                        })
                        .catch(err => {
                            res.status(500).send({ ok: false, error: err.message });
                        });
                });
        })
        .catch(() => res.status(500).send({ ok: false, error: 'Error al validar la factura' }));
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
