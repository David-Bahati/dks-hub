
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
    X
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, updateDoc, doc, addDoc, serverTimestamp, increment, limit, getDocs } from 'firebase/firestore';
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

const POINTS_PER_TOKEN = 100;

function UniversalWalletPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isMinting, setIsMinting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isTransferSheetOpen, setIsTransferSheetOpen] = useState(false);
    const [isProcessingTransfer, setIsProcessingTransfer] = useState(false);
    const [tempPiAddress, setTempPiAddress] = useState("");

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
        return query(collection(db, "tokenTransactions"), where("userId", "==", user.uid), orderBy("createdAt", "desc"), limit(10));
    }, [user?.uid]);
    const { data: transactions } = useCollection(txQuery);

    const pointsStats = useMemo(() => {
        if (!user) return { totalPoints: 0, redeemableTokens: 0, progress: 0, availablePoints: 0 };

        let total = 0;

        if (isStaff) {
            total += (logs?.length || 0) * 10;
            // On ajoute une base de points pour les actions staff (SAV, Academy)
            // En prod, cela viendrait d'un calcul plus complexe en base
            total += (user.tokenBalance || 0) * 5; 
        } else {
            total += (orders?.length || 0) * 100; 
            total += (user.referralCount || 0) * 500; 
        }

        const availablePoints = total - (user.pointsConverted || 0);
        const redeemable = Math.floor(availablePoints / POINTS_PER_TOKEN);
        const progress = (availablePoints % POINTS_PER_TOKEN);

        return { totalPoints: total, availablePoints, redeemableTokens: redeemable, progress };
    }, [user, logs, orders, isStaff]);

    // Recipient Search Logic
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchQuery.length < 3) {
                setSearchResults([]);
                return;
            }
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
            } catch (e) {
                console.error(e);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery, user?.uid]);

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

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedRecipient || !transferAmount) return;
        
        const amount = parseFloat(transferAmount);
        if (amount > (user.tokenBalance || 0)) {
            toast({ title: "Solde insuffisant", variant: "destructive" });
            return;
        }

        setIsProcessingTransfer(true);
        try {
            const piTxId = `PI-P2P-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

            // 1. Debit sender
            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(-amount),
                updatedAt: serverTimestamp()
            });

            // 2. Credit recipient
            await updateDoc(doc(db, "users", selectedRecipient.id), {
                tokenBalance: increment(amount),
                updatedAt: serverTimestamp()
            });

            // 3. Log transaction for BOTH (sender sees it as transfer, recipient sees it as receiving)
            // In our system, we log one transaction that can be queried by both if we adjust the query,
            // but for simplicity in this prototype, we'll log it twice so it appears in both ledgers easily.
            
            // Log for Sender
            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid,
                userName: user.name,
                type: 'transfer',
                tokenAmount: amount,
                direction: 'sent',
                recipientId: selectedRecipient.id,
                recipientName: selectedRecipient.name || selectedRecipient.displayName,
                memo: transferMemo,
                piTxId: piTxId,
                createdAt: serverTimestamp()
            });

            // Log for Recipient
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

            // 4. Notify recipient
            await addDoc(collection(db, "notifications"), {
                userId: selectedRecipient.id,
                title: "DKST Reçu !",
                message: `${user.name} vous a envoyé ${amount} DKST.`,
                type: 'success',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/wallet'
            });

            toast({ title: "Transfert réussi", description: `${amount} DKST envoyés à ${selectedRecipient.name || selectedRecipient.displayName}` });
            setIsTransferSheetOpen(false);
            setTransferAmount("");
            setTransferMemo("");
            setSelectedRecipient(null);
            setSearchQuery("");
        } catch (error) {
            toast({ title: "Erreur transfert", variant: "destructive" });
        } finally {
            setIsProcessingTransfer(false);
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
                    <div className="flex gap-3">
                        <Button 
                            onClick={() => setIsTransferSheetOpen(true)}
                            className="bg-accent text-black hover:bg-accent/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-accent/20"
                        >
                            <Send size={20} /> Envoyer des DKST
                        </Button>
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
                                        <p className="text-[8px] font-black uppercase opacity-40">Points convertibles</p>
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
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center text-accent shadow-lg",
                                                tx.type === 'mint' ? "bg-accent/10" : "bg-primary/10"
                                            )}>
                                                {tx.type === 'mint' ? <RefreshCw size={20} className="animate-spin-slow" /> : <Send size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black uppercase italic tracking-tight">
                                                    {tx.type === 'mint' ? `Minting ${tx.tokenAmount} DKST` : `${tx.direction === 'sent' ? 'Envoi' : 'Réception'} ${tx.tokenAmount} DKST`}
                                                </p>
                                                <div className="flex flex-col gap-1 mt-1">
                                                    <div className="flex items-center gap-2">
                                                        <Lock size={10} className="text-green-500" />
                                                        <p className="text-[9px] font-mono text-muted-foreground truncate max-w-[200px]">{tx.piTxId || "Hachage en attente..."}</p>
                                                    </div>
                                                    {tx.memo && <p className="text-[9px] italic text-white/40">"{tx.memo}"</p>}
                                                    {tx.type === 'transfer' && (
                                                        <p className="text-[8px] font-bold uppercase text-accent/60">
                                                            {tx.direction === 'sent' ? `Vers: ${tx.recipientName}` : `De: ${tx.senderName}`}
                                                        </p>
                                                    )}
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

            {/* TRANSFER SHEET */}
            <Sheet open={isTransferSheetOpen} onOpenChange={setIsTransferSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">Transférer des DKST</SheetTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Échange Universel Elite</p>
                    </SheetHeader>
                    
                    <div className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Chercher un membre (Nom ou Email)</Label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                    <Input 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Min. 3 caractères..." 
                                        className="h-14 pl-12 bg-background/50 border-white/5 rounded-2xl focus:border-accent"
                                    />
                                </div>
                            </div>

                            {/* Search Results */}
                            {searchQuery.length >= 3 && (
                                <div className="space-y-2">
                                    {isSearching ? (
                                        <div className="py-4 text-center"><Loader2 className="animate-spin text-accent h-5 w-5 mx-auto" /></div>
                                    ) : searchResults.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                            {searchResults.map((u) => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => { setSelectedRecipient(u); setSearchQuery(""); setSearchResults([]); }}
                                                    className={cn(
                                                        "flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                                                        selectedRecipient?.id === u.id ? "bg-accent border-accent text-black" : "bg-white/5 border-white/5 text-white hover:bg-white/10"
                                                    )}
                                                >
                                                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-black", selectedRecipient?.id === u.id ? "bg-black text-accent" : "bg-accent/10 text-accent")}>
                                                        {u.name?.substring(0, 1) || u.displayName?.substring(0, 1)}
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-xs font-bold uppercase truncate">{u.name || u.displayName}</p>
                                                        <p className="text-[9px] opacity-40 truncate">{u.email}</p>
                                                    </div>
                                                    {selectedRecipient?.id === u.id && <CheckCircle2 size={18} />}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-center italic opacity-30 py-4 uppercase">Aucun membre trouvé</p>
                                    )}
                                </div>
                            )}

                            {selectedRecipient && (
                                <div className="p-5 bg-accent/5 border border-accent/20 rounded-2xl flex items-center justify-between animate-in zoom-in-95">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-accent text-black flex items-center justify-center font-black italic shadow-lg">
                                            {selectedRecipient.name?.substring(0, 1)}
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black uppercase text-accent">Destinataire Sélectionné</p>
                                            <p className="text-sm font-black uppercase italic">{selectedRecipient.name}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedRecipient(null)} className="h-8 w-8 text-white/20 hover:text-red-500">
                                        <X size={16} />
                                    </Button>
                                </div>
                            )}

                            {selectedRecipient && (
                                <form onSubmit={handleTransfer} className="space-y-6 animate-in slide-in-from-bottom-4">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Montant (Max: {user?.tokenBalance})</Label>
                                        <div className="relative">
                                            <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" size={20} />
                                            <Input 
                                                type="number"
                                                step="0.01"
                                                value={transferAmount}
                                                onChange={(e) => setTransferAmount(e.target.value)}
                                                className="h-16 pl-14 bg-background/50 border-white/5 rounded-2xl text-2xl font-black text-accent"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Message d'accompagnement (Optionnel)</Label>
                                        <Input 
                                            value={transferMemo}
                                            onChange={(e) => setTransferMemo(e.target.value)}
                                            placeholder="Ex: Merci pour ton aide !" 
                                            className="h-14 bg-background/50 border-white/5 rounded-2xl italic text-sm"
                                        />
                                    </div>
                                    <Button 
                                        type="submit" 
                                        disabled={isProcessingTransfer || !transferAmount || parseFloat(transferAmount) <= 0}
                                        className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20 text-lg gap-3"
                                    >
                                        {isProcessingTransfer ? <Loader2 className="animate-spin h-6 w-6" /> : <><Send size={22} /> Confirmer l'envoi</>}
                                    </Button>
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
