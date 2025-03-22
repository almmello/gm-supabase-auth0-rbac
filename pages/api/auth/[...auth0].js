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
  try {
    const decodedToken = jwt.decode(session.idToken);
    const namespace = process.env.NEXT_PUBLIC_AUTH0_NAMESPACE;

    logger.log('JWT recebido do Auth0:', {
      claims: decodedToken
    });

    const roles = decodedToken[`${namespace}/roles`] || [];
    
    const payload = {
      userId: session.user.sub,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
      role: 'authenticated',
      roles: roles,
    };

    session.user.roles = roles;
    const supabaseToken = jwt.sign(payload, process.env.SUPABASE_SIGNING_SECRET);
    session.user.accessToken = supabaseToken;

    return session;
  } catch (error) {
    logger.log('Erro no afterCallback:', error);
    throw error;
  }
};

export default handleAuth({
  async login(req, res) {
    try {
      await handleLogin(req, res, {
        returnTo: '/',
        authorizationParams: {
          audience: process.env.AUTH0_AUDIENCE,
          scope: 'openid profile email'
        }
      });
    } catch (error) {
      logger.log('Erro no login:', error);
      res.status(error.status || 500).end(error.message);
    }
  },
  async callback(req, res) {
    try {
      await handleCallback(req, res, { afterCallback });
    } catch (error) {
      logger.log('Erro no callback:', error);
      res.status(error.status || 500).end(error.message);
    }
  }
});
