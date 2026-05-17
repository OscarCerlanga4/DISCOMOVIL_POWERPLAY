// Genera PDFs de presupuesto y factura usando jsPDF + jspdf-autotable.
// cargarImagenBase64 descarga el logo desde Supabase Storage y lo incrusta en base64 para
// que funcione en entornos Node sin acceso al DOM. formatearFecha/formatearFechaHora usan
// timezone Europe/Madrid para coincidir con el resto de la aplicación.
// generarPdfPresupuesto y generarPdfFactura devuelven un Buffer listo para adjuntar al email de N8N.

const { jsPDF } = require('jspdf');
const _autoTableMod = require('jspdf-autotable');
const autoTable = typeof _autoTableMod === 'function' ? _autoTableMod : (_autoTableMod.default || _autoTableMod);
const { supabase } = require('../db/supabase');

const cargarImagenBase64 = async (url) => {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mime = res.headers.get('content-type') || 'image/png';
        return `data:${mime};base64,${base64}`;
    } catch {
        return null;
    }
};

const formatearFecha = (fecha) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Madrid' });
};

const formatearFechaHora = (fecha) => {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
};

const dibujarCabeceraEmpresa = (doc, margen, y, logoBase64, empresa) => {
    const boxH = 44;
    const boxW = 174;

    doc.setFillColor(248, 248, 248);
    doc.setDrawColor(215, 215, 215);
    doc.setLineWidth(0.3);
    doc.rect(margen, y, boxW, boxH, 'FD');

    doc.setFillColor(255, 230, 0);
    doc.rect(margen, y, 4, boxH, 'F');

    if (logoBase64) {
        try { doc.addImage(logoBase64, 'PNG', margen + 7, y + 5, 66, 34); } catch {}
    }

    if (empresa) {
        const dataX = margen + 80;
        let lineY = y + 11;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 20, 20);
        doc.text(empresa.nombre_empresa || '', dataX, lineY);
        lineY += 7;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(75, 75, 75);

        if (empresa.cif) { doc.text(`CIF: ${empresa.cif}`, dataX, lineY); lineY += 5.5; }
        if (empresa.direccion) { doc.text(empresa.direccion, dataX, lineY); lineY += 5.5; }
        const cpLocalProv = [empresa.codigo_postal, empresa.localidad, empresa.provincia].filter(Boolean).join(', ');
        if (cpLocalProv) { doc.text(cpLocalProv, dataX, lineY); lineY += 5.5; }
        const contacto = [empresa.telefono ? `Tel: ${empresa.telefono}` : null, empresa.email || null].filter(Boolean).join('   ·   ');
        if (contacto) doc.text(contacto, dataX, lineY);
    }

    return y + boxH + 8;
};

const obtenerEmpresa = async () => {
    const { data } = await supabase.from('datos_empresa').select('*').single();
    return data;
};

const dibujarSeccionCliente = (doc, reserva, margen, y) => {
    doc.setFillColor(247, 247, 247);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.rect(margen, y, 174, 32, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(130, 130, 130);
    doc.text('CLIENTE', margen + 5, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(reserva?.cliente_nombre || '', margen + 5, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(`DNI/CIF: ${reserva?.cliente_dni_nie_cif || ''}`, margen + 5, y + 19);
    doc.text(reserva?.cliente_direccion || '', margen + 5, y + 25);
    const cpCliente = [reserva?.cliente_codigo_postal, reserva?.cliente_localidad, reserva?.cliente_provincia].filter(Boolean).join(', ');
    doc.text(cpCliente, margen + 95, y + 13);
    doc.text(`Email: ${reserva?.cliente_email || ''}`, margen + 95, y + 19);
    doc.text(`Tel: ${reserva?.cliente_telefono || ''}`, margen + 95, y + 25);
    return y + 40;
};

const dibujarSeccionFechas = (doc, reserva, margen, y) => {
    const colIzq = margen, colDer = margen + 95;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(130, 130, 130);
    doc.text('INICIO', colIzq, y);
    doc.text('UBICACIÓN', colDer, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    doc.text(formatearFechaHora(reserva?.fecha_inicio), colIzq, y);
    doc.text(doc.splitTextToSize(reserva?.ubicacion || '—', 210 - margen - colDer), colDer, y);
    y += 9;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(130, 130, 130);
    doc.text('FIN', colIzq, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    doc.text(formatearFechaHora(reserva?.fecha_fin), colIzq, y);
    return y + 12;
};

const dibujarTablaDetalle = (doc, detalles, y, margen) => {
    autoTable(doc, {
        startY: y,
        head: [['CONCEPTO', 'CANT.', 'PRECIO/HORA', 'SUBTOTAL']],
        body: detalles.length > 0
            ? detalles.map(d => [d.concepto, d.cantidad, `${parseFloat(d.precio_unitario).toFixed(2)} €`, `${parseFloat(d.subtotal).toFixed(2)} €`])
            : [['Sin detalles disponibles', '', '', '']],
        headStyles: { fillColor: [255, 230, 0], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5, cellPadding: 4 },
        bodyStyles: { fontSize: 8.5, textColor: [50, 50, 50], cellPadding: 3.5 },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: { 0: { cellWidth: 85 }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 38, halign: 'right' }, 3: { cellWidth: 31, halign: 'right' } },
        margin: { left: margen, right: margen }
    });
    return doc.lastAutoTable.finalY + 10;
};

const generarPdfPresupuesto = async (presupuesto, empresa) => {
    const doc = new jsPDF();
    const margen = 18;
    let y = margen;

    const logoBase64 = empresa?.logo_url ? await cargarImagenBase64(empresa.logo_url) : null;

    y = dibujarCabeceraEmpresa(doc, margen, y, logoBase64, empresa);

    doc.setDrawColor(255, 230, 0);
    doc.setLineWidth(1);
    doc.line(margen, y, 210 - margen, y);
    y += 10;

    doc.setFontSize(24);
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.text('PRESUPUESTO', margen, y);

    const numPres = `PRES-${new Date().getFullYear()}-${String(presupuesto.id_presupuesto).padStart(4, '0')}`;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(200, 150, 0);
    doc.text(`Ref: ${numPres}`, 210 - margen, y - 6, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Fecha: ${formatearFecha(presupuesto.fecha_emision)}`, 210 - margen, y, { align: 'right' });
    if (presupuesto.estado === 'pendiente') {
        doc.text(`Válido hasta: ${formatearFecha(presupuesto.fecha_limite)}`, 210 - margen, y + 6, { align: 'right' });
    }
    y += 14;

    doc.setFillColor(247, 247, 247);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.rect(margen, y, 174, 32, 'FD');
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(130, 130, 130);
    doc.text('CLIENTE', margen + 5, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(presupuesto.reserva?.cliente_nombre || '', margen + 5, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    doc.text(`DNI/CIF: ${presupuesto.reserva?.cliente_dni_nie_cif || ''}`, margen + 5, y + 19);
    doc.text(presupuesto.reserva?.cliente_direccion || '', margen + 5, y + 25);
    const cpCliente = [presupuesto.reserva?.cliente_codigo_postal, presupuesto.reserva?.cliente_localidad, presupuesto.reserva?.cliente_provincia].filter(Boolean).join(', ');
    doc.text(cpCliente, margen + 95, y + 13);
    doc.text(`Email: ${presupuesto.reserva?.cliente_email || ''}`, margen + 95, y + 19);
    doc.text(`Tel: ${presupuesto.reserva?.cliente_telefono || ''}`, margen + 95, y + 25);
    y += 40;

    const colIzq = margen, colDer = margen + 95;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(130, 130, 130);
    doc.text('INICIO', colIzq, y);
    doc.text('UBICACIÓN', colDer, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    doc.text(formatearFechaHora(presupuesto.reserva?.fecha_inicio), colIzq, y);
    doc.text(doc.splitTextToSize(presupuesto.reserva?.ubicacion || '—', 210 - margen - colDer), colDer, y);
    y += 9;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(130, 130, 130);
    doc.text('FIN', colIzq, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(50, 50, 50);
    doc.text(formatearFechaHora(presupuesto.reserva?.fecha_fin), colIzq, y);
    y += 12;

    const detalles = presupuesto.detalle_presupuesto || [];
    autoTable(doc, {
        startY: y,
        head: [['CONCEPTO', 'CANT.', 'PRECIO/HORA', 'SUBTOTAL']],
        body: detalles.length > 0
            ? detalles.map(d => [d.concepto, d.cantidad, `${parseFloat(d.precio_unitario).toFixed(2)} €`, `${parseFloat(d.subtotal).toFixed(2)} €`])
            : [['Sin detalles disponibles', '', '', '']],
        headStyles: { fillColor: [255, 230, 0], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5, cellPadding: 4 },
        bodyStyles: { fontSize: 8.5, textColor: [50, 50, 50], cellPadding: 3.5 },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: { 0: { cellWidth: 85 }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 38, halign: 'right' }, 3: { cellWidth: 31, halign: 'right' } },
        margin: { left: margen, right: margen }
    });

    y = doc.lastAutoTable.finalY + 10;
    const col1 = 125, col2 = 210 - margen;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Base imponible:', col1, y);
    doc.text(`${parseFloat(presupuesto.base_imponible).toFixed(2)} €`, col2, y, { align: 'right' });
    y += 6;
    doc.text('IVA (21%):', col1, y);
    doc.text(`${(parseFloat(presupuesto.total) - parseFloat(presupuesto.base_imponible)).toFixed(2)} €`, col2, y, { align: 'right' });
    y += 3;
    doc.setDrawColor(255, 230, 0);
    doc.setLineWidth(0.6);
    doc.line(col1, y, col2, y);
    y += 7;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text('TOTAL:', col1, y);
    doc.text(`${parseFloat(presupuesto.total).toFixed(2)} €`, col2, y, { align: 'right' });
    y += 14;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(160, 160, 160);
    doc.text('Este presupuesto tiene validez hasta la fecha indicada. Para aceptarlo, acceda a su área de cliente.', margen, y);

    return Buffer.from(doc.output('arraybuffer')).toString('base64');
};

const generarPdfFactura = async (presupuesto) => {
    const empresa = await obtenerEmpresa();
    const f = presupuesto.factura;
    const doc = new jsPDF();
    const margen = 18;
    let y = margen;

    const logoBase64 = empresa?.logo_url ? await cargarImagenBase64(empresa.logo_url) : null;
    y = dibujarCabeceraEmpresa(doc, margen, y, logoBase64, empresa);

    doc.setDrawColor(255, 230, 0);
    doc.setLineWidth(1);
    doc.line(margen, y, 210 - margen, y);
    y += 10;

    doc.setFontSize(24);
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURA', margen, y);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(200, 150, 0);
    doc.text(`Nº: ${f.numero_factura}`, 210 - margen, y - 6, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Fecha de emisión: ${formatearFecha(f.fecha_emision)}`, 210 - margen, y, { align: 'right' });
    doc.text(`Estado: ${f.estado_factura === 'pagada' ? 'Pagada' : 'Pendiente de pago'}`, 210 - margen, y + 6, { align: 'right' });
    y += 14;

    y = dibujarSeccionCliente(doc, presupuesto.reserva, margen, y);
    y = dibujarSeccionFechas(doc, presupuesto.reserva, margen, y);
    y = dibujarTablaDetalle(doc, presupuesto.detalle_presupuesto || [], y, margen);

    const col1 = 125, col2 = 210 - margen;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Base imponible:', col1, y);
    doc.text(`${parseFloat(f.base_imponible).toFixed(2)} €`, col2, y, { align: 'right' });
    y += 6;
    doc.text('IVA (21%):', col1, y);
    doc.text(`${(parseFloat(f.total) - parseFloat(f.base_imponible)).toFixed(2)} €`, col2, y, { align: 'right' });
    y += 3;
    doc.setDrawColor(255, 230, 0);
    doc.setLineWidth(0.6);
    doc.line(col1, y, col2, y);
    y += 7;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text('TOTAL:', col1, y);
    doc.text(`${parseFloat(f.total).toFixed(2)} €`, col2, y, { align: 'right' });
    y += 14;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(160, 160, 160);
    doc.text('Gracias por confiar en Power Play. Para cualquier consulta, contacte con nosotros.', margen, y);

    return Buffer.from(doc.output('arraybuffer')).toString('base64');
};

module.exports = { generarPdfPresupuesto, generarPdfFactura };