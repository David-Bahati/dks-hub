
"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
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
  Timer,
  CheckCircle,
  BarChartHorizontal,
  LogOut,
  ChevronRight,
  ZapOff
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
} from '@/lib/data';
import { Product, DailyMission } from '@/lib/types';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/context/AuthContext';
import { useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, orderBy, limit, addDoc, serverTimestamp, doc, updateDoc, increment, Timestamp, arrayUnion } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { UserGuide } from "@/components/dashboard/UserGuide";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TOTAL_COMMUNITY_SUPPLY = 32500000;

const DAILY_MISSIONS: DailyMission[] = [
    { id: 'm1', title: 'Consultation Stock', description: 'Visiter le catalogue hardware pour voir les nouveautés.', rewardPoints: 10, icon: '📦', targetRole: 'all' },
    { id: 'm2', title: 'Alerte Labo', description: 'Consulter le journal de bord pour les mises à jour techniques.', rewardPoints: 20, icon: '📑', targetRole: 'staff' },
    { id: 'm3', title: 'Ambassadeur DKS', description: 'Partager votre code de parrainage sur WhatsApp.', rewardPoints: 50, icon: '📱', targetRole: 'customer' },
    { id: 'm4', title: 'Révision Config', description: 'Lancer une simulation avec l\'Assistant IA.', rewardPoints: 15, icon: '🤖', targetRole: 'all' },
];

function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  
  // Mining States
  const [isMining, setIsMining] = useState(false);
  const [miningTimeLeft, setMiningTimeLeft] = useState<string | null>(null);
  const [miningProgress, setMiningProgress] = useState(0);
  const [realTimeGain, setRealTimeGain] = useState(0);

  // Missions States
  const [claimingMission, setClaimingId] = useState<string | null>(null);

  const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

  const filteredNavLinks = navConfig.filter(link => {
      const roles = link.roles.map(r => r.toLowerCase());
      const userRole = user?.role?.toLowerCase() || "";
      return roles.includes(userRole);
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Logout error", error);
    }
  };

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

    // Estimation temps avant halving (très simplifié)
    const dailyMintRate = 5000; // Estimation arbitraire
    const nextHalvingLimit = (halvingLevel + 1) * 8000000;
    const remainingToHalving = nextHalvingLimit - minted;
    const daysToHalving = Math.ceil(remainingToHalving / dailyMintRate);

    return { count, totalPower, luckMultiplier, remaining, depletedPct, halvingFactor, halvingLevel, daysToHalving };
  }, [activeMiners, treasury]);

  // Mining Timer & Progress
  useEffect(() => {
    if (!user?.lastMiningAt) return;
    const interval = setInterval(() => {
        const lastMining = user.lastMiningAt?.toDate ? user.lastMiningAt.toDate() : new Date(user.lastMiningAt);
        const nextMining = new Date(lastMining.getTime() + 24 * 60 * 60 * 1000);
        const now = new Date();
        
        if (now >= nextMining) { 
            setMiningTimeLeft(null); 
            setMiningProgress(100);
            clearInterval(interval); 
        } else {
            const diff = nextMining.getTime() - now.getTime();
            const h = Math.floor(diff / (3600000));
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setMiningTimeLeft(`${h}h ${m}m ${s}s`);
            
            // Calcul du % de progression inverse (de 100 à 0)
            const elapsed = now.getTime() - lastMining.getTime();
            const progress = (elapsed / (24 * 60 * 60 * 1000)) * 100;
            setMiningProgress(progress);

            // Simulation gain en temps réel (purement visuel pour l'UX)
            if (now.getTime() - lastMining.getTime() < 30000) { // On simule pendant les 30 premières sec
                setRealTimeGain(prev => prev + 0.00003);
            }
        }
    }, 1000);
    return () => clearInterval(interval);
  }, [user?.lastMiningAt]);

  const handleStartMining = async () => {
    if (!user || miningTimeLeft || poolStats.remaining <= 0) return;
    
    // Feedback haptique pour mobile
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
    }

    setIsMining(true);
    try {
        const random = Math.random();
        let rarity: 'common' | 'rare' | 'legendary' = 'common';
        let multiplier = 1;
        if (random < 0.05 * poolStats.luckMultiplier) { rarity = 'legendary'; multiplier = 5; }
        else if (random < 0.20 * poolStats.luckMultiplier) { rarity = 'rare'; multiplier = 2; }

        const baseReward = user.loyaltyLevel === 'Gold' ? 0.5 : user.loyaltyLevel === 'Silver' ? 0.2 : 0.1;
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

        toast({ 
            title: `Bloc ${rarity.toUpperCase()} extrait !`, 
            description: `+${finalReward.toFixed(4)} DKST ajoutés à votre coffre.`,
            variant: rarity === 'legendary' ? "default" : "default"
        });
    } catch (e) { toast({ title: "Erreur Minage", variant: "destructive" }); } finally { setIsMining(false); }
  };

  const handleCompleteMission = async (mission: DailyMission) => {
    if (!user || user.completedMissionsToday?.includes(mission.id)) return;
    
    setClaimingId(mission.id);
    try {
        await updateDoc(doc(db, "users", user.uid), {
            points: increment(mission.rewardPoints),
            completedMissionsToday: arrayUnion(mission.id),
            lastActivityAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        toast({
            title: "Mission Accomplie !",
            description: `Vous avez gagné +${mission.rewardPoints} Points Prestige.`,
        });
    } catch (error) {
        toast({ title: "Erreur Mission", variant: "destructive" });
    } finally {
        setClaimingId(null);
    }
  };

  const myMissions = useMemo(() => {
    const userRole = user?.role?.toLowerCase() || 'customer';
    return DAILY_MISSIONS.filter(m => m.targetRole === 'all' || m.targetRole === (isStaff ? 'staff' : 'customer'));
  }, [user, isStaff]);

  const getRarityColor = (rarity: string) => {
      switch(rarity) {
          case 'legendary': return 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]';
          case 'rare': return 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.5)]';
          default: return 'bg-slate-500/20 text-white/40 border-white/10';
      }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <nav className="flex-1 grid gap-1 p-6 overflow-y-auto custom-scrollbar">
        <div className="mb-8 px-4"><Logo size="sm" showText /></div>
        {filteredNavLinks.map(link => (
          <Link key={link.href} href={link.href} className={cn("group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-bold", pathname === link.href ? 'bg-accent/10 text-accent' : 'text-slate-400 hover:bg-white/5 hover:text-white')}>
            <link.icon className={cn("h-4 w-4", pathname === link.href ? 'text-accent' : '')} />{link.label}
          </Link>
        ))}
      </nav>
      <div className="p-6 border-t border-white/5">
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl h-12 font-bold uppercase italic text-xs">
          <LogOut size={18} /> Déconnexion
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-white/5 bg-background/40 backdrop-blur-2xl px-6">
         <Sheet>
            <SheetTrigger asChild><Button size="icon" variant="ghost" className="xl:hidden text-muted-foreground"><PanelLeft className="h-5 w-5" /></Button></SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs bg-card/95 backdrop-blur-3xl border-r border-white/5 p-0"><SidebarContent /></SheetContent>
          </Sheet>
        <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Logo size="sm" showText />
            </div>
            <div className="flex items-center gap-4">
                <Link href="/dashboard/wallet"><Badge className="bg-accent/20 text-accent border-accent/20 h-10 px-4 rounded-xl gap-2 font-black italic cursor-pointer"><Coins size={16} /> {user?.tokenBalance?.toFixed(2) || 0} DKST</Badge></Link>
                <Separator orientation="vertical" className="h-8 bg-white/5 hidden sm:block" />
                
                <Link href="/dashboard/settings">
                    <Avatar className="h-10 w-10 border-2 border-white/10 hover:border-accent transition-all cursor-pointer shadow-lg">
                        <AvatarImage src={user?.photoURL} className="object-cover" />
                        <AvatarFallback className="bg-accent/20 text-accent font-black text-xs italic">{user?.name?.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                </Link>

                <Button onClick={handleLogout} variant="ghost" size="icon" className="h-11 w-11 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all hidden sm:flex">
                    <LogOut size={20} />
                </Button>
            </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-12 pb-24 max-w-[1600px] mx-auto w-full">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row items-center gap-8 mb-12 p-10 bg-white/[0.02] border border-white/5 rounded-[3rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5"><Sparkles size={160} className="text-accent animate-pulse" /></div>
              <Avatar className="h-32 w-32 border-4 border-accent p-1.5 bg-background shadow-2xl transition-transform group-hover:scale-105 duration-500">
                  <AvatarImage src={user?.photoURL} className="rounded-full object-cover" />
                  <AvatarFallback className="bg-primary/20 text-accent text-4xl font-black italic">{user?.name?.substring(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="text-center md:text-left space-y-2 relative z-10">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <Badge className="bg-accent text-black font-black uppercase italic text-[8px] tracking-[0.3em] px-4 py-1">Membre {user?.loyaltyLevel || 'Bronze'}</Badge>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">Dernière activité: {user?.lastActivityAt?.toDate ? format(user.lastActivityAt.toDate(), "dd MMM HH:mm", { locale: fr }) : "Maintenant"}</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">Bienvenue, <span className="text-accent">{user?.name?.split(' ')[0]}</span></h1>
                  <p className="text-sm text-white/60 font-medium italic">"Prêt à dominer l'économie technologique aujourd'hui ?"</p>
              </div>
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
              {/* Mining Card 2.0 */}
              <Card className="lg:col-span-5 bg-gradient-to-br from-accent/10 via-background to-black border-accent/20 rounded-[3rem] p-10 relative overflow-hidden group shadow-2xl">
                  {/* Floating Mining Particles */}
                  {miningTimeLeft && (
                      <div className="absolute inset-0 pointer-events-none z-0">
                          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-accent rounded-full animate-ping opacity-20" />
                          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-accent rounded-full animate-ping opacity-20 delay-700" />
                          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-accent rounded-full animate-pulse opacity-20" />
                      </div>
                  )}
                  
                  <div className="relative z-10 space-y-8">
                      <div className="flex justify-between items-start">
                          <div className="space-y-1">
                              <Badge className="bg-accent text-black font-black uppercase italic text-[8px] tracking-[0.3em] px-4 py-1 mb-2">Pool Communautaire 65%</Badge>
                              <h2 className="text-3xl font-black uppercase italic tracking-tighter">MINAGE <span className="text-accent">D'ÉLITE</span></h2>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Extraire du stock de 32.5M DKST</p>
                          </div>
                          <div className={cn("border p-3 rounded-2xl text-center transition-all duration-500", getRarityColor(user?.lastBlockRarity || 'common'))}>
                              <p className="text-[8px] font-black uppercase mb-1">Dernière Rareté</p>
                              <p className="text-sm font-black uppercase italic">{user?.lastBlockRarity || '---'}</p>
                          </div>
                      </div>

                      <div className="p-10 bg-black/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 flex flex-col items-center gap-8 shadow-inner relative overflow-hidden">
                          {miningTimeLeft ? (
                              <div className="text-center space-y-8 w-full relative">
                                  {/* Circular Progress Ring */}
                                  <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                                      <svg className="absolute w-full h-full rotate-[-90deg]">
                                          <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                                          <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={552} strokeDashoffset={552 - (552 * miningProgress) / 100} className="text-accent transition-all duration-1000 ease-linear" strokeLinecap="round" />
                                      </svg>
                                      <div className="flex flex-col items-center gap-1 z-10">
                                          <Pickaxe size={48} className="text-accent animate-bounce" />
                                          <div className="text-3xl font-black text-white italic tracking-tighter font-mono">{miningTimeLeft}</div>
                                      </div>
                                  </div>

                                  <div className="space-y-4">
                                      <div className="flex flex-col items-center gap-2">
                                          <Badge variant="outline" className="bg-accent/10 border-accent/20 text-accent text-[9px] font-black uppercase flex items-center gap-2">
                                              <Activity size={10} className="animate-pulse" /> Extraction en cours
                                          </Badge>
                                          {realTimeGain > 0 && (
                                              <p className="text-xl font-black text-green-400 italic animate-in fade-in slide-in-from-bottom-2">
                                                  +{realTimeGain.toFixed(5)} <span className="text-[10px]">DKST EST.</span>
                                              </p>
                                          )}
                                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase italic"><Zap size={12} className="text-accent" /> Puissance: {(user?.miningPower || 1.0).toFixed(1)} GH/s</div>
                                      </div>
                                  </div>
                              </div>
                          ) : (
                              <div className="text-center space-y-8">
                                  <div className="space-y-2">
                                      <p className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">PRÊT À <br /><span className="text-accent">EXTRAIRE</span></p>
                                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">Récompense de base : {(user?.loyaltyLevel === 'Gold' ? 0.5 : 0.1) * poolStats.halvingFactor} DKST</p>
                                  </div>
                                  
                                  <div className="relative group">
                                      <div className="absolute -inset-4 bg-accent/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                      <Button onClick={handleStartMining} disabled={isMining || poolStats.remaining <= 0} className="h-32 w-32 rounded-full bg-accent text-black font-black uppercase italic text-lg shadow-[0_0_50px_rgba(56,189,248,0.4)] hover:scale-110 active:scale-95 transition-all flex flex-col items-center justify-center p-0 group">
                                          {isMining ? <Loader2 className="animate-spin h-10 w-10" /> : <><Flame size={40} className="group-hover:animate-pulse" /><span className="text-[8px] mt-2">Lancer Cycle</span></>}
                                      </Button>
                                  </div>

                                  <div className="flex items-center gap-3 justify-center">
                                      <Timer size={14} className="text-accent/40" />
                                      <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Cycle de 24h requis par bloc</p>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </Card>

              {/* Halving Progress 2.0 */}
              <div className="lg:col-span-7 space-y-6">
                  <Card className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
                      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                          <div className="flex items-center gap-6">
                              <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]"><TrendingUpIcon size={32} /></div>
                              <div>
                                  <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">Halving <span className="text-primary">Progress</span></h3>
                                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Niveau de Difficulté Actuel : {poolStats.halvingLevel + 1}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-10">
                              <div className="text-center">
                                  <p className="text-3xl font-black text-white italic">{poolStats.depletedPct.toFixed(2)}%</p>
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">Extraits de la Pool</p>
                              </div>
                              <div className="bg-primary/10 border border-primary/20 px-5 py-3 rounded-2xl text-center">
                                  <p className="text-[8px] font-black uppercase text-primary mb-1">Prochain Halving</p>
                                  <p className="text-lg font-black text-primary italic">~{poolStats.daysToHalving} Jours</p>
                              </div>
                          </div>
                      </div>
                      
                      {/* Segmented Progress Bar */}
                      <div className="mt-10 space-y-4">
                          <div className="flex justify-between text-[8px] font-black uppercase text-white/40 tracking-widest px-1">
                              <span>Épuisement Pool Communautaire</span>
                              <span className="text-primary">Phase {poolStats.halvingLevel + 1} / 4</span>
                          </div>
                          <div className="flex gap-1 h-3">
                              {[1, 2, 3, 4].map((seg) => {
                                  const threshold = seg * 25;
                                  const active = poolStats.depletedPct >= threshold - 25;
                                  const full = poolStats.depletedPct >= threshold;
                                  const fill = full ? 100 : active ? (poolStats.depletedPct % 25) * 4 : 0;
                                  
                                  return (
                                      <div key={seg} className="flex-1 bg-white/5 rounded-sm overflow-hidden relative border border-white/5">
                                          <div 
                                              className="h-full bg-primary transition-all duration-1000" 
                                              style={{ width: `${fill}%` }} 
                                          />
                                          {active && !full && <div className="absolute inset-0 bg-primary/20 animate-pulse" />}
                                      </div>
                                  );
                              })}
                          </div>
                          <div className="flex justify-between items-center text-[7px] font-bold text-white/20 uppercase">
                              <span>8M DKST</span>
                              <span>16M</span>
                              <span>24M</span>
                              <span>32.5M</span>
                          </div>
                      </div>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-white/5 border-white/5 rounded-[2.2rem] p-8 flex flex-col justify-between overflow-hidden relative group">
                             <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700"><Building2 size={80} /></div>
                             <div className="space-y-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><Building2 size={20} /></div>
                                    <h4 className="text-sm font-black uppercase italic">Trésorerie Hub</h4>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-white italic">{treasury?.dkstBalance?.toLocaleString() || 0} <span className="text-xs opacity-40 not-italic">DKST</span></p>
                                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Actifs de l'entreprise sécurisés</p>
                                </div>
                                <div className="pt-4 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[7px] font-black uppercase text-white/40">Audit GCV compliant</span>
                                </div>
                             </div>
                        </Card>
                        <div className="grid grid-cols-1 gap-4">
                            <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20 rounded-[2.2rem] p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5"><Target size={40} /></div>
                                <div className="relative z-10 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-black uppercase italic tracking-widest text-primary">Missions du Jour</h4>
                                        <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase">
                                            {user?.completedMissionsToday?.length || 0} / {myMissions.length}
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        {myMissions.map((mission) => {
                                            const isDone = user?.completedMissionsToday?.includes(mission.id);
                                            return (
                                                <div 
                                                    key={mission.id} 
                                                    onClick={() => !isDone && handleCompleteMission(mission)}
                                                    className={cn(
                                                        "p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer group",
                                                        isDone ? "bg-green-500/5 border-green-500/20 opacity-60" : "bg-white/5 border-white/5 hover:border-primary/30"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <span className="text-lg">{mission.icon}</span>
                                                        <div className="overflow-hidden">
                                                            <p className="text-[9px] font-black uppercase text-white truncate">{mission.title}</p>
                                                            <p className="text-[7px] text-muted-foreground uppercase font-bold truncate">{mission.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0">
                                                        {isDone ? (
                                                            <CheckCircle className="text-green-500 h-4 w-4" />
                                                        ) : claimingMission === mission.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                        ) : (
                                                            <Badge className="bg-primary text-white text-[7px] font-black group-hover:scale-110 transition-transform">+{mission.rewardPoints} PTS</Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Card>
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

const navConfig = [
  { href: "/dashboard", icon: Home, label: "Aperçu", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/wallet", icon: Wallet, label: "Mon Wallet DKST", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/finance", icon: BarChartHorizontal, label: "Rapports Financiers", roles: ["Admin"] },
  { href: "/dashboard/governance", icon: Vote, label: "Gouvernance DAO", roles: ["Admin", "Seller", "Cashier", "customer"] },
  { href: "/dashboard/profile/expert", icon: UserIcon, label: "Mon Profil Expert", roles: ["Admin", "Seller", "Cashier"] },
  { href: "/dashboard/tokens", icon: Coins, label: "Économie Hub", roles: ["Admin", "Seller", "Cashier"] },
  { href: "/dashboard/notary", icon: Scale, label: "Notaire du Hub", roles: ["Admin"] },
  { href: "/dashboard/calendar", icon: CalendarIcon, label: "Agenda Hub", roles: ["Admin", "Seller", "Cashier"] },
  { href: "/dashboard/portfolio", icon: Layout, label: "Gestion Portfolio", roles: ["Admin", "Seller"] },
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

export default withAuth(DashboardPage);
