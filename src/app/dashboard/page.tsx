
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
  Sparkles,
  Search,
  Plus
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
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

const adminNavLinks = [
  { href: "/dashboard", icon: LineChart, label: "Aperçu" },
  { href: "/dashboard/products", icon: Package, label: "Produits" },
  { href: "/dashboard/orders", icon: ShoppingBag, label: "Commandes" },
  { href: "/dashboard/customers", icon: Users, label: "Clients" },
  { href: "/dashboard/users", icon: UsersRound, label: "Équipe" },
  { href: "/dashboard/settings", icon: Settings, label: "Réglages" },
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

  if (!isStaff) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="border-b border-white/5 bg-background/40 backdrop-blur-2xl py-6 px-4 md:px-8">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Logo size="md" />
                    <div>
                        <h1 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Mon Espace <span className="text-accent">Client</span></h1>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Heureux de vous revoir, {user?.name}</p>
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

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/5 bg-background/40 backdrop-blur-2xl px-6">
         <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="sm:hidden text-muted-foreground">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs bg-card/95 backdrop-blur-3xl border-r border-white/5 p-0">
                <div className="p-8 border-b border-white/5">
                   <Logo size="sm" showText={true} />
                </div>
              <nav className="grid gap-1 p-4">
                 {adminNavLinks.map(link => (
                   <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                        "group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium",
                        pathname === link.href 
                            ? 'bg-accent/10 text-accent border-l-2 border-accent rounded-l-none' 
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <link.icon className={cn("h-4 w-4 transition-transform group-hover:translate-x-0.5", pathname === link.href ? 'text-accent' : '')} />
                    {link.label}
                  </Link>
                 ))}
              </nav>
            </SheetContent>
          </Sheet>

        <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Logo size="sm" />
                <h2 className="text-lg md:text-xl tracking-tighter">
                    <span className="font-light text-slate-400 uppercase">Tableau de bord</span>{" "}
                    <span className="font-bold text-white uppercase italic">Admin</span>
                </h2>
            </div>

            <nav className="hidden sm:flex items-center gap-0.5">
                {adminNavLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                "group rounded-none h-16 px-5 gap-2.5 font-medium transition-all text-[11px] relative",
                                pathname === link.href 
                                    ? 'text-accent' 
                                    : 'text-slate-400 hover:text-white'
                            )}
                        >
                            <link.icon className={cn("h-4 w-4 transition-transform group-hover:translate-x-0.5", pathname === link.href ? 'text-accent' : '')} />
                            <span>{link.label}</span>
                            {pathname === link.href && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                            )}
                        </Button>
                    </Link>
                ))}
            </nav>

            <div className="flex items-center gap-3">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={fetchAdminData} 
                    className="h-9 w-9 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-xl transition-all group"
                >
                    <RefreshCw size={16} className={cn("transition-transform duration-700", loading ? "animate-spin" : "group-hover:rotate-180")} />
                </Button>
            </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             <Card className="lg:col-span-2 glossy-card border-none rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-all duration-700" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Revenu Global Boutique</CardTitle>
                    <p className="text-[9px] text-accent font-bold uppercase tracking-widest">Temps réel</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-[0_0_20px_rgba(56,189,248,0.3)] group-hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] transition-all">
                    <DollarSign className="h-6 w-6" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-5xl font-bold font-mono tracking-tighter text-white">
                    {formatCurrency(stats?.totalRevenueCDF || 0)} <span className="text-xl font-light opacity-30">CDF</span>
                </div>
                <div className="mt-4 flex items-center gap-4">
                    <Badge variant="outline" className="border-white/5 bg-white/5 px-3 py-1 font-mono text-slate-400">
                        ≈ {formatCurrency((stats?.totalRevenueCDF || 0) / rate)} USD
                    </Badge>
                    <span className="text-[10px] text-slate-500 italic font-light">Taux : 1 USD = {rate} CDF</span>
                </div>
              </CardContent>
            </Card>

             <Card className="glossy-card border-none rounded-[2.5rem] group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ventes Jour</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white shadow-[0_0_15px_rgba(37,99,235,0.2)] group-hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] transition-all duration-500">
                    <TrendingUp className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold font-mono">{stats?.todaySalesCount || 0}</div>
                <p className="text-[10px] text-accent mt-2 uppercase font-black tracking-widest bg-accent/10 w-fit px-2 py-1 rounded-md">
                    +{formatCurrency(stats?.todayRevenue || 0)} CDF
                </p>
              </CardContent>
            </Card>

             <Card className="glossy-card border-none rounded-[2.5rem] group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Inventaire</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] transition-all duration-500">
                    <Package className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold font-mono">{stats?.totalProductsCount || 0}</div>
                <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-widest">Articles actifs</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4 glossy-card border-none rounded-[2.5rem] overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.02] flex flex-row items-center justify-between py-6 px-8">
                <CardTitle className="text-lg font-bold uppercase italic flex items-center gap-3">
                   <AlertTriangle className="text-destructive animate-pulse" size={20} />
                   Alertes Stock
                </CardTitle>
                <Badge className="bg-destructive/10 text-destructive border-none font-black text-[10px] px-3">{lowStock.length} ALERTES</Badge>
              </CardHeader>
              <CardContent className="p-8">
                {lowStock.length > 0 ? (
                    <div className="space-y-4">
                        {lowStock.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-background border border-white/5 flex items-center justify-center overflow-hidden">
                                        <img src={item.imageUrl} alt={item.name} className="object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm uppercase italic">{item.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.category}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="destructive" className="font-black italic uppercase text-[10px] px-3 py-1 shadow-lg shadow-destructive/20">
                                        {item.stockQuantity} RESTANTS
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                            <Package size={40} className="text-slate-400" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold uppercase italic tracking-widest text-slate-300">Inventaire Sain</p>
                            <p className="text-[10px] font-bold text-slate-500">Aucun produit en rupture de stock.</p>
                        </div>
                    </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 glossy-card border-none rounded-[2.5rem] overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/[0.02] py-6 px-8">
                <CardTitle className="text-lg font-bold uppercase italic flex items-center gap-3">
                    <ShoppingBag size={20} className="text-accent" />
                    Flux Récent
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                    {recentSales.map(sale => (
                        <div key={sale.id} className="flex items-center gap-5 group">
                            <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-black text-xs group-hover:bg-accent group-hover:text-black transition-all duration-300">
                                {sale.cashierName?.substring(0, 1)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-bold uppercase italic">{sale.cashierName}</p>
                                    <p className="font-mono font-bold text-sm text-white">{formatCurrency(sale.totalAmount)} <span className="text-[9px] font-light opacity-30">CDF</span></p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">REF: #{sale.id.substring(0, 8)}</p>
                                    <Badge className="bg-accent/10 text-accent border-none text-[8px] font-black uppercase px-2 h-4">SUCCESS</Badge>
                                </div>
                            </div>
                        </div>
                    ))}
                    {recentSales.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-30">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                                <LineChart size={40} className="text-slate-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold uppercase italic tracking-widest text-slate-300">Prêt pour l'activité</p>
                                <p className="text-[10px] font-bold text-slate-500">Vos futures ventes apparaîtront ici.</p>
                            </div>
                        </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
      </main>
    </div>
  );
}

export default withAuth(DashboardPage);
