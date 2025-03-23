import PublicLayout from '../../components/layouts/PublicLayout';

export default function SessionExpiredPage() {
  return (
    <PublicLayout>
      <div className="text-center space-y-6">
        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-red-400 mb-4">
            Sessão Expirada
          </h1>
          <p className="text-gray-300 text-lg">
            Sua sessão expirou. Por favor, acesse o sistema novamente para continuar.
          </p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">
            Por que isso aconteceu?
          </h2>
          <ul className="text-gray-400 text-left space-y-4 max-w-2xl mx-auto">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Sua sessão pode ter expirado por inatividade</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Você pode ter sido desconectado por questões de segurança</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Pode ter ocorrido um problema com suas permissões de acesso</span>
            </li>
          </ul>
        </div>
      </div>
    </PublicLayout>
  );
} 