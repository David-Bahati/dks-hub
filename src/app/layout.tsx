
import type { Metadata } from "next";
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
  description: "La qualité informatique au coeur de l'Ituri. Paiements en Pi Network, Mobile Money et Cash.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <Script 
          src="https://sdk.minepi.com/pi-sdk.js" 
          strategy="beforeInteractive"
        />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        {/* Initialisation du SDK Pi */}
        <Script id="pi-init" strategy="afterInteractive">
          {`
            if (window.Pi) {
              window.Pi.init({ version: "2.0", sandbox: true });
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
