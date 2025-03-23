import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import logger from '../utils/logger';

export function useAuth() {
  const { user, error: auth0Error, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const checkTokenExpiration = () => {
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Se o token do Supabase expirou
      if (user.tokenExp && currentTime >= user.tokenExp) {
        logger.warn('Token do Supabase expirado');
        router.push('/public/session-expired');
        return;
      }
      
      // Se o token do Auth0 expirou
      if (user.auth0Exp && currentTime >= user.auth0Exp) {
        logger.warn('Token do Auth0 expirado');
        router.push('/public/session-expired');
        return;
      }
    };

    // Verifica imediatamente
    checkTokenExpiration();

    // Verifica a cada minuto
    const interval = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(interval);
  }, [user, router]);

  // Se houver erro de autenticação, redireciona para área pública
  if (auth0Error) {
    logger.error('Erro de autenticação:', auth0Error);
    router.push('/public/session-expired');
    return { user: null, isLoading: false, error: auth0Error };
  }

  return {
    user,
    isLoading,
    error: auth0Error
  };
} 