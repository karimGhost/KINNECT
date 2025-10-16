// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
   <Head>
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#ff5c00" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
</Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}


