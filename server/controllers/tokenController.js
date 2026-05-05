const { supabase } = require('../db/supabase');

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

        return res.redirect(`${process.env.FRONTEND_URL}/presupuesto-confirmado?estado=rechazado&id=${data.id_referencia}`);
    }

    return res.redirect(`${process.env.FRONTEND_URL}/presupuesto-confirmado?estado=invalido`);
};

module.exports = { usarToken };