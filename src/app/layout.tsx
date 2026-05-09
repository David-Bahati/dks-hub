import type { Metadata, Viewport } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import { AiAssistant } from "@/components/chat/AiAssistant";

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var isPiBrowser = /PiBrowser/i.test(navigator.userAgent);
            if (isPiBrowser) {
              var s = document.createElement('script');
              s.src = 'https://sdk.minepi.com/pi-sdk.js';
              s.onload = function() {
                if (window.Pi) {
                  try {
                    window.Pi.init({ version: "2.0", sandbox: true });
                    console.log("[Pi SDK] Initialisé dans Pi Browser");
                  } catch(e) {
                    console.error("[Pi SDK] Erreur init:", e);
                  }
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
