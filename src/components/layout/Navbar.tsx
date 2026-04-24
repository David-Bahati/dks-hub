
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  Store,
  LogOut,
  Menu,
  X,
  Coins,
  ShieldCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, role: "ADMIN" },
  { label: "Inventory", href: "/inventory", icon: Package, role: "ADMIN" },
  { label: "POS", href: "/pos", icon: ShoppingCart, role: "SELLER" },
  { label: "Sales", href: "/sales", icon: History, role: "ADMIN" },
  { label: "Public Shop", href: "/shop", icon: Store, role: "ANY" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPiConnected, setIsPiConnected] = useState(false);

  // Simulate Pi Network connection
  const togglePiConnection = () => {
    setIsPiConnected(!isPiConnected);
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center neon-glow">
              <span className="text-white font-bold text-xl">dks</span>
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">
              Shop<span className="text-accent">Manager</span>
            </span>
          </div>

          <div className="hidden md:flex space-x-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all hover:text-accent",
                  pathname === item.href ? "nav-link-active" : "text-muted-foreground"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={togglePiConnection}
              className={cn(
                "hidden sm:flex gap-2 border-white/10 transition-colors",
                isPiConnected ? "bg-accent/20 border-accent/50 text-accent" : "hover:bg-accent/10"
              )}
            >
              <Coins size={16} />
              {isPiConnected ? "Pi Connecté" : "Connecter Pi"}
              {isPiConnected && <ShieldCheck size={14} className="animate-pulse" />}
            </Button>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X /> : <Menu />}
            </Button>
            
            <Button variant="outline" className="hidden lg:flex gap-2 border-white/10 hover:border-accent/50 hover:bg-accent/10">
              <LogOut size={16} />
              Quitter
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-white/10 py-4 px-4 space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3 border-white/10 mb-4"
            onClick={togglePiConnection}
          >
            <Coins size={18} className={isPiConnected ? "text-accent" : ""} />
            {isPiConnected ? "Pi Network Connecté" : "Connecter Pi Network"}
          </Button>
          
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-base transition-all",
                pathname === item.href ? "bg-primary/20 text-accent font-semibold" : "text-muted-foreground hover:bg-white/5"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
