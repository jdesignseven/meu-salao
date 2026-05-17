import { Link } from 'react-router-dom'
import './Landing.css'

function Landing() {
  return (
    <div className="landing">
      <header className="header">
        <div className="container header-content">
          <div className="logo" style={{ fontSize: '24px', fontWeight: 700, color: '#005DA8', fontFamily: "'Coolvetica Book', sans-serif" }}>beautysis</div>
          <nav className="nav">
            <Link to="/login">Área do usuário</Link>
          </nav>
        </div>
      </header>

      <section id="home" className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <img src="/images/logo_secvc_beauty_branca.png" alt="beautysis logo" className="hero-logo" />
            <p className="hero-subtitle hero-subtitle-main">
              Agende seu horário
            </p>
            <p className="hero-subtitle" style={{ fontSize: '18px' }}>
              Escolha a opção para agendar conforme seu cadastro no salão.
            </p>
            <p className="hero-subtitle" style={{ fontSize: '18px', marginTop: '-16px' }}>
              É fácil e prático!
            </p>
            <p className="hero-subtitle hero-subtitle-select">
              Selecione uma opção:
            </p>
            <div className="hero-actions">
              <Link to="/agendamento" className="btn-cta">
                👤 Ja sou Cliente
              </Link>
              <Link to="/pre-register" className="btn-agendamento">
                ✨ Cliente Novo
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-section">
            <h3 style={{ fontFamily: "'Coolvetica Book', sans-serif" }}>beautysis</h3>
            <p>(77) 3421-2963</p>
            <p>superintendencia@secvc.com.br</p>
          </div>
          <div className="footer-section">
            <h3>Links</h3>
            <Link to="/login">Entrar no Sistema</Link>
            <Link to="/agendamento">Agendamento</Link>
            <Link to="/register">Cadastre-se</Link>
          </div>
          <div className="footer-section">
            <h3>Recursos</h3>
            <a href="#home">Inicio</a>
            <a href="#contact">Contato</a>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            2026 © <span style={{ fontFamily: "'Coolvetica Book', sans-serif" }}>beautysis</span> - Todos os direitos reservados
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
