import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

function FadeSection({ children }) {
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      },
      { threshold: 0.15 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        transform: "translateY(40px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      {children}
    </div>
  );
}

export default function Inicio() {
  return (
    <div>
      {/* Hero */}
      <section
        style={{ position: "relative", height: "100vh", overflow: "hidden" }}
      >
        <img
          src="/hero.jpg"
          alt="Power Play en acción"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 30%",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, #0d0d0d 0%, rgba(13,13,13,0.5) 50%, rgba(13,13,13,0.2) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            textAlign: "center",
            padding: "0 2rem 55vh",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "#FFE600",
              marginBottom: "1rem",
            }}
          >
            Discomóvil · Sonido · Iluminación
          </p>

          <h1
            style={{
              fontFamily: "Bebas Neue",
              fontSize: "clamp(4rem, 12vw, 9rem)",
              letterSpacing: "0.1em",
              color: "#fff",
              lineHeight: 1,
              textShadow:
                "0 0 1px #FFE600, 0 0 8px #FFE600, 0 0 0px rgba(255,230,0,0.5)",
            }}
          >
            POWER PLAY
          </h1>
        </div>

        {/* Flecha scroll */}
        <div
          style={{
            position: "absolute",
            bottom: "2.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            Descubre más
          </span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: "bounce 2s infinite" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(6px); }
        }
      `}</style>

      {/* Cómo funciona */}
      <section style={{ background: "#0d0d0d", padding: "6rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <FadeSection>
            <p
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#FFE600",
                textAlign: "center",
                marginBottom: "1rem",
              }}
            >
              Proceso
            </p>

            <h2
              style={{
                fontFamily: "Bebas Neue",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                textAlign: "center",
                color: "#fff",
                letterSpacing: "0.05em",
                marginBottom: "4rem",
              }}
            >
              ¿Cómo funciona?
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "2rem",
              }}
            >
              {[
                {
                  num: "01",
                  titulo: "Elige tu servicio",
                  desc: "Explora nuestro catálogo de equipos de sonido, iluminación y DJs. Filtra por tipo, precio o disponibilidad.",
                },
                {
                  num: "02",
                  titulo: "Solicita presupuesto",
                  desc: "Añade los servicios al carrito y envía tu solicitud. Recibirás un presupuesto personalizado de manera automática.",
                },
                {
                  num: "03",
                  titulo: "Disfruta tu evento",
                  desc: "Acepta el presupuesto, confirma la reserva y déjanos el resto. Nosotros nos encargamos de todo.",
                },
              ].map(({ num, titulo, desc }) => (
                <div
                  key={num}
                  style={{
                    background: "#141414",
                    border: "1px solid rgba(255,255,255,0.06)",
                    padding: "2.5rem 2rem",
                    transition: "border-color 0.3s, transform 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#ecd60b4d";
                    e.currentTarget.style.transform = "translateY(-4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.06)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Bebas Neue",
                      fontSize: "3.5rem",
                      color: "rgba(255,230,0,0.15)",
                      lineHeight: 1,
                      display: "block",
                      marginBottom: "1rem",
                    }}
                  >
                    {num}
                  </span>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: "0.75rem",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {titulo}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "rgba(255,255,255,0.5)",
                      lineHeight: 1.7,
                    }}
                  >
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* Botón reserva */}
      <section style={{ background: "#0d0d0d", padding: "0 2rem 6rem" }}>
        <div
          style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}
        >
          <Link
            to="/servicios"
            style={{
              display: "inline-block",
              background: "#FFE600",
              color: "#000",
              fontFamily: "Bebas Neue",
              fontSize: "1.3rem",
              letterSpacing: "0.15em",
              padding: "1rem 3rem",
              textDecoration: "none",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow =
                "0 8px 30px rgba(255,230,0,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Hacer una reserva →
          </Link>
        </div>
      </section>

      {/* Sección Eventos */}
      <section
        style={{
          background: "#111",
          padding: "6rem 2rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "3rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: "260px" }}>
            <p
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#FFE600",
                marginBottom: "1rem",
              }}
            >
              Agenda
            </p>
            <h2
              style={{
                fontFamily: "Bebas Neue",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                color: "#fff",
                letterSpacing: "0.05em",
                lineHeight: 1.1,
                marginBottom: "1.25rem",
              }}
            >
              ¿Quieres saber dónde
              <br />
              estaremos?
            </h2>
            <p
              style={{
                fontSize: "0.9rem",
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.8,
                maxWidth: "420px",
              }}
            >
              Consulta nuestro apartado dedicado a todos los eventos y fiestas en los
              que vamos a participar. Consulta fechas, lugares y no te pierdas
              ninguna.
            </p>
          </div>
          <div>
            <Link
              to="/eventos"
              style={{
                display: "inline-block",
                border: "1px solid #FFE600",
                color: "#FFE600",
                fontFamily: "Bebas Neue",
                fontSize: "1.3rem",
                letterSpacing: "0.15em",
                padding: "1rem 2.5rem",
                textDecoration: "none",
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#FFE600";
                e.currentTarget.style.color = "#000";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#FFE600";
              }}
            >
              Ver eventos →
            </Link>
          </div>
        </div>
      </section>
      {/* Contacta con nosotros */}
      <section
        style={{
          background: "#0d0d0d",
          padding: "6rem 2rem",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}
        >
          <FadeSection>
            <p
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "#FFE600",
                marginBottom: "1rem",
              }}
            >
              Contacto
            </p>
            <h2
              style={{
                fontFamily: "Bebas Neue",
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                color: "#fff",
                letterSpacing: "0.05em",
                marginBottom: "1.25rem",
              }}
            >
              ¿Tienes algo en mente?
            </h2>
            <p
              style={{
                fontSize: "0.9rem",
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.8,
                maxWidth: "480px",
                margin: "0 auto 2.5rem",
              }}
            >
              Cuéntanos qué necesitas. Nuestro equipo te responderá con 
              las respuestas que más se ajusten a tu caso en particular.
            </p>
            <Link
              to="/contacto"
              style={{
                display: "inline-block",
                background: "#FFE600",
                color: "#000",
                fontFamily: "Bebas Neue",
                fontSize: "1.3rem",
                letterSpacing: "0.15em",
                padding: "1rem 3rem",
                textDecoration: "none",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 30px rgba(255,230,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Contactar ahora →
            </Link>
          </FadeSection>
        </div>
      </section>
    </div>
  );
}
