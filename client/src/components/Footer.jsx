import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      style={{
        background: "#0a0a0a",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "4rem 2rem 2rem",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Fila superior */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: "3rem",
            marginBottom: "3rem",
          }}
        >
          {/* Marca */}
          <div>
            <span
              style={{
                fontFamily: "Bebas Neue",
                fontSize: "1.8rem",
                letterSpacing: "0.15em",
                color: "#FFE600",
                display: "block",
                marginBottom: "0.75rem",
              }}
            >
              POWER PLAY
            </span>
            <p
              style={{
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.4)",
                lineHeight: 1.8,
                maxWidth: "280px",
              }}
            >
              Discomóvil profesional con más de 15 años de experiencia en
              eventos, bodas, festivales y celebraciones en Aragón y
              alrededores.
            </p>
          </div>

          {/* Navegación */}
          <div>
            <p
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                marginBottom: "1.25rem",
              }}
            >
              Navegación
            </p>
            <ul
              style={{
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {[
                ["/", "Inicio"],
                ["/eventos", "Eventos"],
                ["/servicios", "Servicios"],
                ["/contacto", "Contacto"],
              ].map(([to, label]) => (
                <li key={to}>
                  <Link
                    to={to}
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      textDecoration: "none",
                      fontSize: "0.875rem",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#FFE600")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "rgba(255,255,255,0.5)")
                    }
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <p
              style={{
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.25)",
                marginBottom: "1.25rem",
              }}
            >
              Contacto
            </p>
            <ul
              style={{
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <li
                style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)" }}
              >
                Tauste, Zaragoza
              </li>
              <li>
                <a
                  href="tel:+34615986488"
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#FFE600")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.5)")
                  }
                >
                  +34 615 986 488
                </a>
              </li>
              <li>
                <a
                  href="powerplay_@hotmail.com"
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#FFE600")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.5)")
                  }
                >
                  powerplay_@hotmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea divisoria */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.2)" }}>
            © {new Date().getFullYear()} Discomóvil Powerplay · Todos los
            derechos reservados
          </p>

          {/* Redes sociales */}
          <div style={{ display: "flex", gap: "1rem" }}>
            {[
              {
                href: "https://www.instagram.com/powerplay_discomovil/",
                label: "Instagram",
                path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
              },
              {
                href: "https://facebook.com/pipo.keguay",
                label: "Facebook",
                path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
              }
            ].map(({ href, label, path }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "rgba(255,255,255,0.3)",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#FFE600")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.3)")
                }
                title={label}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d={path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
