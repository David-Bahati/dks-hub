
"use client";

import { useMemo, useState, useEffect } from 'react';
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
    Activity
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, updateDoc, doc, addDoc, serverTimestamp, increment, limit, getDocs, Timestamp } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authenticateWithPi } from '@/lib/pi-payment';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';

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
    const [isProcessingAction, setIsProcessingAction] = useState(false);
    const [tempPiAddress, setTempPiAddress] = useState("");
    
    // UI States
    const [ledgerFilter, setLedgerFilter] = useState("all");
    const [ledgerSearch, setLedgerSearch] = useState("");

    // Staking States
    const [stakeAmount, setStakeAmount] = useState("");

    // Transfer States
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
    const [transferAmount, setTransferAmount] = useState("");
    const [transferMemo, setTransferMemo] = useState("");

    const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

    // Fetch User Logs (Staff points)
    const logsQuery = useMemoFirebase(() => {
        if (!user?.uid || !isStaff) return null;
        return query(collection(db, "technicianLogs"), where("userId", "==", user.uid));
    }, [user?.uid, isStaff]);
    const { data: logs } = useCollection(logsQuery);

    // Fetch Orders (Customer loyalty points)
    const ordersQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return query(collection(db, "orders"), where("userId", "==", user.uid), where("status", "in", ["payée", "payé", "completed", "terminé"]));
    }, [user?.uid]);
    const { data: orders } = useCollection(ordersQuery);

    // Fetch Token Transactions for Ledger
    const txQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return query(collection(db, "tokenTransactions"), where("userId", "==", user.uid), orderBy("createdAt", "asc"));
    }, [user?.uid]);
    const { data: transactions, isLoading: loadingTx } = useCollection(txQuery);

    const stats = useMemo(() => {
        if (!user) return { totalPoints: 0, redeemableTokens: 0, progress: 0, availablePoints: 0, stakingRewards: 0, income: 0, expense: 0, apr: 5, gcvUSD: 0, totalTokens: 0, wealthHistory: [] };

        // 1. Points Calculation
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

        // 2. APR based on level
        let apr = 5;
        if (user.loyaltyLevel === 'Gold') apr = 12;
        else if (user.loyaltyLevel === 'Silver') apr = 8;

        // 3. Staking Rewards
        let rewards = 0;
        if (user.stakedBalance && user.stakingStartedAt) {
            const start = user.stakingStartedAt?.toDate ? user.stakingStartedAt.toDate() : new Date(user.stakingStartedAt);
            const hoursStaked = Math.max(0, (Date.now() - start.getTime()) / (1000 * 60 * 60));
            rewards = (user.stakedBalance * (apr / 100) * (hoursStaked / 8760));
        }

        // 4. Ledger & Wealth History Simulation
        let income = 0;
        let expense = 0;
        let runningTotal = 0;
        const wealthHistory: any[] = [];

        transactions?.forEach((tx, idx) => {
            const isIncoming = tx.type === 'mint' || tx.type === 'mining' || tx.type === 'unstaking' || (tx.type === 'transfer' && tx.direction === 'received');
            
            if (isIncoming) {
                income += tx.tokenAmount;
                runningTotal += tx.tokenAmount;
            } else {
                expense += tx.tokenAmount;
                runningTotal -= tx.tokenAmount;
            }

            // Pour le graphique, on prend un échantillon ou on formate par date
            const date = tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : `T${idx}`;
            wealthHistory.push({
                name: date,
                balance: runningTotal,
                wealth: runningTotal * GCV_VALUE
            });
        });

        // 5. GCV Conversion
        const totalTokens = (user.tokenBalance || 0) + (user.stakedBalance || 0) + rewards;
        const gcvUSD = totalTokens * GCV_VALUE;

        return { 
            totalPoints: total, 
            availablePoints, 
            redeemableTokens: redeemable, 
            progress, 
            stakingRewards: rewards, 
            income, 
            expense, 
            apr,
            gcvUSD,
            totalTokens,
            wealthHistory: wealthHistory.slice(-15) // On garde les 15 derniers points
        };
    }, [user, logs, orders, isStaff, transactions]);

    const handleSyncPi = async () => {
        setIsSyncing(true);
        try {
            const piUser = await authenticateWithPi();
            if (piUser) {
                await updateDoc(doc(db, "users", user!.uid), { 
                    piUsername: piUser.username,
                    piWalletAddress: piUser.uid,
                    updatedAt: serverTimestamp() 
                });
                toast({ title: "Pi Network Synchronisé", description: `Bienvenue ${piUser.username} !` });
            }
        } catch (error: any) {
            toast({ title: "Erreur Pi", description: error.message, variant: "destructive" });
        } finally {
            setIsSyncing(false);
        }
    };

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

    const handleStake = async () => {
        if (!user || !stakeAmount || isProcessingAction) return;
        const amount = parseFloat(stakeAmount);
        if (amount > (user.tokenBalance || 0)) { toast({ title: "Solde insuffisant" }); return; }

        setIsProcessingAction(true);
        try {
            const txId = `DKST-STAKE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(-amount),
                stakedBalance: increment(amount),
                stakingStartedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid, type: 'staking', tokenAmount: amount, piTxId: txId, createdAt: serverTimestamp()
            });
            toast({ title: "Contrat de Staking Actif", description: `Vos ${amount} DKST génèrent maintenant ${stats.apr}% APR.` });
            setStakeAmount("");
        } catch (e) { toast({ title: "Erreur Staking", variant: "destructive" }); } finally { setIsProcessingAction(false); }
    };

    const handleUnstake = async () => {
        if (!user || !user.stakedBalance || isProcessingAction) return;
        setIsProcessingAction(true);
        try {
            const amount = user.stakedBalance;
            const rewards = stats.stakingRewards;
            const total = amount + rewards;
            
            const txId = `DKST-UNSTAKE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(total),
                stakedBalance: 0,
                stakingStartedAt: null,
                updatedAt: serverTimestamp()
            });
            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid, type: 'unstaking', tokenAmount: total, piTxId: txId, memo: `Rewards: ${rewards.toFixed(4)} inclus`, createdAt: serverTimestamp()
            });
            toast({ title: "Retrait Effectué", description: `Vous avez récupéré ${total.toFixed(2)} DKST.` });
        } catch (e) { toast({ title: "Erreur Unstaking", variant: "destructive" }); } finally { setIsProcessingAction(false); }
    };

    const handleBuyPerk = async (perk: any) => {
        if (!user || (user.tokenBalance || 0) < perk.cost) {
            toast({ title: "Solde insuffisant", description: "Miner plus pour débloquer cet avantage !", variant: "destructive" });
            return;
        }

        setIsProcessingAction(true);
        try {
            const promoCode = `DKS-${perk.id.toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(-perk.cost),
                updatedAt: serverTimestamp()
            });
            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid, type: 'exchange', tokenAmount: perk.cost, memo: `Burn/Exchange: ${perk.title} (Code: ${promoCode})`, createdAt: serverTimestamp()
            });
            await addDoc(collection(db, "notifications"), {
                userId: user.uid, title: "Privilège Débloqué !",
                message: `Voici votre code : ${promoCode}. Présentez-le en boutique pour en profiter.`,
                type: 'success', isRead: false, createdAt: serverTimestamp(), link: '/dashboard/wallet'
            });
            toast({ title: "Privilège Débloqué", description: "Votre code est disponible dans vos notifications." });
        } catch (e) { toast({ title: "Erreur Achat", variant: "destructive" }); } finally { setIsProcessingAction(false); }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedRecipient || !transferAmount) return;
        const amount = parseFloat(transferAmount);
        if (amount > (user.tokenBalance || 0)) { toast({ title: "Solde insuffisant", variant: "destructive" }); return; }

        setIsProcessingAction(true);
        try {
            const piTxId = `PI-P2P-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
            await updateDoc(doc(db, "users", user.uid), { tokenBalance: increment(-amount), updatedAt: serverTimestamp() });
            await updateDoc(doc(db, "users", selectedRecipient.id), { tokenBalance: increment(amount), updatedAt: serverTimestamp() });
            
            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid, userName: user.name, type: 'transfer', tokenAmount: amount, direction: 'sent',
                recipientId: selectedRecipient.id, recipientName: selectedRecipient.name || selectedRecipient.displayName,
                memo: transferMemo, piTxId, createdAt: serverTimestamp()
            });

            await addDoc(collection(db, "tokenTransactions"), {
                userId: selectedRecipient.id, userName: selectedRecipient.name || selectedRecipient.displayName,
                type: 'transfer', tokenAmount: amount, direction: 'received',
                senderId: user.uid, senderName: user.name, memo: transferMemo, piTxId, createdAt: serverTimestamp()
            });

            await addDoc(collection(db, "notifications"), {
                userId: selectedRecipient.id, title: "DKST Reçu !",
                message: `${user.name} vous a envoyé ${amount} DKST.`,
                type: 'success', isRead: false, createdAt: serverTimestamp(), link: '/dashboard/wallet'
            });

            toast({ title: "Transfert réussi", description: `${amount} DKST envoyés à ${selectedRecipient.name}` });
            setIsTransferSheetOpen(false);
            setTransferAmount("");
            setSelectedRecipient(null);
        } catch (error) { toast({ title: "Erreur transfert", variant: "destructive" }); } finally { setIsProcessingAction(false); }
    };

    // Recipient Search Logic
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchQuery.length < 3) { setSearchResults([]); return; }
            setIsSearching(true);
            try {
                const q = query(collection(db, "users"), limit(10));
                const snap = await getDocs(q);
                const results = snap.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter((u: any) => 
                        u.id !== user?.uid && 
                        (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                    );
                setSearchResults(results);
            } catch (e) { console.error(e); } finally { setIsSearching(false); }
        }, 500);
        return () => clearTimeout(delayDebounce);
    }, [searchQuery, user?.uid]);

    const filteredTransactions = transactions?.filter(tx => {
        const matchesFilter = ledgerFilter === "all" || tx.type === ledgerFilter;
        const matchesSearch = !ledgerSearch || 
            tx.piTxId?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
            tx.memo?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
            tx.recipientName?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
            tx.senderName?.toLowerCase().includes(ledgerSearch.toLowerCase());
        return matchesFilter && matchesSearch;
    }).sort((a,b) => {
        const da = a.createdAt?.toDate?.() || new Date(0);
        const db = b.createdAt?.toDate?.() || new Date(0);
        return db - da; // Décroissant pour l'historique
    });

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard">
                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0 transition-all"><ArrowLeft size={24} /></Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Mon Wallet <span className="text-accent">Élite</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Gestionnaire d'actifs numériques & GCV Pi Terminal</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button 
                            onClick={handleSyncPi}
                            disabled={isSyncing}
                            variant="outline"
                            className="border-orange-500/20 text-orange-500 h-14 px-6 rounded-2xl font-black uppercase italic gap-3 hover:bg-orange-500/10 transition-all"
                        >
                            {isSyncing ? <Loader2 className="animate-spin" /> : <Globe size={20} />}
                            {user?.piWalletAddress ? "Pi Mainnet Synced" : "Connecter Pi SDK"}
                        </Button>
                        <Button onClick={() => setIsTransferSheetOpen(true)} className="bg-accent text-black hover:bg-accent/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-accent/20">
                            <Send size={20} /> Transférer
                        </Button>
                    </div>
                </div>

                {/* GCV INTERACTIVE HERO SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                    <Card className="lg:col-span-8 bg-gradient-to-br from-yellow-500/20 via-background to-black border-yellow-500/20 rounded-[3.5rem] p-12 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 p-12 opacity-10 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-[3s]"><Gem size={300} className="text-yellow-500" /></div>
                        <div className="relative z-10 space-y-10">
                            <div className="flex flex-wrap items-center gap-4">
                                <Badge className="bg-yellow-500 text-black font-black uppercase italic tracking-widest px-5 py-2">Consensus GCV Activé</Badge>
                                <Badge variant="outline" className="border-white/10 text-white/40 uppercase font-black text-[9px] tracking-widest flex items-center gap-2">
                                    <Sparkles size={10} className="text-yellow-500" /> 1 π = $314,159.00
                                </Badge>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-end gap-10">
                                <div className="space-y-2">
                                    <h2 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter leading-none">
                                        {stats.totalTokens.toFixed(2)} <span className="text-2xl md:text-3xl text-yellow-500 not-italic uppercase ml-2">DKST</span>
                                    </h2>
                                    <p className="text-lg md:text-xl font-bold text-white/40 uppercase tracking-widest">Actifs de l'Élite • Fortune Numérique</p>
                                </div>
                                <div className="bg-black/60 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-yellow-500/30 text-right min-w-[280px] shadow-inner">
                                    <p className="text-[10px] font-black uppercase text-yellow-500 mb-2 tracking-[0.4em]">Valeur Estimée (USD)</p>
                                    <p className="text-4xl font-black text-white italic tracking-tighter">
                                        ${stats.gcvUSD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-[9px] font-bold uppercase mt-4 text-white/20">Basé sur le consensus global Pi Network</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-center">
                                    <p className="text-[9px] font-black uppercase text-white/40 mb-1">Liquidité</p>
                                    <p className="text-xl font-black text-white">{user?.tokenBalance?.toFixed(2)} DKST</p>
                                </div>
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-center">
                                    <p className="text-[9px] font-black uppercase text-white/40 mb-1">Épargne Vault</p>
                                    <p className="text-xl font-black text-primary">{user?.stakedBalance?.toFixed(2)} DKST</p>
                                </div>
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-center">
                                    <p className="text-[9px] font-black uppercase text-white/40 mb-1">Récompenses</p>
                                    <p className="text-xl font-black text-green-400">+{stats.stakingRewards.toFixed(4)}</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="lg:col-span-4 glossy-card border-none rounded-[3.5rem] p-10 flex flex-col justify-between overflow-hidden relative">
                         <div className="absolute bottom-0 right-0 p-8 opacity-5"><Calculator size={100} /></div>
                         <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-accent text-black flex items-center justify-center shadow-lg"><Calculator size={24} /></div>
                                <h4 className="text-xl font-black uppercase italic tracking-tight">Calculateur <span className="text-accent">Wealth</span></h4>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed italic">"Simulez l'impact de vos gains sur votre fortune future au taux GCV."</p>
                            
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Gain Cible (DKST)</Label>
                                    <Input 
                                        type="number" 
                                        placeholder="Ex: 10" 
                                        className="h-14 bg-background/50 border-white/10 rounded-2xl text-xl font-black text-center" 
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0;
                                            const res = val * GCV_VALUE;
                                            (document.getElementById('calc-res') as HTMLElement).innerText = `$${res.toLocaleString('fr-FR')}`;
                                        }}
                                    />
                                </div>
                                <div className="p-6 bg-black/40 rounded-3xl border border-dashed border-accent/30 text-center">
                                    <p className="text-[8px] font-black uppercase text-accent mb-2">Valeur GCV Potentielle</p>
                                    <p id="calc-res" className="text-3xl font-black text-white italic">$0</p>
                                </div>
                            </div>
                         </div>
                         <Button variant="ghost" className="h-10 text-[9px] font-black uppercase tracking-widest text-white/20 mt-6 group">
                            Comprendre le GCV <ArrowRight size={12} className="ml-2 group-hover:translate-x-2 transition-transform" />
                         </Button>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <Card className="bg-primary/10 border-primary/20 rounded-[2.5rem] p-8 space-y-4">
                        <p className="text-[9px] font-black uppercase text-primary/60 tracking-widest">Staking Actif</p>
                        <p className="text-4xl font-black text-white italic">{user?.stakedBalance?.toFixed(2) || "0.00"}</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-primary">
                             <Zap size={12} /> Taux APR: {stats.apr}%
                        </div>
                    </Card>
                    <Card className="bg-green-500/10 border-green-500/20 rounded-[2.5rem] p-8 space-y-4">
                        <p className="text-[9px] font-black uppercase text-green-500/60 tracking-widest">Revenus Totaux</p>
                        <p className="text-4xl font-black text-white italic">+{stats.income.toFixed(2)}</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-green-500">
                             <ArrowDownLeft size={12} /> Minting & Transferts
                        </div>
                    </Card>
                    <Card className="bg-red-500/10 border-red-500/20 rounded-[2.5rem] p-8 space-y-4">
                        <p className="text-[9px] font-black uppercase text-red-500/60 tracking-widest">Dépenses / Invest.</p>
                        <p className="text-4xl font-black text-white italic">-{stats.expense.toFixed(2)}</p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-red-500">
                             <ArrowUpRight size={12} /> Staking & Privilèges
                        </div>
                    </Card>
                    <Card className="bg-accent/10 border-accent/20 rounded-[2.5rem] p-8 space-y-4">
                        <p className="text-[9px] font-black uppercase text-accent/60 tracking-widest">Valeur Pi (GCV)</p>
                        <p className="text-4xl font-black text-white italic">{(stats.totalTokens).toFixed(4)} <span className="text-sm not-italic">π</span></p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-accent">
                             <Coins size={12} /> 1 DKST = 1 Pi Consensus
                        </div>
                    </Card>
                </div>

                <Tabs defaultValue="overview" className="space-y-10">
                    <TabsList className="bg-white/5 border border-white/5 p-1.5 rounded-[1.5rem] h-16 w-full max-w-xl mx-auto flex">
                        <TabsTrigger value="overview" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all"><Wallet size={14} className="mr-2" /> Vue d'ensemble</TabsTrigger>
                        <TabsTrigger value="vault" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all"><Lock size={14} className="mr-2" /> DKS Vault</TabsTrigger>
                        <TabsTrigger value="history" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all"><History size={14} className="mr-2" /> Registre</TabsTrigger>
                    </TabsList>

                    {/* ONGLET VUE D'ENSEMBLE */}
                    <TabsContent value="overview" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                             <div className="lg:col-span-5 space-y-8">
                                <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-8">
                                    <div className="flex items-center gap-4"><Flame className="text-orange-500" size={24} /><h3 className="text-xl font-black uppercase italic tracking-tight">Convertir mes Points</h3></div>
                                    <div className="space-y-6">
                                        <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 space-y-6">
                                            <div className="flex justify-between items-end">
                                                <p className="text-[10px] font-black uppercase opacity-40">Points Accumulés</p>
                                                <span className="text-xl font-black text-accent">{stats.availablePoints} <span className="text-[10px] opacity-40 not-italic">PTS</span></span>
                                            </div>
                                            <div className="relative pt-2">
                                                 <Progress value={stats.progress} className="h-3 bg-white/5" indicatorClassName="bg-accent shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
                                                 <div className="absolute top-0 left-0 w-full flex justify-between px-1 -mt-2">
                                                    {[...Array(5)].map((_, i) => <div key={i} className="w-0.5 h-1.5 bg-white/10 rounded-full" />)}
                                                 </div>
                                            </div>
                                            <div className="text-center space-y-1">
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase">Taux de frappe: 100 PTS = 1 DKST</p>
                                                {stats.redeemableTokens >= 1 ? (
                                                    <p className="text-[10px] font-black text-green-400 uppercase">Prêt à mint: {stats.redeemableTokens} DKST</p>
                                                ) : (
                                                    <p className="text-[10px] font-black text-white/20 uppercase">Besoin de {100 - stats.progress} pts de plus</p>
                                                )}
                                            </div>
                                            <Button onClick={mintTokens} disabled={isMinting || stats.redeemableTokens < 1} className="w-full h-14 bg-accent text-black font-black uppercase italic rounded-xl gap-2 shadow-xl shadow-accent/10">
                                                {isMinting ? <Loader2 className="animate-spin" /> : <><RefreshCw size={18} /> Lancer le Minting</>}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20 rounded-[3rem] p-10 space-y-6">
                                    <div className="flex items-center gap-4"><Award className="text-primary" size={24} /><h3 className="text-xl font-black uppercase italic tracking-tight">Privilèges Elite</h3></div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {SHOP_PERKS.map(perk => (
                                            <button 
                                                key={perk.id}
                                                onClick={() => handleBuyPerk(perk)}
                                                disabled={isProcessingAction}
                                                className="flex items-center gap-5 p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-primary/50 transition-all text-left group"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    {perk.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-xs uppercase italic">{perk.title}</p>
                                                    <p className="text-[10px] text-white/40">{perk.description}</p>
                                                </div>
                                                <Badge className="bg-primary/20 text-primary border-none font-black text-[10px]">{perk.cost} DKST</Badge>
                                            </button>
                                        ))}
                                    </div>
                                </Card>
                             </div>

                             <div className="lg:col-span-7 space-y-8">
                                {/* NOVEAU GRAPHIQUE D'ÉVOLUTION DE FORTUNE */}
                                <Card className="glossy-card border-none rounded-[3rem] p-10 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5"><ChartIcon size={120} /></div>
                                    <div className="relative z-10 space-y-8">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-2xl font-black uppercase italic tracking-tight">Trajectoire de <span className="text-accent">Richesse</span></h3>
                                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Valorisation GCV ($314,159/π)</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><Activity className="animate-pulse" size={24}/></div>
                                        </div>

                                        <div className="h-[300px] w-full">
                                            {stats.wealthHistory.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={stats.wealthHistory}>
                                                        <defs>
                                                            <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                                                                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                                                        <Tooltip 
                                                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px' }} 
                                                            itemStyle={{ color: 'hsl(var(--accent))' }}
                                                            formatter={(value: any) => [`$${value.toLocaleString()}`, "Valeur GCV"]}
                                                        />
                                                        <Area type="monotone" dataKey="wealth" stroke="hsl(var(--accent))" strokeWidth={3} fillOpacity={1} fill="url(#colorWealth)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center opacity-20 text-center gap-4">
                                                    <ChartIcon size={48} />
                                                    <p className="text-xs uppercase font-black tracking-widest">Registre insuffisant pour l'analyse</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>

                                <Card className="glossy-card border-none rounded-[3rem] p-10 h-auto relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck size={120} /></div>
                                    <div className="relative z-10 space-y-10">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-2xl font-black uppercase italic tracking-tight">Sécurité & <span className="text-accent">Garantie</span></h3>
                                            <Badge variant="outline" className="border-accent/20 text-accent uppercase font-black text-[8px] tracking-widest">Audit v2.0</Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><Smartphone size={20} /></div>
                                                <h4 className="font-black uppercase italic text-xs">Authentification</h4>
                                                <p className="text-xs text-muted-foreground leading-relaxed">Votre wallet est protégé par le cryptage DKS. Seules les transactions signées par votre compte sont validées sur le registre.</p>
                                            </div>
                                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><QrCode size={20} /></div>
                                                <h4 className="font-black uppercase italic text-xs">Identité Digitale</h4>
                                                <p className="text-xs text-muted-foreground leading-relaxed">Chaque transfert P2P génère un reçu numérique avec hachage blockchain, vérifiable à tout moment en boutique.</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                             </div>
                        </div>
                    </TabsContent>

                    {/* ONGLET VAULT (STAKING) */}
                    <TabsContent value="vault" className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <Card className="bg-primary/10 border-primary/20 rounded-[3.5rem] p-12 flex flex-col justify-between h-[600px] relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 group-hover:scale-125 transition-transform duration-[2s]"><Vault size={300} /></div>
                                <div className="space-y-8 relative z-10">
                                    <Badge className="bg-primary text-white border-none px-5 py-2 font-black uppercase italic tracking-widest">DKS VAULT V2 • PROFIT MAX</Badge>
                                    <div className="space-y-2">
                                        <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-tight text-white">ÉPARGNEZ <br /><span className="text-primary">GAGNEZ</span></h2>
                                        <p className="text-lg text-white/60 font-bold uppercase italic">Rendement Annuel Garanti : {stats.apr}% (APR)</p>
                                    </div>
                                    
                                    <div className="p-8 bg-black/60 backdrop-blur-3xl rounded-[3rem] border border-white/10 space-y-8 shadow-2xl">
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Dépôt Actuel</p>
                                                <p className="text-4xl font-black text-primary italic">{user?.stakedBalance || "0.00"} <span className="text-xs opacity-40 not-italic">DKST</span></p>
                                            </div>
                                            <div className="space-y-1 text-right">
                                                <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Intérêts (Real-time)</p>
                                                <p className="text-2xl font-black text-green-400 italic">+{stats.stakingRewards.toFixed(4)}</p>
                                            </div>
                                        </div>

                                        <Progress value={user?.stakedBalance ? 100 : 0} className="h-1.5 bg-white/5" indicatorClassName="bg-primary" />
                                        
                                        {user?.stakedBalance ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                                                    <Timer size={16} className="text-primary animate-pulse" />
                                                    <p className="text-[10px] font-bold text-white/70 italic">Contrat actif depuis le {user.stakingStartedAt?.toDate ? user.stakingStartedAt.toDate().toLocaleDateString() : '?'}</p>
                                                </div>
                                                <Button onClick={handleUnstake} disabled={isProcessingAction} className="w-full h-20 bg-white text-primary font-black uppercase italic rounded-[2rem] shadow-xl text-lg transition-all active:scale-95">Libérer les jetons (Unstake)</Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <CircleDollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" />
                                                    <Input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="Montant à bloquer..." className="h-16 pl-14 bg-background/50 border-white/10 rounded-2xl text-center text-xl font-black" />
                                                </div>
                                                <Button onClick={handleStake} disabled={!stakeAmount || isProcessingAction} className="w-full h-20 bg-primary text-white font-black uppercase italic rounded-[2rem] shadow-2xl text-lg transition-all active:scale-95">Activer le Contrat</Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>

                            <div className="space-y-8">
                                <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-8">
                                    <div className="flex items-center gap-4"><TrendingUp size={24} className="text-primary" /><h2 className="text-xl font-black uppercase italic tracking-tight">Pourquoi Staker vos DKST ?</h2></div>
                                    <div className="space-y-6">
                                        {[
                                            { label: "Rendement Évolutif", desc: "Plus votre grade Elite est haut, plus votre taux APR augmente (jusqu'à 12% pour le grade Gold).", icon: <TrendingUp className="text-accent" /> },
                                            { label: "Sécurité Maximale", desc: "Vos actifs sont gelés dans un coffre-fort numérique protégé par le Hub, à l'abri des fluctuations.", icon: <ShieldCheck className="text-green-400" /> },
                                            { label: "Gouvernance Premium", desc: "Les jetons stakés comptent double lors des votes de gouvernance DAO.", icon: <Star className="text-yellow-400" /> },
                                        ].map((item, i) => (
                                            <div key={i} className="flex gap-6 p-6 bg-white/5 rounded-3xl border border-white/5 group hover:bg-white/[0.08] transition-all">
                                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">{item.icon}</div>
                                                <div className="space-y-1"><p className="font-bold text-sm uppercase italic tracking-tight">{item.label}</p><p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p></div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ONGLET REGISTRE (HISTORY) */}
                    <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4">
                        <Card className="glossy-card border-none rounded-[3rem] overflow-hidden flex flex-col">
                            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.02] space-y-8">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                    <CardTitle className="text-2xl font-black uppercase italic flex items-center gap-4"><History className="text-accent" /> Registre Ledger v2.0</CardTitle>
                                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                                        {['all', 'mint', 'transfer', 'staking', 'exchange'].map(f => (
                                            <button 
                                                key={f} 
                                                onClick={() => setLedgerFilter(f)}
                                                className={cn(
                                                    "px-6 h-10 rounded-xl font-black uppercase italic text-[9px] transition-all",
                                                    ledgerFilter === f ? "bg-accent text-black shadow-lg" : "text-white/40 hover:text-white"
                                                )}
                                            >
                                                {f === 'all' ? 'Tous' : f === 'exchange' ? 'Burn' : f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <Input 
                                        placeholder="Chercher une transaction, un mémo ou un identifiant..." 
                                        className="h-14 pl-14 bg-background/40 border-white/5 rounded-2xl focus:border-accent"
                                        value={ledgerSearch}
                                        onChange={(e) => setLedgerSearch(e.target.value)}
                                    />
                                </div>
                            </CardHeader>

                            <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {loadingTx ? (
                                    <div className="p-20 text-center"><Loader2 className="animate-spin text-accent mx-auto" /></div>
                                ) : filteredTransactions && filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((tx) => {
                                        const isIncoming = tx.type === 'mint' || tx.type === 'mining' || tx.type === 'unstaking' || (tx.type === 'transfer' && tx.direction === 'received');
                                        return (
                                            <div key={tx.id} className="p-8 flex flex-col md:flex-row items-center justify-between hover:bg-white/[0.02] transition-colors group gap-6">
                                                <div className="flex items-center gap-6 flex-1 w-full">
                                                    <div className={cn(
                                                        "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110",
                                                        isIncoming ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-500"
                                                    )}>
                                                        {tx.type === 'mint' ? <RefreshCw size={24} /> : 
                                                         tx.type === 'staking' ? <Vault size={24} /> : 
                                                         tx.type === 'exchange' ? <Flame size={24} /> : 
                                                         isIncoming ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-3">
                                                            <p className="text-sm font-black uppercase italic tracking-tight">{tx.type.toUpperCase()}</p>
                                                            <Badge variant="outline" className="text-[7px] font-black uppercase border-white/10 opacity-40">Confirmed</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Lock size={10} className="text-green-500 opacity-60" />
                                                            <p className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">{tx.piTxId || tx.id}</p>
                                                        </div>
                                                        {tx.memo && <p className="text-[10px] italic text-white/40 bg-white/5 px-2 py-0.5 rounded-md inline-block">"{tx.memo}"</p>}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center md:items-end gap-1 shrink-0">
                                                    <p className={cn(
                                                        "text-2xl font-black italic",
                                                        isIncoming ? "text-green-400" : "text-red-400"
                                                    )}>
                                                        {isIncoming ? '+' : '-'}{tx.tokenAmount.toFixed(2)} <span className="text-xs not-italic opacity-40">DKST</span>
                                                    </p>
                                                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest">
                                                        {tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Récemment'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-32 text-center flex flex-col items-center gap-6 opacity-20 italic">
                                        <History size={64} strokeWidth={1} />
                                        <p className="text-xs uppercase font-black tracking-widest">Aucun mouvement détecté sur ce compte</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>

            {/* TRANSFER SHEET */}
            <Sheet open={isTransferSheetOpen} onOpenChange={setIsTransferSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-10 bg-accent/10 border-b border-white/5">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-xl shadow-accent/10"><Send size={32} /></div>
                            <div>
                                <SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">Envoyer des Jetons</SheetTitle>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Échange Universel DKS</p>
                            </div>
                        </div>
                    </SheetHeader>
                    
                    <div className="flex-1 p-10 space-y-10 overflow-y-auto custom-scrollbar">
                        {!selectedRecipient ? (
                            <div className="space-y-6">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Chercher un membre</Label>
                                <div className="relative">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Nom ou Email du bénéficiaire..." className="h-16 pl-14 bg-background/50 border-white/10 rounded-2xl focus:border-accent font-bold" />
                                </div>
                                {searchQuery.length >= 3 && (
                                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                        {isSearching ? <div className="py-10 text-center"><Loader2 className="animate-spin text-accent mx-auto h-8 w-8" /></div> : searchResults.length > 0 ? searchResults.map((u) => (
                                            <button key={u.id} onClick={() => { setSelectedRecipient(u); setSearchQuery(""); }} className="flex items-center gap-4 p-5 w-full rounded-2xl bg-white/5 border border-white/5 hover:bg-accent/5 hover:border-accent/20 transition-all text-left">
                                                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center font-black text-accent text-lg italic">{u.name?.substring(0, 1)}</div>
                                                <div className="flex-1 overflow-hidden"><p className="font-black text-sm uppercase italic truncate">{u.name}</p><p className="text-[10px] opacity-40 truncate">{u.email}</p></div>
                                            </button>
                                        )) : <p className="text-center py-10 text-[10px] font-black uppercase opacity-30 italic">Aucun résultat trouvé</p>}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <form onSubmit={handleTransfer} className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                                <div className="p-6 bg-accent/5 border border-accent/20 rounded-[2.5rem] flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-accent text-black flex items-center justify-center font-black text-xl italic shadow-lg shadow-accent/20">{selectedRecipient.name?.substring(0, 1)}</div>
                                        <div>
                                            <p className="text-[9px] font-black text-accent uppercase tracking-widest">Envoi vers</p>
                                            <p className="text-lg font-black uppercase italic text-white leading-none mt-1">{selectedRecipient.name}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedRecipient(null)} className="h-10 w-10 rounded-full hover:bg-white/5 text-white/40"><X size={20}/></Button>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Montant à transférer</Label>
                                        <div className="relative">
                                            <Coins className="absolute left-6 top-1/2 -translate-y-1/2 text-accent" size={24} />
                                            <Input type="number" step="0.01" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="h-20 pl-16 bg-background/50 border-white/10 rounded-[2rem] text-4xl font-black text-accent" required />
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-end">
                                                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">DISPO</p>
                                                <p className="text-xs font-bold text-white/40">{user?.tokenBalance?.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Mémo de transaction</Label>
                                        <Input value={transferMemo} onChange={(e) => setTransferMemo(e.target.value)} placeholder="Ex: Remboursement diagnostic..." className="h-14 bg-background/50 border-white/10 rounded-2xl italic text-sm font-medium" />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <Button type="submit" disabled={isProcessingAction || !transferAmount} className="w-full h-20 bg-accent text-black font-black uppercase italic rounded-[2rem] shadow-2xl shadow-accent/20 text-xl gap-4">
                                        {isProcessingAction ? <Loader2 className="animate-spin" /> : <><Send size={24} /> Valider le Transfert</>}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default withAuth(UniversalWalletPage);
