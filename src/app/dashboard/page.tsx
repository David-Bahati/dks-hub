
"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import {
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
  User,
  Headset,
  ArrowRight,
  Clock,
  Sparkles,
  Tags,
  Zap,
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  MapPin,
  MessageCircle,
  ExternalLink,
  Wrench,
  GraduationCap,
  Laptop,
  Trophy,
  Crown,
  Star,
  FileText
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
    getRecentSales,
    getRevenueChartData
} from '@/lib/data';
import { Product } from '@/lib/types';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/context/AuthContext';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const navConfig = [
  { href: "/dashboard", icon: LineChart, label: "Aperçu", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/products", icon: Package, label: "Produits", roles: ["Admin", "Seller"] },
  { href: "/dashboard/categories", icon: Tags, label: "Catégories", roles: ["Admin", "Seller"] },
  { href: "/dashboard/orders", icon: ShoppingBag, label: "Commandes", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/services", icon: GraduationCap, label: "Services & Pôles", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/support", icon: Wrench, label: "SAV & Support", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/hardware", icon: Laptop, label: "Parc Hardware", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/customers", icon: Users, label: "Clients", roles: ["Admin", "Seller", "Cashier"] },
  { href: "/dashboard/users", icon: UsersRound, label: "Équipe", roles: ["Admin"] },
  { href: "/dashboard/settings", icon: Settings, label: "Réglages", roles: ["Admin", "customer"] },
];

function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [rate, setRate] = useState(2500);

  const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

  const filteredNavLinks = navConfig.filter(link => {
      const roles = link.roles.map(r => r.toLowerCase());
      const userRole = user?.role?.toLowerCase() || "";
      return roles.includes(userRole);
  });

  const ordersQuery = useMemoFirebase(() => {
    if (authLoading || !user?.uid) return null;
    return query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(5));
  }, [user?.uid, authLoading]);
  
  const { data: userOrders } = useCollection(ordersQuery);

  const bookingsQuery = useMemoFirebase(() => {
    if (authLoading || !user?.uid) return null;
    return query(collection(db, "serviceBookings"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(3));
  }, [user?.uid, authLoading]);

  const { data: userBookings } = useCollection(bookingsQuery);

  const assetsQuery = useMemoFirebase(() => {
    if (authLoading || !user?.uid) return null;
    return query(collection(db, "hardwareAssets"), where("userId", "==", user.uid));
  }, [user?.uid, authLoading]);

  const { data: userAssets } = useCollection(assetsQuery);

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
      const [dashboardStats, lowStockItems, recent, exchangeRate, revenueData] = await Promise.all([
        getDashboardStats(),
        getLowStockItems(),
        getRecentSales(),
        getExchangeRate(),
        getRevenueChartData()
      ]);
      setStats(dashboardStats);
      setLowStock(lowStockItems);
      setRecentSales(recent);
      setRate(exchangeRate);
      setChartData(revenueData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s?.includes('payé') || s?.includes('ready') || s === 'completed') {
      return <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[9px] font-black px-2 py-0.5">OK</Badge>;
    }
    return <Badge className="bg-orange-500/10 text-orange-400 border-none uppercase text-[9px] font-black px-2 py-0.5">ATTENTE</Badge>;
  };

  const LoyaltyIcon = () => {
    if (user?.loyaltyLevel === 'Gold') return <Crown className="text-yellow-400" size={24} />;
    if (user?.loyaltyLevel === 'Silver') return <Star className="text-slate-300" size={24} />;
    return <Trophy className="text-orange-400" size={24} />;
  };

  if (loading || authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  // --- VUE CLIENT ---
  if (!isStaff) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="border-b border-white/5 bg-background/40 backdrop-blur-2xl py-6 px-4 md:px-8">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <Logo size="md" showText />
                    <nav className="hidden md:flex items-center gap-2">
                        {filteredNavLinks.map(link => (
                            <Link key={link.href} href={link.href}>
                                <Button variant="ghost" className={cn("h-10 rounded-xl font-black uppercase italic text-[10px] tracking-widest", pathname === link.href ? "text-accent bg-accent/10" : "text-muted-foreground")}>
                                    <link.icon size={14} className="mr-2" /> {link.label}
                                </Button>
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/"><Button variant="outline" className="rounded-xl border-white/10 h-10 font-bold text-xs uppercase italic"><ShoppingCart size={14} className="mr-2" /> Boutique</Button></Link>
                </div>
            </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 space-y-8 pb-20">
            {/* HERO MIXTE (SERVICE + BOUTIQUE) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 glossy-card border-none rounded-[2.5rem] overflow-hidden relative group bg-gradient-to-br from-primary/20 to-accent/10">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity"><Sparkles size={120} className="text-accent" /></div>
                    <CardContent className="p-10 space-y-6">
                        <div className="flex items-center gap-3">
                            <Badge className="bg-accent/20 text-accent border-none font-black uppercase tracking-tighter px-3 py-1">Membre {user?.loyaltyLevel || 'Bronze'}</Badge>
                            <LoyaltyIcon />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase italic leading-none tracking-tighter">VOTRE UNIVERS<br /><span className="text-accent">DKS SUPREME</span></h2>
                        <p className="text-muted-foreground text-sm max-w-md font-light leading-relaxed">
                            Gérez vos achats informatiques, suivez votre parc matériel et accédez à nos services d'experts à Bunia.
                        </p>
                        <div className="flex flex-wrap gap-4 mt-6">
                            <Button className="bg-primary hover:bg-primary/90 h-14 rounded-xl px-8 font-black uppercase italic gap-2 shadow-xl" asChild>
                                <Link href="/#shop">Acheter du Hardware <ArrowRight size={18} /></Link>
                            </Button>
                            <Button variant="outline" className="border-white/10 h-14 rounded-xl px-8 font-black uppercase italic gap-2 bg-white/5 backdrop-blur-xl" asChild>
                                <Link href="/services">Réserver un Service <Wrench size={18} /></Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glossy-card border-none rounded-[2.5rem] flex flex-col hover:border-accent/20 transition-all overflow-hidden bg-card/40">
                    <CardHeader className="bg-white/5"><CardTitle className="text-xs font-black uppercase italic tracking-widest flex items-center gap-2 text-accent"><TrendingUp size={16} /> Statistiques Hub</CardTitle></CardHeader>
                    <CardContent className="p-8 space-y-6 flex-1 flex flex-col justify-center">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <p className="text-3xl font-black text-white">{userOrders?.length || 0}</p>
                                <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Achats</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-3xl font-black text-accent">{userBookings?.length || 0}</p>
                                <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Services</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-3xl font-black text-primary">{userAssets?.length || 0}</p>
                                <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Appareils</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-3xl font-black text-orange-400">{user?.points || 0}</p>
                                <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">Points DKS</p>
                            </div>
                        </div>
                        <Link href="/dashboard/referrals" className="block pt-4">
                            <Button variant="ghost" className="w-full justify-between h-12 bg-white/5 rounded-xl text-[9px] font-black uppercase italic">
                                Programme Ambassadeur <ArrowRight size={14} />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* SECTION BOUTIQUE : DERNIÈRES COMMANDES */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3">
                            <ShoppingBag className="text-accent" /> Historique <span className="text-accent">Achats</span>
                        </h3>
                        <Link href="/dashboard/orders">
                            <Button variant="link" className="text-[10px] font-black uppercase italic text-muted-foreground hover:text-accent">Tout voir</Button>
                        </Link>
                    </div>

                    <div className="space-y-4">
                        {userOrders && userOrders.length > 0 ? userOrders.map((order) => (
                            <Card key={order.id} className="bg-white/5 border border-white/5 rounded-[1.5rem] overflow-hidden group hover:border-accent/30 transition-all">
                                <CardContent className="p-6 flex items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase italic">Commande #{order.id.substring(0, 8)}</p>
                                            <p className="text-[9px] text-muted-foreground font-bold uppercase">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'Récemment'}</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 hidden md:block">
                                        <div className="flex gap-2">
                                            {order.items?.slice(0, 2).map((item: any, idx: number) => (
                                                <Badge key={idx} variant="outline" className="bg-white/5 border-none text-[8px] font-bold uppercase">{item.name}</Badge>
                                            ))}
                                            {order.items?.length > 2 && <span className="text-[8px] text-muted-foreground">+{order.items.length - 2} articles</span>}
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-6">
                                        <div>
                                            <p className="text-lg font-black text-white">${order.total?.toFixed(2)}</p>
                                            {getStatusBadge(order.status)}
                                        </div>
                                        <Link href="/dashboard/orders">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 hover:bg-accent hover:text-black">
                                                <FileText size={18} />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )) : (
                            <div className="py-20 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10 opacity-30 italic text-sm">
                                Aucun achat enregistré sur cette plateforme.
                            </div>
                        )}
                    </div>
                </div>

                {/* SECTION HUB : SERVICES & MAINTENANCE */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3">
                            <GraduationCap className="text-primary" /> Prestations <span className="text-primary">Hub</span>
                        </h3>
                    </div>
                    
                    <div className="space-y-4">
                        {userBookings && userBookings.length > 0 ? userBookings.map((booking) => (
                            <Card key={booking.id} className="bg-white/5 border border-white/5 rounded-2xl hover:border-primary/30 transition-all overflow-hidden">
                                <CardContent className="p-5 flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Wrench size={18} />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <h4 className="text-xs font-black uppercase italic line-clamp-1">{booking.serviceTitle}</h4>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[9px] text-muted-foreground font-bold uppercase">{booking.scheduledDate || 'Date à fixer'}</p>
                                            <Badge className="bg-white/5 text-[8px] font-black uppercase border-none">{booking.status}</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )) : (
                            <div className="p-10 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 opacity-30 italic text-[10px]">
                                Aucune réservation de service.
                            </div>
                        )}
                        <Button className="w-full h-12 bg-white/5 hover:bg-primary/20 border border-white/10 rounded-xl font-black uppercase italic text-[10px] gap-2" asChild>
                            <Link href="/dashboard/services">Gérer mes interventions <ArrowRight size={14} /></Link>
                        </Button>
                    </div>

                    {/* SECTION PARC HARDWARE (Petit widget) */}
                    <div className="pt-6">
                         <h3 className="text-sm font-black uppercase italic tracking-widest text-muted-foreground mb-4">Mon Parc Hardware</h3>
                         <div className="p-6 bg-black/40 rounded-[2rem] border border-white/5 space-y-4">
                            {userAssets && userAssets.length > 0 ? (
                                <div className="space-y-3">
                                    {userAssets.slice(0, 2).map((asset) => (
                                        <div key={asset.id} className="flex items-center gap-3">
                                            <Laptop size={14} className="text-accent" />
                                            <span className="text-[10px] font-bold uppercase truncate">{asset.brand} {asset.model}</span>
                                        </div>
                                    ))}
                                    <Link href="/dashboard/hardware" className="block pt-2 text-[9px] font-black uppercase italic text-accent hover:underline">Accéder au parc complet</Link>
                                </div>
                            ) : (
                                <p className="text-[10px] text-muted-foreground italic">Enregistrez vos appareils pour un suivi expert.</p>
                            )}
                         </div>
                    </div>
                </div>
            </div>
        </main>
      </div>
    );
  }

  // --- VUE STAFF ---
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-white/5 bg-background/40 backdrop-blur-2xl px-6">
         <Sheet>
            <SheetTrigger asChild><Button size="icon" variant="ghost" className="sm:hidden text-muted-foreground"><PanelLeft className="h-5 w-5" /><span className="sr-only">Menu</span></Button></SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs bg-card/95 backdrop-blur-3xl border-r border-white/5 p-0">
                <div className="p-8 border-b border-white/5"><Logo size="sm" showText /></div>
              <nav className="grid gap-1 p-4">
                 {filteredNavLinks.map(link => (
                   <Link key={link.href} href={link.href} className={cn("group flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium", pathname === link.href ? 'bg-accent/10 text-accent border-l-2 border-accent rounded-l-none' : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
                    <link.icon className={cn("h-4 w-4 transition-transform group-hover:translate-x-0.5", pathname === link.href ? 'text-accent' : '')} />{link.label}
                  </Link>
                 ))}
              </nav>
            </SheetContent>
          </Sheet>

        <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-6"><Logo size="sm" /><h2 className="text-lg md:text-xl tracking-tighter"><span className="font-light text-slate-400 uppercase">Tableau de bord</span> <span className="font-bold text-white uppercase italic">{user?.role}</span></h2></div>
            <nav className="hidden xl:flex items-center gap-1">
                {filteredNavLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                        <Button variant="ghost" size="sm" className={cn("group rounded-none h-20 px-4 gap-2.5 font-medium transition-all text-[10px] relative", pathname === link.href ? 'text-accent' : 'text-slate-400 hover:text-white')}>
                            <link.icon className={cn("h-4 w-4 transition-transform group-hover:translate-x-0.5", pathname === link.href ? 'text-accent' : '')} /><span>{link.label}</span>
                            {pathname === link.href && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
                        </Button>
                    </Link>
                ))}
            </nav>
            <div className="flex items-center gap-6">
                {(user?.role?.toLowerCase() === 'cashier' || user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'caissier') && <Link href="/pos"><Button className="bg-accent text-black font-black uppercase italic text-xs rounded-2xl h-11 px-6 shadow-xl shadow-accent/10">Caisse</Button></Link>}
                <Button variant="ghost" size="icon" onClick={fetchAdminData} className="h-10 w-10 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-xl transition-all group"><RefreshCw size={18} className={cn("transition-transform duration-700", loading ? "animate-spin" : "group-hover:rotate-180")} /></Button>
            </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             <Card className="lg:col-span-2 glossy-card border-none rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent/5 rounded-full blur-3xl group-hover:bg-accent/20 transition-all duration-700" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1"><CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Revenu Global Hub</CardTitle></div>
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-[0_0_20px_rgba(56,189,248,0.3)]"><DollarSign className="h-6 w-6" /></div>
              </CardHeader>
              <CardContent className="pt-4"><div className="text-5xl font-bold font-mono tracking-tighter text-white">{new Intl.NumberFormat('fr-FR').format(stats?.totalRevenueCDF || 0)} <span className="text-xl font-light opacity-30">CDF</span></div><div className="mt-4"><Badge variant="outline" className="border-white/5 bg-white/5 px-3 py-1 font-mono text-slate-400">≈ {new Intl.NumberFormat('fr-FR').format(stats?.totalRevenueUSD || 0)} USD</Badge></div></CardContent>
            </Card>

             <Card className="glossy-card border-none rounded-[2.5rem] group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Services Jour</CardTitle><div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500"><GraduationCap className="h-5 w-5" /></div></CardHeader>
              <CardContent className="pt-4"><div className="text-3xl font-bold font-mono">12</div><p className="text-[10px] text-accent mt-2 uppercase font-black tracking-widest bg-accent/10 w-fit px-2 py-1 rounded-md">8 Formations / 4 SAV</p></CardContent>
            </Card>

             <Card className="glossy-card border-none rounded-[2.5rem] group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clientèle Hub</CardTitle><div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white transition-all duration-500"><UsersRound className="h-5 w-5" /></div></CardHeader>
              <CardContent className="pt-4"><div className="text-3xl font-bold font-mono">{stats?.totalProductsCount || 0}</div><p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-widest">Membres Actifs</p></CardContent>
            </Card>
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
            <Card className="lg:col-span-4 glossy-card border-none rounded-[2.5rem] overflow-hidden">
                <CardHeader className="py-6 px-8"><CardTitle className="text-lg font-bold uppercase italic flex items-center gap-3"><BarChart3 className="text-accent" size={20} /> Tendances Hub (7j)</CardTitle></CardHeader>
                <CardContent className="px-4 pb-8 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs><linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/></linearGradient></defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: 'hsl(var(--accent))' }} />
                            <Area type="monotone" dataKey="total" stroke="hsl(var(--accent))" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="lg:col-span-3 glossy-card border-none rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-white/[0.02] py-6 px-8"><CardTitle className="text-lg font-bold uppercase italic flex items-center gap-3"><Zap size={20} className="text-accent" /> Mix d'Activité</CardTitle></CardHeader>
                <CardContent className="p-8 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={[
                                { name: 'Ventes', value: stats?.totalSalesCount || 10, color: 'hsl(var(--accent))' },
                                { name: 'Formations', value: 15, color: 'hsl(var(--primary))' },
                                { name: 'Services', value: 8, color: 'hsl(var(--destructive))' },
                            ]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={10} dataKey="value">
                                {[
                                    { name: 'Ventes', value: stats?.totalSalesCount || 10, color: 'hsl(var(--accent))' },
                                    { name: 'Formations', value: 15, color: 'hsl(var(--primary))' },
                                    { name: 'Services', value: 8, color: 'hsl(var(--destructive))' },
                                ].map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '10px' }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-6 mt-4">
                        {[
                            { name: 'Ventes', color: 'hsl(var(--accent))' },
                            { name: 'Formations', color: 'hsl(var(--primary))' },
                            { name: 'Services', color: 'hsl(var(--destructive))' },
                        ].map((s, i) => <div key={i} className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} /><span className="text-[9px] font-black uppercase text-muted-foreground">{s.name}</span></div>)}
                    </div>
                </CardContent>
            </Card>
          </div>
      </main>
    </div>
  );
}

export default withAuth(DashboardPage);
