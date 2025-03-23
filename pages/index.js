import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import PublicLayout from '../components/layouts/PublicLayout';

export default function Home() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <PublicLayout>
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Goalmoon Todo</span>
              <span className="block text-blue-600">Organize suas tarefas</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Uma aplicação web moderna e responsiva para gerenciamento de tarefas, 
              construída com as tecnologias mais recentes do mercado.
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {/* Next.js */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Next.js</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Framework React moderno que oferece renderização híbrida, 
                    otimização automática e excelente performance.
                  </p>
                </div>
              </div>

              {/* Supabase */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Supabase</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Backend-as-a-Service que fornece banco de dados PostgreSQL, 
                    autenticação e APIs em tempo real.
                  </p>
                </div>
              </div>

              {/* Auth0 */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Auth0</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Plataforma de autenticação e autorização que garante 
                    segurança e controle de acesso robusto.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <a
              href="/api/auth/login"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Começar Agora
            </a>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
