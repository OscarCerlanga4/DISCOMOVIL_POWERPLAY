import { useState } from 'react'

export default function Contacto() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    titulo_problema: '',
    tipo_contacto: '',
    descripcion: ''
  })
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/contactos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })

    const data = await res.json()

    if (!data.ok) {
      setError('Ha ocurrido un error. Inténtalo de nuevo.')
      setLoading(false)
      return
    }

    setExito(true)
    setLoading(false)
    setForm({ nombre: '', email: '', titulo_problema: '', tipo_contacto: '', descripcion: '' })
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

  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh', paddingTop: '80px' }}>

      {/* Cabecera */}
      <div style={{ padding: '3rem 4rem 2.5rem' }}>
        <h1 style={{
          fontFamily: 'Bebas Neue',
          fontSize: '3.5rem',
          letterSpacing: '0.1em',
          color: '#fff',
          marginBottom: '0.25rem'
        }}>
          Contacta <span style={{ color: '#FFE600' }}>con nosotros</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>
          Rellena el formulario y te responderemos lo antes posible
        </p>
      </div>

      {/* Formulario */}
      <div style={{ background: '#111', borderTop: '1px solid rgba(255,230,0,0.15)', padding: '3rem 4rem 6rem' }}>
        <div style={{ maxWidth: '640px' }}>

          {exito ? (
            <div style={{
              background: 'rgba(255,230,0,0.05)',
              border: '1px solid rgba(255,230,0,0.3)',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <p style={{ color: '#FFE600', fontFamily: 'Bebas Neue', fontSize: '1.5rem', letterSpacing: '0.1em', margin: '0 0 0.5rem' }}>
                ¡Mensaje enviado!
              </p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
                Hemos recibido tu mensaje y te responderemos pronto.
              </p>
              <button
                onClick={() => setExito(false)}
                style={{
                  background: '#FFE600', border: 'none', color: '#000',
                  padding: '0.7rem 2rem', fontFamily: 'Bebas Neue',
                  fontSize: '1rem', letterSpacing: '0.1em', cursor: 'pointer'
                }}
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Nombre + Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#FFE600'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#FFE600'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>

              {/* Título + Tipo */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Título</label>
                  <input
                    type="text"
                    name="titulo_problema"
                    value={form.titulo_problema}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#FFE600'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tipo</label>
                  <select
                    name="tipo_contacto"
                    value={form.tipo_contacto}
                    onChange={handleChange}
                    required
                    style={{
                      ...inputStyle,
                      colorScheme: 'dark',
                      color: form.tipo_contacto ? '#fff' : 'rgba(255,255,255,0.3)'
                    }}
                    onFocus={e => e.target.style.borderColor = '#FFE600'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  >
                    <option value="" disabled>Selecciona</option>
                    <option value="duda">Duda</option>
                    <option value="incidencia">Incidencia</option>
                    <option value="opinion">Opinión</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label style={labelStyle}>Descripción</label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  required
                  rows={6}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onFocus={e => e.target.style.borderColor = '#FFE600'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {error && (
                <p style={{ color: '#ff4444', fontSize: '0.85rem' }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: '#FFE600',
                  border: 'none',
                  color: '#000',
                  fontFamily: 'Bebas Neue',
                  fontSize: '1.1rem',
                  letterSpacing: '0.15em',
                  padding: '0.85rem 2rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'transform 0.2s',
                  alignSelf: 'flex-start',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {loading ? 'Enviando...' : 'Enviar mensaje'}
              </button>

            </form>
          )}
        </div>
      </div>

    </div>
  )
}
