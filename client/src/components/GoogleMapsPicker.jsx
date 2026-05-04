import { useState, useEffect, useRef } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

setOptions({
    key: MAPS_API_KEY,
    version: 'weekly',
    language: 'es',
    region: 'ES',
})

const parsearComponentes = (components) => {
    const get = (type) => components.find(c => c.types.includes(type))?.long_name || ''
    const numero = get('street_number')
    const calle = get('route') ? (numero ? `${get('route')}, ${numero}` : get('route')) : ''
    const localidad = get('locality') || get('administrative_area_level_3') || get('administrative_area_level_4') || ''
    const provincia = get('administrative_area_level_2') || ''
    const comunidad_autonoma = get('administrative_area_level_1') || ''
    return { calle, localidad, provincia, comunidad_autonoma }
}

const labelStyle = {
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '0.25rem',
    display: 'block',
}

export default function GoogleMapsPicker({ value, onUbicacionSelect }) {
    const [abierto, setAbierto] = useState(false)
    const [desglose, setDesglose] = useState({ calle: '', localidad: '', provincia: '', comunidad_autonoma: '' })
    const [textoConfirmado, setTextoConfirmado] = useState(value || '')
    const [cargandoMapa, setCargandoMapa] = useState(false)

    const mapRef = useRef(null)
    const inputRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const markerRef = useRef(null)
    const autocompleteRef = useRef(null)

    useEffect(() => {
        if (!abierto) return
        setCargandoMapa(true)

        Promise.all([
            importLibrary('maps'),
            importLibrary('places'),
            importLibrary('geocoding'),
        ]).then(([mapsLib, placesLib, geocodingLib]) => {
            setCargandoMapa(false)

            const map = new mapsLib.Map(mapRef.current, {
                center: { lat: 40.416775, lng: -3.703790 },
                zoom: 6,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                styles: [
                    { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
                    { elementType: 'labels.text.fill', stylers: [{ color: '#aaaaaa' }] },
                    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
                    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#333333' }] },
                    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0d0d' }] },
                ],
            })
            mapInstanceRef.current = map

            const marker = new window.google.maps.Marker({
                map,
                visible: false,
                animation: window.google.maps.Animation.DROP,
            })
            markerRef.current = marker

            const autocomplete = new placesLib.Autocomplete(inputRef.current, {
                componentRestrictions: { country: 'es' },
                fields: ['address_components', 'formatted_address', 'geometry'],
            })
            autocompleteRef.current = autocomplete

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace()
                if (!place.geometry) return
                const { location } = place.geometry
                map.setCenter(location)
                map.setZoom(15)
                marker.setPosition(location)
                marker.setVisible(true)
                const datos = parsearComponentes(place.address_components)
                setDesglose(datos)
                setTextoConfirmado(place.formatted_address)
            })

            const geocoder = new geocodingLib.Geocoder()
            map.addListener('click', async (e) => {
                const latLng = e.latLng
                marker.setPosition(latLng)
                marker.setVisible(true)
                try {
                    const response = await geocoder.geocode({ location: latLng })
                    if (!response.results[0]) return
                    const result = response.results[0]
                    inputRef.current.value = result.formatted_address
                    const datos = parsearComponentes(result.address_components)
                    setDesglose(datos)
                    setTextoConfirmado(result.formatted_address)
                } catch (err) {
                    console.error('Geocoder error:', err)
                }
            })
        }).catch(() => {
            setCargandoMapa(false)
        })
    }, [abierto])

    const handleConfirmar = () => {
        if (!textoConfirmado) return
        onUbicacionSelect(textoConfirmado, desglose)
        setAbierto(false)
    }

    const handleCerrar = () => setAbierto(false)

    const inputStyle = {
        background: '#0d0d0d',
        border: '1px solid rgba(255,255,255,0.15)',
        color: '#fff',
        padding: '0.65rem 1rem',
        fontSize: '0.9rem',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    }

    const campoStyle = {
        background: '#0d0d0d',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.6)',
        padding: '0.5rem 0.75rem',
        fontSize: '0.82rem',
        borderRadius: 0,
    }

    return (
        <>
            {/* Botón de apertura */}
            <button
                type="button"
                onClick={() => setAbierto(true)}
                style={{
                    background: '#141414',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: value ? '#fff' : 'rgba(255,255,255,0.35)',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#FFE600'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            >
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>📍</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {value || 'Seleccionar ubicación en el mapa...'}
                </span>
            </button>

            {/* Modal con el mapa */}
            {abierto && (
                <div
                    onClick={e => { if (e.target === e.currentTarget) handleCerrar() }}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.8)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1.5rem',
                    }}
                >
                    <div style={{
                        background: '#1a1a1a',
                        border: '1px solid rgba(255,230,0,0.25)',
                        boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
                        width: '100%',
                        maxWidth: '720px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        padding: '1.5rem',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                    }}>
                        {/* Cabecera */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{
                                fontFamily: 'Bebas Neue', fontSize: '1.6rem',
                                letterSpacing: '0.1em', color: '#fff', margin: 0
                            }}>
                                Selecciona la <span style={{ color: '#FFE600' }}>ubicación</span>
                            </h2>
                            <button
                                onClick={handleCerrar}
                                style={{
                                    background: 'transparent', border: 'none',
                                    color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                                    fontSize: '1.5rem', lineHeight: 1, padding: '0.25rem',
                                    transition: 'color 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                            >×</button>
                        </div>

                        {/* Input de búsqueda */}
                        <div>
                            <label style={labelStyle}>Busca una dirección o haz clic en el mapa</label>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Escribe una calle, ciudad o lugar..."
                                style={inputStyle}
                                onFocus={e => e.target.style.borderColor = '#FFE600'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
                            />
                        </div>

                        {/* Mapa */}
                        <div style={{ position: 'relative' }}>
                            {cargandoMapa && (
                                <div style={{
                                    position: 'absolute', inset: 0, background: '#0d0d0d',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    zIndex: 1, color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem',
                                }}>
                                    Cargando mapa...
                                </div>
                            )}
                            <div ref={mapRef} style={{ width: '100%', height: '360px' }} />
                        </div>

                        {/* Desglose de dirección */}
                        {(desglose.calle || desglose.localidad || desglose.provincia || desglose.comunidad_autonoma) && (
                            <div style={{
                                background: '#111',
                                border: '1px solid rgba(255,230,0,0.1)',
                                padding: '1rem',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.75rem',
                            }}>
                                <div>
                                    <label style={labelStyle}>Calle</label>
                                    <div style={campoStyle}>{desglose.calle || '—'}</div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Localidad</label>
                                    <div style={campoStyle}>{desglose.localidad || '—'}</div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Provincia</label>
                                    <div style={campoStyle}>{desglose.provincia || '—'}</div>
                                </div>
                                <div>
                                    <label style={labelStyle}>Comunidad autónoma</label>
                                    <div style={campoStyle}>{desglose.comunidad_autonoma || '—'}</div>
                                </div>
                            </div>
                        )}

                        {/* Botón confirmar */}
                        <button
                            onClick={handleConfirmar}
                            disabled={!textoConfirmado}
                            style={{
                                background: textoConfirmado ? '#FFE600' : 'rgba(255,255,255,0.05)',
                                border: textoConfirmado ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                color: textoConfirmado ? '#000' : 'rgba(255,255,255,0.3)',
                                fontFamily: 'Bebas Neue', fontSize: '1.1rem', letterSpacing: '0.15em',
                                padding: '0.9rem', cursor: textoConfirmado ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { if (textoConfirmado) e.currentTarget.style.transform = 'translateY(-2px)' }}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            {textoConfirmado ? 'Confirmar ubicación' : 'Selecciona un punto en el mapa'}
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}