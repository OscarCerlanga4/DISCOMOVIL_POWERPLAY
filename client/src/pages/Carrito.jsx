import { useState, useRef } from 'react'
import { useCarrito } from '../contexts/CarritoContext'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Carrito() {
    const { items, fechaInicio, fechaFin, ubicacion, setFechaInicio, setFechaFin, setUbicacion, eliminar, cambiarCantidad, vaciar, total } = useCarrito()
    const { usuario } = useAuth()
    const navigate = useNavigate()
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState(null)
    const [clienteAdmin, setClienteAdmin] = useState({ nombre: '', email: '', telefono: '', dni: '', direccion: '', cp: '', localidad: '', provincia: '' })
    const [mostrarModal, setMostrarModal] = useState(false)
    const [errorsModal, setErrorsModal] = useState({
        nombre: '', 
        email: '', 
        telefono: '', 
        dni: '',
        direccion: '', 
        cp: '', 
        localidad: '', 
        provincia: ''
    })
    const [sugerencias, setSugerencias] = useState([])
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
    const debounceRef = useRef(null)
    const ahora = new Date().toISOString().slice(0, 16)

    const clienteRelleno = Object.values(clienteAdmin).every(v => v.trim() !== '')

    const buscarDirecciones = (valor) => {
        setUbicacion(valor)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (valor.length < 3) { setSugerencias([]); return }
        debounceRef.current = setTimeout(() => {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(valor)}&countrycodes=es&limit=5&addressdetails=1`, {
                headers: { 'Accept-Language': 'es' }
            })
                .then(r => r.json())
                .then(data => { setSugerencias(data); setMostrarSugerencias(true) })
                .catch(() => setSugerencias([]))
        }, 350)
    }

    const validateModal = () => {
        const e = {}
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const telefonoRegex = /^[6789]\d{8}$/
        const dniNieCifRegex = /^(\d{8}[A-Z]|[XYZ]\d{7}[A-Z]|[A-Z]\d{7}[A-Z0-9])$/i
        const cpRegex = /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/

        if (!clienteAdmin.nombre.trim() || clienteAdmin.nombre.trim().length < 3)
            e.nombre = 'Nombre no válido (mínimo 3 caracteres)'
        if (!clienteAdmin.email.trim()) e.email = 'El email es obligatorio'
        else if (!emailRegex.test(clienteAdmin.email)) e.email = 'Email no válido'
        if (!clienteAdmin.telefono.trim()) e.telefono = 'El teléfono es obligatorio'
        else if (!telefonoRegex.test(clienteAdmin.telefono.replace(/\s/g, '')))
            e.telefono = 'Teléfono no válido (9 dígitos, empieza por 6, 7, 8 o 9)'
        if (!clienteAdmin.dni.trim()) e.dni = 'El DNI/NIE/CIF es obligatorio'
        else if (!dniNieCifRegex.test(clienteAdmin.dni.trim()))
            e.dni = 'Formato no válido'
        if (!clienteAdmin.direccion.trim() || clienteAdmin.direccion.trim().length < 5)
            e.direccion = 'Introduce una dirección válida'
        if (!clienteAdmin.cp.trim()) e.cp = 'Obligatorio'
        else if (!cpRegex.test(clienteAdmin.cp.trim())) e.cp = 'CP no válido'
        if (!clienteAdmin.localidad.trim() || clienteAdmin.localidad.trim().length < 2)
            e.localidad = 'Introduce una localidad'
        if (!clienteAdmin.provincia.trim() || clienteAdmin.provincia.trim().length < 2)
            e.provincia = 'Introduce una provincia'

        setErrorsModal(prev => ({ ...prev, ...e }))
        return Object.keys(e).length === 0
    }

    const seleccionarDireccion = (lugar) => {
        setUbicacion(lugar.display_name)
        setSugerencias([])
        setMostrarSugerencias(false)
    }

    const handleConfirmar = () => {
        if (!usuario) { navigate('/login'); return }
        if (!fechaInicio || !fechaFin) { setError('Selecciona las fechas del evento'); return }
        if (!ubicacion) { setError('Introduce la ubicación del evento'); return }
        if (items.length === 0) { setError('El carrito está vacío'); return }
        if (usuario.rol === 'admin' && !clienteRelleno) {
            setError('Añade los datos del cliente antes de confirmar')
            return
        }

        setError(null)
        setCargando(true)

        const token = localStorage.getItem('token')
        const djsIds = items.filter(i => i.tabla === 'dj').map(i => i._id)
        const equiposItems = items.filter(i => i.tabla === 'equipo').map(i => ({ id_equipo: i._id, cantidad: i.cantidad }))

        const body = {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            ubicacion,
            djs: djsIds,
            equipos: equiposItems
        }

        if (usuario.rol === 'admin') {
            body.cliente_nombre = clienteAdmin.nombre
            body.cliente_email = clienteAdmin.email
            body.cliente_telefono = clienteAdmin.telefono
            body.cliente_dni_nie_cif = clienteAdmin.dni
            body.cliente_direccion = clienteAdmin.direccion
            body.cliente_codigo_postal = clienteAdmin.cp
            body.cliente_localidad = clienteAdmin.localidad
            body.cliente_provincia = clienteAdmin.provincia
        }

        fetch('/api/reservas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    vaciar()
                    navigate(usuario.rol === 'admin' ? '/admin' : '/mis-pedidos')
                } else {
                    setError(data.error)
                }
            })
            .catch(() => setError('Error al crear la reserva'))
            .finally(() => setCargando(false))
    }

    const inputStyle = {
        background: '#0d0d0d',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff',
        padding: '0.75rem 1rem',
        fontSize: '0.9rem',
        outline: 'none',
        width: '100%',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    }

    const labelStyle = {
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.5)',
        marginBottom: '0.4rem',
        display: 'block'
    }

    const getBadgeLabel = (item) => {
        if (item.tabla === 'equipo') return item.categoria || 'Equipo'
        if (item.tipo === 'orquesta') return 'Orquesta'
        if (item.tipo === 'grupo') return 'Grupo musical'
        return 'DJ'
    }

    const campoModal = (campo, label, tipo = 'text') => (
        <div>
            <label style={{ ...labelStyle, color: 'rgba(255,255,255,0.45)' }}>{label}</label>
            <input
            type={tipo}
            value={clienteAdmin[campo]}
            onChange={e => {
                setClienteAdmin(prev => ({ ...prev, [campo]: e.target.value }))
                setErrorsModal(prev => ({ ...prev, [campo]: '' }))
            }}
            style={{ ...inputStyle, border: errorsModal[campo] ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }}
            onFocus={e => e.target.style.borderColor = '#FFE600'}
            onBlur={e => e.target.style.borderColor = errorsModal[campo] ? '#ff4444' : 'rgba(255,255,255,0.1)'}
            />
            {errorsModal[campo] && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errorsModal[campo]}</p>}
        </div>
    )

    const resumenInputStyle = {
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff',
        padding: '0.75rem 1rem',
        fontSize: '0.9rem',
        outline: 'none',
        width: '100%',
        transition: 'border-color 0.2s',
    }

    return (
        <div style={{ background: '#0d0d0d', minHeight: '100vh', paddingTop: '80px' }}>

            {/* Modal datos cliente */}
            {mostrarModal && (
                <div
                    onClick={e => { if (e.target === e.currentTarget) setMostrarModal(false) }}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.75)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                        animation: 'fadeIn 0.2s ease',
                    }}
                >
                    <style>{`
                        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                        @keyframes slideUp { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
                    `}</style>
                    <div style={{
                        background: '#1a1a1a',
                        border: '1px solid rgba(255,230,0,0.25)',
                        boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,230,0,0.05)',
                        padding: '2rem',
                        width: '100%',
                        maxWidth: '560px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.25rem',
                        animation: 'slideUp 0.25s ease',
                    }}>
                        {/* Cabecera modal */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{
                                    fontFamily: 'Bebas Neue', fontSize: '1.8rem',
                                    letterSpacing: '0.1em', color: '#fff', margin: '0 0 0.2rem'
                                }}>
                                    Datos del <span style={{ color: '#FFE600' }}>cliente</span>
                                </h2>
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', margin: 0 }}>
                                    Todos los campos son obligatorios
                                </p>
                            </div>
                            <button
                                onClick={() => setMostrarModal(false)}
                                style={{
                                    background: 'transparent', border: 'none',
                                    color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                                    fontSize: '1.5rem', lineHeight: 1, padding: '0.25rem',
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                            >×</button>
                        </div>

                        {/* Fila 1 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {campoModal('nombre', 'Nombre completo')}
                            {campoModal('dni', 'DNI / NIE / CIF')}
                        </div>

                        {/* Fila 2 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {campoModal('email', 'Email', 'email')}
                            {campoModal('telefono', 'Teléfono', 'tel')}
                        </div>

                        {/* Fila 3 */}
                        {campoModal('direccion', 'Dirección')}

                        {/* Fila 4 */}
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: '0.75rem' }}>
                            {campoModal('cp', 'C. Postal')}
                            {campoModal('localidad', 'Localidad')}
                            {campoModal('provincia', 'Provincia')}
                        </div>

                        {/* Botón guardar */}
                        <button
                            onClick={() => {
                                if (!validateModal()) return
                                setMostrarModal(false)
                            }}
                            disabled={!clienteRelleno}
                            style={{
                                marginTop: '0.25rem',
                                background: clienteRelleno ? '#FFE600' : 'rgba(255,255,255,0.05)',
                                border: clienteRelleno ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                color: clienteRelleno ? '#000' : 'rgba(255,255,255,0.3)',
                                fontFamily: 'Bebas Neue', fontSize: '1.1rem', letterSpacing: '0.15em',
                                padding: '0.9rem', cursor: clienteRelleno ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { if (clienteRelleno) e.currentTarget.style.transform = 'translateY(-2px)' }}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            {clienteRelleno ? 'Guardar datos del cliente' : 'Rellena todos los campos'}
                        </button>
                    </div>
                </div>
            )}

            {/* Cabecera */}
            <div style={{ padding: '3rem 4rem 2.5rem' }}>
                <h1 style={{
                    fontFamily: 'Bebas Neue', fontSize: '3.5rem',
                    letterSpacing: '0.1em', color: '#fff', marginBottom: '0.25rem'
                }}>
                    Tu <span style={{ color: '#FFE600' }}>carrito</span>
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>
                    {items.length === 0 ? 'No tienes ningún servicio añadido' : `${items.length} ${items.length === 1 ? 'servicio' : 'servicios'} añadidos`}
                </p>
            </div>

            <div style={{ background: '#111', borderTop: '1px solid rgba(255,230,0,0.15)', padding: '3rem 4rem 6rem' }}>

                {items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '1rem', marginBottom: '1.5rem' }}>
                            Aún no has añadido ningún servicio
                        </p>
                        <button
                            onClick={() => navigate('/servicios')}
                            style={{
                                background: '#FFE600', border: 'none', color: '#000',
                                fontFamily: 'Bebas Neue', fontSize: '1rem', letterSpacing: '0.15em',
                                padding: '0.85rem 2rem', cursor: 'pointer', transition: 'transform 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            Ver servicios
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem', alignItems: 'start' }}>

                        {/* Columna izquierda — items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {items.map(item => (
                                <div
                                    key={`${item.tabla}-${item._id}`}
                                    style={{
                                        background: '#1c1c1c',
                                        border: '1px solid rgba(255,230,0,0.15)',
                                        boxShadow: '0 4px 20px rgba(255,230,0,0.05)',
                                        display: 'flex',
                                        gap: '1.5rem',
                                        padding: '1.25rem',
                                        alignItems: 'center',
                                    }}
                                >
                                    {/* Imagen */}
                                    <div style={{ width: '120px', height: '80px', flexShrink: 0, background: '#242424', overflow: 'hidden' }}>
                                        {item.imagen_url ? (
                                            <img src={item.imagen_url} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.6rem' }}>SIN IMAGEN</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', margin: '0 0 0.35rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.nombre}
                                        </p>
                                        <span style={{
                                            display: 'inline-block', fontSize: '0.7rem', fontWeight: 700,
                                            letterSpacing: '0.1em', textTransform: 'uppercase',
                                            color: '#FFE600', background: 'rgba(255,230,0,0.08)',
                                            border: '1px solid rgba(255,230,0,0.2)', padding: '0.2rem 0.55rem',
                                        }}>
                                            {getBadgeLabel(item)}
                                        </span>
                                    </div>

                                    {/* Cantidad */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {item.tabla === 'equipo' ? (
                                            <>
                                                <button
                                                    onClick={() => cambiarCantidad(item._id, item.tabla, item.cantidad - 1)}
                                                    style={{
                                                        width: '32px', height: '32px', background: 'transparent',
                                                        border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
                                                        cursor: 'pointer', fontSize: '1.1rem', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#FFE600'}
                                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                                                >−</button>
                                                <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', minWidth: '24px', textAlign: 'center' }}>
                                                    {item.cantidad}
                                                </span>
                                                <button
                                                    onClick={() => cambiarCantidad(item._id, item.tabla, item.cantidad + 1)}
                                                    style={{
                                                        width: '32px', height: '32px', background: 'transparent',
                                                        border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
                                                        cursor: 'pointer', fontSize: '1.1rem', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#FFE600'}
                                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                                                >+</button>
                                            </>
                                        ) : (
                                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>1 unidad</span>
                                        )}
                                    </div>

                                    {/* Precio */}
                                    <div style={{ textAlign: 'right', minWidth: '90px', flexShrink: 0 }}>
                                        <p style={{ color: '#FFE600', fontFamily: 'Bebas Neue', fontSize: '1.6rem', letterSpacing: '0.05em', margin: 0, lineHeight: 1 }}>
                                            {item.precio * item.cantidad}€
                                        </p>
                                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', margin: '0.3rem 0 0' }}>
                                            {item.precio}€ {item.precioLabel}
                                        </p>
                                    </div>

                                    {/* Eliminar */}
                                    <button
                                        onClick={() => eliminar(item._id, item.tabla)}
                                        style={{
                                            background: 'transparent', border: 'none',
                                            color: 'rgba(255,255,255,0.2)', cursor: 'pointer',
                                            fontSize: '1.4rem', padding: '0.25rem', transition: 'color 0.2s', flexShrink: 0,
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                                        title="Eliminar"
                                    >×</button>
                                </div>
                            ))}
                        </div>

                        {/* Columna derecha — resumen */}
                        <div style={{
                            background: '#1c1c1c',
                            border: '1px solid rgba(255,230,0,0.15)',
                            padding: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem',
                            position: 'sticky',
                            top: '100px',
                        }}>
                            <h2 style={{
                                fontFamily: 'Bebas Neue', fontSize: '1.5rem',
                                letterSpacing: '0.1em', color: '#fff', margin: 0
                            }}>
                                Resumen
                            </h2>

                            <div>
                                <label style={labelStyle}>Fecha de inicio</label>
                                <input
                                    type="datetime-local"
                                    min={ahora}
                                    value={fechaInicio}
                                    onChange={e => setFechaInicio(e.target.value)}
                                    style={resumenInputStyle}
                                    onFocus={e => e.target.style.borderColor = '#FFE600'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Fecha de fin</label>
                                <input
                                    type="datetime-local"
                                    min={fechaInicio || ahora}
                                    value={fechaFin}
                                    min={fechaInicio}
                                    onChange={e => setFechaFin(e.target.value)}
                                    style={resumenInputStyle}
                                    onFocus={e => e.target.style.borderColor = '#FFE600'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                />
                            </div>

                            {/* Ubicación */}
                            <div style={{ position: 'relative' }}>
                                <label style={labelStyle}>Ubicación del evento</label>
                                <input
                                    type="text"
                                    placeholder="Busca una dirección..."
                                    value={ubicacion}
                                    onChange={e => buscarDirecciones(e.target.value)}
                                    onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                                    onFocus={e => {
                                        e.target.style.borderColor = '#FFE600'
                                        if (sugerencias.length > 0) setMostrarSugerencias(true)
                                    }}
                                    style={resumenInputStyle}
                                />
                                {mostrarSugerencias && sugerencias.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        background: '#141414', border: '1px solid rgba(255,230,0,0.2)',
                                        borderTop: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                                        zIndex: 100, maxHeight: '220px', overflowY: 'auto',
                                    }}>
                                        {sugerencias.map((lugar, i) => (
                                            <div
                                                key={i}
                                                onMouseDown={() => seleccionarDireccion(lugar)}
                                                style={{
                                                    padding: '0.65rem 1rem', fontSize: '0.82rem',
                                                    color: 'rgba(255,255,255,0.75)',
                                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                    cursor: 'pointer', transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,230,0,0.08)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                {lugar.display_name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Botón datos cliente — solo admin */}
                            {usuario?.rol === 'admin' && (
                                <button
                                    onClick={() => {
                                        setErrorsModal({ nombre: '', email: '', telefono: '', dni: '', direccion: '', cp: '', localidad: '', provincia: '' })
                                        setMostrarModal(true)
                                    }}
                                    style={{
                                        background: clienteRelleno ? 'rgba(34,197,94,0.08)' : 'rgba(255,230,0,0.06)',
                                        border: clienteRelleno ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,230,0,0.35)',
                                        color: clienteRelleno ? 'rgb(34,197,94)' : '#FFE600',
                                        cursor: 'pointer',
                                        padding: '0.8rem 1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.6rem',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        letterSpacing: '0.03em',
                                        transition: 'all 0.2s',
                                        textAlign: 'left',
                                        width: '100%',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                >
                                    <span style={{ fontSize: '1rem' }}>{clienteRelleno ? '✓' : '+'}</span>
                                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {clienteRelleno ? `Cliente: ${clienteAdmin.nombre}` : 'Añadir datos del cliente'}
                                    </span>
                                    {clienteRelleno && (
                                        <span style={{
                                            fontSize: '0.72rem', color: 'rgba(34,197,94,0.7)',
                                            fontWeight: 400, flexShrink: 0
                                        }}>
                                            editar
                                        </span>
                                    )}
                                </button>
                            )}

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total estimado</span>
                                <span style={{ color: '#FFE600', fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '0.05em' }}>{total}€</span>
                            </div>

                            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', margin: 0 }}>
                                El precio final puede variar según las horas del evento
                            </p>

                            {error && (
                                <p style={{ color: '#ff4444', fontSize: '0.85rem', margin: 0 }}>{error}</p>
                            )}

                            <button
                                onClick={handleConfirmar}
                                disabled={cargando}
                                style={{
                                    background: '#FFE600', border: 'none', color: '#000',
                                    fontFamily: 'Bebas Neue', fontSize: '1.1rem', letterSpacing: '0.15em',
                                    padding: '0.85rem', cursor: cargando ? 'not-allowed' : 'pointer',
                                    opacity: cargando ? 0.7 : 1, transition: 'transform 0.2s',
                                }}
                                onMouseEnter={e => { if (!cargando) e.currentTarget.style.transform = 'translateY(-2px)' }}
                                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                {cargando ? 'Procesando...' : 'Confirmar reserva'}
                            </button>

                            <button
                                onClick={vaciar}
                                style={{
                                    background: 'transparent', border: '1px solid rgba(255,68,68,0.4)',
                                    color: 'rgba(255,68,68,0.7)', cursor: 'pointer',
                                    fontFamily: 'Bebas Neue', fontSize: '1.1rem', letterSpacing: '0.15em',
                                    padding: '0.85rem', transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = 'rgba(255,68,68,0.08)'
                                    e.currentTarget.style.borderColor = '#ff4444'
                                    e.currentTarget.style.color = '#ff4444'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = 'transparent'
                                    e.currentTarget.style.borderColor = 'rgba(255,68,68,0.4)'
                                    e.currentTarget.style.color = 'rgba(255,68,68,0.7)'
                                }}
                            >
                                Vaciar carrito
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}