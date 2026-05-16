export default function PoliticasPrivacidad() {
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
          Política de Privacidad
        </h1>
        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", marginBottom: "2.5rem" }}>
          Última actualización: mayo de 2026
        </p>

        {parrafo(
          "En Discomóvil Powerplay nos tomamos muy en serio la privacidad de nuestros clientes y usuarios. Esta Política de Privacidad explica cómo recogemos, usamos y protegemos tus datos personales cuando utilizas nuestro sitio web y contratas nuestros servicios."
        )}

        {seccion("1. Responsable del Tratamiento")}
        {parrafo("Titular: Discomóvil Powerplay")}
        {parrafo("Domicilio: Tauste, Zaragoza (España)")}
        {parrafo("Teléfono de contacto: +34 615 986 488")}
        {parrafo("Correo electrónico: powerplay_@hotmail.com")}

        {seccion("2. Datos que Recopilamos")}
        {parrafo(
          "Recogemos los datos que tú mismo nos proporcionas al registrarte, realizar un pedido o contactar con nosotros. Estos datos pueden incluir:"
        )}
        <ul style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.925rem", lineHeight: 2, paddingLeft: "1.5rem", marginBottom: "0.75rem" }}>
          <li>Nombre y apellidos</li>
          <li>Dirección de correo electrónico</li>
          <li>Número de teléfono</li>
          <li>Dirección postal (cuando sea necesaria para la prestación del servicio)</li>
          <li>Información sobre los servicios contratados y eventos asociados</li>
          <li>Datos de navegación (a través de cookies técnicas)</li>
        </ul>
        {parrafo(
          "No recopilamos datos de carácter especialmente sensible (salud, ideología, etc.) ni datos de menores de 14 años sin el consentimiento expreso de sus tutores legales."
        )}

        {seccion("3. Finalidad del Tratamiento")}
        {parrafo("Utilizamos tus datos personales para los siguientes fines:")}
        <ul style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.925rem", lineHeight: 2, paddingLeft: "1.5rem", marginBottom: "0.75rem" }}>
          <li>Gestionar tu cuenta de usuario y el acceso a la plataforma</li>
          <li>Procesar y confirmar los pedidos o presupuestos solicitados</li>
          <li>Comunicarnos contigo en relación con los servicios contratados</li>
          <li>Responder a las consultas y solicitudes enviadas a través del formulario de contacto</li>
          <li>Cumplir con las obligaciones legales y fiscales aplicables</li>
        </ul>

        {seccion("4. Base Legal del Tratamiento")}
        {parrafo(
          "El tratamiento de tus datos se fundamenta en las siguientes bases legales, según la finalidad:"
        )}
        <ul style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.925rem", lineHeight: 2, paddingLeft: "1.5rem", marginBottom: "0.75rem" }}>
          <li><strong style={{ color: "rgba(255,255,255,0.85)" }}>Ejecución de un contrato:</strong> cuando los datos son necesarios para prestarte el servicio contratado.</li>
          <li><strong style={{ color: "rgba(255,255,255,0.85)" }}>Consentimiento:</strong> cuando nos has dado tu autorización expresa para tratar tus datos con una finalidad concreta.</li>
          <li><strong style={{ color: "rgba(255,255,255,0.85)" }}>Interés legítimo:</strong> para la gestión interna de la actividad y la mejora de nuestros servicios.</li>
          <li><strong style={{ color: "rgba(255,255,255,0.85)" }}>Obligación legal:</strong> cuando la ley nos exige conservar o comunicar determinados datos.</li>
        </ul>

        {seccion("5. Conservación de los Datos")}
        {parrafo(
          "Conservamos tus datos personales durante el tiempo necesario para cumplir con la finalidad para la que fueron recogidos y, en todo caso, durante los plazos legalmente exigidos. Los datos asociados a pedidos o contratos se conservan durante un mínimo de 5 años por obligaciones fiscales y mercantiles. Si solicitas la supresión de tu cuenta, procederemos al borrado de los datos que no estemos obligados a conservar por ley."
        )}

        {seccion("6. Cesión de Datos a Terceros")}
        {parrafo(
          "No vendemos ni cedemos tus datos personales a terceros con fines comerciales. Únicamente podemos compartir información con:"
        )}
        <ul style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.925rem", lineHeight: 2, paddingLeft: "1.5rem", marginBottom: "0.75rem" }}>
          <li>Proveedores tecnológicos que prestan servicios de alojamiento y base de datos (Supabase), bajo contrato de encargo del tratamiento.</li>
          <li>Organismos públicos o autoridades cuando exista obligación legal de hacerlo.</li>
        </ul>

        {seccion("7. Tus Derechos")}
        {parrafo(
          "De acuerdo con el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), tienes los siguientes derechos sobre tus datos:"
        )}
        <ul style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.925rem", lineHeight: 2, paddingLeft: "1.5rem", marginBottom: "0.75rem" }}>
          <li><strong style={{ color: "rgba(255,255,255,0.85)" }}>Acceso:</strong> conocer qué datos tenemos sobre ti.</li>
          <li><strong style={{ color: "rgba(255,255,255,0.85)" }}>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
          <li><strong style={{ color: "rgba(255,255,255,0.85)" }}>Supresión:</strong> solicitar el borrado de tus datos cuando ya no sean necesarios.</li>
          <li><strong style={{ color: "rgba(255,255,255,0.85)" }}>Oposición:</strong> oponerte al tratamiento de tus datos en determinadas circunstancias.</li>
          <li><strong style={{ color: "rgba(255,255,255,0.85)" }}>Limitación:</strong> solicitar que suspendamos temporalmente el tratamiento.</li>
          <li><strong style={{ color: "rgba(255,255,255,0.85)" }}>Portabilidad:</strong> recibir tus datos en un formato estructurado y legible por máquina.</li>
        </ul>
        {parrafo(
          "Para ejercer cualquiera de estos derechos, contacta con nosotros en powerplay_@hotmail.com indicando claramente el derecho que deseas ejercer y adjuntando una copia de tu documento de identidad. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es)."
        )}

        {seccion("8. Cookies")}
        {parrafo(
          "Nuestro sitio web utiliza únicamente cookies técnicas estrictamente necesarias para el correcto funcionamiento de la plataforma (gestión de sesión, carrito de servicios, etc.). No utilizamos cookies de rastreo publicitario ni de terceros con fines de análisis de comportamiento."
        )}

        {seccion("9. Seguridad")}
        {parrafo(
          "Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos contra el acceso no autorizado, la pérdida o la destrucción. Los datos se almacenan en infraestructura cloud con cifrado en tránsito (HTTPS) y en reposo."
        )}

        {seccion("10. Modificaciones de esta Política")}
        {parrafo(
          "Nos reservamos el derecho a actualizar esta Política de Privacidad para adaptarla a cambios legislativos o de negocio. Te notificaremos cualquier cambio relevante a través del correo electrónico asociado a tu cuenta o mediante un aviso visible en el sitio web."
        )}
      </div>
    </div>
  );
}