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
  title: "DKS Hub - ShopManager Supreme",
  description: "Le premier Hub Technologique Hybride de l'Ituri. Hardware de luxe, formation d'élite et infrastructures certifiées.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DKS Hub",
  },
  applicationName: "DKS Hub",
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

        {/* 
            Chargement sécurisé du SDK Pi. 
            On utilise 'afterInteractive' pour ne pas bloquer le chargement initial de l'application.
        */}
        <Script
          src="https://sdk.minepi.com/pi-sdk.js"
          strategy="afterInteractive"
        />
        <Script id="pi-sdk-init" strategy="afterInteractive">
          {`
            (function() {
              var checkPi = setInterval(function() {
                if (window.Pi) {
                  clearInterval(checkPi);
                  var isPiBrowser = /PiBrowser/i.test(navigator.userAgent);
                  if (isPiBrowser) {
                    try {
                      window.Pi.init({ version: "2.0", sandbox: true });
                      console.log("[Pi SDK] Initialisé dans Pi Browser");
                    } catch(e) {
                      console.error("[Pi SDK] Erreur init:", e);
                    }
                  }
                }
              }, 500);
              // On arrête de chercher après 10 secondes pour éviter une boucle infinie
              setTimeout(function() { clearInterval(checkPi); }, 10000);
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
