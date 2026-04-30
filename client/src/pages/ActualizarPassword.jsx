import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ActualizarPassword() {
    const [password, setPassword] = useState('')
    const [confirmar, setConfirmar] = useState('')
    const [cargando, setCargando] = useState(false)
    const [mensaje, setMensaje] = useState(null)
    const [error, setError] = useState(null)
    const [errors, setErrors] = useState({ password: '', confirmar: '' })
    const [sesionLista, setSesionLista] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setSesionLista(true)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
                setSesionLista(true)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const validate = () => {
        const e = {}
        if (!password) e.password = 'La contraseña es obligatoria'
        else if (password.length < 6) e.password = 'Mínimo 6 caracteres'
        if (!confirmar) e.confirmar = 'Confirma la contraseña'
        else if (password !== confirmar) e.confirmar = 'Las contraseñas no coinciden'
        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setError(null)
        if (!validate()) return

        setCargando(true)

        supabase.auth.updateUser({ password })
            .then(({ error }) => {
                if (error) {
                    setError(error.message)
                } else {
                    setMensaje('Contraseña actualizada correctamente')
                    setTimeout(() => navigate('/'), 2000)
                }
            })
            .finally(() => setCargando(false))
    }

    const inputStyle = {
        background: '#141414',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff',
        padding: '0.75rem 1rem',
        fontSize: '0.9rem',
        outline: 'none',
        width: '100%',
        transition: 'border-color 0.2s',
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

    const puedeEnviar = password !== '' && confirmar !== ''

    return (
        <div style={{
            background: '#0d0d0d',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>

                <h1 style={{
                    fontFamily: 'Bebas Neue',
                    fontSize: '2.5rem',
                    letterSpacing: '0.1em',
                    color: '#fff',
                    marginBottom: '0.25rem',
                    textAlign: 'center'
                }}>
                    Nueva <span style={{ color: '#FFE600' }}>contraseña</span>
                </h1>
                <p style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: '0.9rem',
                    textAlign: 'center',
                    marginBottom: '2rem'
                }}>
                    Elige una contraseña segura
                </p>

                {!sesionLista ? (
                    <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: '0.9rem' }}>
                        Verificando enlace...
                    </p>
                ) : mensaje ? (
                    <div style={{
                        background: 'rgba(255,230,0,0.05)',
                        border: '1px solid rgba(255,230,0,0.3)',
                        padding: '2rem',
                        textAlign: 'center'
                    }}>
                        <p style={{ color: '#FFE600', fontFamily: 'Bebas Neue', fontSize: '1.3rem', letterSpacing: '0.1em', margin: '0 0 0.5rem' }}>
                            ¡Contraseña actualizada!
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>
                            Redirigiendo...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        <div>
                            <label style={labelStyle}>Nueva contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })) }}
                                style={{ ...inputStyle, border: errors.password ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }} 
                                onFocus={e => e.target.style.borderColor = '#FFE600'}
                                onBlur={e => e.target.style.borderColor = errors.password ? '#ff4444' : 'rgba(255,255,255,0.1)'}
                            />
                            {errors.password && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.password}</p>}
                        </div>

                        <div>
                            <label style={labelStyle}>Confirmar contraseña</label>
                            <input
                                type="password"
                                value={confirmar}
                                onChange={e => { setConfirmar(e.target.value); setErrors(prev => ({ ...prev, confirmar: '' })) }}
                                style={{ ...inputStyle, border: errors.confirmar ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }} 
                                onFocus={e => e.target.style.borderColor = '#FFE600'}
                                onBlur={e => e.target.style.borderColor = errors.confirmar ? '#ff4444' : 'rgba(255,255,255,0.1)'}
                            />
                            {errors.confirmar && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.confirmar}</p>}
                        </div>

                        {error && (
                            <p style={{ color: '#ff4444', fontSize: '0.85rem' }}>{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={cargando || !puedeEnviar}
                            style={{
                                background: '#FFE600',
                                border: 'none',
                                color: '#000',
                                fontFamily: 'Bebas Neue',
                                fontSize: '1.1rem',
                                letterSpacing: '0.15em',
                                padding: '0.85rem 2rem',
                                cursor: (cargando || !puedeEnviar) ? 'not-allowed' : 'pointer',
                                opacity: (cargando || !puedeEnviar) ? 0.5 : 1,
                                transition: 'transform 0.2s',
                            }}
                            onMouseEnter={e => { if (!cargando) e.currentTarget.style.transform = 'translateY(-2px)' }}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            {cargando ? 'Guardando...' : 'Guardar contraseña'}
                        </button>

                    </form>
                )}
            </div>
        </div>
    )
}