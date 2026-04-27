import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import SubidaImagen from '../components/SubidaImagen'

const LABEL = {
    fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.15em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: 0
}

const FILTROS = [
    { id: 'todos', label: 'Todos' },
    { id: 'pendiente', label: 'Pendiente' },
    { id: 'aceptado_cliente', label: 'Aceptado por cliente' },
    { id: 'aceptado', label: 'Aceptado' },
    { id: 'rechazado', label: 'Rechazado' },
]

const BADGE_COLOR = {
    pendiente: { bg: 'rgba(255,200,0,0.12)', text: '#FFE600' },
    aceptado: { bg: 'rgba(96,192,96,0.12)', text: '#60c060' },
    rechazado: { bg: 'rgba(255,68,68,0.12)', text: '#ff4444' },
    aceptado_cliente: { bg: 'rgba(100,160,255,0.12)', text: '#64a0ff' },
}

const ACCENT = {
    pendiente: '#FFE600',
    aceptado: '#60c060',
    rechazado: '#ff4444',
    aceptado_cliente: '#64a0ff',
}

const btnAmarillo = {
    background: '#FFE600', border: 'none', color: '#000',
    fontFamily: 'Bebas Neue', fontSize: '0.85rem', letterSpacing: '0.12em',
    padding: '0.55rem 1.1rem', cursor: 'pointer', transition: 'opacity 0.2s',
    whiteSpace: 'nowrap', flexShrink: 0
}

const inputStyle = {
    background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)',
    color: '#fff', padding: '0.75rem 1rem', fontSize: '0.9rem',
    outline: 'none', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box'
}

function Badge({ estado }) {
    const c = BADGE_COLOR[estado] || { bg: 'rgba(255,255,255,0.08)', text: '#fff' }
    return (
        <span style={{
            background: c.bg, color: c.text,
            padding: '0.2rem 0.65rem', fontSize: '0.68rem',
            fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase'
        }}>
            {estado?.replace('_', ' ')}
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
    doc.setFillColor(248, 248, 248)
    doc.setDrawColor(215, 215, 215)
    doc.setLineWidth(0.3)
    doc.rect(margen, y, boxW, boxH, 'FD')
    doc.setFillColor(255, 230, 0)
    doc.rect(margen, y, 4, boxH, 'F')
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

// ── Sección Presupuestos ──────────────────────────────────────────────────────
function SeccionPresupuestos() {
    const [presupuestos, setPresupuestos] = useState([])
    const [empresa, setEmpresa] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [filtro, setFiltro] = useState('todos')
    const [expandido, setExpandido] = useState(null)
    const [accionando, setAccionando] = useState(null)
    const token = localStorage.getItem('token')

    const cargar = () => {
        setCargando(true)
        Promise.all([
            fetch('/api/presupuestos', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
            fetch('/api/datosEmpresas').then(r => r.json())
        ])
            .then(([presupuestosData, empresaData]) => {
                if (presupuestosData.ok) setPresupuestos(presupuestosData.result)
                if (empresaData.ok) setEmpresa(empresaData.result)
            })
            .finally(() => setCargando(false))
    }

    useEffect(() => { cargar() }, [])

    const cambiarEstado = (id, estado) => {
        setAccionando(id)
        fetch(`/api/presupuestos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ estado })
        })
            .then(r => r.json())
            .then(data => { if (data.ok) cargar() })
            .finally(() => setAccionando(null))
    }

    const filtrados = filtro === 'todos' ? presupuestos : presupuestos.filter(p => p.estado === filtro)

    if (cargando) return <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Bebas Neue', letterSpacing: '0.1em' }}>Cargando...</p>

    return (
        <div>
            <div style={{ display: 'flex', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                {FILTROS.map(f => {
                    const count = f.id === 'todos' ? presupuestos.length : presupuestos.filter(p => p.estado === f.id).length
                    const activo = filtro === f.id
                    return (
                        <button key={f.id} onClick={() => setFiltro(f.id)} style={{
                            background: 'transparent', border: 'none',
                            borderBottom: activo ? '2px solid #FFE600' : '2px solid transparent',
                            color: activo ? '#FFE600' : 'rgba(255,255,255,0.35)',
                            fontFamily: 'Bebas Neue', fontSize: '0.92rem', letterSpacing: '0.12em',
                            padding: '0.65rem 1.1rem', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '-1px'
                        }}
                            onMouseEnter={e => { if (!activo) e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
                            onMouseLeave={e => { if (!activo) e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
                        >
                            {f.label}<span style={{ marginLeft: '0.35rem', fontSize: '0.68rem', opacity: 0.55 }}>({count})</span>
                        </button>
                    )
                })}
            </div>

            {filtrados.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Bebas Neue', letterSpacing: '0.1em', fontSize: '1.1rem' }}>
                    No hay presupuestos{filtro !== 'todos' ? ` con estado "${filtro.replace('_', ' ')}"` : ''}.
                </p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filtrados.map(p => {
                        const abierto = expandido === p.id_presupuesto
                        return (
                            <div key={p.id_presupuesto} style={{ background: '#141414', borderLeft: `3px solid ${ACCENT[p.estado] || 'rgba(255,255,255,0.1)'}` }}>
                                <div style={{ padding: '1.25rem 1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{ flex: 1, display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'flex-start', minWidth: 0 }}>
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
                                            <div style={{ marginTop: '0.2rem' }}><Badge estado={p.estado} /></div>
                                        </div>
                                        {p.factura?.length > 0 && (
                                            <div>
                                                <p style={LABEL}>Factura</p>
                                                <p style={{ color: '#60c060', margin: '0.2rem 0 0', fontSize: '0.8rem', fontWeight: 700 }}>Generada</p>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                                        <button onClick={() => setExpandido(abierto ? null : p.id_presupuesto)}
                                            style={{ ...btnAmarillo, opacity: abierto ? 0.75 : 1 }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = abierto ? '0.75' : '1'}>
                                            {abierto ? 'Cerrar ▲' : 'Ver detalle ▼'}
                                        </button>
                                        <button onClick={() => generarPdfPresupuesto(p, empresa)} style={btnAmarillo}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                            Descargar PDF
                                        </button>
                                        {p.estado !== 'aceptado' && p.estado !== 'rechazado' && (
                                            <>
                                                <button onClick={() => cambiarEstado(p.id_presupuesto, 'aceptado')}
                                                    disabled={accionando === p.id_presupuesto}
                                                    style={{ background: 'transparent', border: '1px solid rgba(96,192,96,0.4)', color: '#60c060', fontFamily: 'Bebas Neue', fontSize: '0.85rem', letterSpacing: '0.12em', padding: '0.55rem 1.1rem', cursor: 'pointer', opacity: accionando === p.id_presupuesto ? 0.5 : 1, transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                    Aceptar
                                                </button>
                                                <button onClick={() => cambiarEstado(p.id_presupuesto, 'rechazado')}
                                                    disabled={accionando === p.id_presupuesto}
                                                    style={{ background: 'transparent', border: '1px solid rgba(255,68,68,0.35)', color: '#ff6666', fontFamily: 'Bebas Neue', fontSize: '0.85rem', letterSpacing: '0.12em', padding: '0.55rem 1.1rem', cursor: 'pointer', opacity: accionando === p.id_presupuesto ? 0.5 : 1, transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                    Rechazar
                                                </button>
                                            </>
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
                                            <div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 120px', padding: '0.4rem 0.75rem', marginBottom: '0.25rem' }}>
                                                    {['Concepto', 'Cantidad', 'Precio/hora', 'Subtotal'].map(h => <p key={h} style={{ ...LABEL, margin: 0 }}>{h}</p>)}
                                                </div>
                                                {p.detalle_presupuesto.map((d, i) => (
                                                    <div key={d.id_detalle || i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 130px 120px', padding: '0.65rem 0.75rem', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
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
function SeccionFacturas() {
    const [facturas, setFacturas] = useState([])
    const [cargando, setCargando] = useState(true)
    const token = localStorage.getItem('token')

    useEffect(() => {
        fetch('/api/facturas', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => { if (data.ok) setFacturas(data.result) })
            .finally(() => setCargando(false))
    }, [])

    if (cargando) return <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Bebas Neue', letterSpacing: '0.1em' }}>Cargando...</p>

    return (
        <div>
            {facturas.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'Bebas Neue', letterSpacing: '0.1em', fontSize: '1.1rem' }}>No hay facturas.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {facturas.map(f => {
                        const pagada = f.estado_factura === 'pagada'
                        return (
                            <div key={f.id_factura} style={{ background: '#141414', borderLeft: `3px solid ${pagada ? '#60c060' : '#FFE600'}`, padding: '1.25rem 1.75rem', display: 'flex', alignItems: 'center', gap: '3rem', flexWrap: 'wrap' }}>
                                <div>
                                    <p style={LABEL}>Número</p>
                                    <p style={{ color: '#FFE600', margin: '0.2rem 0 0', fontFamily: 'Bebas Neue', fontSize: '1.1rem', letterSpacing: '0.05em' }}>{f.numero_factura}</p>
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
                                    <span style={{ display: 'inline-block', marginTop: '0.2rem', background: pagada ? 'rgba(96,192,96,0.12)' : 'rgba(255,200,0,0.12)', color: pagada ? '#60c060' : '#FFE600', padding: '0.2rem 0.65rem', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                        {pagada ? 'Pagada' : 'Pendiente'}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
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
        fetch('/api/usuarios', { headers: { Authorization: `Bearer ${token}` } })
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
                    <div key={u.id_usuario} style={{ background: '#141414', borderLeft: `3px solid ${u.rol === 'admin' ? '#FFE600' : 'rgba(255,255,255,0.08)'}`, padding: '1rem 1.75rem', display: 'flex', alignItems: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
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
                            <span style={{ display: 'inline-block', marginTop: '0.2rem', background: u.rol === 'admin' ? 'rgba(255,200,0,0.12)' : 'rgba(255,255,255,0.06)', color: u.rol === 'admin' ? '#FFE600' : 'rgba(255,255,255,0.4)', padding: '0.2rem 0.65rem', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
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
    const [form, setForm] = useState({ nombre_empresa: '', cif: '', direccion: '', codigo_postal: '', localidad: '', provincia: '', telefono: '', email: '', logo_url: '' })
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [mensaje, setMensaje] = useState(null)

    useEffect(() => {
        fetch('/api/datosEmpresas')
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
                        logo_url: e.logo_url || ''
                    })
                }
            })
            .finally(() => setCargando(false))
    }, [])

    const handleChange = (campo, valor) => setForm(prev => ({ ...prev, [campo]: valor }))

    const guardar = () => {
        setGuardando(true)
        setMensaje(null)
        fetch('/api/datosEmpresas', {
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
        { key: 'provincia', label: 'Provincia' }
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

    useEffect(() => {
        if (usuario && usuario.rol !== 'admin') navigate('/')
    }, [usuario])

    if (!usuario || usuario.rol !== 'admin') return null

    const secciones = [
        { id: 'presupuestos', label: 'Presupuestos' },
        { id: 'facturas', label: 'Facturas' },
        { id: 'usuarios', label: 'Usuarios' },
        { id: 'empresa', label: 'Empresa' },
    ]

    const seccionLabel = secciones.find(s => s.id === seccionActiva)?.label

    return (
        <div style={{ background: '#0d0d0d', minHeight: '100vh', paddingTop: '80px', display: 'flex' }}>
            <div style={{ width: '220px', background: '#080808', borderRight: '1px solid rgba(255,230,0,0.1)', flexShrink: 0, position: 'sticky', top: '80px', height: 'calc(100vh - 80px)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '2rem 1.5rem 1.25rem' }}>
                    <p style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,230,0,0.5)', margin: '0 0 0.5rem' }}>Panel de administración</p>
                    <div style={{ width: '28px', height: '2px', background: '#FFE600' }} />
                </div>
                <nav style={{ flex: 1, paddingBottom: '2rem' }}>
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

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 80px)' }}>
                <div style={{ borderBottom: '1px solid rgba(255,230,0,0.1)', padding: '2rem 3.5rem', background: '#0a0a0a' }}>
                    <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', margin: '0 0 0.4rem' }}>Admin · {seccionLabel}</p>
                    <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '2.8rem', letterSpacing: '0.08em', color: '#fff', margin: 0, lineHeight: 1 }}>{seccionLabel}</h1>
                </div>
                <div style={{ flex: 1, padding: '2.5rem 3.5rem' }}>
                    {seccionActiva === 'presupuestos' && <SeccionPresupuestos />}
                    {seccionActiva === 'facturas' && <SeccionFacturas />}
                    {seccionActiva === 'usuarios' && <SeccionUsuarios />}
                    {seccionActiva === 'empresa' && <SeccionEmpresa />}
                </div>
            </div>
        </div>
    )
}