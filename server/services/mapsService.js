// Servicio de tiempo de viaje usando la API Routes v2 de Google Maps (computeRoutes).
// Solo solicita el campo 'routes.duration' para minimizar el tamaño de la respuesta.
// Devuelve los minutos de viaje redondeados hacia arriba, o null si no hay ruta disponible.

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

async function calcularTiempoViaje(origen, destino) {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': 'routes.duration',
        },
        body: JSON.stringify({
            origin: { address: origen },
            destination: { address: destino },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE',
            computeAlternativeRoutes: false,
        }),
    })

    const data = await response.json()
    if (!data.routes || data.routes.length === 0) return null

    // La API devuelve la duración como "Xs" (ej: "3600s")
    const segundos = parseInt(data.routes[0].duration.replace('s', ''), 10)
    return Math.ceil(segundos / 60) // devuelve minutos
}

module.exports = { calcularTiempoViaje }