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
                    padding: '0.85rem 2rem', cursor: procesando ? 'not-allowed' : 'pointer',
                    opacity: procesando ? 0.7 : 1, transition: 'transform 0.2s', alignSelf: 'flex-start'
                }}
                onMouseEnter={e => { if (!procesando) e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
                {procesando ? 'Procesando...' : `Confirmar pago de ${importe}€`}
            </button>
        </form>
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
    const [vistaEfectivo, setVistaEfectivo] = useState(false)
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

    const iniciarPagoStripe = () => {
        setErrorImporte(null)
        const importe = parseFloat(importeInput)
        if (!importe || importe <= 0) { setErrorImporte('Introduce un importe válido'); return }
        if (importe > pendiente) { setErrorImporte(`El importe no puede superar ${pendiente.toFixed(2)}€`); return }

        fetch(`${API_URL}/api/pagos/crear-intencion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ id_factura: parseInt(id), importe })
        })
            .then(r => r.json())
            .then(data => { if (data.ok) setClientSecret(data.clientSecret) })
    }

    const handleExito = (importePagado) => {
        window.scrollTo(0, 0)
        window.location.reload()
        const nuevoTotal = totalPagado + parseFloat(importePagado)
        setClientSecret(null)
        setImporteInput('')
        if (nuevoTotal >= parseFloat(factura.total)) {
            setPagado(true)
        } else {
            setTimeout(() => {
                fetch(`${API_URL}/api/pagos/factura/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                    .then(r => r.json())
                    .then(data => { if (data.ok) setPagos(data.result) })
            }, 2000)
        }
    }

    const labelMeta = {
        fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em',
        textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: 0
    }

    const inputStyle = {
        background: '#141414', border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff', padding: '0.75rem 1rem', fontSize: '0.9rem',
        outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', width: '200px'
    }

    if (cargando) return (
        <div style={{ background: '#0d0d0d', minHeight: '100vh', paddingTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.3)' }}>Cargando...</p>
        </div>
    )

    if (!factura) return (
        <div style={{ background: '#0d0d0d', minHeight: '100vh', paddingTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#ff4444' }}>Factura no encontrada.</p>
        </div>
    )

    return (
        <div style={{ background: '#0d0d0d', minHeight: '100vh', paddingTop: '80px' }}>
        <style>{`.p-BrandingBar { display: none !important; } .p-BrandingLogo { display: none !important; }`}</style>

            {/* Cabecera */}
            <div style={{ padding: '3rem 4rem 2.5rem' }}>
                <h1 style={{
                    fontFamily: 'Bebas Neue', fontSize: '3.5rem', letterSpacing: '0.1em',
                    color: '#fff', margin: '0 0 0.25rem', lineHeight: 1
                }}>
                    Pago de <span style={{ color: '#FFE600' }}>Factura</span>
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', margin: 0 }}>
                    {factura.numero_factura}
                </p>
            </div>

            <div style={{ background: '#111', borderTop: '1px solid rgba(255,230,0,0.15)', padding: '3rem 4rem 6rem' }}>
                <div style={{ maxWidth: '640px' }}>

                    {/* Botón volver — siempre visible */}
                    <button
                        onClick={() => navigate('/mis-pedidos')}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'rgba(255,255,255,0.6)',
                            fontFamily: 'Bebas Neue',
                            fontSize: '1.1rem',
                            letterSpacing: '0.15em',
                            padding: '0.85rem 2rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'block',
                            marginBottom: '2rem'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = '#fff' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                    >
                        ← Volver a mis pedidos
                    </button>
                    
                    {/* Resumen */}
                    <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', padding: '2rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                            <div>
                                <p style={labelMeta}>Total factura</p>
                                <p style={{ fontSize: '1.4rem', fontFamily: 'Bebas Neue', letterSpacing: '0.05em', color: '#fff', margin: '0.2rem 0 0' }}>
                                    {parseFloat(factura.total).toFixed(2)}€
                                </p>
                            </div>
                            <div>
                                <p style={labelMeta}>Ya pagado</p>
                                <p style={{ fontSize: '1.4rem', fontFamily: 'Bebas Neue', letterSpacing: '0.05em', color: '#FFE600', margin: '0.2rem 0 0' }}>
                                    {totalPagado.toFixed(2)}€
                                </p>
                            </div>
                            <div>
                                <p style={labelMeta}>Pendiente</p>
                                <p style={{ fontSize: '1.4rem', fontFamily: 'Bebas Neue', letterSpacing: '0.05em', color: pagado ? '#60c060' : '#fff', margin: '0.2rem 0 0' }}>
                                    {pagado ? '0.00€' : `${pendiente.toFixed(2)}€`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pagado */}
                    {pagado && (
                        <div style={{ background: 'rgba(96,192,96,0.08)', border: '1px solid rgba(96,192,96,0.2)', padding: '1.5rem 2rem' }}>
                            <p style={{ color: '#60c060', fontWeight: 700, margin: 0 }}>Factura completamente pagada</p>
                        </div>
                    )}

                    {/* Opciones de pago */}
                    {!pagado && !clientSecret && !vistaEfectivo && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <p style={labelMeta}>Importe a pagar</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                                            color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 700,
                                            letterSpacing: '0.05em', padding: '0.75rem 1rem', cursor: 'pointer',
                                            transition: 'all 0.2s', whiteSpace: 'nowrap'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = '#fff' }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
                                    >
                                        Total pendiente
                                    </button>
                                </div>
                                {errorImporte && <p style={{ color: '#ff4444', fontSize: '0.82rem', margin: 0 }}>{errorImporte}</p>}
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <button
                                    onClick={iniciarPagoStripe}
                                    style={{
                                        background: '#FFE600', border: 'none', color: '#000',
                                        fontFamily: 'Bebas Neue', fontSize: '1.1rem', letterSpacing: '0.15em',
                                        padding: '0.85rem 2rem', cursor: 'pointer', transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    Pagar con tarjeta →
                                </button>
                                <button
                                    onClick={() => setVistaEfectivo(true)}
                                    style={{
                                        background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                                        color: 'rgba(255,255,255,0.6)', fontFamily: 'Bebas Neue', fontSize: '1.1rem',
                                        letterSpacing: '0.15em', padding: '0.85rem 2rem', cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = '#fff' }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                                >
                                    Pagar en efectivo →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Vista efectivo */}
                    {!pagado && vistaEfectivo && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.06)', padding: '2rem' }}>
                                <p style={{ color: '#fff', fontWeight: 600, marginBottom: '0.5rem' }}>Pago en efectivo</p>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
                                    Contacta con nosotros para coordinar el pago en efectivo. Una vez recibido, actualizaremos el estado de tu factura.
                                </p>
                            </div>
                            <button
                                onClick={() => setVistaEfectivo(false)}
                                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', cursor: 'pointer', alignSelf: 'flex-start', padding: 0 }}
                            >
                                ← Volver
                            </button>
                        </div>
                    )}

                    {/* Formulario Stripe */}
                    {!pagado && clientSecret && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
                                <FormularioPago importe={parseFloat(importeInput).toFixed(2)} onExito={handleExito} />
                            </Elements>
                            <button
                                onClick={() => setClientSecret(null)}
                                style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', cursor: 'pointer', alignSelf: 'flex-start', padding: 0 }}
                            >
                                ← Volver
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}