# 🛠️ Manual de Administrador — DISCOMOVIL POWERPLAY

> Guía completa para la gestión de la plataforma desde el panel de administración.

> [!CAUTION]
> Este panel es de acceso restringido. No compartas tus credenciales de administrador con nadie. Cualquier acción realizada desde este panel afecta directamente a la base de datos en producción.

---

## Índice

- [Acceso al panel](#acceso-al-panel)
- [Gestión de equipos](#gestión-de-equipos)
- [Gestión de DJs](#gestión-de-djs)
- [Gestión de eventos](#gestión-de-eventos)
- [Gestión de reservas](#gestión-de-reservas)
- [Gestión de presupuestos](#gestión-de-presupuestos)
- [Datos de la empresa](#datos-de-la-empresa)

---

## Acceso al panel

1. Inicia sesión con tu cuenta de administrador en `/login`.
2. Una vez autenticado, accede a `/admin` desde el menú superior o directamente por URL.

> [!IMPORTANT]
> Solo las cuentas con rol `admin` pueden acceder al panel. Si intentas acceder sin permisos, serás redirigido automáticamente a la página de inicio.

---

## Gestión de equipos

Desde esta sección puedes administrar todo el catálogo de equipos de sonido, iluminación y demás material técnico.

### Crear un equipo

1. Pulsa **Nuevo equipo**.
2. Rellena los campos: nombre, descripción, precio por hora, stock disponible y categoría.
3. (Opcional) Sube una imagen representativa.
4. Pulsa **Guardar**.

### Editar un equipo

1. Localiza el equipo en la lista.
2. Pulsa el icono de edición.
3. Modifica los campos necesarios y guarda.


### Subir imagen

1. Dentro del formulario de creación o edición, pulsa **Subir imagen**.
2. Selecciona un archivo de imagen (JPG, PNG, WEBP).
3. La imagen se sube automáticamente a Supabase Storage y se asocia al equipo.

> [!TIP]
> Usa imágenes con relación de aspecto horizontal (16:9 o similar) para que se vean bien en las tarjetas del catálogo.

---

## Gestión de DJs

Funciona de forma idéntica a la gestión de equipos, con los siguientes campos específicos:

- **Nombre** del artista o grupo
- **Descripción** y estilo musical
- **Precio por hora**
- **Tipo**: DJ, Orquesta o Grupo musical
- **Imagen**

> [!NOTE]
> El tipo del artista es importante porque determina cómo se muestra en el catálogo y cómo se etiqueta en el carrito del cliente.

---

## Gestión de eventos

Desde aquí puedes publicar los eventos y actuaciones del calendario público.

### Crear un evento

1. Pulsa **Nuevo evento**.
2. Rellena: título, fecha y hora, lugar, artistas participantes y descripción.
3. (Opcional) Sube una imagen del cartel o flyer.
4. Pulsa **Guardar**.

### Editar y eliminar

El proceso es idéntico al de equipos y DJs.

> [!NOTE]
> Los eventos aparecen en la sección pública **Eventos** ordenados por fecha. Los eventos pasados siguen visibles hasta que los elimines manualmente.

---

## Gestión de reservas

En esta sección puedes ver todas las reservas del sistema y crear reservas manualmente para clientes que no tienen cuenta.

### Ver reservas

La tabla muestra todas las reservas con su estado, cliente, fechas y ubicación.

| Estado | Descripción |
|---|---|
| 🟡 **Pendiente** | Reserva recién creada, presupuesto en revisión |
| 🟢 **Confirmada** | Presupuesto aceptado por ambas partes |
| 🔴 **Cancelada** | Reserva cancelada |

### Crear una reserva manual

Útil para clientes que contactan por teléfono o en persona.

1. Pulsa **Nueva reserva**.
2. Introduce los datos del cliente manualmente (nombre, DNI, email, teléfono y dirección).
3. Selecciona los equipos y DJs, fechas y ubicación.
4. Confirma — se generará automáticamente el presupuesto.

> [!IMPORTANT]
> Las reservas manuales no quedan vinculadas a ninguna cuenta de usuario. El cliente no podrá verlas en su panel de **Mis Pedidos** a menos que tenga una cuenta registrada con el mismo email.

### Cancelar una reserva

1. Localiza la reserva en la lista.
2. Cambia el estado a **Cancelada**.

> [!WARNING]
> Cancelar una reserva **no** reembolsa automáticamente ningún pago. Gestiona los reembolsos de forma manual si fuera necesario.

---

## Gestión de presupuestos

Aquí gestionas los presupuestos generados a partir de las reservas. El flujo de estados es el siguiente:

    Pendiente → Aceptado por el cliente → Aceptado (tú) → Factura generada
                                        ↘ Rechazado (tú)
              → Rechazado (cliente)

### Confirmar un presupuesto

1. Localiza el presupuesto con estado **Aceptado por el cliente**.
2. Revisa el desglose de conceptos y el total.
3. Pulsa **Confirmar** — la reserva pasará a **Confirmada** y se generará la factura automáticamente.

> [!NOTE]
> La factura se genera con el número correlativo `FAC-{AÑO}-{XXXX}` de forma automática en el momento de la confirmación.

### Rechazar un presupuesto

1. Localiza el presupuesto.
2. Pulsa **Rechazar** — la reserva pasará a **Cancelada**.

> [!WARNING]
> Rechazar un presupuesto es una acción irreversible. El cliente recibirá la actualización de estado en su panel de **Mis Pedidos**.

---

## Datos de la empresa

Desde esta sección configuras los datos fiscales que aparecen en los presupuestos y facturas.

### Campos disponibles

- Nombre de la empresa
- CIF
- Dirección completa (calle, CP, localidad, provincia)
- Email de contacto
- Teléfono
- IBAN bancario
- Logo (imagen para cabeceras de documentos)

### Actualizar los datos

1. Ve a la sección **Datos de empresa** en el panel.
2. Modifica los campos necesarios.
3. Pulsa **Guardar**.

> [!IMPORTANT]
> Estos datos aparecen impresos en todos los documentos generados (presupuestos y facturas). Asegúrate de que el CIF y el IBAN son correctos antes de confirmar ningún presupuesto.

> [!TIP]
> Sube el logo en formato PNG con fondo transparente para que se vea correctamente en todos los documentos.

---

*DISCOMOVIL POWERPLAY · Panel de administración — Acceso restringido*
