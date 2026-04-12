import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-black border-b border-neon sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        <Link to="/">
          <img src="/logo.png" alt="Power Play" className="h-12" />
        </Link>

        <nav className="flex items-center gap-8">
          <Link to="/" className="text-white hover:text-neon transition-colors">Inicio</Link>
          <Link to="/servicios" className="text-white hover:text-neon transition-colors">Servicios</Link>
          <Link to="/carrito" className="text-white hover:text-neon transition-colors">Carrito</Link>
          <Link to="/contacto" className="text-white hover:text-neon transition-colors">Contacto</Link>
        </nav>

        <Link to="/login" className="border border-neon text-neon px-4 py-2 hover:bg-neon hover:text-black transition-colors font-bold">
          Iniciar sesión
        </Link>

      </div>
    </header>
  )
}
