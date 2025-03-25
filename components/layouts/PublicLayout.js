import Link from 'next/link';
import Image from 'next/image';

export default function PublicLayout({ children }) {
  return (
    <div className="landing-container">


      <main className="landing-hero">
        <div className="landing-content">
          <h1 className="landing-title">
            Goalmoon TODO
          </h1>
          <h2 className="landing-subtitle">
            Organize suas tarefas
          </h2>
          <p className="landing-description">
            Uma solução moderna para organização e controle de tarefas, 
            construída com tecnologias de ponta:
          </p>
          <div className="landing-features">
            <div className="landing-feature">
              <span className="feature-dot" />
              <span className="feature-text">
                Next.js 15 para performance e SEO otimizados
              </span>
            </div>
            <div className="landing-feature">
              <span className="feature-dot" />
              <span className="feature-text">
                Auth0 para autenticação segura e controle de acesso
              </span>
            </div>
            <div className="landing-feature">
              <span className="feature-dot" />
              <span className="feature-text">
                Supabase para banco de dados escalável e em tempo real
              </span>
            </div>
          </div>
          <Link href="/api/auth/login" className="landing-cta">
            Começar Agora
          </Link>
        </div>
      </main>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} Goalmoon. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
} 