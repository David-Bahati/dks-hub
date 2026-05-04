
"use client";

import { useEffect, useState, useMemo, useRef } from 'react';
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
  Calendar as CalendarIcon,
  MonitorSmartphone,
  PieChart as PieChartIcon,
  Bell,
  CheckCircle2,
  AlertCircle,
  Search,
  Command,
  Share2,
  ShieldCheck,
  FileText,
  CreditCard,
  FlaskConical,
  PackagePlus,
  Trash2,
  Hammer,
  BookText,
  User as UserIcon,
  Medal,
  Send,
  MailCheck,
  Download,
  QrCode,
  Coins,
  Wallet
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
    getRevenueChartData
} from '@/lib/data';
import { Product } from '@/lib/types';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/context/AuthContext';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const navConfig = [
  { href: "/dashboard", icon: LineChart, label: "Aperçu", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/wallet", icon: Wallet, label: "Mon Wallet DKST", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/profile/expert", icon: UserIcon, label: "Mon Profil Expert", roles: ["Admin", "Seller", "Cashier"] },
  { href: "/dashboard/tokens", icon: Coins, label: "Économie Hub", roles: ["Admin", "Seller", "Cashier"] },
  { href: "/dashboard/calendar", icon: CalendarIcon, label: "Agenda Hub", roles: ["Admin", "Seller", "Cashier"] },
  { href: "/dashboard/products", icon: Package, label: "Produits / Stock", roles: ["Admin", "Seller"] },
  { href: "/dashboard/categories", icon: Tags, label: "Catégories", roles: ["Admin", "Seller"] },
  { href: "/dashboard/maintenance", icon: FlaskConical, label: "Stocks Labo", roles: ["Admin", "Seller"] },
  { href: "/dashboard/maintenance/tools", icon: Hammer, label: "Parc Outils", roles: ["Admin", "Seller"] },
  { href: "/dashboard/maintenance/logs", icon: BookText, label: "Journal Labo", roles: ["Admin", "Seller"] },
  { href: "/dashboard/maintenance/procurement", icon: PackagePlus, label: "Besoin Réappro", roles: ["Admin", "Seller"] },
  { href: "/dashboard/maintenance/stats", icon: BarChart3, label: "Analytique Labo", roles: ["Admin", "Seller"] },
  { href: "/dashboard/maintenance/waste", icon: Trash2, label: "Contrôle Gaspillage", roles: ["Admin", "Seller"] },
  { href: "/dashboard/quotes", icon: FileText, label: "Devis Pro", roles: ["Admin", "Seller", "customer"] },
  { href: "/dashboard/subscriptions", icon: CreditCard, label: "Contrats Services", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/orders", icon: ShoppingBag, label: "Commandes / Factures", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/services", icon: GraduationCap, label: "Services Hub", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/audits", icon: ShieldCheck, label: "Audits Business", roles: ["Admin", "Seller"] },
  { href: "/dashboard/referrals", icon: Share2, label: "Ambassadeurs", roles: ["Admin", "Seller", "Cashier", "customer"] },
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
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [rate, setRate] = useState(2500);
  const [isSendingDigest, setIsSendingDigest] = useState(false);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const [uSearch, setUSearch] = useState("");
  const [uResults, setUResults] = useState<{type: string, title: string, id: string, link: string}[]>([]);
  const [isUSearching, setIsUSearching] = useState(false);

  const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';
  const isAdmin = user?.role?.toLowerCase() === 'admin';

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
    return query(collection(db, "notifications"), where("userId", "in", [user.uid, 'staff']), orderBy("createdAt", "desc"), limit(6));
  }, [user?.uid, authLoading]);
  const { data: recentNotifs } = useCollection(notificationsQuery);

  const logsQuery = useMemoFirebase(() => query(collection(db, "technicianLogs")), []);
  const { data: allLogs } = useCollection(logsQuery);

  const bookingsQuery = useMemoFirebase(() => query(collection(db, "serviceBookings"), where("status", "==", "completed")), []);
  const { data: allBookings } = useCollection(bookingsQuery);

  const savQuery = useMemoFirebase(() => query(collection(db, "supportTickets"), where("status", "==", "completed")), []);
  const { data: allSav } = useCollection(savQuery);

  const salesQuery = useMemoFirebase(() => query(collection(db, "sales")), []);
  const { data: allSales } = useCollection(salesQuery);

  const leaderboard = useMemo(() => {
    if (!allLogs || !allBookings || !allSav || !allSales) return [];

    const userPoints: Record<string, { name: string, points: number, actions: number }> = {};

    const initUser = (uid: string, name: string) => {
        if (!userPoints[uid]) userPoints[uid] = { name: name || "Expert", points: 0, actions: 0 };
    };

    allLogs.forEach(log => {
      initUser(log.userId, log.userName);
      userPoints[log.userId].points += 10;
      userPoints[log.userId].actions += 1;
    });

    allBookings.forEach(booking => {
      if (booking.technicianId) {
        initUser(booking.technicianId, booking.technicianName);
        userPoints[booking.technicianId].points += 50;
        userPoints[booking.technicianId].actions += 1;
      }
    });

    allSav.forEach(ticket => {
      if (ticket.technicianId) {
        initUser(ticket.technicianId, ticket.technicianName);
        userPoints[ticket.technicianId].points += 30;
        userPoints[ticket.technicianId].actions += 1;
      }
    });

    allSales.forEach(sale => {
      if (sale.userId) {
        initUser(sale.userId, sale.customerName || "Vendeur");
        let pts = 20;
        if (sale.totalAmount >= 1000) pts = 100;
        else if (sale.totalAmount >= 500) pts = 50;
        
        userPoints[sale.userId].points += pts;
        userPoints[sale.userId].actions += 1;
      }
    });

    return Object.entries(userPoints)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [allLogs, allBookings, allSav, allSales]);

  const weeklyWinner = leaderboard[0];

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

  const handleTriggerWeeklyDigest = async () => {
      if (!weeklyWinner) return;
      setIsSendingDigest(true);
      try {
          const totalPoints = leaderboard.reduce((acc, curr) => acc + curr.points, 0);
          
          await addDoc(collection(db, "notifications"), {
              userId: 'staff',
              title: "DÉPÊCHE HEBDOMADAIRE DKS",
              message: `Félicitations à ${weeklyWinner.name} qui termine Élite de la semaine avec ${weeklyWinner.points} points ! L'équipe a cumulé ${totalPoints} points d'excellence.`,
              type: 'success',
              isRead: false,
              createdAt: serverTimestamp(),
              link: '/dashboard'
          });

          toast({ 
              title: "Digest Envoyé (Simulé)", 
              description: "Le rapport hebdomadaire a été diffusé à toute l'équipe." 
          });
      } catch (e) {
          toast({ title: "Erreur simulation", variant: "destructive" });
      } finally {
          setIsSendingDigest(false);
      }
  };

  const handleDownloadWeeklyCertificate = async () => {
    if (!certRef.current || !weeklyWinner) return;
    setIsGeneratingCert(true);
    try {
        const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`CERTIFICAT_ELITE_DKS_${weeklyWinner.name.replace(/\s+/g, '_')}.pdf`);
        toast({ title: "Certificat généré", description: "Félicitations au champion de la semaine !" });
    } catch (error) {
        toast({ title: "Erreur PDF", variant: "destructive" });
    } finally {
        setIsGeneratingCert(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (uSearch.length < 3) {
        setUResults([]);
        return;
      }

      setIsUSearching(true);
      const results: any[] = [];
      const term = uSearch.toLowerCase();

      try {
        const ordersSnap = await getDocs(collection(db, "orders"));
        ordersSnap.forEach(doc => {
          const data = doc.data();
          if (doc.id.toLowerCase().includes(term) || data.customerName?.toLowerCase().includes(term)) {
            results.push({ type: 'Commande', title: `CMD #${doc.id.substring(0,8)} - ${data.customerName}`, id: doc.id, link: '/dashboard/orders' });
          }
        });

        const hardwareSnap = await getDocs(collection(db, "hardwareAssets"));
        hardwareSnap.forEach(doc => {
          const data = doc.data();
          if (data.serialNumber?.toLowerCase().includes(term) || data.model?.toLowerCase().includes(term)) {
            results.push({ type: 'Appareil', title: `${data.brand} ${data.model} (S/N: ${data.serialNumber})`, id: doc.id, link: '/dashboard/hardware' });
          }
        });

        if (isStaff) {
          const usersSnap = await getDocs(collection(db, "users"));
          usersSnap.forEach(doc => {
            const data = doc.data();
            if (data.name?.toLowerCase().includes(term) || data.email?.toLowerCase().includes(term)) {
              results.push({ type: 'Client', title: `${data.name} (${data.email})`, id: doc.id, link: '/dashboard/customers' });
            }
          });
        }

        setUResults(results.slice(0, 8));
      } catch (e) {
        console.error(e);
      } finally {
        setIsUSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [uSearch, isStaff]);

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
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Initialisation du Hub Élite...</p>
      </div>
    );
  }

  const SidebarContent = () => (
    <nav className="grid gap-1 p-6 overflow-y-auto custom-scrollbar h-full">
      <div className="mb-8 px-4"><Logo size="sm" showText /></div>
      {filteredNavLinks.map(link => (
        <Link key={link.href} href={link.href} className={cn("group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-bold", pathname === link.href ? 'bg-accent/10 text-accent' : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
          <link.icon className={cn("h-4 w-4", pathname === link.href ? 'text-accent' : '')} />{link.label}
        </Link>
      ))}
      <div className="mt-10 pt-10 border-t border-white/5 px-4 pb-20">
        <Link href="/"><Button variant="outline" className="w-full justify-start rounded-xl border-white/5 gap-3 h-12 text-xs font-black uppercase italic"><Home size={16} /> Retour Boutique</Button></Link>
      </div>
    </nav>
  );

  const customerPoints = (orders?.length || 0) * 100 + (user?.referralCount || 0) * 500;

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
              <div className="relative hidden lg:block group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-accent transition-colors" size={16} />
                  <Input 
                    placeholder="Commande, Client, S/N..." 
                    className="w-80 h-11 pl-12 bg-white/5 border-white/5 rounded-2xl focus:border-accent text-xs font-bold uppercase transition-all"
                    value={uSearch}
                    onChange={(e) => setUSearch(e.target.value)}
                  />
                  {uSearch && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                        {isUSearching ? (
                            <div className="p-6 text-center"><Loader2 className="animate-spin h-5 w-5 mx-auto text-accent" /></div>
                        ) : uResults.length > 0 ? (
                            <div className="divide-y divide-white/5">
                                {uResults.map((res, i) => (
                                    <Link key={i} href={res.link} className="block p-4 hover:bg-accent/10 transition-colors">
                                        <p className="text-[8px] font-black uppercase text-accent mb-1">{res.type}</p>
                                        <p className="text-xs font-bold text-white truncate">{res.title}</p>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 text-center text-[10px] uppercase font-black opacity-30 italic">Aucun résultat</div>
                        )}
                      </div>
                  )}
              </div>
            </div>
            
            <nav className="hidden xl:flex items-center gap-1">
                {filteredNavLinks.slice(0, 7).map((link) => (
                    <Link key={link.href} href={link.href}>
                        <Button variant="ghost" size="sm" className={cn("group rounded-none h-20 px-4 gap-2.5 font-medium transition-all text-[10px] relative", pathname === link.href ? 'text-accent' : 'text-slate-400 hover:text-white')}>
                            <link.icon className={cn("h-4 w-4 transition-transform group-hover:translate-x-0.5", pathname === link.href ? 'text-accent' : '')} /><span>{link.label}</span>
                            {pathname === link.href && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />}
                        </Button>
                    </Link>
                ))}
            </nav>
            
            <div className="flex items-center gap-4">
                <Link href="/dashboard/wallet">
                    <Badge className="bg-accent/20 text-accent border-accent/20 h-10 px-4 rounded-xl gap-2 font-black italic cursor-pointer hover:bg-accent/30 transition-all">
                        <Coins size={16} /> {user?.tokenBalance || 0} DKST
                    </Badge>
                </Link>
                <Button variant="ghost" size="icon" onClick={fetchGlobalData} className="h-10 w-10 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-xl transition-all group">
                  <RefreshCw size={18} className={cn("transition-transform duration-700", loading ? "animate-spin" : "group-hover:rotate-180")} />
                </Button>
            </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-8 pb-24 max-w-[1600px] mx-auto w-full">
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

              <Card className="glossy-card border-none rounded-[2.5rem] bg-accent/5 border-accent/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Crown size={80} className="text-accent" /></div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Élite de la Semaine</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {weeklyWinner ? (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-accent text-black flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.4)]">
                          <Medal size={28} />
                        </div>
                        <div>
                          <p className="text-xl font-black uppercase italic tracking-tight">{weeklyWinner.name}</p>
                          <p className="text-[10px] font-bold text-accent uppercase">{weeklyWinner.points} Points Excellence</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {(isAdmin || user?.uid === weeklyWinner.id) && (
                          <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full h-10 border-accent/20 text-accent hover:bg-accent hover:text-black rounded-xl text-[9px] font-black uppercase italic gap-2"
                              onClick={handleDownloadWeeklyCertificate}
                              disabled={isGeneratingCert}
                          >
                              {isGeneratingCert ? <Loader2 className="animate-spin h-3 w-3" /> : <Download size={14} />} Certificat de Champion
                          </Button>
                        )}
                        {isAdmin && (
                          <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full h-10 text-muted-foreground/60 hover:text-white rounded-xl text-[9px] font-black uppercase italic gap-2"
                              onClick={handleTriggerWeeklyDigest}
                              disabled={isSendingDigest}
                          >
                              {isSendingDigest ? <Loader2 className="animate-spin h-3 w-3" /> : <MailCheck size={14} />} Diffuser le Digest
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="h-20 flex items-center justify-center opacity-20 italic text-xs uppercase font-black">Calcul en cours...</div>
                  )}
                </CardContent>
              </Card>

              <Card className="glossy-card border-none rounded-[2.5rem]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Articles Critiques</CardTitle>
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                    <Package className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold font-mono">{lowStock.length}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {!isStaff && (
            <div className="space-y-8">
                <Card className="bg-primary/10 border-primary/20 rounded-[3rem] p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5"><Logo size="xl" /></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="space-y-6 text-center md:text-left">
                            <Badge className="bg-primary text-white border-none px-4 py-1.5 font-black uppercase italic">Membre Privilège DKS</Badge>
                            <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-tight text-white">BIENVENUE DANS <br />VOTRE <span className="text-primary">HUB CENTRAL</span></h1>
                            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                <Link href="/services"><Button className="h-14 px-8 rounded-2xl bg-white text-primary font-black uppercase italic shadow-xl">Nouvelle Demande Service</Button></Link>
                                <Link href="/dashboard/wallet"><Button className="h-14 px-8 rounded-2xl bg-accent text-black font-black uppercase italic shadow-xl">Gérer mon Wallet DKST</Button></Link>
                            </div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 min-w-[300px] text-center">
                            <p className="text-[10px] font-black uppercase opacity-40 mb-2">Points Fidélité Cumulés</p>
                            <p className="text-6xl font-black text-primary italic">{customerPoints}</p>
                            <p className="text-[9px] font-bold uppercase mt-4 text-muted-foreground">Grade Actuel: {user?.loyaltyLevel || 'Bronze'}</p>
                        </div>
                    </div>
                </Card>

                {/* CONVERSION POINTS CTA FOR CUSTOMERS */}
                <Card className="bg-accent/5 border border-accent/20 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-accent/5">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-accent text-black flex items-center justify-center shadow-lg shadow-accent/20">
                            <Coins size={32} />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-black uppercase italic">Convertir vos Points en Jetons</h3>
                            <p className="text-xs text-muted-foreground max-w-md">Transformez vos récompenses en **DKS Tokens** synchronisables sur Pi Network.</p>
                        </div>
                    </div>
                    <Link href="/dashboard/wallet">
                        <Button className="bg-accent text-black font-black uppercase italic h-14 px-10 rounded-2xl gap-3">
                            Aller au Wallet <ArrowRight size={20}/>
                        </Button>
                    </Link>
                </Card>
            </div>
          )}

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
            <div className="lg:col-span-4 space-y-6">
                <Card className="glossy-card border-none rounded-[2.5rem] overflow-hidden">
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
                                  <defs><linearGradient id="colorTotal" x1="0" x2="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/></linearGradient></defs>
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

                {isStaff && (
                  <Card className="glossy-card border-none rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="py-6 px-8 border-b border-white/5 bg-accent/5">
                      <CardTitle className="text-lg font-bold uppercase italic flex items-center gap-3">
                        <Trophy className="text-accent" size={20} /> Classement Élite (Prestige Global)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                       <div className="divide-y divide-white/5">
                          {leaderboard.map((member, index) => (
                            <div key={member.id} className="p-5 flex items-center justify-between hover:bg-white/5 transition-all group">
                                <div className="flex items-center gap-5">
                                    <div className="relative">
                                      <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg italic transition-transform group-hover:scale-110",
                                        index === 0 ? "bg-yellow-500/20 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]" : 
                                        index === 1 ? "bg-slate-300/20 text-slate-300" :
                                        index === 2 ? "bg-orange-600/20 text-orange-600" : "bg-white/5 text-muted-foreground"
                                      )}>
                                        {index === 0 ? <Crown size={20} /> : index + 1}
                                      </div>
                                      {index < 3 && (
                                        <div className="absolute -top-2 -right-2">
                                           <Medal size={16} className={cn(index === 0 ? "text-yellow-500" : index === 1 ? "text-slate-300" : "text-orange-600")} />
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                        <p className="font-black text-sm uppercase italic tracking-tight">{member.name}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                          <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Zap size={10} className="text-accent"/> {member.actions} actions</span>
                                          <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Star size={10} className="text-yellow-500"/> Prestige: {member.points}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline" className={cn(
                                      "border-none font-black text-xs italic",
                                      index === 0 ? "text-yellow-500" : "text-accent/60"
                                    )}>
                                      {member.points} PTS
                                    </Badge>
                                </div>
                            </div>
                          ))}
                       </div>
                    </CardContent>
                  </Card>
                )}
            </div>

            <div className="lg:col-span-3 space-y-6">
                <Card className="glossy-card border-none rounded-[2.5rem] overflow-hidden flex flex-col h-full">
                    <CardHeader className="py-6 px-8 border-b border-white/5 bg-white/[0.02]">
                      <CardTitle className="text-lg font-bold uppercase italic flex items-center gap-3">
                        <Bell className="text-primary" size={20} /> Journal du Hub
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
                        <div className="divide-y divide-white/5">
                            {recentNotifs && recentNotifs.length > 0 ? recentNotifs.map((notif) => (
                                <div key={notif.id} className={cn("p-5 flex items-start gap-4 transition-colors hover:bg-white/5", !notif.isRead && "bg-accent/5 border-l-2 border-l-accent")}>
                                    <div className={cn(
                                      "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center",
                                      notif.type === 'error' ? 'bg-red-500/10 text-red-500' : notif.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-primary/10 text-primary'
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
          </div>
      </main>

      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          {weeklyWinner && (
              <div ref={certRef} className="bg-white text-black p-0 w-[1123px] h-[794px] font-serif relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 border-[40px] border-double border-[#0f172a]" />
                  <div className="absolute inset-10 border-4 border-[#3b82f6]/10" />
                  
                  <div className="relative z-10 text-center w-full px-40 space-y-12">
                      <div className="flex flex-col items-center gap-6">
                          <Logo size="lg" />
                          <div className="space-y-1">
                              <h2 className="text-sm font-bold tracking-[0.4em] uppercase text-[#0f172a]">DKS EXCELLENCE HUB</h2>
                              <p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-40">Récompense de la Performance Staff • Bunia, RDC</p>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h1 className="text-6xl font-black uppercase italic tracking-tighter text-[#0f172a]">EMPLOYÉ DU MOIS</h1>
                          <p className="text-xl font-light italic text-gray-500 tracking-[0.2em]">CERTIFICAT DE PRESTIGE & EXCELLENCE</p>
                      </div>

                      <div className="space-y-10 py-10 bg-gray-50/50 rounded-[3rem] border border-gray-100">
                          <p className="text-lg font-medium text-gray-400 italic">Nous décernons fièrement ce titre à</p>
                          
                          <div className="space-y-4">
                              <h3 className="text-6xl font-black uppercase italic text-[#0f172a] tracking-tight">{weeklyWinner.name}</h3>
                              <div className="w-40 h-1 bg-[#3b82f6] mx-auto" />
                          </div>

                          <p className="text-lg font-medium text-gray-500 max-w-2xl mx-auto leading-relaxed">
                              En reconnaissance de son investissement exceptionnel et de sa contribution à l'élite technologique, totalisant un score de prestige de <strong>{weeklyWinner.points} points</strong>.
                          </p>
                      </div>

                      <div className="grid grid-cols-3 items-end pt-12">
                          <div className="text-center space-y-2">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date de distinction</p>
                              <p className="text-sm font-bold">{new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
                          </div>
                          <div className="flex flex-col items-center gap-4">
                              <div className="p-3 border-2 border-gray-100 rounded-2xl bg-white shadow-sm"><QrCode size={60} className="opacity-10" /></div>
                              <p className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">ID-DISTINCTION: DKS-WIN-{weeklyWinner.id.substring(0, 10).toUpperCase()}</p>
                          </div>
                          <div className="text-center space-y-4">
                              <div className="w-40 h-px bg-gray-200 mx-auto" />
                              <div className="flex flex-col items-center">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Direction Générale</p>
                                  <p className="text-sm font-black italic">Double King Shop</p>
                                  <ShieldCheck size={24} className="text-green-600 mt-2 opacity-30" />
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-bl-full -z-10" />
                  <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/5 rounded-tr-full -z-10" />
              </div>
          )}
      </div>
    </div>
  );
}

export default withAuth(DashboardPage);
