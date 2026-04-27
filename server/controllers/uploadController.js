const { supabase } = require('../db/supabase');

const uploadImagen = (req, res) => {
    const { base64, nombre, tipo } = req.body;

    if (!base64 || !nombre || !tipo) {
        return res.status(400).send({ ok: false, error: 'Faltan datos de la imagen.' });
    }

    const buffer = Buffer.from(base64, 'base64');
    const extension = nombre.split('.').pop();
    const nombreArchivo = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

    supabase.storage
        .from('imagenes')
        .upload(nombreArchivo, buffer, { contentType: tipo, upsert: false })
        .then(({ data, error }) => {
            if (error) return res.status(500).send({ ok: false, error: error.message });
            const { data: urlData } = supabase.storage.from('imagenes').getPublicUrl(data.path);
            res.status(200).send({ ok: true, url: urlData.publicUrl });
        })
        .catch(() => res.status(500).send({ ok: false, error: 'Error al subir la imagen.' }));
};

module.exports = { uploadImagen };