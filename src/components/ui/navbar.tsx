
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Menu, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { usePathname } from 'next/navigation';

const mainNavLinks = [
  { href: "/products", label: "Tous les articles" },
  { href: "/dashboard", label: "Espace d'administration" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const pathname = usePathname();

  const isHomePage = pathname === '/';

  return (
    <header className={`z-40 p-4 flex justify-between items-center ${isHomePage ? 'text-white' : 'text-primary bg-background/95 backdrop-blur-sm border-b'}`}>
      <Link href="/" className="text-xl font-black tracking-tighter uppercase">
        <span className={isHomePage ? 'text-blue-500' : 'text-blue-600'}>Double King</span> Shop
      </Link>

      {/* Navigation pour ordinateur */}
      <nav className="hidden md:flex items-center gap-6">
        {mainNavLinks.map(link => (
          <Link key={link.href} href={link.href} className={`text-sm font-medium ${isHomePage ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Link href="/cart">
            <Button 
                variant="ghost" 
                size="icon" 
                className={`relative ${isHomePage ? 'hover:bg-white/20' : 'hover:bg-muted'}`}
                aria-label="Panier"
            >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-bold transform -translate-y-1/2 translate-x-1/2 flex items-center justify-center">
                    {cartCount}
                </span>
                )}
            </Button>
        </Link>

        {/* Bouton du menu mobile */}
        <Button onClick={() => setIsMenuOpen(true)} variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
      </div>

      {/* Menu mobile (Drawer) */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 p-4 text-white animate-in slide-in-from-right-full md:hidden">
          <div className="flex justify-between items-center mb-8">
            <Link href="/" className="text-xl font-black tracking-tighter uppercase">
                <span className='text-blue-500'>Double King</span> Shop
            </Link>
            <Button onClick={() => setIsMenuOpen(false)} variant="ghost" size="icon">
              <X className="h-6 w-6" />
              <span className="sr-only">Fermer le menu</span>
            </Button>
          </div>
          <nav className="flex flex-col gap-6 text-xl font-medium items-center">
            {mainNavLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setIsMenuOpen(false)} className="hover:text-blue-400">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
