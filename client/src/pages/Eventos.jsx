import { useState, useEffect, useMemo } from 'react'

export default function Eventos() {
    const [eventos, setEventos] = useState([])
    const [cargando, setCargando] = useState(true)
    const [busqueda, setBusqueda] = useState('')
    const [soloProximos, setSoloProximos] = useState(false)
    const [hoverId, setHoverId] = useState(null)

    useEffect(() => {
        fetch('/api/eventos')
            .then(r => r.json())
            .then(data => { if (data.ok) setEventos(data.result) })
            .finally(() => setCargando(false))
    }, [])

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

    const inputStyle = {
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff',
        padding: '0.75rem 1rem',
        fontSize: '0.9rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box'
    }

    const labelMeta = {
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.3)',
        margin: 0
    }

    return (
        <div style={{ background: '#0d0d0d', minHeight: '100vh', paddingTop: '80px' }}>

            {/* Cabecera */}
            <div style={{ padding: '3rem 4rem 2.5rem' }}>
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

            {/* Contenido */}
            <div style={{ background: '#111', borderTop: '1px solid rgba(255,230,0,0.15)', padding: '3rem 4rem 6rem' }}>

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

                        return (
                            <div
                                key={evento.id_evento}
                                onMouseEnter={() => setHoverId(evento.id_evento)}
                                onMouseLeave={() => setHoverId(null)}
                                style={{
                                    display: 'flex',
                                    background: '#141414',
                                    border: `1px solid ${isHover ? 'rgba(255,230,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                    overflow: 'hidden',
                                    opacity: pasado ? 0.6 : 1,
                                    transform: isHover ? 'translateY(-2px)' : 'translateY(0)',
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
                                <div style={{ padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
                                    <h2 style={{
                                        fontFamily: 'Bebas Neue',
                                        fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                                        letterSpacing: '0.06em',
                                        color: '#fff',
                                        margin: 0, lineHeight: 1.1
                                    }}>
                                        {evento.titulo}
                                    </h2>

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
                        )
                    })}
                </div>
            </div>
        </div>
    )
}