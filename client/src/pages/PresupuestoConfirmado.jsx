// Página de confirmación de acción sobre presupuesto (aceptado / rechazado / inválido).
// Se muestra tras redirigir desde el enlace de email con token de un solo uso.
// Lee el parámetro ?estado= de la URL y muestra el icono y mensaje correspondiente.
// Si el usuario está autenticado, ofrece un botón para ir a "Mis pedidos".

import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const estados = {
    aceptado: {
        icono: '✓',
        color: '#60c060',
        titulo: 'Presupuesto aceptado',
        mensaje: 'Hemos recibido tu confirmación. Nuestro equipo revisará el presupuesto y te contactará en breve para confirmar todos los detalles.'
    },
    rechazado: {
        icono: '✕',
        color: '#ff4444',
        titulo: 'Presupuesto rechazado',
        mensaje: 'Has rechazado el presupuesto. Si tienes alguna duda o quieres revisar las condiciones, no dudes en contactarnos.'
    },
    invalido: {
        icono: '!',
        color: '#FFE600',
        titulo: 'Enlace no válido',
        mensaje: 'Este enlace ya ha sido utilizado o ha caducado. Si necesitas ayuda, contacta con nosotros directamente.'
    }
}

export default function PresupuestoConfirmado() {
    const [params] = useSearchParams()
    const navigate = useNavigate()
    const { usuario } = useAuth()

    const estado = params.get('estado') || 'invalido'
    const id = params.get('id')
    const info = estados[estado] || estados.invalido

    return (
        <div style={{ background: '#0d0d0d', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>

                <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    border: `2px solid ${info.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 2rem',
                    color: info.color, fontSize: '2rem', fontFamily: 'Bebas Neue',
                    letterSpacing: '0.05em'
                }}>
                    {info.icono}
                </div>

                <h1 style={{
                    fontFamily: 'Bebas Neue', fontSize: '2.8rem', letterSpacing: '0.1em',
                    color: '#fff', margin: '0 0 1rem'
                }}>
                    {info.titulo.split(' ').map((word, i) =>
                        i === info.titulo.split(' ').length - 1
                            ? <span key={i} style={{ color: '#FFE600' }}> {word}</span>
                            : word + ' '
                    )}
                </h1>

                <p style={{
                    color: 'rgba(255,255,255,0.45)', fontSize: '0.95rem',
                    lineHeight: '1.7', margin: '0 0 2.5rem'
                }}>
                    {info.mensaje}
                </p>

                {usuario && id && estado !== 'invalido' && (
                    <button
                        onClick={() => navigate(`/mis-pedidos?presupuesto=${id}`)}
                        style={{
                            background: '#FFE600', border: 'none', color: '#000',
                            fontFamily: 'Bebas Neue', fontSize: '1rem', letterSpacing: '0.12em',
                            padding: '0.75rem 2rem', cursor: 'pointer', transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                        Ver mis pedidos →
                    </button>
                )}

            </div>
        </div>
    )
}