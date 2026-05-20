// Controlador de reservas. El endpoint create ejecuta 10 pasos en secuencia:
// 1. Obtener datos del usuario (o datos de cliente manual si es admin).
// 2. Verificar solapamiento exacto de equipos y viabilidad de desplazamiento (ventana 8h con Google Maps).
// 3. Verificar solapamiento exacto de DJs y viabilidad de desplazamiento.
// 4-6. Insertar reserva, registros en 'incluye' (equipos) y 'contrata' (DJs).
// 7-8. Obtener precios y calcular base imponible + IVA.
// 9-10. Insertar presupuesto (validez 48h) y sus líneas de detalle.
// Tras enviar la respuesta HTTP: genera PDF, crea tokens de aceptar/rechazar y llama a N8N.

const { supabase } = require('../db/supabase');
const { calcularTiempoViaje } = require('../services/mapsService')
const { llamarN8N } = require('../utils/n8n');
const { generarPdfPresupuesto } = require('../utils/generarPdf');

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

const getById = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reserva').select('*').eq('id_reserva', req.params.id);
        if (error) {
            return res.status(500).send({ ok: false, error: error.message });
        }
        if (data.length === 0) {
            return res.status(404).send({ ok: false, error: 'Reserva no encontrada' });
        }

        const { data: rolData } = await supabase
            .from('usuario').select('rol').eq('id_usuario', req.user.id);
        const rol = rolData?.[0]?.rol;

        if (rol !== 'admin' && data[0].id_usuario !== req.user.id) {
            return res.status(403).send({ ok: false, error: 'No tienes permiso para ver esta reserva' });
        }

        res.status(200).send({ ok: true, result: data[0] });
    } catch (error) {
        res.status(500).send({ ok: false, error: 'Error al obtener la reserva' });
    }
};

const create = async (req, res) => {
    const { fecha_inicio, fecha_fin, ubicacion, equipos, djs } = req.body;
    const id_usuario = req.user.id;

    try {
        // Paso 1: obtener datos del usuario
        const { data: usuarioArr, error: usuarioError } = await supabase
            .from('usuario').select('*').eq('id_usuario', id_usuario);
        if (usuarioError || usuarioArr.length === 0) {
            return res.status(404).send({ ok: false, error: 'Usuario no encontrado' });
        }
        const usuario = usuarioArr[0];
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

        if (esAdmin && Object.values(datosCliente).some(v => !v)) {
            return res.status(400).send({ ok: false, error: 'Faltan datos del cliente' });
        }

        // Paso 2: comprobar solapamiento de equipos
        const idsEquipos = equipos.map(e => e.id_equipo);
        const { data: incluyeData, error: incluyeError } = await supabase
            .from('incluye')
            .select('id_equipo, reserva(fecha_inicio, fecha_fin, estado_reserva, ubicacion)')
            .in('id_equipo', idsEquipos);
        if (incluyeError) return res.status(500).send({ ok: false, error: incluyeError.message });

        const solapamientoExactoEquipos = incluyeData.some(item => {
            const r = item.reserva;
            if (r.estado_reserva === 'cancelada') return false;
            return new Date(fecha_inicio) < new Date(r.fecha_fin) && new Date(fecha_fin) > new Date(r.fecha_inicio);
        });
        if (solapamientoExactoEquipos) {
            return res.status(400).send({ ok: false, error: 'Uno o más equipos no están disponibles en esas fechas' });
        }

        const ocho_horas = 8 * 60 * 60 * 1000;
        const reservasVecinasEquipos = incluyeData.filter(item => {
            const r = item.reserva;
            if (r.estado_reserva === 'cancelada' || !r.ubicacion) return false;
            const gapAntes = new Date(fecha_inicio) - new Date(r.fecha_fin);
            const gapDespues = new Date(r.fecha_inicio) - new Date(fecha_fin);
            return (gapAntes >= 0 && gapAntes < ocho_horas) || (gapDespues >= 0 && gapDespues < ocho_horas);
        });

        for (const item of reservasVecinasEquipos) {
            const r = item.reserva;
            if (r.ubicacion === ubicacion) continue;
            const gapAntes = new Date(fecha_inicio) - new Date(r.fecha_fin);
            const gapDespues = new Date(r.fecha_inicio) - new Date(fecha_fin);
            const gap = gapAntes >= 0 ? gapAntes : gapDespues;
            const origen = gapAntes >= 0 ? r.ubicacion : ubicacion;
            const destino = gapAntes >= 0 ? ubicacion : r.ubicacion;
            try {
                const minutosViaje = await calcularTiempoViaje(origen, destino);
                if (minutosViaje !== null && minutosViaje * 60 * 1000 > gap) {
                    const gapMin = Math.floor(gap / 60000);
                    return res.status(400).send({ ok: false, error: `Un equipo no tiene tiempo suficiente para desplazarse entre ubicaciones (necesita ${minutosViaje} min, disponibles ${gapMin} min)` });
                }
            } catch (_) {}
        }

        if (reservasVecinasEquipos.length === 0) {
            const gapHastaEvento = new Date(fecha_inicio) - new Date();
            if (gapHastaEvento >= 0 && gapHastaEvento < ocho_horas) {
                try {
                    const minutosViaje = await calcularTiempoViaje('Tauste, Zaragoza', ubicacion);
                    if (minutosViaje !== null && minutosViaje * 60 * 1000 > gapHastaEvento) {
                        const gapMin = Math.floor(gapHastaEvento / 60000);
                        return res.status(400).send({ ok: false, error: `El equipo no tiene tiempo suficiente para desplazarse desde Tauste hasta el evento (necesita ${minutosViaje} min, disponibles ${gapMin} min)` });
                    }
                } catch (_) {}
            }
        }

        // Paso 3: comprobar solapamiento de DJs
        const idsDjs = djs;
        const { data: contrataData, error: contrataError } = await supabase
            .from('contrata')
            .select('id_dj, reserva(fecha_inicio, fecha_fin, estado_reserva, ubicacion)')
            .in('id_dj', idsDjs);
        if (contrataError) return res.status(500).send({ ok: false, error: contrataError.message });

        const solapamientoExactoDjs = contrataData.some(item => {
            const r = item.reserva;
            if (!['pendiente', 'confirmada'].includes(r.estado_reserva)) return false;
            return new Date(fecha_inicio) < new Date(r.fecha_fin) && new Date(fecha_fin) > new Date(r.fecha_inicio);
        });
        if (solapamientoExactoDjs) {
            return res.status(400).send({ ok: false, error: 'Uno o más DJs no están disponibles en esas fechas' });
        }

        const reservasVecinasDjs = contrataData.filter(item => {
            const r = item.reserva;
            if (!['pendiente', 'confirmada'].includes(r.estado_reserva) || !r.ubicacion) return false;
            const gapAntes = new Date(fecha_inicio) - new Date(r.fecha_fin);
            const gapDespues = new Date(r.fecha_inicio) - new Date(fecha_fin);
            return (gapAntes >= 0 && gapAntes < ocho_horas) || (gapDespues >= 0 && gapDespues < ocho_horas);
        });

        for (const item of reservasVecinasDjs) {
            const r = item.reserva;
            if (r.ubicacion === ubicacion) continue;
            const gapAntes = new Date(fecha_inicio) - new Date(r.fecha_fin);
            const gapDespues = new Date(r.fecha_inicio) - new Date(fecha_fin);
            if (gapAntes >= 0 && gapAntes < ocho_horas) {
                try {
                    const minutosViaje = await calcularTiempoViaje(r.ubicacion, ubicacion);
                    if (minutosViaje !== null && minutosViaje * 60 * 1000 > gapAntes) {
                        const gapMin = Math.floor(gapAntes / 60000);
                        return res.status(400).send({ ok: false, error: `Un equipo no tiene tiempo para desplazarse entre ubicaciones (necesita ${minutosViaje} min, disponibles ${gapMin} min (Aproximadamente))` });
                    }
                } catch (_) {}
            }
            if (gapDespues >= 0 && gapDespues < ocho_horas) {
                try {
                    const minutosViaje = await calcularTiempoViaje(ubicacion, r.ubicacion);
                    if (minutosViaje !== null && minutosViaje * 60 * 1000 > gapDespues) {
                        const gapMin = Math.floor(gapDespues / 60000);
                        return res.status(400).send({ ok: false, error: `Un equipo no tiene tiempo para desplazarse entre ubicaciones (necesita ${minutosViaje} min, disponibles ${gapMin} min (Aproximadamente))` });
                    }
                } catch (_) {}
            }
        }

        if (reservasVecinasDjs.length === 0) {
            const gapHastaEvento = new Date(fecha_inicio) - new Date();
            if (gapHastaEvento >= 0 && gapHastaEvento < ocho_horas) {
                try {
                    const minutosViaje = await calcularTiempoViaje('Tauste, Zaragoza', ubicacion);
                    if (minutosViaje !== null && minutosViaje * 60 * 1000 > gapHastaEvento) {
                        const gapMin = Math.floor(gapHastaEvento / 60000);
                        return res.status(400).send({ ok: false, error: `El DJ no tiene tiempo suficiente para desplazarse desde Tauste hasta el evento (necesita ${minutosViaje} min, disponibles ${gapMin} min)` });
                    }
                } catch (_) {}
            }
        }

        // Paso 4: insertar la reserva
        const { data: reservaData, error: reservaError } = await supabase
            .from('reserva')
            .insert({ fecha_inicio, fecha_fin, ubicacion, estado_reserva: 'pendiente', id_usuario: esAdmin ? null : id_usuario, ...datosCliente })
            .select();
        if (reservaError) return res.status(500).send({ ok: false, error: reservaError.message });
        const reserva = reservaData[0];

        // Paso 5: insertar equipos en incluye
        const registrosIncluye = equipos.map(e => ({ id_reserva: reserva.id_reserva, id_equipo: e.id_equipo, cantidad: e.cantidad }));
        const { error: incluyeInsertError } = await supabase.from('incluye').insert(registrosIncluye);
        if (incluyeInsertError) return res.status(500).send({ ok: false, error: incluyeInsertError.message });

        // Paso 6: insertar DJs en contrata
        const registrosContrata = idsDjs.map(id_dj => ({ id_reserva: reserva.id_reserva, id_dj }));
        const { error: contrataInsertError } = await supabase.from('contrata').insert(registrosContrata);
        if (contrataInsertError) return res.status(500).send({ ok: false, error: contrataInsertError.message });

        // Paso 7: obtener precios de equipos y DJs
        const [resultEquipos, resultDjs] = await Promise.all([
            supabase.from('equipo').select('id_equipo, nombre, precio_alquiler_hora').in('id_equipo', idsEquipos),
            supabase.from('dj').select('id_dj, nombre, precio_hora').in('id_dj', idsDjs)
        ]);
        if (resultEquipos.error || resultDjs.error) {
            return res.status(500).send({ ok: false, error: 'Error al obtener precios' });
        }

        // Paso 8: calcular importes
        const horas = (new Date(fecha_fin) - new Date(fecha_inicio)) / (1000 * 60 * 60);
        const totalEquipos = equipos.reduce((suma, e) => {
            const equipo = resultEquipos.data.find(eq => eq.id_equipo === e.id_equipo);
            return suma + (equipo.precio_alquiler_hora * e.cantidad * horas);
        }, 0);
        const totalDjs = resultDjs.data.reduce((suma, dj) => suma + (dj.precio_hora * horas), 0);
        const base_imponible = totalEquipos + totalDjs;
        const total = base_imponible * 1.21;

        // Paso 9: insertar presupuesto
        const fecha_limite = new Date();
        fecha_limite.setHours(fecha_limite.getHours() + 48);
        const { data: presupuestoData, error: presupuestoError } = await supabase
            .from('presupuesto')
            .insert({ id_reserva: reserva.id_reserva, estado: 'pendiente', base_imponible: base_imponible.toFixed(2), total: total.toFixed(2), fecha_limite })
            .select();
        if (presupuestoError) return res.status(500).send({ ok: false, error: presupuestoError.message });
        const presupuesto = presupuestoData[0];

        // Paso 10: insertar detalle_presupuesto
        const lineasEquipos = equipos.map(e => {
            const equipo = resultEquipos.data.find(eq => eq.id_equipo === e.id_equipo);
            const subtotal = equipo.precio_alquiler_hora * e.cantidad * horas;
            return { id_presupuesto: presupuesto.id_presupuesto, concepto: equipo.nombre, cantidad: e.cantidad, precio_unitario: equipo.precio_alquiler_hora, subtotal: parseFloat(subtotal.toFixed(2)) };
        });
        const lineasDjs = resultDjs.data.map(dj => {
            const subtotal = dj.precio_hora * horas;
            return { id_presupuesto: presupuesto.id_presupuesto, concepto: dj.nombre, cantidad: 1, precio_unitario: dj.precio_hora, subtotal: parseFloat(subtotal.toFixed(2)) };
        });
        const { data: detalleData, error: detalleError } = await supabase
            .from('detalle_presupuesto').insert([...lineasEquipos, ...lineasDjs]).select();
        if (detalleError) return res.status(500).send({ ok: false, error: detalleError.message });

        res.status(200).send({ ok: true, result: { reserva, presupuesto, detalle: detalleData } });

        // Fire-and-forget: PDF + tokens + N8N
        const presupuestoCompleto = { ...presupuesto, reserva, detalle_presupuesto: detalleData };
        supabase.from('datos_empresa').select('*').single()
            .then(({ data: empresa }) => Promise.all([
                generarPdfPresupuesto(presupuestoCompleto),
                supabase.from('token_accion')
                    .insert([
                        { tipo: 'aceptar_presupuesto', id_referencia: presupuesto.id_presupuesto },
                        { tipo: 'rechazar_presupuesto', id_referencia: presupuesto.id_presupuesto }
                    ])
                    .select()
            ]).then(([pdfBase64, { data: tokenData }]) => {
                const tokenAceptar = tokenData?.[0]?.token;
                const tokenRechazar = tokenData?.[1]?.token;
                const baseUrl = process.env.BACKEND_URL || 'http://localhost:3005';
                return llamarN8N(process.env.N8N_WEBHOOK_PRESUPUESTO_CREADO, {
                    cliente_email: reserva.cliente_email,
                    cliente_nombre: reserva.cliente_nombre,
                    fecha_evento: reserva.fecha_inicio,
                    total: presupuesto.total,
                    fecha_limite: presupuesto.fecha_limite,
                    url_aceptar: `${baseUrl}/api/tokens/${tokenAceptar}/usar`,
                    url_rechazar: `${baseUrl}/api/tokens/${tokenRechazar}/usar`,
                    pdf_base64: pdfBase64,
                    nombre_empresa: empresa?.nombre_empresa || 'Power Play'
                });
            }))
            .catch(err => console.error('Error llamando a N8N (presupuesto creado):', err.message));

    } catch (error) {
        res.status(500).send({ ok: false, error: 'Error al crear la reserva' });
    }
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