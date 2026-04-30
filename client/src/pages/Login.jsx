import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login, errorOAuth } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validate = () => {
    const newErrors = { email: '', password: '' }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) newErrors.email = 'El email es obligatorio'
    else if (!emailRegex.test(email)) newErrors.email = 'El email no es válido'
    if (!password) newErrors.password = 'La contraseña es obligatoria'
    else if (password.length < 6) newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    setErrors(newErrors)
    return !newErrors.email && !newErrors.password
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (!data.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    await login(data.result.session.access_token)
    navigate('/')
  }

  const handleOAuth = async (provider) => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin }
    })
  }

  const puedeEnviar = email.trim() !== '' && password !== ''

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 2rem 2rem',
      background: '#0d0d0d'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: '#111',
        boxShadow: '0 0 30px rgba(255,230,0,0.05), 0 0 80px rgba(255,230,0,0.03)',
        padding: '2.5rem',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'Bebas Neue',
              fontSize: '2rem',
              letterSpacing: '0.15em',
              color: '#FFE600',
              textShadow: '0 0 1px #FFE600, 0 0 8px #FFE600, 0 0 20px rgba(255,230,0,0.5)'
            }}>POWER PLAY</span>
          </Link>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Inicia sesión en tu cuenta
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange = {e => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' }))}}
              style={{
                background: '#141414',
                border: errors.email ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '0.75rem 1rem',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#FFE600'}
              onBlur={e => e.target.style.borderColor = errors.email ? '#ff4444' : 'rgba(255,255,255,0.1)'}
            />
            {errors.email && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.email}</p>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })) }}
              style={{
                background: '#141414',
                border: errors.password ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '0.75rem 1rem',
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#FFE600'}
              onBlur={e => e.target.style.borderColor = errors.password ? '#ff4444' : 'rgba(255,255,255,0.1)'}
            />
            {errors.password && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.password}</p>}
          </div>

          {error && (
            <p style={{ color: '#ff4444', fontSize: '0.85rem' }}>{error}</p>
          )}

          {errorOAuth && (
            <p style={{ color: '#ff4444', fontSize: '0.85rem', textAlign: 'center' }}>
              {errorOAuth}{' '}
              <Link to="/register" style={{ color: '#FFE600', fontWeight: 600 }}>
                Regístrate aquí
              </Link>
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !puedeEnviar}
            style={{
              background: '#FFE600',
              color: '#000',
              fontFamily: 'Bebas Neue',
              fontSize: '1.1rem',
              letterSpacing: '0.15em',
              padding: '0.85rem',
              border: 'none',
              cursor: (loading || !puedeEnviar) ? 'not-allowed' : 'pointer',
              opacity: (loading || !puedeEnviar) ? 0.5 : 1,
              transition: 'transform 0.2s, box-shadow 0.2s',
              marginTop: '0.5rem',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        {/* Divisor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>O continúa con</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* OAuth */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={() => handleOAuth('google')}
            style={{
              background: '#141414',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '0.75rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <button
            onClick={() => handleOAuth('github')}
            style={{
              background: '#141414',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              padding: '0.75rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            Continuar con GitHub
          </button>
        </div>

        {/* Registro */}
        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" style={{ color: '#FFE600', textDecoration: 'none', fontWeight: 600 }}>
            Regístrate
          </Link>
        </p>

      </div>
    </div>
  )
}
