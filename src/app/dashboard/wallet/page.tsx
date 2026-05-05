
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
    ShieldX
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
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/tabs";
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
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';

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
    
    // Security States
    const [isPinVerificationOpen, setIsPinVerificationOpen] = useState(false);
    const [enteredPin, setEnteredPin] = useState("");
    const [pendingAction, setPendingAction] = useState<() => void>(() => {});
    const [showPin, setShowPin] = useState(false);
    const [isEmergencyLockProcessing, setIsEmergencyLockProcessing] = useState(false);

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

    // Certificate States
    const [isGeneratingCert, setIsGeneratingCert] = useState(false);
    const certRef = useRef<HTMLDivElement>(null);

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

    // Fetch Top Wealthiest Users for Leaderboard
    const topWealthQuery = useMemoFirebase(() => {
        return query(collection(db, "users"), orderBy("tokenBalance", "desc"), limit(10));
    }, []);
    const { data: topWealthyUsers, isLoading: loadingWealth } = useCollection(topWealthQuery);

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

            const date = tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : `T${idx}`;
            wealthHistory.push({
                name: date,
                balance: runningTotal,
                wealth: runningTotal * GCV_VALUE
            });
        });

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
            wealthHistory: wealthHistory.slice(-15) 
        };
    }, [user, logs, orders, isStaff, transactions]);

    const globalHubWealth = useMemo(() => {
        if (!topWealthyUsers) return 0;
        const sum = topWealthyUsers.reduce((acc, u) => acc + (u.tokenBalance || 0) + (u.stakedBalance || 0), 0);
        return sum * GCV_VALUE;
    }, [topWealthyUsers]);

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

    // --- SECURITY WRAPPER ---
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
            pendingAction();
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
            await updateDoc(doc(db, "users", user.uid), {
                isWalletLocked: newLockState,
                updatedAt: serverTimestamp()
            });
            
            await addDoc(collection(db, "notifications"), {
                userId: user.uid,
                title: newLockState ? "WALLET VERROUILLÉ" : "WALLET DÉVERROUILLÉ",
                message: newLockState ? "Sécurité maximale activée. Aucun transfert possible." : "Votre wallet est à nouveau opérationnel.",
                type: newLockState ? 'error' : 'success',
                isRead: false,
                createdAt: serverTimestamp()
            });

            toast({ title: newLockState ? "Wallet Verrouillé" : "Wallet Déverrouillé", variant: newLockState ? "destructive" : "default" });
        } catch (e) {
            toast({ title: "Erreur Sécurité", variant: "destructive" });
        } finally {
            setIsEmergencyLockProcessing(false);
        }
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

    const handleTransferProcess = async () => {
        if (!user || !selectedRecipient || !transferAmount) return;
        const amount = parseFloat(transferAmount);
        
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

            toast({ title: "Transfert réussi", description: `${amount} DKST envoyés.` });
            setIsTransferSheetOpen(false);
            setTransferAmount("");
            setSelectedRecipient(null);
        } catch (error) { toast({ title: "Erreur transfert", variant: "destructive" }); } finally { setIsProcessingAction(false); }
    };

    const handleDownloadFortuneCert = async () => {
        if (!certRef.current) return;
        setIsGeneratingCert(true);
        try {
            const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`CERTIFICAT_FORTUNE_DKS_${user?.name?.replace(/\s+/g, '_')}.pdf`);
            toast({ title: "Certificat de Fortune généré" });
        } catch (error) { toast({ title: "Erreur PDF", variant: "destructive" }); } finally { setIsGeneratingCert(false); }
    };

    const getWealthTitle = (wealth: number) => {
        if (wealth >= 1000000000) return { label: "Billionnaire Élite", icon: <Crown className="text-yellow-500" />, color: "text-yellow-500" };
        if (wealth >= 10000000) return { label: "Multi-Millionnaire", icon: <Gem className="text-accent" />, color: "text-accent" };
        if (wealth >= 1000000) return { label: "Millionnaire GCV", icon: <Star className="text-primary" />, color: "text-primary" };
        return { label: "Investisseur Émergeant", icon: <TrendingUpIcon className="text-white/40" />, color: "text-white/40" };
    };

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
        return db - da;
    });

    const isMillionaire = stats.gcvUSD >= 1000000;
    const securityScore = useMemo(() => {
        let score = 30; // Base email auth
        if (user?.walletPin) score += 40;
        if (!user?.isWalletLocked) score += 0; else score += 10;
        if (user?.piWalletAddress) score += 20;
        return score;
    }, [user]);

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
                        {isMillionaire && (
                            <Button 
                                onClick={handleDownloadFortuneCert}
                                disabled={isGeneratingCert}
                                className="bg-yellow-500 text-black hover:bg-yellow-400 h-14 px-6 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-yellow-500/20 animate-in zoom-in duration-500"
                            >
                                {isGeneratingCert ? <Loader2 className="animate-spin" /> : <Medal size={20} />}
                                Certificat Millionnaire
                            </Button>
                        )}
                        <Button onClick={() => setIsTransferSheetOpen(true)} className="bg-accent text-black hover:bg-accent/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-accent/20">
                            <Send size={20} /> Transférer
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                    <Card className="lg:col-span-8 bg-gradient-to-br from-yellow-500/20 via-background to-black border-yellow-500/20 rounded-[3.5rem] p-12 relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 p-12 opacity-10 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-[3s]"><Gem size={300} className="text-yellow-500" /></div>
                        <div className="relative z-10 space-y-10">
                            <div className="flex flex-wrap items-center gap-4">
                                <Badge className="bg-yellow-500 text-black font-black uppercase italic tracking-widest px-5 py-2">Consensus GCV Activé</Badge>
                                <Badge variant="outline" className="border-white/10 text-white/40 uppercase font-black text-[9px] tracking-widest flex items-center gap-2">
                                    <Sparkles size={10} className="text-yellow-500" /> 1 π = $314,159.00
                                </Badge>
                                {user?.isWalletLocked && <Badge className="bg-red-500 text-white border-none uppercase font-black text-[9px] px-3 h-8 flex items-center gap-2 animate-pulse"><Lock size={12}/> Wallet Verrouillé</Badge>}
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
                         <div className="absolute bottom-0 right-0 p-8 opacity-5"><ShieldCheck size={100} /></div>
                         <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-accent text-black flex items-center justify-center shadow-lg"><ShieldCheck size={24} /></div>
                                <h4 className="text-xl font-black uppercase italic tracking-tight">Security <span className="text-accent">Shield</span></h4>
                            </div>
                            <div className="space-y-4 pt-4">
                                <div className="flex justify-between items-end">
                                    <p className="text-[10px] font-black uppercase text-white/40">Protection du Hub</p>
                                    <span className="text-sm font-black text-accent">{securityScore}% Secured</span>
                                </div>
                                <Progress value={securityScore} className="h-2 bg-white/5" indicatorClassName="bg-accent shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                                
                                <div className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                        <KeyRound size={14} className={user?.walletPin ? "text-green-400" : "text-white/20"} />
                                        <span className="text-[9px] font-bold uppercase">Code PIN de Signature</span>
                                        {user?.walletPin ? <CheckCircle2 size={12} className="ml-auto text-green-400" /> : <Link href="/dashboard/settings" className="ml-auto text-[8px] text-accent underline uppercase">Fixer</Link>}
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                        <Fingerprint size={14} className={user?.piWalletAddress ? "text-green-400" : "text-white/20"} />
                                        <span className="text-[9px] font-bold uppercase">Identité Pi Synced</span>
                                        {user?.piWalletAddress ? <CheckCircle2 size={12} className="ml-auto text-green-400" /> : <ShieldX size={12} className="ml-auto text-red-400" />}
                                    </div>
                                </div>
                            </div>
                         </div>
                         <Button 
                            onClick={toggleEmergencyLock} 
                            disabled={isEmergencyLockProcessing}
                            variant={user?.isWalletLocked ? "default" : "outline"}
                            className={cn(
                                "w-full h-14 rounded-2xl font-black uppercase italic text-[10px] gap-3 mt-6 transition-all",
                                user?.isWalletLocked ? "bg-red-500 text-white" : "border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white"
                            )}
                         >
                            {isEmergencyLockProcessing ? <Loader2 className="animate-spin" /> : user?.isWalletLocked ? <><Lock size={16} /> Déverrouiller le Wallet</> : <><ShieldAlert size={16} /> Verrouillage d'Urgence</>}
                         </Button>
                    </Card>
                </div>

                <Tabs defaultValue="overview" className="space-y-10">
                    <TabsList className="bg-white/5 border border-white/5 p-1.5 rounded-[1.5rem] h-16 w-full max-w-2xl mx-auto flex">
                        <TabsTrigger value="overview" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all"><Wallet size={14} className="mr-2" /> Portefeuille</TabsTrigger>
                        <TabsTrigger value="vault" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all"><Vault size={14} className="mr-2" /> DKS Vault</TabsTrigger>
                        <TabsTrigger value="rankings" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all"><BarChart3 size={14} className="mr-2" /> Wealth Rankings</TabsTrigger>
                        <TabsTrigger value="security" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all"><ShieldCheck size={14} className="mr-2" /> Sécurité</TabsTrigger>
                    </TabsList>

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
                                            </div>
                                            <div className="text-center space-y-1">
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase">Taux de frappe: 100 PTS = 1 DKST</p>
                                                {stats.redeemableTokens >= 1 ? (
                                                    <p className="text-[10px] font-black text-green-400 uppercase">Prêt à mint: {stats.redeemableTokens} DKST</p>
                                                ) : (
                                                    <p className="text-[10px] font-black text-white/20 uppercase">Besoin de {100 - stats.progress} pts de plus</p>
                                                )}
                                            </div>
                                            <Button onClick={() => secureAction(mintTokens)} disabled={isMinting || stats.redeemableTokens < 1} className="w-full h-14 bg-accent text-black font-black uppercase italic rounded-xl gap-2 shadow-xl shadow-accent/10">
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
                                                onClick={() => secureAction(() => handleBuyPerk(perk))}
                                                disabled={isProcessingAction}
                                                className="flex items-center gap-5 p-5 bg-black/40 rounded-2xl border border-white/5 hover:border-primary/50 transition-all text-left group"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">{perk.icon}</div>
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
                                                                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
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
                             </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-8">
                                <div className="flex items-center gap-4"><Lock className="text-accent" size={24} /><h3 className="text-xl font-black uppercase italic tracking-tight">Cold Storage</h3></div>
                                <div className="space-y-6">
                                    <p className="text-sm text-muted-foreground leading-relaxed italic">"Le verrouillage d'urgence gèle tous vos actifs DKST. Aucun transfert, staking ou échange n'est possible jusqu'au déverrouillage manuel."</p>
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 text-center">
                                        <p className="text-[10px] font-black uppercase text-white/40 mb-3">Statut Protection</p>
                                        {user?.isWalletLocked ? (
                                            <div className="text-red-500 font-black uppercase italic text-xl flex items-center justify-center gap-3"><Lock size={20}/> LOCK ACTIVE</div>
                                        ) : (
                                            <div className="text-green-400 font-black uppercase italic text-xl flex items-center justify-center gap-3"><ShieldCheck size={20}/> STANDBY OK</div>
                                        )}
                                    </div>
                                    <Button onClick={toggleEmergencyLock} className={cn("w-full h-16 rounded-2xl font-black uppercase italic shadow-xl", user?.isWalletLocked ? "bg-white text-black" : "bg-red-500 text-white")}>
                                        {user?.isWalletLocked ? "Déverrouiller le coffre" : "Verrouillage Immédiat"}
                                    </Button>
                                </div>
                            </Card>

                            <Card className="lg:col-span-2 glossy-card border-none rounded-[3rem] overflow-hidden">
                                <CardHeader className="p-10 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
                                    <CardTitle className="text-xl font-black uppercase italic flex items-center gap-4"><Activity className="text-accent" /> Journal de Sécurité (Audit)</CardTitle>
                                    <Badge variant="outline" className="border-white/10 text-white/40 uppercase text-[8px] font-black">Live Monitoring</Badge>
                                </CardHeader>
                                <div className="divide-y divide-white/5 max-h-[450px] overflow-y-auto custom-scrollbar">
                                    {transactions?.filter(t => t.type === 'transfer' || t.type === 'exchange' || t.type === 'staking').map((t, i) => (
                                        <div key={i} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20"><ShieldCheck size={18}/></div>
                                                <div>
                                                    <p className="text-xs font-bold uppercase italic">Action Signée : {t.type.toUpperCase()}</p>
                                                    <p className="text-[8px] font-mono text-muted-foreground opacity-40 truncate max-w-[200px]">{t.piTxId}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[7px] font-black">Success</Badge>
                                                <p className="text-[8px] font-bold opacity-30 mt-1">{t.createdAt?.toDate?.().toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="p-10 text-center opacity-20 italic text-[10px] uppercase font-black">Fin du registre d'audit.</div>
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
                                    <Input 
                                        type={showPin ? "text" : "password"}
                                        maxLength={4}
                                        value={enteredPin}
                                        onChange={(e) => setEnteredPin(e.target.value)}
                                        className="h-20 bg-background/50 border-white/10 rounded-2xl text-center text-5xl font-black tracking-[0.5em] focus:border-accent"
                                        autoFocus
                                    />
                                    <button 
                                        onClick={() => setShowPin(!showPin)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-accent transition-colors"
                                    >
                                        {showPin ? <EyeOff size={20}/> : <Eye size={20}/>}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="ghost" onClick={() => setIsPinVerificationOpen(false)} className="h-14 rounded-2xl font-black uppercase italic text-xs">Annuler</Button>
                            <Button 
                                onClick={handleVerifyPin} 
                                disabled={enteredPin.length < 4}
                                className="h-14 bg-accent text-black font-black uppercase italic text-xs rounded-2xl shadow-xl shadow-accent/20"
                            >
                                Signer & Valider
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* TRANSFER SHEET */}
            <Sheet open={isTransferSheetOpen} onOpenChange={setIsTransferSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-10 bg-accent/10 border-b border-white/5">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-xl shadow-accent/10"><Send size={32} /></div>
                            <div><SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">Envoyer des Jetons</SheetTitle><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Échange Universel DKS</p></div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 p-10 space-y-10 overflow-y-auto custom-scrollbar">
                        {!selectedRecipient ? (
                            <div className="space-y-6">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Chercher un membre</Label>
                                <div className="relative"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} /><Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Nom ou Email du bénéficiaire..." className="h-16 pl-14 bg-background/50 border-white/10 rounded-2xl focus:border-accent font-bold" /></div>
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
                            <form onSubmit={(e) => { e.preventDefault(); secureAction(handleTransferProcess); }} className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                                <div className="p-6 bg-accent/5 border border-accent/20 rounded-[2.5rem] flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-accent text-black flex items-center justify-center font-black text-xl italic shadow-lg shadow-accent/20">{selectedRecipient.name?.substring(0, 1)}</div>
                                        <div><p className="text-[9px] font-black text-accent uppercase tracking-widest">Envoi vers</p><p className="text-lg font-black uppercase italic text-white leading-none mt-1">{selectedRecipient.name}</p></div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedRecipient(null)} className="h-10 w-10 rounded-full hover:bg-white/5 text-white/40"><X size={20}/></Button>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Montant à transférer</Label>
                                        <div className="relative"><Coins className="absolute left-6 top-1/2 -translate-y-1/2 text-accent" size={24} /><Input type="number" step="0.01" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="h-20 pl-16 bg-background/50 border-white/10 rounded-[2rem] text-4xl font-black text-accent" required /><div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-end"><p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">DISPO</p><p className="text-xs font-bold text-white/40">{user?.tokenBalance?.toFixed(2)}</p></div></div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Mémo de transaction</Label>
                                        <Input value={transferMemo} onChange={(e) => setTransferMemo(e.target.value)} placeholder="Ex: Remboursement diagnostic..." className="h-14 bg-background/50 border-white/10 rounded-2xl italic text-sm font-medium" />
                                    </div>
                                </div>
                                <div className="pt-6"><Button type="submit" disabled={isProcessingAction || !transferAmount} className="w-full h-20 bg-accent text-black font-black uppercase italic rounded-[2rem] shadow-2xl shadow-accent/20 text-xl gap-4">{isProcessingAction ? <Loader2 className="animate-spin" /> : <><Send size={24} /> Valider le Transfert</>}</Button></div>
                            </form>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* MODÈLE DE CERTIFICAT DE FORTUNE CACHÉ */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {isMillionaire && (
                    <div ref={certRef} className="bg-white text-black p-0 w-[1123px] h-[794px] font-serif relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 border-[40px] border-double border-[#1e293b]" />
                        <div className="absolute inset-10 border-4 border-yellow-500/20" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none"><Logo size="xl" /></div>

                        <div className="relative z-10 text-center w-full px-40 space-y-12">
                            <div className="flex flex-col items-center gap-6">
                                <Logo size="lg" />
                                <div className="space-y-1">
                                    <h2 className="text-sm font-bold tracking-[0.4em] uppercase text-yellow-600">Double King Foundation</h2>
                                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-40">Département de la Prospérité Digitale • Bunia, RDC</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-black uppercase italic tracking-[0.3em] px-6 py-2 mb-4">Millionnaire GCV Consensus</Badge>
                                <h1 className="text-6xl font-black uppercase italic tracking-tighter text-[#1e293b]">CERTIFICAT DE FORTUNE</h1>
                                <p className="text-xl font-light italic text-gray-500">RECONNAISSANCE DE RÉUSSITE FINANCIÈRE WEB3</p>
                            </div>

                            <div className="space-y-8 py-10 bg-yellow-50/30 rounded-[3rem] border border-yellow-100">
                                <p className="text-lg font-medium text-gray-400 uppercase tracking-widest">Le présent titre est décerné à</p>
                                <h3 className="text-5xl font-black uppercase tracking-tight border-b-2 border-yellow-200 inline-block pb-2 px-14 italic">
                                    {user?.name}
                                </h3>
                                <p className="text-lg font-medium text-gray-600 max-w-2xl mx-auto leading-relaxed italic px-10">
                                    Pour avoir atteint le seuil d'exception de <strong>{stats.totalTokens.toFixed(2)} DKST</strong>, 
                                    représentant une valorisation théorique de :
                                </p>
                                <h4 className="text-4xl font-black text-yellow-600 tracking-tighter">
                                    $ {stats.gcvUSD.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} USD
                                </h4>
                            </div>

                            <div className="grid grid-cols-3 items-end pt-12">
                                <div className="text-center space-y-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date de distinction</p>
                                    <p className="text-sm font-bold">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-3 border-2 border-yellow-100 rounded-2xl bg-white shadow-xl"><QrCode size={60} className="opacity-20" /></div>
                                    <p className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">ID: DKS-WEALTH-{user?.uid.substring(0, 8).toUpperCase()}</p>
                                </div>
                                <div className="text-center space-y-4">
                                    <div className="w-40 h-px bg-gray-200 mx-auto" />
                                    <div className="flex flex-col items-center">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Directeur du Hub</p>
                                        <p className="text-sm font-black italic">Expert Bahati Nyeke</p>
                                        <ShieldCheck size={24} className="text-yellow-600 mt-2 opacity-30" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-bl-full -z-10" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/5 rounded-tr-full -z-10" />
                    </div>
                )}
            </div>
        </div>
    );
}

export default withAuth(UniversalWalletPage);
