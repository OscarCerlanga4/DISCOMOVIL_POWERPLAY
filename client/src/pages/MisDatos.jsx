import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { API_URL } from '../lib/api'

export default function MisDatos() {
    const { usuario, login } = useAuth()

    const [form, setForm] = useState({
        nombre: '',
        email: '',
        telefono: '',
        dni_nie_cif: '',
        direccion: '',
        codigo_postal: '',
        localidad: '',
        provincia: ''
    })

    const [cargando, setCargando] = useState(false)
    const [mensaje, setMensaje] = useState(null)
    const [error, setError] = useState(null)
    const [mensajePassword, setMensajePassword] = useState(null)
    const [errorPassword, setErrorPassword] = useState(null)
    const [correoEnviado, setCorreoEnviado] = useState(false)
    const [errors, setErrors] = useState({
        nombre: '', 
        email: '',
        telefono: '', 
        dni_nie_cif: '',
        direccion: '', 
        codigo_postal: '', 
        localidad: '', 
        provincia: ''
    })

    const navigate = useNavigate()

    useEffect(() => {
        if (!usuario) navigate('/login')
    }, [usuario])

    useEffect(() => {
        if (usuario) {
            setForm({
                nombre: usuario.nombre || '',
                email: usuario.email || '',
                telefono: usuario.telefono || '',
                dni_nie_cif: usuario.dni_nie_cif || '',
                direccion: usuario.direccion || '',
                codigo_postal: usuario.codigo_postal || '',
                localidad: usuario.localidad || '',
                provincia: usuario.provincia || ''
            })
        }
    }, [usuario])

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
        if (form.telefono.trim() && !telefonoRegex.test(form.telefono.replace(/\s/g, '')))
            e.telefono = 'Teléfono no válido (9 dígitos, empieza por 6, 7, 8 o 9)'
        if (form.dni_nie_cif.trim() && !dniNieCifRegex.test(form.dni_nie_cif.trim()))
            e.dni_nie_cif = 'Formato de DNI, NIE o CIF no válido'
        if (form.direccion.trim() && form.direccion.trim().length < 5)
            e.direccion = 'Introduce una dirección válida'
        if (form.codigo_postal.trim() && !cpRegex.test(form.codigo_postal.trim()))
            e.codigo_postal = 'CP no válido'
        if (form.localidad.trim() && form.localidad.trim().length < 2)
            e.localidad = 'Introduce una localidad válida'
        if (form.provincia.trim() && form.provincia.trim().length < 2)
            e.provincia = 'Introduce una provincia válida'

        setErrors(prev => ({ ...prev, ...e }))
        return Object.keys(e).length === 0
    }

    const handleGuardar = (e) => {
        e.preventDefault()
        if (!validate()) return
        setCargando(true)
        setMensaje(null)
        setError(null)

        const token = localStorage.getItem('token')

        fetch(`${API_URL}/api/usuarios/${usuario.id_usuario}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(form)
        })
            .then(r => r.json())
            .then(data => {
                if (data.ok) {
                    setMensaje('Datos actualizados correctamente')
                    login(token)
                } else {
                    setError(data.error)
                }
            })
            .catch(() => setError('Error al actualizar los datos'))
            .finally(() => setCargando(false))
    }

    const handleCambiarPassword = () => {
        setMensajePassword(null)
        setErrorPassword(null)
        supabase.auth.resetPasswordForEmail(usuario.email, {
            redirectTo: `${window.location.origin}/actualizar-password`
        })
            .then(() => {
                setMensajePassword('Correo enviado. Revisa tu bandeja de entrada.')
                setCorreoEnviado(true)
            })
            .catch(() => setErrorPassword('Error al enviar el correo'))
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

    const getOnBlur = (field) => (e) => {
        e.target.style.borderColor = errors[field] ? '#ff4444' : 'rgba(255,255,255,0.1)'
    }

    const puedeEnviar = form.nombre.trim() !== '' && form.email.trim() !== ''

    return (
        <div style={{ background: '#0d0d0d', minHeight: '100vh', paddingTop: '80px' }}>

            {/* Cabecera */}
            <div className="contacto-cabecera">
                <h1 style={{
                    fontFamily: 'Bebas Neue',
                    fontSize: '3.5rem',
                    letterSpacing: '0.1em',
                    color: '#fff',
                    marginBottom: '0.25rem'
                }}>
                    Mis <span style={{ color: '#FFE600' }}>datos</span>
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem' }}>
                    Actualiza tu información personal
                </p>
            </div>

            {/* Formulario */}
            <div className="contacto-content" style={{ background: '#111', borderTop: '1px solid rgba(255,230,0,0.15)' }}>
                <div style={{ maxWidth: '640px' }}>

                    <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        {/* Nombre + Email */}
                        <div className="contacto-grid-2">
                            <div>
                                <label style={labelStyle}>Nombre</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                    style={{ ...inputStyle, border: errors.nombre ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }}
                                    onFocus={e => e.target.style.borderColor = '#FFE600'} 
                                    onBlur={getOnBlur('nombre')} /> 
                                    {errors.nombre && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.nombre}</p>}
                            </div>
                            <div>
                                <label style={labelStyle}>Email</label>
                                <input
                                    type="text"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    style={{ ...inputStyle, border: errors.email ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }} 
                                    onFocus={e => e.target.style.borderColor = '#FFE600'} 
                                    onBlur={getOnBlur('email')} /> 
                                {errors.email && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.email}</p>}
                            </div>
                        </div>

                        {/* Teléfono + DNI */}
                        <div className="contacto-grid-2">
                            <div>
                                <label style={labelStyle}>Teléfono</label>
                                <input
                                    type="text"
                                    name="telefono"
                                    value={form.telefono}
                                    onChange={handleChange}
                                    style={{ ...inputStyle, border: errors.telefono ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }}
                                    onFocus={e => e.target.style.borderColor = '#FFE600'}
                                    onBlur={getOnBlur('telefono')} />
                                {errors.telefono && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.telefono}</p>}
                            </div>
                            <div>
                                <label style={labelStyle}>DNI / NIE / CIF</label>
                                <input
                                    type="text"
                                    name="dni_nie_cif"
                                    value={form.dni_nie_cif}
                                    onChange={handleChange}
                                    style={{ ...inputStyle, border: errors.dni_nie_cif ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }}
                                    onFocus={e => e.target.style.borderColor = '#FFE600'}
                                    onBlur={getOnBlur('dni_nie_cif')} />
                                {errors.dni_nie_cif && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.dni_nie_cif}</p>}
                            </div>
                        </div>

                        {/* Dirección */}
                        <div>
                            <label style={labelStyle}>Dirección</label>
                            <input
                                type="text"
                                name="direccion"
                                value={form.direccion}
                                onChange={handleChange}
                                style={{ ...inputStyle, border: errors.direccion ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }}
                                onFocus={e => e.target.style.borderColor = '#FFE600'}
                                onBlur={getOnBlur('direccion')} />
                            {errors.direccion && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.direccion}</p>}
                        </div>

                        {/* CP + Localidad + Provincia */}
                        <div className="misdatos-grid-cp">
                            <div>
                                <label style={labelStyle}>C.P.</label>
                                <input
                                    type="text"
                                    name="codigo_postal"
                                    value={form.codigo_postal}
                                    onChange={handleChange}
                                    style={{ ...inputStyle, border: errors.codigo_postal ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }}
                                    onFocus={e => e.target.style.borderColor = '#FFE600'}
                                    onBlur={getOnBlur('codigo_postal')} />
                                {errors.codigo_postal && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.codigo_postal}</p>}
                            </div>
                            <div>
                                <label style={labelStyle}>Localidad</label>
                                <input
                                    type="text"
                                    name="localidad"
                                    value={form.localidad}
                                    onChange={handleChange}
                                    style={{ ...inputStyle, border: errors.localidad ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }}
                                    onFocus={e => e.target.style.borderColor = '#FFE600'}
                                    onBlur={getOnBlur('localidad')} />
                                {errors.localidad && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.localidad}</p>}
                            </div>
                            <div>
                                <label style={labelStyle}>Provincia</label>
                                <input
                                    type="text"
                                    name="provincia"
                                    value={form.provincia}
                                    onChange={handleChange}
                                    style={{ ...inputStyle, border: errors.provincia ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.1)' }}
                                    onFocus={e => e.target.style.borderColor = '#FFE600'}
                                    onBlur={getOnBlur('provincia')} />
                                {errors.provincia && <p style={{ color: '#ff4444', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>{errors.provincia}</p>}
                            </div>
                        </div>

                        {mensaje && (
                            <p style={{ color: '#FFE600', fontSize: '0.85rem' }}>{mensaje}</p>
                        )}
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
                                alignSelf: 'flex-start',
                            }}
                            onMouseEnter={e => { if (!cargando) e.currentTarget.style.transform = 'translateY(-2px)' }}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            {cargando ? 'Guardando...' : 'Guardar cambios'}
                        </button>

                    </form>

                    {/* Separador */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '3rem 0' }} />

                    {/* Cambiar contraseña */}
                    <div>
                        <h2 style={{
                            fontFamily: 'Bebas Neue',
                            fontSize: '1.8rem',
                            letterSpacing: '0.1em',
                            color: '#fff',
                            marginBottom: '0.5rem'
                        }}>
                            Contraseña
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                            Te enviaremos un correo con un enlace para cambiarla
                        </p>

                        {mensajePassword && (
                            <p style={{ color: '#FFE600', fontSize: '0.85rem', marginBottom: '1rem' }}>{mensajePassword}</p>
                        )}
                        {errorPassword && (
                            <p style={{ color: '#ff4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{errorPassword}</p>
                        )}

                        <button
                            onClick={handleCambiarPassword}
                            style={{
                                background: 'transparent',
                                border: '1px solid rgba(255,230,0,0.4)',
                                color: '#FFE600',
                                fontFamily: 'Bebas Neue',
                                fontSize: '1rem',
                                letterSpacing: '0.15em',
                                padding: '0.75rem 2rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255,230,0,0.08)'
                                e.currentTarget.style.borderColor = '#FFE600'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.borderColor = 'rgba(255,230,0,0.4)'
                            }}
                        >
                            {correoEnviado ? 'Reenviar correo' : 'Cambiar contraseña'}
                        </button>
                    </div>

                </div>
            </div>

        </div>
    )
}