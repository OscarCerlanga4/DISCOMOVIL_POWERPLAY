-- ============================================================
--  DISCOMOVIL POWERPLAY — Schema completo de la base de datos
--  Sincronizado con Supabase real (proyecto: pvuwhofesxvrusjjindb)
--  Región: eu-west-1 (Irlanda)
-- ============================================================

-- ── EXTENSIONES ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ── ENUMs ─────────────────────────────────────────────────────────────────────

-- Rol del usuario en el sistema
CREATE TYPE rol_usuario_enum AS ENUM ('usuario', 'admin');

-- Tipo de artista/DJ
CREATE TYPE tipo_artista AS ENUM ('dj', 'orquesta', 'grupo');

-- Categoría del equipo de sonido/iluminación
CREATE TYPE categoria_equipo AS ENUM (
    'sonido',
    'iluminacion',
    'microfonia',
    'mezclas',
    'efectos',
    'pantallas',
    'vehiculo'
);

-- Estado del ciclo de vida de una reserva
-- NOTA: 'rechazada' añadida en migración Mayo 2026 (no se usa activamente)
CREATE TYPE estado_reserva_enum AS ENUM (
    'pendiente',
    'confirmada',
    'cancelada'
);

-- Estado del ciclo de aprobación del presupuesto
CREATE TYPE estado_presupuesto_enum AS ENUM (
    'pendiente',
    'aceptado_cliente',
    'aceptado',
    'rechazado'
);

-- Estado de pago de una factura
CREATE TYPE estado_factura AS ENUM ('pendiente', 'pagada');

-- Tipo de consulta del formulario de contacto
CREATE TYPE tipo_contacto_enum AS ENUM ('duda', 'incidencia', 'opinion', 'otro');

-- NOTA: metodo_pago NO es ENUM — se almacena como VARCHAR
--       Valores usados: 'stripe' (webhook), 'efectivo', 'transferencia' (admin manual)


-- ── TABLAS ────────────────────────────────────────────────────────────────────

-- 1. usuario
--    PK = UUID de Supabase Auth (auth.users.id).
--    Las contraseñas las gestiona Supabase Auth; no se almacenan aquí.
--    Al registrarse, Express llama a supabase.auth.signUp() y luego
--    inserta en esta tabla con el UUID devuelto.
CREATE TABLE IF NOT EXISTS public.usuario (
    id_usuario    UUID              NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    dni_nie_cif   VARCHAR           NOT NULL UNIQUE,
    nombre        VARCHAR           NOT NULL,
    email         VARCHAR           NOT NULL UNIQUE,
    telefono      VARCHAR           NOT NULL,
    direccion     VARCHAR           NOT NULL,
    codigo_postal VARCHAR           NOT NULL,
    localidad     VARCHAR           NOT NULL,
    provincia     VARCHAR           NOT NULL,
    rol           rol_usuario_enum  NOT NULL DEFAULT 'usuario'
);

-- 2. equipo
--    precio_alquiler_hora >= 0, stock_total >= 0 (CHECKs en BD)
--    imagen_url y categoria son nullable
CREATE TABLE IF NOT EXISTS public.equipo (
    id_equipo            INTEGER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre               VARCHAR          NOT NULL,
    descripcion          TEXT             NOT NULL,
    precio_alquiler_hora NUMERIC          NOT NULL CHECK (precio_alquiler_hora >= 0),
    stock_total          INTEGER          NOT NULL CHECK (stock_total >= 0),
    imagen_url           TEXT,
    categoria            categoria_equipo
);

-- 3. dj
--    precio_hora >= 0 (CHECK en BD)
--    imagen_url y tipo son nullable
CREATE TABLE IF NOT EXISTS public.dj (
    id_dj       INTEGER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre      VARCHAR       NOT NULL,
    descripcion TEXT          NOT NULL,
    precio_hora NUMERIC       NOT NULL CHECK (precio_hora >= 0),
    imagen_url  TEXT,
    tipo        tipo_artista  DEFAULT 'dj'
);

-- 4. evento
--    artistas, descripcion, imagen_url son nullable
--    created_at gestionado automáticamente por Supabase
CREATE TABLE IF NOT EXISTS public.evento (
    id_evento   SERIAL       PRIMARY KEY,
    titulo      TEXT         NOT NULL,
    fecha       TIMESTAMPTZ  NOT NULL,
    lugar       TEXT         NOT NULL,
    artistas    TEXT,
    descripcion TEXT,
    imagen_url  TEXT,
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- 5. datos_empresa
--    Tabla singleton (una única fila, id_empresa = 1).
--    Almacena datos fiscales del emisor para presupuestos, facturas y PDFs.
--    Todos los campos son NOT NULL excepto logo_url.
CREATE TABLE IF NOT EXISTS public.datos_empresa (
    id_empresa     INTEGER  NOT NULL PRIMARY KEY DEFAULT 1 CHECK (id_empresa = 1),
    nombre_empresa VARCHAR  NOT NULL,
    cif            VARCHAR  NOT NULL,
    direccion      VARCHAR  NOT NULL,
    codigo_postal  VARCHAR  NOT NULL,
    localidad      VARCHAR  NOT NULL,
    provincia      VARCHAR  NOT NULL,
    email          VARCHAR  NOT NULL,
    telefono       VARCHAR  NOT NULL,
    iban           VARCHAR  NOT NULL,
    logo_url       TEXT                -- nullable: URL en Supabase Storage (bucket 'imagenes')
);

INSERT INTO public.datos_empresa (id_empresa, nombre_empresa, cif, direccion,
    codigo_postal, localidad, provincia, email, telefono, iban)
VALUES (1, '', '', '', '', '', '', '', '', '')
ON CONFLICT DO NOTHING;

-- 6. contacto
--    Registra formularios enviados desde navegación pública (sin login).
--    Columna de fecha se llama 'fecha' (no 'fecha_contacto').
CREATE TABLE IF NOT EXISTS public.contacto (
    id_contacto     INTEGER             GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre          VARCHAR             NOT NULL,
    email           VARCHAR             NOT NULL,
    titulo_problema VARCHAR             NOT NULL,
    tipo_contacto   tipo_contacto_enum  NOT NULL,
    descripcion     TEXT                NOT NULL,
    fecha           DATE                NOT NULL DEFAULT CURRENT_DATE
);

-- 7. reserva
--    id_usuario nullable: reservas manuales del admin tienen id_usuario = NULL.
--    Todos los campos cliente_* son NOT NULL: snapshot inmutable del cliente.
--    ubicacion también es NOT NULL.
CREATE TABLE IF NOT EXISTS public.reserva (
    id_reserva            INTEGER              GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario            UUID                 REFERENCES public.usuario(id_usuario) ON DELETE SET NULL,
    ubicacion             VARCHAR              NOT NULL,
    fecha_inicio          TIMESTAMPTZ          NOT NULL,
    fecha_fin             TIMESTAMPTZ          NOT NULL,
    estado_reserva        estado_reserva_enum  NOT NULL DEFAULT 'pendiente',
    -- Snapshot del cliente en el momento de la reserva (inmutable)
    cliente_dni_nie_cif   VARCHAR              NOT NULL,
    cliente_nombre        VARCHAR              NOT NULL,
    cliente_email         VARCHAR              NOT NULL,
    cliente_telefono      VARCHAR              NOT NULL,
    cliente_direccion     VARCHAR              NOT NULL,
    cliente_codigo_postal VARCHAR              NOT NULL,
    cliente_localidad     VARCHAR              NOT NULL,
    cliente_provincia     VARCHAR              NOT NULL,
    CONSTRAINT fk_reserva_usuario FOREIGN KEY (id_usuario)
        REFERENCES public.usuario(id_usuario) ON DELETE SET NULL
);

-- 8. incluye  (N:M reserva–equipo, PK compuesta)
--    cantidad > 0 (CHECK en BD)
CREATE TABLE IF NOT EXISTS public.incluye (
    id_reserva  INTEGER  NOT NULL,
    id_equipo   INTEGER  NOT NULL,
    cantidad    INTEGER  NOT NULL CHECK (cantidad > 0),
    PRIMARY KEY (id_reserva, id_equipo),
    CONSTRAINT fk_incluye_reserva FOREIGN KEY (id_reserva)
        REFERENCES public.reserva(id_reserva) ON DELETE CASCADE,
    CONSTRAINT fk_incluye_equipo  FOREIGN KEY (id_equipo)
        REFERENCES public.equipo(id_equipo)   ON DELETE RESTRICT
);

-- 9. contrata  (N:M reserva–dj, PK compuesta)
CREATE TABLE IF NOT EXISTS public.contrata (
    id_reserva  INTEGER  NOT NULL,
    id_dj       INTEGER  NOT NULL,
    PRIMARY KEY (id_reserva, id_dj),
    CONSTRAINT fk_contrata_reserva FOREIGN KEY (id_reserva)
        REFERENCES public.reserva(id_reserva) ON DELETE CASCADE,
    CONSTRAINT fk_contrata_dj     FOREIGN KEY (id_dj)
        REFERENCES public.dj(id_dj)           ON DELETE RESTRICT
);

-- 10. presupuesto
--     id_reserva UNIQUE → una reserva genera un único presupuesto.
--     fecha_emision: DATE. fecha_limite: TIMESTAMPTZ NOT NULL.
CREATE TABLE IF NOT EXISTS public.presupuesto (
    id_presupuesto  INTEGER                  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_reserva      INTEGER                  NOT NULL UNIQUE,
    estado          estado_presupuesto_enum  NOT NULL DEFAULT 'pendiente',
    base_imponible  NUMERIC                  NOT NULL CHECK (base_imponible >= 0),
    total           NUMERIC                  NOT NULL CHECK (total >= 0),
    fecha_emision   DATE                     NOT NULL DEFAULT CURRENT_DATE,
    fecha_limite    TIMESTAMPTZ              NOT NULL,
    CONSTRAINT fk_presupuesto_reserva FOREIGN KEY (id_reserva)
        REFERENCES public.reserva(id_reserva) ON DELETE CASCADE
);

-- 11. detalle_presupuesto
--     Líneas de concepto del presupuesto (equipos y DJs contratados).
--     cantidad > 0, precio_unitario >= 0, subtotal >= 0
CREATE TABLE IF NOT EXISTS public.detalle_presupuesto (
    id_detalle      INTEGER  GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_presupuesto  INTEGER  NOT NULL,
    concepto        VARCHAR  NOT NULL,
    cantidad        INTEGER  NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC  NOT NULL CHECK (precio_unitario >= 0),
    subtotal        NUMERIC  NOT NULL CHECK (subtotal >= 0),
    CONSTRAINT fk_detalle_presupuesto FOREIGN KEY (id_presupuesto)
        REFERENCES public.presupuesto(id_presupuesto) ON DELETE CASCADE
);

-- 12. factura
--     Generada automáticamente al aceptar el presupuesto (admin confirma).
--     numero_factura: 'FAC-{AÑO}-{id_presupuesto:04d}' (generado en backend).
--     id_presupuesto UNIQUE → una factura por presupuesto.
--     fecha_emision: DATE.
CREATE TABLE IF NOT EXISTS public.factura (
    id_factura     INTEGER         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_factura VARCHAR         NOT NULL UNIQUE,
    fecha_emision  DATE            NOT NULL DEFAULT CURRENT_DATE,
    base_imponible NUMERIC         NOT NULL CHECK (base_imponible >= 0),
    total          NUMERIC         NOT NULL CHECK (total >= 0),
    id_presupuesto INTEGER         NOT NULL UNIQUE,
    estado_factura estado_factura  NOT NULL DEFAULT 'pendiente',
    CONSTRAINT fk_factura_presupuesto FOREIGN KEY (id_presupuesto)
        REFERENCES public.presupuesto(id_presupuesto) ON DELETE RESTRICT
);

-- 13. pago
--     metodo_pago: VARCHAR — no ENUM — valores usados: 'stripe', 'efectivo', 'transferencia'.
--     referencia_pago: nullable — paymentIntentId de Stripe para pagos online;
--                      NULL para efectivo o transferencia.
--     fecha_pago: DATE.
--     Si SUM(importe) >= factura.total → factura pasa a 'pagada' automáticamente.
CREATE TABLE IF NOT EXISTS public.pago (
    id_pago         INTEGER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_factura      INTEGER      NOT NULL,
    metodo_pago     VARCHAR      NOT NULL,
    fecha_pago      DATE         NOT NULL DEFAULT CURRENT_DATE,
    importe         NUMERIC      NOT NULL,
    referencia_pago VARCHAR,
    CONSTRAINT fk_pago_factura FOREIGN KEY (id_factura)
        REFERENCES public.factura(id_factura) ON DELETE RESTRICT
);

-- 14. keepalive
--     Tabla de mantenimiento para evitar inactividad en Supabase.
--     Actualizada diariamente por automatización N8N.
CREATE TABLE IF NOT EXISTS public.keepalive (
    id        INTEGER      NOT NULL PRIMARY KEY DEFAULT 1,
    last_ping TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO public.keepalive (id) VALUES (1) ON CONFLICT DO NOTHING;


-- ── ÍNDICES ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_reserva_usuario      ON public.reserva(id_usuario);
CREATE INDEX IF NOT EXISTS idx_reserva_estado       ON public.reserva(estado_reserva);
CREATE INDEX IF NOT EXISTS idx_incluye_equipo       ON public.incluye(id_equipo);
CREATE INDEX IF NOT EXISTS idx_contrata_dj          ON public.contrata(id_dj);
CREATE INDEX IF NOT EXISTS idx_presupuesto_estado   ON public.presupuesto(estado);
CREATE INDEX IF NOT EXISTS idx_detalle_presupuesto  ON public.detalle_presupuesto(id_presupuesto);
CREATE INDEX IF NOT EXISTS idx_factura_presupuesto  ON public.factura(id_presupuesto);
CREATE INDEX IF NOT EXISTS idx_pago_factura         ON public.pago(id_factura);
CREATE INDEX IF NOT EXISTS idx_evento_fecha         ON public.evento(fecha);


-- ── ROW LEVEL SECURITY (RLS) ──────────────────────────────────────────────────
-- Activado en Mayo 2026 (migración: enable_rls_all_tables_and_fix_estado_reserva)
-- El backend usa SUPABASE_SERVICE_ROLE_KEY → bypasea RLS siempre → sin impacto.
-- Sin políticas = acceso directo vía anon/authenticated bloqueado.

ALTER TABLE public.usuario             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipo              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dj                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datos_empresa       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacto            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reserva             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incluye             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrata            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presupuesto         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_presupuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.factura             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pago                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keepalive           ENABLE ROW LEVEL SECURITY;


-- ── LÓGICA DE NEGOCIO ─────────────────────────────────────────────────────────
--
--  FLUJO PRINCIPAL:
--  Carrito → POST /api/reservas
--    → INSERT reserva (estado='pendiente')
--    → INSERT incluye (equipos + cantidades)
--    → INSERT contrata (DJs)
--    → Calcula horas × precio → base_imponible → total (IVA 21%)
--    → INSERT presupuesto (estado='pendiente', fecha_limite=NOW()+48h)
--    → INSERT detalle_presupuesto (líneas de equipo y DJ)
--
--  ESTADOS DEL PRESUPUESTO:
--    pendiente → aceptado_cliente  (cliente acepta desde Mis Pedidos)
--              → rechazado         (cliente rechaza)
--    aceptado_cliente → aceptado   (admin confirma → reserva='confirmada'
--                                                  → INSERT factura automática)
--                     → rechazado  (admin rechaza)
--
--  FACTURA AUTOMÁTICA al aceptar presupuesto (admin):
--    numero_factura = 'FAC-{AÑO}-{id_presupuesto:04d}'
--    estado_factura = 'pendiente'
--    Comprueba si ya existe factura antes de crear (idempotente)
--
--  PAGO:
--    Stripe:  POST /api/pagos/intencion → PaymentIntent → clientSecret al frontend
--             Webhook /api/stripe/webhook → INSERT pago (metodo_pago='stripe',
--                                                        referencia_pago=intent.id)
--    Manual:  admin registra efectivo o transferencia → POST /api/pagos
--             INSERT pago (metodo_pago='efectivo'|'transferencia', referencia_pago=NULL)
--    Si SUM(importe) >= factura.total → UPDATE factura SET estado_factura='pagada'
--
--  DISPONIBILIDAD:
--    GET /api/disponibilidad?fecha_inicio=...&fecha_fin=...
--    → reservas activas en ese rango (excluye 'cancelada')
--    → devuelve equipos_ocupados[] y djs_ocupados[]
--    → stock comparado con equipo.stock_total
--
--  RESERVAS MANUALES (admin):
--    id_usuario = NULL (no vinculada a cuenta)
--    datos cliente_* introducidos manualmente en el carrito
--
--  STORAGE:
--    Bucket 'imagenes' en Supabase Storage
--    URLs guardadas en equipo.imagen_url, dj.imagen_url, evento.imagen_url, datos_empresa.logo_url