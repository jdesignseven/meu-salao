import { Link } from 'react-router-dom'
import './Landing.css'

function Landing() {
  return (
    <div className="landing">
      <header className="header">
        <div className="container header-content">
          <div className="logo">
            <img src="https://via.placeholder.com/150x50/3498db/ffffff?text=beautysis" alt="beautysis" />
          </div>
          <nav className="nav">
            <a href="#home">Home</a>
            <a href="#recursos">Recursos</a>
            <a href="#precos">Preços</a>
            <a href="#contato">Contato</a>
          </nav>
          <div className="header-actions">
            <Link to="/login" className="btn-login">Entrar</Link>
            <Link to="/register" className="btn-primary">Experimente Grátis</Link>
          </div>
        </div>
      </header>

      <section id="home" className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <h1>Agenda Online com WhatsApp Automático e Gestão Financeira</h1>
            <p className="hero-subtitle">
              Estamos no mercado desde 2024 com centenas de clientes em todo o Brasil que confiam e indicam o beautysis.
            </p>
            <ul className="hero-benefits">
              <li>Reduza em até 50% a falta de clientes</li>
              <li>Envio automático de WhatsApp com confirmação</li>
              <li>Aumente em até 20% o faturamento com agendamentos online</li>
            </ul>
            <Link to="/register" className="btn-cta">EXPERIMENTE GRÁTIS</Link>
          </div>
          <div className="hero-image">
            <div className="device-mockup">
              <div className="browser-bar">
                <span className="browser-dot"></span>
                <span className="browser-dot"></span>
                <span className="browser-dot"></span>
              </div>
              <div className="device-screen">
                <h3>Agenda Online</h3>
                <div className="mock-appointment">09:00 - João Silva - Corte</div>
                <div className="mock-appointment">10:00 - Maria Santos - Escova</div>
                <div className="mock-appointment">11:00 - Pedro Lima - Barba</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="features">
        <div className="container">
          <h2 className="section-title">Conheça o beautysis</h2>
          <p className="section-subtitle">Agenda Online, Gestão Financeira e Fluxo de Caixa</p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Agenda Online</h3>
              <p>Visualize e organize sua agenda por profissional. Acesse de qualquer lugar.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Fluxo de Caixa</h3>
              <p>Controle o Fluxo de Caixa de forma simples. Com apenas um clique você tem o resumo completo.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Agendamento pelo Cliente</h3>
              <p>Libere o link da sua agenda online e o próprio cliente faz o agendamento.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Controle Financeiro</h3>
              <p>Acompanhamento completo do contas a receber e a pagar de sua empresa.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>App Mobile</h3>
              <p>Acompanhe seu negócio e seus clientes com conforto e liberdade.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">🔔</div>
              <h3>Alertas via WhatsApp</h3>
              <p>Notificamos seus clientes sobre os agendamentos automaticamente.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="multi-device">
        <div className="container">
          <h2 className="section-title">Disponível em qualquer dispositivo</h2>
          <p className="section-subtitle">Controle tudo na palma da sua mão</p>
          <div className="devices-showcase">
            <div className="device-item">
              <div className="phone-mockup">
                <div className="phone-screen">
                  <p>Agenda de Hoje</p>
                  <div className="phone-apt">09:00 João</div>
                  <div className="phone-apt">10:00 Maria</div>
                </div>
              </div>
              <p>Celular</p>
            </div>
            <div className="device-item">
              <div className="tablet-mockup">
                <div className="tablet-screen">
                  <h4>beautysis Agenda</h4>
                  <p>Visualize todos os agendamentos</p>
                </div>
              </div>
              <p>Tablet</p>
            </div>
            <div className="device-item">
              <div className="desktop-mockup">
                <div className="desktop-screen">
                  <h4>Painel Completo</h4>
                  <p>Gestão total do seu salão</p>
                </div>
              </div>
              <p>Computador</p>
            </div>
          </div>
        </div>
      </section>

      <section className="clients">
        <div className="container">
          <h2 className="section-title">Alguns clientes que estão adorando o beautysis</h2>
          <div className="clients-grid">
            <div className="client-logo">Salão Bella</div>
            <div className="client-logo">Studio Beauty</div>
            <div className="client-logo">Barbearia VIP</div>
            <div className="client-logo">Clínica Estética</div>
            <div className="client-logo">Studio Hair</div>
            <div className="client-logo">Beauty Center</div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Experimente grátis por 30 dias</h2>
          <p>Comece agora mesmo a transformar seu negócio</p>
            <Link to="/register" className="btn-cta">EXPERIMENTE GRÁTIS</Link>
            <Link to="/agendamento" className="btn-agendamento">AGENDAR HORÁRIO</Link>
          </div>
      </section>

      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-section">
            <h3>Contatos</h3>
            <p>(11) 99999-9999</p>
            <p>contato@beautysis.com.br</p>
          </div>
          <div className="footer-section">
            <h3>Links</h3>
            <Link to="/login">Entrar no Sistema</Link>
            <a href="#recursos">Recursos</a>
            <a href="#precos">Preços</a>
          </div>
          <div className="footer-section">
            <h3>Funcionalidades</h3>
            <p>Agendamento Online</p>
            <p>Alerta para Aniversariantes</p>
            <p>Aviso via WhatsApp</p>
            <p>Controle Financeiro</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>2024 - 2026 © beautysis - Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
