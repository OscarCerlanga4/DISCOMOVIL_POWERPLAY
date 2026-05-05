import { BrowserRouter, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { API_URL } from './lib/api'
import Header from './components/Header'
import Footer from './components/Footer'
import Inicio from './pages/Inicio'
import Eventos from './pages/Eventos'
import Servicios from './pages/Servicios'
import Carrito from './pages/Carrito'
import Contacto from './pages/Contacto'
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider } from './contexts/AuthContext'
import { CarritoProvider } from './contexts/CarritoContext'
import MisPedidos from './pages/MisPedidos'
import Pago from './pages/Pago'
import MisDatos from './pages/MisDatos'
import ActualizarPassword from './pages/ActualizarPassword'
import Admin from './pages/Admin'
import Mantenimiento from './pages/Mantenimiento'
import PresupuestoConfirmado from './pages/PresupuestoConfirmado'
import { useAuth } from './contexts/AuthContext'

function ScrollToTop() {
    const { pathname } = useLocation()
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname])
    return null
}

function RutaAdmin({ children }) {
    const { usuario } = useAuth()
    if (!usuario) return <Navigate to="/login" />
    if (usuario.rol !== 'admin') return <Navigate to="/" />
    return children
}

function RutaMantenimiento() {
    const [activo, setActivo] = useState(null)

    useEffect(() => {
        fetch(`${API_URL}/api/health`)
            .then(r => setActivo(r.status === 503))
            .catch(() => setActivo(false))
    }, [])

    if (activo === null) return null
    if (!activo) return <Navigate to="/" />
    return <Mantenimiento />
}

function AppContent() {
    const location = useLocation()
    const navigate = useNavigate()
    const sinLayout = ['/login', '/register', '/actualizar-password', '/mantenimiento', '/presupuesto-confirmado'].includes(location.pathname)

    useEffect(() => {
        fetch(`${API_URL}/api/health`)
            .then(r => { if (r.status === 503) navigate('/mantenimiento') })
            .catch(() => { /* servidor caído — no redirigir, puede ser CORS en dev */ })
    }, [])

    return (
        <>
            <ScrollToTop />
            {!sinLayout && <Header />}
            <Routes>
                <Route path="/" element={<Inicio />} />
                <Route path="/eventos" element={<Eventos />} />
                <Route path="/servicios" element={<Servicios />} />
                <Route path="/carrito" element={<Carrito />} />
                <Route path="/contacto" element={<Contacto />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/mis-pedidos" element={<MisPedidos />} />
                <Route path="/pago/:id" element={<Pago />} />
                <Route path="/mis-datos" element={<MisDatos />} />
                <Route path="/actualizar-password" element={<ActualizarPassword />} />
                <Route path="/admin" element={<RutaAdmin><Admin /></RutaAdmin>} />
                <Route path="/presupuesto-confirmado" element={<PresupuestoConfirmado />} />
                <Route path="/mantenimiento" element={<RutaMantenimiento />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            {!sinLayout && <Footer />}
        </>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <CarritoProvider>
                    <AppContent />
                </CarritoProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}