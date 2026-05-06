import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import SubidaImagen from '../components/SubidaImagen'
import { API_URL } from '../lib/api'

// ── Constantes ────────────────────────────────────────────────────────────────
const LABEL = {
    fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.15em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: 0
}

const FILTROS_PRES = [
    { id: 'todos', label: 'Todos' },
    { id: 'pendiente', label: 'Pendiente' },
    { id: 'aceptado_cliente', label: 'Aceptado cliente' },
    { id: 'aceptado', label: 'Aceptado' },
    { id: 'rechazado', label: 'Rechazado' },
]

const FILTROS_FACT = [
    { id: 'todos', label: 'Todos' },
    { id: 'pendiente', label: 'Pendiente' },
    { id: 'pagada', label: 'Pagada' },
    { id: 'efectivo', label: 'Efectivo' },
    { id: 'transferencia', label: 'Transferencia' },
    { id: 'tarjeta', label: 'Tarjeta' },
]

const BADGE_PRES = {
    pendiente: { bg: 'rgba(255,200,0,0.12)', text: '#FFE600' },
    aceptado: { bg: 'rgba(96,192,96,0.12)', text: '#60c060' },
    rechazado: { bg: 'rgba(255,68,68,0.12)', text: '#ff4444' },
    aceptado_cliente: { bg: 'rgba(100,160,255,0.12)', text: '#64a0ff' },
}

const BADGE_FACT = {
    pendiente: { bg: 'rgba(255,200,0,0.12)', text: '#FFE600' },
    pagada: { bg: 'rgba(96,192,96,0.12)', text: '#60c060' },
    efectivo: { bg: 'rgba(100,200,255,0.12)', text: '#64c8ff' },
    transferencia: { bg: 'rgba(180,100,255,0.12)', text: '#b464ff' },
    tarjeta: { bg: 'rgba(255,140,60,0.12)', text: '#ff8c3c' },
}

const ACCENT_PRES = {
    pendiente: '#FFE600',
    aceptado: '#60c060',
    rechazado: '#ff4444',
    aceptado_cliente: '#64a0ff',
}

const ACCENT_FACT = {
    pendiente: '#FFE600',
    pagada: '#60c060',
    efectivo: '#64c8ff',
    transferencia: '#b464ff',
    tarjeta: '#ff8c3c',
}

const btnAmarillo = {
    background: '#FFE600', border: 'none', color: '#000',
    fontFamily: 'Bebas Neue', fontSize: '0.85rem', letterSpacing: '0.12em',
    padding: '0.55rem 1.1rem', cursor: 'pointer', transition: 'opacity 0.2s',
    whiteSpace: 'nowrap', flexShrink: 0
}

const btnVerde = {
    background: 'transparent', border: '1px solid rgba(96,192,96,0.4)', color: '#60c060',
    fontFamily: 'Bebas Neue', fontSize: '0.85rem', letterSpacing: '0.12em',
    padding: '0.55rem 1.1rem', cursor: 'pointer', transition: 'all 0.2s',
    whiteSpace: 'nowrap', flexShrink: 0
}

const btnRojo = {
    background: 'transparent', border: '1px solid rgba(255,68,68,0.4)', color: '#ff4444',
    fontFamily: 'Bebas Neue', fontSize: '0.85rem', letterSpacing: '0.12em',
    padding: '0.55rem 1.1rem', cursor: 'pointer', transition: 'all 0.2s',
    whiteSpace: 'nowrap', flexShrink: 0
}

const inputStyle = {
    background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', padding: '0.75rem 1rem', fontSize: '0.9rem',
    outline: 'none', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box'
}

// ── Badge ──────────────────────────────────────────────────────────────────────
function Badge({ estado, mapa }) {
    const c = (mapa || {})[estado] || { bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.4)' }
    return (
        <span style={{
            background: c.bg, color: c.text,
            padding: '0.2rem 0.65rem', fontSize: '0.68rem',
            fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase'
        }}>
            {(estado || '—').replace(/_/g, ' ')}
        </span>
    )
}

// ── Helpers de fecha ──────────────────────────────────────────────────────────
const formatearFecha = (fecha) => {
    if (!fecha) return '—'
    const d = new Date(fecha)
    if (isNaN(d)) return '—'
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatearFechaHora = (fecha) => {
    if (!fecha) return '—'
    const d = new Date(fecha)
    if (isNaN(d)) return '—'
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatearSoloFecha = (fecha) => {
    if (!fecha) return '—'
    const d = new Date(fecha)
    if (isNaN(d)) return '—'
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatearSoloHora = (fecha) => {
    if (!fecha) return '—'
    const d = new Date(fecha)
    if (isNaN(d)) return '—'
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

// ── Helpers PDF ───────────────────────────────────────────────────────────────
const cargarImagenBase64 = (url) =>
    fetch(url, { mode: 'cors', cache: 'no-store' })
        .then(res => { if (!res.ok) throw new Error(); return res.blob() })
        .then(blob => new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(blob)
        }))

const dibujarCabeceraEmpresa = (doc, empresa, margen, y, logoBase64) => {
    const boxH = 44, boxW = 174
    doc.setFillColor(248, 248, 248); doc.setDrawColor(215, 215, 215); doc.setLineWidth(0.3)
    doc.rect(margen, y, boxW, boxH, 'FD')
    doc.setFillColor(255, 230, 0); doc.rect(margen, y, 4, boxH, 'F')
    if (logoBase64) {
        try { doc.addImage(logoBase64, 'PNG', margen + 7, y + 5, 66, 34) } catch (e) { }
    }
    if (empresa) {
        const dataX = margen + 80
        let lineY = y + 11
        doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20)
        doc.text(empresa.nombre_empresa || '', dataX, lineY); lineY += 7
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(75, 75, 75)
        if (empresa.cif) { doc.text(`CIF: ${empresa.cif}`, dataX, lineY); lineY += 5.5 }
        if (empresa.direccion) { doc.text(empresa.direccion, dataX, lineY); lineY += 5.5 }
        const cpLocalProv = [empresa.codigo_postal, empresa.localidad, empresa.provincia].filter(Boolean).join(', ')
        if (cpLocalProv) { doc.text(cpLocalProv, dataX, lineY); lineY += 5.5 }
        const contacto = [empresa.telefono ? `Tel: ${empresa.telefono}` : null, empresa.email || null].filter(Boolean).join('   ·   ')
        if (contacto) doc.text(contacto, dataX, lineY)
    }
    return y + boxH + 8
}

const generarPdfPresupuesto = async (presupuesto, empresa) => {
    const doc = new jsPDF()
    const margen = 18
    let y = margen
    let logoBase64 = null
    if (empresa?.logo_url) {
        try { logoBase64 = await cargarImagenBase64(empresa.logo_url) } catch (e) { }
    }
    y = dibujarCabeceraEmpresa(doc, empresa, margen, y, logoBase64)
    doc.setDrawColor(255, 230, 0); doc.setLineWidth(1); doc.line(margen, y, 210 - margen, y); y += 10
    doc.setFontSize(24); doc.setTextColor(20, 20, 20); doc.setFont('helvetica', 'bold')
    doc.text('PRESUPUESTO', margen, y)
    const numPres = `PRES-${new Date().getFullYear()}-${String(presupuesto.id_presupuesto).padStart(4, '0')}`
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(200, 150, 0)
    doc.text(`Ref: ${numPres}`, 210 - margen, y - 6, { align: 'right' })
    doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
    doc.text(`Fecha: ${formatearFecha(presupuesto.fecha_emision)}`, 210 - margen, y, { align: 'right' })
    if (presupuesto.estado === 'pendiente')
        doc.text(`Válido hasta: ${formatearFecha(presupuesto.fecha_limite)}`, 210 - margen, y + 6, { align: 'right' })
    y += 14
    doc.setFillColor(247, 247, 247); doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3)
    doc.rect(margen, y, 174, 32, 'FD')
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(130, 130, 130)
    doc.text('CLIENTE', margen + 5, y + 6)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(30, 30, 30)
    doc.text(presupuesto.reserva?.cliente_nombre || '', margen + 5, y + 13)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(80, 80, 80)
    doc.text(`DNI/CIF: ${presupuesto.reserva?.cliente_dni_nie_cif || ''}`, margen + 5, y + 19)
    doc.text(presupuesto.reserva?.cliente_direccion || '', margen + 5, y + 25)
    const cpCliente = [presupuesto.reserva?.cliente_codigo_postal, presupuesto.reserva?.cliente_localidad, presupuesto.reserva?.cliente_provincia].filter(Boolean).join(', ')
    doc.text(cpCliente, margen + 95, y + 13)
    doc.text(`Email: ${presupuesto.reserva?.cliente_email || ''}`, margen + 95, y + 19)
    doc.text(`Tel: ${presupuesto.reserva?.cliente_telefono || ''}`, margen + 95, y + 25)
    y += 40
    const colIzq = margen, colDer = margen + 95
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(130, 130, 130)
    doc.text('INICIO', colIzq, y); doc.text('UBICACIÓN', colDer, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(50, 50, 50)
    doc.text(formatearFechaHora(presupuesto.reserva?.fecha_inicio), colIzq, y)
    doc.text(doc.splitTextToSize(presupuesto.reserva?.ubicacion || '—', 210 - margen - colDer), colDer, y)
    y += 9; doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(130, 130, 130)
    doc.text('FIN', colIzq, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(50, 50, 50)
    doc.text(formatearFechaHora(presupuesto.reserva?.fecha_fin), colIzq, y); y += 12
    const detalles = presupuesto.detalle_presupuesto || []
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
    })
    y = doc.lastAutoTable.finalY + 10
    const col1 = 125, col2 = 210 - margen
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
    doc.text('Base imponible:', col1, y)
    doc.text(`${parseFloat(presupuesto.base_imponible).toFixed(2)} €`, col2, y, { align: 'right' }); y += 6
    doc.text('IVA (21%):', col1, y)
    doc.text(`${(parseFloat(presupuesto.total) - parseFloat(presupuesto.base_imponible)).toFixed(2)} €`, col2, y, { align: 'right' }); y += 3
    doc.setDrawColor(255, 230, 0); doc.setLineWidth(0.6); doc.line(col1, y, col2, y); y += 7
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20)
    doc.text('TOTAL:', col1, y)
    doc.text(`${parseFloat(presupuesto.total).toFixed(2)} €`, col2, y, { align: 'right' }); y += 14
    doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(160, 160, 160)
    doc.text('Este presupuesto tiene validez hasta la fecha indicada. Para aceptarlo, acceda a su área de cliente.', margen, y)
    const nombreCliente = (presupuesto.reserva?.cliente_nombre || 'cliente').replace(/\s+/g, '_')
    doc.save(`presupuesto-${nombreCliente}.pdf`)
}

const generarPdfFactura = async (factura, empresa) => {
    const doc = new jsPDF()
    const margen = 18
    let y = margen
    let logoBase64 = null
    if (empresa?.logo_url) {
        try { logoBase64 = await cargarImagenBase64(empresa.logo_url) } catch (e) { }
    }
    y = dibujarCabeceraEmpresa(doc, empresa, margen, y, logoBase64)
    doc.setDrawColor(255, 230, 0); doc.setLineWidth(1); doc.line(margen, y, 210 - margen, y); y += 10
    doc.setFontSize(24); doc.setTextColor(20, 20, 20); doc.setFont('helvetica', 'bold')
    doc.text('FACTURA', margen, y)
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(200, 150, 0)
    doc.text(`Nº: ${factura.numero_factura}`, 210 - margen, y - 6, { align: 'right' })
    doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
    doc.text(`Fecha: ${formatearFecha(factura.fecha_emision)}`, 210 - margen, y, { align: 'right' })
    y += 14
    const r = factura.presupuesto?.reserva
    doc.setFillColor(247, 247, 247); doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3)
    doc.rect(margen, y, 174, 32, 'FD')
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(130, 130, 130)
    doc.text('CLIENTE', margen + 5, y + 6)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(30, 30, 30)
    doc.text(r?.cliente_nombre || '', margen + 5, y + 13)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(80, 80, 80)
    doc.text(`DNI/CIF: ${r?.cliente_dni_nie_cif || ''}`, margen + 5, y + 19)
    doc.text(r?.cliente_direccion || '', margen + 5, y + 25)
    const cpCliente = [r?.cliente_codigo_postal, r?.cliente_localidad, r?.cliente_provincia].filter(Boolean).join(', ')
    doc.text(cpCliente, margen + 95, y + 13)
    doc.text(`Email: ${r?.cliente_email || ''}`, margen + 95, y + 19)
    doc.text(`Tel: ${r?.cliente_telefono || ''}`, margen + 95, y + 25)
    y += 40
    const colIzq = margen, colDer = margen + 95
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(130, 130, 130)
    doc.text('INICIO', colIzq, y); doc.text('UBICACIÓN', colDer, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(50, 50, 50)
    doc.text(formatearFechaHora(r?.fecha_inicio), colIzq, y)
    doc.text(doc.splitTextToSize(r?.ubicacion || '—', 210 - margen - colDer), colDer, y)
    y += 9; doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(130, 130, 130)
    doc.text('FIN', colIzq, y); y += 5
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(50, 50, 50)
    doc.text(formatearFechaHora(r?.fecha_fin), colIzq, y); y += 12
    const detalles = factura.presupuesto?.detalle_presupuesto || []
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
    })
    y = doc.lastAutoTable.finalY + 10
    const col1 = 125, col2 = 210 - margen
    doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
    doc.text('Base imponible:', col1, y)
    doc.text(`${parseFloat(factura.base_imponible).toFixed(2)} €`, col2, y, { align: 'right' }); y += 6
    doc.text('IVA (21%):', col1, y)
    doc.text(`${(parseFloat(factura.total) - parseFloat(factura.base_imponible)).toFixed(2)} €`, col2, y, { align: 'right' }); y += 3
    doc.setDrawColor(255, 230, 0); doc.setLineWidth(0.6); doc.line(col1, y, col2, y); y += 7
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 20, 20)
    doc.text('TOTAL:', col1, y)
    doc.text(`${parseFloat(factura.total).toFixed(2)} €`, col2, y, { align: 'right' }); y += 14
    doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(160, 160, 160)
    doc.text('Gracias por confiar en Power Play. Para cualquier consulta, contacte con nosotros.', margen, y)
    const nombreCliente = (r?.cliente_nombre || 'cliente').replace(/\s+/g, '_')
    doc.save(`factura-${factura.numero_factura}-${nombreCliente}.pdf`)
}

// ── Buscador ──────────────────────────────────────────────────────────────────
function Buscador({ value, onChange, placeholder }) {
    return (
        <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <span style={{
                position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.2)', fontSize: '0.9rem', pointerEvents: 'none'
            }}>⌕</span>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder || 'Buscar...'}
                style={{ ...inputStyle, paddingLeft: '2.4rem' }}
                onFocus={e => e.target.style.borderColor = '#FFE600'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
        </div>
    )
}

// ── FiltroTabs ────────────────────────────────────────────────────────────────
function FiltroTabs({ filtros, activo, onChange, contar }) {
    const [abierto, setAbierto] = useState(false)

    return (
        <>
            {/* Desktop */}
            <div className="filtro-desktop" style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.07)', flexWrap: 'wrap' }}>
                {filtros.map(f => {
                    const isActivo = activo === f.id
                    return (
                        <button key={f.id} onClick={() => onChange(f.id)} style={{
                            background: 'transparent', border: 'none',
                            borderBottom: isActivo ? '2px solid #FFE600' : '2px solid transparent',
                            color: isActivo ? '#FFE600' : 'rgba(255,255,255,0.35)',
                            fontFamily: 'Bebas Neue', fontSize: '0.88rem', letterSpacing: '0.12em',
                            padding: '0.65rem 1rem', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '-1px'
                        }}
                            onMouseEnter={e => { if (!isActivo) e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
                            onMouseLeave={e => { if (!isActivo) e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
                        >
                            {f.label}<span style={{ marginLeft: '0.3rem', fontSize: '0.65rem', opacity: 0.5 }}>({contar(f.id)})</span>
                        </button>
                    )
                })}
            </div>

            {/* Móvil */}
            <div className="filtro-movil" style={{ position: 'relative', marginBottom: '2rem' }}>
                <button className="filtro-trigger" onClick={() => setAbierto(!abierto)}>
                    {filtros.find(f => f.id === activo)?.label || 'Filtrar'}
                    <span style={{ fontSize: '0.75rem', opacity: 0.6, marginLeft: '0.25rem' }}>({contar(activo)})</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: 'auto' }}>
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>
                {abierto && (
                    <>
                        <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setAbierto(false)} />
                        <div className="filtro-dropdown-menu">
                            {filtros.map(f => (
                                <button key={f.id}
                                    onClick={() => { onChange(f.id); setAbierto(false) }}
                                    style={{ color: activo === f.id ? '#FFE600' : 'rgba(255,255,255,0.6)', background: activo === f.id ? 'rgba(255,230,0,0.08)' : 'transparent' }}
                                    onMouseEnter={e => { e.currentTarget.style.color = '#FFE600'; e.currentTarget.style.background = 'rgba(255,230,0,0.04)' }}
                                    onMouseLeave={e => { e.currentTarget.style.color = activo === f.id ? '#FFE600' : 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = activo === f.id ? 'rgba(255,230,0,0.08)' : 'transparent' }}
                                >
                                    {f.label}
                                    <span style={{ opacity: 0.45, fontSize: '0.75rem', marginLeft: '0.4rem' }}>({contar(f.id)})</span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    )
}

// ── Sección Presupuestos ──────────────────────────────────────────────────────
function SeccionPresupuestos({ onVerFactura, presupuestoDestacado, onLimpiarDestacado }) {
    const [presupuestos, setPresupuestos] = useState([])
    const [empresa, setEmpresa] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [filtro, setFiltro] = useState('todos')
    const [busqueda, setBusqueda] = useState('')
    const [expandido, setExpandido] = useState(null)
    const [cambiando, setCambiando] = useState(null)
    const token = localStorage.getItem('token')

    const cargar = () => {
        setCargando(true)
        Promise.all([
            fetch(`${API_URL}/api/presupuestos`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${API_URL}/api/datosEmpresas`).then(r => r.json())
        ])
            .then(([presData, empData]) => {
                if (presData.ok) setPresupuestos(presData.result)
                if (empData.ok) setEmpresa(empData.result)
            })
            .finally(() => setCargando(false))
    }

    useEffect(() => { cargar() }, [])

    useEffect(() => {
        if (!presupuestoDestacado || presupuestos.length === 0) return
        const timerScroll = setTimeout(() => {
            const el = document.getElementById(`presupuesto-admin-${presupuestoDestacado}`)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
        const timerLimpiar = setTimeout(() => {
            if (onLimpiarDestacado) onLimpiarDestacado()
        }, 2500)
        return () => { clearTimeout(timerScroll); clearTimeout(timerLimpiar) }
    }, [presupuestoDestacado, presupuestos])

    const cambiarEstado = (p, estado) => {
        setCambiando(p.id_presupuesto)
        fetch(`${API_URL}/api/presupuestos/${p.id_presupuesto}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ estado })
        })
            .then(r => r.json())
            .then(data => { if (data.ok) cargar() })
            .finally(() => setCambiando(null))
    }

    const contar = (id) => id === 'todos' ? presupuestos.length : presupuestos.filter(p => p.estado === id).length

    const filtrados = presupuestos
        .filter(p => filtro === 'todos' || p.estado === filtro)
        .filter(p => {
            if (!busqueda.trim()) return true
            const q = busqueda.toLowerCase()
            return (
                (p.reserva?.cliente_nombre || '').toLowerCase().includes(q) ||
                (p.reserva?.cliente_email || '').toLowerCase().includes(q) ||
                (p.reserva?.ubicacion || '').toLowerCase().includes(q) ||
                formatearFecha(p.reserva?.fecha_inicio).includes(q) ||
                String(p.id_presupuesto).includes(q)
            )
        })

    if (cargando) return <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Bebas Neue', letterSpacing: '0.1em' }}>Cargando...</p>

    return (
        <div>
            <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por cliente, ubicación, fecha, nº..." />
            <FiltroTabs filtros={FILTROS_PRES} activo={filtro} onChange={setFiltro} contar={contar} />

            {filtrados.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Bebas Neue', letterSpacing: '0.1em', fontSize: '1.1rem' }}>
                    {busqueda ? 'Sin resultados para esa búsqueda.' : `No hay presupuestos${filtro !== 'todos' ? ` con estado "${filtro.replace(/_/g, ' ')}"` : ''}.`}
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filtrados.map(p => {
                        const abierto = expandido === p.id_presupuesto
                        const procesando = cambiando === p.id_presupuesto
                        const puedeActuar = p.estado === 'pendiente' || p.estado === 'aceptado_cliente'
                        return (
                            <div key={p.id_presupuesto} id={`presupuesto-admin-${p.id_presupuesto}`} style={{ 
                                background: '#141414', 
                                borderLeft: `3px solid ${ACCENT_PRES[p.estado] || 'rgba(255,255,255,0.1)'}`,
                                outline: presupuestoDestacado === p.id_presupuesto ? '1px solid rgba(255,230,0,0.7)' : 'none',
                                boxShadow: presupuestoDestacado === p.id_presupuesto ? '0 0 40px rgba(255,230,0,0.2)' : 'none',
                                transition: 'outline 0.4s, box-shadow 0.4s'
                            }}>
                                <div className="admin-card-row">
                                    <div style={{ flex: 1, display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start', minWidth: 0 }}>
                                        <div>
                                            <p style={LABEL}>Nº</p>
                                            <p style={{ color: '#fff', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue', fontSize: '1.15rem', letterSpacing: '0.05em' }}>
                                                #{String(p.id_presupuesto).padStart(4, '0')}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={LABEL}>Cliente</p>
                                            <p style={{ color: '#fff', margin: '0.2rem 0 0', fontSize: '0.9rem', fontWeight: 600 }}>{p.reserva?.cliente_nombre || '—'}</p>
                                            <p style={{ color: 'rgba(255,255,255,0.3)', margin: '0.1rem 0 0', fontSize: '0.78rem' }}>{p.reserva?.cliente_email || ''}</p>
                                        </div>
                                        <div>
                                            <p style={LABEL}>Total</p>
                                            <p style={{ color: '#FFE600', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue', fontSize: '1.3rem', letterSpacing: '0.05em' }}>
                                                {parseFloat(p.total || 0).toFixed(2)}€
                                            </p>
                                        </div>
                                        <div>
                                            <p style={LABEL}>Estado</p>
                                            <div style={{ marginTop: '0.2rem' }}><Badge estado={p.estado} mapa={BADGE_PRES} /></div>
                                        </div>
                                    </div>
                                    <div className="admin-card-buttons">
                                        <button onClick={() => setExpandido(abierto ? null : p.id_presupuesto)}
                                            style={{ ...btnAmarillo, opacity: abierto ? 0.75 : 1 }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = abierto ? '0.75' : '1'}>
                                            {abierto ? 'Cerrar ▲' : 'Ver ▼'}
                                        </button>
                                        {puedeActuar && (
                                            <>
                                                <button
                                                    onClick={() => cambiarEstado(p, 'aceptado')}
                                                    disabled={procesando}
                                                    style={{ ...btnVerde, opacity: procesando ? 0.5 : 1, cursor: procesando ? 'not-allowed' : 'pointer' }}
                                                    onMouseEnter={e => { if (!procesando) e.currentTarget.style.background = 'rgba(96,192,96,0.08)' }}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    {procesando ? '...' : 'Aceptar'}
                                                </button>
                                                <button
                                                    onClick={() => cambiarEstado(p, 'rechazado')}
                                                    disabled={procesando}
                                                    style={{ ...btnRojo, opacity: procesando ? 0.5 : 1, cursor: procesando ? 'not-allowed' : 'pointer' }}
                                                    onMouseEnter={e => { if (!procesando) e.currentTarget.style.background = 'rgba(255,68,68,0.08)' }}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                >
                                                    Rechazar
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => generarPdfPresupuesto(p, empresa)} style={btnAmarillo}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                            PDF
                                        </button>
                                        {p.factura != null && (
                                            <button
                                                onClick={() => onVerFactura(p.factura.id_factura)}
                                                style={btnVerde}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(96,192,96,0.08)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                Ver factura ↗
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {abierto && (
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 1.75rem', background: '#111' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                                            <div>
                                                <p style={LABEL}>Ubicación</p>
                                                <p style={{ color: '#fff', margin: '0.3rem 0 0', fontSize: '0.88rem', fontWeight: 600 }}>{p.reserva?.ubicacion || '—'}</p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                                                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '0.5rem 0.85rem' }}>
                                                    <p style={{ ...LABEL, marginBottom: '0.35rem' }}>Inicio</p>
                                                    <p style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{formatearSoloFecha(p.reserva?.fecha_inicio)}</p>
                                                    <p style={{ color: '#FFE600', fontSize: '0.82rem', fontWeight: 600, margin: '0.2rem 0 0' }}>{formatearSoloHora(p.reserva?.fecha_inicio)}</p>
                                                </div>
                                                <span style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>
                                                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '0.5rem 0.85rem' }}>
                                                    <p style={{ ...LABEL, marginBottom: '0.35rem' }}>Fin</p>
                                                    <p style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{formatearSoloFecha(p.reserva?.fecha_fin)}</p>
                                                    <p style={{ color: '#FFE600', fontSize: '0.82rem', fontWeight: 600, margin: '0.2rem 0 0' }}>{formatearSoloHora(p.reserva?.fecha_fin)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <p style={{ ...LABEL, marginBottom: '0.75rem' }}>Líneas del presupuesto</p>
                                        {(!p.detalle_presupuesto || p.detalle_presupuesto.length === 0) ? (
                                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Sin detalles registrados.</p>
                                        ) : (
                                            <div style={{ overflowX: 'auto' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 120px', padding: '0.4rem 0.75rem', marginBottom: '0.25rem', minWidth: '400px' }}>
                                                    {['Concepto', 'Cantidad', 'Precio/hora', 'Subtotal'].map(h => <p key={h} style={{ ...LABEL, margin: 0 }}>{h}</p>)}
                                                </div>
                                                {p.detalle_presupuesto.map((d, i) => (
                                                    <div key={d.id_detalle || i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 120px', padding: '0.65rem 0.75rem', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', minWidth: '400px' }}>
                                                        <p style={{ color: '#fff', margin: 0, fontSize: '0.88rem' }}>{d.concepto || '—'}</p>
                                                        <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: '0.88rem' }}>{d.cantidad ?? '—'}</p>
                                                        <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: '0.88rem' }}>{parseFloat(d.precio_unitario || 0).toFixed(2)}€</p>
                                                        <p style={{ color: '#FFE600', margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>{parseFloat(d.subtotal || 0).toFixed(2)}€</p>
                                                    </div>
                                                ))}
                                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                                                    <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '0.82rem' }}>
                                                        Base imponible: <span style={{ color: '#fff' }}>{parseFloat(p.base_imponible || 0).toFixed(2)}€</span>
                                                    </p>
                                                    <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '0.82rem' }}>
                                                        IVA (21%): <span style={{ color: '#fff' }}>{(parseFloat(p.total || 0) - parseFloat(p.base_imponible || 0)).toFixed(2)}€</span>
                                                    </p>
                                                    <p style={{ color: '#FFE600', margin: 0, fontFamily: 'Bebas Neue', fontSize: '1.15rem', letterSpacing: '0.05em' }}>
                                                        Total: {parseFloat(p.total || 0).toFixed(2)}€
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ── Sección Facturas ──────────────────────────────────────────────────────────
function SeccionFacturas({ facturaDestacada, onLimpiarDestacada }) {
    const [facturas, setFacturas] = useState([])
    const [empresa, setEmpresa] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [filtro, setFiltro] = useState('todos')
    const [busqueda, setBusqueda] = useState('')
    const [expandido, setExpandido] = useState(null)
    const [pagosMap, setPagosMap] = useState({})
    const [formPago, setFormPago] = useState({})
    const [guardandoPago, setGuardandoPago] = useState(null)
    const [modalPago, setModalPago] = useState(null) // { id_factura, metodo, importe, numeroFactura, cliente }
    const token = localStorage.getItem('token')

    const cargar = () => {
        setCargando(true)
        Promise.all([
            fetch(`${API_URL}/api/facturas`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch(`${API_URL}/api/datosEmpresas`).then(r => r.json())
        ])
            .then(([factData, empData]) => {
                if (factData.ok) setFacturas(factData.result)
                if (empData.ok) setEmpresa(empData.result)
            })
            .finally(() => setCargando(false))
    }

    useEffect(() => { cargar() }, [])

    useEffect(() => {
        if (!facturaDestacada || facturas.length === 0) return
        const timerScroll = setTimeout(() => {
            const el = document.getElementById(`factura-admin-${facturaDestacada}`)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
        const timerLimpiar = setTimeout(() => {
            if (onLimpiarDestacada) onLimpiarDestacada()
        }, 2500)
        return () => { clearTimeout(timerScroll); clearTimeout(timerLimpiar) }
    }, [facturaDestacada, facturas])

    const ejecutarPago = () => {
        if (!modalPago) return
        const { id_factura, metodo, importe } = modalPago
        setModalPago(null)
        setGuardandoPago(id_factura)
        fetch(`${API_URL}/api/pagos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id_factura, metodo_pago: metodo, importe: parseFloat(importe) })
        })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    setFormPago(prev => ({ ...prev, [id_factura]: { metodo: 'efectivo', importe: '' } }))
                    return Promise.all([
                        fetch(`${API_URL}/api/pagos/factura/${id_factura}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
                        fetch(`${API_URL}/api/facturas`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
                    ]).then(([pagosData, factData]) => {
                        if (pagosData.ok) setPagosMap(prev => ({ ...prev, [id_factura]: pagosData.result }))
                        if (factData.ok) setFacturas(factData.result)
                    })
                }
            })
            .finally(() => setGuardandoPago(null))
    }

    const contar = (id) => id === 'todos' ? facturas.length : facturas.filter(f => (f.estado_factura || 'pendiente') === id).length

    const filtradas = facturas
        .filter(f => filtro === 'todos' || (f.estado_factura || 'pendiente') === filtro)
        .filter(f => {
            if (!busqueda.trim()) return true
            const q = busqueda.toLowerCase()
            const r = f.presupuesto?.reserva
            return (
                (f.numero_factura || '').toLowerCase().includes(q) ||
                (r?.cliente_nombre || '').toLowerCase().includes(q) ||
                (r?.cliente_email || '').toLowerCase().includes(q) ||
                (r?.ubicacion || '').toLowerCase().includes(q) ||
                formatearFecha(f.fecha_emision).includes(q)
            )
        })

    if (cargando) return <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Bebas Neue', letterSpacing: '0.1em' }}>Cargando...</p>

    return (
        <div>
            <Buscador value={busqueda} onChange={setBusqueda} placeholder="Buscar por nº, cliente, ubicación, fecha..." />
            <FiltroTabs filtros={FILTROS_FACT} activo={filtro} onChange={setFiltro} contar={contar} />

            {filtradas.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Bebas Neue', letterSpacing: '0.1em', fontSize: '1.1rem' }}>
                    {busqueda ? 'Sin resultados para esa búsqueda.' : 'No hay facturas.'}
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filtradas.map(f => {
                        const r = f.presupuesto?.reserva
                        const abierto = expandido === f.id_factura
                        const estado = f.estado_factura || 'pendiente'
                        const destacada = facturaDestacada === f.id_factura
                        return (
                            <div key={f.id_factura} id={`factura-admin-${f.id_factura}`} style={{
                                background: '#141414',
                                borderLeft: `3px solid ${ACCENT_FACT[estado] || '#FFE600'}`,
                                outline: destacada ? '1px solid rgba(255,230,0,0.7)' : 'none',
                                boxShadow: destacada ? '0 0 40px rgba(255,230,0,0.2), 0 4px 24px rgba(0,0,0,0.4)' : 'none',
                                transition: 'outline 0.4s, box-shadow 0.4s',
                            }}>
                                <div className="admin-card-row">
                                    <div style={{ flex: 1, display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start', minWidth: 0 }}>
                                        <div>
                                            <p style={LABEL}>Número</p>
                                            <p style={{ color: '#FFE600', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue', fontSize: '1.1rem', letterSpacing: '0.05em' }}>{f.numero_factura}</p>
                                        </div>
                                        <div>
                                            <p style={LABEL}>Cliente</p>
                                            <p style={{ color: '#fff', margin: '0.2rem 0 0', fontSize: '0.9rem', fontWeight: 600 }}>{r?.cliente_nombre || '—'}</p>
                                            <p style={{ color: 'rgba(255,255,255,0.3)', margin: '0.1rem 0 0', fontSize: '0.78rem' }}>{r?.cliente_email || ''}</p>
                                        </div>
                                        <div style={{ maxWidth: '180px' }}>
                                            <p style={LABEL}>Ubicación</p>
                                            <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0.2rem 0 0', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {r?.ubicacion || '—'}
                                            </p>
                                        </div>
                                        <div>
                                            <p style={LABEL}>Fecha emisión</p>
                                            <p style={{ color: '#fff', margin: '0.2rem 0 0', fontSize: '0.9rem' }}>{formatearFecha(f.fecha_emision)}</p>
                                        </div>
                                        <div>
                                            <p style={LABEL}>Total</p>
                                            <p style={{ color: '#fff', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue', fontSize: '1.2rem', letterSpacing: '0.05em' }}>{parseFloat(f.total || 0).toFixed(2)}€</p>
                                        </div>
                                        <div>
                                            <p style={LABEL}>Estado</p>
                                            <div style={{ marginTop: '0.2rem' }}><Badge estado={estado} mapa={BADGE_FACT} /></div>
                                        </div>
                                    </div>
                                    <div className="admin-card-buttons">
                                        <button onClick={() => {
                                            const nuevoId = abierto ? null : f.id_factura
                                            setExpandido(nuevoId)
                                            if (nuevoId && !pagosMap[nuevoId]) {
                                                fetch(`${API_URL}/api/pagos/factura/${nuevoId}`, { headers: { Authorization: `Bearer ${token}` } })
                                                    .then(r => r.json())
                                                    .then(data => {
                                                        if (data.ok) setPagosMap(prev => ({ ...prev, [nuevoId]: data.result }))
                                                    })
                                            }
                                        }}
                                            style={{ ...btnAmarillo, opacity: abierto ? 0.75 : 1 }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = abierto ? '0.75' : '1'}>
                                            {abierto ? 'Cerrar ▲' : 'Ver ▼'}
                                        </button>
                                        <button onClick={() => generarPdfFactura(f, empresa)} style={btnAmarillo}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                            PDF
                                        </button>
                                    </div>
                                </div>

                                {abierto && (
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 1.75rem', background: '#111' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                                            <div>
                                                <p style={LABEL}>Ubicación</p>
                                                <p style={{ color: '#fff', margin: '0.3rem 0 0', fontSize: '0.88rem', fontWeight: 600 }}>{r?.ubicacion || '—'}</p>
                                                <p style={{ color: 'rgba(255,255,255,0.35)', margin: '0.4rem 0 0', fontSize: '0.8rem' }}>{r?.cliente_dni_nie_cif || ''}</p>
                                                <p style={{ color: 'rgba(255,255,255,0.35)', margin: '0.2rem 0 0', fontSize: '0.8rem' }}>{r?.cliente_telefono || ''}</p>
                                                <p style={{ color: 'rgba(255,255,255,0.35)', margin: '0.2rem 0 0', fontSize: '0.8rem' }}>{[r?.cliente_direccion, r?.cliente_codigo_postal, r?.cliente_localidad, r?.cliente_provincia].filter(Boolean).join(', ')}</p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                                                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '0.5rem 0.85rem' }}>
                                                    <p style={{ ...LABEL, marginBottom: '0.35rem' }}>Inicio</p>
                                                    <p style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{formatearSoloFecha(r?.fecha_inicio)}</p>
                                                    <p style={{ color: '#FFE600', fontSize: '0.82rem', fontWeight: 600, margin: '0.2rem 0 0' }}>{formatearSoloHora(r?.fecha_inicio)}</p>
                                                </div>
                                                <span style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>
                                                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '0.5rem 0.85rem' }}>
                                                    <p style={{ ...LABEL, marginBottom: '0.35rem' }}>Fin</p>
                                                    <p style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{formatearSoloFecha(r?.fecha_fin)}</p>
                                                    <p style={{ color: '#FFE600', fontSize: '0.82rem', fontWeight: 600, margin: '0.2rem 0 0' }}>{formatearSoloHora(r?.fecha_fin)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <p style={{ ...LABEL, marginBottom: '0.75rem' }}>Líneas de la factura</p>
                                        {(!f.presupuesto?.detalle_presupuesto || f.presupuesto.detalle_presupuesto.length === 0) ? (
                                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Sin detalles registrados.</p>
                                        ) : (
                                            <div style={{ overflowX: 'auto' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 120px', padding: '0.4rem 0.75rem', marginBottom: '0.25rem', minWidth: '400px' }}>
                                                    {['Concepto', 'Cantidad', 'Precio/hora', 'Subtotal'].map(h => <p key={h} style={{ ...LABEL, margin: 0 }}>{h}</p>)}
                                                </div>
                                                {f.presupuesto.detalle_presupuesto.map((d, i) => (
                                                    <div key={d.id_detalle || i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 120px', padding: '0.65rem 0.75rem', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', minWidth: '400px' }}>
                                                        <p style={{ color: '#fff', margin: 0, fontSize: '0.88rem' }}>{d.concepto || '—'}</p>
                                                        <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: '0.88rem' }}>{d.cantidad ?? '—'}</p>
                                                        <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: '0.88rem' }}>{parseFloat(d.precio_unitario || 0).toFixed(2)}€</p>
                                                        <p style={{ color: '#FFE600', margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>{parseFloat(d.subtotal || 0).toFixed(2)}€</p>
                                                    </div>
                                                ))}
                                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                                                    <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '0.82rem' }}>
                                                        Base imponible: <span style={{ color: '#fff' }}>{parseFloat(f.base_imponible || 0).toFixed(2)}€</span>
                                                    </p>
                                                    <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '0.82rem' }}>
                                                        IVA (21%): <span style={{ color: '#fff' }}>{(parseFloat(f.total || 0) - parseFloat(f.base_imponible || 0)).toFixed(2)}€</span>
                                                    </p>
                                                    <p style={{ color: '#FFE600', margin: 0, fontFamily: 'Bebas Neue', fontSize: '1.15rem', letterSpacing: '0.05em' }}>
                                                        Total: {parseFloat(f.total || 0).toFixed(2)}€
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* ── Pagos ── */}
                                        {(() => {
                                            const pagos = pagosMap[f.id_factura] || []
                                            const totalPagado = pagos.reduce((acc, p) => acc + parseFloat(p.importe || 0), 0)
                                            const totalFactura = parseFloat(f.total || 0)
                                            const porcentaje = totalFactura > 0 ? Math.min(100, (totalPagado / totalFactura) * 100) : 0
                                            const restante = totalFactura - totalPagado
                                            return (
                                                <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                                                    <p style={{ ...LABEL, marginBottom: '0.75rem' }}>Pagos registrados</p>
                                                    {pagos.length === 0 ? (
                                                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>Sin pagos registrados.</p>
                                                    ) : (
                                                        <>
                                                            <div style={{ background: 'rgba(255,255,255,0.07)', height: '6px', borderRadius: '3px', marginBottom: '0.5rem' }}>
                                                                <div style={{ background: porcentaje >= 100 ? '#4CAF50' : '#FFE600', height: '6px', borderRadius: '3px', width: `${porcentaje}%`, transition: 'width 0.4s' }} />
                                                            </div>
                                                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', margin: '0 0 0.75rem' }}>
                                                                Pagado <span style={{ color: '#FFE600', fontWeight: 700 }}>{totalPagado.toFixed(2)}€</span> de <span style={{ color: '#fff' }}>{totalFactura.toFixed(2)}€</span>
                                                                {porcentaje >= 100 && <span style={{ color: '#4CAF50', marginLeft: '0.5rem', fontWeight: 700 }}>✓ Completado</span>}
                                                            </p>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.75rem' }}>
                                                                {pagos.map((p, i) => (
                                                                    <div key={i} style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>
                                                                        <span style={{ color: '#fff', fontWeight: 600 }}>{parseFloat(p.importe).toFixed(2)}€</span>
                                                                        <span style={{ textTransform: 'capitalize' }}>{p.metodo_pago}</span>
                                                                        {p.fecha_pago && <span>{new Date(p.fecha_pago).toLocaleDateString('es-ES')}</span>}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                    {f.estado_factura !== 'pagada' && (
                                                        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                            <select
                                                                value={formPago[f.id_factura]?.metodo || 'efectivo'}
                                                                onChange={e => setFormPago(prev => ({ ...prev, [f.id_factura]: { ...prev[f.id_factura], metodo: e.target.value } }))}
                                                                style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '0.45rem 0.75rem', fontSize: '0.85rem', cursor: 'pointer' }}
                                                            >
                                                                <option value="efectivo">Efectivo</option>
                                                                <option value="transferencia">Transferencia</option>
                                                            </select>
                                                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                                                <input
                                                                    type="number"
                                                                    min="0.01"
                                                                    step="0.01"
                                                                    placeholder={`Importe`}
                                                                    value={formPago[f.id_factura]?.importe || ''}
                                                                    onChange={e => setFormPago(prev => ({ ...prev, [f.id_factura]: { ...prev[f.id_factura], importe: e.target.value } }))}
                                                                    style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '0.45rem 0.75rem', fontSize: '0.85rem', width: '140px' }}
                                                                />
                                                                <button
                                                                    onClick={() => setFormPago(prev => ({ ...prev, [f.id_factura]: { ...prev[f.id_factura], importe: restante.toFixed(2) } }))}
                                                                    style={{ background: 'rgba(255,230,0,0.08)', border: '1px solid rgba(255,230,0,0.25)', color: '#FFE600', fontFamily: 'Bebas Neue', fontSize: '0.78rem', letterSpacing: '0.1em', padding: '0.45rem 0.65rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,230,0,0.15)'}
                                                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,230,0,0.08)'}
                                                                >
                                                                    Máx {restante.toFixed(2)}€
                                                                </button>
                                                            </div>
                                                            <button
                                                                disabled={guardandoPago === f.id_factura || !formPago[f.id_factura]?.importe}
                                                                onClick={() => {
                                                                    const { metodo = 'efectivo', importe } = formPago[f.id_factura] || {}
                                                                    if (!importe || parseFloat(importe) <= 0) return
                                                                    setModalPago({
                                                                        id_factura: f.id_factura,
                                                                        metodo,
                                                                        importe,
                                                                        numeroFactura: f.numero_factura,
                                                                        cliente: f.presupuesto?.reserva?.cliente_nombre || '—'
                                                                    })
                                                                }}
                                                                style={{ ...btnAmarillo, opacity: (guardandoPago === f.id_factura || !formPago[f.id_factura]?.importe) ? 0.4 : 1, cursor: (guardandoPago === f.id_factura || !formPago[f.id_factura]?.importe) ? 'not-allowed' : 'pointer' }}
                                                            >
                                                                {guardandoPago === f.id_factura ? 'Guardando...' : 'Registrar pago'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })()}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Modal confirmación pago ── */}
            {modalPago && (
                <div
                    onClick={() => setModalPago(null)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, backdropFilter: 'blur(4px)'
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#141414', borderTop: '3px solid #FFE600',
                            padding: '2.5rem 2.5rem 2rem', width: '100%', maxWidth: '420px',
                            boxShadow: '0 24px 80px rgba(0,0,0,0.6)'
                        }}
                    >
                        <p style={{ ...LABEL, marginBottom: '1.25rem' }}>Confirmar pago</p>
                        <p style={{ color: '#fff', fontSize: '0.9rem', margin: '0 0 0.5rem' }}>
                            Factura <span style={{ color: '#FFE600', fontWeight: 700 }}>{modalPago.numeroFactura}</span>
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', margin: '0 0 1.75rem' }}>
                            {modalPago.cliente}
                        </p>
                        <div style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem' }}>Importe</span>
                                <span style={{ color: '#FFE600', fontFamily: 'Bebas Neue', fontSize: '1.4rem', letterSpacing: '0.05em' }}>{parseFloat(modalPago.importe).toFixed(2)}€</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem' }}>Método</span>
                                <span style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 600, textTransform: 'capitalize' }}>{modalPago.metodo}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => setModalPago(null)}
                                style={{ ...btnRojo, flex: 1, textAlign: 'center' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,68,68,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={ejecutarPago}
                                style={{ ...btnAmarillo, flex: 1, textAlign: 'center' }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                                Confirmar pago
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Sección Usuarios ──────────────────────────────────────────────────────────
function SeccionUsuarios() {
    const [usuarios, setUsuarios] = useState([])
    const [cargando, setCargando] = useState(true)
    const token = localStorage.getItem('token')

    useEffect(() => {
        fetch(`${API_URL}/api/usuarios`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => { if (data.ok) setUsuarios(data.result) })
            .finally(() => setCargando(false))
    }, [])

    if (cargando) return <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Bebas Neue', letterSpacing: '0.1em' }}>Cargando...</p>

    return (
        <div>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {usuarios.map(u => (
                    <div key={u.id_usuario} style={{
                        background: '#141414',
                        borderLeft: `3px solid ${u.rol === 'admin' ? '#60c060' : '#FFE600'}`,
                        padding: '1rem 1.75rem', display: 'flex', alignItems: 'center', gap: '2.5rem', flexWrap: 'wrap'
                    }}>
                        <div style={{ flex: '1', minWidth: '140px' }}>
                            <p style={LABEL}>Nombre</p>
                            <p style={{ color: '#fff', margin: '0.2rem 0 0', fontSize: '0.9rem', fontWeight: 600 }}>{u.nombre || '—'}</p>
                        </div>
                        <div style={{ flex: '2', minWidth: '200px' }}>
                            <p style={LABEL}>Email</p>
                            <p style={{ color: 'rgba(255,255,255,0.55)', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>{u.email || '—'}</p>
                        </div>
                        <div>
                            <p style={LABEL}>Teléfono</p>
                            <p style={{ color: 'rgba(255,255,255,0.55)', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>{u.telefono || '—'}</p>
                        </div>
                        <div>
                            <p style={LABEL}>Rol</p>
                            <span style={{
                                display: 'inline-block', marginTop: '0.2rem',
                                background: u.rol === 'admin' ? 'rgba(96,192,96,0.12)' : 'rgba(255,200,0,0.12)',
                                color: u.rol === 'admin' ? '#60c060' : '#FFE600',
                                padding: '0.2rem 0.65rem', fontSize: '0.68rem',
                                fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase'
                            }}>
                                {u.rol || 'usuario'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Sección Empresa ───────────────────────────────────────────────────────────
function SeccionEmpresa() {
    const [form, setForm] = useState({ nombre_empresa: '', cif: '', direccion: '', codigo_postal: '', localidad: '', provincia: '', telefono: '', email: '', logo_url: '', iban: '' })
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [mensaje, setMensaje] = useState(null)

    useEffect(() => {
        fetch(`${API_URL}/api/datosEmpresas`)
            .then(r => r.json())
            .then(data => {
                if (data.ok && data.result) {
                    const e = data.result
                    setForm({
                        nombre_empresa: e.nombre_empresa || '',
                        cif: e.cif || '',
                        direccion: e.direccion || '',
                        codigo_postal: e.codigo_postal || '',
                        localidad: e.localidad || '',
                        provincia: e.provincia || '',
                        telefono: e.telefono || '',
                        email: e.email || '',
                        logo_url: e.logo_url || '',
                        iban: e.iban || ''
                    })
                }
            })
            .finally(() => setCargando(false))
    }, [])

    const handleChange = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }))

    const guardar = () => {
        setGuardando(true)
        setMensaje(null)
        fetch(`${API_URL}/api/datosEmpresas`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        })
            .then(r => r.json())
            .then(data => { setMensaje(data.ok ? 'ok' : 'error') })
            .finally(() => setGuardando(false))
    }

    const campos = [
        { key: 'nombre_empresa', label: 'Nombre de la empresa', full: true },
        { key: 'cif', label: 'CIF' },
        { key: 'telefono', label: 'Teléfono' },
        { key: 'email', label: 'Email' },
        { key: 'direccion', label: 'Dirección', full: true },
        { key: 'codigo_postal', label: 'Código postal' },
        { key: 'localidad', label: 'Localidad' },
        { key: 'provincia', label: 'Provincia' },
        { key: 'iban', label: 'IBAN', full: true }
    ]

    if (cargando) return <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Bebas Neue', letterSpacing: '0.1em' }}>Cargando...</p>

    return (
        <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
                {campos.map(c => (
                    <div key={c.key} style={{ gridColumn: c.full ? '1 / -1' : 'auto' }}>
                        <p style={{ ...LABEL, marginBottom: '0.5rem' }}>{c.label}</p>
                        <input
                            type="text"
                            value={form[c.key]}
                            onChange={e => handleChange(c.key, e.target.value)}
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = '#FFE600'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                        />
                    </div>
                ))}
            </div>
            <div style={{ marginBottom: '1.75rem' }}>
                <SubidaImagen
                    label="Logo de la empresa"
                    value={form.logo_url}
                    onChange={url => handleChange('logo_url', url)}
                />
            </div>
            {mensaje === 'ok' && <p style={{ color: '#60c060', fontSize: '0.85rem', marginBottom: '1rem' }}>Datos guardados correctamente.</p>}
            {mensaje === 'error' && <p style={{ color: '#ff4444', fontSize: '0.85rem', marginBottom: '1rem' }}>Error al guardar. Inténtalo de nuevo.</p>}
            <button onClick={guardar} disabled={guardando}
                style={{ background: '#FFE600', border: 'none', color: '#000', fontFamily: 'Bebas Neue', fontSize: '1.1rem', letterSpacing: '0.15em', padding: '0.85rem 2.5rem', cursor: guardando ? 'not-allowed' : 'pointer', opacity: guardando ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
        </div>
    )
}

// ── Página principal Admin ────────────────────────────────────────────────────
export default function Admin() {
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [seccionActiva, setSeccionActiva] = useState('presupuestos')
    const [presupuestoDestacado, setPresupuestoDestacado] = useState(null)
    const [facturaDestacada, setFacturaDestacada] = useState(null)

    const irAPresupuesto = (idPresupuesto) => {
        setPresupuestoDestacado(idPresupuesto)
        setSeccionActiva('presupuestos')
    }

    const irAFactura = (idFactura) => {
        setFacturaDestacada(idFactura)
        setSeccionActiva('facturas')
    }

    useEffect(() => {
        if (usuario && usuario.rol !== 'admin') navigate('/')
    }, [usuario])

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const idPres = params.get('presupuesto')
        if (idPres) irAPresupuesto(parseInt(idPres))
    }, [])

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [seccionActiva])

    if (!usuario || usuario.rol !== 'admin') return null

    const secciones = [
        { id: 'presupuestos', label: 'Presupuestos' },
        { id: 'facturas', label: 'Facturas' },
        { id: 'usuarios', label: 'Usuarios' },
        { id: 'empresa', label: 'Empresa' },
    ]

    const seccionLabel = secciones.find(s => s.id === seccionActiva)?.label

    return (
        <div className="admin-layout" style={{ background: '#0d0d0d', minHeight: '100vh', paddingTop: '80px' }}>
            <div className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <p style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,230,0,0.5)', margin: '0 0 0.5rem' }}>Panel de administración</p>
                    <div style={{ width: '28px', height: '2px', background: '#FFE600' }} />
                </div>
                <nav className="admin-sidebar-nav">
                    {secciones.map(s => (
                        <button key={s.id} onClick={() => setSeccionActiva(s.id)}
                            style={{ display: 'block', width: '100%', textAlign: 'left', background: seccionActiva === s.id ? 'rgba(255,230,0,0.05)' : 'transparent', border: 'none', borderLeft: seccionActiva === s.id ? '3px solid #FFE600' : '3px solid transparent', padding: '0.9rem 1.5rem', fontFamily: 'Bebas Neue', fontSize: '1.05rem', letterSpacing: '0.15em', color: seccionActiva === s.id ? '#FFE600' : 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => { if (seccionActiva !== s.id) { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' } }}
                            onMouseLeave={e => { if (seccionActiva !== s.id) { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.background = 'transparent' } }}
                        >
                            {s.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="admin-main">
                <div className="admin-main-header">
                    <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', margin: '0 0 0.4rem' }}>Admin · {seccionLabel}</p>
                    <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '2.8rem', letterSpacing: '0.08em', color: '#fff', margin: 0, lineHeight: 1 }}>{seccionLabel}</h1>
                </div>
                <div className="admin-main-content">
                    {seccionActiva === 'presupuestos' && <SeccionPresupuestos onVerFactura={irAFactura} presupuestoDestacado={presupuestoDestacado} onLimpiarDestacado={() => setPresupuestoDestacado(null)} />}
                    {seccionActiva === 'facturas' && <SeccionFacturas facturaDestacada={facturaDestacada} onLimpiarDestacada={() => setFacturaDestacada(null)} />}
                    {seccionActiva === 'usuarios' && <SeccionUsuarios />}
                    {seccionActiva === 'empresa' && <SeccionEmpresa />}
                </div>
            </div>
        </div>
    )
}