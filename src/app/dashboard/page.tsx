
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
  Activity
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
import { useCollection, useMemoFirebase } from '@/firebase';
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
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const DAILY_MISSIONS: DailyMission[] = [
    { id: 'm1', title: 'Consultation Stock', description: 'Visiter le catalogue hardware pour voir les nouveautés.', rewardPoints: 10, icon: '📦', targetRole: 'all' },
    { id: 'm2', title: 'Alerte Labo', description: 'Consulter le journal de bord pour les mises à jour techniques.', rewardPoints: 20, icon: '📑', targetRole: 'staff' },
    { id: 'm3', title: 'Ambassadeur DKS', description: 'Partager votre code de parrainage sur WhatsApp.', rewardPoints: 50, icon: '📱', targetRole: 'customer' },
    { id: 'm4', title: 'Révision Config', description: 'Lancer une simulation avec l\'Assistant IA.', rewardPoints: 15, icon: '🤖', targetRole: 'all' },
];

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
  const [poolImpactChart, setPoolImpactChart] = useState<any[]>([]);
  const [totalPoolGifted, setTotalPoolGifted] = useState(0);
  const [rate, setRate] = useState(2500);
  const [isSendingDigest, setIsSendingDigest] = useState(false);
  const [isGeneratingCert, setIsGeneratingCert] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const [uSearch, setUSearch] = useState("");
  const [uResults, setUResults] = useState<{type: string, title: string, id: string, link: string}[]>([]);
  const [isUSearching, setIsUSearching] = useState(false);

  // Mining & Missions States
  const [isMining, setIsMining] = useState(false);
  const [miningTimeLeft, setMiningTimeLeft] = useState<string | null>(null);

  const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const filteredNavLinks = navConfig.filter(link => {
      const roles = link.roles.map(r => r.toLowerCase());
      const userRole = user?.role?.toLowerCase() || "";
      return roles.includes(userRole);
  });

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
    return { count, totalPower, luckMultiplier };
  }, [activeMiners]);

  // Query for Benefactors (Legendary discoveries)
  const legendaryTxQuery = useMemoFirebase(() => {
    return query(collection(db, "tokenTransactions"), where("type", "==", "mining"), where("rarity", "==", "legendary"));
  }, []);
  const { data: legendaryTx } = useCollection(legendaryTxQuery);

  const benefactorsLeaderboard = useMemo(() => {
    if (!legendaryTx) return [];
    const counts: Record<string, { name: string, count: number }> = {};
    legendaryTx.forEach(tx => {
        if (!counts[tx.userId]) {
            counts[tx.userId] = { name: tx.userName || "Bienfaiteur", count: 0 };
        }
        counts[tx.userId].count++;
    });
    return Object.entries(counts)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
  }, [legendaryTx]);

  // Basic Queries
  const ordersQuery = useMemoFirebase(() => {
    if (authLoading || !user?.uid) return null;
    return query(collection(db, "orders"), orderBy("createdAt", "desc"));
  }, [user?.uid, authLoading]);
  const { data: allOrders } = useCollection(ordersQuery);

  const customersQuery = useMemoFirebase(() => {
    return query(collection(db, "users"), where("role", "in", ["customer", "Customer"]));
  }, []);
  const { data: allCustomers } = useCollection(customersQuery);

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

  // Mining Timer Effect
  useEffect(() => {
    if (!user?.lastMiningAt) return;
    
    const interval = setInterval(() => {
        const lastMining = user.lastMiningAt?.toDate ? user.lastMiningAt.toDate() : new Date(user.lastMiningAt);
        const nextMining = new Date(lastMining.getTime() + 24 * 60 * 60 * 1000);
        const now = new Date();
        
        if (now >= nextMining) {
            setMiningTimeLeft(null);
            clearInterval(interval);
        } else {
            const diff = nextMining.getTime() - now.getTime();
            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff / (1000 * 60)) % 60);
            const s = Math.floor((diff / 1000) % 60);
            setMiningTimeLeft(`${h}h ${m}m ${s}s`);
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.lastMiningAt]);

  const handleStartMining = async () => {
    if (!user || miningTimeLeft) return;
    setIsMining(true);
    try {
        const random = Math.random();
        let rarity: 'common' | 'rare' | 'legendary' = 'common';
        let multiplier = 1;
        let rarityLabel = "Commun";

        const legendaryThreshold = 0.05 * poolStats.luckMultiplier;
        const rareThreshold = 0.20 * poolStats.luckMultiplier;

        if (random < legendaryThreshold) {
            rarity = 'legendary';
            multiplier = 5;
            rarityLabel = "LÉGENDAIRE";
        } else if (random < rareThreshold) {
            rarity = 'rare';
            multiplier = 2;
            rarityLabel = "RARE";
        }

        const baseReward = user.loyaltyLevel === 'Gold' ? 0.5 : user.loyaltyLevel === 'Silver' ? 0.2 : 0.1;
        const reward = baseReward * multiplier;
        const txId = `PI-POOL-MINING-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

        await updateDoc(doc(db, "users", user.uid), {
            lastMiningAt: serverTimestamp(),
            tokenBalance: increment(reward),
            lastBlockRarity: rarity,
            miningPower: increment(0.1),
            updatedAt: serverTimestamp()
        });

        await addDoc(collection(db, "tokenTransactions"), {
            userId: user.uid,
            userName: user.name,
            type: 'mining',
            tokenAmount: reward,
            rarity: rarity,
            piTxId: txId,
            memo: `Extraction Bloc ${rarityLabel} (${multiplier}x) - Pool Bonus incl.`,
            createdAt: serverTimestamp()
        });

        if (rarity === 'legendary' && activeMiners && activeMiners.length > 1) {
            const shareAmount = 0.05;
            const others = activeMiners.filter(u => u.id !== user.uid);
            
            others.forEach(async (other) => {
                updateDoc(doc(db, "users", other.id), {
                    tokenBalance: increment(shareAmount),
                    updatedAt: serverTimestamp()
                });
                
                addDoc(collection(db, "tokenTransactions"), {
                    userId: other.id,
                    userName: other.name,
                    type: 'mining',
                    tokenAmount: shareAmount,
                    rarity: 'common',
                    piTxId: `POOL-SHARE-${txId.substring(0, 10)}`,
                    memo: `Part de Bloc Légendaire trouvé par ${user.name} !`,
                    createdAt: serverTimestamp()
                });

                addDoc(collection(db, "notifications"), {
                    userId: other.id,
                    title: "Bonus de Pool !",
                    message: `${user.name} a découvert un bloc LÉGENDAIRE. Vous recevez une part de ${shareAmount} DKST !`,
                    type: 'success',
                    isRead: false,
                    createdAt: serverTimestamp(),
                    link: '/dashboard/wallet'
                });
            });
        }

        if (rarity === 'legendary') {
            toast({ title: "JACKPOT LÉGENDAIRE !", description: `Récompense partagée avec le pool : Vous avez extrait ${reward} DKST !`, className: "bg-yellow-500 text-black font-black" });
        } else if (rarity === 'rare') {
            toast({ title: "Bloc Rare Découvert !", description: `Récompense x2 : ${reward} DKST ajoutés à votre wallet.`, className: "bg-purple-500 text-white font-black" });
        } else {
            toast({ title: "Minage Réussi", description: `Vous avez extrait ${reward} DKST du bloc standard.` });
        }

    } catch (e) {
        toast({ title: "Erreur Minage", variant: "destructive" });
    } finally {
        setIsMining(false);
        fetchGlobalData();
    }
  };

  const handleCompleteMission = async (mission: DailyMission) => {
      if (!user) return;
      if (user.completedMissionsToday?.includes(mission.id)) {
          toast({ title: "Déjà accomplie", description: "Revenez demain pour de nouveaux points." });
          return;
      }

      try {
          await updateDoc(doc(db, "users", user.uid), {
              points: increment(mission.rewardPoints),
              completedMissionsToday: [...(user.completedMissionsToday || []), mission.id],
              updatedAt: serverTimestamp()
          });

          await addDoc(collection(db, "notifications"), {
              userId: user.uid,
              title: "Mission Réussie !",
              message: `Félicitations ! Vous avez gagné ${mission.rewardPoints} points de prestige.`,
              type: 'success',
              isRead: false,
              createdAt: serverTimestamp()
          });

          toast({ title: "Mission Terminée", description: `+${mission.rewardPoints} points de prestige !` });
      } catch (e) {
          toast({ title: "Erreur Mission", variant: "destructive" });
      }
  };

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

  const customerLeaderboard = useMemo(() => {
    if (!allCustomers || !allOrders) return [];
    return allCustomers.map(cust => {
      const custOrders = allOrders?.filter(o => o.userId === cust.id && ["payée", "payé", "completed", "terminé"].includes(o.status.toLowerCase())) || [];
      const orderPoints = custOrders.length * 100;
      const referralPoints = (cust.referralCount || 0) * 500;
      const totalPoints = orderPoints + referralPoints;
      return {
        id: cust.id,
        name: cust.name || cust.displayName || "Client Élite",
        points: totalPoints,
        orders: custOrders.length,
        referrals: cust.referralCount || 0,
        level: cust.loyaltyLevel || 'Bronze'
      };
    }).sort((a, b) => b.points - a.points).slice(0, 5);
  }, [allCustomers, allOrders]);

  const weeklyWinner = leaderboard[0];

  useEffect(() => {
    fetchGlobalData();
  }, [isStaff, authLoading]);

  const fetchGlobalData = async () => {
    setLoading(true);
    try {
      const [dashboardStats, lowStockItems, exchangeRate, revenueData, poolImpact] = await Promise.all([
        getDashboardStats(),
        getLowStockItems(),
        getExchangeRate(),
        getRevenueChartData(),
        getPoolImpactData()
      ]);
      setStats(dashboardStats);
      setLowStock(lowStockItems);
      setRate(exchangeRate);
      setChartData(revenueData);
      setPoolImpactChart(poolImpact.chartData);
      setTotalPoolGifted(poolImpact.totalDistributed);
    } catch (error) {
      console.error("Dashboard Data Fetch Error:", error);
    } finally {
      setLoading(false);
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
        toast({ title: "Certificat généré" });
    } catch (error) {
        toast({ title: "Erreur PDF", variant: "destructive" });
    } finally {
        setIsGeneratingCert(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (uSearch.length < 3) { setUResults([]); return; }
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
        setUResults(results.slice(0, 8));
      } catch (e) { console.error(e); } finally { setIsUSearching(false); }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [uSearch]);

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

  const myCustomerPoints = (allOrders?.filter(o => o.userId === user?.uid && ["payée", "payé", "completed", "terminé"].includes(o.status.toLowerCase())).length || 0) * 100 + (user?.referralCount || 0) * 500;

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
            
            <div className="flex items-center gap-4">
                <Link href="/dashboard/wallet">
                    <Badge className="bg-accent/20 text-accent border-accent/20 h-10 px-4 rounded-xl gap-2 font-black italic cursor-pointer hover:bg-accent/30 transition-all hidden sm:flex">
                        <Coins size={16} /> {user?.tokenBalance?.toFixed(2) || 0} DKST
                    </Badge>
                </Link>
                <Button variant="ghost" size="icon" onClick={fetchGlobalData} className="h-10 w-10 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-xl transition-all group">
                  <RefreshCw size={18} className={cn("transition-transform duration-700", loading ? "animate-spin" : "group-hover:rotate-180")} />
                </Button>
            </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-8 pb-24 max-w-[1600px] mx-auto w-full">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
              <Card className="lg:col-span-5 bg-gradient-to-br from-accent/10 via-background to-black border-accent/20 rounded-[3rem] p-10 relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-45 group-hover:rotate-0 transition-transform duration-1000"><Pickaxe size={200} className="text-accent" /></div>
                  <div className="relative z-10 space-y-8">
                      <div className="flex justify-between items-start">
                          <div className="space-y-1">
                              <Badge className="bg-accent text-black font-black uppercase italic text-[8px] tracking-[0.3em] px-4 py-1 mb-2">Extraction en Cours</Badge>
                              <h2 className="text-3xl font-black uppercase italic tracking-tighter">MINAGE <span className="text-accent">NUAGIQUE</span></h2>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Générez des DKST passivement</p>
                          </div>
                          <div className="w-16 h-16 rounded-[2rem] bg-accent/20 flex items-center justify-center text-accent shadow-[0_0_40px_rgba(56,189,248,0.2)]">
                              <Pickaxe className={cn("transition-all duration-300", !miningTimeLeft ? "animate-bounce" : "animate-pulse")} size={32} />
                          </div>
                      </div>

                      <div className="p-8 bg-black/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 flex flex-col items-center gap-8 shadow-inner">
                          {miningTimeLeft ? (
                              <div className="text-center space-y-6">
                                  <p className="text-[10px] font-black uppercase text-accent tracking-[0.5em]">Session Active</p>
                                  <div className="flex items-center gap-6 justify-center">
                                      <div className="w-2 h-16 bg-accent rounded-full animate-[pulse_1.5s_infinite]" />
                                      <div className="text-6xl font-black text-white italic tracking-tighter font-mono">{miningTimeLeft}</div>
                                      <div className="w-2 h-16 bg-accent rounded-full animate-[pulse_1.5s_infinite] delay-300" />
                                  </div>
                                  
                                  <div className="flex flex-col items-center gap-4">
                                      <div className={cn(
                                          "px-6 py-2 rounded-2xl border flex items-center gap-3 animate-in zoom-in-50 duration-500",
                                          user?.lastBlockRarity === 'legendary' ? "bg-yellow-500/20 border-yellow-500 text-yellow-500" :
                                          user?.lastBlockRarity === 'rare' ? "bg-purple-500/20 border-purple-500 text-purple-400" :
                                          "bg-accent/10 border-accent/20 text-accent"
                                      )}>
                                          {user?.lastBlockRarity === 'legendary' ? <Crown size={16} /> : user?.lastBlockRarity === 'rare' ? <Gem size={16} /> : <Cpu size={16} />}
                                          <span className="text-[10px] font-black uppercase tracking-widest italic">
                                              Bloc {user?.lastBlockRarity === 'legendary' ? "LÉGENDAIRE" : user?.lastBlockRarity === 'rare' ? "RARE" : "COMMUN"} détecté
                                          </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase italic">
                                          <Zap size={12} className="text-accent" /> Puissance: {(user?.miningPower || 1.0).toFixed(1)} GH/s
                                      </div>
                                  </div>
                              </div>
                          ) : (
                              <div className="text-center space-y-6">
                                  <div className="space-y-2">
                                      <p className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">PRÊT À <br /><span className="text-accent">EXTRAIRE</span></p>
                                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic leading-relaxed">Récompense cycle : {user?.loyaltyLevel === 'Gold' ? '0.50' : user?.loyaltyLevel === 'Silver' ? '0.20' : '0.10'} DKST</p>
                                  </div>
                                  <Button 
                                      onClick={handleStartMining} 
                                      disabled={isMining}
                                      className="h-20 px-12 rounded-[2rem] bg-accent text-black font-black uppercase italic text-xl shadow-[0_0_50px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95 transition-all gap-4"
                                  >
                                      {isMining ? <Loader2 className="animate-spin" /> : <><Flame size={28} /> Lancer le Cycle</>}
                                  </Button>
                                  <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Probabilité Légendaire Boostée par le Hub : {(5 * poolStats.luckMultiplier).toFixed(1)}%</p>
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
                              <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                                  <Users size={32} />
                              </div>
                              <div>
                                  <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">Hub Mining <span className="text-primary">Pool</span></h3>
                                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Puissance Collective • Bunia Mainnet</p>
                              </div>
                          </div>

                          <div className="flex items-center gap-10">
                              <div className="text-center">
                                  <p className="text-3xl font-black text-white italic">{poolStats.count}</p>
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">Mineurs Actifs</p>
                              </div>
                              <div className="text-center">
                                  <div className="flex items-center gap-2 text-primary">
                                      <TrendingUp size={16} />
                                      <p className="text-3xl font-black italic">{poolStats.totalPower.toFixed(1)}</p>
                                  </div>
                                  <p className="text-[8px] font-black uppercase text-muted-foreground">TH/s Global</p>
                              </div>
                              <div className="bg-primary/10 border border-primary/20 px-5 py-3 rounded-2xl text-center">
                                  <p className="text-[8px] font-black uppercase text-primary mb-1">Hub Luck Bonus</p>
                                  <p className="text-xl font-black text-primary italic">+{((poolStats.luckMultiplier - 1) * 100).toFixed(0)}%</p>
                              </div>
                          </div>
                      </div>
                      
                      <div className="mt-8 space-y-2">
                          <div className="flex justify-between text-[8px] font-black uppercase text-white/40 tracking-widest px-1">
                              <span>Activité Réseau DKS</span>
                              <span>Partage de Bloc Légendaire Actif</span>
                          </div>
                          <Progress value={(poolStats.count / 20) * 100} className="h-1.5 bg-white/5" indicatorClassName="bg-primary" />
                      </div>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-white/5 border-white/5 rounded-[2.2rem] p-8 flex flex-col justify-between overflow-hidden relative">
                             <div className="absolute top-0 right-0 p-6 opacity-5"><Activity size={80} /></div>
                             <div className="space-y-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><Heart size={20} /></div>
                                    <h4 className="text-sm font-black uppercase italic">Impact Collectif</h4>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-4xl font-black text-white italic">{totalPoolGifted.toFixed(2)} <span className="text-xs opacity-40 not-italic">DKST</span></p>
                                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Fortune distribuée par les bienfaiteurs</p>
                                </div>
                             </div>
                             <div className="h-24 w-full mt-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={poolImpactChart}>
                                        <defs><linearGradient id="poolGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/></linearGradient></defs>
                                        <Area type="monotone" dataKey="total" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#poolGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                             </div>
                        </Card>

                        <div className="space-y-4">
                            {DAILY_MISSIONS.slice(0, 2).map((mission) => {
                                const isDone = user?.completedMissionsToday?.includes(mission.id);
                                return (
                                    <Card key={mission.id} className={cn(
                                        "bg-white/5 border border-white/5 rounded-[2.2rem] p-6 transition-all group relative overflow-hidden h-[calc(50%-8px)]",
                                        isDone ? "opacity-60" : "hover:bg-white/[0.08]"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl">{mission.icon}</div>
                                            <div className="flex-1">
                                                <h4 className="font-black uppercase italic text-xs tracking-tight text-white">{mission.title}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge className="bg-primary/20 text-primary border-none uppercase text-[7px] font-black">+{mission.rewardPoints} PTS</Badge>
                                                    {isDone ? <CheckCircle2 size={12} className="text-green-400" /> : <button onClick={() => handleCompleteMission(mission)} className="text-[8px] font-black uppercase italic text-accent hover:underline">Valider</button>}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                  </div>
              </div>
          </div>

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
                            <p className="text-6xl font-black text-primary italic">{myCustomerPoints}</p>
                            <p className="text-[9px] font-bold uppercase mt-4 text-muted-foreground">Grade Actuel: {user?.loyaltyLevel || 'Bronze'}</p>
                        </div>
                    </div>
                </Card>
            </div>
          )}

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-10">
            <div className="lg:col-span-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glossy-card border-none rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="py-6 px-8 border-b border-white/5 bg-accent/5">
                      <CardTitle className="text-sm font-black uppercase italic flex items-center gap-3">
                        <Trophy className="text-accent" size={16} /> Équipe Hub (Staff)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                       <div className="divide-y divide-white/5">
                          {leaderboard.map((member, index) => (
                            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm italic",
                                      index === 0 ? "bg-yellow-500/20 text-yellow-500" : "bg-white/5 text-muted-foreground"
                                    )}>
                                      {index === 0 ? <Crown size={16} /> : index + 1}
                                    </div>
                                    <div>
                                        <p className="font-black text-xs uppercase italic truncate max-w-[100px]">{member.name}</p>
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase">{member.points} PTS</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="border-none font-black text-[9px] italic text-accent/60">
                                  {member.actions} ACT.
                                </Badge>
                            </div>
                          ))}
                       </div>
                    </CardContent>
                </Card>

                <Card className="glossy-card border-none rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="py-6 px-8 border-b border-white/5 bg-primary/5">
                      <CardTitle className="text-sm font-black uppercase italic flex items-center gap-3">
                        <Users className="text-primary" size={16} /> Élite Communauté (Clients)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                       <div className="divide-y divide-white/5">
                          {customerLeaderboard.map((cust, index) => (
                            <div key={cust.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm italic",
                                      index === 0 ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"
                                    )}>
                                      {index === 0 ? <Star size={16} /> : index + 1}
                                    </div>
                                    <div>
                                        <p className="font-black text-xs uppercase italic truncate max-w-[100px]">{cust.name}</p>
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase">{cust.points} PTS • {cust.level}</p>
                                    </div>
                                </div>
                            </div>
                          ))}
                       </div>
                    </CardContent>
                </Card>

                <Card className="glossy-card border-none rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="py-6 px-8 border-b border-white/5 bg-yellow-500/10">
                      <CardTitle className="text-sm font-black uppercase italic flex items-center gap-3">
                        <Heart className="text-yellow-500" size={16} /> Philanthropes du Hub
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                       <div className="divide-y divide-white/5">
                          {benefactorsLeaderboard.length > 0 ? benefactorsLeaderboard.map((benefactor, index) => (
                            <div key={benefactor.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm italic",
                                      index === 0 ? "bg-yellow-500 text-black" : "bg-white/5 text-muted-foreground"
                                    )}>
                                      <Gem size={14} />
                                    </div>
                                    <div>
                                        <p className="font-black text-xs uppercase italic truncate max-w-[100px]">{benefactor.name}</p>
                                        <p className="text-[8px] font-bold text-yellow-500 uppercase">{benefactor.count} Bloc(s) Légendaire(s)</p>
                                    </div>
                                </div>
                                <Badge variant="outline" className="border-yellow-500/20 text-yellow-500 font-black text-[8px] italic">
                                  BÉNÉFACTEUR
                                </Badge>
                            </div>
                          )) : (
                            <div className="p-10 text-center opacity-30 italic text-[10px] uppercase font-black">
                                Aucun bloc légendaire extrait.
                            </div>
                          )}
                       </div>
                    </CardContent>
                </Card>
            </div>
          </div>

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
                            {allOrders?.filter(o => o.userId === user?.uid).slice(0, 5).map((order) => (
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
                                    </div>
                                </div>
                            )) || (
                              <div className="h-full flex flex-col items-center justify-center opacity-30 italic"><ShoppingBag size={48} className="mb-4" /><p>Aucune commande enregistrée.</p></div>
                            )}
                          </div>
                        )}
                    </CardContent>
                </Card>
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
                  <div className="relative z-10 text-center w-full px-40 space-y-12">
                      <Logo size="lg" />
                      <h1 className="text-6xl font-black uppercase italic tracking-tighter text-[#0f172a]">EMPLOYÉ DU MOIS</h1>
                      <h3 className="text-5xl font-black uppercase italic text-[#3b82f6] tracking-tight">{weeklyWinner.name}</h3>
                      <p className="text-lg font-medium text-gray-500 max-w-2xl mx-auto leading-relaxed">
                          En reconnaissance de son investissement exceptionnel, totalisant un score de prestige de <strong>{weeklyWinner.points} points</strong>.
                      </p>
                      <div className="grid grid-cols-3 items-end pt-12">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date de distinction</p>
                          <div className="p-3 border-2 border-gray-100 rounded-2xl bg-white shadow-sm"><QrCode size={60} className="opacity-10" /></div>
                          <div className="flex flex-col items-center">
                              <p className="text-sm font-black italic">Double King Shop</p>
                              <ShieldCheck size={24} className="text-green-600 mt-2 opacity-30" />
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
}

export default withAuth(DashboardPage);
