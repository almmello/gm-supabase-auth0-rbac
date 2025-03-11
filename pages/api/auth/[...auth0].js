// pages/api/auth/[...auth0].js

import { handleAuth, handleCallback, handleLogin } from "@auth0/nextjs-auth0";
import jwt from "jsonwebtoken";

// Logger configurável
const logger = {
  log: (...args) => {
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      console.log('[DEBUG]', ...args);
    }
  }
};

const afterCallback = async (req, res, session) => {
  const decodedToken = jwt.decode(session.idToken);
  const namespace = process.env.NEXT_PUBLIC_AUTH0_NAMESPACE; 

  logger.log('JWT recebido do Auth0:', {
    token: session.idToken,
    claims: decodedToken
  });

  // Adicionando log para verificar as roles
  logger.log('ID Token Claims:', decodedToken);
  logger.log('Namespace:', namespace);
  logger.log('Roles from decodedToken:', decodedToken[`${namespace}/roles`]);
  logger.log('Session user before assignment:', session.user);
  logger.log('Decoded roles:', decodedToken[`${namespace}/roles`]);
  logger.log('Session user after assignment:', session.user);
  logger.log('Roles assigned to session.user:', session.user[`${namespace}/roles`]);
  logger.log('Decoded roles after assignment:', decodedToken[`${namespace}/roles`]);
  logger.log('Session user roles after assignment:', session.user[`${namespace}/roles`]);
  logger.log('Namespace after assignment:', namespace);

  const payload = {
    userId: session.user.sub,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    role: 'authenticated',
    roles: decodedToken[`${namespace}/roles`] || [],
  };

  session.user[`${namespace}/roles`] = decodedToken[`${namespace}/roles`] || [];

  const supabaseToken = jwt.sign(payload, process.env.SUPABASE_SIGNING_SECRET);

  logger.log('Token gerado para o Supabase:', {
    token: supabaseToken,
    claims: jwt.decode(supabaseToken)
  });

  session.user.accessToken = supabaseToken;
  return session;
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
      res.status(error.status || 500).end(error.message);
    }
  },
});
