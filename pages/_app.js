// pages/_app.js

import "@/styles/globals.css";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <Head>
        <title>Goalmoon - Todo List</title>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Goalmoon Todo List Application" />
        <meta name="theme-color" content="#293047" />
      </Head>
      <Component {...pageProps} />
    </UserProvider>
  );
}
