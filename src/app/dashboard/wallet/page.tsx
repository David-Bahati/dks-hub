
"use client";

import { useMemo, useState, useRef } from 'react';
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
    Briefcase,
    Plus,
    Wallet,
    Award,
    Star,
    Crown,
    Gift,
    Smartphone,
    Info,
    ExternalLink
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, updateDoc, doc, addDoc, serverTimestamp, increment, limit } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input";
import { Logo } from '@/components/ui/Logo';

const POINTS_PER_TOKEN = 100;

function UniversalWalletPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isMinting, setIsMinting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [tempPiAddress, setTempPiAddress] = useState("");

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
        return query(collection(db, "tokenTransactions"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(10));
    }, [user?.uid]);
    const { data: transactions } = useCollection(txQuery);

    const pointsStats = useMemo(() => {
        if (!user) return { totalPoints: 0, redeemableTokens: 0, progress: 0 };

        let total = 0;

        if (isStaff) {
            // Staff logic (SAV, Academy, Logs - Simplified for wallet view)
            total += (logs?.length || 0) * 10;
            total += (user.tokenBalance || 0) * 20; // Simulated point history
        } else {
            // Customer logic
            total += (orders?.length || 0) * 100; // 100 pts per completed order
            total += (user.referralCount || 0) * 500; // 500 pts per referral
        }

        const availablePoints = total - (user.pointsConverted || 0);
        const redeemable = Math.floor(availablePoints / POINTS_PER_TOKEN);
        const progress = (availablePoints % POINTS_PER_TOKEN);

        return { totalPoints: total, availablePoints, redeemableTokens: redeemable, progress };
    }, [user, logs, orders, isStaff]);

    const handleSavePiWallet = async () => {
        if (!user || !tempPiAddress) return;
        setIsSyncing(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                piWalletAddress: tempPiAddress,
                updatedAt: serverTimestamp()
            });
            toast({ title: "Wallet Pi Associé", description: "Votre identité blockchain est liée à votre compte DKS." });
            setTempPiAddress("");
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsSyncing(false);
        }
    };

    const mintTokens = async () => {
        if (!user || pointsStats.redeemableTokens < 1) return;

        setIsMinting(true);
        try {
            const tokensToMint = pointsStats.redeemableTokens;
            const pointsToConvert = tokensToMint * POINTS_PER_TOKEN;
            const simulatedPiTxId = `PI-MINT-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                tokenBalance: increment(tokensToMint),
                pointsConverted: increment(pointsToConvert),
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid,
                userName: user.name,
                type: 'mint',
                pointsAmount: pointsToConvert,
                tokenAmount: tokensToMint,
                piTxId: simulatedPiTxId,
                createdAt: serverTimestamp()
            });

            toast({ 
                title: "Points Blockchain-Verified !", 
                description: `Vous avez généré ${tokensToMint} DKST. Transaction enregistrée sur le simulateur Pi.` 
            });
        } catch (error) {
            toast({ title: "Erreur de frappe", variant: "destructive" });
        } finally {
            setIsMinting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard">
                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0 transition-all">
                                <ArrowLeft size={24} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Mon Wallet <span className="text-accent">DKST</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Gérez vos actifs numériques & conversion de récompenses</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* CARTE DE SOLDE PRINCIPALE */}
                    <div className="lg:col-span-5 space-y-8">
                        <Card className="bg-accent/10 border-accent/20 rounded-[3rem] p-10 space-y-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><Coins size={200} /></div>
                            
                            <div className="relative z-10 space-y-8">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <Badge className="bg-accent text-black font-black uppercase italic text-[8px] tracking-widest px-3 mb-2">ACTIF DÉCENTRALISÉ</Badge>
                                        <p className="text-[10px] font-black uppercase text-accent/60 tracking-widest">Solde Global</p>
                                        <p className="text-6xl font-black text-white italic">{user?.tokenBalance || 0} <span className="text-xl font-light opacity-40 not-italic">DKST</span></p>
                                    </div>
                                    <div className="w-16 h-16 rounded-2xl bg-accent text-black flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.4)]">
                                        <Wallet size={32} />
                                    </div>
                                </div>

                                <div className="p-8 bg-black/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 space-y-6">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black uppercase opacity-40">Points convertibles</p>
                                        <span className="text-xs font-bold text-accent">{pointsStats.availablePoints} / {POINTS_PER_TOKEN}</span>
                                    </div>
                                    <Progress value={pointsStats.progress} className="h-2 bg-white/5" indicatorClassName="bg-accent shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
                                    
                                    <Button 
                                        onClick={mintTokens} 
                                        disabled={isMinting || pointsStats.redeemableTokens < 1}
                                        className="w-full h-14 bg-accent text-black font-black uppercase italic rounded-xl gap-2 shadow-xl shadow-accent/10"
                                    >
                                        {isMinting ? <Loader2 className="animate-spin h-5 w-5" /> : <><RefreshCw size={18} /> Convertir en DKST (Mint)</>}
                                    </Button>
                                    <p className="text-[8px] font-bold text-center uppercase text-white/30 tracking-widest italic">Taux : 100 points = 1 Jeton DKST</p>
                                </div>
                            </div>
                        </Card>

                        {/* PI NETWORK SYNC SECTION */}
                        <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500"><Globe size={24} /></div>
                                <h3 className="text-xl font-black uppercase italic tracking-tight">Sync Blockchain Pi</h3>
                            </div>

                            {!user?.piWalletAddress ? (
                                <div className="space-y-6">
                                    <p className="text-xs text-muted-foreground leading-relaxed">Associez votre portefeuille Pi pour synchroniser vos DKST sur le Mainnet décentralisé.</p>
                                    <div className="flex gap-3">
                                        <Input 
                                            value={tempPiAddress} 
                                            onChange={(e) => setTempPiAddress(e.target.value)}
                                            placeholder="Adresse publique G..." 
                                            className="h-14 bg-white/5 border-white/5 rounded-2xl text-xs font-mono" 
                                        />
                                        <Button onClick={handleSavePiWallet} disabled={isSyncing} className="h-14 bg-white text-black px-6 rounded-2xl">
                                            {isSyncing ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-6 bg-green-500/5 rounded-[2rem] border border-green-500/20 flex flex-col items-center gap-4">
                                        <QrCode size={120} className="text-green-500 opacity-60" />
                                        <div className="text-center space-y-1">
                                            <p className="text-[9px] font-black uppercase text-green-500">Adresse Pi Connectée</p>
                                            <p className="text-[10px] font-mono text-white/40 truncate w-64">{user.piWalletAddress}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" className="w-full text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white">Désassocier le portefeuille</Button>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* REGISTRE DES TRANSACTIONS */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><TrendingUp size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase opacity-40">Points Gagnés (Cumul)</p>
                                    <p className="text-3xl font-black italic">{pointsStats.totalPoints} PTS</p>
                                </div>
                            </Card>
                            <Card className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><Award size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase opacity-40">Statut de Valeur</p>
                                    <p className="text-xl font-black italic uppercase text-accent">Certifié Hub DKS</p>
                                </div>
                            </Card>
                        </div>

                        <Card className="glossy-card border-none rounded-[3rem] overflow-hidden flex-1">
                            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.02] flex flex-row justify-between items-center">
                                <CardTitle className="text-xl font-black uppercase italic flex items-center gap-4">
                                    <History className="text-accent" /> Registre de Transaction
                                </CardTitle>
                                <Badge variant="outline" className="border-accent/20 text-accent text-[8px] font-black uppercase">Vérifié Blockchain</Badge>
                            </CardHeader>
                            <div className="divide-y divide-white/5">
                                {transactions && transactions.length > 0 ? transactions.map((tx) => (
                                    <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-lg">
                                                <RefreshCw size={20} className="animate-spin-slow" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black uppercase italic tracking-tight">Minting {tx.tokenAmount} DKST</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Lock size={10} className="text-green-500" />
                                                    <p className="text-[9px] font-mono text-muted-foreground truncate max-w-[250px]">{tx.piTxId || "Hachage en attente..."}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[8px] font-black px-2 mb-1">Confirmed</Badge>
                                            <p className="text-[9px] font-bold opacity-30 uppercase">{tx.createdAt?.toDate?.().toLocaleString()}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-20 text-center opacity-20 italic text-sm flex flex-col items-center gap-4">
                                        <Info size={48} />
                                        <p className="uppercase font-black tracking-widest">Aucun historique blockchain.</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                        
                        <div className="p-8 bg-accent/5 rounded-[2.5rem] border border-accent/10 flex gap-6 items-center">
                            <Star className="text-accent shrink-0" size={32} />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Les jetons **DKST** sont utilisables pour obtenir des remises exclusives sur le matériel RTX, payer vos formations à l'Academy ou être échangés entre membres de l'élite DKS.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default withAuth(UniversalWalletPage);
