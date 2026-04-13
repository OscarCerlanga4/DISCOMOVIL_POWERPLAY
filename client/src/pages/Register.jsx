import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const provincias = [
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila',
  'Badajoz', 'Baleares', 'Barcelona', 'Burgos', 'Cáceres', 'Cádiz',
  'Cantabria', 'Castellón', 'Ceuta', 'Ciudad Real', 'Córdoba', 'Cuenca',
  'Gerona', 'Granada', 'Guadalajara', 'Guipúzcoa', 'Huelva', 'Huesca',
  'Jaén', 'La Coruña', 'La Rioja', 'Las Palmas', 'León', 'Lérida',
  'Lugo', 'Madrid', 'Málaga', 'Melilla', 'Murcia', 'Navarra', 'Ourense',
  'Palencia', 'Pontevedra', 'Salamanca', 'Santa Cruz de Tenerife',
  'Segovia', 'Sevilla', 'Soria', 'Tarragona', 'Teruel', 'Toledo',
  'Valencia', 'Valladolid', 'Vizcaya', 'Zamora', 'Zaragoza'
]

const inputStyle = {
  background: '#141414',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff',
  padding: '0.75rem 1rem',
  fontSize: '0.9rem',
  outline: 'none',
  transition: 'border-color 0.2s',
  width: '100%',
}

const labelStyle = {
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.5)',
  marginBottom: '0.4rem',
  display: 'block',
}

export default function Register() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    dni_nie_cif: '',
    direccion: '',
    codigo_postal: '',
    localidad: '',
    provincia: '',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    const data = await res.json()

    if (!data.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    navigate('/login')
  }

  const onFocus = (e) => e.target.style.borderColor = '#FFE600'
  const onBlur = (e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'

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
        maxWidth: '640px',
        background: '#111',
        border: '1px solid rgba(255,230,0,0.15)',
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
            Crea tu cuenta
          </p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Nombre */}
          <div>
            <label style={labelStyle}>Nombre completo / Razón social</label>
            <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
              required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>

          {/* Contraseña */}
          <div>
            <label style={labelStyle}>Contraseña</label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>

          {/* Teléfono + DNI en la misma fila */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input type="tel" name="telefono" value={form.telefono} onChange={handleChange}
                required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label style={labelStyle}>DNI / NIE / CIF</label>
              <input type="text" name="dni_nie_cif" value={form.dni_nie_cif} onChange={handleChange}
                required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>

          {/* Dirección + Código postal */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Dirección</label>
              <input type="text" name="direccion" value={form.direccion} onChange={handleChange}
                required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label style={labelStyle}>Código postal</label>
              <input type="text" name="codigo_postal" value={form.codigo_postal} onChange={handleChange}
                required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
          </div>

          {/* Localidad + Provincia */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Localidad</label>
              <input type="text" name="localidad" value={form.localidad} onChange={handleChange}
                required style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div>
              <label style={labelStyle}>Provincia</label>
              <select name="provincia" value={form.provincia} onChange={handleChange}
                required style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={onFocus} onBlur={onBlur}>
                <option value="" disabled style={{ background: '#141414' }}>Selecciona...</option>
                {provincias.map(p => (
                  <option key={p} value={p} style={{ background: '#141414' }}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p style={{ color: '#ff4444', fontSize: '0.85rem' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#FFE600',
              color: '#000',
              fontFamily: 'Bebas Neue',
              fontSize: '1.1rem',
              letterSpacing: '0.15em',
              padding: '0.85rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              marginTop: '0.5rem',
            }}
          >
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color: '#FFE600', textDecoration: 'none', fontWeight: 600 }}>
            Inicia sesión
          </Link>
        </p>

      </div>
    </div>
  )
}
