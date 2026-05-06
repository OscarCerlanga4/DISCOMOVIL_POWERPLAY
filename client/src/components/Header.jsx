import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useCarrito } from "../contexts/CarritoContext";

export default function Header() {
  const location = useLocation()
  const [scrolled, setScrolled] = useState()
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [menuMovil, setMenuMovil] = useState(false);
  const [esMovil, setEsMovil] = useState(window.innerWidth < 900);
  const { usuario, logout } = useAuth();
  const { items } = useCarrito();
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => setEsMovil(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 60) };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuAbierto(false);
    navigate("/");
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 50,
        background: scrolled ? "rgba(17,17,17,0.92)" : "transparent",
        borderBottom: scrolled ? "1px solid rgba(255,230,0,0.2)" : "none",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        transition: "all 0.4s ease",
      }}
    >
      <div style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        padding: "1rem 2rem",
        gap: "2rem",
      }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none", flex: "0 0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span
              style={{
                fontFamily: "Bebas Neue",
                fontSize: "1.5rem",
                letterSpacing: "0.15em",
                color: "#FFE600",
                lineHeight: 1,
                transition: "text-shadow 0.3s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textShadow = "0 0 20px rgba(255,230,0,0.7)")}
              onMouseLeave={(e) => (e.currentTarget.style.textShadow = "none")}
            >
              POWER PLAY
            </span>
            <span style={{
              fontSize: "0.45rem",
              letterSpacing: "0.6em",
              color: "rgba(255,255,255,0.4)",
              marginTop: "3px",
              filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))",
            }}>
              DISCO MOVIL
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          display: esMovil ? "none" : "flex",
          gap: "2.5rem",
        }}>
          {[
            ["/", "Inicio"],
            ["/eventos", "Eventos"],
            ["/servicios", "Servicios"],
            ["/contacto", "Contacto"],
          ].map(([path, label]) => (
            <Link
              key={path}
              to={path}
              style={{
                color: "#fff",
                textDecoration: "none",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                transition: "color 0.2s",
                textShadow: "0 1px 8px rgba(0,0,0,0.8)",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FFE600")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Derecha */}
        <div 
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "1rem" }}
        >
        {/* Botón hamburguesa - solo en móvil */}
        {esMovil && (
        <button
          onClick={() => setMenuMovil(!menuMovil)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#FFE600",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "5px",
            padding: "0.3rem",
          }}
          aria-label="Menú"
        >
          <span style={{
            display: "block",
            width: "22px",
            height: "2px",
            background: "#FFE600",
            transition: "all 0.3s",
            transform: menuMovil ? "rotate(45deg) translate(5px, 5px)" : "none",
          }} />
          <span style={{
            display: "block",
            width: "22px",
            height: "2px",
            background: "#FFE600",
            transition: "all 0.3s",
            opacity: menuMovil ? 0 : 1,
          }} />
          <span style={{
            display: "block",
            width: "22px",
            height: "2px",
            background: "#FFE600",
            transition: "all 0.3s",
            transform: menuMovil ? "rotate(-45deg) translate(5px, -5px)" : "none",
          }} />
        </button>
      )}

          {!esMovil && (usuario ? (
            <div
              style={{ position: "relative" }}
              onMouseEnter={() => setMenuAbierto(true)}
              onMouseLeave={() => setMenuAbierto(false)}
            >
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#FFE600",
                  textShadow: "0 1px 8px rgba(0,0,0,0.8)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                {usuario.nombre}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transition: "transform 0.2s", transform: menuAbierto ? "rotate(180deg)" : "rotate(0deg)" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {menuAbierto && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  paddingTop: "0.5rem",
                  minWidth: "200px",
                  zIndex: 100,
                }}>
                  <div style={{
                    background: "#111",
                    border: "1px solid rgba(255,230,0,0.15)",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
                  }}>
                    {[
                      usuario?.rol === 'admin'
                        ? { label: "Panel Admin", to: "/admin" }
                        : { label: "Mis pedidos", to: "/mis-pedidos" },
                      { label: "Mis datos", to: "/mis-datos" },
                    ].map(({ label, to }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setMenuAbierto(false)}
                        style={{
                          display: "block",
                          padding: "0.85rem 1.25rem",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.7)",
                          textDecoration: "none",
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                          transition: "color 0.2s, background 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#FFE600";
                          e.currentTarget.style.background = "rgba(255,230,0,0.04)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {label}
                      </Link>
                    ))}

                    <button
                      onClick={handleLogout}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "0.85rem 1.25rem",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "rgba(255,100,100,0.8)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        transition: "color 0.2s, background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#ff4444";
                        e.currentTarget.style.background = "rgba(255,0,0,0.04)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "rgba(255,100,100,0.8)";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.7)",
                padding: "0.45rem 1.1rem",
                textDecoration: "none",
                whiteSpace: "nowrap",
                transition: "color 0.2s",
                textShadow: "0 1px 8px rgba(0,0,0,0.8)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#FFE600")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
            >
              Iniciar sesión
            </Link>
          ))}

          {/* Carrito - solo escritorio */}
          {!esMovil && (
          <Link
            to="/carrito"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              textDecoration: "none",
              color: "rgba(255,255,255,0.6)",
              transition: "color 0.2s",
              padding: "0.3rem",
              filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))",
              position: "relative",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FFE600")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            title="Carrito"
          >
            {items.length > 0 && (
              <span style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                background: "#FFE600",
                color: "#000",
                fontSize: "0.6rem",
                fontWeight: 700,
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1,
              }}>
                {items.length}
              </span>
            )}
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span style={{
              fontSize: "0.5rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}>
              Carrito
            </span>
          </Link>
          )}
        </div>
      </div>
      {/* Menú móvil desplegable */}
      {esMovil && menuMovil && (
        <div style={{
          background: "rgba(17,17,17,0.97)",
          borderTop: "1px solid rgba(255,230,0,0.15)",
          backdropFilter: "blur(12px)",
          padding: "1rem 0",
        }}>
          {[
            ["/", "Inicio"],
            ["/eventos", "Eventos"],
            ["/servicios", "Servicios"],
            ["/contacto", "Contacto"],
          ].map(([path, label]) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMenuMovil(false)}
              style={{
                display: "block",
                padding: "0.9rem 2rem",
                color: "#fff",
                textDecoration: "none",
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                transition: "color 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#FFE600";
                e.currentTarget.style.background = "rgba(255,230,0,0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {label}
            </Link>
          ))}

          {/* Separador con opciones de usuario */}
          <div style={{ borderTop: "1px solid rgba(255,230,0,0.15)", marginTop: "0.5rem", paddingTop: "0.5rem" }}>
            <Link
              to="/carrito"
              onClick={() => setMenuMovil(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "0.9rem 2rem",
                color: "rgba(255,255,255,0.7)",
                textDecoration: "none",
                fontSize: "0.8rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
              Carrito {items.length > 0 && `(${items.length})`}
            </Link>
            {usuario ? (
              <>
                <Link
                  to={usuario?.rol === 'admin' ? "/admin" : "/mis-pedidos"}
                  onClick={() => setMenuMovil(false)}
                  style={{
                    display: "block",
                    padding: "0.9rem 2rem",
                    color: "rgba(255,255,255,0.7)",
                    textDecoration: "none",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {usuario?.rol === 'admin' ? "Panel Admin" : "Mis pedidos"}
                </Link>
                <Link
                  to="/mis-datos"
                  onClick={() => setMenuMovil(false)}
                  style={{
                    display: "block",
                    padding: "0.9rem 2rem",
                    color: "rgba(255,255,255,0.7)",
                    textDecoration: "none",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Mis datos
                </Link>
                <button
                  onClick={() => { handleLogout(); setMenuMovil(false); }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.9rem 2rem",
                    color: "rgba(255,100,100,0.8)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuMovil(false)}
                style={{
                  display: "block",
                  padding: "0.9rem 2rem",
                  color: "#FFE600",
                  textDecoration: "none",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}