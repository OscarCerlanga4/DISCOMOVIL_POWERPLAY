// Controlador de disponibilidad para un rango de fechas dado.
// Busca reservas solapantes (no canceladas), luego consulta contrata e incluye
// para determinar qué DJs están ocupados y qué stock de equipo queda disponible.

const { supabase } = require('../db/supabase')

const getDisponibilidad = async (req, res) => {
    const { fecha_inicio, fecha_fin } = req.query;

    if (!fecha_inicio || !fecha_fin) {
        return res.status(400).send({ ok: false, error: 'fecha_inicio y fecha_fin son requeridas' });
    }
    if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
        return res.status(400).send({ ok: false, error: 'fecha_fin debe ser posterior a fecha_inicio' });
    }

    try {
        const { data: reservas, error: reservaError } = await supabase
            .from('reserva')
            .select('id_reserva')
            .neq('estado_reserva', 'cancelada')
            .lt('fecha_inicio', fecha_fin)
            .gt('fecha_fin', fecha_inicio);

        if (reservaError) return res.status(500).send({ ok: false, error: reservaError.message });
        if (!reservas || reservas.length === 0) {
            return res.status(200).send({ ok: true, equipos_ocupados: [], djs_ocupados: [], disponibilidad_equipos: {} });
        }

        const idReservas = reservas.map(r => r.id_reserva);

        const { data: contratas, error: contrataError } = await supabase
            .from('contrata').select('id_dj').in('id_reserva', idReservas);
        if (contrataError) return res.status(500).send({ ok: false, error: contrataError.message });

        const djsOcupados = [];
        if (contratas) {
            contratas.forEach(c => { if (!djsOcupados.includes(c.id_dj)) djsOcupados.push(c.id_dj); });
        }

        const { data: incluyes, error: incluyeError } = await supabase
            .from('incluye').select('id_equipo, cantidad').in('id_reserva', idReservas);
        if (incluyeError) return res.status(500).send({ ok: false, error: incluyeError.message });
        if (!incluyes || incluyes.length === 0) {
            return res.status(200).send({ ok: true, equipos_ocupados: [], djs_ocupados: djsOcupados, disponibilidad_equipos: {} });
        }

        const cantidadesPorEquipo = {};
        incluyes.forEach(i => {
            cantidadesPorEquipo[i.id_equipo] = (cantidadesPorEquipo[i.id_equipo] || 0) + i.cantidad;
        });

        const idEquipos = Object.keys(cantidadesPorEquipo);
        const { data: equipos, error: equipoError } = await supabase
            .from('equipo').select('id_equipo, stock_total').in('id_equipo', idEquipos);
        if (equipoError) return res.status(500).send({ ok: false, error: equipoError.message });

        const equiposOcupados = [];
        const disponibilidad_equipos = {};
        if (equipos) {
            equipos.forEach(e => {
                const cantidadReservada = cantidadesPorEquipo[e.id_equipo] || 0;
                disponibilidad_equipos[e.id_equipo] = Math.max(0, e.stock_total - cantidadReservada);
                if (cantidadReservada >= e.stock_total) equiposOcupados.push(e.id_equipo);
            });
        }

        res.status(200).send({ ok: true, equipos_ocupados: equiposOcupados, djs_ocupados: djsOcupados, disponibilidad_equipos });
    } catch (error) {
        res.status(500).send({ ok: false, error: 'Error al obtener disponibilidad' });
    }
};

module.exports = { getDisponibilidad }