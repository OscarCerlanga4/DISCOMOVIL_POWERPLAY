import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Inicio from './pages/Inicio'
import Eventos from './pages/Eventos'
import Servicios from './pages/Servicios'
import Carrito from './pages/Carrito'
import Contacto from './pages/Contacto'
import Login from './pages/Login'
import MisPedidos from './pages/MisPedidos'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mis-pedidos" element={<MisPedidos />} />
      </Routes>
    </BrowserRouter>
  )
}
