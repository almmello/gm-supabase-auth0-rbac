// pages/api/auth/[...auth0].js

import { handleAuth, handleCallback, handleLogin } from "@auth0/nextjs-auth0";
import jwt from "jsonwebtoken";

// Logger configurável
const logger = {
  log: (...args) => {
    if (process.env.DEBUG_LOG === 'true') {
      console.log('[DEBUG]', ...args);
    }
  }
};

const afterCallback = async (req, res, session) => {
  const decodedToken = jwt.decode(session.idToken);
  const namespace = 'gm-supabase-tutorial.us.auth0.com'; // Hardcoded namespace

  logger.log('JWT recebido do Auth0:', {
    token: session.idToken,
    claims: decodedToken
  });

  // Adicionando log para verificar as roles
  console.log('ID Token Claims:', decodedToken); // Adicionar log aqui
  console.log('Namespace:', namespace); // Log para verificar o namespace
  console.log('Roles from decodedToken:', decodedToken[`${namespace}/roles`]); // Log para verificar as roles
  console.log('Session user before assignment:', session.user); // Log para verificar o estado do session.user
  console.log('Decoded roles:', decodedToken[`${namespace}/roles`]); // Log para verificar as roles
  console.log('Session user after assignment:', session.user); // Log para verificar o estado do session.user após a atribuição
  console.log('Roles assigned to session.user:', session.user[`${namespace}/roles`]); // Log para verificar as roles atribuídas
  console.log('Decoded roles after assignment:', decodedToken[`${namespace}/roles`]); // Log para verificar as roles decodificadas
  console.log('Session user roles after assignment:', session.user[`${namespace}/roles`]); // Log para verificar as roles atribuídas
  console.log('Namespace after assignment:', namespace); // Log para verificar o namespace

  const payload = {
    userId: session.user.sub,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    role: 'authenticated',
    roles: decodedToken[`${namespace}/roles`] || [], // Corrigido para atribuir as roles
  };

  session.user[`${namespace}/roles`] = decodedToken[`${namespace}/roles`] || []; // Adicionando as roles ao session.user

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
