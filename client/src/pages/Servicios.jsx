import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../contexts/CarritoContext'

export default function Servicios() {
  const [equipos, setEquipos] = useState([])
  const [djs, setDjs] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('todo')
  const [precioActivo, setPrecioActivo] = useState('todo')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [ocupados, setOcupados] = useState({ equipos_ocupados: [], djs_ocupados: [] })
  const [itemSeleccionado, setItemSeleccionado] = useState(null)
  const [dropdownPrecio, setDropdownPrecio] = useState(false)
  const [dropdownFecha, setDropdownFecha] = useState(false)
  const [notificacion, setNotificacion] = useState(null)
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { añadir, items } = useCarrito()

  useEffect(() => {
    Promise.all([
      fetch('/api/equipos').then(r => r.json()),
      fetch('/api/djs').then(r => r.json())
    ])
      .then(([equiposData, djsData]) => {
        if (equiposData.ok) setEquipos(equiposData.result)
        if (djsData.ok) setDjs(djsData.result)
      })
      .catch(() => setError('Error al cargar los servicios'))
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    if (!fechaInicio || !fechaFin) {
      setOcupados({ equipos_ocupados: [], djs_ocupados: [] })
      return
    }
    if (new Date(fechaFin) <= new Date(fechaInicio)) return

    fetch(`/api/disponibilidad?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setOcupados({ equipos_ocupados: data.equipos_ocupados, djs_ocupados: data.djs_ocupados })
      })
      .catch(() => {})
  }, [fechaInicio, fechaFin])

  const categorias = [
    { id: 'todo', label: 'Todo' },
    { id: 'dj', label: 'DJs' },
    { id: 'orquesta', label: 'Orquestas' },
    { id: 'grupo', label: 'Grupos' },
    { id: 'sonido', label: 'Sonido' },
    { id: 'iluminacion', label: 'Iluminación' },
    { id: 'microfonia', label: 'Microfonía' },
    { id: 'mezclas', label: 'Mezclas' },
    { id: 'efectos', label: 'Efectos' },
    { id: 'pantallas', label: 'Pantallas' },
  ]

  const rangosPrecios = [
    { id: 'todo', label: 'Cualquier precio', min: 0, max: Infinity },
    { id: 'menos50', label: 'Menos de 50€', min: 0, max: 50 },
    { id: '50-100', label: '50€ - 100€', min: 50, max: 100 },
    { id: '100-200', label: '100€ - 200€', min: 100, max: 200 },
    { id: '200-350', label: '200€ - 350€', min: 200, max: 350 },
    { id: 'mas350', label: 'Más de 350€', min: 350, max: Infinity },
  ]

  const todos = [
    ...djs.map(d => ({ ...d, tabla: 'dj', precio: d.precio_hora, precioLabel: '€/hora' })),
    ...equipos.map(e => ({ ...e, tabla: 'equipo', precio: e.precio_alquiler_hora, precioLabel: '€/hora' }))
  ]

  const rangoSeleccionado = rangosPrecios.find(r => r.id === precioActivo)

  const filtrados = todos.filter(item => {
    const coincideBusqueda = item.nombre.toLowerCase().includes(busqueda.toLowerCase())
    const coincideCategoria =
      categoriaActiva === 'todo' ||
      (categoriaActiva === 'dj' && item.tabla === 'dj' && item.tipo === 'dj') ||
      (categoriaActiva === 'orquesta' && item.tipo === 'orquesta') ||
      (categoriaActiva === 'grupo' && item.tipo === 'grupo') ||
      (item.tabla === 'equipo' && item.categoria === categoriaActiva)
    const coincidePrecio = item.precio >= rangoSeleccionado.min && item.precio <= rangoSeleccionado.max
    const coincideDisponibilidad = item.tabla === 'dj'
      ? !ocupados.djs_ocupados.includes(item.id_dj)
      : !ocupados.equipos_ocupados.includes(item.id_equipo)
    return coincideBusqueda && coincideCategoria && coincidePrecio && coincideDisponibilidad
  })

  const estaEnCarrito = (item) => {
    const id = item.tabla === 'dj' ? item.id_dj : item.id_equipo
    return items.some(i => i._id === id && i.tabla === item.tabla)
  }

  const handleCarrito = (item) => {
    if (!usuario) {
      navigate('/login')
      return
    }
    añadir(item)
    setNotificacion(item.nombre)
    setTimeout(() => setNotificacion(null), 2500)
  }

  const precioLabel = rangosPrecios.find(r => r.id === precioActivo)?.label
  const fechaActiva = fechaInicio && fechaFin

  const quitarFecha = () => {
    setFechaInicio('')
    setFechaFin('')
    setDropdownFecha(false)
    setOcupados({ equipos_ocupados: [], djs_ocupados: [] })
  }

  const getBadgeLabel = (item) => {
    if (item.tabla === 'equipo') return item.categoria || 'Equipo'
    if (item.tipo === 'orquesta') return 'Orquesta'
    if (item.tipo === 'grupo') return 'Grupo'
    return 'DJ'
  }

  const getBadgeStyle = (item) => {
    if (item.tabla === 'dj') return { background: '#FFE600', color: '#000', border: 'none' }
    return { background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)' }
  }

  if (cargando) return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Bebas Neue', fontSize: '1.5rem', letterSpacing: '0.1em' }}>Cargando servicios...</p>
    </div>
  )

  if (error) return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#ff4444' }}>{error}</p>
    </div>
  )

  return (
    <div style={{ background: '#0d0d0d', minHeight: '100vh', paddingTop: '80px' }}>

      {/* Notificación */}
      {notificacion && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          background: '#1c1c1c', border: '1px solid rgba(255,230,0,0.4)',
          boxShadow: '0 0 30px rgba(255,230,0,0.1)', padding: '1rem 1.5rem',
          zIndex: 200, display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span style={{ color: '#FFE600', fontSize: '1.2rem' }}>✓</span>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>Añadido al carrito</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: 0 }}>{notificacion}</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {itemSeleccionado && (
        <div
          onClick={() => setItemSeleccionado(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
            zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem', backdropFilter: 'blur(4px)',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{
            background: '#1c1c1c', border: '1px solid rgba(255,230,0,0.2)',
            boxShadow: '0 0 60px rgba(255,230,0,0.08)', maxWidth: '520px', width: '100%',
          }}>
            <div style={{ width: '100%', aspectRatio: '16/9', background: '#242424', overflow: 'hidden', position: 'relative' }}>
              {itemSeleccionado.imagen_url ? (
                <img src={itemSeleccionado.imagen_url} alt={itemSeleccionado.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>SIN IMAGEN</span>
                </div>
              )}
              <span style={{
                position: 'absolute', top: '0.6rem', left: '0.6rem',
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '0.2rem 0.5rem', ...getBadgeStyle(itemSeleccionado)
              }}>
                {getBadgeLabel(itemSeleccionado)}
              </span>
              <button
                onClick={() => setItemSeleccionado(null)}
                style={{
                  position: 'absolute', top: '0.6rem', right: '0.6rem',
                  background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.7)', width: '28px', height: '28px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: '1rem', lineHeight: 1,
                }}
              >×</button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ color: '#fff', fontFamily: 'Bebas Neue', fontSize: '1.8rem', letterSpacing: '0.08em', margin: 0 }}>
                {itemSeleccionado.nombre}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {itemSeleccionado.descripcion || 'Sin descripción'}
              </p>
              {itemSeleccionado.tabla === 'equipo' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Stock disponible:</span>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{itemSeleccionado.stock_total}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <div>
                  <span style={{ color: '#FFE600', fontFamily: 'Bebas Neue', fontSize: '2rem', letterSpacing: '0.05em' }}>{itemSeleccionado.precio}€</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginLeft: '0.4rem' }}>{itemSeleccionado.precioLabel}</span>
                </div>
                <button
                  onClick={() => { if (!estaEnCarrito(itemSeleccionado)) { handleCarrito(itemSeleccionado); setItemSeleccionado(null) } }}
                  style={{
                    background: estaEnCarrito(itemSeleccionado) ? 'transparent' : '#FFE600',
                    border: `1px solid ${estaEnCarrito(itemSeleccionado) ? 'rgba(255,230,0,0.3)' : '#FFE600'}`,
                    color: estaEnCarrito(itemSeleccionado) ? 'rgba(255,230,0,0.4)' : '#000',
                    padding: '0.7rem 1.5rem', fontSize: '0.8rem', fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    cursor: estaEnCarrito(itemSeleccionado) ? 'default' : 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!estaEnCarrito(itemSeleccionado)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FFE600' } }}
                  onMouseLeave={e => { if (!estaEnCarrito(itemSeleccionado)) { e.currentTarget.style.background = '#FFE600'; e.currentTarget.style.color = '#000' } }}
                >
                  {estaEnCarrito(itemSeleccionado) ? '✓ En carrito' : '+ Añadir al carrito'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cabecera */}
      <div style={{ padding: '3rem 4rem 2.5rem' }}>
        <h1 style={{ fontFamily: 'Bebas Neue', fontSize: '3.5rem', letterSpacing: '0.1em', color: '#fff', marginBottom: '0.25rem' }}>
          Nuestros <span style={{ color: '#FFE600' }}>Servicios</span>
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>
          Equipos de sonido, iluminación, DJs profesionales y mucho más
        </p>
      </div>

      {/* Zona filtros + tarjetas */}
      <div style={{ background: '#111', borderTop: '1px solid rgba(255,230,0,0.15)' }}>
        <div style={{ padding: '2rem 4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '2rem' }}>
            <input
              type="text"
              placeholder="Buscar equipos, DJs, altavoces..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              style={{
                background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', padding: '0.6rem 1.25rem', fontSize: '0.85rem',
                outline: 'none', flex: 1, maxWidth: '750px', transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#FFE600'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>

              <div style={{ position: 'relative' }} onMouseEnter={() => setDropdownPrecio(true)} onMouseLeave={() => setDropdownPrecio(false)}>
                <button style={{
                  background: '#0d0d0d',
                  border: `1px solid ${precioActivo !== 'todo' ? '#FFE600' : 'rgba(255,255,255,0.15)'}`,
                  color: precioActivo !== 'todo' ? '#FFE600' : 'rgba(255,255,255,0.5)',
                  padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 600,
                  letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  whiteSpace: 'nowrap', transition: 'all 0.2s',
                }}>
                  {precioLabel}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {dropdownPrecio && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, zIndex: 50,
                    background: '#1a1a1a', border: '1px solid rgba(255,230,0,0.15)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)', minWidth: '180px',
                  }}>
                    {rangosPrecios.map(r => (
                      <button
                        key={r.id}
                        onClick={() => { setPrecioActivo(r.id); setDropdownPrecio(false) }}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left',
                          padding: '0.7rem 1rem', fontSize: '0.8rem', fontWeight: 600,
                          letterSpacing: '0.05em', background: 'transparent', border: 'none',
                          color: precioActivo === r.id ? '#FFE600' : 'rgba(255,255,255,0.6)',
                          cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)',
                          transition: 'color 0.2s, background 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#FFE600'; e.currentTarget.style.background = 'rgba(255,230,0,0.04)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = precioActivo === r.id ? '#FFE600' : 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'transparent' }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ position: 'relative' }} onMouseEnter={() => setDropdownFecha(true)} onMouseLeave={() => setDropdownFecha(false)}>
                <button style={{
                  background: '#0d0d0d',
                  border: `1px solid ${fechaActiva ? '#FFE600' : 'rgba(255,255,255,0.15)'}`,
                  color: fechaActiva ? '#FFE600' : 'rgba(255,255,255,0.5)',
                  padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 600,
                  letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                  whiteSpace: 'nowrap', transition: 'all 0.2s',
                }}>
                  {fechaActiva ? 'Fechas activas' : 'Disponibilidad'}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {dropdownFecha && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, zIndex: 50,
                    background: '#1a1a1a', border: '1px solid rgba(255,230,0,0.15)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)', padding: '1rem',
                    minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '0.75rem'
                  }}>
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 0.4rem' }}>Fecha y hora de inicio</p>
                      <input
                        type="datetime-local"
                        value={fechaInicio}
                        onChange={e => setFechaInicio(e.target.value)}
                        style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.5rem 0.75rem', fontSize: '0.85rem', outline: 'none', width: '100%', colorScheme: 'dark' }}
                        onFocus={e => e.target.style.borderColor = '#FFE600'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 0.4rem' }}>Fecha y hora de fin</p>
                      <input
                        type="datetime-local"
                        value={fechaFin}
                        min={fechaInicio}
                        onChange={e => setFechaFin(e.target.value)}
                        style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.5rem 0.75rem', fontSize: '0.85rem', outline: 'none', width: '100%', colorScheme: 'dark' }}
                        onFocus={e => e.target.style.borderColor = '#FFE600'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    </div>
                    {fechaActiva && (
                      <button
                        onClick={quitarFecha}
                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.75rem', padding: 0, textAlign: 'left', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                      >
                        ✕ Quitar fechas
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {categorias.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat.id)}
                style={{
                  background: categoriaActiva === cat.id ? '#FFE600' : 'transparent',
                  color: categoriaActiva === cat.id ? '#000' : 'rgba(255,255,255,0.5)',
                  border: `1px solid ${categoriaActiva === cat.id ? '#FFE600' : 'rgba(255,255,255,0.15)'}`,
                  padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 600,
                  letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (categoriaActiva !== cat.id) { e.currentTarget.style.borderColor = '#FFE600'; e.currentTarget.style.color = '#FFE600' } }}
                onMouseLeave={e => { if (categoriaActiva !== cat.id) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' } }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 4rem', marginBottom: '1.5rem' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
            {filtrados.length} {filtrados.length === 1 ? 'servicio' : 'servicios'} disponibles
            {fechaActiva && <span style={{ color: 'rgba(255,230,0,0.5)', marginLeft: '0.5rem' }}>— filtrando por disponibilidad</span>}
          </p>
        </div>

        <div style={{ padding: '0 4rem 6rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
          {filtrados.map(item => (
            <div
              key={`${item.tabla}-${item.tabla === 'dj' ? item.id_dj : item.id_equipo}`}
              style={{
                background: '#1c1c1c',
                border: '1px solid rgba(255,230,0,0.15)',
                boxShadow: '0 0 15px rgba(255,230,0,0.05)',
                display: 'flex', flexDirection: 'column',
                transition: 'border-color 0.3s, box-shadow 0.3s', cursor: 'default',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,230,0,0.5)'; e.currentTarget.style.boxShadow = '0 0 25px rgba(255,230,0,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,230,0,0.15)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(255,230,0,0.05)' }}
            >
              <div style={{ width: '100%', aspectRatio: '16/9', background: '#242424', overflow: 'hidden', position: 'relative' }}>
                {item.imagen_url ? (
                  <img src={item.imagen_url} alt={item.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.75rem', letterSpacing: '0.1em' }}>SIN IMAGEN</span>
                  </div>
                )}
                <span style={{
                  position: 'absolute', top: '0.6rem', left: '0.6rem',
                  fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '0.2rem 0.5rem', ...getBadgeStyle(item)
                }}>
                  {getBadgeLabel(item)}
                </span>
              </div>

              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <h3 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.03em', margin: 0 }}>
                  {item.nombre}
                </h3>
                <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                  <span style={{ color: '#FFE600', fontFamily: 'Bebas Neue', fontSize: '1.6rem', letterSpacing: '0.05em' }}>
                    {item.precio}€
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginLeft: '0.3rem' }}>
                    {item.precioLabel}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => setItemSeleccionado(item)}
                    style={{
                      flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                      color: 'rgba(255,255,255,0.7)', padding: '0.65rem', fontSize: '0.8rem',
                      fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#FFE600'; e.currentTarget.style.color = '#FFE600' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => !estaEnCarrito(item) && handleCarrito(item)}
                    style={{
                      flex: 1,
                      background: estaEnCarrito(item) ? 'transparent' : '#FFE600',
                      border: `1px solid ${estaEnCarrito(item) ? 'rgba(255,230,0,0.3)' : '#FFE600'}`,
                      color: estaEnCarrito(item) ? 'rgba(255,230,0,0.4)' : '#000',
                      padding: '0.65rem', fontSize: '0.8rem', fontWeight: 700,
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                      cursor: estaEnCarrito(item) ? 'default' : 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { if (!estaEnCarrito(item)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#FFE600' } }}
                    onMouseLeave={e => { if (!estaEnCarrito(item)) { e.currentTarget.style.background = '#FFE600'; e.currentTarget.style.color = '#000' } }}
                  >
                    {estaEnCarrito(item) ? '✓ En carrito' : '+ Carrito'}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filtrados.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 0' }}>
              <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.9rem' }}>No se encontraron resultados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}