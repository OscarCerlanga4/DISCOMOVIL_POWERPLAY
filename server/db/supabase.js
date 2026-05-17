// Inicializa dos clientes de Supabase con distintos niveles de acceso:
// - supabase: usa la SERVICE_ROLE_KEY, bypasea RLS y se usa para operaciones de servidor (CRUD, admin).
// - supabaseAuth: usa la ANON_KEY, respeta RLS y se usa exclusivamente para signUp/signInWithPassword.

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseAuth = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

module.exports = { supabase, supabaseAuth};