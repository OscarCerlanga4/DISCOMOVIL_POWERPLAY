import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { API_URL } from '../lib/api'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

function FormularioPago({ importe, onExito }) {
    const stripe = useStripe()
    const elements = useElements()
    const [procesando, setProcesando] = useState(false)
    const [error, setError] = useState(null)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!stripe || !elements) return
        setProcesando(true)
        setError(null)
        stripe.confirmPayment({ elements, redirect: 'if_required' })
            .then(({ error: stripeError, paymentIntent }) => {
                if (stripeError) {
                    setError(stripeError.message)
                    setProcesando(false)
                } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                    onExito(importe)
                }
            })
            .catch(() => {
                setError('Error al procesar el pago')
                setProcesando(false)
            })
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <PaymentElement />
            {error && <p style={{ color: '#ff4444', fontSize: '0.85rem', margin: 0 }}>{error}</p>}
            <button
                type="submit"
                disabled={!stripe || procesando}
                style={{
                    background: '#FFE600', border: 'none', color: '#000',
                    fontFamily: 'Bebas Neue', fontSize: '1.1rem', letterSpacing: '0.15em',
                    padding: '0.85rem', cursor: procesando ? 'not-allowed' : 'pointer',
                    opacity: procesando ? 0.7 : 1, transition: 'opacity 0.2s', width: '100%'
                }}
            >
                {procesando ? 'Procesando...' : `Confirmar pago de ${importe}€`}
            </button>
        </form>
    )
}

// ── Logo Stripe inline ────────────────────────────────────────────────────────
function StripeBadge() {
    return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.3 }}>
                <span style={{ color: '#fff', fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Pagos seguros con Stripe</span>
            </div>
        </div>
    )
}

export default function Pago() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [factura, setFactura] = useState(null)
    const [pagos, setPagos] = useState([])
    const [clientSecret, setClientSecret] = useState(null)
    const [cargando, setCargando] = useState(true)
    const [pagado, setPagado] = useState(false)
    const [paso, setPaso] = useState('inicio') // 'inicio' | 'tarjeta' | 'tarjeta-parcial' | 'stripe' | 'efectivo'
    const [importeInput, setImporteInput] = useState('')
    const [errorImporte, setErrorImporte] = useState(null)

    const token = localStorage.getItem('token')

    useEffect(() => {
        fetch(`${API_URL}/api/facturas/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    setFactura(data.result)
                    if (data.result.estado_factura === 'pagada') setPagado(true)
                }
            })
            .then(() => fetch(`${API_URL}/api/pagos/factura/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }))
            .then(r => r.json())
            .then(data => {
                if (data.ok) setPagos(data.result)
            })
            .finally(() => setCargando(false))
    }, [id])

    const totalPagado = pagos.reduce((sum, p) => sum + parseFloat(p.importe), 0)
    const pendiente = factura ? parseFloat(factura.total) - totalPagado : 0

    const iniciarPagoStripe = (importe) => {
        setErrorImporte(null)
        const importeNum = parseFloat(importe)
        if (!importeNum || importeNum <= 0) { setErrorImporte('Introduce un importe válido'); return }
        if (importeNum > pendiente + 0.01) { setErrorImporte(`El importe no puede superar ${pendiente.toFixed(2)}€`); return }

        fetch(`${API_URL}/api/pagos/crear-intencion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id_factura: parseInt(id), importe: importeNum })
        })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    setImporteInput(String(importe))
                    setClientSecret(data.clientSecret)
                    setPaso('stripe')
                }
            })
    }

    const handleExito = (importePagado) => {
        const nuevoTotal = totalPagado + parseFloat(importePagado)
        setClientSecret(null)
        setImporteInput('')
        if (nuevoTotal >= parseFloat(factura?.total || 0)) setPagado(true)
        setTimeout(() => { window.location.href = '/mis-pedidos' }, 500)
    }

    // ── Estilos compartidos ────────────────────────────────────────────────────
    const labelMeta = {
        fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.15em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: 0
    }

    const inputStyle = {
        background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff', padding: '0.75rem 1rem', fontSize: '0.9rem',
        outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', width: '100%'
    }

    const btnPrincipal = {
        background: '#FFE600', border: 'none', color: '#000',
        fontFamily: 'Bebas Neue', fontSize: '1.05rem', letterSpacing: '0.15em',
        padding: '0.9rem 1.5rem', cursor: 'pointer', transition: 'opacity 0.2s',
        width: '100%', textAlign: 'center'
    }

    const btnSecundario = {
        background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.6)', fontFamily: 'Bebas Neue', fontSize: '1.05rem',
        letterSpacing: '0.15em', padding: '0.9rem 1.5rem', cursor: 'pointer',
        transition: 'all 0.2s', width: '100%', textAlign: 'center'
    }

    const btnVolver = {
        background: 'transparent', border: 'none',
        color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem',
        cursor: 'pointer', padding: 0, textAlign: 'left'
    }

    // ── Loading / error ────────────────────────────────────────────────────────
    if (cargando) return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
            <p style={{ color: 'rgba(255,255,255,0.3)' }}>Cargando...</p>
        </div>
    )

    if (!factura) return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
            <p style={{ color: '#ff4444' }}>Factura no encontrada.</p>
        </div>
    )

    // ── Modal ──────────────────────────────────────────────────────────────────
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 500,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem'
        }}>
            <div className="pago-modal" style={{
                background: '#141414',
                border: '1px solid rgba(255,230,0,0.12)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
                padding: '2.5rem',
                width: '100%', maxWidth: '560px',
                maxHeight: '90vh', overflowY: 'auto',
                position: 'relative'
            }}>

                {/* Botón cerrar */}
                <button
                    onClick={() => { window.location.href = '/mis-pedidos' }}
                    style={{
                        position: 'absolute', top: '1.25rem', right: '1.25rem',
                        background: 'transparent', border: 'none',
                        color: 'rgba(255,255,255,0.3)', fontSize: '1.5rem',
                        cursor: 'pointer', lineHeight: 1, padding: '0.25rem'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                >×</button>

                {/* Título */}
                <p style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,230,0,0.5)', margin: '0 0 0.3rem' }}>
                    Pago de factura
                </p>
                <h2 style={{ fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '0.08em', color: '#fff', margin: '0 0 1.75rem', lineHeight: 1 }}>
                    {factura.numero_factura}
                </h2>

                {/* Resumen importes */}
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem', paddingBottom: '1.75rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div>
                        <p style={labelMeta}>Total</p>
                        <p style={{ fontSize: '1.25rem', fontFamily: 'Bebas Neue', letterSpacing: '0.05em', color: '#fff', margin: '0.2rem 0 0' }}>
                            {parseFloat(factura.total).toFixed(2)}€
                        </p>
                    </div>
                    <div>
                        <p style={labelMeta}>Pagado</p>
                        <p style={{ fontSize: '1.25rem', fontFamily: 'Bebas Neue', letterSpacing: '0.05em', color: '#FFE600', margin: '0.2rem 0 0' }}>
                            {totalPagado.toFixed(2)}€
                        </p>
                    </div>
                    <div>
                        <p style={labelMeta}>Pendiente</p>
                        <p style={{ fontSize: '1.25rem', fontFamily: 'Bebas Neue', letterSpacing: '0.05em', color: pagado ? '#60c060' : '#fff', margin: '0.2rem 0 0' }}>
                            {pagado ? '0.00€' : `${pendiente.toFixed(2)}€`}
                        </p>
                    </div>
                </div>

                {/* Pagado */}
                {pagado && (
                    <div style={{ background: 'rgba(96,192,96,0.08)', border: '1px solid rgba(96,192,96,0.2)', padding: '1.25rem 1.5rem' }}>
                        <p style={{ color: '#60c060', fontWeight: 700, margin: 0 }}>✓ Factura completamente pagada</p>
                    </div>
                )}

                {/* ── Paso: inicio ── */}
                {!pagado && paso === 'inicio' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <button
                            onClick={() => setPaso('tarjeta')}
                            style={btnPrincipal}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                            Pagar con tarjeta →
                        </button>
                        <button
                            onClick={() => setPaso('efectivo')}
                            style={btnSecundario}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = '#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                        >
                            Pagar en efectivo →
                        </button>
                    </div>
                )}

                {/* ── Paso: tarjeta — elegir todo o parcial ── */}
                {!pagado && paso === 'tarjeta' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <p style={{ ...labelMeta, marginBottom: '0.5rem' }}>¿Cómo quieres pagar?</p>
                        <button
                            onClick={() => iniciarPagoStripe(pendiente.toFixed(2))}
                            style={btnPrincipal}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                            Pagar todo — {pendiente.toFixed(2)}€
                        </button>
                        <button
                            onClick={() => setPaso('tarjeta-parcial')}
                            style={btnSecundario}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = '#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                        >
                            Realizar varios pagos
                        </button>
                        <button onClick={() => setPaso('inicio')} style={btnVolver}>← Volver</button>
                    </div>
                )}

                {/* ── Paso: tarjeta-parcial — introducir importe ── */}
                {!pagado && paso === 'tarjeta-parcial' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ ...labelMeta, marginBottom: '0.25rem' }}>Importe a pagar</p>
                        <div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="number"
                                    min="0.01"
                                    max={pendiente.toFixed(2)}
                                    step="0.01"
                                    placeholder={`Máx. ${pendiente.toFixed(2)}€`}
                                    value={importeInput}
                                    onChange={e => { setImporteInput(e.target.value); setErrorImporte(null) }}
                                    style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = '#FFE600'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                                <button
                                    onClick={() => setImporteInput(pendiente.toFixed(2))}
                                    style={{
                                        background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                                        color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 700,
                                        letterSpacing: '0.05em', padding: '0 1rem', cursor: 'pointer',
                                        transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = '#fff' }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
                                >
                                    Máx
                                </button>
                            </div>
                            {errorImporte && <p style={{ color: '#ff4444', fontSize: '0.82rem', margin: '0.3rem 0 0' }}>{errorImporte}</p>}
                        </div>
                        <button
                            onClick={() => iniciarPagoStripe(importeInput)}
                            disabled={!importeInput}
                            style={{ ...btnPrincipal, opacity: !importeInput ? 0.4 : 1, cursor: !importeInput ? 'not-allowed' : 'pointer' }}
                        >
                            Continuar con el pago →
                        </button>
                        <button
                            onClick={() => { setPaso('tarjeta'); setImporteInput(''); setErrorImporte(null) }}
                            style={btnVolver}
                        >← Volver</button>
                    </div>
                )}

                {/* ── Paso: stripe ── */}
                {!pagado && paso === 'stripe' && clientSecret && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
                            <FormularioPago importe={parseFloat(importeInput).toFixed(2)} onExito={handleExito} />
                        </Elements>
                        <button
                            onClick={() => { setClientSecret(null); setPaso('tarjeta') }}
                            style={btnVolver}
                        >← Volver</button>
                    </div>
                )}

                {/* ── Paso: efectivo ── */}
                {!pagado && paso === 'efectivo' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem' }}>
                            <p style={{ color: '#fff', fontWeight: 600, margin: '0 0 0.5rem', fontSize: '0.95rem' }}>Pago en efectivo</p>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>
                                Contacta con nosotros para coordinar el pago en efectivo. Una vez recibido, actualizaremos el estado de tu factura.
                            </p>
                        </div>
                        <button onClick={() => setPaso('inicio')} style={btnVolver}>← Volver</button>
                    </div>
                )}

                {/* Logo Stripe */}
                <StripeBadge />

            </div>
        </div>
    )
}
