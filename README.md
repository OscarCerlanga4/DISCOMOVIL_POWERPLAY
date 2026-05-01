<div align="center">

<br />

# ⚡ DISCOMOVIL POWER PLAY

### Plataforma web de gestión de reservas para eventos de sonido e iluminación

<br />

[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Stripe](https://img.shields.io/badge/Stripe-635BFF?style=for-the-badge&logo=stripe&logoColor=white)](https://stripe.com/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)

<br />

</div>

---

## ¿Qué es Discomovil Power Play?

**Discomovil Power Play** es una aplicación web fullstack diseñada para gestionar de forma integral el negocio de alquiler de equipos de sonido, iluminación y contratación de DJs para eventos.

Los clientes pueden explorar el catálogo, realizar reservas, revisar sus presupuestos y pagar sus facturas online. El administrador gestiona todo el ciclo desde un panel centralizado: reservas, presupuestos, facturas, clientes, equipos y DJs.

### Flujo completo de la aplicación

```
Cliente explora servicios → Añade al carrito → Solicita reserva
         ↓
Aplicación genera presupuesto → Cliente acepta o rechaza
         ↓
Admin confirma → Factura generada automáticamente → Cliente paga con Stripe
```

---

## ✨ Funcionalidades principales

### 👤 Área de cliente
- Registro e inicio de sesión con email y contraseña
- Catálogo de equipos y DJs con disponibilidad en tiempo real
- Carrito con selección de fechas y servicios
- Panel personal con historial de reservas y pedidos
- Aceptar o rechazar presupuestos recibidos
- Descarga de presupuestos y facturas en **PDF**
- Pago online seguro con **Stripe**
- Gestión de datos personales y contraseña

### 🔧 Panel de administración
- Gestión completa de reservas, presupuestos y facturas
- Generación de presupuestos con desglose de conceptos
- Descarga de documentos PDF profesionales con logo de empresa
- Alta y gestión de equipos, DJs y eventos
- Creación manual de reservas asignando datos de cliente
- Configuración de los datos y logo de la empresa
- Control de disponibilidad por fechas

---

## 🛠️ Stack tecnológico

| Capa | Tecnología | Descripción |
|---|---|---|
| Frontend | React 19 + Vite | Interfaz de usuario moderna y reactiva |
| Backend | Node.js + Express | API REST con autenticación JWT |
| Base de datos | PostgreSQL (Supabase) | Base de datos relacional en la nube |
| Autenticación | Supabase Auth | Gestión de sesiones y tokens |
| Pagos | Stripe | Procesamiento de pagos seguro |
| PDFs | jsPDF + jspdf-autotable | Generación de documentos en el navegador |
| Almacenamiento | Supabase Storage | Subida y gestión de imágenes |
| Paquetes | pnpm (monorepo) | Gestión de dependencias del workspace |
| Despliegue | Render | Frontend estático + backend web service |

---

## 📁 Estructura del repositorio

```
DISCOMOVIL_POWERPLAY/
├── client/                  # Frontend — React + Vite
│   └── src/
│       ├── components/      # Header, Footer, SubidaImagen
│       ├── contexts/        # AuthContext, CarritoContext
│       ├── lib/             # Cliente Supabase
│       └── pages/           # Todas las páginas de la app
├── server/                  # Backend — Node.js + Express
│   ├── controllers/         # Lógica de negocio por módulo
│   ├── middleware/          # Verificación de token y rol admin
│   ├── routes/              # Definición de rutas de la API
│   └── db/                  # Conexión a Supabase
├── docs/                    # Documentación técnica del proyecto
├── pnpm-workspace.yaml      # Configuración del monorepo
└── package.json
```

---

## 🚀 Instalación en local

### Requisitos previos

- [Node.js 20+](https://nodejs.org/)
- [pnpm 9+](https://pnpm.io/installation) — `npm install -g pnpm`
- [Stripe CLI](https://stripe.com/docs/stripe-cli) — necesaria para los webhooks en local
- Cuenta en [Supabase](https://supabase.com/) con el proyecto configurado
- Cuenta en [Stripe](https://stripe.com/) con las claves de test

### 1. Clonar el repositorio

```bash
git clone https://github.com/OscarCerlanga4/DISCOMOVIL_POWERPLAY.git
cd DISCOMOVIL_POWERPLAY
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

Crea el archivo `server/.env` con tus credenciales de Supabase y Stripe.  
Crea el archivo `client/.env` con la URL pública de Supabase y la URL del backend.

> [!CAUTION]
> Nunca subas los archivos `.env` al repositorio. Están incluidos en `.gitignore`.

> [!NOTE]
> Puedes usar los archivos `.env.example` de cada carpeta como plantilla.

### 4. Arrancar la aplicación

Necesitas **tres terminales** abiertas simultáneamente:

**Terminal 1 — Backend:**
```bash
cd server && node index.js
```

**Terminal 2 — Frontend:**
```bash
cd client && pnpm dev
```

**Terminal 3 — Stripe webhooks (necesario para que los pagos funcionen en local):**
```bash
stripe listen --forward-to localhost:3005/api/stripe/webhook
```

> [!TIP]
> La app estará disponible en `http://localhost:5173` y el backend en el puerto `3005` o el que quieras asignar.

> [!IMPORTANT]
> Para acceder al panel de administración necesitas un usuario con `rol = admin` en la tabla `usuario` de Supabase. Puedes cambiarlo directamente desde el dashboard de Supabase una vez registrado.

---

## 🌿 Ramas y flujo de trabajo

```
main       → Producción. Solo recibe merges desde release/* o hotfix/*
develop    → Integración. Recibe merges desde feature/*
feature/*  → Desarrollo de nuevas funcionalidades
hotfix/*   → Correcciones urgentes en producción
fix/*      → Correciones menos importantes o de niveles mínimos de detalles
docs/*     → Documentación. Añadir o modificar la documentación del proyecto
```

> [!NOTE]
> El despliegue en Render se activa automáticamente con cada push a `main`. Los cambios en `develop` y `feature/*` no despliegan a producción.

---

## 📄 Documentación

La carpeta `/docs` contiene la documentación técnica completa del proyecto:

| Documento | Contenido |
|---|---|
| `01_planificacion_inicial.pdf` | Planificación y alcance del proyecto |
| `02_analisis_de_requisitos.pdf` | Requisitos funcionales y no funcionales |
| `03_diseno_general_sistema.pdf` | Arquitectura general del sistema |
| `04_vision_general_sistema.pdf` | Visión de producto y objetivos |
| `05_analisis_funcional_de_datos.pdf` | Análisis funcional de datos |
| `06_diseno_conceptual.pdf` | Modelo conceptual de la base de datos |
| `07_diseno_logico.pdf` | Modelo lógico relacional |
| `08_diseno_normalizado.pdf` | Diseño normalizado de tablas |
| `09_diseno_fisico.pdf` | Diseño físico e implementación en Supabase |

---

## 🚢 Despliegue

La aplicación está desplegada en **Render** con dos servicios separados apuntando al mismo repositorio:

- **Frontend** → Render Static Site (build de Vite)
- **Backend** → Render Web Service (Node.js + Express)

Las variables de entorno se configuran directamente en el dashboard de Render, sin necesidad de subir ningún archivo `.env`.

> [!NOTE]
> El webhook de Stripe en producción apunta directamente a la URL pública del backend en Render, por lo que **no es necesario** ejecutar la Stripe CLI en producción.

---

## 📝 Licencia

Este proyecto es de uso privado. Todos los derechos reservados © 2026 Discomovil Power Play.

---

<div align="center">

Desarrollado con ❤️ para **Discomovil Power Play**

</div>