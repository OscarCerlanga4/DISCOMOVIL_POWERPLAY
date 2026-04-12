export default function Eventos() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{
        fontFamily: 'Bebas Neue',
        fontSize: 'clamp(3rem, 8vw, 6rem)',
        letterSpacing: '0.1em',
        color: '#fff',
        textShadow: '0 0 20px #FFE600, 0 0 60px #FFE600'
      }}>Próximos Eventos</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem' }}>
        Próximamente...
      </p>
    </div>
  )
}
