export default function CondicionesUso() {
  const seccion = (titulo) => (
    <h2
      style={{
        fontFamily: "Bebas Neue",
        fontSize: "1.4rem",
        letterSpacing: "0.1em",
        color: "#FFE600",
        marginTop: "2.5rem",
        marginBottom: "0.75rem",
      }}
    >
      {titulo}
    </h2>
  );

  const parrafo = (texto) => (
    <p
      style={{
        fontSize: "0.925rem",
        color: "rgba(255,255,255,0.65)",
        lineHeight: 1.85,
        marginBottom: "0.75rem",
      }}
    >
      {texto}
    </p>
  );

  return (
    <div style={{ background: "#0d0d0d", minHeight: "100vh", padding: "4rem 2rem" }}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        <h1
          style={{
            fontFamily: "Bebas Neue",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            letterSpacing: "0.12em",
            color: "#fff",
            marginBottom: "0.5rem",
          }}
        >
          Condiciones de Uso
        </h1>
        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", marginBottom: "2.5rem" }}>
          Última actualización: mayo de 2026
        </p>

        {parrafo(
          "Las presentes Condiciones de Uso regulan el acceso y la utilización del sitio web de Discomóvil Powerplay, así como la contratación de los servicios ofertados a través de la plataforma. Al registrarte o usar este sitio web, aceptas expresamente estas condiciones en su totalidad."
        )}

        {seccion("1. Identificación del Titular")}
        {parrafo("Titular: Discomóvil Powerplay")}
        {parrafo("Domicilio: Tauste, Zaragoza (España)")}
        {parrafo("Teléfono: +34 615 986 488")}
        {parrafo("Correo electrónico: powerplay_@hotmail.com")}

        {seccion("2. Objeto")}
        {parrafo(
          "Discomóvil Powerplay es una empresa de entretenimiento y sonorización para eventos privados y públicos con más de 15 años de experiencia en Aragón y sus alrededores. A través de esta plataforma, los usuarios pueden consultar los servicios disponibles, solicitar presupuestos personalizados y completar la contratación de los mismos."
        )}

        {seccion("3. Registro de Usuario")}
        {parrafo(
          "Para realizar pedidos o solicitar presupuestos es necesario crear una cuenta de usuario. Al registrarte te comprometes a:"
        )}
        <ul style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.925rem", lineHeight: 2, paddingLeft: "1.5rem", marginBottom: "0.75rem" }}>
          <li>Proporcionar datos verídicos, completos y actualizados.</li>
          <li>Mantener la confidencialidad de tus credenciales de acceso.</li>
          <li>Notificarnos de inmediato si detectas un uso no autorizado de tu cuenta.</li>
          <li>Ser mayor de 18 años o contar con el consentimiento de tu tutor legal.</li>
        </ul>
        {parrafo(
          "Nos reservamos el derecho a suspender o cancelar cuentas que incumplan estas condiciones, aporten datos falsos o hagan un uso fraudulento de la plataforma."
        )}

        {seccion("4. Servicios Ofrecidos")}
        {parrafo(
          "Discomóvil Powerplay ofrece servicios de sonorización, iluminación y animación para todo tipo de eventos: bodas, comuniones, fiestas privadas, festivales, eventos corporativos y más. Los servicios disponibles se describen en detalle en la sección \"Servicios\" de la web y pueden incluir:"
        )}
        <ul style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.925rem", lineHeight: 2, paddingLeft: "1.5rem", marginBottom: "0.75rem" }}>
          <li>Equipos de sonido e iluminación profesional</li>
          <li>Servicio de DJ y animación</li>
          <li>Packs combinados para eventos específicos</li>
          <li>Servicios adicionales o complementos según disponibilidad</li>
        </ul>
        {parrafo(
          "La disponibilidad de los servicios puede variar en función de la fecha, la ubicación y la agenda. Nos reservamos el derecho a modificar el catálogo de servicios sin previo aviso."
        )}

        {seccion("5. Proceso de Contratación")}
        {parrafo("El proceso para contratar un servicio a través de la plataforma es el siguiente:")}
        <ol style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.925rem", lineHeight: 2.2, paddingLeft: "1.5rem", marginBottom: "0.75rem" }}>
          <li>Selecciona los servicios que deseas en el catálogo y añádelos al carrito.</li>
          <li>Revisa tu selección en el carrito y accede al proceso de pago.</li>
          <li>Introduce los datos del evento (fecha, lugar, detalles adicionales) y los datos de pago.</li>
          <li>Confirma el pedido. Recibirás un correo electrónico con el resumen de tu solicitud.</li>
          <li>Nuestro equipo revisará la disponibilidad y se pondrá en contacto contigo para confirmar el servicio y cerrar los detalles finales.</li>
        </ol>
        {parrafo(
          "La contratación no se considera definitivamente confirmada hasta que Discomóvil Powerplay emita la confirmación expresa por escrito (correo electrónico o similar)."
        )}

        {seccion("6. Precios y Pagos")}
        {parrafo(
          "Los precios indicados en la plataforma están expresados en euros e incluyen el IVA aplicable, salvo que se indique lo contrario. Nos reservamos el derecho a modificar los precios en cualquier momento; los cambios no afectarán a los pedidos ya confirmados."
        )}
        {parrafo(
          "El pago se realiza íntegramente en el momento de la contratación a través de los métodos habilitados en la plataforma. En caso de pedidos con presupuesto personalizado, se podrá acordar una modalidad de pago fraccionado (señal + pago final) según lo pactado con el cliente."
        )}

        {seccion("7. Obligaciones del Usuario")}
        {parrafo("Al utilizar nuestros servicios, el usuario se compromete a:")}
        <ul style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.925rem", lineHeight: 2, paddingLeft: "1.5rem", marginBottom: "0.75rem" }}>
          <li>No hacer un uso fraudulento o ilícito de la plataforma.</li>
          <li>No intentar acceder a áreas restringidas del sistema.</li>
          <li>No reproducir, distribuir ni explotar el contenido del sitio web sin autorización expresa.</li>
          <li>Asegurarse de que la información facilitada (fechas, lugar del evento, datos de contacto) es correcta y veraz.</li>
        </ul>

        {seccion("8. Propiedad Intelectual")}
        {parrafo(
          "Todos los contenidos de este sitio web — textos, imágenes, logotipos, diseños, código fuente — son propiedad de Discomóvil Powerplay o de sus legítimos titulares, y están protegidos por la legislación española e internacional sobre propiedad intelectual. Queda prohibida su reproducción total o parcial sin autorización escrita."
        )}

        {seccion("9. Limitación de Responsabilidad")}
        {parrafo(
          "Discomóvil Powerplay no se hace responsable de los daños derivados de interrupciones del servicio web por causas ajenas a nuestra voluntad (fallos de terceros proveedores, cortes de suministro, ataques informáticos, etc.). En ningún caso nuestra responsabilidad por los servicios contratados superará el importe efectivamente abonado por el cliente para ese servicio concreto."
        )}

        {seccion("10. Modificación de las Condiciones")}
        {parrafo(
          "Nos reservamos el derecho a modificar estas Condiciones de Uso en cualquier momento. Las modificaciones entrarán en vigor desde su publicación en el sitio web. El uso continuado de la plataforma tras la publicación de cambios implica la aceptación de las nuevas condiciones."
        )}

        {seccion("11. Ley Aplicable y Jurisdicción")}
        {parrafo(
          "Las presentes Condiciones de Uso se rigen por la legislación española. Para la resolución de cualquier controversia derivada de su interpretación o cumplimiento, las partes se someten a los Juzgados y Tribunales de Zaragoza, con renuncia expresa a cualquier otro fuero que pudiera corresponderles."
        )}
      </div>
    </div>
  );
}