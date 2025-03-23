import Head from 'next/head';

export default function BaseLayout({ children }) {
  return (
    <>
      <Head>
        <title>Goalmoon TODO</title>
        <meta name="description" content="Goalmoon TODO - Gerenciador de tarefas" />
        <link rel="icon" href="/favicon.ico" />
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