// pages/api/auth/[...auth0].js

import { handleAuth, handleCallback, handleLogin, handleLogout, handleError } from "@auth0/nextjs-auth0";
import jwt from "jsonwebtoken";

// Logger configurável
const logger = {
  info: (...args) => {
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      console.log('[DEBUG]', ...args);
    }
  },
  error: (...args) => {
    console.error('[ERROR]', ...args);
  }
};

const afterCallback = async (req, res, session) => {
  try {
    const decodedToken = jwt.decode(session.idToken);
    const namespace = process.env.NEXT_PUBLIC_AUTH0_NAMESPACE; 

    logger.info('JWT recebido do Auth0:', {
      token: session.idToken,
      claims: decodedToken
    });

    // Adicionando log para verificar as roles
    logger.info('ID Token Claims:', decodedToken);
    logger.info('Namespace:', namespace);
    logger.info('Roles from decodedToken:', decodedToken[`${namespace}/roles`]);
    logger.info('Session user before assignment:', session.user);
    logger.info('Decoded roles:', decodedToken[`${namespace}/roles`]);
    logger.info('Session user after assignment:', session.user);
    logger.info('Roles assigned to session.user:', session.user[`${namespace}/roles`]);
    logger.info('Decoded roles after assignment:', decodedToken[`${namespace}/roles`]);
    logger.info('Session user roles after assignment:', session.user[`${namespace}/roles`]);
    logger.info('Namespace after assignment:', namespace);

    const supabaseExp = Math.min(
      decodedToken.exp,
      Math.floor(Date.now() / 1000) + 3600 // 1 hora
    );

    const payload = {
      sub: session.user.sub,
      exp: supabaseExp,
      role: 'authenticated',
      roles: decodedToken[`${namespace}/roles`] || [],
    };

    session.user[`${namespace}/roles`] = decodedToken[`${namespace}/roles`] || [];

    const supabaseToken = jwt.sign(payload, process.env.SUPABASE_SIGNING_SECRET);

    logger.info('Token gerado para o Supabase:', {
      token: supabaseToken,
      claims: jwt.decode(supabaseToken)
    });

    session.user.accessToken = supabaseToken;
    return session;
  } catch (error) {
    logger.error('Erro no afterCallback:', error);
    throw error;
  }
};

export default handleAuth({
  async login(req, res) {
    return handleLogin(req, res, {
      authorizationParams: {
        audience: process.env.AUTH0_AUDIENCE,
        scope: 'openid profile email'
      }
    });
  },
  async callback(req, res) {
    try {
      await handleCallback(req, res, { afterCallback });
    } catch (error) {
      logger.error('Erro no callback:', error);
      res.status(error.status || 500).end(error.message);
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
