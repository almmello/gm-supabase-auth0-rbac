import PublicLayout from '../../components/layouts/PublicLayout';
import Link from 'next/link';

export default function SessionExpiredPage() {
  return (
    <PublicLayout>
      <main className="bg-deep-navy rounded-2xl p-8 border border-blue-gray/30 shadow-md space-y-6">
        <div className="space-y-4">
          <h2 className="text-mint text-lg font-bold">
            Sessão Expirada
          </h2>
          <p className="text-gray-lighter text-sm leading-relaxed">
            Sua sessão expirou por um dos seguintes motivos:
          </p>
          <ul className="space-y-2 text-sm text-gray-light">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mint"></span>
              Inatividade por tempo prolongado
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mint"></span>
              Desconexão por motivos de segurança
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-mint"></span>
              Alterações nas permissões de acesso
            </li>
          </ul>
          
          <div className="mt-8 flex justify-center">
            <Link
              href="/api/auth/login"
              className="logout-link"
            >
              Fazer Login Novamente
            </Link>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
} 