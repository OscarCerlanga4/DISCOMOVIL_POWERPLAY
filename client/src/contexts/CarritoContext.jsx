// Contexto del carrito de compra. Persiste ítems, fechas y ubicación en localStorage.
// Los DJs solo se pueden añadir una vez; los equipos aumentan su cantidad si ya están en el carrito.
// El carrito se vacía automáticamente cuando el usuario cierra sesión.

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const CarritoContext = createContext(null)

export function CarritoProvider({ children }) {
    const [items, setItems] = useState(() => {
        const guardado = localStorage.getItem('carrito')
        return guardado ? JSON.parse(guardado) : []
    })
    const [fechaInicio, setFechaInicio] = useState(() => localStorage.getItem('carrito_fecha_inicio') || '')
    const [fechaFin, setFechaFin] = useState(() => localStorage.getItem('carrito_fecha_fin') || '')
    const [ubicacion, setUbicacion] = useState(() => localStorage.getItem('carrito_ubicacion') || '')

    useEffect(() => {
        localStorage.setItem('carrito', JSON.stringify(items))
        localStorage.setItem('carrito_fecha_inicio', fechaInicio)
        localStorage.setItem('carrito_fecha_fin', fechaFin)
        localStorage.setItem('carrito_ubicacion', ubicacion)
    }, [items, fechaInicio, fechaFin, ubicacion])

    const { usuario } = useAuth()

    useEffect(() => {
        if (!usuario) {
            setItems([])
            setFechaInicio('')
            setFechaFin('')
            setUbicacion('')
            localStorage.removeItem('carrito')
            localStorage.removeItem('carrito_fecha_inicio')
            localStorage.removeItem('carrito_fecha_fin')
            localStorage.removeItem('carrito_ubicacion')
        }
    }, [usuario])

    const añadir = (item) => {
        setItems(prev => {
            const id = item.tabla === 'dj' ? item.id_dj : item.id_equipo
            const existe = prev.find(i => i._id === id && i.tabla === item.tabla)
            if (existe) {
                if (item.tabla === 'dj') return prev
                return prev.map(i =>
                    i._id === id && i.tabla === item.tabla
                        ? { ...i, cantidad: i.cantidad + 1 }
                        : i
                )
            }
            return [...prev, { ...item, _id: id, cantidad: 1 }]
        })
    }

    const eliminar = (id, tabla) => {
        setItems(prev => prev.filter(i => !(i._id === id && i.tabla === tabla)))
    }

    const cambiarCantidad = (id, tabla, cantidad) => {
        if (cantidad < 1) return
        setItems(prev => prev.map(i =>
            i._id === id && i.tabla === tabla ? { ...i, cantidad } : i
        ))
    }

    const vaciar = () => {
        setItems([])
        setFechaInicio('')
        setFechaFin('')
        setUbicacion('')
        localStorage.removeItem('carrito')
        localStorage.removeItem('carrito_fecha_inicio')
        localStorage.removeItem('carrito_fecha_fin')
        localStorage.removeItem('carrito_ubicacion')
    }

    const horas = (fechaInicio && fechaFin) ? (new Date(fechaFin) - new Date(fechaInicio)) / (1000 * 60 * 60) : 0
    const total = horas > 0 ? items.reduce((acc, item) => acc + item.precio * item.cantidad * horas, 0) : 0

    return (
        <CarritoContext.Provider value={{
            items, fechaInicio, fechaFin, ubicacion,
            setFechaInicio, setFechaFin, setUbicacion,
            añadir, eliminar, cambiarCantidad, vaciar, total
        }}>
            {children}
        </CarritoContext.Provider>
    )
}

export function useCarrito() { return useContext(CarritoContext) }