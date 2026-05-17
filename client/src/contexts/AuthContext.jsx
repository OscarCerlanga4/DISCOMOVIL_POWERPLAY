// Contexto de autenticación. AuthProvider gestiona la sesión del usuario:
// - Al montar, comprueba si existe una sesión activa de Supabase (OAuth) o un token en localStorage,
//   y llama a /api/auth/me para obtener el perfil completo desde la tabla usuario.
// - Si el usuario existe en Supabase Auth pero no en la tabla usuario (OAuth sin registro previo),
//   lo redirige a /login?error=no-cuenta para que se registre.
// - Escucha onAuthStateChange para reaccionar a login OAuth y logout.
// - Los hijos del provider no se renderizan hasta que la carga inicial termina (evita flashes).

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { API_URL } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorOAuth, setErrorOAuth] = useState(null)
  
  const cargarUsuario = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.ok) {
        localStorage.setItem('token', token)
        setUsuario(data.usuario)
        setErrorOAuth(null)
      } else {
        localStorage.removeItem('token')
        setUsuario(null)
        supabase.auth.signOut()
        setErrorOAuth('No tienes cuenta registrada. Regístrate primero.')
        if (window.location.pathname !== '/login') {
            window.location.replace('/login?error=no-cuenta')
        }
      }
    } catch {
      localStorage.removeItem('token')
      setUsuario(null)
    }
  }

  useEffect(() => {
    // Comprobar si hay sesión activa de Supabase (OAuth o token guardado)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        cargarUsuario(session.access_token).finally(() => setCargando(false))
      } else {
        const token = localStorage.getItem('token')
        if (token) {
          cargarUsuario(token).finally(() => setCargando(false))
        } else {
          setCargando(false)
        }
      }
    })

    // Escuchar cambios de sesión (login OAuth, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        cargarUsuario(session.access_token)
      } else {
        localStorage.removeItem('token')
        setUsuario(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (token) => {
    await cargarUsuario(token)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUsuario(null)
    supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, errorOAuth }}>
      {!cargando && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
