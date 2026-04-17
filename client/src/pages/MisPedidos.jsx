import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function MisPedidos() {
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [presupuestos, setPresupuestos] = useState([])
    const [empresa, setEmpresa] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)
    const [accionando, setAccionando] = useState(null)

    useEffect(() => {
        if (!usuario) { navigate('/login'); return }

        const token = localStorage.getItem('token')

        Promise.all([
            fetch('/api/presupuestos/mis-presupuestos', {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(r => r.json()),
            fetch('/api/datosEmpresas').then(r => r.json())
        ])
            .then(([presupuestosData, empresaData]) => {
                if (presupuestosData.ok) setPresupuestos(presupuestosData.result)
                if (empresaData.ok) setEmpresa(empresaData.result[0])
            })
            .catch(() => setError('Error al cargar los datos'))
            .finally(() => setCargando(false))
    }, [usuario])

    const handleEstado = (idPresupuesto, estado) => {
        setAccionando(idPresupuesto)
        const token = localStorage.getItem('token')

        fetch(`/api/presupuestos/${idPresupuesto}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ estado })
        })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    setPresupuestos(prev => prev.map(p =>
                        p.id_presupuesto === idPresupuesto ? { ...p, estado: data.result.estado } : p
                    ))
                }
            })
            .finally(() => setAccionando(null))
    }

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

    const diasRestantes = (fechaLimite) => {
        const diff = Math.ceil((new Date(fechaLimite) - new Date()) / (1000 * 60 * 60 * 24))
        if (diff <= 0) return { texto: 'Presupuesto expirado', color: '#ff4444' }
        if (diff === 1) return { texto: '¡Expira mañana! Acepta hoy para no perder la reserva', color: '#ff4444' }
        if (diff <= 3) return { texto: `Quedan ${diff} días para aceptar — caduca pronto`, color: '#ff6060' }
        return { texto: `Quedan ${diff} días para aceptar este presupuesto`, color: 'rgba(255,255,255,0.35)' }
    }

    const badgeEstado = (estado) => {
        const config = {
            pendiente: { label: 'Pendiente', color: '#FFE600', bg: 'rgba(255,230,0,0.1)', border: 'rgba(255,230,0,0.3)' },
            aceptado_cliente: { label: 'En revisión', color: '#60c060', bg: 'rgba(96,192,96,0.1)', border: 'rgba(96,192,96,0.3)' },
            aceptado: { label: 'Confirmado', color: '#60c060', bg: 'rgba(96,192,96,0.1)', border: 'rgba(96,192,96,0.3)' },
            rechazado: { label: 'Rechazado', color: '#ff4444', bg: 'rgba(255,68,68,0.1)', border: 'rgba(255,68,68,0.3)' },
        }
        const c = config[estado] || config.pendiente
        return (
            <span style={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: c.color,
                background: c.bg, border: `1px solid ${c.border}`,
                padding: '0.25rem 0.65rem', whiteSpace: 'nowrap'
            }}>
                {c.label}
            </span>
        )
    }

    const cargarImagenBase64 = async (url) => {
        try {
            const response = await fetch(url)
            const blob = await response.blob()
            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result)
                reader.onerror = reject
                reader.readAsDataURL(blob)
            })
        } catch {
            return new Promise((resolve, reject) => {
                const img = new Image()
                img.crossOrigin = 'anonymous'
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    canvas.width = img.width
                    canvas.height = img.height
                    canvas.getContext('2d').drawImage(img, 0, 0)
                    resolve(canvas.toDataURL('image/png'))
                }
                img.onerror = reject
                img.src = url
            })
        }
    }

    const generarPdfPresupuesto = async (presupuesto) => {
        const doc = new jsPDF()
        const margen = 18
        let y = margen

        // Logo
        if (empresa?.logo_url) {
            try {
                const base64 = await cargarImagenBase64(empresa.logo_url)
                doc.addImage(base64, 'PNG', margen, y, 45, 18)
            } catch (e) {
                console.warn('Logo no disponible:', e)
            }
        }

        // Datos empresa derecha
        if (empresa) {
            doc.setFontSize(8.5)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(40, 40, 40)
            doc.text(empresa.nombre_empresa || '', 210 - margen, y + 4, { align: 'right' })
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(100, 100, 100)
            if (empresa.cif) doc.text(`CIF: ${empresa.cif}`, 210 - margen, y + 9, { align: 'right' })
            if (empresa.direccion) doc.text(empresa.direccion, 210 - margen, y + 14, { align: 'right' })
            const cpLocalProv = [empresa.codigo_postal, empresa.localidad, empresa.provincia].filter(Boolean).join(', ')
            if (cpLocalProv) doc.text(cpLocalProv, 210 - margen, y + 19, { align: 'right' })
            if (empresa.telefono) doc.text(`Tel: ${empresa.telefono}`, 210 - margen, y + 24, { align: 'right' })
            if (empresa.email) doc.text(empresa.email, 210 - margen, y + 29, { align: 'right' })
        }

        y += 36

        // Línea amarilla
        doc.setDrawColor(255, 230, 0)
        doc.setLineWidth(1)
        doc.line(margen, y, 210 - margen, y)
        y += 10

        // Título
        doc.setFontSize(24)
        doc.setTextColor(20, 20, 20)
        doc.setFont('helvetica', 'bold')
        doc.text('PRESUPUESTO', margen, y)

        // Número y fechas
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(200, 150, 0)
        const numPres = `PRES-${new Date().getFullYear()}-${String(presupuesto.id_presupuesto).padStart(4, '0')}`
        doc.text(`Ref: ${numPres}`, 210 - margen, y - 6, { align: 'right' })
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        doc.text(`Fecha: ${formatearFecha(new Date(new Date(presupuesto.fecha_limite).getTime() - 48 * 3600000))}`, 210 - margen, y, { align: 'right' })
        doc.text(`Válido hasta: ${formatearFecha(presupuesto.fecha_limite)}`, 210 - margen, y + 6, { align: 'right' })

        y += 14

        // Caja cliente
        doc.setFillColor(247, 247, 247)
        doc.setDrawColor(220, 220, 220)
        doc.setLineWidth(0.3)
        doc.rect(margen, y, 174, 32, 'FD')
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(130, 130, 130)
        doc.text('CLIENTE', margen + 5, y + 6)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(30, 30, 30)
        doc.text(presupuesto.reserva?.cliente_nombre || '', margen + 5, y + 13)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(80, 80, 80)
        doc.text(`DNI/CIF: ${presupuesto.reserva?.cliente_dni_nie_cif || ''}`, margen + 5, y + 19)
        doc.text(presupuesto.reserva?.cliente_direccion || '', margen + 5, y + 25)
        const cpCliente = [presupuesto.reserva?.cliente_codigo_postal, presupuesto.reserva?.cliente_localidad, presupuesto.reserva?.cliente_provincia].filter(Boolean).join(', ')
        doc.text(cpCliente, margen + 95, y + 13)
        doc.text(`Email: ${presupuesto.reserva?.cliente_email || ''}`, margen + 95, y + 19)
        if (presupuesto.reserva?.cliente_telefono) doc.text(`Tel: ${presupuesto.reserva.cliente_telefono}`, margen + 95, y + 25)

        y += 40

        // Evento
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(130, 130, 130)
        doc.text('EVENTO', margen, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(50, 50, 50)
        doc.text(`Inicio: ${formatearFechaHora(presupuesto.reserva?.fecha_inicio)}`, margen, y)
        doc.text(`Fin: ${formatearFechaHora(presupuesto.reserva?.fecha_fin)}`, margen + 85, y)
        y += 5
        doc.text(`Ubicación: ${presupuesto.reserva?.ubicacion || ''}`, margen, y)
        y += 10

        // Tabla conceptos
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

        // Totales
        const col1 = 125, col2 = 210 - margen
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        doc.text('Base imponible:', col1, y)
        doc.text(`${parseFloat(presupuesto.base_imponible).toFixed(2)} €`, col2, y, { align: 'right' })
        y += 6
        doc.text('IVA (21%):', col1, y)
        doc.text(`${(parseFloat(presupuesto.total) - parseFloat(presupuesto.base_imponible)).toFixed(2)} €`, col2, y, { align: 'right' })
        y += 3
        doc.setDrawColor(255, 230, 0)
        doc.setLineWidth(0.6)
        doc.line(col1, y, col2, y)
        y += 7
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(20, 20, 20)
        doc.text('TOTAL:', col1, y)
        doc.text(`${parseFloat(presupuesto.total).toFixed(2)} €`, col2, y, { align: 'right' })

        y += 14
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(160, 160, 160)
        doc.text('Este presupuesto tiene validez hasta la fecha indicada. Para aceptarlo, acceda a su área de cliente.', margen, y)

        const nombreCliente = (presupuesto.reserva?.cliente_nombre || 'cliente').replace(/\s+/g, '_')
        doc.save(`presupuesto-${nombreCliente}.pdf`)
    }

    const labelStyle = {
        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: 0
    }

    const btnAmarillo = {
        background: '#FFE600', border: 'none', color: '#000',
        fontFamily: 'Bebas Neue', fontSize: '0.9rem', letterSpacing: '0.12em',
        padding: '0.6rem 1.4rem', cursor: 'pointer', transition: 'opacity 0.2s',
    }

    const btnRojo = {
        background: 'rgba(255,68,68,0.12)', border: '1px solid rgba(255,68,68,0.5)',
        color: '#ff6060', fontFamily: 'Bebas Neue', fontSize: '0.9rem', letterSpacing: '0.12em',
        padding: '0.6rem 1.4rem', cursor: 'pointer', transition: 'all 0.2s',
    }

    return (
        <div style={{ background: '#0d0d0d', minHeight: '100vh', paddingTop: '80px' }}>

            <div style={{ padding: '3rem 4rem 2.5rem' }}>
                <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '3.5rem', letterSpacing: '0.1em', color: '#fff', marginBottom: '0.25rem' }}>
                    Mis <span style={{ color: '#FFE600' }}>pedidos</span>
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>
                    Consulta y gestiona tus presupuestos
                </p>
            </div>

            <div style={{ background: '#111', borderTop: '1px solid rgba(255,230,0,0.15)', padding: '3rem 4rem 6rem' }}>

                {cargando && <p style={{ color: 'rgba(255,255,255,0.3)' }}>Cargando...</p>}
                {error && <p style={{ color: '#ff4444' }}>{error}</p>}

                {!cargando && presupuestos.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '1rem', marginBottom: '1.5rem' }}>
                            Aún no tienes ningún pedido
                        </p>
                        <button onClick={() => navigate('/servicios')} style={btnAmarillo}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            Ver servicios
                        </button>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {presupuestos.map(p => {
                        const dias = p.estado === 'pendiente' ? diasRestantes(p.fecha_limite) : null

                        return (
                            <div key={p.id_presupuesto} style={{
                                background: '#1a1a1a',
                                border: '1px solid rgba(255,230,0,0.12)',
                                boxShadow: '0 0 30px rgba(255,230,0,0.06), 0 4px 24px rgba(0,0,0,0.4)',
                            }}>
                                {/* Cabecera */}
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '1rem 1.5rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    background: 'rgba(255,255,255,0.02)'
                                }}>
                                    <div>
                                        <p style={{ ...labelStyle, marginBottom: '0.3rem' }}>Presupuesto</p>
                                        <p style={{ fontFamily: 'Bebas Neue', fontSize: '1.25rem', letterSpacing: '0.1em', color: '#fff', margin: 0 }}>
                                            {p.reserva?.cliente_nombre || '—'}
                                        </p>
                                    </div>
                                    {badgeEstado(p.estado)}
                                </div>

                                <div style={{ padding: '1.25rem 1.5rem' }}>

                                    {/* Ubicación izquierda — Fechas derecha */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '1rem' }}>
                                        <div>
                                            <p style={labelStyle}>Ubicación</p>
                                            <p style={{ color: '#fff', fontSize: '0.88rem', margin: '0.3rem 0 0', fontWeight: 600 }}>
                                                {p.reserva?.ubicacion || '—'}
                                            </p>
                                        </div>

                                        {/* Fechas rediseñadas: dos bloques con flecha */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                                            {/* INICIO */}
                                            <div style={{
                                                textAlign: 'center',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.07)',
                                                padding: '0.5rem 0.85rem',
                                            }}>
                                                <p style={{ ...labelStyle, marginBottom: '0.35rem' }}>Inicio</p>
                                                <p style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                                                    {formatearSoloFecha(p.reserva?.fecha_inicio)}
                                                </p>
                                                <p style={{ color: '#FFE600', fontSize: '0.82rem', fontWeight: 600, margin: '0.2rem 0 0', letterSpacing: '0.04em' }}>
                                                    {formatearSoloHora(p.reserva?.fecha_inicio)}
                                                </p>
                                            </div>

                                            {/* Flecha */}
                                            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '1rem' }}>→</span>

                                            {/* FIN */}
                                            <div style={{
                                                textAlign: 'center',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.07)',
                                                padding: '0.5rem 0.85rem',
                                            }}>
                                                <p style={{ ...labelStyle, marginBottom: '0.35rem' }}>Fin</p>
                                                <p style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                                                    {formatearSoloFecha(p.reserva?.fecha_fin)}
                                                </p>
                                                <p style={{ color: '#FFE600', fontSize: '0.82rem', fontWeight: 600, margin: '0.2rem 0 0', letterSpacing: '0.04em' }}>
                                                    {formatearSoloHora(p.reserva?.fecha_fin)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Líneas del presupuesto */}
                                    {(p.detalle_presupuesto || []).length > 0 && (
                                        <div style={{ marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.03)' }}>
                                                <span style={{ ...labelStyle, fontSize: '0.65rem' }}>Concepto</span>
                                                <span style={{ ...labelStyle, fontSize: '0.65rem' }}>Subtotal</span>
                                            </div>
                                            {p.detalle_presupuesto.map((d, i) => (
                                                <div key={i} style={{
                                                    display: 'grid', gridTemplateColumns: '1fr auto',
                                                    padding: '0.45rem 0.75rem',
                                                    borderTop: '1px solid rgba(255,255,255,0.04)',
                                                }}>
                                                    <span style={{ color: '#FFE600', fontSize: '0.85rem' }}>{d.concepto}</span>
                                                    <span style={{ color: '#FFE600', fontSize: '0.85rem', fontWeight: 700 }}>
                                                        {parseFloat(d.subtotal).toFixed(2)} €
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Totales */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={labelStyle}>Base imponible</p>
                                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', margin: '0.25rem 0 0' }}>
                                                {parseFloat(p.base_imponible).toFixed(2)} €
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={labelStyle}>IVA 21%</p>
                                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', margin: '0.25rem 0 0' }}>
                                                {(parseFloat(p.total) - parseFloat(p.base_imponible)).toFixed(2)} €
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={labelStyle}>Total</p>
                                            <p style={{ color: '#FFE600', fontFamily: 'Bebas Neue', fontSize: '1.4rem', margin: '0.1rem 0 0', letterSpacing: '0.05em', lineHeight: 1 }}>
                                                {parseFloat(p.total).toFixed(2)} €
                                            </p>
                                        </div>
                                    </div>

                                    {/* Días restantes — solo si pendiente */}
                                    {dias && (
                                        <p style={{ fontSize: '0.78rem', color: dias.color, marginBottom: '1rem', fontWeight: 600 }}>
                                            ⏱ {dias.texto}
                                        </p>
                                    )}

                                    {/* Mensajes de estado */}
                                    {p.estado === 'aceptado_cliente' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#60c060', fontSize: '0.82rem' }}>
                                            <span>✓</span>
                                            <span>Has aceptado el presupuesto. Nos pondremos en contacto contigo para confirmar los detalles.</span>
                                        </div>
                                    )}
                                    {p.estado === 'aceptado' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#60c060', fontSize: '0.82rem' }}>
                                            <span>✓</span>
                                            <span>Presupuesto confirmado por Power Play. Tu evento está reservado.</span>
                                        </div>
                                    )}

                                    {/* Botones */}
                                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                        {p.estado === 'pendiente' && (
                                            <>
                                                <button
                                                    onClick={() => handleEstado(p.id_presupuesto, 'aceptado_cliente')}
                                                    disabled={accionando === p.id_presupuesto}
                                                    style={{ ...btnAmarillo, opacity: accionando === p.id_presupuesto ? 0.6 : 1 }}
                                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                                >
                                                    Aceptar presupuesto
                                                </button>
                                                <button
                                                    onClick={() => handleEstado(p.id_presupuesto, 'rechazado')}
                                                    disabled={accionando === p.id_presupuesto}
                                                    style={{ ...btnRojo, opacity: accionando === p.id_presupuesto ? 0.6 : 1 }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,68,68,0.2)'; e.currentTarget.style.color = '#ff4444' }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,68,68,0.12)'; e.currentTarget.style.color = '#ff6060' }}
                                                >
                                                    Rechazar
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => generarPdfPresupuesto(p)}
                                            style={btnAmarillo}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                        >
                                            ↓ Descargar presupuesto
                                        </button>
                                    </div>

                                    {/* Factura */}
                                    {p.factura && p.factura.length > 0 && (
                                        <div style={{
                                            marginTop: '1.1rem', borderTop: '1px solid rgba(255,230,0,0.12)',
                                            paddingTop: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}>
                                            <div>
                                                <p style={labelStyle}>Factura</p>
                                                <p style={{ color: '#fff', fontFamily: 'Bebas Neue', fontSize: '1.05rem', letterSpacing: '0.08em', margin: '0.25rem 0 0.2rem' }}>
                                                    {p.factura[0].numero_factura}
                                                </p>
                                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', margin: 0 }}>
                                                    {parseFloat(p.factura[0].total).toFixed(2)} €
                                                </p>
                                            </div>
                                            <button
                                                style={btnAmarillo}
                                                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                            >
                                                ↓ Descargar factura
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}