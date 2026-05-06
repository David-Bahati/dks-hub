"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    TrendingUp as TrendingUpIcon,
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
    Check
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, updateDoc, doc, addDoc, serverTimestamp, increment, limit, getDocs, Timestamp } from 'firebase/firestore';
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
} from "@/components/ui/sheet";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter,
    DialogDescription 
} from "@/components/ui/dialog";
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
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';
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
    const [isMinting, setIsMinting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isTransferSheetOpen, setIsTransferSheetOpen] = useState(false);
    const [isReceiveSheetOpen, setIsReceiveSheetOpen] = useState(false);
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [tempPiAddress, setTempPiAddress] = useState("");
    
    // Security States
    const [isPinVerificationOpen, setIsPinVerificationOpen] = useState(false);
    const [enteredPin, setEnteredPin] = useState("");
    const [pendingAction, setPendingAction] = useState<() => void>(() => () => {});
    const [showPin, setShowPin] = useState(false);
    const [isEmergencyLockProcessing, setIsEmergencyLockProcessing] = useState(false);

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

    // Certificate States
    const [isGeneratingCert, setIsGeneratingCert] = useState(false);
    const certRef = useRef<HTMLDivElement>(null);

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

    const topWealthQuery = useMemoFirebase(() => {
        return query(collection(db, "users"), orderBy("tokenBalance", "desc"), limit(10));
    }, []);
    const { data: topWealthyUsers } = useCollection(topWealthQuery);

    const stats = useMemo(() => {
        if (!user) return { totalPoints: 0, redeemableTokens: 0, progress: 0, availablePoints: 0, stakingRewards: 0, income: 0, expense: 0, apr: 5, gcvUSD: 0, totalTokens: 0, wealthHistory: [], nextDividend: 0 };

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

        const totalTokens = (user.tokenBalance || 0) + (user.stakedBalance || 0) + rewards;
        const gcvUSD = totalTokens * GCV_VALUE;
        const nextDividend = totalTokens * 0.005;

        return { 
            totalPoints: total, availablePoints, redeemableTokens: redeemable, progress, 
            stakingRewards: rewards, apr, gcvUSD, totalTokens, nextDividend, 
            wealthHistory: wealthHistory.slice(-15) 
        };
    }, [user, logs, orders, isStaff, transactions]);

    const globalHubWealth = useMemo(() => {
        if (!topWealthyUsers) return 0;
        const sum = topWealthyUsers.reduce((acc, u) => acc + (u.tokenBalance || 0) + (u.stakedBalance || 0), 0);
        return sum * GCV_VALUE;
    }, [topWealthyUsers]);

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
            if (typeof pendingAction === 'function') pendingAction();
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

    const handleDownloadFortuneCert = async () => {
        if (!certRef.current) return;
        setIsGeneratingCert(true);
        try {
            const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true });
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`FORTUNE_DKS_${user?.name}.pdf`);
        } catch (e) { toast({ title: "Erreur PDF", variant: "destructive" }); } finally { setIsGeneratingCert(false); }
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

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard"><Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 p-0 transition-all"><ArrowLeft size={24} /></Button></Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Mon Wallet <span className="text-accent">Élite</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Gestionnaire d'actifs numériques & GCV Pi Terminal</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        {stats.gcvUSD >= 1000000 && (
                            <Button onClick={handleDownloadFortuneCert} disabled={isGeneratingCert} className="bg-yellow-500 text-black h-14 px-6 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-yellow-500/20">
                                {isGeneratingCert ? <Loader2 className="animate-spin" /> : <Medal size={20} />} Certificat Millionnaire
                            </Button>
                        )}
                        <Button onClick={() => setIsReceiveSheetOpen(true)} variant="outline" className="h-14 px-8 rounded-2xl border-white/10 font-black uppercase italic gap-3 hover:bg-white/5"><ArrowDownLeft size={20} /> Recevoir</Button>
                        <Button onClick={() => setIsTransferSheetOpen(true)} className="bg-accent text-black h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-accent/20"><Send size={20} /> Transférer</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                    <Card className="lg:col-span-8 bg-gradient-to-br from-yellow-500/20 via-background to-black border-yellow-500/20 rounded-[3.5rem] p-12 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 p-12 opacity-10 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-[3s]"><Gem size={300} className="text-yellow-500" /></div>
                        <div className="relative z-10 space-y-10">
                            <div className="flex flex-wrap items-center gap-4">
                                <Badge className="bg-yellow-500 text-black font-black uppercase italic text-[9px] px-4 py-1">Consensus GCV Activé</Badge>
                                <Badge variant="outline" className="border-white/10 text-white/40 uppercase font-black text-[9px] tracking-widest">1 π = $314,159.00</Badge>
                                {user?.isWalletLocked && <Badge className="bg-red-500 text-white border-none uppercase font-black text-[9px] px-3 animate-pulse">Wallet Verrouillé</Badge>}
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                                <div className="space-y-2">
                                    <h2 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter leading-none">
                                        {stats.totalTokens.toFixed(2)} <span className="text-2xl text-yellow-500 ml-2">DKST</span>
                                    </h2>
                                    <p className="text-lg font-bold text-white/40 uppercase tracking-widest">Actifs de l'Élite • Fortune Numérique</p>
                                </div>
                                <div className="bg-black/60 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-yellow-500/30 text-right min-w-[280px]">
                                    <p className="text-[10px] font-black uppercase text-yellow-500 mb-2 tracking-[0.4em]">Valeur Estimée (USD)</p>
                                    <p className="text-4xl font-black text-white italic tracking-tighter">${stats.gcvUSD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="lg:col-span-4 glossy-card border-none rounded-[3.5rem] p-10 flex flex-col justify-between overflow-hidden relative">
                         <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-accent text-black flex items-center justify-center shadow-lg"><ShieldCheck size={24} /></div>
                                <h4 className="text-xl font-black uppercase italic tracking-tight">Security Shield</h4>
                            </div>
                            <div className="grid grid-cols-1 gap-2 pt-4">
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                    <KeyRound size={14} className={user?.walletPin ? "text-green-400" : "text-white/20"} />
                                    <span className="text-[9px] font-bold uppercase">PIN de Signature</span>
                                    {user?.walletPin ? <CheckCircle2 size={12} className="ml-auto text-green-400" /> : <Link href="/dashboard/settings" className="ml-auto text-[8px] text-accent underline uppercase">Fixer</Link>}
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                    <HeartPulse size={14} className={user?.beneficiaryId ? "text-green-400" : "text-white/20"} />
                                    <span className="text-[9px] font-bold uppercase">Héritage Activé</span>
                                    {user?.beneficiaryId ? <CheckCircle2 size={12} className="ml-auto text-green-400" /> : <ShieldX size={12} className="ml-auto text-red-400" />}
                                </div>
                            </div>
                         </div>
                         <Button onClick={toggleEmergencyLock} disabled={isEmergencyLockProcessing} variant={user?.isWalletLocked ? "default" : "outline"} className={cn("w-full h-14 rounded-2xl font-black uppercase italic text-[10px] gap-3 mt-6", user?.isWalletLocked ? "bg-red-500" : "border-red-500/20 text-red-400 hover:bg-red-500")}>
                            {isEmergencyLockProcessing ? <Loader2 className="animate-spin" /> : user?.isWalletLocked ? <><Lock size={16} /> Déverrouiller</> : <><ShieldAlert size={16} /> Verrouillage d'Urgence</>}
                         </Button>
                    </Card>
                </div>

                <Tabs defaultValue="overview" className="space-y-10">
                    <TabsList className="bg-white/5 border border-white/5 p-1.5 rounded-[1.5rem] h-16 w-full max-w-2xl mx-auto flex">
                        <TabsTrigger value="overview" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">Portefeuille</TabsTrigger>
                        <TabsTrigger value="vault" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">DKS Vault</TabsTrigger>
                        <TabsTrigger value="simulator" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">Simulateur ROI</TabsTrigger>
                        <TabsTrigger value="heritage" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">Héritage</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                             <div className="lg:col-span-5 space-y-8">
                                <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-8">
                                    <div className="flex items-center gap-4"><Flame className="text-orange-500" size={24} /><h3 className="text-xl font-black uppercase italic tracking-tight">Convertir mes Points</h3></div>
                                    <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 space-y-6">
                                        <div className="flex justify-between items-end"><p className="text-[10px] font-black uppercase opacity-40">Points Accumulés</p><span className="text-xl font-black text-accent">{stats.availablePoints} PTS</span></div>
                                        <Progress value={stats.progress} className="h-3 bg-white/5" indicatorClassName="bg-accent" />
                                        <Button onClick={() => secureAction(mintTokens)} disabled={isMinting || stats.redeemableTokens < 1} className="w-full h-14 bg-accent text-black font-black uppercase italic rounded-xl gap-2 shadow-xl">
                                            {isMinting ? <Loader2 className="animate-spin" /> : <><RefreshCw size={18} /> Lancer le Minting</>}
                                        </Button>
                                    </div>
                                </Card>
                                <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20 rounded-[3rem] p-10 space-y-6">
                                    <div className="flex items-center gap-4"><Award className="text-primary" size={24} /><h3 className="text-xl font-black uppercase italic tracking-tight">Privilèges Elite</h3></div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {SHOP_PERKS.map(perk => (
                                            <button key={perk.id} onClick={() => secureAction(() => handleBuyPerk(perk))} className="flex items-center gap-5 p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-primary/50 transition-all text-left group">
                                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">{perk.icon}</div>
                                                <div className="flex-1"><p className="font-bold text-xs uppercase italic">{perk.title}</p><p className="text-[10px] text-white/40">{perk.description}</p></div>
                                                <Badge className="bg-primary/20 text-primary border-none font-black text-[10px]">{perk.cost} DKST</Badge>
                                            </button>
                                        ))}
                                    </div>
                                </Card>
                             </div>
                             <div className="lg:col-span-7">
                                <Card className="glossy-card border-none rounded-[3rem] p-10 h-full relative overflow-hidden">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-2xl font-black uppercase italic">Trajectoire de <span className="text-accent">Richesse</span></h3>
                                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><Activity size={24}/></div>
                                    </div>
                                    <div className="h-[400px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={stats.wealthHistory}>
                                                <defs><linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/></linearGradient></defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                                                <Area type="monotone" dataKey="wealth" stroke="hsl(var(--accent))" strokeWidth={3} fill="url(#colorWealth)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                             </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="vault" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-8">
                                <div className="flex items-center gap-4"><Vault className="text-primary" size={24} /><h3 className="text-xl font-black uppercase italic tracking-tight">DKS Staking Vault</h3></div>
                                <div className="space-y-6">
                                    <div className="p-6 bg-primary/10 border border-primary/20 rounded-3xl">
                                        <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black uppercase text-primary">Rendement Annuel (APR)</span><Badge className="bg-primary text-white font-black italic">{stats.apr}% APR</Badge></div>
                                        <p className="text-sm text-white/70 italic leading-relaxed">Bloquez vos DKST pour sécuriser le réseau du Hub et générer des intérêts en temps réel.</p>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Montant à Staker</Label>
                                        <Input type="number" placeholder="0.00" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-xl text-xl font-black text-white" />
                                    </div>
                                    <Button onClick={() => secureAction(handleStake)} disabled={isProcessingAction || !stakeAmount} className="w-full h-16 bg-primary text-white font-black uppercase italic rounded-2xl shadow-xl shadow-primary/20">Lancer le Contrat de Staking</Button>
                                </div>
                            </Card>
                            <Card className="bg-black/40 border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between">
                                <div className="space-y-8">
                                    <div className="flex justify-between items-start"><div><h3 className="text-xl font-black uppercase italic">Ma Position Vault</h3><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Actifs sous gestion</p></div><div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary"><Timer size={24}/></div></div>
                                    <div className="space-y-6">
                                        <div><p className="text-[9px] font-black uppercase text-white/40 mb-1">Capital Bloqué</p><p className="text-4xl font-black text-white italic">{user?.stakedBalance?.toFixed(2) || 0} <span className="text-sm not-italic opacity-40">DKST</span></p></div>
                                        <div><p className="text-[9px] font-black uppercase text-white/40 mb-1">Récompenses accumulées (Live)</p><p className="text-4xl font-black text-green-400 italic">+{stats.stakingRewards.toFixed(6)}</p></div>
                                    </div>
                                </div>
                                <Button onClick={() => secureAction(handleUnstake)} disabled={isProcessingAction || !user?.stakedBalance} variant="outline" className="w-full h-16 border-white/10 rounded-2xl font-black uppercase italic mt-10 hover:bg-white/5">Retirer Capital & Intérêts</Button>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="simulator" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <Card className="glossy-card border-none rounded-[3.5rem] p-12 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-12 opacity-5"><Calculator size={200} /></div>
                            <div className="relative z-10 space-y-10">
                                <div className="flex items-center gap-4"><Calculator className="text-accent" size={24}/><h3 className="text-xl font-black uppercase italic tracking-tight">Simulateur de <span className="text-accent">Prospérité</span></h3></div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                                    <div className="space-y-10">
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end"><Label className="text-[10px] font-black uppercase opacity-60">Capital à simuler (DKST)</Label><span className="text-2xl font-black text-accent">{simAmount[0]} DKST</span></div>
                                            <Slider value={simAmount} onValueChange={setSimAmount} max={10000} step={100} className="py-4" />
                                        </div>
                                        <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                                            <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-muted-foreground">Votre Taux APR Actuel</span><Badge className="bg-accent/20 text-accent font-black">{stats.apr}% / AN</Badge></div>
                                            <p className="text-[10px] text-white/40 italic">Note: Les membres Gold profitent de 12% APR contre 5% pour le grade Bronze.</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { label: "1 Mois", factor: 1/12 },
                                            { label: "6 Mois", factor: 6/12 },
                                            { label: "12 Mois", factor: 1 }
                                        ].map((period, i) => {
                                            const gain = simAmount[0] * (stats.apr/100) * period.factor;
                                            return (
                                                <div key={i} className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 text-center flex flex-col justify-center gap-2">
                                                    <p className="text-[10px] font-black uppercase text-white/40">{period.label}</p>
                                                    <p className="text-2xl font-black text-white">+{gain.toFixed(2)}</p>
                                                    <p className="text-[8px] font-bold text-accent uppercase tracking-widest">≈ ${(gain * GCV_VALUE).toLocaleString()}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="heritage" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            <Card className="lg:col-span-5 glossy-card border-none rounded-[3rem] p-10 space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><HeartPulse size={120} /></div>
                                <div className="relative z-10 space-y-8">
                                    <div className="flex items-center gap-4"><HeartPulse className="text-red-500" size={24} /><h3 className="text-xl font-black uppercase italic tracking-tight">Héritage Numérique</h3></div>
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Héritier (Membre DKS)</Label>
                                            <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} /><Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Nom ou Email..." className="h-14 pl-12 bg-background/50 border-white/5 rounded-2xl" /></div>
                                            {searchQuery.length >= 3 && (
                                                <div className="space-y-2 mt-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {isSearching ? <div className="p-4 text-center"><Loader2 className="animate-spin h-5 w-5 mx-auto" /></div> : searchResults.map(u => (
                                                        <button key={u.id} onClick={() => { setHeritageRecipient(u); setSearchQuery(""); }} className="flex items-center gap-4 p-3 w-full rounded-xl bg-white/5 border border-white/5 hover:bg-accent/5">
                                                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center font-black text-accent text-xs">{(u.name || u.displayName)?.substring(0, 1)}</div>
                                                            <p className="font-bold text-[10px] uppercase truncate">{u.name || u.displayName}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {heritageRecipient && (
                                            <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl flex justify-between items-center">
                                                <span className="text-xs font-black uppercase">{heritageRecipient.name || heritageRecipient.displayName}</span>
                                                <Button variant="ghost" size="icon" onClick={() => setHeritageRecipient(null)} className="h-6 w-6"><X size={14}/></Button>
                                            </div>
                                        )}
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Seuil d'Inactivité (Jours)</Label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {["30", "90", "180"].map(d => (
                                                    <button key={d} onClick={() => setHeritageThreshold(d)} className={cn("h-12 rounded-xl font-black uppercase text-[10px] border transition-all", heritageThreshold === d ? "bg-accent border-accent text-black" : "bg-white/5 border-white/5 text-white/40")}>{d} Jours</button>
                                                ))}
                                            </div>
                                        </div>
                                        <Button onClick={() => secureAction(handleSaveHeritage)} disabled={isProcessingAction || !heritageRecipient} className="w-full h-16 bg-white text-black font-black uppercase italic rounded-2xl">Sceller le Testament</Button>
                                    </div>
                                </div>
                            </Card>
                            <Card className="lg:col-span-7 bg-black/40 border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between overflow-hidden">
                                <div className="space-y-10 relative z-10">
                                    <div className="flex justify-between items-center"><h3 className="text-xl font-black uppercase italic">Dernière Pulsation</h3><Badge className="bg-green-500/10 text-green-400 border-none px-3 uppercase text-[8px] font-black">Live Monitor</Badge></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4">
                                            <p className="text-[10px] font-black uppercase text-white/40">Dernière Activité</p>
                                            <p className="text-3xl font-black text-white italic">{user?.lastActivityAt?.toDate ? format(user.lastActivityAt.toDate(), "dd MMM yyyy", { locale: fr }) : "Maintenant"}</p>
                                        </div>
                                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4">
                                            <p className="text-[10px] font-black uppercase text-white/40">Bénéficiaire Désigné</p>
                                            <p className="text-3xl font-black text-accent italic truncate">{user?.beneficiaryName || "NON DÉFINI"}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            {/* PIN VERIFICATION DIALOG */}
            <Dialog open={isPinVerificationOpen} onOpenChange={setIsPinVerificationOpen}>
                <DialogContent className="bg-card border-white/10 text-foreground rounded-[2.5rem] sm:max-w-md overflow-hidden">
                    <DialogHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-accent/20 flex items-center justify-center text-accent shadow-xl shadow-accent/10"><Lock size={40} className="animate-pulse" /></div>
                            <div className="text-center">
                                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Signature Élite</DialogTitle>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mt-1">Autorisation requise pour transaction</p>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="p-10 space-y-8">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-center block opacity-40">Entrez votre code secret à 4 chiffres</Label>
                            <div className="flex justify-center gap-4">
                                <div className="relative w-full max-w-[200px]">
                                    <Input type={showPin ? "text" : "password"} maxLength={4} value={enteredPin} onChange={(e) => setEnteredPin(e.target.value)} className="h-20 bg-background/50 border-white/10 rounded-2xl text-center text-5xl font-black tracking-[0.5em] focus:border-accent" autoFocus />
                                    <button onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-accent transition-colors">{showPin ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
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
                            
                            <Card className="bg-accent/5 border-accent/20 p-6 rounded-[2rem] space-y-3">
                                <div className="flex items-center gap-2 text-accent">
                                    <Info size={14} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Note de transfert</p>
                                </div>
                                <p className="text-[11px] text-white/60 italic leading-relaxed">
                                    Partagez cet ID ou ce code QR pour recevoir des jetons **DKST** d'un autre membre de l'élite. Les transactions sont instantanées et sans frais au sein du Hub.
                                </p>
                            </Card>
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

            {/* MODÈLE DE CERTIFICAT DE FORTUNE CACHÉ */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div ref={certRef} className="bg-white text-black p-0 w-[1123px] h-[794px] font-serif relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 border-[40px] border-double border-[#1e293b]" />
                    <div className="absolute inset-10 border-4 border-yellow-500/20" />
                    <div className="relative z-10 text-center w-full px-40 space-y-12">
                        <div className="flex flex-col items-center gap-6"><Logo size="lg" /><div className="space-y-1"><h2 className="text-sm font-bold tracking-[0.4em] uppercase text-yellow-600">Double King Foundation</h2><p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-40">Bunia, RDC</p></div></div>
                        <div className="space-y-4"><Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-black uppercase italic tracking-[0.3em] px-6 py-2">Millionnaire GCV Consensus</Badge><h1 className="text-6xl font-black uppercase italic tracking-tighter text-[#1e293b]">CERTIFICAT DE FORTUNE</h1></div>
                        <div className="space-y-8 py-10 bg-yellow-50/30 rounded-[3rem] border border-yellow-100"><h3 className="text-5xl font-black uppercase tracking-tight border-b-2 border-yellow-200 inline-block pb-2 px-14 italic">{user?.name}</h3><p className="text-lg font-medium text-gray-600 max-w-2xl mx-auto leading-relaxed italic px-10">Pour avoir atteint une valorisation théorique de :</p><h4 className="text-4xl font-black text-yellow-600 tracking-tighter">$ {stats.gcvUSD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} USD</h4></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(UniversalWalletPage);
