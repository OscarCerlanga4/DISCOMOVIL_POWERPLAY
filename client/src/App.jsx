import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
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

function AppContent() {
  const location = useLocation()
  const sinLayoutes = ['/login', '/register', '/actualizar-password'].includes(location.pathname)

  return (
    <>
      <ScrollToTop />
      {!sinLayoutes && <Header />}
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
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {!sinLayoutes && <Footer />}
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