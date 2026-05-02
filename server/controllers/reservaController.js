const { supabase } = require('../db/supabase');

const getAll = (req, res) => {
    supabase
        .from('reserva')
        .select('*')
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al obtener las reservas' });
        });
};

const getById = (req, res) => {
    supabase
        .from('reserva')
        .select('*')
        .eq('id_reserva', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else if (data.length === 0) {
                res.status(404).send({ ok: false, error: 'Reserva no encontrada' });
            } else {
                res.status(200).send({ ok: true, result: data[0] });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al obtener la reserva' });
        });
};

const create = (req, res) => {
    const { fecha_inicio, fecha_fin, ubicacion, equipos, djs } = req.body;
    const id_usuario = req.user.id;

    // Paso 1: obtener datos del usuario
    supabase
        .from('usuario')
        .select('*')
        .eq('id_usuario', id_usuario)
        .then(({ data, error }) => {
            if (error || data.length === 0) {
                return res.status(404).send({ ok: false, error: 'Usuario no encontrado' });
            }

            const usuario = data[0];
            const esAdmin = usuario.rol === 'admin';

            const datosCliente = esAdmin ? {
                cliente_dni_nie_cif: req.body.cliente_dni_nie_cif,
                cliente_nombre: req.body.cliente_nombre,
                cliente_email: req.body.cliente_email,
                cliente_telefono: req.body.cliente_telefono,
                cliente_direccion: req.body.cliente_direccion,
                cliente_codigo_postal: req.body.cliente_codigo_postal,
                cliente_localidad: req.body.cliente_localidad,
                cliente_provincia: req.body.cliente_provincia
            } : {
                cliente_dni_nie_cif: usuario.dni_nie_cif,
                cliente_nombre: usuario.nombre,
                cliente_email: usuario.email,
                cliente_telefono: usuario.telefono,
                cliente_direccion: usuario.direccion,
                cliente_codigo_postal: usuario.codigo_postal,
                cliente_localidad: usuario.localidad,
                cliente_provincia: usuario.provincia
            };

            // Validar que si es admin ha mandado todos los datos del cliente
            if (esAdmin) {
                const camposFaltantes = Object.values(datosCliente).some(v => !v);
                if (camposFaltantes) {
                    return res.status(400).send({ ok: false, error: 'Faltan datos del cliente' });
                }
            }

            // Paso 2: comprobar solapamiento de equipos
            const idsEquipos = equipos.map(e => e.id_equipo);

            return supabase
                .from('incluye')
                .select('id_equipo, reserva(fecha_inicio, fecha_fin, estado_reserva)')
                .in('id_equipo', idsEquipos)
                .then(({ data, error }) => {
                    if (error) {
                        return res.status(500).send({ ok: false, error: error.message });
                    }

                    const solapamiento = data.some(item => {
                        const r = item.reserva;
                        if (r.estado_reserva === 'cancelada') return false;
                        return new Date(fecha_inicio) < new Date(r.fecha_fin) &&
                            new Date(fecha_fin) > new Date(r.fecha_inicio);
                    });

                    if (solapamiento) {
                        return res.status(400).send({ ok: false, error: 'Uno o más equipos no están disponibles en esas fechas' });
                    }

                    // Paso 3: comprobar solapamiento de DJs
                    const idsDjs = djs;

                    return supabase
                        .from('contrata')
                        .select('id_dj, reserva(fecha_inicio, fecha_fin, estado_reserva)')
                        .in('id_dj', idsDjs)
                        .then(({ data, error }) => {
                            if (error) {
                                return res.status(500).send({ ok: false, error: error.message });
                            }

                            const solapamiento = data.some(item => {
                                const r = item.reserva;
                                if (r.estado_reserva === 'cancelada') return false;
                                return new Date(fecha_inicio) < new Date(r.fecha_fin) &&
                                    new Date(fecha_fin) > new Date(r.fecha_inicio);
                            });

                            if (solapamiento) {
                                return res.status(400).send({ ok: false, error: 'Uno o más DJs no están disponibles en esas fechas' });
                            }

                            // Paso 4: insertar la reserva
                            const nuevaReserva = {
                                fecha_inicio,
                                fecha_fin,
                                ubicacion,
                                estado_reserva: 'pendiente',
                                id_usuario: esAdmin ? null : id_usuario,
                                ...datosCliente
                            };

                            return supabase
                                .from('reserva')
                                .insert(nuevaReserva)
                                .select()
                                .then(({ data, error }) => {
                                    if (error) {
                                        return res.status(500).send({ ok: false, error: error.message });
                                    }

                                    const reserva = data[0];

                                    // Paso 5: insertar equipos en incluye
                                    const registrosIncluye = equipos.map(e => ({
                                        id_reserva: reserva.id_reserva,
                                        id_equipo: e.id_equipo,
                                        cantidad: e.cantidad
                                    }));

                                    return supabase
                                        .from('incluye')
                                        .insert(registrosIncluye)
                                        .then(({ error }) => {
                                            if (error) {
                                                return res.status(500).send({ ok: false, error: error.message });
                                            }

                                            // Paso 6: insertar DJs en contrata
                                            const registrosContrata = idsDjs.map(id_dj => ({
                                                id_reserva: reserva.id_reserva,
                                                id_dj
                                            }));

                                            return supabase
                                                .from('contrata')
                                                .insert(registrosContrata)
                                                .then(({ error }) => {
                                                    if (error) {
                                                        return res.status(500).send({ ok: false, error: error.message });
                                                    }

                                                    // Paso 7: obtener precios de equipos y DJs
                                                    return Promise.all([
                                                        supabase.from('equipo').select('id_equipo, nombre, precio_alquiler_hora').in('id_equipo', idsEquipos),
                                                        supabase.from('dj').select('id_dj, nombre, precio_hora').in('id_dj', idsDjs)
                                                    ]).then(([resultEquipos, resultDjs]) => {
                                                        if (resultEquipos.error || resultDjs.error) {
                                                            return res.status(500).send({ ok: false, error: 'Error al obtener precios' });
                                                        }

                                                        // Paso 8: calcular importes
                                                        const horas = (new Date(fecha_fin) - new Date(fecha_inicio)) / (1000 * 60 * 60);

                                                        const totalEquipos = equipos.reduce((suma, e) => {
                                                            const equipo = resultEquipos.data.find(eq => eq.id_equipo === e.id_equipo);
                                                            return suma + (equipo.precio_alquiler_hora * e.cantidad * horas);
                                                        }, 0);

                                                        const totalDjs = resultDjs.data.reduce((suma, dj) => {
                                                            return suma + (dj.precio_hora * horas);
                                                        }, 0);

                                                        const base_imponible = totalEquipos + totalDjs;
                                                        const total = base_imponible * 1.21;

                                                        // Paso 9: insertar presupuesto
                                                        const fecha_limite = new Date();
                                                        fecha_limite.setHours(fecha_limite.getHours() + 48);

                                                        return supabase
                                                            .from('presupuesto')
                                                            .insert({
                                                                id_reserva: reserva.id_reserva,
                                                                estado: 'pendiente',
                                                                base_imponible: base_imponible.toFixed(2),
                                                                total: total.toFixed(2),
                                                                fecha_limite
                                                            })
                                                            .select()
                                                            .then(({ data, error }) => {
                                                                if (error) {
                                                                    return res.status(500).send({ ok: false, error: error.message });
                                                                }

                                                                const presupuesto = data[0];

                                                                // Paso 10: insertar detalle_presupuesto
                                                                const lineasEquipos = equipos.map(e => {
                                                                    const equipo = resultEquipos.data.find(eq => eq.id_equipo === e.id_equipo);
                                                                    const subtotal = equipo.precio_alquiler_hora * e.cantidad * horas;
                                                                    return {
                                                                        id_presupuesto: presupuesto.id_presupuesto,
                                                                        concepto: equipo.nombre,
                                                                        cantidad: e.cantidad,
                                                                        precio_unitario: equipo.precio_alquiler_hora,
                                                                        subtotal: parseFloat(subtotal.toFixed(2))
                                                                    };
                                                                });

                                                                const lineasDjs = resultDjs.data.map(dj => {
                                                                    const subtotal = dj.precio_hora * horas;
                                                                    return {
                                                                        id_presupuesto: presupuesto.id_presupuesto,
                                                                        concepto: dj.nombre,
                                                                        cantidad: 1,
                                                                        precio_unitario: dj.precio_hora,
                                                                        subtotal: parseFloat(subtotal.toFixed(2))
                                                                    };
                                                                });

                                                                const lineasDetalle = [...lineasEquipos, ...lineasDjs];

                                                                return supabase
                                                                    .from('detalle_presupuesto')
                                                                    .insert(lineasDetalle)
                                                                    .select()
                                                                    .then(({ data: detalleData, error: detalleError }) => {
                                                                        if (detalleError) {
                                                                            return res.status(500).send({ ok: false, error: detalleError.message });
                                                                        }

                                                                        return res.status(200).send({
                                                                            ok: true,
                                                                            result: {
                                                                                reserva,
                                                                                presupuesto,
                                                                                detalle: detalleData
                                                                            }
                                                                        });
                                                                    });
                                                            });

                                                    });
                                                });
                                        });
                                });
                        });
                });
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al crear la reserva' });
        });
};

const update = (req, res) => {
    supabase
        .from('reserva')
        .update(req.body)
        .eq('id_reserva', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al actualizar la reserva' });
        });
};

const remove = (req, res) => {
    supabase
        .from('reserva')
        .delete()
        .eq('id_reserva', req.params.id)
        .then(({ data, error }) => {
            if (error) {
                res.status(500).send({ ok: false, error: error.message });
            } else {
                res.status(200).send({ ok: true, result: data });
            }
        })
        .catch(error => {
            res.status(500).send({ ok: false, error: 'Error al eliminar la reserva' });
        });
};

module.exports = { getAll, getById, create, update, remove };