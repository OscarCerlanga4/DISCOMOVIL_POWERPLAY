# DISCOMOVIL POWERPLAY

Aplicación web fullstack para la gestión de la empresa de alquiler de equipos
de sonido, iluminación y contratación de DJs **POWERPLAY**.

## Stack tecnológico

| Capa          | Tecnología              |
|---------------|-------------------------|
| Frontend      | React + Vite            |
| Backend       | Node.js + Express       |
| Base de datos | PostgreSQL (Supabase)   |
| Despliegue    | Render                  |

## Estructura del proyecto


## API Endpoints

| Método | Ruta | Descripción | Auth requerida |
|--------|------|-------------|----------------|
| POST | `/api/auth/register` | Registro de usuario | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/equipos` | Listar equipos | No |
| GET | `/api/equipos/:id` | Detalle de equipo | No |
| GET | `/api/djs` | Listar DJs | No |
| GET | `/api/djs/:id` | Detalle de DJ | No |
| POST | `/api/reservas` | Crear reserva | Sí — usuario |
| PUT | `/api/presupuestos/:id` | Aceptar/rechazar presupuesto | Sí — usuario/admin |
| GET | `/api/presupuestos/mis-presupuestos` | Ver mis presupuestos | Sí — usuario |
| GET | `/api/facturas/mis-facturas` | Ver mis facturas | Sí — usuario |
| POST | `/api/pagos` | Realizar pago | Sí — usuario |


## Estado

En desarrollo activo — v0.1.0

-  Backend completo
  - Autenticación con JWT y OAuth (Google, GitHub)
  - CRUD completo de todas las entidades
  - Creación de reserva con presupuesto y detalle automáticos
  - Flujo de aceptación cliente + admin con factura automática
  - Pagos parciales con actualización automática de estado de factura
  - Rutas protegidas por token y rol

-  Frontend en desarrollo (React + Vite)