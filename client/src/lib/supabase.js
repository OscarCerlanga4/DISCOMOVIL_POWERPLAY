// Cliente de Supabase para el frontend (clave anónima).
// autoRefreshToken está desactivado porque el token se gestiona manualmente a través del backend.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false
  }
})