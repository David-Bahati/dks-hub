
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
  UserCircle,
  Users,
  Settings,
  Tags,
  FileText,
  UserPlus
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

// Définition des éléments de navigation avec permissions par rôle
const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN"] },
  { label: "Produit", href: "/inventory", icon: Package, roles: ["ADMIN", "SELLER"] },
  { label: "Caisse", href: "/pos", icon: ShoppingCart, roles: ["ADMIN", "CASHIER"] },
  { label: "Commande", href: "/dashboard/orders", icon: FileText, roles: ["ADMIN", "SELLER"] },
  { label: "Catégorie", href: "/dashboard/categories", icon: Tags, roles: ["ADMIN"] },
  { label: "Client", href: "/dashboard/customers", icon: Users, roles: ["ADMIN", "SELLER"] },
  { label: "Utilisateurs", href: "/dashboard/users", icon: UserPlus, roles: ["ADMIN"] },
  { label: "Rapport", href: "/sales", icon: History, roles: ["ADMIN", "CASHIER"] },
  { label: "Paramètres", href: "/dashboard/settings", icon: Settings, roles: ["ADMIN"] },
  { label: "Boutique", href: "/", icon: Store, roles: ["ANY"] },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPiConnected, setIsPiConnected] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>("ADMIN");

  const togglePiConnection = () => {
    setIsPiConnected(!isPiConnected);
  };

  // Filtre les éléments du menu selon le rôle actif
  const visibleItems = NAV_ITEMS.filter(item => 
    item.roles.includes("ANY") || item.roles.includes(currentRole)
  );

  const getRoleLabel = (role: UserRole) => {
    switch(role) {
      case "ADMIN": return "Administrateur";
      case "SELLER": return "Vendeur";
      case "CASHIER": return "Caissier";
      default: return "Visiteur";
    }
  };

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

          {/* Navigation Desktop filtrée */}
          <div className="hidden lg:flex space-x-1 overflow-x-auto no-scrollbar">
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-[11px] font-bold uppercase transition-all hover:text-accent whitespace-nowrap",
                  pathname === item.href ? "nav-link-active" : "text-muted-foreground"
                )}
              >
                <item.icon size={14} />
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
            </Button>

            {/* Menu de sélection de rôle pour la simulation */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 rounded-full hover:bg-white/5 border border-white/10 px-3 h-10">
                  <UserCircle className="text-accent" size={20} />
                  <span className="text-[10px] font-bold uppercase hidden md:inline-block text-muted-foreground">
                    {getRoleLabel(currentRole)}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-white/10 w-56">
                <DropdownMenuLabel>Simulation de Rôle</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/5" />
                <DropdownMenuItem onClick={() => setCurrentRole("ADMIN")} className={cn("gap-2", currentRole === "ADMIN" && "text-accent")}>
                  <div className={cn("w-2 h-2 rounded-full", currentRole === "ADMIN" ? "bg-accent" : "bg-transparent")} />
                  Administrateur (Tout)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentRole("SELLER")} className={cn("gap-2", currentRole === "SELLER" && "text-accent")}>
                  <div className={cn("w-2 h-2 rounded-full", currentRole === "SELLER" ? "bg-accent" : "bg-transparent")} />
                  Vendeur (Stock/Clients)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrentRole("CASHIER")} className={cn("gap-2", currentRole === "CASHIER" && "text-accent")}>
                  <div className={cn("w-2 h-2 rounded-full", currentRole === "CASHIER" ? "bg-accent" : "bg-transparent")} />
                  Caissier (POS/Ventes)
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/5" />
                <Link href="/">
                   <DropdownMenuItem className="text-destructive">Déconnexion</DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

      {/* Menu Mobile filtré */}
      {isOpen && (
        <div className="lg:hidden bg-background border-b border-white/10 py-4 px-4 space-y-2">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all uppercase font-bold",
                pathname === item.href ? "bg-primary/20 text-accent" : "text-muted-foreground hover:bg-white/5"
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
