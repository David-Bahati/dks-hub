
"use client";

import { useEffect, useState } from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import {
  AlertTriangle,
  DollarSign,
  Package,
  RefreshCw,
  Settings,
  ShoppingCart,
  TrendingUp,
  LineChart,
  Users,
  UsersRound,
  ShoppingBag,
  PanelLeft,
  Loader2,
  LayoutDashboard,
  User,
  Headset,
  ArrowRight,
  Clock,
  Sparkles
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
    getExchangeRate,
    getDashboardStats,
    getLowStockItems,
    getRecentSales
} from '@/lib/data';
import { Product } from '@/lib/types';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/context/AuthContext';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const adminNavLinks = [
  { href: "/dashboard", icon: LineChart, label: "Aperçu" },
  { href: "/dashboard/products", icon: Package, label: "Produits" },
  { href: "/dashboard/orders", icon: ShoppingBag, label: "Commandes" },
  { href: "/dashboard/customers", icon: Users, label: "Clients" },
  { href: "/dashboard/users", icon: UsersRound, label: "Utilisateurs" },
  { href: "/dashboard/settings", icon: Settings, label: "Paramètres" },
];

const customerNavLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Mon Hub", description: "Vue d'ensemble de mon compte" },
  { href: "/dashboard/orders", icon: ShoppingBag, label: "Mes Commandes", description: "Suivi et historique d'achats" },
  { href: "/cart", icon: ShoppingCart, label: "Mon Panier", description: "Articles en attente" },
  { href: "/dashboard/settings", icon: User, label: "Mon Profil", description: "Gérer mes informations" },
  { href: "#", icon: Headset, label: "Support Client", description: "Aide et assistance technique" },
];

function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [rate, setRate] = useState(2500);

  const isStaff = user?.role === 'Admin' || user?.role === 'Seller' || user?.role === 'Cashier';

  // Pour les clients : Récupérer la dernière commande
  const lastOrderQuery = useMemoFirebase(() => {
    if (authLoading || !user?.uid || isStaff) return null;
    return query(
      collection(db, "orders"), 
      where("userId", "==", user.uid), 
      orderBy("createdAt", "desc"), 
      limit(1)
    );
  }, [user?.uid, isStaff, authLoading]);
  
  const { data: lastOrders } = useCollection(lastOrderQuery);
  const lastOrder = lastOrders?.[0];

  useEffect(() => {
    if (isStaff) {
      fetchAdminData();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isStaff, authLoading]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [dashboardStats, lowStockItems, recent, exchangeRate] = await Promise.all([
        getDashboardStats(),
        getLowStockItems(),
        getRecentSales(),
        getExchangeRate()
      ]);
      setStats(dashboardStats);
      setLowStock(lowStockItems);
      setRecentSales(recent);
      setRate(exchangeRate);
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-FR').format(amount);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // --- VUE CLIENT ---
  if (!isStaff) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="border-b border-white/5 bg-background/40 backdrop-blur-2xl py-6 px-4 md:px-8">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center neon-glow">
                        <span className="text-white font-black text-xl italic uppercase">DKS</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase italic tracking-tighter">Mon Espace <span className="text-accent">Client</span></h1>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Ravi de vous revoir, {user?.name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <Button variant="outline" className="rounded-xl border-white/10 h-10 gap-2 font-bold text-xs uppercase italic">
                            <ShoppingCart size={14} /> Boutique
                        </Button>
                    </Link>
                </div>
            </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 glossy-card border-none rounded-[2.5rem] overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles size={120} className="text-accent" />
                    </div>
                    <CardContent className="p-10 space-y-4">
                        <Badge className="bg-accent/20 text-accent border-none font-black uppercase tracking-tighter px-3">Membre Premium DKS</Badge>
                        <h2 className="text-4xl font-black uppercase italic leading-tight">VOTRE SETUP,<br /><span className="text-accent">NOTRE PRIORITÉ</span></h2>
                        <p className="text-muted-foreground text-sm max-w-md font-light leading-relaxed">Découvrez vos dernières transactions et gérez vos préférences en toute sécurité sur notre plateforme ultra-sécurisée.</p>
                        <Button className="bg-primary hover:bg-primary/90 h-12 rounded-xl px-8 font-black uppercase italic gap-2 mt-4" asChild>
                            <Link href="/#shop">Continuer mes achats <ArrowRight size={18} /></Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="glossy-card border-none rounded-[2.5rem]">
                    <CardHeader>
                        <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                            <Clock size={16} className="text-accent" /> Dernière Commande
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {lastOrder ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-muted-foreground uppercase">ID: #{lastOrder.id.substring(0, 8)}</p>
                                        <p className="text-xl font-black text-white">${lastOrder.total?.toFixed(2)}</p>
                                    </div>
                                    <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[10px] font-black">{lastOrder.status}</Badge>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase font-black">Mode de paiement</p>
                                    <p className="text-xs font-bold flex items-center gap-2">
                                        <ShoppingBag className="w-3 h-3 text-accent" />
                                        {lastOrder.paymentMethod?.replace('_', ' ')}
                                    </p>
                                </div>
                                <Button variant="ghost" className="w-full text-xs font-black uppercase italic gap-2 h-10" asChild>
                                    <Link href="/dashboard/orders">Voir le détail <ArrowRight size={14} /></Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-10 opacity-30 italic flex flex-col items-center gap-3">
                                <ShoppingBag size={40} />
                                <p className="text-xs font-bold">Aucune commande récente</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground ml-2">Mon Hub Personnel</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {customerNavLinks.slice(1).map((link, idx) => (
                        <Link key={idx} href={link.href}>
                            <Card className="glossy-card border-none rounded-[2rem] hover:border-accent/30 transition-all group overflow-hidden h-full">
                                <CardContent className="p-6 flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-all">
                                        <link.icon size={24} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-black uppercase italic text-sm">{link.label}</h4>
                                        <p className="text-[10px] text-muted-foreground font-bold">{link.description}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
      </div>
    );
  }

  // --- VUE ADMIN / STAFF ---
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
         <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs bg-card border-white/10">
              <nav className="grid gap-6 text-lg font-medium mt-10">
                 {adminNavLinks.map(link => (
                   <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-4 px-2.5 ${pathname === link.href ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                 ))}
              </nav>
            </SheetContent>
          </Sheet>

        <Link
            href="/"
            className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary text-lg font-semibold text-primary-foreground md:h-10 md:w-10 md:text-base mr-auto"
          >
             <span className="text-white font-black text-sm italic uppercase">DKS</span>
        </Link>

         <nav className="hidden sm:flex items-center space-x-2 bg-card/40 backdrop-blur-sm border border-white/10 rounded-2xl p-1.5">
            {adminNavLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant={pathname === link.href ? "secondary" : "ghost"}
                  size="sm"
                  className={`rounded-xl px-4 gap-2 font-bold ${pathname === link.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="hidden lg:inline">{link.label}</span>
                </Button>
              </Link>
            ))}
        </nav>
      </header>

      <main className="flex-1 space-y-8 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Tableau de <span className="text-accent">Bord Admin</span></h2>
            <div className="flex items-center space-x-2">
               <Button variant="outline" size="sm" onClick={fetchAdminData} className="border-white/10 bg-white/5 rounded-xl gap-2 font-bold uppercase text-[10px]">
                 <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                 Actualiser
               </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
             <Card className="glossy-card border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Revenu Total (CDF)</CardTitle>
                <DollarSign className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{formatCurrency(stats?.totalRevenueCDF || 0)}</div>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">≈ {formatCurrency((stats?.totalRevenueCDF || 0) / rate)} USD</p>
              </CardContent>
            </Card>
             <Card className="glossy-card border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ventes aujourd'hui</CardTitle>
                <TrendingUp className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{stats?.todaySalesCount || 0}</div>
                <p className="text-[10px] text-accent mt-1 uppercase font-bold">+{formatCurrency(stats?.todayRevenue || 0)} CDF</p>
              </CardContent>
            </Card>
             <Card className="glossy-card border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Transactions</CardTitle>
                <ShoppingCart className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{stats?.totalSalesCount || 0}</div>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Toutes périodes</p>
              </CardContent>
            </Card>
             <Card className="glossy-card border-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Catalogue Produits</CardTitle>
                <Package className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-black">{stats?.totalProductsCount || 0}</div>
                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Articles enregistrés</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 glossy-card border-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold uppercase italic flex items-center gap-2">
                   <AlertTriangle className="text-destructive" size={20} />
                   Alertes Stocks Faibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStock.length > 0 ? (
                    <div className="space-y-4">
                        {lowStock.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                        <img src={item.imageUrl} alt={item.name} className="object-cover" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{item.name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{item.category}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="destructive" className="font-black">{item.stockQuantity} RESTANTS</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center py-10 text-muted-foreground italic">Aucune alerte de stock pour le moment.</p>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-3 glossy-card border-none">
              <CardHeader>
                <CardTitle className="text-lg font-bold uppercase italic">Ventes Récentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                    {recentSales.map(sale => (
                        <div key={sale.id} className="flex items-center gap-4">
                            <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-black text-xs">
                                {sale.cashierName?.substring(0, 1)}
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold">{sale.cashierName}</p>
                                <p className="text-[10px] text-muted-foreground">ID: #{sale.id.substring(0, 6)}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-sm">{formatCurrency(sale.totalAmount)} CDF</p>
                                <p className="text-[10px] text-accent font-bold uppercase">PAYÉ</p>
                            </div>
                        </div>
                    ))}
                    {recentSales.length === 0 && <p className="text-center py-10 text-muted-foreground">Aucune vente enregistrée.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
      </main>
    </div>
  );
}

export default withAuth(DashboardPage);
