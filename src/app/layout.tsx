
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { headers } from "next/headers";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
function getUserLang() {
  if (typeof navigator !== "undefined") {
    return (navigator.language || "en").split("-")[0]; // e.g. "en", "sw"
  }
  return "en"; // fallback for server
}


export const metadata: Metadata = {
  title: 'Kinnect',
  description: "Rediscover Your Roots, Reconnect Your Family.",
  metadataBase: new URL("https://kinnect-eight.vercel.app"),
 
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

 
 const lang =
    typeof window !== "undefined" ? getUserLang() : "en";


    //  const lang =
    // typeof window === "undefined"
    //   ? // On server: read the header injected by middleware
    //     // @ts-ignore - Next provides this header in request
    //     (headers().get("x-user-lang") ?? "en")
    //   : "en"; // client fallback


  return (
   
          <html lang={lang} className="dark">

      <head>
<script
  dangerouslySetInnerHTML={{
    __html: `
      if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/pwabuilder-sw.js')
            .then(() => console.log('✅ Service Worker registered successfully'))
            .catch(err => console.error('❌ Service Worker registration failed:', err));
        });
      } else {
        console.log('Service Worker not registered (development mode)');
      }
    `,
  }}
/>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
                <ServiceWorkerRegister />

        {children}
        <Toaster />
      </body>
    </html>
  );
}
