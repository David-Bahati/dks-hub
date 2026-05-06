import type { Metadata, Viewport } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import { AiAssistant } from "@/components/chat/AiAssistant";
import Script from "next/script";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "DKS ShopManager - Votre boutique informatique premium",
  description: "La qualité informatique au coeur de l'Ituri. Paiements en Pi Network (GCV), Mobile Money et Cash.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DKS Shop",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "application-name": "DKS Shop",
    "apple-mobile-web-app-title": "DKS Shop",
    "msapplication-starturl": "/",
  }
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {/* Chargement du SDK Pi Network avant l'interactivité */}
        <Script 
          src="https://sdk.minepi.com/pi-sdk.js" 
          strategy="beforeInteractive"
        />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        {/* Initialisation sécurisée du SDK Pi pour éviter les timeouts hors Pi Browser */}
        <Script id="pi-init" strategy="afterInteractive">
          {`
            if (window.Pi) {
              // On n'initialise que si on détecte le Pi Browser pour éviter le timeout de 120s
              if (/PiBrowser/i.test(navigator.userAgent)) {
                window.Pi.init({ version: "2.0", sandbox: true });
                console.log("[Pi SDK] Initialisé pour Pi Browser");
              } else {
                console.log("[Pi SDK] Navigation standard détectée - Initialisation différée");
              }
            }
          `}
        </Script>
        
        <FirebaseClientProvider>
          <AuthProvider>
            <CartProvider>
              <main>{children}</main>
              <AiAssistant />
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
