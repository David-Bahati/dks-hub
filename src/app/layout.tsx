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
        {/* Chargement conditionnel du SDK Pi pour éviter le timeout hors Pi Browser */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            if (/PiBrowser/i.test(navigator.userAgent)) {
              var s = document.createElement('script');
              s.src = 'https://sdk.minepi.com/pi-sdk.js';
              s.onload = function() {
                if (window.Pi) {
                  window.Pi.init({ version: "2.0", sandbox: true });
                  console.log("[Pi SDK] Initialisé dans Pi Browser");
                }
              };
              document.head.appendChild(s);
            }
          })();
        ` }} />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
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
