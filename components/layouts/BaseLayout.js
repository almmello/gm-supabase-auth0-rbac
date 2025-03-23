import Head from 'next/head';

export default function BaseLayout({ children }) {
  return (
    <>
      <Head>
        <title>Goalmoon TODO</title>
        <meta name="description" content="Goalmoon TODO - Gerencie suas tarefas com simplicidade e segurança" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <meta name="theme-color" content="#293047" />
        {/* Preload da imagem do logo */}
        <link
          rel="preload"
          href="/images/goalmoon-logo.png"
          as="image"
          type="image/png"
        />
      </Head>
      {children}
    </>
  );
} 