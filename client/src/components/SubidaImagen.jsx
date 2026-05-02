import { useState } from 'react'
import { API_URL } from '../lib/api'

export default function SubidaImagen({ value, onChange, label = 'Imagen' }) {
    const [subiendo, setSubiendo] = useState(false)
    const [error, setError] = useState('')

    const handleArchivo = (e) => {
        const archivo = e.target.files[0]
        if (!archivo) return

        const extensionesPermitidas = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!extensionesPermitidas.includes(archivo.type)) {
            setError('Solo se permiten imágenes JPG, PNG, WEBP o GIF.')
            return
        }

        setError('')
        setSubiendo(true)

        const reader = new FileReader()
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]
            fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ base64, nombre: archivo.name, tipo: archivo.type })
            })
                .then(r => r.json())
                .then(data => {
                    if (data.ok) {
                        onChange(data.url)
                    } else {
                        setError('Error al subir la imagen: ' + data.error)
                    }
                })
                .catch(() => setError('Error de conexión.'))
                .finally(() => setSubiendo(false))
        }
        reader.readAsDataURL(archivo)
    }

    const labelStyle = {
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.4)',
        display: 'block',
        marginBottom: '6px'
    }

    return (
        <div>
            <label style={labelStyle}>{label}</label>

            {value && (
                <div style={{ marginBottom: '8px', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <img
                        src={value}
                        alt="Vista previa"
                        style={{ width: '100%', height: 'auto', maxHeight: '350px', objectFit: 'contain', display: 'block' }}
                    />
                </div>
            )}

            <label
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#141414',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '0.75rem 1rem',
                    cursor: subiendo ? 'not-allowed' : 'pointer',
                    transition: 'border-color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#FFE600'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleArchivo}
                    disabled={subiendo}
                    style={{ display: 'none' }}
                />
                <span style={{ fontSize: '0.85rem', color: subiendo ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)' }}>
                    {subiendo ? 'Subiendo...' : value ? 'Cambiar imagen' : 'Seleccionar imagen'}
                </span>
                {!subiendo && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}>
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                )}
            </label>

            {error && (
                <p style={{ color: '#ff4444', fontSize: '0.75rem', margin: '6px 0 0' }}>{error}</p>
            )}
        </div>
    )
}