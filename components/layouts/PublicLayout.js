import Link from 'next/link';
import Image from 'next/image';
import BaseLayout from './BaseLayout';

export default function PublicLayout({ children }) {
  return (
    <BaseLayout>
      <div className="min-h-screen flex flex-col">
        {/* Cabeçalho */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex-shrink-0">
                <Image
                  src="/images/goalmoon-logo.png"
                  alt="Goalmoon"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
              </div>
              <div>
                <Link
                  href="/api/auth/login"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Entrar
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Rodapé */}
        <footer className="bg-white border-t">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              © 2025 Goalmoon. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </BaseLayout>
  );
} 