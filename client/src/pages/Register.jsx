import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from '../lib/api'

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
  const [errors, setErrors] = useState({
    nombre: '', 
    email: '', 
    password: '', 
    telefono: '', 
    dni_nie_cif: '', 
    direccion: '', 
    codigo_postal: '', 
    localidad: '', 
    provincia: ''})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors(prev => ({ ...prev, [e.target.name]: '' }))
}

  const validate = () => {
    const e = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const telefonoRegex = /^[6789]\d{8}$/
    const dniNieCifRegex = /^(\d{8}[A-Z]|[XYZ]\d{7}[A-Z]|[A-Z]\d{7}[A-Z0-9])$/i
    const cpRegex = /^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/

    if (!form.nombre.trim() || form.nombre.trim().length < 3)
      e.nombre = 'Introduce un nombre válido (mínimo 3 caracteres)'
    if (!form.email.trim()) e.email = 'El email es obligatorio'
    else if (!emailRegex.test(form.email)) e.email = 'Introduce un email válido'
    if (!form.password) e.password = 'La contraseña es obligatoria'
    else if (form.password.length < 6) e.password = 'Mínimo 6 caracteres'
    if (!form.telefono.trim()) e.telefono = 'El teléfono es obligatorio'
    else if (!telefonoRegex.test(form.telefono.replace(/\s/g, '')))
      e.telefono = 'Teléfono no válido (9 dígitos, empieza por 6, 7, 8 o 9)'
    if (!form.dni_nie_cif.trim()) e.dni_nie_cif = 'El DNI/NIE/CIF es obligatorio'
    else if (!dniNieCifRegex.test(form.dni_nie_cif.trim()))
      e.dni_nie_cif = 'Formato de DNI, NIE o CIF no válido'
    if (!form.direccion.trim() || form.direccion.trim().length < 5)
      e.direccion = 'Introduce una dirección válida'
    if (!form.codigo_postal.trim()) e.codigo_postal = 'Obligatorio'
    else if (!cpRegex.test(form.codigo_postal.trim()))
      e.codigo_postal = 'CP no válido'
    if (!form.localidad.trim() || form.localidad.trim().length < 2)
      e.localidad = 'Introduce una localidad'
    if (!form.provincia) e.provincia = 'Selecciona una provincia'

    setErrors(prev => ({ ...prev, ...e }))
    return Object.keys(e).length === 0
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setError(null)

    const res = await fetch(`${API_URL}/api/auth/register`, {
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
  const getOnBlur = (field) => (e) => {
    e.target.style.borderColor = errors[field] ? '#ff4444' : 'rgba(255,255,255,0.1)'
  }

  const formularioRelleno = Object.values(form).every(v => v.trim() !== '')

  return (
    <div className="auth-outer" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0d0d0d'
    }}>
      <div className="auth-card" style={{
        width: '100%',
        maxWidth: '640px',
        background: '#111',
        border: '1px solid rgba(255,230,0,0.15)',
        boxShadow: '0 0 30px rgba(255,230,0,0.05), 0 0 80px rgba(255,230,0,0.03)'
      }}>

        {/* Logo */}
        <div className="auth-logo" style={{ textAlign: 'center' }}>
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
              style={{ ...inputStyle, border: errors.nombre ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }}
              onFocus={onFocus} onBlur={getOnBlur('nombre')} />
            {errors.nombre && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.nombre}</p>}
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email</label>
            <input type="text" name="email" value={form.email} onChange={handleChange} 
              style={{ ...inputStyle, border: errors.email ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }} 
              onFocus={onFocus} onBlur={getOnBlur('email')} />
            {errors.email && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.email}</p>}
          </div>

          {/* Contraseña */}
          <div>
            <label style={labelStyle}>Contraseña</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} 
              style={{ ...inputStyle, border: errors.password ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }} 
              onFocus={onFocus} onBlur={getOnBlur('password')} />
            {errors.password && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.password}</p>}
          </div>

          {/* Teléfono + DNI en la misma fila */}
          <div className="contacto-grid-2">
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input type="tel" name="telefono" value={form.telefono} onChange={handleChange} 
                style={{ ...inputStyle, border: errors.telefono ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }}
                onFocus={onFocus} onBlur={getOnBlur('telefono')} />
              {errors.telefono && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.telefono}</p>}
            </div>
            <div>
              <label style={labelStyle}>DNI / NIE / CIF</label>
              <input type="text" name="dni_nie_cif" value={form.dni_nie_cif} onChange={handleChange} 
                style={{ ...inputStyle, border: errors.dni_nie_cif ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }}
                onFocus={onFocus} onBlur={getOnBlur('dni_nie_cif')} />
              {errors.dni_nie_cif && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.dni_nie_cif}</p>}
            </div>
          </div>

          {/* Dirección + Código postal */}
          <div className="register-grid-dir">
            <div>
              <label style={labelStyle}>Dirección</label>
              <input type="text" name="direccion" value={form.direccion} onChange={handleChange} 
                style={{ ...inputStyle, border: errors.direccion ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }}
                onFocus={onFocus} onBlur={getOnBlur('direccion')} />
              {errors.direccion && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.direccion}</p>}
            </div>
            <div>
              <label style={labelStyle}>Código postal</label>
              <input type="text" name="codigo_postal" value={form.codigo_postal} onChange={handleChange}
                style={{ ...inputStyle, border: errors.codigo_postal ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }}
                onFocus={onFocus} onBlur={getOnBlur('codigo_postal')} />
              {errors.codigo_postal && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.codigo_postal}</p>}
            </div>
          </div>

          {/* Localidad + Provincia */}
          <div className="contacto-grid-2">
            <div>
              <label style={labelStyle}>Localidad</label>
              <input type="text" name="localidad" value={form.localidad} onChange={handleChange} 
                style={{ ...inputStyle, border: errors.localidad ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }}
                onFocus={onFocus} onBlur={getOnBlur('localidad')} />
              {errors.localidad && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.localidad}</p>}
            </div>
            <div>
              <label style={labelStyle}>Provincia</label>
              <select name="provincia" value={form.provincia} onChange={handleChange}
                style={{ ...inputStyle, cursor: 'pointer', border: errors.provincia ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }}
                onFocus={onFocus} onBlur={getOnBlur('provincia')}>
                <option value="" disabled style={{ background: '#141414' }}>Selecciona...</option>
                {provincias.map(p => (
                  <option key={p} value={p} style={{ background: '#141414' }}>{p}</option>
                ))}
              </select>
              {errors.provincia && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.provincia}</p>}
            </div>
          </div>

          {error && (
            <p style={{ color: '#ff4444', fontSize: '0.85rem' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !formularioRelleno}
            style={{
              background: '#FFE600',
              color: '#000',
              fontFamily: 'Bebas Neue',
              fontSize: '1.1rem',
              letterSpacing: '0.15em',
              padding: '0.85rem',
              border: 'none',
              cursor: (loading || !formularioRelleno) ? 'not-allowed' : 'pointer',
              opacity: (loading || !formularioRelleno) ? 0.5 : 1,
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
