import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { API_URL } from '../lib/api'

export default function MisPedidos() {
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [presupuestos, setPresupuestos] = useState([])
    const [empresa, setEmpresa] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(null)
    const [accionando, setAccionando] = useState(null)
    const [filtroTipo, setFiltroTipo] = useState('presupuestos')
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [filtroFactura, setFiltroFactura] = useState('todos')
    const [abiertoDesplegableFactura, setAbiertoDesplegableFactura] = useState(false)
    const [abiertoDesplegablePresupuesto, setAbiertoDesplegablePresupuesto] = useState(false)
    const [presupuestoDestacado, setPresupuestoDestacado] = useState(null)
    const [facturaDestacada, setFacturaDestacada] = useState(null)
    const [searchParams] = useSearchParams()

    useEffect(() => {
        if (!usuario) { navigate('/login'); return }
        const token = localStorage.getItem('token')
        Promise.all([
            fetch(`${API_URL}/api/presupuestos/mis-presupuestos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(r => r.json()),
            fetch(`${API_URL}/api/datosEmpresas`).then(r => r.json())
        ])
            .then(([presupuestosData, empresaData]) => {
                if (presupuestosData.ok) setPresupuestos(presupuestosData.result)
                if (empresaData.ok) setEmpresa(empresaData.result)
            })
            .catch(() => setError('Error al cargar los datos'))
            .finally(() => setCargando(false))
            const idParam = searchParams.get('presupuesto')
            if (idParam) setPresupuestoDestacado(parseInt(idParam))
    }, [usuario])

    useEffect(() => {
        if (!presupuestoDestacado) return
        const timerScroll = setTimeout(() => {
            const el = document.getElementById(`presupuesto-${presupuestoDestacado}`)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
        const timerLimpiar = setTimeout(() => setPresupuestoDestacado(null), 2500)
        return () => { clearTimeout(timerScroll); clearTimeout(timerLimpiar) }
    }, [presupuestoDestacado])

    useEffect(() => {
        if (!facturaDestacada) return
        const timerScroll = setTimeout(() => {
            const el = document.getElementById(`factura-${facturaDestacada}`)
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
        const timerLimpiar = setTimeout(() => setFacturaDestacada(null), 2500)
        return () => { clearTimeout(timerScroll); clearTimeout(timerLimpiar) }
    }, [facturaDestacada])

    const presupuestosFiltrados = presupuestos
        .filter(p => filtroEstado === 'todos' || p.estado === filtroEstado)
        .sort((a, b) => b.id_presupuesto - a.id_presupuesto)

    const facturas = presupuestos
        .filter(p => p.factura !== null && p.factura !== undefined)
        .sort((a, b) => b.id_presupuesto - a.id_presupuesto)

    const facturasFiltradas = facturas.filter(p => {
        if (filtroFactura === 'todos') return true
        if (filtroFactura === 'pagada') return p.factura?.estado_factura === 'pagada'
        if (filtroFactura === 'pendiente') return p.factura?.estado_factura !== 'pagada'
        return true
    })

    const contarEstado = (estado) => presupuestos.filter(p => p.estado === estado).length

    const handleEstado = (idPresupuesto, estado) => {
        setAccionando(idPresupuesto)
        const token = localStorage.getItem('token')
        fetch(`${API_URL}/api/presupuestos/${idPresupuesto}`, {
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

    const badgeEstadoFactura = (estadoFactura) => {
        const esPagada = estadoFactura === 'pagada'
        return (
            <span style={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: esPagada ? '#60c060' : '#FFE600',
                background: esPagada ? 'rgba(96,192,96,0.1)' : 'rgba(255,230,0,0.1)',
                border: `1px solid ${esPagada ? 'rgba(96,192,96,0.3)' : 'rgba(255,230,0,0.3)'}`,
                padding: '0.25rem 0.65rem', whiteSpace: 'nowrap'
            }}>
                {esPagada ? '✓ Pagada' : 'Pendiente de pago'}
            </span>
        )
    }

    const cargarImagenBase64 = (url) => {
        return fetch(url, { mode: 'cors', cache: 'no-store' })
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                return res.blob()
            })
            .then(blob => new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result)
                reader.onerror = reject
                reader.readAsDataURL(blob)
            }))
    }

    // ─── CABECERA EMPRESA — reutilizada en presupuesto y factura ──────────────
    // Dibuja la caja de empresa con logo grande + datos. Devuelve la nueva Y.
    const dibujarCabeceraEmpresa = (doc, margen, y, logoBase64) => {
        const boxH = 44
        const boxW = 174

        // Fondo caja
        doc.setFillColor(248, 248, 248)
        doc.setDrawColor(215, 215, 215)
        doc.setLineWidth(0.3)
        doc.rect(margen, y, boxW, boxH, 'FD')

        // Acento izquierdo amarillo
        doc.setFillColor(255, 230, 0)
        doc.rect(margen, y, 4, boxH, 'F')

        // Logo grande dentro de la caja
        if (logoBase64) {
            try {
                doc.addImage(logoBase64, 'PNG', margen + 7, y + 5, 66, 34)
            } catch (e) { /* ignorar si falla */ }
        }

        // Datos empresa (columna derecha de la caja)
        if (empresa) {
            const dataX = margen + 80
            let lineY = y + 11

            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(20, 20, 20)
            doc.text(empresa.nombre_empresa || '', dataX, lineY)
            lineY += 7

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(8.5)
            doc.setTextColor(75, 75, 75)

            if (empresa.cif) {
                doc.text(`CIF: ${empresa.cif}`, dataX, lineY)
                lineY += 5.5
            }
            if (empresa.direccion) {
                doc.text(empresa.direccion, dataX, lineY)
                lineY += 5.5
            }
            const cpLocalProv = [empresa.codigo_postal, empresa.localidad, empresa.provincia].filter(Boolean).join(', ')
            if (cpLocalProv) {
                doc.text(cpLocalProv, dataX, lineY)
                lineY += 5.5
            }
            const contacto = [
                empresa.telefono ? `Tel: ${empresa.telefono}` : null,
                empresa.email || null
            ].filter(Boolean).join('   ·   ')
            if (contacto) doc.text(contacto, dataX, lineY)
        }

        return y + boxH + 8   // devuelve la Y después de la caja + espacio
    }

    // ─── PDF PRESUPUESTO ───────────────────────────────────────────────────────
    const generarPdfPresupuesto = async (presupuesto) => {
        const doc = new jsPDF()
        const margen = 18
        let y = margen

        // Cargar logo primero
        let logoBase64 = null
        if (empresa?.logo_url) {
            try { logoBase64 = await cargarImagenBase64(empresa.logo_url) }
            catch (e) { console.warn('Logo no disponible:', e) }
        }

        // Caja empresa con logo grande
        y = dibujarCabeceraEmpresa(doc, margen, y, logoBase64)

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

        // Ref + fecha
        const numPres = `PRES-${new Date().getFullYear()}-${String(presupuesto.id_presupuesto).padStart(4, '0')}`
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(200, 150, 0)
        doc.text(`Ref: ${numPres}`, 210 - margen, y - 6, { align: 'right' })
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        doc.text(`Fecha: ${formatearFecha(presupuesto.fecha_emision)}`, 210 - margen, y, { align: 'right' })
        if (presupuesto.estado === 'pendiente') {
            doc.text(`Válido hasta: ${formatearFecha(presupuesto.fecha_limite)}`, 210 - margen, y + 6, { align: 'right' })
        }

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
        doc.text(`Tel: ${presupuesto.reserva?.cliente_telefono || ''}`, margen + 95, y + 25)
        y += 40

        // Evento
        const colIzq = margen, colDer = margen + 95
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(130, 130, 130)
        doc.text('INICIO', colIzq, y)
        doc.text('UBICACIÓN', colDer, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(50, 50, 50)
        doc.text(formatearFechaHora(presupuesto.reserva?.fecha_inicio), colIzq, y)
        doc.text(doc.splitTextToSize(presupuesto.reserva?.ubicacion || '—', 210 - margen - colDer), colDer, y)
        y += 9
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(130, 130, 130)
        doc.text('FIN', colIzq, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(50, 50, 50)
        doc.text(formatearFechaHora(presupuesto.reserva?.fecha_fin), colIzq, y)
        y += 12

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

    // ─── PDF FACTURA ───────────────────────────────────────────────────────────
    const generarPdfFactura = async (presupuesto) => {
        const f = presupuesto.factura
        const doc = new jsPDF()
        const margen = 18
        let y = margen

        // Cargar logo primero
        let logoBase64 = null
        if (empresa?.logo_url) {
            try { logoBase64 = await cargarImagenBase64(empresa.logo_url) }
            catch (e) { console.warn('Logo no disponible:', e) }
        }

        // Caja empresa con logo grande (igual que presupuesto)
        y = dibujarCabeceraEmpresa(doc, margen, y, logoBase64)

        // Línea amarilla
        doc.setDrawColor(255, 230, 0)
        doc.setLineWidth(1)
        doc.line(margen, y, 210 - margen, y)
        y += 10

        // Título
        doc.setFontSize(24)
        doc.setTextColor(20, 20, 20)
        doc.setFont('helvetica', 'bold')
        doc.text('FACTURA', margen, y)

        // Nº + fecha + estado
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(200, 150, 0)
        doc.text(`Nº: ${f.numero_factura}`, 210 - margen, y - 6, { align: 'right' })
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        doc.text(`Fecha de emisión: ${formatearFecha(f.fecha_emision)}`, 210 - margen, y, { align: 'right' })
        doc.text(`Estado: ${f.estado_factura === 'pagada' ? 'Pagada' : 'Pendiente de pago'}`, 210 - margen, y + 6, { align: 'right' })

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
        doc.text(`Tel: ${presupuesto.reserva?.cliente_telefono || ''}`, margen + 95, y + 25)
        y += 40

        // Evento
        const colIzq = margen, colDer = margen + 95
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(130, 130, 130)
        doc.text('INICIO', colIzq, y)
        doc.text('UBICACIÓN', colDer, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(50, 50, 50)
        doc.text(formatearFechaHora(presupuesto.reserva?.fecha_inicio), colIzq, y)
        doc.text(doc.splitTextToSize(presupuesto.reserva?.ubicacion || '—', 210 - margen - colDer), colDer, y)
        y += 9
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(130, 130, 130)
        doc.text('FIN', colIzq, y)
        y += 5
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        doc.setTextColor(50, 50, 50)
        doc.text(formatearFechaHora(presupuesto.reserva?.fecha_fin), colIzq, y)
        y += 12

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
        const col1 = 125, col2 = 210 - margen
        doc.setFontSize(8.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 80, 80)
        doc.text('Base imponible:', col1, y)
        doc.text(`${parseFloat(f.base_imponible).toFixed(2)} €`, col2, y, { align: 'right' })
        y += 6
        doc.text('IVA (21%):', col1, y)
        doc.text(`${(parseFloat(f.total) - parseFloat(f.base_imponible)).toFixed(2)} €`, col2, y, { align: 'right' })
        y += 3
        doc.setDrawColor(255, 230, 0)
        doc.setLineWidth(0.6)
        doc.line(col1, y, col2, y)
        y += 7
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(20, 20, 20)
        doc.text('TOTAL:', col1, y)
        doc.text(`${parseFloat(f.total).toFixed(2)} €`, col2, y, { align: 'right' })
        y += 14
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(160, 160, 160)
        doc.text('Gracias por confiar en Power Play. Para cualquier consulta, contacte con nosotros.', margen, y)

        const nombreCliente = (presupuesto.reserva?.cliente_nombre || 'cliente').replace(/\s+/g, '_')
        doc.save(`factura-${f.numero_factura}-${nombreCliente}.pdf`)
    }

    // ─── ESTILOS COMPARTIDOS ───────────────────────────────────────────────────
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
    const btnVerde = {
        background: 'rgba(96,192,96,0.12)', border: '1px solid rgba(96,192,96,0.4)',
        color: '#60c060', fontFamily: 'Bebas Neue', fontSize: '0.9rem', letterSpacing: '0.12em',
        padding: '0.6rem 1.4rem', cursor: 'pointer', transition: 'all 0.2s',
    }

    const chipsFiltro = [
        { valor: 'todos', label: 'Todos', count: presupuestos.length },
        { valor: 'pendiente', label: 'Pendiente', count: contarEstado('pendiente') },
        { valor: 'aceptado_cliente', label: 'En revisión', count: contarEstado('aceptado_cliente') },
        { valor: 'aceptado', label: 'Confirmado', count: contarEstado('aceptado') },
        { valor: 'rechazado', label: 'Rechazado', count: contarEstado('rechazado') },
    ]

    const chipsFactura = [
        { valor: 'todos', label: 'Todos', count: facturas.length },
        { valor: 'pagada', label: 'Pagada', count: facturas.filter(p => p.factura?.estado_factura === 'pagada').length },
        { valor: 'pendiente', label: 'Pendiente de pago', count: facturas.filter(p => p.factura?.estado_factura !== 'pagada').length },
    ]

    return (
        <div style={{ background: '#0d0d0d', minHeight: '100vh', paddingTop: '80px' }}>

            <div className="pedidos-cabecera">
                <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '3.5rem', letterSpacing: '0.1em', color: '#fff', marginBottom: '0.25rem' }}>
                    Mis <span style={{ color: '#FFE600' }}>pedidos</span>
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', margin: 0 }}>
                    Consulta y gestiona tus presupuestos y facturas
                </p>
            </div>

            <div className="pedidos-tabs">
                <div style={{ display: 'flex' }}>
                    {[
                        { valor: 'presupuestos', label: 'Presupuestos', count: presupuestos.length },
                        { valor: 'facturas', label: 'Facturas', count: facturas.length },
                    ].map(tab => {
                        const activo = filtroTipo === tab.valor
                        return (
                            <button key={tab.valor}
                                onClick={() => { setFiltroTipo(tab.valor); setFiltroEstado('todos'); window.scrollTo(0, 0) }}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    fontFamily: 'Bebas Neue', fontSize: '1.05rem', letterSpacing: '0.12em',
                                    color: activo ? '#FFE600' : 'rgba(255,255,255,0.35)',
                                    padding: '0.85rem 1.5rem 0.75rem',
                                    borderBottom: activo ? '2px solid #FFE600' : '2px solid transparent',
                                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}
                                onMouseEnter={e => { if (!activo) e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                                onMouseLeave={e => { if (!activo) e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
                            >
                                {tab.label}
                                <span style={{
                                    fontSize: '0.65rem', fontFamily: 'sans-serif', fontWeight: 700,
                                    background: activo ? 'rgba(255,230,0,0.15)' : 'rgba(255,255,255,0.07)',
                                    color: activo ? '#FFE600' : 'rgba(255,255,255,0.3)',
                                    padding: '0.1rem 0.45rem', borderRadius: '999px',
                                }}>{tab.count}</span>
                            </button>
                        )
                    })}
                </div>

                {filtroTipo === 'presupuestos' && (
                    <>
                        {/* Desktop */}
                        <div className="filtro-desktop" style={{ gap: '0.5rem', padding: '0.85rem 0', flexWrap: 'wrap' }}>
                            {chipsFiltro.map(chip => {
                                const activo = filtroEstado === chip.valor
                                return (
                                    <button key={chip.valor} onClick={() => setFiltroEstado(chip.valor)}
                                        style={{
                                            background: activo ? '#FFE600' : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${activo ? '#FFE600' : 'rgba(255,255,255,0.1)'}`,
                                            color: activo ? '#000' : 'rgba(255,255,255,0.5)',
                                            fontFamily: 'Bebas Neue', fontSize: '0.82rem', letterSpacing: '0.1em',
                                            padding: '0.3rem 0.9rem', cursor: 'pointer', transition: 'all 0.18s',
                                            display: 'flex', alignItems: 'center', gap: '0.4rem'
                                        }}
                                        onMouseEnter={e => { if (!activo) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' } }}
                                        onMouseLeave={e => { if (!activo) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' } }}
                                    >
                                        {chip.label}
                                        {chip.count > 0 && (
                                            <span style={{
                                                fontSize: '0.6rem', fontFamily: 'sans-serif', fontWeight: 700,
                                                background: activo ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)',
                                                padding: '0.05rem 0.4rem', borderRadius: '999px'
                                            }}>{chip.count}</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Móvil */}
                        <div className="filtro-movil" style={{ position: 'relative', marginBottom: '1rem' }}>
                            <button className="filtro-trigger" onClick={() => setAbiertoDesplegablePresupuesto(!abiertoDesplegablePresupuesto)}>
                                {chipsFiltro.find(c => c.valor === filtroEstado)?.label || 'Filtrar'}
                                <span style={{ fontSize: '0.75rem', opacity: 0.6, marginLeft: '0.25rem' }}>
                                    ({chipsFiltro.find(c => c.valor === filtroEstado)?.count ?? presupuestos.length})
                                </span>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: 'auto' }}>
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                            {abiertoDesplegablePresupuesto && (
                                <>
                                    <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setAbiertoDesplegablePresupuesto(false)} />
                                    <div className="filtro-dropdown-menu">
                                        {chipsFiltro.map(chip => (
                                            <button key={chip.valor}
                                                onClick={() => { setFiltroEstado(chip.valor); setAbiertoDesplegablePresupuesto(false) }}
                                                style={{
                                                    color: filtroEstado === chip.valor ? '#FFE600' : 'rgba(255,255,255,0.6)',
                                                    background: filtroEstado === chip.valor ? 'rgba(255,230,0,0.08)' : 'transparent'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.color = '#FFE600'; e.currentTarget.style.background = 'rgba(255,230,0,0.04)' }}
                                                onMouseLeave={e => { e.currentTarget.style.color = filtroEstado === chip.valor ? '#FFE600' : 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = filtroEstado === chip.valor ? 'rgba(255,230,0,0.08)' : 'transparent' }}
                                            >
                                                {chip.label}
                                                <span style={{ opacity: 0.45, fontSize: '0.75rem', marginLeft: '0.4rem' }}>({chip.count})</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
                {filtroTipo === 'facturas' && (
                    <>
                        {/* Desktop */}
                        <div className="filtro-desktop" style={{ gap: '0.5rem', padding: '0.85rem 0', flexWrap: 'wrap' }}>
                            {chipsFactura.map(chip => {
                                const activo = filtroFactura === chip.valor
                                return (
                                    <button key={chip.valor} onClick={() => setFiltroFactura(chip.valor)}
                                        style={{
                                            background: activo ? '#FFE600' : 'rgba(255,255,255,0.04)',
                                            border: `1px solid ${activo ? '#FFE600' : 'rgba(255,255,255,0.1)'}`,
                                            color: activo ? '#000' : 'rgba(255,255,255,0.5)',
                                            fontFamily: 'Bebas Neue', fontSize: '0.82rem', letterSpacing: '0.1em',
                                            padding: '0.3rem 0.9rem', cursor: 'pointer', transition: 'all 0.18s',
                                            display: 'flex', alignItems: 'center', gap: '0.4rem'
                                        }}
                                        onMouseEnter={e => { if (!activo) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' } }}
                                        onMouseLeave={e => { if (!activo) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' } }}
                                    >
                                        {chip.label}
                                        {chip.count > 0 && (
                                            <span style={{
                                                fontSize: '0.6rem', fontFamily: 'sans-serif', fontWeight: 700,
                                                background: activo ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.08)',
                                                padding: '0.05rem 0.4rem', borderRadius: '999px'
                                            }}>{chip.count}</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Móvil */}
                        <div className="filtro-movil" style={{ position: 'relative', marginBottom: '1rem' }}>
                            <button className="filtro-trigger" onClick={() => setAbiertoDesplegableFactura(!abiertoDesplegableFactura)}>
                                {chipsFactura.find(c => c.valor === filtroFactura)?.label || 'Filtrar'}
                                <span style={{ fontSize: '0.75rem', opacity: 0.6, marginLeft: '0.25rem' }}>
                                    ({chipsFactura.find(c => c.valor === filtroFactura)?.count ?? facturas.length})
                                </span>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginLeft: 'auto' }}>
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                            {abiertoDesplegableFactura && (
                                <>
                                    <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setAbiertoDesplegableFactura(false)} />
                                    <div className="filtro-dropdown-menu">
                                        {chipsFactura.map(chip => (
                                            <button key={chip.valor}
                                                onClick={() => { setFiltroFactura(chip.valor); setAbiertoDesplegableFactura(false) }}
                                                style={{
                                                    color: filtroFactura === chip.valor ? '#FFE600' : 'rgba(255,255,255,0.6)',
                                                    background: filtroFactura === chip.valor ? 'rgba(255,230,0,0.08)' : 'transparent'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.color = '#FFE600'; e.currentTarget.style.background = 'rgba(255,230,0,0.04)' }}
                                                onMouseLeave={e => { e.currentTarget.style.color = filtroFactura === chip.valor ? '#FFE600' : 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = filtroFactura === chip.valor ? 'rgba(255,230,0,0.08)' : 'transparent' }}
                                            >
                                                {chip.label}
                                                <span style={{ opacity: 0.45, fontSize: '0.75rem', marginLeft: '0.4rem' }}>({chip.count})</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>

            <div className="pedidos-content" style={{ background: '#111' }}>

                {cargando && <p style={{ color: 'rgba(255,255,255,0.3)' }}>Cargando...</p>}
                {error && <p style={{ color: '#ff4444' }}>{error}</p>}

                {/* ── PRESUPUESTOS ─────────────────────────────────────────────── */}
                {!cargando && filtroTipo === 'presupuestos' && (
                    <>
                        {presupuestosFiltrados.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '1rem', marginBottom: '1.5rem' }}>
                                    {filtroEstado === 'todos' ? 'Aún no tienes ningún pedido' : 'No hay presupuestos con este estado'}
                                </p>
                                {filtroEstado === 'todos' && (
                                    <button onClick={() => navigate('/servicios')} style={btnAmarillo}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                        Ver servicios
                                    </button>
                                )}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {presupuestosFiltrados.map(p => {
                                const dias = p.estado === 'pendiente' ? diasRestantes(p.fecha_limite) : null
                                return (
                                    <div key={p.id_presupuesto} id={`presupuesto-${p.id_presupuesto}`} style={{
                                            background: '#1a1a1a',
                                            border: presupuestoDestacado === p.id_presupuesto ? '1px solid rgba(255,230,0,0.7)' : '1px solid rgba(255,230,0,0.12)',
                                            boxShadow: presupuestoDestacado === p.id_presupuesto ? '0 0 40px rgba(255,230,0,0.2), 0 4px 24px rgba(0,0,0,0.4)' : '0 0 30px rgba(255,230,0,0.06), 0 4px 24px rgba(0,0,0,0.4)',
                                            transition: 'border 0.4s, box-shadow 0.4s',
                                        }}>
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
                                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', margin: '0.2rem 0 0' }}>
                                                    Emitido el {formatearFecha(p.fecha_emision)}
                                                </p>
                                            </div>
                                            {badgeEstado(p.estado)}
                                        </div>

                                        <div style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
                                                <div>
                                                    <p style={labelStyle}>Ubicación</p>
                                                    <p style={{ color: '#fff', fontSize: '0.88rem', margin: '0.3rem 0 0', fontWeight: 600 }}>
                                                        {p.reserva?.ubicacion || '—'}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                                                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '0.5rem 0.85rem' }}>
                                                        <p style={{ ...labelStyle, marginBottom: '0.35rem' }}>Inicio</p>
                                                        <p style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{formatearSoloFecha(p.reserva?.fecha_inicio)}</p>
                                                        <p style={{ color: '#FFE600', fontSize: '0.82rem', fontWeight: 600, margin: '0.2rem 0 0' }}>{formatearSoloHora(p.reserva?.fecha_inicio)}</p>
                                                    </div>
                                                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>
                                                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '0.5rem 0.85rem' }}>
                                                        <p style={{ ...labelStyle, marginBottom: '0.35rem' }}>Fin</p>
                                                        <p style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{formatearSoloFecha(p.reserva?.fecha_fin)}</p>
                                                        <p style={{ color: '#FFE600', fontSize: '0.82rem', fontWeight: 600, margin: '0.2rem 0 0' }}>{formatearSoloHora(p.reserva?.fecha_fin)}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {(p.detalle_presupuesto || []).length > 0 && (
                                                <div style={{ marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.03)' }}>
                                                        <span style={{ ...labelStyle, fontSize: '0.65rem' }}>Concepto</span>
                                                        <span style={{ ...labelStyle, fontSize: '0.65rem' }}>Subtotal</span>
                                                    </div>
                                                    {p.detalle_presupuesto.map((d, i) => (
                                                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '0.45rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                                            <span style={{ color: '#FFE600', fontSize: '0.85rem' }}>{d.concepto}</span>
                                                            <span style={{ color: '#FFE600', fontSize: '0.85rem', fontWeight: 700 }}>{parseFloat(d.subtotal).toFixed(2)} €</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={labelStyle}>Base imponible</p>
                                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', margin: '0.25rem 0 0' }}>{parseFloat(p.base_imponible).toFixed(2)} €</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={labelStyle}>IVA 21%</p>
                                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', margin: '0.25rem 0 0' }}>{(parseFloat(p.total) - parseFloat(p.base_imponible)).toFixed(2)} €</p>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={labelStyle}>Total</p>
                                                    <p style={{ color: '#FFE600', fontFamily: 'Bebas Neue', fontSize: '1.4rem', margin: '0.1rem 0 0', letterSpacing: '0.05em', lineHeight: 1 }}>{parseFloat(p.total).toFixed(2)} €</p>
                                                </div>
                                            </div>

                                            {dias && <p style={{ fontSize: '0.78rem', color: dias.color, marginBottom: '1rem', fontWeight: 600 }}>⏱ {dias.texto}</p>}

                                            {p.estado === 'aceptado_cliente' && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#60c060', fontSize: '0.82rem' }}>
                                                    <span>✓</span><span>Has aceptado el presupuesto. Nos pondremos en contacto contigo para confirmar los detalles.</span>
                                                </div>
                                            )}
                                            {p.estado === 'aceptado' && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#60c060', fontSize: '0.82rem' }}>
                                                    <span>✓</span><span>Presupuesto confirmado por Power Play. Tu evento está reservado.</span>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                                {p.estado === 'pendiente' && (
                                                    <>
                                                        <button onClick={() => handleEstado(p.id_presupuesto, 'aceptado_cliente')} disabled={accionando === p.id_presupuesto}
                                                            style={{ ...btnAmarillo, opacity: accionando === p.id_presupuesto ? 0.6 : 1 }}
                                                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                                            Aceptar presupuesto
                                                        </button>
                                                        <button onClick={() => handleEstado(p.id_presupuesto, 'rechazado')} disabled={accionando === p.id_presupuesto}
                                                            style={{ ...btnRojo, opacity: accionando === p.id_presupuesto ? 0.6 : 1 }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,68,68,0.2)'; e.currentTarget.style.color = '#ff4444' }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,68,68,0.12)'; e.currentTarget.style.color = '#ff6060' }}>
                                                            Rechazar
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => generarPdfPresupuesto(p)} style={btnAmarillo}
                                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                                    ↓ Descargar presupuesto
                                                </button>
                                            </div>

                                            {p.factura && (
                                                <div style={{
                                                    marginTop: '1.1rem', borderTop: '1px solid rgba(255,230,0,0.12)',
                                                    paddingTop: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                }}>
                                                    <div>
                                                        <p style={labelStyle}>Factura generada</p>
                                                        <p style={{ color: '#fff', fontFamily: 'Bebas Neue', fontSize: '1.05rem', letterSpacing: '0.08em', margin: '0.25rem 0 0.1rem' }}>
                                                            {p.factura.numero_factura}
                                                        </p>
                                                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', margin: 0 }}>
                                                            {parseFloat(p.factura.total).toFixed(2)} € · {formatearFecha(p.factura.fecha_emision)}
                                                        </p>
                                                    </div>
                                                    <button onClick={() => { setFiltroTipo('facturas'); setFiltroEstado('todos'); setFacturaDestacada(p.factura.id_factura) }}
                                                        style={btnAmarillo}
                                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                                        Ver factura →
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}

                {/* ── FACTURAS ─────────────────────────────────────────────────── */}
                {!cargando && filtroTipo === 'facturas' && (
                    <>
                        {facturas.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '1rem' }}>{filtroFactura === 'todos' ? 'Aún no tienes ninguna factura' : 'No hay facturas con este estado'}</p>
                                <p style={{ color: 'rgba(255,255,255,0.12)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                    Las facturas se generan cuando Power Play confirma tu reserva
                                </p>
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {facturasFiltradas.map(p => {
                                const f = p.factura
                                const pagada = f.estado_factura === 'pagada'
                                return (
                                    <div key={f.id_factura} id={`factura-${f.id_factura}`} style={{
                                        background: '#1a1a1a',
                                        border: facturaDestacada === f.id_factura ? '1px solid rgba(255,230,0,0.7)' : '1px solid rgba(255,230,0,0.12)',
                                        boxShadow: facturaDestacada === f.id_factura ? '0 0 40px rgba(255,230,0,0.2), 0 4px 24px rgba(0,0,0,0.4)' : '0 0 30px rgba(255,230,0,0.06), 0 4px 24px rgba(0,0,0,0.4)',
                                        transition: 'border 0.4s, box-shadow 0.4s',
                                    }}>
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '1rem 1.5rem',
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            background: 'rgba(255,255,255,0.02)'
                                        }}>
                                            <div>
                                                <p style={{ ...labelStyle, marginBottom: '0.3rem' }}>Factura</p>
                                                <p style={{ fontFamily: 'Bebas Neue', fontSize: '1.3rem', letterSpacing: '0.1em', color: '#FFE600', margin: 0 }}>
                                                    {f.numero_factura}
                                                </p>
                                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', margin: '0.2rem 0 0' }}>
                                                    Emitida el {formatearFecha(f.fecha_emision)}
                                                </p>
                                            </div>
                                            {badgeEstadoFactura(f.estado_factura)}
                                        </div>

                                        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                                            <div>
                                                <p style={labelStyle}>Cliente</p>
                                                <p style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, margin: '0.25rem 0 0' }}>
                                                    {p.reserva?.cliente_nombre || '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p style={labelStyle}>Fecha del evento</p>
                                                <p style={{ color: '#fff', fontSize: '0.88rem', margin: '0.25rem 0 0' }}>
                                                    {formatearSoloFecha(p.reserva?.fecha_inicio)}
                                                </p>
                                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: '0.1rem 0 0' }}>
                                                    {p.reserva?.ubicacion || '—'}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginLeft: 'auto' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={labelStyle}>Total</p>
                                                    <p style={{ color: '#FFE600', fontFamily: 'Bebas Neue', fontSize: '1.4rem', margin: '0.15rem 0 0', letterSpacing: '0.05em', lineHeight: 1 }}>
                                                        {parseFloat(f.total).toFixed(2)} €
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <button onClick={() => generarPdfFactura(p)} style={btnAmarillo}
                                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                                        ↓ Descargar
                                                    </button>
                                                    {!pagada && (
                                                        <button onClick={() => navigate(`/pago/${f.id_factura}`)} style={btnVerde}>
                                                            Pagar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}