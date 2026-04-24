
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  History, 
  Store,
  Menu,
  X,
  Coins,
  ShieldCheck,
  UserCircle
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserRole } from "@/lib/types";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN"] },
  { label: "Inventaire", href: "/inventory", icon: Package, roles: ["ADMIN", "SELLER"] },
  { label: "Caisse", href: "/pos", icon: ShoppingCart, roles: ["ADMIN", "CASHIER"] },
  { label: "Ventes", href: "/sales", icon: History, roles: ["ADMIN"] },
  { label: "Accueil Boutique", href: "/", icon: Store, roles: ["ANY"] },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPiConnected, setIsPiConnected] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>("ADMIN");

  const togglePiConnection = () => {
    setIsPiConnected(!isPiConnected);
  };

  const visibleItems = NAV_ITEMS.filter(item => 
    item.roles.includes("ANY") || item.roles.includes(currentRole)
  );

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center neon-glow">
                <span className="text-white font-bold text-xl uppercase">dks</span>
              </div>
              <span className="text-xl font-bold tracking-tight hidden sm:block uppercase">
                Shop<span className="text-accent">Manager</span>
              </span>
            </Link>
          </div>

          <div className="hidden md:flex space-x-1">
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all hover:text-accent",
                  pathname === item.href ? "nav-link-active" : "text-muted-foreground"
                )}
              >
                <item.icon size={16} />
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
                "hidden sm:flex gap-2 border-white/10 transition-colors text-xs",
                isPiConnected ? "bg-accent/20 border-accent/50 text-accent" : "hover:bg-accent/10"
              )}
            >
              <Coins size={14} />
              {isPiConnected ? "Pi Connecté" : "Connecter Pi"}
              {isPiConnected && <ShieldCheck size={12} className="animate-pulse" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5 border border-white/10">
                  <UserCircle className="text-accent" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-white/10 w-48">
                <DropdownMenuLabel>Changer de Rôle</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={() => setCurrentRole("ADMIN")} className={currentRole === "ADMIN" ? "text-accent" : ""}>
                  Administrateur
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentRole("SELLER")} className={currentRole === "SELLER" ? "text-accent" : ""}>
                  Vendeur (Stock)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentRole("CASHIER")} className={currentRole === "CASHIER" ? "text-accent" : ""}>
                  Caissier (POS)
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <Link href="/">
                   <DropdownMenuItem className="text-destructive">Se déconnecter</DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-white/10 py-4 px-4 space-y-2">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all",
                pathname === item.href ? "bg-primary/20 text-accent font-semibold" : "text-muted-foreground hover:bg-white/5"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
