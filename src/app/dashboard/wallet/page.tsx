
"use client";

import { useMemo, useState, useEffect, useRef } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Coins, 
    ArrowLeft, 
    ArrowRight,
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
    Award,
    Star,
    Crown,
    Gift,
    Smartphone,
    Info,
    Search,
    User,
    CheckCircle2,
    X,
    ArrowUp,
    ArrowDown,
    ArrowUpRight,
    ArrowDownLeft,
    ShoppingBag,
    Timer,
    DollarSign,
    ArrowLeftRight,
    Activity,
    Download,
    Medal,
    Banknote,
    ShieldAlert,
    KeyRound,
    Eye,
    EyeOff,
    Fingerprint,
    HeartPulse,
    UserCheck,
    Scale,
    Copy,
    Check,
    Repeat,
    IdCard,
    PieChart as LucidePieChart,
    Gem,
    Flame
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, updateDoc, doc, addDoc, serverTimestamp, increment, limit, getDocs } from 'firebase/firestore';
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
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell
} from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';
import { differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GCV_VALUE = 314159; 

const WEALTH_CHART_DATA = [
    { name: 'Jan', value: 1200 },
    { name: 'Fév', value: 1800 },
    { name: 'Mar', value: 3200 },
    { name: 'Avr', value: 2800 },
    { name: 'Mai', value: 4500 },
    { name: 'Juin', value: 6800 },
    { name: 'Juil', value: 8500 },
];

function UniversalWalletPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
      setIsMounted(true);
    }, []);

    const [isTransferSheetOpen, setIsTransferSheetOpen] = useState(false);
    const [isReceiveSheetOpen, setIsReceiveSheetOpen] = useState(false);
    const [isSwapSheetOpen, setIsSwapSheetOpen] = useState(false);
    const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
    const [isPinVerificationOpen, setIsPinVerificationOpen] = useState(false);
    
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [enteredPin, setEnteredPin] = useState("");
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
    const [showPin, setShowPin] = useState(false);
    const [isEmergencyLockProcessing, setIsEmergencyLockProcessing] = useState(false);
    const [isHeartbeatProcessing, setIsHeartbeatProcessing] = useState(false);

    const [stakeAmount, setStakeAmount] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
    const [selectedToken, setSelectedToken] = useState('dkst');
    const [transferAmount, setTransferAmount] = useState("");
    const [transferMemo, setTransferMemo] = useState("");
    const [hasCopiedId, setHasCopiedId] = useState(false);

    const [swapFrom, setSwapFrom] = useState('dkst');
    const [swapTo, setSwapTo] = useState('usdt');
    const [swapAmount, setSwapAmount] = useState("");

    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const txQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return query(collection(db, "tokenTransactions"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(50));
    }, [user?.uid]);
    const { data: transactions } = useCollection(txQuery);

    const ASSETS = useMemo(() => [
        { id: 'dkst', symbol: 'DKST', name: 'DKS Utility Token', icon: <Flame className="text-accent" />, color: 'bg-accent/20', price: 1.00 },
        { id: 'pi', symbol: 'PI', name: 'Pi Network (GCV)', icon: <Globe className="text-yellow-500" />, color: 'bg-yellow-500/20', price: GCV_VALUE },
        { id: 'usdt', symbol: 'USDT', name: 'Tether USD', icon: <DollarSign className="text-green-500" />, color: 'bg-green-500/20', price: 1.00 },
        { id: 'lp', symbol: 'DKS-LP', name: 'Liquidity Provider', icon: <Activity className="text-purple-500" />, color: 'bg-purple-500/20', price: 15.50 }
    ], []);

    const stats = useMemo(() => {
        if (!user || !isMounted) return { stakingRewards: 0, apr: 5, totalWealthUSD: 0, balances: { dkst: 0, pi: 0, usdt: 0, lp: 0 }, pieData: [], daysInactive: 0 };

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

        const pieData = [
            { name: 'DKST', value: balances.dkst * 1.0, fill: '#0ea5e9' },
            { name: 'PI', value: balances.pi * GCV_VALUE, fill: '#eab308' },
            { name: 'USDT', value: balances.usdt * 1.0, fill: '#22c55e' },
            { name: 'LP', value: balances.lp * 15.50, fill: '#a855f7' }
        ].filter(d => d.value > 0);

        const lastActive = user.lastActivityAt?.toDate ? user.lastActivityAt.toDate() : new Date(user.lastActivityAt || user.createdAt);
        const daysInactive = differenceInDays(new Date(), lastActive);

        return { stakingRewards: rewards, apr, totalWealthUSD, balances, pieData, daysInactive };
    }, [user, isMounted]);

    const secureAction = (action: () => void) => {
        if (user?.isWalletLocked) {
            toast({ title: "Wallet Verrouillé", description: "Déverrouillez votre vault pour continuer.", variant: "destructive" });
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

    const sendHeartbeat = async () => {
        if (!user) return;
        setIsHeartbeatProcessing(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                lastActivityAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            toast({ title: "Pulsation Détectée", description: "Votre présence a été notariée sur la blockchain." });
        } catch (e) {
            toast({ title: "Erreur Heartbeat", variant: "destructive" });
        } finally {
            setIsHeartbeatProcessing(false);
        }
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

    if (!isMounted) return null;

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard"><Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 p-0 transition-all hover:bg-accent/10 hover:text-accent"><ArrowLeft size={24} /></Button></Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Universal <span className="text-accent">Web3 Wallet</span></h1>
                            <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest mt-2 opacity-40">Gouvernance décentralisée • Consensus Pi GCV $314,159</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button onClick={() => setIsCardDialogOpen(true)} variant="outline" className="h-14 px-6 rounded-2xl border-white/10 font-black uppercase italic gap-3 hover:bg-white/5 shadow-xl"><IdCard size={20} /> Ma Carte Elite</Button>
                        <Button onClick={() => setIsReceiveSheetOpen(true)} variant="outline" className="h-14 px-6 rounded-2xl border-white/10 font-black uppercase italic gap-3 hover:bg-white/5 shadow-xl"><ArrowDownLeft size={20} /> Recevoir</Button>
                        <Button onClick={() => setIsTransferSheetOpen(true)} className="bg-accent text-black h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-accent/20"><Send size={20} /> Transférer</Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
                    <Card className="lg:col-span-8 bg-gradient-to-br from-accent/20 via-background to-black border-accent/20 rounded-[3.5rem] p-12 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12"><Gem size={300} className="text-accent" /></div>
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-10">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase text-accent tracking-[0.4em]">Valeur Nette du Portfolio (USD)</p>
                                    <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-none">
                                        ${stats.totalWealthUSD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                                    </h2>
                                    <p className="text-lg font-bold text-green-400 uppercase tracking-widest mt-4 flex items-center gap-2">
                                        <TrendingUp size={20} /> +{(Math.random() * 5).toFixed(1)}% (24h)
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <Button onClick={() => setIsSwapSheetOpen(true)} className="h-14 px-8 rounded-2xl bg-white text-black font-black uppercase italic text-[10px] gap-2 shadow-xl hover:scale-105 transition-all"><ArrowLeftRight size={14}/> Swap instantané</Button>
                                </div>
                            </div>
                            <div className="h-[240px] w-full hidden md:block">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={WEALTH_CHART_DATA}>
                                        <Area type="monotone" dataKey="value" stroke="hsl(var(--accent))" fillOpacity={1} fill="transparent" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Card>

                    <Card className="lg:col-span-4 bg-primary/10 border-primary/20 rounded-[3.5rem] p-10 flex flex-col justify-between relative overflow-hidden group shadow-2xl">
                         <div className="absolute top-0 right-0 p-6 opacity-5"><Award size={120} className="text-primary" /></div>
                         <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                                    {user?.loyaltyLevel === 'Gold' ? <Crown size={24} /> : user?.loyaltyLevel === 'Silver' ? <Star size={24} /> : <Medal size={24} />}
                                </div>
                                <h4 className="text-xl font-black uppercase italic tracking-tight text-white">Reward Center</h4>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <p className="text-[10px] font-black uppercase text-white/40">Ambassadeur {user?.loyaltyLevel || 'Bronze'}</p>
                                        <span className="text-xs font-black text-primary italic">{user?.points || 0} PTS</span>
                                    </div>
                                    <Progress value={Math.min(100, ((user?.points || 0) / 1000) * 100)} className="h-2 bg-white/5" />
                                </div>
                            </div>
                         </div>
                         <Link href="/dashboard/referrals" className="mt-8">
                            <Button variant="outline" className="w-full h-14 rounded-2xl border-primary/20 text-primary font-black uppercase italic text-[9px] gap-2 hover:bg-primary hover:text-white transition-all">Inviter des membres <ArrowRight size={14}/></Button>
                         </Link>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-10">
                        <Tabs defaultValue="assets" className="space-y-10">
                            <TabsList className="bg-white/5 border border-white/5 p-1.5 rounded-[2rem] h-16 w-full flex">
                                <TabsTrigger value="assets" className="flex-1 rounded-[1.5rem] font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">Tous les actifs</TabsTrigger>
                                <TabsTrigger value="analytics" className="flex-1 rounded-[1.5rem] font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">Analytique Hub</TabsTrigger>
                                <TabsTrigger value="history" className="flex-1 rounded-[1.5rem] font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">Grand Livre</TabsTrigger>
                            </TabsList>

                            <TabsContent value="assets" className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                {ASSETS.map((asset) => {
                                    const balance = stats.balances[asset.id as keyof typeof stats.balances] || 0;
                                    const valueUSD = balance * asset.price;
                                    return (
                                        <Card key={asset.id} className="bg-white/[0.02] border-white/5 hover:bg-white/[0.05] transition-all rounded-3xl group overflow-hidden relative shadow-lg">
                                            <CardContent className="p-6 flex items-center justify-between relative z-10">
                                                <div className="flex items-center gap-6">
                                                    <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform", asset.color)}>
                                                        {asset.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xl font-black uppercase italic text-white leading-tight">{asset.symbol}</h4>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{asset.name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-12">
                                                    <div className="text-right">
                                                        <p className="text-3xl font-black text-white italic">{balance.toFixed(asset.id === 'pi' ? 6 : 2)}</p>
                                                        <p className="text-[10px] font-bold text-accent uppercase">≈ ${valueUSD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </TabsContent>

                            <TabsContent value="analytics" className="animate-in fade-in slide-in-from-bottom-4">
                                <Card className="bg-white/[0.02] border-white/5 p-10 rounded-[3rem] flex flex-col items-center">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-8 w-full flex items-center gap-2"><LucidePieChart size={14} className="text-accent" /> Répartition par Valeur</h4>
                                    <div className="h-[250px] w-full relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartsPieChart>
                                                <Pie data={stats.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                                    {stats.pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                                                    ))}
                                                </Pie>
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4">
                                <Card className="bg-white/[0.02] border-white/5 rounded-[3rem] overflow-hidden">
                                     <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                    <th className="p-6">Tx Hash</th>
                                                    <th className="p-6">Flux</th>
                                                    <th className="p-6 text-right">Montant</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-sm">
                                                {transactions?.map((tx) => (
                                                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                                                        <td className="p-6 font-mono text-[9px] text-muted-foreground">{tx.piTxId || tx.id.substring(0, 16).toUpperCase()}</td>
                                                        <td className="p-6"><Badge className="border-none uppercase text-[8px] font-black px-2.5 bg-blue-500/10 text-blue-400">{tx.type}</Badge></td>
                                                        <td className="p-6 text-right font-black italic">{tx.tokenAmount.toFixed(4)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="lg:col-span-4 space-y-10">
                        <Card className="bg-gradient-to-br from-red-500/20 to-background border-red-500/20 rounded-[3.5rem] p-10 space-y-8 relative overflow-hidden group shadow-2xl">
                             <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20"><Scale size={24} /></div>
                                    <h4 className="text-xl font-black uppercase italic tracking-tight text-white">Digital Heritage</h4>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-6 bg-black/40 rounded-[2rem] border border-white/5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-white/40">Inactivité</span>
                                            <span className="text-xs font-black text-white italic">{stats.daysInactive} Jours</span>
                                        </div>
                                        <Progress value={(stats.daysInactive / (user?.heritageThresholdDays || 90)) * 100} className="h-1.5 bg-white/5" />
                                    </div>
                                    <Button onClick={sendHeartbeat} disabled={isHeartbeatProcessing} className="w-full h-14 bg-red-500 text-white font-black uppercase italic rounded-2xl gap-3 shadow-xl"><HeartPulse size={18} /> Heartbeat</Button>
                                </div>
                             </div>
                        </Card>

                        <Card className="glossy-card border-none rounded-[3.5rem] p-10 flex flex-col justify-between shadow-2xl">
                             <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-accent text-black flex items-center justify-center shadow-lg"><ShieldCheck size={24} /></div>
                                    <h4 className="text-xl font-black uppercase italic tracking-tight text-white">Security Vault</h4>
                                </div>
                                <div className="space-y-3">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase opacity-40">Status</span>
                                        <Badge className={cn("border-none text-[8px] font-black uppercase px-3", user?.isWalletLocked ? "bg-red-500" : "bg-green-500")}>
                                            {user?.isWalletLocked ? "LOCKED" : "ACTIVE"}
                                        </Badge>
                                    </div>
                                </div>
                             </div>
                             <Button onClick={toggleEmergencyLock} disabled={isEmergencyLockProcessing} className={cn("w-full h-14 rounded-2xl font-black uppercase italic text-[10px] gap-3 mt-10 shadow-xl", user?.isWalletLocked ? "bg-red-500 text-white" : "bg-white text-black hover:bg-red-500 hover:text-white")}>
                                {isEmergencyLockProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : user?.isWalletLocked ? <><Lock size={16}/> Unlock</> : <><ShieldAlert size={16}/> Emergency Lock</>}
                             </Button>
                        </Card>
                    </div>
                </div>
            </main>

            <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
                <DialogContent className="bg-card border-white/10 text-white rounded-[3rem] sm:max-w-2xl p-0 overflow-hidden">
                    <div ref={cardRef} className="w-[450px] h-[260px] bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-black rounded-3xl p-8 relative overflow-hidden shadow-2xl font-sans border-2 border-white/10">
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start"><Logo size="sm" showText /> <QrCode size={54} className="text-white" /></div>
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black uppercase italic tracking-tight text-white leading-none truncate">{user?.name}</h3>
                                <p className="text-xs font-mono font-bold text-accent">DKS-{user?.uid?.substring(0, 12).toUpperCase()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 flex gap-4 bg-black/40"><Button onClick={handleDownloadMembershipCard} className="flex-1 h-14 bg-accent text-black font-black">Télécharger PDF</Button></div>
                </DialogContent>
            </Dialog>

            <Dialog open={isPinVerificationOpen} onOpenChange={setIsPinVerificationOpen}>
                <DialogContent className="bg-card border-white/10 text-foreground rounded-[2.5rem] sm:max-w-md">
                    <div className="p-10 space-y-8 text-center">
                        <DialogTitle className="text-2xl font-black uppercase italic">Signature PIN</DialogTitle>
                        <div className="relative w-full max-w-[200px] mx-auto">
                            <Input type={showPin ? "text" : "password"} maxLength={4} value={enteredPin} onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))} className="h-20 text-center text-5xl font-black tracking-[0.5em]" autoFocus />
                            <button onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20">{showPin ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
                        </div>
                        <Button onClick={handleVerifyPin} className="w-full h-14 bg-accent text-black font-black uppercase">Valider</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Sheet open={isSwapSheetOpen} onOpenChange={setIsSwapSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <div className="flex-1 p-10 space-y-10 overflow-y-auto">
                        <SheetTitle className="text-3xl font-black uppercase italic">Insta-Swap</SheetTitle>
                        <div className="space-y-6">
                            <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4">
                                <Select value={swapFrom} onValueChange={setSwapFrom}>
                                    <SelectTrigger className="w-full h-12 bg-black/40 border-none rounded-xl font-black uppercase"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-card border-white/10"><SelectItem value="dkst">DKST</SelectItem><SelectItem value="pi">PI</SelectItem><SelectItem value="usdt">USDT</SelectItem></SelectContent>
                                </Select>
                                <Input type="number" placeholder="0.00" value={swapAmount} onChange={(e) => setSwapAmount(e.target.value)} className="h-12 bg-transparent border-none text-2xl font-black text-white text-right" />
                            </div>
                            <div className="flex justify-center -my-6 relative z-10"><Button size="icon" variant="outline" className="h-10 w-10 rounded-full bg-background border-white/10 text-accent hover:rotate-180 transition-transform duration-500 shadow-xl" onClick={() => { const tmp = swapFrom; setSwapFrom(swapTo); setSwapTo(tmp); }}><ArrowDown size={20} /></Button></div>
                            <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4">
                                <Select value={swapTo} onValueChange={setSwapTo}>
                                    <SelectTrigger className="w-full h-12 bg-black/40 border-none rounded-xl font-black uppercase"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-card border-white/10"><SelectItem value="dkst">DKST</SelectItem><SelectItem value="pi">PI</SelectItem><SelectItem value="usdt">USDT</SelectItem></SelectContent>
                                </Select>
                                <div className="h-12 flex items-center justify-end text-2xl font-black text-accent">{swapAmount ? ((parseFloat(swapAmount) * (swapFrom === 'pi' ? GCV_VALUE : 1)) / (swapTo === 'pi' ? GCV_VALUE : 1)).toFixed(6) : "0.00"}</div>
                            </div>
                        </div>
                        <Button onClick={() => secureAction(handleSwapProcess)} disabled={isProcessingAction || !swapAmount} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl">Swap instantané</Button>
                    </div>
                </SheetContent>
            </Sheet>

            <Sheet open={isReceiveSheetOpen} onOpenChange={setIsReceiveSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <div className="flex-1 p-10 flex flex-col items-center justify-center gap-10">
                        <SheetTitle className="text-3xl font-black uppercase italic">Recevoir</SheetTitle>
                        <div className="bg-white p-8 rounded-[3rem] shadow-2xl"><QrCode size={200} className="text-black" /></div>
                        <div className="w-full space-y-6">
                            <Label className="text-[10px] font-black uppercase opacity-40 ml-1">Mon ID Unique</Label>
                            <div className="flex gap-2">
                                <Input readOnly value={user?.uid || ""} className="h-14 bg-white/5 border-white/10 rounded-2xl text-[10px] text-accent text-center" />
                                <Button onClick={() => { navigator.clipboard.writeText(user?.uid || ""); setHasCopiedId(true); setTimeout(() => setHasCopiedId(false), 2000); }} variant="outline" className="h-14 w-14 rounded-2xl border-white/10">{hasCopiedId ? <Check size={20}/> : <Copy size={20}/>}</Button>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <Sheet open={isTransferSheetOpen} onOpenChange={setIsTransferSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <div className="flex-1 p-10 space-y-10 overflow-y-auto">
                        <SheetTitle className="text-3xl font-black uppercase italic">Envoyer</SheetTitle>
                        {!selectedRecipient ? (
                            <div className="space-y-6">
                                <div className="relative"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Chercher un membre..." className="h-16 pl-14 bg-background/50 border-white/10 rounded-2xl focus:border-accent" /></div>
                                {searchQuery.length >= 3 && (
                                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                                        {isSearching ? <Loader2 className="animate-spin text-accent mx-auto h-8 w-8" /> : searchResults.map((u) => (
                                            <button key={u.id} onClick={() => { setSelectedRecipient(u); setSearchQuery(""); }} className="flex items-center gap-4 p-5 w-full rounded-2xl bg-white/5 border border-white/5 hover:bg-accent/5 transition-all text-left">
                                                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center font-black text-accent text-lg italic">{(u.name || u.displayName)?.substring(0, 1)}</div>
                                                <div className="flex-1 overflow-hidden"><p className="font-black text-sm uppercase italic truncate">{u.name || u.displayName}</p><p className="text-[10px] opacity-40 truncate">{u.email}</p></div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-10">
                                <div className="p-6 bg-accent/5 border border-accent/20 rounded-[2.5rem] flex items-center justify-between"><p className="text-lg font-black uppercase italic text-white">{selectedRecipient.name || selectedRecipient.displayName}</p><button onClick={() => setSelectedRecipient(null)} className="text-white/20"><X size={20}/></button></div>
                                <div className="space-y-8">
                                    <Select value={selectedToken} onValueChange={setSelectedToken}>
                                        <SelectTrigger className="h-14 bg-background/50 border-white/10 rounded-2xl"><SelectValue /></SelectTrigger>
                                        <SelectContent className="bg-card border-white/10">{ASSETS.map(a => (<SelectItem key={a.id} value={a.id} className="font-bold uppercase text-[10px]">{a.symbol} ({stats.balances[a.id as keyof typeof stats.balances]?.toFixed(2)})</SelectItem>))}</SelectContent>
                                    </Select>
                                    <Input type="number" step="0.0001" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="0.00" className="h-20 bg-background/50 border-white/10 rounded-[2rem] text-4xl font-black text-accent text-center" />
                                    <Input value={transferMemo} onChange={(e) => setTransferMemo(e.target.value)} placeholder="Mémo..." className="h-14 bg-background/50 border-white/10 rounded-2xl italic text-sm" />
                                </div>
                                <Button onClick={() => secureAction(handleTransferProcess)} disabled={isProcessingAction || !transferAmount} className="w-full h-20 bg-accent text-black font-black uppercase italic rounded-[2rem] text-xl">Valider le Transfert</Button>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default withAuth(UniversalWalletPage);
