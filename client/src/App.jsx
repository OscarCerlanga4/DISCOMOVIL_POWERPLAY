import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
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
import MisPedidos from './pages/MisPedidos'

function AppContent() {
  const location = useLocation()
  const sinLayoutes = ['/login', '/register'].includes(location.pathname)

  return (
    <>
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
      </Routes>
      {!sinLayoutes && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}
