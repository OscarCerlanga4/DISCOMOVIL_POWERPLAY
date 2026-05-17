// Controlador de tokens de acción de un solo uso (para aceptar/rechazar presupuestos por email).
// Valida que el token sea válido (no usado y no expirado), lo marca como usado,
// ejecuta la acción correspondiente y redirige al frontend con el estado resultante.

const { supabase } = require('../db/supabase');
const { llamarN8N } = require('../utils/n8n');

const usarToken = async (req, res) => {
    const { token } = req.params;

    const { data, error } = await supabase
        .from('token_accion')
        .select('*')
        .eq('token', token)
        .eq('usado', false)
        .gt('expires_at', new Date().toISOString())
        .single();

    if (error || !data) {
        return res.redirect(`${process.env.FRONTEND_URL}/presupuesto-confirmado?estado=invalido`);
    }

    await supabase
        .from('token_accion')
        .update({ usado: true })
        .eq('id', data.id);

    if (data.tipo === 'aceptar_presupuesto') {
        await supabase
            .from('presupuesto')
            .update({ estado: 'aceptado_cliente' })
            .eq('id_presupuesto', data.id_referencia);

        const { data: presupuestoCompleto } = await supabase
            .from('presupuesto')
            .select('*, reserva(cliente_email, cliente_nombre, fecha_inicio), detalle_presupuesto(*)')
            .eq('id_presupuesto', data.id_referencia)
            .single();

        const { data: empresa } = await supabase.from('datos_empresa').select('*').single();

        if (presupuestoCompleto) {
            const { generarPdfPresupuesto } = require('../utils/generarPdf');
            generarPdfPresupuesto(presupuestoCompleto).then(pdfBase64 => {
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                llamarN8N(process.env.N8N_WEBHOOK_CLIENTE_ACEPTA, {
                    cliente_nombre: presupuestoCompleto.reserva?.cliente_nombre,
                    fecha_evento: presupuestoCompleto.reserva?.fecha_inicio,
                    total: presupuestoCompleto.total,
                    admin_email: empresa?.email,
                    nombre_empresa: empresa?.nombre_empresa || 'Power Play',
                    pdf_base64: pdfBase64,
                    url_presupuesto: `${frontendUrl}/admin?presupuesto=${presupuestoCompleto.id_presupuesto}`
                });
            });
        }
        return res.redirect(`${process.env.FRONTEND_URL}/presupuesto-confirmado?estado=aceptado&id=${data.id_referencia}`);
    }

    if (data.tipo === 'rechazar_presupuesto') {
        const { data: presupuesto } = await supabase
            .from('presupuesto')
            .update({ estado: 'rechazado' })
            .eq('id_presupuesto', data.id_referencia)
            .select('id_reserva')
            .single();

        if (presupuesto?.id_reserva) {
            await supabase
                .from('reserva')
                .update({ estado_reserva: 'cancelada' })
                .eq('id_reserva', presupuesto.id_reserva);
        }
        const { data: presupuestoCompleto } = await supabase
            .from('presupuesto')
            .select('*, reserva(cliente_email, cliente_nombre, fecha_inicio)')
            .eq('id_presupuesto', data.id_referencia)
            .single();

        if (presupuestoCompleto) {
            llamarN8N(process.env.N8N_WEBHOOK_RECHAZADO, {
                cliente_email: presupuestoCompleto.reserva?.cliente_email,
                cliente_nombre: presupuestoCompleto.reserva?.cliente_nombre,
                fecha_evento: presupuestoCompleto.reserva?.fecha_inicio
            });
        }
        return res.redirect(`${process.env.FRONTEND_URL}/presupuesto-confirmado?estado=rechazado&id=${data.id_referencia}`);
    }

    return res.redirect(`${process.env.FRONTEND_URL}/presupuesto-confirmado?estado=invalido`);
};

module.exports = { usarToken };