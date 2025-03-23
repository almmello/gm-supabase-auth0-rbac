// pages/api/auth/[...auth0].js

import { handleAuth, handleCallback, handleLogin, handleLogout, handleError } from "@auth0/nextjs-auth0";
import jwt from "jsonwebtoken";
import logger from '../../../utils/logger';
import { getSupabase } from '../../../utils/supabase';

const afterCallback = async (req, res, session) => {
  try {
    const decodedToken = jwt.decode(session.idToken);
    const namespace = process.env.NEXT_PUBLIC_AUTH0_NAMESPACE;

    logger.info('JWT recebido do Auth0:', {
      sub: decodedToken.sub,
      exp: new Date(decodedToken.exp * 1000).toISOString()
    });

    const roles = decodedToken[`${namespace}/roles`] || [];
    
    // Definindo uma expiração mais curta para o token do Supabase
    // para garantir que ele expire antes do token do Auth0
    const supabaseExp = Math.min(
      decodedToken.exp,
      Math.floor(Date.now() / 1000) + 3600 // 1 hora
    );
    
    const payload = {
      sub: session.user.sub,
      exp: supabaseExp,
      role: 'authenticated',
      roles: roles,
    };

    session.user.roles = roles;
    const supabaseToken = jwt.sign(payload, process.env.SUPABASE_SIGNING_SECRET);
    session.user.accessToken = supabaseToken;

    // Adicionando informações de expiração à sessão para controle no frontend
    session.user.tokenExp = supabaseExp;
    session.user.auth0Exp = decodedToken.exp;

    return session;
  } catch (error) {
    logger.error('Erro no afterCallback:', error);
    throw error;
  }
};

export default handleAuth({
  async login(req, res) {
    try {
      await handleLogin(req, res, {
        returnTo: '/dashboard',
        authorizationParams: {
          audience: process.env.AUTH0_AUDIENCE,
          scope: 'openid profile email offline_access'
        }
      });
    } catch (error) {
      logger.error('Erro no login:', error);
      res.status(error.status || 500).end(error.message);
    }
  },
  async callback(req, res) {
    try {
      return await handleCallback(req, res, { afterCallback });
    } catch (error) {
      logger.error('Erro no callback:', error);
      return res.redirect('/');
    }
  },
  async logout(req, res) {
    try {
      await handleLogout(req, res, {
        returnTo: '/'
      });
    } catch (error) {
      logger.error('Erro no logout:', error);
      return res.redirect('/');
    }
  },
  async error(req, res) {
    try {
      logger.error('Erro na autenticação');
      await handleError(req, res);
    } catch (error) {
      logger.error('Erro no handler de erro:', error);
      res.redirect('/');
    }
  }
});
