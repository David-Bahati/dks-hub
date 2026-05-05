
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
    CircleDollarSign
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

const POINTS_PER_TOKEN = 100;
const STAKING_APR = 0.05; // 5% APR

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
        return query(collection(db, "tokenTransactions"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(15));
    }, [user?.uid]);
    const { data: transactions } = useCollection(txQuery);

    const stats = useMemo(() => {
        if (!user) return { totalPoints: 0, redeemableTokens: 0, progress: 0, availablePoints: 0, stakingRewards: 0 };

        let total = 0;
        if (isStaff) {
            total += (logs?.length || 0) * 10;
            total += (user.tokenBalance || 0) * 5; 
        } else {
            total += (orders?.length || 0) * 100; 
            total += (user.referralCount || 0) * 500; 
        }

        const availablePoints = total - (user.pointsConverted || 0);
        const redeemable = Math.floor(availablePoints / POINTS_PER_TOKEN);
        const progress = (availablePoints % POINTS_PER_TOKEN);

        // Simulated Staking Rewards
        let rewards = 0;
        if (user.stakedBalance && user.stakingStartedAt) {
            const start = user.stakingStartedAt?.toDate ? user.stakingStartedAt.toDate() : new Date(user.stakingStartedAt);
            const daysStaked = Math.max(0, (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
            rewards = (user.stakedBalance * STAKING_APR * (daysStaked / 365));
        }

        return { totalPoints: total, availablePoints, redeemableTokens: redeemable, progress, stakingRewards: rewards };
    }, [user, logs, orders, isStaff]);

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

    const handleSavePiWallet = async () => {
        if (!user || !tempPiAddress) return;
        setIsSyncing(true);
        try {
            await updateDoc(doc(db, "users", user.uid), { piWalletAddress: tempPiAddress, updatedAt: serverTimestamp() });
            toast({ title: "Wallet Pi Associé", description: "Votre identité blockchain est liée à votre compte DKS." });
            setTempPiAddress("");
        } catch (error) { toast({ title: "Erreur", variant: "destructive" }); } finally { setIsSyncing(false); }
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
            toast({ title: "Contrat de Staking Actif", description: `Vos ${amount} DKST génèrent maintenant 5% APR.` });
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

        if (!window.confirm(`Confirmer l'échange de ${perk.cost} DKST contre : ${perk.title} ?`)) return;

        setIsProcessingAction(true);
        try {
            const promoCode = `DKS-${perk.id.toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(-perk.cost),
                updatedAt: serverTimestamp()
            });
            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid, type: 'exchange', tokenAmount: perk.cost, memo: `Code: ${promoCode}`, createdAt: serverTimestamp()
            });
            await addDoc(collection(db, "notifications"), {
                userId: user.uid, title: "Privilège Débloqué !",
                message: `Voici votre code : ${promoCode}. Présentez-le en boutique pour en profiter.`,
                type: 'success', isRead: false, createdAt: serverTimestamp(), link: '/dashboard/wallet'
            });
            toast({ title: "Achat Réussi", description: "Votre code est disponible dans vos notifications." });
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
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Banque Centrale <span className="text-accent">DKST</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Gérez vos actifs numériques & privilèges d'élite</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard/hall-of-fame">
                             <Button variant="outline" className="border-accent/20 text-accent h-14 px-8 rounded-2xl font-black uppercase italic gap-3">
                                <Award size={20} /> Hall of Fame
                            </Button>
                        </Link>
                        <Button onClick={() => setIsTransferSheetOpen(true)} className="bg-accent text-black hover:bg-accent/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-accent/20">
                            <Send size={20} /> Transférer
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="assets" className="space-y-10">
                    <TabsList className="bg-white/5 border border-white/5 p-1.5 rounded-[1.5rem] h-16 w-full max-w-xl mx-auto flex">
                        <TabsTrigger value="assets" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black"><Wallet size={14} className="mr-2" /> Actifs</TabsTrigger>
                        <TabsTrigger value="staking" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black"><Vault size={14} className="mr-2" /> Vault (Staking)</TabsTrigger>
                        <TabsTrigger value="exchange" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black"><ShoppingBag size={14} className="mr-2" /> Échanger</TabsTrigger>
                    </TabsList>

                    {/* ONGLET ACTIFS */}
                    <TabsContent value="assets" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-5 space-y-8">
                                <Card className="bg-accent/10 border-accent/20 rounded-[3rem] p-10 space-y-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-12 transition-transform duration-1000"><Coins size={200} /></div>
                                    <div className="relative z-10 space-y-8">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <Badge className="bg-accent text-black font-black uppercase italic text-[8px] tracking-widest px-3 mb-2">Portfolio Universel</Badge>
                                                <p className="text-[10px] font-black uppercase text-accent/60 tracking-widest">Solde Libre</p>
                                                <p className="text-6xl font-black text-white italic">{user?.tokenBalance || 0} <span className="text-xl font-light opacity-40 not-italic">DKST</span></p>
                                                <p className="text-sm font-bold text-white/40 mt-2">≈ {(user?.tokenBalance || 0) / 314159} π (GCV)</p>
                                            </div>
                                            <div className="w-16 h-16 rounded-2xl bg-accent text-black flex items-center justify-center shadow-lg"><Wallet size={32} /></div>
                                        </div>

                                        <div className="p-8 bg-black/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 space-y-6">
                                            <div className="flex justify-between items-end">
                                                <p className="text-[8px] font-black uppercase opacity-40">Points convertibles</p>
                                                <span className="text-xs font-bold text-accent">{stats.availablePoints} / {POINTS_PER_TOKEN}</span>
                                            </div>
                                            <Progress value={stats.progress} className="h-2 bg-white/5" indicatorClassName="bg-accent" />
                                            <Button onClick={mintTokens} disabled={isMinting || stats.redeemableTokens < 1} className="w-full h-14 bg-accent text-black font-black uppercase italic rounded-xl gap-2 shadow-xl shadow-accent/10">
                                                {isMinting ? <Loader2 className="animate-spin" /> : <><RefreshCw size={18} /> Convertir les Points (Mint)</>}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-8">
                                    <div className="flex items-center gap-4"><Globe className="text-orange-500" size={24} /><h3 className="text-xl font-black uppercase italic tracking-tight">Sync Blockchain Pi</h3></div>
                                    {!user?.piWalletAddress ? (
                                        <div className="space-y-6">
                                            <p className="text-xs text-muted-foreground leading-relaxed italic">Associez votre adresse Pi pour synchroniser vos jetons sur le registre décentralisé.</p>
                                            <div className="flex gap-3">
                                                <Input value={tempPiAddress} onChange={(e) => setTempPiAddress(e.target.value)} placeholder="Adresse G..." className="h-14 bg-white/5 border-white/5 rounded-2xl text-xs font-mono" />
                                                <Button onClick={handleSavePiWallet} disabled={isSyncing} className="h-14 bg-white text-black px-6 rounded-2xl">{isSyncing ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 bg-green-500/5 rounded-[2rem] border border-green-500/20 flex flex-col items-center gap-4 text-center">
                                            <QrCode size={100} className="text-green-500 opacity-60" />
                                            <div className="space-y-1"><p className="text-[9px] font-black uppercase text-green-500">Mainnet Pi Connecté</p><p className="text-[10px] font-mono text-white/40 truncate w-48">{user.piWalletAddress}</p></div>
                                        </div>
                                    )}
                                </Card>
                            </div>

                            <div className="lg:col-span-7 space-y-8">
                                <Card className="glossy-card border-none rounded-[3rem] overflow-hidden flex-1">
                                    <CardHeader className="p-10 border-b border-white/5 bg-white/[0.02] flex flex-row justify-between items-center">
                                        <CardTitle className="text-xl font-black uppercase italic flex items-center gap-4"><History className="text-accent" /> Registre Ledger</CardTitle>
                                        <Badge variant="outline" className="border-accent/20 text-accent text-[8px] font-black uppercase">Simulated Hub-Net</Badge>
                                    </CardHeader>
                                    <div className="divide-y divide-white/5">
                                        {transactions && transactions.length > 0 ? transactions.map((tx) => (
                                            <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                                <div className="flex items-center gap-5">
                                                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-accent shadow-lg", tx.type === 'mint' || tx.type === 'unstaking' ? "bg-accent/10" : tx.type === 'staking' || tx.type === 'exchange' ? "bg-red-500/10 text-red-500" : "bg-primary/10")}>
                                                        {tx.type === 'mint' ? <RefreshCw size={20} /> : tx.type === 'staking' ? <Vault size={20} /> : tx.type === 'exchange' ? <Ticket size={20} /> : <Send size={20} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black uppercase italic tracking-tight">{tx.type.toUpperCase()} {tx.tokenAmount} DKST</p>
                                                        <div className="flex items-center gap-2 mt-1"><Lock size={10} className="text-green-500" /><p className="text-[9px] font-mono text-muted-foreground truncate max-w-[150px]">{tx.piTxId || "Hachage..."}</p></div>
                                                        {tx.memo && <p className="text-[9px] italic text-white/40 mt-1">"{tx.memo}"</p>}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[8px] font-black px-2 mb-1">Confirmed</Badge>
                                                    <p className="text-[9px] font-bold opacity-30 uppercase">{tx.createdAt?.toDate?.().toLocaleString()}</p>
                                                </div>
                                            </div>
                                        )) : <div className="p-20 text-center opacity-20 italic text-sm">Aucun historique blockchain.</div>}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ONGLET STAKING */}
                    <TabsContent value="staking" className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card className="bg-primary/10 border-primary/20 rounded-[3rem] p-10 flex flex-col justify-between h-[550px] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150"><Vault size={240} /></div>
                                <div className="space-y-8 relative z-10">
                                    <Badge className="bg-primary text-white border-none px-4 py-1.5 font-black uppercase italic">DKS VAULT CONTRACT</Badge>
                                    <div className="space-y-2">
                                        <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-tight text-white">GÉNÉREZ DU <br /><span className="text-primary">RENDEMENT</span></h2>
                                        <p className="text-sm text-white/60 font-bold uppercase">Taux d'intérêt annuel : 5% (APR)</p>
                                    </div>
                                    <div className="p-8 bg-black/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 space-y-6">
                                        <div className="flex justify-between items-end"><p className="text-[10px] font-black uppercase opacity-40">Votre dépôt actuel</p><span className="text-3xl font-black text-primary">{user?.stakedBalance || 0} DKST</span></div>
                                        <div className="flex justify-between items-end"><p className="text-[10px] font-black uppercase opacity-40">Intérêts cumulés</p><span className="text-xl font-black text-green-400">+{stats.stakingRewards.toFixed(4)} DKST</span></div>
                                        <Progress value={user?.stakedBalance ? 100 : 0} className="h-1.5 bg-white/5" indicatorClassName="bg-primary" />
                                        {user?.stakedBalance ? (
                                            <Button onClick={handleUnstake} disabled={isProcessingAction} className="w-full h-16 bg-white text-primary font-black uppercase italic rounded-2xl shadow-xl">Libérer le Vault (Unstake)</Button>
                                        ) : (
                                            <div className="space-y-4">
                                                <Input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} placeholder="Montant à bloquer..." className="h-14 bg-background/50 border-white/10 rounded-xl text-center font-black" />
                                                <Button onClick={handleStake} disabled={!stakeAmount || isProcessingAction} className="w-full h-16 bg-primary text-white font-black uppercase italic rounded-2xl shadow-xl">Activer le Contrat</Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-[9px] font-bold text-center uppercase opacity-30 italic mt-6">Les jetons stakés sont bloqués mais génèrent de la valeur passivement.</p>
                            </Card>

                            <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-8">
                                <div className="flex items-center gap-4"><TrendingUp size={24} className="text-primary" /><h2 className="text-xl font-black uppercase italic tracking-tight">Performances du Vault</h2></div>
                                <div className="space-y-6">
                                    {[
                                        { label: "Sécurisé par le Hub", desc: "Vos actifs sont protégés par la blockchain interne du Hub.", icon: <ShieldCheck /> },
                                        { label: "Rendement Quotidien", desc: "Les intérêts sont calculés et affichés en temps réel sur votre tableau de bord.", icon: <Timer /> },
                                        { label: "Boost de Mineur", desc: "Le staking pourrait bientôt augmenter votre puissance de minage nuagique.", icon: <Zap /> },
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-5 p-6 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">{item.icon}</div>
                                            <div className="space-y-1"><p className="font-bold text-sm uppercase italic">{item.label}</p><p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p></div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ONGLET ÉCHANGE (PRIVILÈGES) */}
                    <TabsContent value="exchange" className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {SHOP_PERKS.map((perk) => (
                                <Card key={perk.id} className="glossy-card border-none rounded-[3rem] overflow-hidden group relative">
                                    <div className="p-8 space-y-6 text-center">
                                        <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform">{perk.icon}</div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black uppercase italic leading-tight">{perk.title}</h3>
                                            <p className="text-xs text-muted-foreground leading-relaxed">{perk.description}</p>
                                        </div>
                                        <div className="pt-6 border-t border-white/5">
                                            <div className="flex items-center justify-center gap-2 mb-6">
                                                <Coins size={16} className="text-accent" />
                                                <span className="text-2xl font-black text-accent">{perk.cost} DKST</span>
                                            </div>
                                            <Button onClick={() => handleBuyPerk(perk)} disabled={isProcessingAction} className="w-full h-14 rounded-2xl bg-accent text-black font-black uppercase italic shadow-lg shadow-accent/10">Échanger mes Jetons</Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            {/* TRANSFER SHEET */}
            <Sheet open={isTransferSheetOpen} onOpenChange={setIsTransferSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">Envoyer des Jetons</SheetTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Échange Universel Elite</p>
                    </SheetHeader>
                    <div className="flex-1 p-8 space-y-8 overflow-y-auto">
                        <div className="space-y-6">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Chercher un membre</Label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Nom ou Email..." className="h-14 pl-12 bg-background/50 border-white/5 rounded-2xl" />
                            </div>
                            {searchQuery.length >= 3 && (
                                <div className="space-y-2">
                                    {isSearching ? <div className="py-4 text-center"><Loader2 className="animate-spin text-accent mx-auto" /></div> : searchResults.map((u) => (
                                        <button key={u.id} onClick={() => { setSelectedRecipient(u); setSearchQuery(""); }} className={cn("flex items-center gap-4 p-4 w-full rounded-xl border transition-all text-left", selectedRecipient?.id === u.id ? "bg-accent text-black" : "bg-white/5 border-white/5 hover:bg-white/10")}>
                                            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black bg-accent/10 text-accent">{u.name?.substring(0, 1)}</div>
                                            <div className="flex-1 overflow-hidden"><p className="text-xs font-bold uppercase truncate">{u.name}</p><p className="text-[9px] opacity-40 truncate">{u.email}</p></div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {selectedRecipient && (
                                <form onSubmit={handleTransfer} className="space-y-6 animate-in slide-in-from-bottom-4">
                                    <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-accent text-black flex items-center justify-center font-black italic">{selectedRecipient.name?.substring(0, 1)}</div><div><p className="text-[8px] font-black text-accent uppercase">Destinataire</p><p className="text-sm font-black uppercase italic">{selectedRecipient.name}</p></div></div>
                                        <Button variant="ghost" size="icon" onClick={() => setSelectedRecipient(null)}><X size={16}/></Button>
                                    </div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Montant (Max: {user?.tokenBalance})</Label><Input type="number" step="0.01" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-2xl text-2xl font-black text-accent" required /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60">Mémo</Label><Input value={transferMemo} onChange={(e) => setTransferMemo(e.target.value)} placeholder="Optionnel..." className="h-14 bg-background/50 border-white/5 rounded-2xl italic text-sm" /></div>
                                    <Button type="submit" disabled={isProcessingAction || !transferAmount} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20 text-lg gap-3">{isProcessingAction ? <Loader2 className="animate-spin" /> : <><Send size={22} /> Valider l'envoi</>}</Button>
                                </form>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default withAuth(UniversalWalletPage);
