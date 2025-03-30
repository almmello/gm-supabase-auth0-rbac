import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Home() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="landing-container">
      <nav className="landing-nav dash-flex">
        <div className="landing-logo" 
             role="img" 
             aria-label="Goalmoon Logo" 
        />
        <a
          href="/api/auth/login"
          className="landing-nav-button"
        >
          Acessar Sistema
        </a>
      </nav>

      <main className="landing-hero">
        <div className="landing-content">
          <h1 className="landing-title">
            Goalmoon TODO
          </h1>
          <h2 className="landing-subtitle">
            Gerencie suas tarefas com simplicidade e segurança
          </h2>
          <p className="landing-description">
            Uma aplicação moderna que combina o melhor do Next.js, Supabase e Auth0 para oferecer
            uma experiência única no gerenciamento de tarefas.
          </p>

          <div className="landing-features">
            <div className="landing-feature">
              <div className="feature-dot" />
              <p className="feature-text">
                Autenticação segura com Auth0
              </p>
            </div>
            <div className="landing-feature">
              <div className="feature-dot" />
              <p className="feature-text">
                Banco de dados escalável com Supabase
              </p>
            </div>
            <div className="landing-feature">
              <div className="feature-dot" />
              <p className="feature-text">
                Interface moderna com Next.js e Tailwind
              </p>
            </div>
          </div>

          <a
            href="/api/auth/login"
            className="landing-cta"
          >
            Começar Agora
          </a>
        </div>
      </main>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} Goalmoon. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
