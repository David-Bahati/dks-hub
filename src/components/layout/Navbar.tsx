
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  UserPlus,
  LogOut
} from "lucide-react";
import { useState, useEffect } from "react";
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
import { User, UserRole } from "@/lib/types";

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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPiConnected, setIsPiConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("dks_user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("dks_user");
    setCurrentUser(null);
    router.push("/login");
  };

  const visibleItems = NAV_ITEMS.filter(item => 
    item.roles.includes("ANY") || (currentUser && item.roles.includes(currentUser.role))
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
    <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-white/10">
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

          <div className="hidden lg:flex space-x-1">
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
              onClick={() => setIsPiConnected(!isPiConnected)}
              className={cn(
                "hidden sm:flex gap-2 border-white/10 transition-colors text-xs",
                isPiConnected ? "bg-accent/20 border-accent/50 text-accent" : "hover:bg-accent/10"
              )}
            >
              <Coins size={14} />
              {isPiConnected ? "Pi Connecté" : "Connecter Pi"}
            </Button>

            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 rounded-full hover:bg-white/5 border border-white/10 px-3 h-10">
                    <UserCircle className="text-accent" size={20} />
                    <div className="flex flex-col items-start leading-none text-left">
                      <span className="text-[10px] font-bold uppercase text-foreground">{currentUser.name}</span>
                      <span className="text-[8px] uppercase text-muted-foreground">{getRoleLabel(currentUser.role)}</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-white/10 w-56">
                  <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive gap-2">
                    <LogOut size={16} />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button className="bg-accent text-accent-foreground font-bold px-6">Login</Button>
              </Link>
            )}

            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>

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
          {currentUser && (
            <Button 
              variant="destructive" 
              onClick={handleLogout} 
              className="w-full mt-4 flex items-center justify-center gap-2"
            >
              <LogOut size={18} /> Déconnexion
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}
