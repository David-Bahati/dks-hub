
"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Coins, 
    ArrowLeft, 
    Loader2, 
    RefreshCw, 
    Globe, 
    Lock, 
    ShieldCheck, 
    History,
    QrCode,
    Zap,
    TrendingUp,
    Send,
    Wallet,
    Award,
    Star,
    Crown,
    Gift,
    Smartphone,
    Info,
    Search,
    User as UserIcon,
    CheckCircle2,
    X,
    TrendingDown,
    ArrowUpCircle,
    ShoppingBag,
    Ticket,
    Vault,
    Timer,
    CircleDollarSign,
    Filter,
    ArrowDownLeft,
    ArrowUpRight,
    GraduationCap,
    Wrench,
    Flame,
    Calculator,
    Gem,
    Sparkles,
    ArrowRight,
    LineChart as ChartIcon,
    Activity,
    Download,
    FileBadge,
    Medal,
    Banknote,
    BarChart3,
    ShieldAlert,
    KeyRound,
    Eye,
    EyeOff,
    Fingerprint,
    AlertTriangle,
    ShieldX,
    HeartPulse,
    UserCheck,
    Scale,
    Copy,
    Check,
    ChevronDown,
    ArrowDownUp,
    PieChart as LucidePieChart
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, addDoc, serverTimestamp, doc, updateDoc, increment, getDocs } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from "@/components/ui/dialog";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Slider } from "@/components/ui/slider";

const POINTS_PER_TOKEN = 100;
const GCV_VALUE = 314159; // Global Consensus Value in USD

const SHOP_PERKS = [
    { id: 'discount_10', title: 'Coupon -10% Hardware', cost: 50, description: 'Réduction immédiate sur tout article en stock.', icon: <ShoppingBag className="text-accent" /> },
    { id: 'diagnostic_free', title: 'Check-up PC Offert', cost: 30, description: 'Expertise complète de votre machine au labo.', icon: <Wrench className="text-primary" /> },
    { id: 'academy_pass', title: 'Accès Masterclass VIP', cost: 100, description: 'Invitation à une session DKS Academy au choix.', icon: <GraduationCap className="text-purple-400" /> },
];

function UniversalWalletPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isMounted, setIsMounted] = useState(false);
    const [isMinting, setIsMinting] = useState(false);
    const [isTransferSheetOpen, setIsTransferSheetOpen] = useState(false);
    const [isReceiveSheetOpen, setIsReceiveSheetOpen] = useState(false);
    const [isSwapSheetOpen, setIsSwapSheetOpen] = useState(false);
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    
    // Security States
    const [isPinVerificationOpen, setIsPinVerificationOpen] = useState(false);
    const [enteredPin, setEnteredPin] = useState("");
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [showPin, setShowPin] = useState(false);
    const [isEmergencyLockProcessing, setIsEmergencyLockProcessing] = useState(false);

    // Swap States
    const [swapFrom, setSwapFrom] = useState("dkst");
    const [swapTo, setSwapTo] = useState("pi");
    const [swapAmount, setSwapAmount] = useState("");

    // Staking States
    const [stakeAmount, setStakeAmount] = useState("");
    const [simAmount, setSimAmount] = useState([100]);

    // Transfer States
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
    const [transferAmount, setTransferAmount] = useState("");
    const [transferMemo, setTransferMemo] = useState("");
    const [hasCopiedId, setHasCopiedId] = useState(false);

    // Heritage States
    const [heritageRecipient, setHeritageRecipient] = useState<any>(null);
    const [heritageThreshold, setHeritageThreshold] = useState("90");

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

    const logsQuery = useMemoFirebase(() => {
        if (!user?.uid || !isStaff) return null;
        return query(collection(db, "technicianLogs"), where("userId", "==", user.uid));
    }, [user?.uid, isStaff]);
    const { data: logs } = useCollection(logsQuery);

    const ordersQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return query(collection(db, "orders"), where("userId", "==", user.uid), where("status", "in", ["payée", "payé", "completed", "terminé"]));
    }, [user?.uid]);
    const { data: orders } = useCollection(ordersQuery);

    const txQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return query(collection(db, "tokenTransactions"), where("userId", "==", user.uid), orderBy("createdAt", "asc"));
    }, [user?.uid]);
    const { data: transactions } = useCollection(txQuery);

    const stats = useMemo(() => {
        if (!user) return { totalPoints: 0, redeemableTokens: 0, progress: 0, availablePoints: 0, stakingRewards: 0, apr: 5, gcvUSD: 0, totalTokens: 0, wealthHistory: [], nextDividend: 0 };

        let total = 0;
        if (isStaff) {
            total += (logs?.length || 0) * 10;
        } else {
            total += (orders?.length || 0) * 100; 
            total += (user.referralCount || 0) * 500; 
        }

        const availablePoints = total - (user.pointsConverted || 0);
        const redeemable = Math.floor(availablePoints / POINTS_PER_TOKEN);
        const progress = (availablePoints % POINTS_PER_TOKEN);

        let apr = 5;
        if (user.loyaltyLevel === 'Gold') apr = 12;
        else if (user.loyaltyLevel === 'Silver') apr = 8;

        let rewards = 0;
        if (user.stakedBalance && user.stakingStartedAt) {
            const start = user.stakingStartedAt?.toDate ? user.stakingStartedAt.toDate() : new Date(user.stakingStartedAt);
            const hoursStaked = Math.max(0, (Date.now() - start.getTime()) / (1000 * 60 * 60));
            rewards = (user.stakedBalance * (apr / 100) * (hoursStaked / 8760));
        }

        let runningTotal = 0;
        const wealthHistory: any[] = [];

        transactions?.forEach((tx, idx) => {
            const isIncoming = tx.type === 'mint' || tx.type === 'mining' || tx.type === 'unstaking' || tx.type === 'dividend' || (tx.type === 'transfer' && tx.direction === 'received');
            runningTotal += isIncoming ? tx.tokenAmount : -tx.tokenAmount;

            const date = tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : `T${idx}`;
            wealthHistory.push({ name: date, balance: runningTotal, wealth: runningTotal * GCV_VALUE });
        });

        const totalTokens = (user.tokenBalance || 0) + (user.stakedBalance || 0) + rewards + (user.piBalance || 0);
        const gcvUSD = totalTokens * GCV_VALUE;
        const nextDividend = totalTokens * 0.005;

        return { 
            totalPoints: total, availablePoints, redeemableTokens: redeemable, progress, 
            stakingRewards: rewards, apr, gcvUSD, totalTokens, nextDividend, 
            wealthHistory: wealthHistory.slice(-15) 
        };
    }, [user, logs, orders, isStaff, transactions]);

    const mintTokens = async () => {
        if (!user || stats.redeemableTokens < 1) return;
        setIsMinting(true);
        try {
            const tokens = stats.redeemableTokens;
            const points = tokens * POINTS_PER_TOKEN;
            const txId = `PI-MINT-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(tokens),
                pointsConverted: increment(points),
                lastActivityAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid, userName: user.name, type: 'mint',
                pointsAmount: points, tokenAmount: tokens, piTxId: txId,
                createdAt: serverTimestamp()
            });

            toast({ title: "Points Mintés !", description: `${tokens} DKST générés sur votre compte.` });
        } catch (error) { toast({ title: "Erreur Mint", variant: "destructive" }); } finally { setIsMinting(false); }
    };

    const secureAction = (action: () => void) => {
        if (user?.isWalletLocked) {
            toast({ title: "Wallet Verrouillé", description: "Déverrouillez votre wallet dans le centre de sécurité.", variant: "destructive" });
            return;
        }
        if (!user?.walletPin) {
            toast({ title: "PIN non configuré", description: "Veuillez configurer un code PIN dans les réglages.", variant: "destructive" });
            return;
        }
        setPendingAction(() => action);
        setIsPinVerificationOpen(true);
    };

    const handleVerifyPin = () => {
        if (enteredPin === user?.walletPin) {
            setIsPinVerificationOpen(false);
            setEnteredPin("");
            if (pendingAction) pendingAction();
        } else {
            toast({ title: "Code PIN Incorrect", variant: "destructive" });
            setEnteredPin("");
        }
    };

    const toggleEmergencyLock = async () => {
        if (!user) return;
        setIsEmergencyLockProcessing(true);
        try {
            const newLockState = !user.isWalletLocked;
            await updateDoc(doc(db, "users", user.uid), { isWalletLocked: newLockState, updatedAt: serverTimestamp() });
            toast({ title: newLockState ? "Wallet Verrouillé" : "Wallet Déverrouillé", variant: newLockState ? "destructive" : "default" });
        } catch (e) { toast({ title: "Erreur Sécurité", variant: "destructive" }); } finally { setIsEmergencyLockProcessing(false); }
    };

    const handleStake = async () => {
        if (!user || !stakeAmount) return;
        const amount = parseFloat(stakeAmount);
        setIsProcessingAction(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(-amount),
                stakedBalance: increment(amount),
                stakingStartedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            await addDoc(collection(db, "tokenTransactions"), { userId: user.uid, type: 'staking', tokenAmount: amount, createdAt: serverTimestamp() });
            toast({ title: "Staking Actif" });
            setStakeAmount("");
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); } finally { setIsProcessingAction(false); }
    };

    const handleUnstake = async () => {
        if (!user || !user.stakedBalance) return;
        setIsProcessingAction(true);
        try {
            const amount = user.stakedBalance;
            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(amount + stats.stakingRewards),
                stakedBalance: 0,
                stakingStartedAt: null,
                updatedAt: serverTimestamp()
            });
            await addDoc(collection(db, "tokenTransactions"), { userId: user.uid, type: 'unstaking', tokenAmount: amount + stats.stakingRewards, createdAt: serverTimestamp() });
            toast({ title: "Capital & Intérêts Retirés" });
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); } finally { setIsProcessingAction(false); }
    };

    const handleBuyPerk = async (perk: any) => {
        if (!user || (user.tokenBalance || 0) < perk.cost) return;
        setIsProcessingAction(true);
        try {
            await updateDoc(doc(db, "users", user.uid), { tokenBalance: increment(-perk.cost), updatedAt: serverTimestamp() });
            await addDoc(collection(db, "tokenTransactions"), { userId: user.uid, type: 'exchange', tokenAmount: perk.cost, memo: perk.title, createdAt: serverTimestamp() });
            toast({ title: "Privilège Débloqué" });
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); } finally { setIsProcessingAction(false); }
    };

    const handleSaveHeritage = async () => {
        if (!user || !heritageRecipient) return;
        setIsProcessingAction(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                beneficiaryId: heritageRecipient.id,
                beneficiaryName: heritageRecipient.name || heritageRecipient.displayName,
                heritageThresholdDays: parseInt(heritageThreshold),
                updatedAt: serverTimestamp()
            });
            toast({ title: "Testament Numérique Scellé" });
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); } finally { setIsProcessingAction(false); }
    };

    const handleTransferProcess = async () => {
        if (!user || !selectedRecipient || !transferAmount) return;
        
        const amount = parseFloat(transferAmount);
        if (amount > (user.tokenBalance || 0)) {
            toast({ title: "Solde insuffisant", variant: "destructive" });
            return;
        }

        setIsProcessingAction(true);
        try {
            const piTxId = `PI-P2P-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(-amount),
                updatedAt: serverTimestamp()
            });

            await updateDoc(doc(db, "users", selectedRecipient.id), {
                tokenBalance: increment(amount),
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid,
                userName: user.name,
                type: 'transfer',
                tokenAmount: amount,
                senderId: user.uid,
                senderName: user.name,
                direction: 'sent',
                recipientId: selectedRecipient.id,
                recipientName: selectedRecipient.name || selectedRecipient.displayName,
                memo: transferMemo,
                piTxId: piTxId,
                createdAt: serverTimestamp()
            });

            await addDoc(collection(db, "tokenTransactions"), {
                userId: selectedRecipient.id,
                userName: selectedRecipient.name || selectedRecipient.displayName,
                type: 'transfer',
                tokenAmount: amount,
                direction: 'received',
                senderId: user.uid,
                senderName: user.name,
                memo: transferMemo,
                piTxId: piTxId,
                createdAt: serverTimestamp()
            });

            toast({ title: "Transfert réussi", description: `${amount} DKST envoyés à ${selectedRecipient.name || selectedRecipient.displayName}` });
            setIsTransferSheetOpen(false);
            setTransferAmount("");
            setTransferMemo("");
            setSelectedRecipient(null);
        } catch (error) {
            toast({ title: "Erreur transfert", variant: "destructive" });
        } finally {
            setIsProcessingAction(false);
        }
    };

    const handleSwapProcess = async () => {
        if (!user || !swapAmount) return;
        const amount = parseFloat(swapAmount);
        if (amount > (user.tokenBalance || 0)) {
            toast({ title: "Solde insuffisant", variant: "destructive" });
            return;
        }

        setIsProcessingAction(true);
        try {
            const fee = amount * 0.01; 
            const finalAmount = amount - fee;

            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(-amount),
                piBalance: increment(finalAmount),
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid,
                userName: user.name,
                type: 'exchange',
                tokenAmount: amount,
                memo: `Swap: ${swapFrom.toUpperCase()} vers ${swapTo.toUpperCase()}`,
                createdAt: serverTimestamp()
            });

            toast({ title: "Swap Effectué", description: `${finalAmount.toFixed(4)} ${swapTo.toUpperCase()} crédités sur votre réserve.` });
            setIsSwapSheetOpen(false);
            setSwapAmount("");
        } catch (e) {
            toast({ title: "Erreur Swap", variant: "destructive" });
        } finally {
            setIsProcessingAction(false);
        }
    };

    const copyWalletId = () => {
        if (user?.uid) {
            navigator.clipboard.writeText(user.uid);
            setHasCopiedId(true);
            toast({ title: "ID Copié", description: "Votre adresse de wallet est prête à être partagée." });
            setTimeout(() => setHasCopiedId(false), 2000);
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchQuery.length < 3) { setSearchResults([]); return; }
            setIsSearching(true);
            try {
                const q = query(collection(db, "users"), limit(10));
                const snap = await getDocs(q);
                const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((u: any) => u.id !== user?.uid && (u.name?.toLowerCase().includes(searchQuery.toLowerCase())));
                setSearchResults(results);
            } catch (e) { console.error(e); } finally { setIsSearching(false); }
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [searchQuery, user?.uid]);

    if (!isMounted) return null;

    const ASSETS = [
        { id: 'dkst', name: 'DKST Utility', balance: user?.tokenBalance || 0, icon: <Coins className="text-accent" />, color: 'text-accent', bg: 'bg-accent/10', sub: 'Hub Native' },
        { id: 'pi', name: 'Pi Network', balance: user?.piBalance || 0, icon: <Globe className="text-yellow-500" />, color: 'text-yellow-500', bg: 'bg-yellow-500/10', sub: 'Pi GCV' },
        { id: 'usd', name: 'US Dollar', balance: user?.usdBalance || 0, icon: <CircleDollarSign className="text-green-500" />, color: 'text-green-500', bg: 'bg-green-500/10', sub: 'Fiat Reserve' }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* HEADER STYLE BINANCE */}
                <div className="mb-10 flex flex-col items-center text-center">
                    <div className="flex items-center gap-2 text-muted-foreground uppercase font-black text-[10px] tracking-[0.4em] mb-4">
                        <ShieldCheck size={12} className="text-accent" /> Sécurisé par le Protocole DKS
                    </div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Fortune Totale Estimée</p>
                    <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-none mb-2">
                        ${stats.gcvUSD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                    </h2>
                    <p className="text-sm font-bold text-accent uppercase tracking-widest">≈ {stats.totalTokens.toFixed(4)} Actifs</p>

                    <div className="flex gap-4 mt-8 w-full max-w-sm">
                        <Button onClick={() => setIsReceiveSheetOpen(true)} className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase italic text-[10px] hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1">
                            <ArrowDownLeft size={18} /> Recevoir
                        </Button>
                        <Button onClick={() => setIsTransferSheetOpen(true)} className="flex-1 h-14 rounded-2xl bg-accent text-black font-black uppercase italic text-[10px] shadow-xl shadow-accent/20 flex flex-col items-center justify-center gap-1">
                            <Send size={18} /> Envoyer
                        </Button>
                        <Button onClick={() => setIsSwapSheetOpen(true)} className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase italic text-[10px] hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-1">
                            <ArrowDownUp size={18} /> Swap
                        </Button>
                    </div>
                </div>

                {/* LISTE DES ACTIFS - STYLE WALLET DÉCENTRALISÉ */}
                <Card className="glossy-card border-none rounded-[3rem] overflow-hidden mb-10">
                    <CardHeader className="px-8 py-6 border-b border-white/5 flex flex-row items-center justify-between">
                        <CardTitle className="text-xs font-black uppercase italic tracking-widest opacity-40">Mes Actifs</CardTitle>
                        <LucidePieChart size={14} className="text-accent opacity-40" />
                    </CardHeader>
                    <div className="divide-y divide-white/5">
                        {ASSETS.map(asset => (
                            <div key={asset.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform", asset.bg)}>
                                        {asset.icon}
                                    </div>
                                    <div>
                                        <p className="font-black text-sm uppercase italic text-white leading-none">{asset.name}</p>
                                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-1">{asset.sub}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-white leading-none">{asset.balance.toFixed(asset.id === 'pi' ? 6 : 2)}</p>
                                    <p className="text-[10px] font-bold text-white/40 mt-1 uppercase">
                                        ≈ ${(asset.balance * (asset.id === 'usd' ? 1 : GCV_VALUE)).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* TABS DE NAVIGATION SECONDAIRE */}
                <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="bg-white/5 border border-white/5 p-1 rounded-2xl h-12 w-full max-w-sm mx-auto flex">
                        <TabsTrigger value="overview" className="flex-1 rounded-xl font-black uppercase italic text-[9px]">Analyse</TabsTrigger>
                        <TabsTrigger value="vault" className="flex-1 rounded-xl font-black uppercase italic text-[9px]">Staking</TabsTrigger>
                        <TabsTrigger value="security" className="flex-1 rounded-xl font-black uppercase italic text-[9px]">Sécurité</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <Card className="glossy-card border-none rounded-[3rem] p-10">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black uppercase italic">Performance <span className="text-accent">Portefeuille</span></h3>
                                <ChartIcon size={20} className="text-accent opacity-20" />
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.wealthHistory}>
                                        <defs>
                                            <linearGradient id="colorWealth" x1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                                        <Area type="monotone" dataKey="wealth" stroke="hsl(var(--accent))" strokeWidth={3} fill="url(#colorWealth)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                                <div className="flex items-center gap-3"><Flame className="text-orange-500" size={20} /><h4 className="text-sm font-black uppercase italic">Convertir mes Points</h4></div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end"><p className="text-[9px] font-black uppercase text-white/40">Points Accumulés</p><span className="text-xl font-black text-accent">{stats.availablePoints} PTS</span></div>
                                    <Progress value={stats.progress} className="h-1.5 bg-white/5" indicatorClassName="bg-accent" />
                                    <Button onClick={() => secureAction(mintTokens)} disabled={isMinting || stats.redeemableTokens < 1} className="w-full h-12 bg-accent text-black font-black uppercase italic rounded-xl text-[10px] shadow-lg">
                                        {isMinting ? <Loader2 className="animate-spin" /> : "Lancer le Minting"}
                                    </Button>
                                </div>
                            </Card>

                            <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20 rounded-[2.5rem] p-8 flex flex-col justify-between">
                                <div className="flex items-center gap-3 mb-4"><Award className="text-primary" size={20} /><h4 className="text-sm font-black uppercase italic">Bonus Ambassadeur</h4></div>
                                <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-bold text-white/40 uppercase mb-1">Prochain Dividende</p>
                                    <p className="text-xl font-black text-white">+{stats.nextDividend.toFixed(4)} DKST</p>
                                    <p className="text-[8px] text-primary font-black uppercase mt-1">Calculé sur solde total</p>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="vault" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-8">
                                <div className="flex items-center gap-4"><Vault className="text-primary" size={24} /><h3 className="text-xl font-black uppercase italic tracking-tight">DKS Staking Vault</h3></div>
                                <div className="space-y-6">
                                    <div className="p-6 bg-primary/10 border border-primary/20 rounded-3xl">
                                        <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black uppercase text-primary">Rendement Annuel</span><Badge className="bg-primary text-white font-black italic">{stats.apr}% APR</Badge></div>
                                        <p className="text-xs text-white/60 italic leading-relaxed">Verrouillez vos DKST pour sécuriser Bunia et générer des intérêts en temps réel.</p>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Montant à Staker</Label>
                                        <Input type="number" placeholder="0.00" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-xl text-xl font-black text-white" />
                                    </div>
                                    <Button onClick={() => secureAction(handleStake)} disabled={isProcessingAction || !stakeAmount} className="w-full h-16 bg-primary text-white font-black uppercase italic rounded-2xl shadow-xl shadow-primary/20">Lancer le Staking</Button>
                                </div>
                            </Card>
                            <Card className="bg-black/40 border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between">
                                <div className="space-y-8">
                                    <div className="flex justify-between items-start"><div><h3 className="text-xl font-black uppercase italic">Ma Position</h3><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Actifs bloqués</p></div><div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary"><Timer size={24}/></div></div>
                                    <div className="space-y-6">
                                        <div><p className="text-[9px] font-black uppercase text-white/40 mb-1">Capital Vault</p><p className="text-4xl font-black text-white italic">{user?.stakedBalance?.toFixed(2) || 0} <span className="text-sm not-italic opacity-40">DKST</span></p></div>
                                        <div><p className="text-[9px] font-black uppercase text-white/40 mb-1">Récompenses accumulées</p><p className="text-4xl font-black text-green-400 italic">+{stats.stakingRewards.toFixed(6)}</p></div>
                                    </div>
                                </div>
                                <Button onClick={() => secureAction(handleUnstake)} disabled={isProcessingAction || !user?.stakedBalance} variant="outline" className="w-full h-16 border-white/10 rounded-2xl font-black uppercase italic mt-10 hover:bg-white/5">Retirer Tout</Button>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><KeyRound size={120} /></div>
                                <div className="relative z-10 space-y-6">
                                    <div className="flex items-center gap-4"><ShieldCheck className="text-accent" size={24} /><h2 className="text-xl font-black uppercase italic tracking-tight">Sécurité Wallet</h2></div>
                                    <p className="text-xs text-white/60 italic leading-relaxed">Votre code PIN est requis pour chaque transaction sortante et accès aux réglages sensibles.</p>
                                    
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent"><Fingerprint size={16}/></div>
                                            <span className="text-[10px] font-black uppercase">Statut PIN</span>
                                        </div>
                                        <Badge className={cn("border-none text-[8px] font-black uppercase", user?.walletPin ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                                            {user?.walletPin ? "Activé" : "Non Configuré"}
                                        </Badge>
                                    </div>

                                    <Button asChild variant="outline" className="w-full h-12 border-white/10 rounded-xl font-black uppercase italic text-[10px] hover:bg-white/5">
                                        <Link href="/dashboard/settings">Gérer mes codes d'accès</Link>
                                    </Button>
                                </div>
                            </Card>

                            <Card className="bg-red-500/10 border-red-500/20 rounded-[3rem] p-10 space-y-8">
                                <div className="flex items-center gap-4 text-red-500"><ShieldAlert size={32} /><h3 className="text-xl font-black uppercase italic tracking-tight">Zone d'Urgence</h3></div>
                                <p className="text-xs text-red-400 font-medium leading-relaxed italic">En cas de vol de votre téléphone, verrouillez instantanément votre wallet. Cette action gèlera tous vos avoirs.</p>
                                <Button onClick={toggleEmergencyLock} disabled={isEmergencyLockProcessing} className={cn("w-full h-16 rounded-2xl font-black uppercase italic text-[10px] gap-3", user?.isWalletLocked ? "bg-white text-black" : "bg-red-500 text-white shadow-xl shadow-red-500/20")}>
                                    {isEmergencyLockProcessing ? <Loader2 className="animate-spin" /> : user?.isWalletLocked ? <><Lock size={16} /> Déverrouiller le Wallet</> : <><ShieldX size={16} /> Verrouiller Tout</>}
                                </Button>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            {/* PIN VERIFICATION DIALOG */}
            <Dialog open={isPinVerificationOpen} onOpenChange={setIsPinVerificationOpen}>
                <DialogContent className="bg-card border-white/10 text-foreground rounded-[2.5rem] sm:max-w-md overflow-hidden p-0">
                    <DialogHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-accent/20 flex items-center justify-center text-accent shadow-xl shadow-accent/10"><Lock size={40} className="animate-pulse" /></div>
                            <div className="text-center">
                                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Signature Élite</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mt-1">Autorisation requise pour transaction</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="p-10 space-y-8">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-center block opacity-40">Entrez votre code secret à 4 chiffres</Label>
                            <div className="flex justify-center gap-4">
                                <div className="relative w-full max-w-[200px]">
                                    <Input 
                                        type={showPin ? "text" : "password"} 
                                        maxLength={4} 
                                        value={enteredPin} 
                                        onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))} 
                                        className="h-20 bg-background/50 border-white/10 rounded-2xl text-center text-5xl font-black tracking-[0.5em] focus:border-accent" 
                                        autoFocus 
                                    />
                                    <button onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-accent transition-colors">
                                        {showPin ? <EyeOff size={20}/> : <Eye size={20}/>}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="ghost" onClick={() => setIsPinVerificationOpen(false)} className="h-14 rounded-2xl font-black uppercase italic text-xs">Annuler</Button>
                            <Button onClick={handleVerifyPin} disabled={enteredPin.length < 4} className="h-14 bg-accent text-black font-black uppercase italic text-xs rounded-2xl shadow-xl shadow-accent/20">Signer & Valider</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* SWAP SHEET */}
            <Sheet open={isSwapSheetOpen} onOpenChange={setIsSwapSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-10 bg-accent/10 border-b border-white/5">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-xl shadow-accent/10"><ArrowDownUp size={32} /></div>
                            <div><SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">Instant Swap</SheetTitle><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Échange Décentralisé Hub</p></div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 p-10 space-y-10 overflow-y-auto">
                        <div className="space-y-8">
                            <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] space-y-4">
                                <Label className="text-[10px] font-black uppercase opacity-40">Vendre</Label>
                                <div className="flex items-center gap-4">
                                    <Select value={swapFrom} onValueChange={setSwapFrom}>
                                        <SelectTrigger className="w-[120px] h-12 bg-black/40 border-none rounded-xl font-black uppercase text-[10px]"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-card border-white/10">
                                            <SelectItem value="dkst">DKST</SelectItem>
                                            <SelectItem value="pi">Pi Network</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input type="number" value={swapAmount} onChange={(e) => setSwapAmount(e.target.value)} placeholder="0.00" className="flex-1 h-12 bg-transparent border-none text-2xl font-black text-right focus-visible:ring-0" />
                                </div>
                                <p className="text-[9px] text-muted-foreground uppercase font-bold">Solde: {user?.tokenBalance?.toFixed(2)} {swapFrom.toUpperCase()}</p>
                            </div>

                            <div className="flex justify-center -my-10 relative z-10">
                                <Button size="icon" variant="outline" onClick={() => { const f = swapFrom; setSwapFrom(swapTo); setSwapTo(f); }} className="h-12 w-12 rounded-xl bg-background border-white/10 hover:text-accent transition-all rotate-180"><ArrowDownUp size={20}/></Button>
                            </div>

                            <div className="p-6 bg-accent/5 border border-accent/20 rounded-[2rem] space-y-4">
                                <Label className="text-[10px] font-black uppercase opacity-40">Recevoir (Estimé)</Label>
                                <div className="flex items-center gap-4">
                                    <Select value={swapTo} onValueChange={setSwapTo}>
                                        <SelectTrigger className="w-[120px] h-12 bg-black/40 border-none rounded-xl font-black uppercase text-[10px]"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-card border-white/10">
                                            <SelectItem value="pi">Pi Network</SelectItem>
                                            <SelectItem value="dkst">DKST</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="flex-1 text-2xl font-black text-accent text-right">
                                        {swapAmount ? (parseFloat(swapAmount) * 0.99).toFixed(4) : "0.00"}
                                    </div>
                                </div>
                                <p className="text-[9px] text-accent/60 uppercase font-bold">1 {swapFrom.toUpperCase()} ≈ 1.00 {swapTo.toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="space-y-4 p-5 bg-white/5 rounded-2xl border border-white/5">
                            <div className="flex justify-between text-[9px] font-bold uppercase"><span className="opacity-40">Frais Hub (1%)</span><span>{(parseFloat(swapAmount || "0") * 0.01).toFixed(4)} {swapFrom.toUpperCase()}</span></div>
                            <div className="flex justify-between text-[9px] font-bold uppercase"><span className="opacity-40">Temps estimé</span><span className="text-green-400">Instantané</span></div>
                        </div>

                        <Button onClick={() => secureAction(handleSwapProcess)} disabled={isProcessingAction || !swapAmount} className="w-full h-20 bg-accent text-black font-black uppercase italic rounded-[2rem] shadow-2xl text-xl gap-4">
                            {isProcessingAction ? <Loader2 className="animate-spin" /> : <><ArrowDownUp size={24} /> Valider l'Échange</>}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* RECEIVE SHEET */}
            <Sheet open={isReceiveSheetOpen} onOpenChange={setIsReceiveSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-10 bg-accent/10 border-b border-white/5">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-xl shadow-accent/10"><ArrowDownLeft size={32} /></div>
                            <div><SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">Recevoir</SheetTitle><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Mon Adresse de Wallet DKS</p></div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 p-10 flex flex-col items-center justify-center gap-10">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-accent/20 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative bg-white p-8 rounded-[3rem] shadow-2xl">
                                <QrCode size={200} className="text-black" />
                            </div>
                        </div>
                        
                        <div className="w-full space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">Mon ID Unique</Label>
                                <div className="flex gap-2">
                                    <Input readOnly value={user?.uid || ""} className="h-14 bg-white/5 border-white/10 rounded-2xl font-mono text-[10px] text-accent tracking-wider text-center" />
                                    <Button onClick={copyWalletId} variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0 transition-all">
                                        {hasCopiedId ? <Check size={20}/> : <Copy size={20}/>}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* TRANSFER SHEET */}
            <Sheet open={isTransferSheetOpen} onOpenChange={setIsTransferSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-10 bg-accent/10 border-b border-white/5">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-xl shadow-accent/10"><Send size={32} /></div>
                            <div><SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">Envoyer des Jetons</SheetTitle><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Échange Universel DKS</p></div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 p-10 space-y-10 overflow-y-auto">
                        {!selectedRecipient ? (
                            <div className="space-y-6">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Chercher un membre</Label>
                                <div className="relative"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} /><Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Nom ou Email..." className="h-16 pl-14 bg-background/50 border-white/10 rounded-2xl focus:border-accent font-bold" /></div>
                                {searchQuery.length >= 3 && (
                                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                        {isSearching ? <div className="py-10 text-center"><Loader2 className="animate-spin text-accent mx-auto h-8 w-8" /></div> : searchResults.map((u) => (
                                            <button key={u.id} onClick={() => { setSelectedRecipient(u); setSearchQuery(""); }} className="flex items-center gap-4 p-5 w-full rounded-2xl bg-white/5 border border-white/5 hover:bg-accent/5 hover:border-accent/20 transition-all text-left">
                                                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center font-black text-accent text-lg italic">{(u.name || u.displayName)?.substring(0, 1)}</div>
                                                <div className="flex-1 overflow-hidden"><p className="font-black text-sm uppercase italic truncate">{u.name || u.displayName}</p><p className="text-[10px] opacity-40 truncate">{u.email}</p></div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={(e) => { e.preventDefault(); secureAction(handleTransferProcess); }} className="space-y-10">
                                <div className="p-6 bg-accent/5 border border-accent/20 rounded-[2.5rem] flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-accent text-black flex items-center justify-center font-black text-xl italic shadow-lg shadow-accent/20">{(selectedRecipient.name || selectedRecipient.displayName)?.substring(0, 1)}</div>
                                        <div><p className="text-[9px] font-black text-accent uppercase tracking-widest">Envoi vers</p><p className="text-lg font-black uppercase italic text-white mt-1">{selectedRecipient.name || selectedRecipient.displayName}</p></div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedRecipient(null)}><X size={20}/></Button>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Montant</Label>
                                        <div className="relative"><Coins className="absolute left-6 top-1/2 -translate-y-1/2 text-accent" size={24} /><Input type="number" step="0.01" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="h-20 pl-16 bg-background/50 border-white/10 rounded-[2rem] text-4xl font-black text-accent" required /></div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Mémo</Label>
                                        <Input value={transferMemo} onChange={(e) => setTransferMemo(e.target.value)} placeholder="Ex: Service Hub..." className="h-14 bg-background/50 border-white/10 rounded-2xl italic text-sm" />
                                    </div>
                                </div>
                                <Button type="submit" disabled={isProcessingAction || !transferAmount} className="w-full h-20 bg-accent text-black font-black uppercase italic rounded-[2rem] shadow-2xl text-xl gap-4">{isProcessingAction ? <Loader2 className="animate-spin" /> : <><Send size={24} /> Valider le Transfert</>}</Button>
                            </form>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default withAuth(UniversalWalletPage);

