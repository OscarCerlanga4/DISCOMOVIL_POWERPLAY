import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import SubidaImagen from '../components/SubidaImagen'

export default function Eventos() {
    const { usuario } = useAuth()
    const [eventos, setEventos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [busqueda, setBusqueda] = useState('')
    const [soloProximos, setSoloProximos] = useState(false)
    const [hoverId, setHoverId] = useState(null)
    const [mostrarForm, setMostrarForm] = useState(false)
    const [form, setForm] = useState({ titulo: '', fecha: '', lugar: '', artistas: '', descripcion: '', imagen_url: '' })
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState('')
    const [editandoId, setEditandoId] = useState(null)
    const [formEditar, setFormEditar] = useState({})
    const [guardandoEdicion, setGuardandoEdicion] = useState(false)
    const [errorEdicion, setErrorEdicion] = useState('')

    const cargarEventos = () => {
        fetch('/api/eventos')
            .then(r => r.json())
            .then(data => { if (data.ok) setEventos(data.result) })
            .finally(() => setCargando(false))
    }

    useEffect(() => { cargarEventos() }, [])

    const ahora = new Date()

    const eventosFiltrados = useMemo(() => {
        return eventos.filter(e => {
            if (soloProximos && new Date(e.fecha) < ahora) return false
            if (!busqueda.trim()) return true
            const q = busqueda.toLowerCase()
            return (
                e.titulo?.toLowerCase().includes(q) ||
                e.lugar?.toLowerCase().includes(q) ||
                e.artistas?.toLowerCase().includes(q)
            )
        })
    }, [eventos, busqueda, soloProximos])

    const formatFecha = (iso) => new Date(iso).toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })

    const formatHora = (iso) => new Date(iso).toLocaleTimeString('es-ES', {
        hour: '2-digit', minute: '2-digit'
    })

    const esPasado = (iso) => new Date(iso) < ahora

    const handleGuardar = () => {
        if (!form.titulo.trim() || !form.fecha || !form.lugar.trim()) {
            setError('Título, fecha y lugar son obligatorios.')
            return
        }
        setGuardando(true)
        setError('')
        fetch('/api/eventos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(form)
        })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    setEventos(prev => [...prev, data.result].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)))
                    setForm({ titulo: '', fecha: '', lugar: '', artistas: '', descripcion: '', imagen_url: '' })
                    setMostrarForm(false)
                } else {
                    setError(data.error || 'Error al crear el evento.')
                }
            })
            .catch(() => setError('Error de conexión.'))
            .finally(() => setGuardando(false))
    }

    const handleAbrirEdicion = (evento) => {
        if (editandoId === evento.id_evento) {
            setEditandoId(null)
            return
        }
        const fechaLocal = evento.fecha ? new Date(evento.fecha).toISOString().slice(0, 16) : ''
        setFormEditar({
            titulo: evento.titulo || '',
            fecha: fechaLocal,
            lugar: evento.lugar || '',
            artistas: evento.artistas || '',
            descripcion: evento.descripcion || '',
            imagen_url: evento.imagen_url || ''
        })
        setEditandoId(evento.id_evento)
        setErrorEdicion('')
    }

    const handleGuardarEdicion = (id) => {
        if (!formEditar.titulo.trim() || !formEditar.fecha || !formEditar.lugar.trim()) {
            setErrorEdicion('Título, fecha y lugar son obligatorios.')
            return
        }
        setGuardandoEdicion(true)
        setErrorEdicion('')
        fetch(`/api/eventos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formEditar)
        })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    setEventos(prev => prev.map(e => e.id_evento === id ? data.result : e).sort((a, b) => new Date(a.fecha) - new Date(b.fecha)))
                    setEditandoId(null)
                } else {
                    setErrorEdicion(data.error || 'Error al guardar los cambios.')
                }
            })
            .catch(() => setErrorEdicion('Error de conexión.'))
            .finally(() => setGuardandoEdicion(false))
    }

    const inputStyle = {
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff',
        padding: '0.75rem 1rem',
        fontSize: '0.9rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
        width: '100%'
    }

    const labelMeta = {
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.3)',
        margin: 0
    }

    const labelForm = {
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.4)',
        display: 'block',
        marginBottom: '6px'
    }

    const formLayout = (f, setF) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 2 }}>
                    <label style={labelForm}>Título *</label>
                    <input
                        type="text"
                        value={f.titulo}
                        onChange={e => setF(p => ({ ...p, titulo: e.target.value }))}
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#FFE600'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={labelForm}>Fecha y hora *</label>
                    <input
                        type="datetime-local"
                        value={f.fecha}
                        onChange={e => setF(p => ({ ...p, fecha: e.target.value }))}
                        style={{ ...inputStyle, colorScheme: 'dark' }}
                        onFocus={e => e.target.style.borderColor = '#FFE600'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <label style={labelForm}>Lugar *</label>
                    <input
                        type="text"
                        value={f.lugar}
                        onChange={e => setF(p => ({ ...p, lugar: e.target.value }))}
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#FFE600'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label style={labelForm}>Artistas (separados por coma)</label>
                    <input
                        type="text"
                        value={f.artistas}
                        onChange={e => setF(p => ({ ...p, artistas: e.target.value }))}
                        placeholder="DJ X, DJ Y, ..."
                        style={inputStyle}
                        onFocus={e => e.target.style.borderColor = '#FFE600'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'stretch' }}>
                <div style={{ width: '220px', flexShrink: 0 }}>
                    <SubidaImagen
                        label="Imagen"
                        value={f.imagen_url}
                        onChange={url => setF(p => ({ ...p, imagen_url: url }))}
                    />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label style={labelForm}>Descripción</label>
                    <textarea
                        value={f.descripcion}
                        onChange={e => setF(p => ({ ...p, descripcion: e.target.value }))}
                        style={{ ...inputStyle, resize: 'none', flex: 1 }}
                        onFocus={e => e.target.style.borderColor = '#FFE600'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                </div>
            </div>
        </div>
    )

    return (
        <div style={{ background: '#0d0d0d', minHeight: '100vh', paddingTop: '80px' }}>

            {/* Cabecera */}
            <div style={{ padding: '3rem 4rem 2.5rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{
                        fontFamily: 'Bebas Neue', fontSize: '3.5rem', letterSpacing: '0.1em',
                        color: '#fff', margin: '0 0 0.25rem', lineHeight: 1
                    }}>
                        Próximos <span style={{ color: '#FFE600' }}>Eventos</span>
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', margin: 0 }}>
                        Todos los eventos y fiestas en los que vamos a estar
                    </p>
                </div>
                {usuario?.rol === 'admin' && (
                    <button
                        onClick={() => { setMostrarForm(!mostrarForm); setError('') }}
                        style={{
                            background: mostrarForm ? 'transparent' : '#FFE600',
                            color: mostrarForm ? 'rgba(255,255,255,0.5)' : '#000',
                            border: mostrarForm ? '1px solid rgba(255,255,255,0.15)' : 'none',
                            padding: '0.75rem 2rem',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            flexShrink: 0
                        }}
                    >
                        {mostrarForm ? 'Cancelar' : 'Añadir evento'}
                    </button>
                )}
            </div>

            {/* Contenido */}
            <div style={{ background: '#111', borderTop: '1px solid rgba(255,230,0,0.15)', padding: '3rem 4rem 6rem' }}>

                {/* Formulario añadir */}
                {mostrarForm && (
                    <div style={{
                        background: '#141414',
                        border: '1px solid rgba(255,230,0,0.2)',
                        padding: '2rem',
                        marginBottom: '2.5rem',
                        maxWidth: '900px'
                    }}>
                        <p style={{
                            fontFamily: 'Bebas Neue', fontSize: '1.3rem', letterSpacing: '0.1em',
                            color: '#FFE600', margin: '0 0 1.5rem'
                        }}>Nuevo evento</p>

                        {formLayout(form, setForm)}

                        {error && (
                            <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '1rem 0 0' }}>{error}</p>
                        )}

                        <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
                            <button
                                onClick={handleGuardar}
                                disabled={guardando}
                                style={{
                                    background: '#FFE600',
                                    color: '#000',
                                    border: 'none',
                                    padding: '0.75rem 2.5rem',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    cursor: guardando ? 'not-allowed' : 'pointer',
                                    opacity: guardando ? 0.6 : 1
                                }}
                            >
                                {guardando ? 'Guardando...' : 'Guardar evento'}
                            </button>
                            <button
                                onClick={() => { setMostrarForm(false); setError('') }}
                                style={{
                                    background: 'transparent',
                                    color: 'rgba(255,255,255,0.4)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '0.75rem 2rem',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {/* Controles */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '2.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Buscar por título, lugar o artista..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        style={{ ...inputStyle, width: '360px' }}
                        onFocus={e => e.target.style.borderColor = '#FFE600'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                    <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {[{ label: 'Todos', value: false }, { label: 'Próximos', value: true }].map(op => (
                            <button
                                key={op.label}
                                onClick={() => setSoloProximos(op.value)}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: soloProximos === op.value ? '#FFE600' : 'transparent',
                                    color: soloProximos === op.value ? '#000' : 'rgba(255,255,255,0.5)',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {op.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Estados */}
                {cargando && (
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Cargando eventos...</p>
                )}
                {!cargando && eventosFiltrados.length === 0 && (
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                        {eventos.length === 0 ? 'Aún no hay eventos publicados.' : 'No se encontraron eventos.'}
                    </p>
                )}

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {eventosFiltrados.map(evento => {
                        const pasado = esPasado(evento.fecha)
                        const isHover = hoverId === evento.id_evento
                        const artistas = evento.artistas
                            ? evento.artistas.split(',').map(a => a.trim()).filter(Boolean)
                            : []
                        const estaEditando = editandoId === evento.id_evento

                        return (
                            <div key={evento.id_evento} style={{ display: 'flex', flexDirection: 'column' }}>
                                <div
                                    onMouseEnter={() => setHoverId(evento.id_evento)}
                                    onMouseLeave={() => setHoverId(null)}
                                    style={{
                                        display: 'flex',
                                        background: '#141414',
                                        border: `1px solid ${estaEditando ? 'rgba(255,230,0,0.3)' : isHover ? 'rgba(255,230,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                        overflow: 'hidden',
                                        opacity: pasado ? 0.6 : 1,
                                        transform: isHover && !estaEditando ? 'translateY(-2px)' : 'translateY(0)',
                                        transition: 'all 0.25s'
                                    }}
                                >
                                    {/* Cartel */}
                                    <div style={{ width: '240px', minWidth: '240px', flexShrink: 0, position: 'relative' }}>
                                        {evento.imagen_url ? (
                                            <img
                                                src={evento.imagen_url}
                                                alt={evento.titulo}
                                                style={{ width: '100%', height: '100%', minHeight: '240px', objectFit: 'cover', display: 'block' }}
                                            />
                                        ) : (
                                            <div style={{
                                                width: '100%', height: '100%', minHeight: '240px',
                                                background: '#1a1a1a',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: 'rgba(255,255,255,0.1)',
                                                fontFamily: 'Bebas Neue', fontSize: '0.9rem', letterSpacing: '0.2em'
                                            }}>
                                                SIN IMAGEN
                                            </div>
                                        )}
                                        <span style={{
                                            position: 'absolute', top: '12px', left: 0,
                                            background: pasado ? 'rgba(0,0,0,0.85)' : '#FFE600',
                                            color: pasado ? 'rgba(255,255,255,0.5)' : '#000',
                                            fontSize: '0.65rem', fontWeight: 700,
                                            padding: '4px 10px', letterSpacing: '0.1em', textTransform: 'uppercase'
                                        }}>
                                            {pasado ? 'Finalizado' : 'Próximo'}
                                        </span>
                                    </div>

                                    {/* Datos */}
                                    <div style={{ padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                                            <h2 style={{
                                                fontFamily: 'Bebas Neue',
                                                fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                                                letterSpacing: '0.06em',
                                                color: '#fff',
                                                margin: 0, lineHeight: 1.1
                                            }}>
                                                {evento.titulo}
                                            </h2>
                                            {usuario?.rol === 'admin' && (
                                                <button
                                                    onClick={() => handleAbrirEdicion(evento)}
                                                    style={{
                                                        background: estaEditando ? 'transparent' : '#FFE600',
                                                        color: estaEditando ? 'rgba(255,255,255,0.4)' : '#000',
                                                        border: estaEditando ? '1px solid rgba(255,255,255,0.15)' : 'none',
                                                        padding: '0.5rem 1.4rem',
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem',
                                                        letterSpacing: '0.1em',
                                                        textTransform: 'uppercase',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    {estaEditando ? 'Cerrar' : 'Editar'}
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
                                            <div>
                                                <p style={labelMeta}>Fecha</p>
                                                <p style={{ fontSize: '0.9rem', color: '#FFE600', fontWeight: 600, margin: '0.2rem 0 0', textTransform: 'capitalize' }}>
                                                    {formatFecha(evento.fecha)}
                                                </p>
                                            </div>
                                            <div>
                                                <p style={labelMeta}>Hora</p>
                                                <p style={{ fontSize: '0.9rem', color: '#FFE600', fontWeight: 600, margin: '0.2rem 0 0' }}>
                                                    {formatHora(evento.fecha)}
                                                </p>
                                            </div>
                                            <div>
                                                <p style={labelMeta}>Lugar</p>
                                                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', margin: '0.2rem 0 0' }}>
                                                    {evento.lugar}
                                                </p>
                                            </div>
                                        </div>

                                        {artistas.length > 0 && (
                                            <div>
                                                <p style={{ ...labelMeta, marginBottom: '0.5rem' }}>Artistas</p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '0.5rem' }}>
                                                    {artistas.map((a, i) => (
                                                        <span key={i} style={{
                                                            background: 'rgba(255,230,0,0.08)',
                                                            border: '1px solid rgba(255,230,0,0.2)',
                                                            color: '#FFE600',
                                                            fontSize: '0.72rem', fontWeight: 700,
                                                            padding: '3px 10px',
                                                            letterSpacing: '0.06em',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {a}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {evento.descripcion && (
                                            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, margin: 0 }}>
                                                {evento.descripcion}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Formulario edición inline */}
                                {estaEditando && (
                                    <div style={{
                                        background: '#141414',
                                        border: '1px solid rgba(255,230,0,0.2)',
                                        borderTop: 'none',
                                        padding: '2rem'
                                    }}>
                                        <p style={{
                                            fontFamily: 'Bebas Neue', fontSize: '1.1rem', letterSpacing: '0.1em',
                                            color: '#FFE600', margin: '0 0 1.5rem'
                                        }}>Editar evento</p>

                                        {formLayout(formEditar, setFormEditar)}

                                        {errorEdicion && (
                                            <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '1rem 0 0' }}>{errorEdicion}</p>
                                        )}

                                        <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
                                            <button
                                                onClick={() => handleGuardarEdicion(evento.id_evento)}
                                                disabled={guardandoEdicion}
                                                style={{
                                                    background: '#FFE600',
                                                    color: '#000',
                                                    border: 'none',
                                                    padding: '0.75rem 2.5rem',
                                                    fontWeight: 700,
                                                    fontSize: '0.8rem',
                                                    letterSpacing: '0.12em',
                                                    textTransform: 'uppercase',
                                                    cursor: guardandoEdicion ? 'not-allowed' : 'pointer',
                                                    opacity: guardandoEdicion ? 0.6 : 1
                                                }}
                                            >
                                                {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
                                            </button>
                                            <button
                                                onClick={() => { setEditandoId(null); setErrorEdicion('') }}
                                                style={{
                                                    background: 'transparent',
                                                    color: 'rgba(255,255,255,0.4)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    padding: '0.75rem 2rem',
                                                    fontWeight: 700,
                                                    fontSize: '0.8rem',
                                                    letterSpacing: '0.12em',
                                                    textTransform: 'uppercase',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}