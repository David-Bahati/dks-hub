
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
    Check,
    ArrowDownRight,
    LayoutGrid,
    Repeat,
    IdCard,
    ArrowLeftRight
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const POINTS_PER_TOKEN = 100;
const GCV_VALUE = 314159; // Global Consensus Value in USD

const ASSETS = [
    { id: 'dkst', symbol: 'DKST', name: 'DKS Utility Token', icon: <Flame className="text-accent" />, color: 'bg-accent/20', price: 1.00 },
    { id: 'pi', symbol: 'PI', name: 'Pi Network (GCV)', icon: <Globe className="text-yellow-500" />, color: 'bg-yellow-500/20', price: GCV_VALUE },
    { id: 'usdt', symbol: 'USDT', name: 'Tether USD', icon: <CircleDollarSign className="text-green-500" />, color: 'bg-green-500/20', price: 1.00 },
    { id: 'lp', symbol: 'DKS-LP', name: 'Liquidity Provider', icon: <Activity className="text-purple-500" />, color: 'bg-purple-500/20', price: 15.50 }
];

function UniversalWalletPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    // States for Modals
    const [isTransferSheetOpen, setIsTransferSheetOpen] = useState(false);
    const [isReceiveSheetOpen, setIsReceiveSheetOpen] = useState(false);
    const [isSwapSheetOpen, setIsSwapSheetOpen] = useState(false);
    const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
    const [isPinVerificationOpen, setIsPinVerificationOpen] = useState(false);
    
    // Logic States
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [enteredPin, setEnteredPin] = useState("");
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [showPin, setShowPin] = useState(false);
    const [isEmergencyLockProcessing, setIsEmergencyLockProcessing] = useState(false);

    // Staking States
    const [stakeAmount, setStakeAmount] = useState("");

    // Transfer States
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
    const [selectedToken, setSelectedToken] = useState('dkst');
    const [transferAmount, setTransferAmount] = useState("");
    const [transferMemo, setTransferMemo] = useState("");
    const [hasCopiedId, setHasCopiedId] = useState(false);

    // Swap States
    const [swapFrom, setSwapFrom] = useState('dkst');
    const [swapTo, setSwapTo] = useState('usdt');
    const [swapAmount, setSwapAmount] = useState("");

    // Card/PDF Refs
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const certRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

    // Fetch transactions for ledger
    const txQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return query(collection(db, "tokenTransactions"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(50));
    }, [user?.uid]);
    const { data: transactions } = useCollection(txQuery);

    const stats = useMemo(() => {
        if (!user) return { stakingRewards: 0, apr: 5, totalWealthUSD: 0, wealthHistory: [], balances: {} };

        let apr = 5;
        if (user.loyaltyLevel === 'Gold') apr = 12;
        else if (user.loyaltyLevel === 'Silver') apr = 8;

        let rewards = 0;
        if (user.stakedBalance && user.stakingStartedAt) {
            const start = user.stakingStartedAt?.toDate ? user.stakingStartedAt.toDate() : new Date(user.stakingStartedAt);
            const hoursStaked = Math.max(0, (Date.now() - start.getTime()) / (1000 * 60 * 60));
            rewards = (user.stakedBalance * (apr / 100) * (hoursStaked / 8760));
        }

        const balances = {
            dkst: (user.tokenBalance || 0) + (user.stakedBalance || 0) + rewards,
            pi: user.piBalance || 0,
            usdt: user.usdtBalance || 0,
            lp: user.lpBalance || 0
        };

        const totalWealthUSD = 
            (balances.dkst * 1.0) + 
            (balances.pi * GCV_VALUE) + 
            (balances.usdt * 1.0) + 
            (balances.lp * 15.50);

        return { stakingRewards: rewards, apr, totalWealthUSD, balances };
    }, [user]);

    const secureAction = (action: () => void) => {
        if (user?.isWalletLocked) {
            toast({ title: "Wallet Verrouillé", description: "Déverrouillez votre wallet pour continuer.", variant: "destructive" });
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
            await addDoc(collection(db, "tokenTransactions"), { userId: user.uid, userName: user.name, type: 'staking', tokenType: 'DKST', tokenAmount: amount, createdAt: serverTimestamp() });
            toast({ title: "Staking Actif", description: `Vous générez maintenant ${stats.apr}% APR.` });
            setStakeAmount("");
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); } finally { setIsProcessingAction(false); }
    };

    const handleUnstake = async () => {
        if (!user || (user.stakedBalance || 0) <= 0) return;
        setIsProcessingAction(true);
        try {
            const rewards = stats.stakingRewards;
            const capital = user.stakedBalance || 0;
            const total = capital + rewards;

            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(total),
                stakedBalance: 0,
                stakingStartedAt: null,
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, "tokenTransactions"), { 
                userId: user.uid, 
                userName: user.name, 
                type: 'unstaking', 
                tokenType: 'DKST', 
                tokenAmount: total, 
                memo: `Retrait Staking (Capital: ${capital.toFixed(2)} + Récompenses: ${rewards.toFixed(4)})`,
                createdAt: serverTimestamp() 
            });

            toast({ title: "Capital & Intérêts Retirés", description: `${total.toFixed(4)} DKST ajoutés à votre solde.` });
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); } finally { setIsProcessingAction(false); }
    };

    const handleTransferProcess = async () => {
        if (!user || !selectedRecipient || !transferAmount) return;
        const amount = parseFloat(transferAmount);
        const balanceField = selectedToken === 'pi' ? 'piBalance' : selectedToken === 'usdt' ? 'usdtBalance' : selectedToken === 'lp' ? 'lpBalance' : 'tokenBalance';
        
        if (amount > (user[balanceField as keyof typeof user] || 0)) {
            toast({ title: "Solde insuffisant", variant: "destructive" });
            return;
        }

        setIsProcessingAction(true);
        try {
            const piTxId = `DKS-${selectedToken.toUpperCase()}-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

            await updateDoc(doc(db, "users", user.uid), { [balanceField]: increment(-amount), updatedAt: serverTimestamp() });
            await updateDoc(doc(db, "users", selectedRecipient.id), { [balanceField]: increment(amount), updatedAt: serverTimestamp() });

            const txBase = { tokenType: selectedToken.toUpperCase(), tokenAmount: amount, piTxId: piTxId, memo: transferMemo, createdAt: serverTimestamp() };
            await addDoc(collection(db, "tokenTransactions"), { ...txBase, userId: user.uid, userName: user.name, type: 'transfer', senderId: user.uid, senderName: user.name, direction: 'sent', recipientId: selectedRecipient.id, recipientName: selectedRecipient.name || selectedRecipient.displayName });
            await addDoc(collection(db, "tokenTransactions"), { ...txBase, userId: selectedRecipient.id, userName: selectedRecipient.name || selectedRecipient.displayName, type: 'transfer', direction: 'received', senderId: user.uid, senderName: user.name });

            toast({ title: "Transfert réussi", description: `${amount} ${selectedToken.toUpperCase()} envoyés.` });
            setIsTransferSheetOpen(false);
            setTransferAmount("");
            setSelectedRecipient(null);
        } catch (error) { toast({ title: "Erreur transfert", variant: "destructive" }); } finally { setIsProcessingAction(false); }
    };

    const handleSwapProcess = async () => {
        if (!user || !swapAmount) return;
        const amount = parseFloat(swapAmount);
        const fromField = swapFrom === 'pi' ? 'piBalance' : swapFrom === 'usdt' ? 'usdtBalance' : 'tokenBalance';
        const toField = swapTo === 'pi' ? 'piBalance' : swapTo === 'usdt' ? 'usdtBalance' : 'tokenBalance';

        if (amount > (user[fromField as keyof typeof user] || 0)) {
            toast({ title: "Solde insuffisant", variant: "destructive" });
            return;
        }

        setIsProcessingAction(true);
        try {
            // Simulation simple de prix
            const priceFrom = swapFrom === 'pi' ? GCV_VALUE : 1.0;
            const priceTo = swapTo === 'pi' ? GCV_VALUE : 1.0;
            const receivedAmount = (amount * priceFrom) / priceTo;

            await updateDoc(doc(db, "users", user.uid), {
                [fromField]: increment(-amount),
                [toField]: increment(receivedAmount),
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid, userName: user.name, type: 'swap',
                tokenAmount: amount, tokenType: swapFrom.toUpperCase(),
                memo: `Swap vers ${receivedAmount.toFixed(6)} ${swapTo.toUpperCase()}`,
                createdAt: serverTimestamp()
            });

            toast({ title: "Swap réussi !", description: `Vous avez reçu ${receivedAmount.toFixed(6)} ${swapTo.toUpperCase()}.` });
            setIsSwapSheetOpen(false);
            setSwapAmount("");
        } catch (e) { toast({ title: "Erreur Swap", variant: "destructive" }); } finally { setIsProcessingAction(false); }
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

    const handleDownloadMembershipCard = async () => {
        if (!cardRef.current) return;
        setIsGeneratingPDF(true);
        try {
            const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [100, 60] });
            pdf.addImage(imgData, 'PNG', 0, 0, 100, 60);
            pdf.save(`DKS_CARD_${user?.name?.replace(/\s+/g, '_')}.pdf`);
            toast({ title: "Carte de Membre générée !" });
        } catch (e) { toast({ title: "Erreur PDF", variant: "destructive" }); } finally { setIsGeneratingPDF(false); }
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
                        <Link href="/dashboard"><Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 p-0 transition-all hover:bg-accent/10 hover:text-accent"><ArrowLeft size={24} /></Button></Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Universal <span className="text-accent">Web3 Wallet</span></h1>
                            <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest mt-2 opacity-40">Gouvernance décentralisée & Consensus Pi GCV $314,159</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={() => setIsCardDialogOpen(true)} variant="outline" className="h-14 px-6 rounded-2xl border-white/10 font-black uppercase italic gap-3 hover:bg-white/5"><IdCard size={20} /> Ma Carte Elite</Button>
                        <Button onClick={() => setIsTransferSheetOpen(true)} className="bg-accent text-black h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-accent/20"><Send size={20} /> Transférer</Button>
                        <Button onClick={() => setIsSwapSheetOpen(true)} variant="outline" className="h-14 px-8 rounded-2xl border-white/10 font-black uppercase italic gap-3 hover:bg-white/5"><ArrowLeftRight size={20} /> Swap</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                    {/* PORTFOLIO OVERVIEW HERO */}
                    <Card className="lg:col-span-8 bg-gradient-to-br from-accent/20 via-background to-black border-accent/20 rounded-[3.5rem] p-12 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 p-12 opacity-10 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-[3s]"><Gem size={300} className="text-accent" /></div>
                        <div className="relative z-10 space-y-10">
                            <div className="flex flex-wrap items-center gap-4">
                                <Badge className="bg-accent text-black font-black uppercase italic text-[9px] px-4 py-1">Multi-Chain Hub Active</Badge>
                                <Badge variant="outline" className="border-white/10 text-white/40 uppercase font-black text-[9px] tracking-widest">Global GCV Index: $314,159</Badge>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase text-accent tracking-[0.4em]">Valeur Nette du Portfolio (USD)</p>
                                    <h2 className="text-6xl md:text-7xl font-black text-white italic tracking-tighter leading-none">
                                        ${stats.totalWealthUSD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                                    </h2>
                                    <p className="text-lg font-bold text-white/40 uppercase tracking-widest mt-4 flex items-center gap-2">
                                        <TrendingUp className="text-green-400" size={20} /> +{(Math.random() * 5).toFixed(1)}% (24h)
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button onClick={() => setIsSwapSheetOpen(true)} variant="outline" className="h-14 rounded-2xl border-white/10 bg-white/5 uppercase font-black italic text-[10px] gap-2"><Repeat size={14}/> Swap</Button>
                                    <Button variant="outline" className="h-14 rounded-2xl border-white/10 bg-white/5 uppercase font-black italic text-[10px] gap-2"><ArrowUpCircle size={14}/> Buy</Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* QUICK SECURITY STATUS */}
                    <Card className="lg:col-span-4 glossy-card border-none rounded-[3.5rem] p-10 flex flex-col justify-between">
                         <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-accent text-black flex items-center justify-center shadow-lg"><ShieldCheck size={24} /></div>
                                <h4 className="text-xl font-black uppercase italic tracking-tight text-white">Security Vault</h4>
                            </div>
                            <div className="space-y-3">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase opacity-40">Protection Phase</span>
                                    <Badge className={cn("border-none text-[8px] font-black uppercase", user?.isWalletLocked ? "bg-red-500" : "bg-green-500")}>
                                        {user?.isWalletLocked ? "Locked" : "Active"}
                                    </Badge>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase opacity-40">PIN Authentication</span>
                                    <Badge variant="outline" className="border-white/20 text-[8px] font-black uppercase">
                                        {user?.walletPin ? "Verified" : "Setup Required"}
                                    </Badge>
                                </div>
                            </div>
                         </div>
                         <Button onClick={toggleEmergencyLock} disabled={isEmergencyLockProcessing} className={cn("w-full h-14 rounded-2xl font-black uppercase italic text-[10px] gap-3 mt-8 shadow-xl transition-all", user?.isWalletLocked ? "bg-red-500 text-white" : "bg-white text-black hover:bg-red-500 hover:text-white")}>
                            {isEmergencyLockProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : user?.isWalletLocked ? <><Lock size={16}/> Unlock Vault</> : <><ShieldAlert size={16}/> Emergency Lock</>}
                         </Button>
                    </Card>
                </div>

                <Tabs defaultValue="assets" className="space-y-10">
                    <TabsList className="bg-white/5 border border-white/5 p-1.5 rounded-[2rem] h-16 w-full max-w-4xl mx-auto flex">
                        <TabsTrigger value="assets" className="flex-1 rounded-[1.5rem] font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">My Assets</TabsTrigger>
                        <TabsTrigger value="vault" className="flex-1 rounded-[1.5rem] font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">Staking Vault</TabsTrigger>
                        <TabsTrigger value="history" className="flex-1 rounded-[1.5rem] font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">Blockchain Ledger</TabsTrigger>
                        <TabsTrigger value="heritage" className="flex-1 rounded-[1.5rem] font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">Digital Heritage</TabsTrigger>
                    </TabsList>

                    <TabsContent value="assets" className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 gap-4">
                            {ASSETS.map((asset) => {
                                const balance = stats.balances[asset.id as keyof typeof stats.balances] || 0;
                                const valueUSD = balance * asset.price;
                                return (
                                    <Card key={asset.id} className="bg-white/[0.02] border-white/5 hover:bg-white/[0.05] transition-all rounded-[2rem] group cursor-pointer overflow-hidden relative">
                                        <CardContent className="p-6 flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-6">
                                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform", asset.color)}>
                                                    {asset.icon}
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black uppercase italic text-white">{asset.symbol}</h4>
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{asset.name}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-12">
                                                <div className="text-right hidden md:block">
                                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Index Price</p>
                                                    <p className="text-lg font-black text-white italic">${asset.price.toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-3xl font-black text-white italic">{balance.toFixed(asset.id === 'pi' ? 6 : 2)}</p>
                                                    <p className="text-[10px] font-bold text-accent uppercase">≈ ${valueUSD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</p>
                                                </div>
                                                <Button onClick={() => setIsSwapSheetOpen(true)} variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-white/10 hover:text-accent"><ArrowRight size={24}/></Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </TabsContent>

                    <TabsContent value="vault" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-8">
                                <div className="flex items-center gap-4"><Vault className="text-primary" size={24} /><h3 className="text-xl font-black uppercase italic tracking-tight text-white">DKS Staking Protocol</h3></div>
                                <div className="space-y-6">
                                    <div className="p-8 bg-primary/10 border border-primary/20 rounded-[2.5rem]">
                                        <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black uppercase text-primary tracking-widest">Yield APR</span><Badge className="bg-primary text-white font-black italic px-4 h-8">{stats.apr}% APR</Badge></div>
                                        <p className="text-sm text-white/70 italic leading-relaxed">Verrouillez vos DKST pour sécuriser le Hub et générer des intérêts composés en temps réel.</p>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Stake Amount (DKST)</Label>
                                        <div className="relative">
                                            <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40" size={20} />
                                            <Input type="number" placeholder="0.00" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} className="h-16 pl-12 bg-background/50 border-white/5 rounded-2xl text-2xl font-black text-white focus:border-primary" />
                                        </div>
                                    </div>
                                    <Button onClick={() => secureAction(handleStake)} disabled={isProcessingAction || !stakeAmount} className="w-full h-16 bg-primary text-white font-black uppercase italic rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">Lancer le Contrat Intelligent</Button>
                                </div>
                            </Card>
                            <Card className="bg-black/40 border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><Activity size={150} className="text-primary" /></div>
                                <div className="space-y-10 relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div><h3 className="text-xl font-black uppercase italic text-white">Staking Portfolio</h3><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Proof of Stake Hub</p></div>
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary shadow-lg"><Timer size={24}/></div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-8">
                                        <div><p className="text-[9px] font-black uppercase text-white/30 mb-2 tracking-[0.2em]">Capital Bloqué</p><p className="text-5xl font-black text-white italic tracking-tighter">{user?.stakedBalance?.toFixed(2) || 0} <span className="text-xs not-italic opacity-20 uppercase font-bold ml-1">DKST</span></p></div>
                                        <div>
                                            <p className="text-[9px] font-black uppercase text-green-400/30 mb-2 tracking-[0.2em]">Intérêts Générés (Unclaimed)</p>
                                            <div className="flex items-end gap-3">
                                                <p className="text-5xl font-black text-green-400 italic tracking-tighter">+{stats.stakingRewards.toFixed(6)}</p>
                                                <Badge variant="outline" className="mb-2 border-green-500/20 text-green-400 text-[8px] font-black uppercase animate-pulse">Live Tracking</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <Button onClick={() => secureAction(handleUnstake)} disabled={isProcessingAction || !user?.stakedBalance} variant="outline" className="w-full h-16 border-white/10 rounded-2xl font-black uppercase italic text-[10px] mt-10 hover:bg-white/5 transition-all">Clôturer et Retirer Capital + Rewards</Button>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4">
                        <Card className="glossy-card border-none rounded-[3rem] overflow-hidden">
                             <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            <th className="p-6">Hachage Transaction</th>
                                            <th className="p-6 text-center">Actif</th>
                                            <th className="p-6">Type</th>
                                            <th className="p-6">Mémo / Flux</th>
                                            <th className="p-6 text-right">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm">
                                        {transactions?.map((tx) => {
                                            const asset = ASSETS.find(a => a.symbol === tx.tokenType) || ASSETS[0];
                                            return (
                                                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                                                    <td className="p-6 font-mono text-[10px] text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity">
                                                        {tx.piTxId || tx.id.substring(0, 16).toUpperCase()}
                                                    </td>
                                                    <td className="p-6">
                                                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mx-auto shadow-md", asset.color)}>
                                                            {asset.icon}
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <Badge className={cn(
                                                            "border-none uppercase text-[8px] font-black px-2.5",
                                                            ['mining', 'dividend', 'unstaking'].includes(tx.type) ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                                                        )}>{tx.type}</Badge>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className="text-[10px] font-bold uppercase text-white/60 tracking-wider">
                                                            {tx.memo || (tx.direction === 'sent' ? `Envoi vers @${tx.recipientName}` : `Réception de @${tx.senderName}`)}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-right">
                                                        <span className={cn(
                                                            "text-lg font-black italic",
                                                            tx.direction === 'sent' || tx.type === 'staking' ? 'text-white' : 'text-green-400'
                                                        )}>
                                                            {tx.direction === 'sent' || tx.type === 'staking' ? '-' : '+'}{tx.tokenAmount.toFixed(4)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {!transactions?.length && (
                                <div className="py-32 text-center opacity-20 italic text-xs uppercase font-black tracking-[0.4em]">Registre Blockchain Vierge</div>
                            )}
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {/* SWAP SHEET */}
            <Sheet open={isSwapSheetOpen} onOpenChange={setIsSwapSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-10 bg-accent/10 border-b border-white/5">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-xl shadow-accent/10"><ArrowLeftRight size={32} /></div>
                            <div><SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">Insta-Swap</SheetTitle><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Liquidité instantanée Hub DKS</p></div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 p-10 space-y-10 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase opacity-40">Vendre</Label>
                                    <span className="text-[9px] font-bold text-accent uppercase">Solde: {stats.balances[swapFrom as keyof typeof stats.balances]?.toFixed(4)}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Select value={swapFrom} onValueChange={setSwapFrom}>
                                        <SelectTrigger className="w-[120px] h-12 bg-black/40 border-none rounded-xl font-black uppercase text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-white/10">
                                            <SelectItem value="dkst">DKST</SelectItem>
                                            <SelectItem value="pi">PI</SelectItem>
                                            <SelectItem value="usdt">USDT</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input type="number" placeholder="0.00" value={swapAmount} onChange={(e) => setSwapAmount(e.target.value)} className="flex-1 h-12 bg-transparent border-none text-2xl font-black text-white p-0 text-right focus-visible:ring-0" />
                                </div>
                            </div>

                            <div className="flex justify-center -my-6 relative z-10">
                                <Button size="icon" variant="outline" className="h-10 w-10 rounded-full bg-background border-white/10 text-accent hover:rotate-180 transition-transform duration-500 shadow-xl" onClick={() => { const tmp = swapFrom; setSwapFrom(swapTo); setSwapTo(tmp); }}>
                                    <ArrowDownCircle size={20} />
                                </Button>
                            </div>

                            <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase opacity-40">Recevoir (Estimation)</Label>
                                    <span className="text-[9px] font-bold text-accent uppercase">Index GCV Actif</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Select value={swapTo} onValueChange={setSwapTo}>
                                        <SelectTrigger className="w-[120px] h-12 bg-black/40 border-none rounded-xl font-black uppercase text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-white/10">
                                            <SelectItem value="dkst">DKST</SelectItem>
                                            <SelectItem value="pi">PI</SelectItem>
                                            <SelectItem value="usdt">USDT</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="flex-1 text-2xl font-black text-accent text-right">
                                        {swapAmount ? ((parseFloat(swapAmount) * (swapFrom === 'pi' ? GCV_VALUE : 1)) / (swapTo === 'pi' ? GCV_VALUE : 1)).toFixed(6) : "0.00"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-accent/5 rounded-2xl border border-accent/20 space-y-3">
                            <div className="flex justify-between text-[9px] font-black uppercase opacity-60"><span>Frais de réseau Hub</span><span>0.00 %</span></div>
                            <div className="flex justify-between text-[9px] font-black uppercase text-accent"><span>Impact Prix</span><span>&lt; 0.01%</span></div>
                        </div>

                        <Button onClick={() => secureAction(handleSwapProcess)} disabled={isProcessingAction || !swapAmount} className="w-full h-20 bg-accent text-black font-black uppercase italic rounded-[2rem] shadow-2xl text-xl gap-4">
                            {isProcessingAction ? <Loader2 className="animate-spin" /> : <><Repeat size={24} /> Swap instantané</>}
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* MEMBERSHIP CARD DIALOG */}
            <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
                <DialogContent className="bg-card border-white/10 text-white rounded-[3rem] sm:max-w-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Ma Carte <span className="text-accent">Elite DKS</span></DialogTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mt-1">Identité numérique et accès privilège au Hub</p>
                    </DialogHeader>
                    
                    <div className="p-12 flex flex-col items-center justify-center gap-12 bg-black/40">
                        {/* DIGITAL CARD DESIGN */}
                        <div ref={cardRef} className="w-[450px] h-[260px] bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-black rounded-3xl p-8 relative overflow-hidden shadow-2xl font-sans border-2 border-white/10 group">
                            <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/tech/800/600')] opacity-5 mix-blend-overlay" />
                            <div className="absolute -top-12 -right-12 w-48 h-48 bg-accent/10 rounded-full blur-[80px]" />
                            
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <Logo size="sm" showText />
                                        <Badge className="bg-accent/20 text-accent border-none text-[7px] font-black uppercase tracking-[0.4em] px-2 py-0.5">Elite Member</Badge>
                                    </div>
                                    <div className="w-16 h-16 bg-white p-1 rounded-xl shadow-lg"><QrCode size={54} className="text-black" /></div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Titulaire du compte</p>
                                        <h3 className="text-2xl font-black uppercase italic tracking-tight text-white leading-none truncate">{user?.name}</h3>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Membre ID</p>
                                            <p className="text-xs font-mono font-bold text-accent">DKS-{user?.uid?.substring(0, 12).toUpperCase()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Grade</p>
                                            <p className="text-sm font-black uppercase italic text-white">{user?.loyaltyLevel?.toUpperCase() || 'BRONZE'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* CACHET SÉCURITÉ FILIGRANE */}
                            <div className="absolute bottom-6 right-6 opacity-5 rotate-[-15deg] group-hover:rotate-0 transition-transform duration-700 pointer-events-none">
                                <div className="w-20 h-20 rounded-full border-4 border-double border-white flex items-center justify-center"><ShieldCheck size={40} className="text-white"/></div>
                            </div>
                        </div>

                        <div className="w-full flex gap-4">
                            <Button 
                                onClick={handleDownloadMembershipCard} 
                                disabled={isGeneratingPDF}
                                className="flex-1 h-16 bg-accent text-black font-black uppercase italic rounded-2xl gap-3 shadow-xl shadow-accent/20 text-sm"
                            >
                                {isGeneratingPDF ? <Loader2 className="animate-spin" /> : <><Download size={20} /> Télécharger ma carte PDF</>}
                            </Button>
                            <Button variant="outline" onClick={() => setIsCardDialogOpen(false)} className="h-16 rounded-2xl border-white/10 px-8 font-black uppercase italic text-xs">Fermer</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

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
                                    <Input type={showPin ? "text" : "password"} maxLength={4} value={enteredPin} onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))} className="h-20 bg-background/50 border-white/10 rounded-2xl text-center text-5xl font-black tracking-[0.5em] focus:border-accent" autoFocus />
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
                                    <Button onClick={() => { navigator.clipboard.writeText(user?.uid || ""); setHasCopiedId(true); setTimeout(() => setHasCopiedId(false), 2000); }} variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0 transition-all">
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
                                    Partagez cet ID ou ce code QR pour recevoir des jetons de l'écosystème. Les transactions sont instantanées au sein du Hub.
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
                            <div><SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">Envoyer</SheetTitle><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Transfert Multi-Actifs</p></div>
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
                                    <button onClick={() => setSelectedRecipient(null)} className="text-white/20 hover:text-white"><X size={20}/></button>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Choisir l'actif</Label>
                                        <Select value={selectedToken} onValueChange={setSelectedToken}>
                                            <SelectTrigger className="h-14 bg-background/50 border-white/10 rounded-2xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-white/10">
                                                {ASSETS.map(a => (
                                                    <SelectItem key={a.id} value={a.id} className="font-bold uppercase text-[10px]">
                                                        <div className="flex items-center gap-2">{a.symbol} ({stats.balances[a.id as keyof typeof stats.balances]?.toFixed(2)})</div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Montant</Label>
                                        <div className="relative"><Coins className="absolute left-6 top-1/2 -translate-y-1/2 text-accent" size={24} /><Input type="number" step="0.0001" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="h-20 pl-16 bg-background/50 border-white/10 rounded-[2rem] text-4xl font-black text-accent" required /></div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Mémo</Label>
                                        <Input value={transferMemo} onChange={(e) => setTransferMemo(e.target.value)} placeholder="Objet du transfert..." className="h-14 bg-background/50 border-white/10 rounded-2xl italic text-sm" />
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

