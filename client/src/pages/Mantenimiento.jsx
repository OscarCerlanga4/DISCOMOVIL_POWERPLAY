// Página de mantenimiento. Se muestra cuando el sitio está temporalmente fuera de servicio.
// Incluye un indicador de estado con animación de pulso (CSS keyframes inline).

export default function Mantenimiento() {
    return (
        <div style={{
            background: '#0d0d0d', minHeight: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'sans-serif', padding: '2rem'
        }}>
            <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '4px', background: '#FFE600', margin: '0 auto 2.5rem' }} />
                <p style={{
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.3em',
                    textTransform: 'uppercase', color: 'rgba(255,230,0,0.6)', margin: '0 0 1rem'
                }}>
                    Mantenimiento
                </p>
                <h1 style={{
                    fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(3rem, 8vw, 5rem)',
                    letterSpacing: '0.06em', color: '#fff', margin: '0 0 1.5rem', lineHeight: 1
                }}>
                    Volvemos enseguida
                </h1>
                <p style={{
                    color: 'rgba(255,255,255,0.35)', fontSize: '0.95rem',
                    lineHeight: 1.7, margin: '0 0 3rem'
                }}>
                    Estamos realizando tareas de mantenimiento para mejorar el servicio.
                    En breve estaremos de vuelta.
                </p>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                    background: 'rgba(255,230,0,0.06)', border: '1px solid rgba(255,230,0,0.15)',
                    padding: '0.75rem 1.5rem'
                }}>
                    <span style={{
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: '#FFE600', display: 'inline-block',
                        animation: 'pulse 1.5s ease-in-out infinite'
                    }} />
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                        En mantenimiento
                    </span>
                </div>
                <style>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.2; }
                    }
                `}</style>
            </div>
        </div>
    )
}