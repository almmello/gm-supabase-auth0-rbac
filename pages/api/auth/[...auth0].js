// pages/api/auth/[...auth0].js

import { handleAuth, handleCallback } from "@auth0/nextjs-auth0";
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
  // Log do JWT recebido do Auth0
  logger.log('JWT recebido do Auth0:', {
    token: session.idToken,
    claims: jwt.decode(session.idToken)
  });

  const payload = {
    userId: session.user.sub,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };

  const supabaseToken = jwt.sign(
    payload,
    process.env.SUPABASE_SIGNING_SECRET
  );

  // Log do token gerado para o Supabase
  logger.log('Token gerado para o Supabase:', {
    token: supabaseToken,
    claims: jwt.decode(supabaseToken)
  });

  session.user.accessToken = supabaseToken;
  return session;
};

export default handleAuth({
  async callback(req, res) {
    try {
      await handleCallback(req, res, { afterCallback });
    } catch (error) {
      res.status(error.status || 500).end(error.message);
    }
  },
});
