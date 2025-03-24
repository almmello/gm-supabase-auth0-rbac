// pages/_app.js

import "@/styles/globals.css";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  const title = "Goalmoon TODO";
  const description = "Gerencie suas tarefas com simplicidade e segurança usando Next.js, Supabase e Auth0";

  return (
    <UserProvider>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <meta name="theme-color" content="#293047" />
        
        {/* OpenGraph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content="/images/og-image.png" />
        <meta property="og:site_name" content="Goalmoon TODO" />
        <meta property="og:locale" content="pt_BR" />

        {/* WhatsApp */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Goalmoon TODO - Gerenciador de Tarefas" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content="/images/og-image.png" />
        
        {/* Preload da imagem do logo */}
        <link
          rel="preload"
          href="/images/goalmoon-logo.png"
          as="image"
          type="image/png"
        />
      </Head>
      <Component {...pageProps} />
    </UserProvider>
  );
}
