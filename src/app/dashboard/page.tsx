
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
  ArrowRight,
  Clock,
  Sparkles,
  Tags,
  Zap,
  Wrench,
  GraduationCap,
  Laptop,
  Trophy,
  Crown,
  Star,
  Home,
  BarChart3,
  Calendar,
  MonitorSmartphone,
  PieChart as PieChartIcon,
  Bell,
  CheckCircle2,
  AlertCircle
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
  Cell,
  Legend
} from 'recharts';

const navConfig = [
  { href: "/dashboard", icon: LineChart, label: "Aperçu", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/products", icon: Package, label: "Produits / Stock", roles: ["Admin", "Seller"] },
  { href: "/dashboard/categories", icon: Tags, label: "Catégories", roles: ["Admin", "Seller"] },
  { href: "/dashboard/orders", icon: ShoppingBag, label: "Commandes / Factures", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/services", icon: GraduationCap, label: "Services Hub", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/remote", icon: MonitorSmartphone, label: "Support Direct", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/support", icon: Wrench, label: "SAV & Support", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/hardware", icon: Laptop, label: "Parc Hardware", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/customers", icon: Users, label: "Base Clients", roles: ["Admin", "Seller", "Cashier"] },
  { href: "/dashboard/users", icon: UsersRound, label: "Équipe DKS", roles: ["Admin"] },
  { href: "/dashboard/settings", icon: Settings, label: "Réglages", roles: ["Admin", "customer"] },
];

function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
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
    if (isStaff) return query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(10));
    return query(collection(db, "orders"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(5));
  }, [user?.uid, authLoading, isStaff]);
  const { data: orders } = useCollection(ordersQuery);

  const notificationsQuery = useMemoFirebase(() => {
    if (authLoading || !user?.uid) return null;
    return query(collection(db, "notifications"), where("userId", "==", isStaff ? 'staff' : user.uid), orderBy("createdAt", "desc"), limit(6));
  }, [user?.uid, authLoading, isStaff]);
  const { data: recentNotifs } = useCollection(notificationsQuery);

  useEffect(() => {
    fetchGlobalData();
  }, [isStaff, authLoading]);

  const fetchGlobalData = async () => {
    setLoading(true);
    try {
      const [dashboardStats, lowStockItems, exchangeRate, revenueData] = await Promise.all([
        getDashboardStats(),
        getLowStockItems(),
        getExchangeRate(),
        getRevenueChartData()
      ]);
      setStats(dashboardStats);
      setLowStock(lowStockItems);
      setRate(exchangeRate);
      setChartData(revenueData);
    } catch (error) {
      console.error("Dashboard Data Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (s?.includes('payé') || s?.includes('ready') || s === 'completed' || s === 'payée') {
      return <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[9px] font-black px-2 py-0.5">TERMINÉ</Badge>;
    }
    return <Badge className="bg-orange-500/10 text-orange-400 border-none uppercase text-[9px] font-black px-2 py-0.5">EN COURS</Badge>;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Initialisation du Hub Elite...</p>
      </div>
    );
  }

  const SidebarContent = () => (
    <nav className="grid gap-1 p-6">
      <div className="mb-8 px-4"><Logo size="sm" showText /></div>
      {filteredNavLinks.map(link => (
        <Link key={link.href} href={link.href} className={cn("group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-bold", pathname === link.href ? 'bg-accent/10 text-accent' : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
          <link.icon className={cn("h-4 w-4", pathname === link.href ? 'text-accent' : '')} />{link.label}
        </Link>
      ))}
      <div className="mt-10 pt-10 border-t border-white/5 px-4">
        <Link href="/"><Button variant="outline" className="w-full justify-start rounded-xl border-white/5 gap-3 h-12 text-xs font-black uppercase italic"><Home size={16} /> Retour Boutique</Button></Link>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-white/5 bg-background/40 backdrop-blur-2xl px-6">
         <Sheet>
            <SheetTrigger asChild><Button size="icon" variant="ghost" className="xl:hidden text-muted-foreground"><PanelLeft className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs bg-card/95 backdrop-blur-3xl border-r border-white/5 p-0">
                <SidebarContent />
            </SheetContent>
          </Sheet>

        <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Logo size="sm" />
              <h2 className="text-lg md:text-xl tracking-tighter uppercase">
                <span className="font-light text-slate-400">Hub</span> <span className="font-bold text-white italic">{isStaff ? 'Staff' : 'Personnel'}</span>
              </h2>
            </div>
            
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
                <Button variant="ghost" size="icon" onClick={fetchGlobalData} className="h-10 w-10 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-xl transition-all group">
                  <RefreshCw size={18} className={cn("transition-transform duration-700", loading ? "animate-spin" : "group-hover:rotate-180")} />
                </Button>
            </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-8 pb-24 max-w-[1600px] mx-auto w-full">
          {/* STATS RAPIDES (Staff) */}
          {isStaff && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="lg:col-span-2 glossy-card border-none rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent/5 rounded-full blur-3xl" />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Volume d'Affaires Global</CardTitle>
                  <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><DollarSign className="h-6 w-6" /></div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-5xl font-bold font-mono tracking-tighter text-white">
                    {new Intl.NumberFormat('fr-FR').format(stats?.totalRevenueCDF || 0)} 
                    <span className="text-xl font-light opacity-30 ml-2">CDF</span>
                  </div>
                  <Badge variant="outline" className="mt-4 border-white/5 bg-white/5 px-3 py-1 font-mono text-slate-400">
                    ≈ {new Intl.NumberFormat('fr-FR').format(stats?.totalRevenueUSD || 0)} USD
                  </Badge>
                </CardContent>
              </Card>

              <Card className="glossy-card border-none rounded-[2.5rem]">
                <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ventes Terminées</CardTitle><div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><ShoppingCart className="h-5 w-5" /></div></CardHeader>
                <CardContent className="pt-4"><div className="text-3xl font-bold font-mono">{stats?.totalSalesCount || 0}</div></CardContent>
              </Card>

              <Card className="glossy-card border-none rounded-[2.5rem]">
                <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Articles Critiques</CardTitle><div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500"><Package className="h-5 w-5" /></div></CardHeader>
                <CardContent className="pt-4"><div className="text-3xl font-bold font-mono">{lowStock.length}</div></CardContent>
              </Card>
            </div>
          )}

          {/* VUE CLIENT (Hero Card) */}
          {!isStaff && (
            <Card className="bg-primary/10 border-primary/20 rounded-[3rem] p-10 relative overflow-hidden mb-12">
               <div className="absolute top-0 right-0 p-12 opacity-5"><Logo size="xl" /></div>
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                  <div className="space-y-6 text-center md:text-left">
                      <Badge className="bg-primary text-white border-none px-4 py-1.5 font-black uppercase italic">Membre Privilège DKS</Badge>
                      <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-tight text-white">BIENVENUE DANS <br />VOTRE <span className="text-primary">HUB CENTRAL</span></h1>
                      <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                          <Link href="/services"><Button className="h-14 px-8 rounded-2xl bg-white text-primary font-black uppercase italic shadow-xl">Nouvelle Demande Service</Button></Link>
                          <Link href="/"><Button variant="outline" className="h-14 px-8 rounded-2xl border-white/10 font-black uppercase italic">Aller à la Boutique</Button></Link>
                      </div>
                  </div>
                  <div className="bg-black/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 min-w-[300px] text-center">
                      <p className="text-[10px] font-black uppercase opacity-40 mb-2">Points Fidélité Cumulés</p>
                      <p className="text-6xl font-black text-primary italic">{(orders?.length || 0) * 100}</p>
                      <p className="text-[9px] font-bold uppercase mt-4 text-muted-foreground">Progression vers Membre Gold</p>
                  </div>
               </div>
            </Card>
          )}

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
            {/* GRAPHIQUE OU HISTORIQUE PRINCIPAL */}
            <Card className="lg:col-span-4 glossy-card border-none rounded-[2.5rem] overflow-hidden">
                <CardHeader className="py-6 px-8 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold uppercase italic flex items-center gap-3">
                    {isStaff ? <BarChart3 className="text-accent" size={20} /> : <ShoppingBag className="text-accent" size={20} />}
                    {isStaff ? 'Tendances Financières (7j)' : 'Mes Derniers Achats'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-8 h-[350px]">
                    {isStaff ? (
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                              <defs><linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/></linearGradient></defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px' }} itemStyle={{ color: 'hsl(var(--accent))' }} />
                              <Area type="monotone" dataKey="total" stroke="hsl(var(--accent))" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                          </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="divide-y divide-white/5">
                        {orders && orders.length > 0 ? orders.map((order) => (
                            <div key={order.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors rounded-2xl group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-accent transition-colors"><ShoppingBag size={20} /></div>
                                    <div>
                                        <p className="font-bold text-sm">Commande #{order.id.substring(0, 8).toUpperCase()}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{order.createdAt?.toDate?.().toLocaleDateString() || 'Récemment'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-accent text-lg">${order.total?.toFixed(2)}</p>
                                    {getStatusBadge(order.status)}
                                </div>
                            </div>
                        )) : (
                          <div className="h-full flex flex-col items-center justify-center opacity-30 italic"><ShoppingBag size={48} className="mb-4" /><p>Aucune commande enregistrée.</p></div>
                        )}
                      </div>
                    )}
                </CardContent>
            </Card>

            {/* FLUX D'ACTIVITÉ / NOTIFICATIONS (Nouveau) */}
            <Card className="lg:col-span-3 glossy-card border-none rounded-[2.5rem] overflow-hidden flex flex-col">
                <CardHeader className="py-6 px-8 border-b border-white/5 bg-white/[0.02]">
                  <CardTitle className="text-lg font-bold uppercase italic flex items-center gap-3">
                    <Bell className="text-primary" size={20} /> Journal du Hub
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto max-h-[350px] custom-scrollbar">
                    <div className="divide-y divide-white/5">
                        {recentNotifs && recentNotifs.length > 0 ? recentNotifs.map((notif) => (
                            <div key={notif.id} className={cn("p-5 flex items-start gap-4 transition-colors hover:bg-white/5", !notif.isRead && "bg-accent/5 border-l-2 border-l-accent")}>
                                <div className={cn(
                                  "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center",
                                  notif.type === 'error' ? 'bg-red-500/10 text-red-500' : notif.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'
                                )}>
                                    {notif.type === 'error' ? <AlertCircle size={18} /> : notif.type === 'success' ? <CheckCircle2 size={18} /> : <Zap size={18} />}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-black uppercase tracking-tight">{notif.title}</p>
                                    <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{notif.message}</p>
                                    <p className="text-[8px] font-bold uppercase opacity-30">{notif.createdAt?.toDate?.().toLocaleTimeString() || 'Maintenant'}</p>
                                </div>
                            </div>
                        )) : (
                          <div className="p-20 text-center opacity-20 italic text-xs">Aucune activité récente.</div>
                        )}
                    </div>
                </CardContent>
                <div className="p-4 border-t border-white/5 bg-black/20 text-center">
                    <Link href="/dashboard/notifications" className="text-[10px] font-black uppercase italic text-accent hover:underline">Voir tout l'historique <ArrowRight size={10} className="inline ml-1"/></Link>
                </div>
            </Card>
          </div>

          {/* SECTION DU BAS : RÉCAP RÉCENT */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
              <Card className="lg:col-span-4 glossy-card border-none rounded-[2.5rem] overflow-hidden">
                <CardHeader className="py-6 px-8 flex items-center justify-between flex-row">
                    <CardTitle className="text-lg font-bold uppercase italic flex items-center gap-3"><MonitorSmartphone className="text-primary" size={20} /> Prestations en cours</CardTitle>
                    <Link href="/dashboard/services"><Button variant="ghost" size="sm" className="h-8 rounded-lg text-[9px] font-black uppercase bg-white/5">Gérer</Button></Link>
                </CardHeader>
                <CardContent className="p-0">
                    {/* On réutilise les ordres ou bookings selon le role */}
                    <div className="divide-y divide-white/5">
                        {/* Simulation d'un affichage de service rapide */}
                        <div className="p-5 flex items-center justify-between opacity-30 italic text-xs text-center w-full">Chargez les modules de services pour plus de détails...</div>
                    </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3 glossy-card border-none rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="py-6 px-8"><CardTitle className="text-lg font-bold uppercase italic flex items-center gap-3"><PieChartIcon className="text-accent" size={20} /> Mix d'Activité</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-8 h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie data={stats?.breakdown || []} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                                  {stats?.breakdown?.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }} />
                              <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase' }} />
                          </PieChart>
                      </ResponsiveContainer>
                  </CardContent>
              </Card>
          </div>
      </main>
    </div>
  );
}

export default withAuth(DashboardPage);
