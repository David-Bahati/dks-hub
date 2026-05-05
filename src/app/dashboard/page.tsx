
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
  Wallet,
  Gift,
  Award,
  Cpu,
  Pickaxe,
  Target,
  Flame,
  Layout,
  Gem,
  ArrowUpCircle,
  Heart,
  Activity,
  Vote,
  Scale,
  Building2,
  Timer
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
    getRevenueChartData,
    getPoolImpactData
} from '@/lib/data';
import { Product, DailyMission } from '@/lib/types';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/context/AuthContext';
import { useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp, doc, updateDoc, increment, Timestamp } from 'firebase/firestore';
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
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { Progress } from "@/components/ui/progress";
import { UserGuide } from "@/components/dashboard/UserGuide";

const TOTAL_COMMUNITY_SUPPLY = 32500000;

const DAILY_MISSIONS: DailyMission[] = [
    { id: 'm1', title: 'Consultation Stock', description: 'Visiter le catalogue hardware pour voir les nouveautés.', rewardPoints: 10, icon: '📦', targetRole: 'all' },
    { id: 'm2', title: 'Alerte Labo', description: 'Consulter le journal de bord pour les mises à jour techniques.', rewardPoints: 20, icon: '📑', targetRole: 'staff' },
    { id: 'm3', title: 'Ambassadeur DKS', description: 'Partager votre code de parrainage sur WhatsApp.', rewardPoints: 50, icon: '📱', targetRole: 'customer' },
    { id: 'm4', title: 'Révision Config', description: 'Lancer une simulation avec l\'Assistant IA.', rewardPoints: 15, icon: '🤖', targetRole: 'all' },
];

const navConfig = [
  { href: "/dashboard", icon: LineChart, label: "Aperçu", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/wallet", icon: Wallet, label: "Mon Wallet DKST", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/governance", icon: Vote, label: "Gouvernance DAO", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/profile/expert", icon: UserIcon, label: "Mon Profil Expert", roles: ["Admin", "Seller", "Cashier"] },
  { href: "/dashboard/tokens", icon: Coins, label: "Économie Hub", roles: ["Admin", "Seller", "Cashier"] },
  { href: "/dashboard/notary", icon: Scale, label: "Notaire du Hub", roles: ["Admin"] },
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
  
  // Mining States
  const [isMining, setIsMining] = useState(false);
  const [miningTimeLeft, setMiningTimeLeft] = useState<string | null>(null);

  const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

  const filteredNavLinks = navConfig.filter(link => {
      const roles = link.roles.map(r => r.toLowerCase());
      const userRole = user?.role?.toLowerCase() || "";
      return roles.includes(userRole);
  });

  // Fetch Treasury for Community Mining Pool info
  const treasuryRef = useMemoFirebase(() => doc(db, "system", "treasury"), []);
  const { data: treasury } = useDoc(treasuryRef);

  // Queries for Mining Pool
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const activeMinersQuery = useMemoFirebase(() => {
    return query(collection(db, "users"), where("lastMiningAt", ">=", Timestamp.fromDate(yesterday)));
  }, []);
  const { data: activeMiners } = useCollection(activeMinersQuery);

  const poolStats = useMemo(() => {
    const count = activeMiners?.length || 0;
    const totalPower = (activeMiners?.reduce((acc, u) => acc + (u.miningPower || 1), 0) || 0);
    const luckMultiplier = Math.min(2, 1 + (count / 10));
    const minted = treasury?.totalMinted || 0;
    const remaining = Math.max(0, TOTAL_COMMUNITY_SUPPLY - minted);
    const depletedPct = (minted / TOTAL_COMMUNITY_SUPPLY) * 100;
    
    // Halving Logic
    let halvingFactor = 1;
    let halvingLevel = 0;
    if (minted > 24000000) { halvingFactor = 0.125; halvingLevel = 3; }
    else if (minted > 16000000) { halvingFactor = 0.25; halvingLevel = 2; }
    else if (minted > 8000000) { halvingFactor = 0.5; halvingLevel = 1; }

    return { count, totalPower, luckMultiplier, remaining, depletedPct, halvingFactor, halvingLevel };
  }, [activeMiners, treasury]);

  // General Dashboard Data
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
          const [dashboardStats, lowStockItems, revenueData] = await Promise.all([
            getDashboardStats(),
            getLowStockItems(),
            getRevenueChartData()
          ]);
          setStats(dashboardStats);
          setLowStock(lowStockItems);
          setChartData(revenueData);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, [authLoading]);

  // Mining Timer
  useEffect(() => {
    if (!user?.lastMiningAt) return;
    const interval = setInterval(() => {
        const lastMining = user.lastMiningAt?.toDate ? user.lastMiningAt.toDate() : new Date(user.lastMiningAt);
        const nextMining = new Date(lastMining.getTime() + 24 * 60 * 60 * 1000);
        const now = new Date();
        if (now >= nextMining) { setMiningTimeLeft(null); clearInterval(interval); }
        else {
            const diff = nextMining.getTime() - now.getTime();
            const h = Math.floor(diff / (3600000));
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setMiningTimeLeft(`${h}h ${m}m ${s}s`);
        }
    }, 1000);
    return () => clearInterval(interval);
  }, [user?.lastMiningAt]);

  const handleStartMining = async () => {
    if (!user || miningTimeLeft || poolStats.remaining <= 0) return;
    setIsMining(true);
    try {
        const random = Math.random();
        let rarity: 'common' | 'rare' | 'legendary' = 'common';
        let multiplier = 1;
        if (random < 0.05 * poolStats.luckMultiplier) { rarity = 'legendary'; multiplier = 5; }
        else if (random < 0.20 * poolStats.luckMultiplier) { rarity = 'rare'; multiplier = 2; }

        const baseReward = user.loyaltyLevel === 'Gold' ? 0.5 : user.loyaltyLevel === 'Silver' ? 0.2 : 0.1;
        
        // Appliquer le facteur de Halving
        const finalReward = Math.min(poolStats.remaining, baseReward * multiplier * poolStats.halvingFactor);

        await updateDoc(doc(db, "users", user.uid), {
            lastMiningAt: serverTimestamp(),
            lastActivityAt: serverTimestamp(),
            tokenBalance: increment(finalReward),
            miningPower: increment(0.1),
            lastBlockRarity: rarity,
            updatedAt: serverTimestamp()
        });

        await updateDoc(doc(db, "system", "treasury"), {
            totalMinted: increment(finalReward),
            updatedAt: serverTimestamp()
        });

        await addDoc(collection(db, "tokenTransactions"), {
            userId: user.uid, userName: user.name, type: 'mining',
            tokenAmount: finalReward, rarity: rarity, createdAt: serverTimestamp(),
            memo: `Mining Pool DKS - Bloc ${rarity.toUpperCase()} (Halving: x${poolStats.halvingFactor})`
        });

        toast({ title: `Minage réussi !`, description: `+${finalReward.toFixed(4)} DKST extraits. Prochain Halving à 8M.` });
    } catch (e) { toast({ title: "Erreur Minage", variant: "destructive" }); } finally { setIsMining(false); }
  };

  const SidebarContent = () => (
    <nav className="grid gap-1 p-6 overflow-y-auto custom-scrollbar h-full">
      <div className="mb-8 px-4"><Logo size="sm" showText /></div>
      {filteredNavLinks.map(link => (
        <Link key={link.href} href={link.href} className={cn("group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-bold", pathname === link.href ? 'bg-accent/10 text-accent' : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
          <link.icon className={cn("h-4 w-4", pathname === link.href ? 'text-accent' : '')} />{link.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-white/5 bg-background/40 backdrop-blur-2xl px-6">
         <Sheet>
            <SheetTrigger asChild><Button size="icon" variant="ghost" className="xl:hidden text-muted-foreground"><PanelLeft className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs bg-card/95 backdrop-blur-3xl border-r border-white/5 p-0"><SidebarContent /></SheetContent>
          </Sheet>
        <div className="flex-1 flex items-center justify-between">
            <Logo size="sm" showText />
            <div className="flex items-center gap-4">
                <Link href="/dashboard/wallet"><Badge className="bg-accent/20 text-accent border-accent/20 h-10 px-4 rounded-xl gap-2 font-black italic cursor-pointer"><Coins size={16} /> {user?.tokenBalance?.toFixed(2) || 0} DKST</Badge></Link>
            </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-12 pb-24 max-w-[1600px] mx-auto w-full">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
              <Card className="lg:col-span-5 bg-gradient-to-br from-accent/10 via-background to-black border-accent/20 rounded-[3rem] p-10 relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-45 group-hover:rotate-0 transition-transform duration-1000"><Pickaxe size={200} className="text-accent" /></div>
                  <div className="relative z-10 space-y-8">
                      <div className="flex justify-between items-start">
                          <div className="space-y-1">
                              <Badge className="bg-accent text-black font-black uppercase italic text-[8px] tracking-[0.3em] px-4 py-1 mb-2">Pool Communautaire 65%</Badge>
                              <h2 className="text-3xl font-black uppercase italic tracking-tighter">MINAGE <span className="text-accent">D'ÉLITE</span></h2>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Extraire du stock de 32.5M DKST</p>
                          </div>
                          <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center">
                              <p className="text-[8px] font-black uppercase text-accent mb-1">Rareté Multiplier</p>
                              <p className="text-xl font-black text-white italic">x{poolStats.halvingFactor}</p>
                          </div>
                      </div>

                      <div className="p-8 bg-black/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 flex flex-col items-center gap-8 shadow-inner">
                          {miningTimeLeft ? (
                              <div className="text-center space-y-6">
                                  <p className="text-[10px] font-black uppercase text-accent tracking-[0.5em]">Compte à rebours cycle</p>
                                  <div className="text-6xl font-black text-white italic tracking-tighter font-mono">{miningTimeLeft}</div>
                                  <div className="flex flex-col items-center gap-4">
                                      <Badge variant="outline" className="bg-accent/10 border-accent/20 text-accent text-[9px] font-black uppercase">Session en attente</Badge>
                                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase italic"><Zap size={12} className="text-accent" /> Puissance: {(user?.miningPower || 1.0).toFixed(1)} GH/s</div>
                                  </div>
                              </div>
                          ) : (
                              <div className="text-center space-y-6">
                                  <div className="space-y-2">
                                      <p className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">PRÊT À <br /><span className="text-accent">EXTRAIRE</span></p>
                                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">Base : {(user?.loyaltyLevel === 'Gold' ? 0.5 : 0.1) * poolStats.halvingFactor} DKST</p>
                                  </div>
                                  <Button onClick={handleStartMining} disabled={isMining || poolStats.remaining <= 0} className="h-20 px-12 rounded-[2rem] bg-accent text-black font-black uppercase italic text-xl shadow-[0_0_50px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95 transition-all gap-4">
                                      {isMining ? <Loader2 className="animate-spin" /> : <><Flame size={28} /> Lancer le Cycle</>}
                                  </Button>
                                  <div className="flex items-center gap-3">
                                      <Timer size={14} className="text-accent/40" />
                                      <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Prochaine réduction à 8,000,000 extraits</p>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </Card>

              <div className="lg:col-span-7 space-y-6">
                  <Card className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
                      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                          <div className="flex items-center gap-6">
                              <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]"><Users size={32} /></div>
                              <div>
                                  <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">Halving <span className="text-primary">Progress</span></h3>
                                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Niveau de Difficulté: {poolStats.halvingLevel + 1}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-10">
                              <div className="text-center">
                                  <p className="text-3xl font-black text-white italic">{poolStats.depletedPct.toFixed(2)}%</p>
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">Extraits de la Pool</p>
                              </div>
                              <div className="bg-primary/10 border border-primary/20 px-5 py-3 rounded-2xl text-center">
                                  <p className="text-[8px] font-black uppercase text-primary mb-1">Cap Phase</p>
                                  <p className="text-xl font-black text-primary italic">8.0M</p>
                              </div>
                          </div>
                      </div>
                      <div className="mt-8 space-y-2">
                          <div className="flex justify-between text-[8px] font-black uppercase text-white/40 tracking-widest px-1"><span>Épuisement Pool Communautaire</span><span>{(treasury?.totalMinted || 0).toLocaleString()} / 32,500,000</span></div>
                          <Progress value={poolStats.depletedPct} className="h-1.5 bg-white/5" indicatorClassName="bg-primary" />
                      </div>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-white/5 border-white/5 rounded-[2.2rem] p-8 flex flex-col justify-between overflow-hidden relative">
                             <div className="absolute top-0 right-0 p-6 opacity-5"><Building2 size={80} /></div>
                             <div className="space-y-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><Building2 size={20} /></div>
                                    <h4 className="text-sm font-black uppercase italic">Trésorerie Hub</h4>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-white italic">{treasury?.dkstBalance?.toLocaleString() || 0} <span className="text-xs opacity-40 not-italic">DKST</span></p>
                                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Actifs de l'entreprise sécurisés</p>
                                </div>
                             </div>
                        </Card>
                        <div className="space-y-4">
                            {DAILY_MISSIONS.slice(0, 2).map((mission) => (
                                <Card key={mission.id} className="bg-white/5 border border-white/5 rounded-[2.2rem] p-6 h-[calc(50%-8px)]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl">{mission.icon}</div>
                                        <div className="flex-1">
                                            <h4 className="font-black uppercase italic text-xs tracking-tight text-white">{mission.title}</h4>
                                            <Badge className="bg-primary/20 text-primary border-none uppercase text-[7px] font-black">+{mission.rewardPoints} PTS</Badge>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                  </div>
              </div>
          </div>

          <UserGuide role={user?.role || "customer"} />

          {isStaff && stats && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="lg:col-span-2 glossy-card border-none rounded-[2.5rem] p-8">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Volume d'Affaires Global</p>
                        <div className="text-5xl font-bold font-mono tracking-tighter text-white mt-4">
                            {new Intl.NumberFormat('fr-FR').format(stats.totalRevenueCDF)} 
                            <span className="text-xl font-light opacity-30 ml-2">CDF</span>
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><DollarSign className="h-6 w-6" /></div>
                </div>
              </Card>
              <Card className="glossy-card border-none rounded-[2.5rem] p-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Articles Critiques</p>
                <div className="text-3xl font-bold font-mono mt-4 text-red-500">{lowStock.length}</div>
              </Card>
            </div>
          )}
      </main>
    </div>
  );
}

export default withAuth(DashboardPage);
