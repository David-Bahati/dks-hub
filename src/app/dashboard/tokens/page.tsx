
"use client";

import { useState, useMemo } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Coins, 
    ArrowLeft, 
    Loader2, 
    RefreshCw, 
    Send, 
    User, 
    Globe, 
    Lock, 
    ShieldCheck, 
    History,
    Search,
    QrCode,
    Zap,
    TrendingUp,
    Briefcase,
    Plus,
    X
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, doc, updateDoc, increment, onSnapshot, where } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle,
} from "@/components/ui/sheet";

function TokenEconomyPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isTransferSheetOpen, setIsTransferSheetOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [search, setSearch] = useState("");
    const [recipientId, setRecipientId] = useState("");
    const [transferAmount, setTransferAmount] = useState("");
    const [transferMemo, setTransferMemo] = useState("");

    // Fetch Global Ledger
    const transactionsQuery = useMemoFirebase(() => {
        return query(collection(db, "tokenTransactions"), orderBy("createdAt", "desc"), limit(50));
    }, []);
    const { data: transactions, isLoading: loadingTx } = useCollection(transactionsQuery);

    // Fetch All Staff for Transfer
    const staffQuery = useMemoFirebase(() => {
        return query(collection(db, "users"), where("role", "in", ["Admin", "Seller", "Cashier", "admin", "seller", "cashier"]));
    }, []);
    const { data: staff } = useCollection(staffQuery);

    const economyStats = useMemo(() => {
        if (!transactions) return { totalMinted: 0, totalTransferred: 0, txCount: 0 };
        
        let minted = 0;
        let transferred = 0;
        
        transactions.forEach(tx => {
            if (tx.type === 'mint') minted += tx.tokenAmount;
            if (tx.type === 'transfer') transferred += tx.tokenAmount;
        });

        return {
            totalMinted: minted,
            totalTransferred: transferred,
            txCount: transactions.length
        };
    }, [transactions]);

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !recipientId || !transferAmount) return;
        
        const amount = parseFloat(transferAmount);
        if (amount > (user.tokenBalance || 0)) {
            toast({ title: "Solde insuffisant", variant: "destructive" });
            return;
        }

        const recipient = staff?.find(s => s.id === recipientId);
        if (!recipient) return;

        setIsProcessing(true);
        try {
            const piTxId = `PI-P2P-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

            // 1. Debit sender
            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(-amount),
                updatedAt: serverTimestamp()
            });

            // 2. Credit recipient
            await updateDoc(doc(db, "users", recipient.id), {
                tokenBalance: increment(amount),
                updatedAt: serverTimestamp()
            });

            // 3. Log transaction
            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid,
                userName: user.name,
                type: 'transfer',
                tokenAmount: amount,
                senderId: user.uid,
                senderName: user.name,
                recipientId: recipient.id,
                recipientName: recipient.name || recipient.displayName,
                memo: transferMemo,
                piTxId: piTxId,
                createdAt: serverTimestamp()
            });

            // 4. Notify recipient
            await addDoc(collection(db, "notifications"), {
                userId: recipient.id,
                title: "DKST Reçu !",
                message: `${user.name} vous a envoyé ${amount} DKST.`,
                type: 'success',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/tokens'
            });

            toast({ title: "Transfert réussi", description: `${amount} DKST envoyés à ${recipient.name}` });
            setIsTransferSheetOpen(false);
            setTransferAmount("");
            setTransferMemo("");
            setRecipientId("");
        } catch (error) {
            toast({ title: "Erreur transfert", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredTransactions = transactions?.filter(tx => 
        tx.senderName?.toLowerCase().includes(search.toLowerCase()) || 
        tx.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
        tx.piTxId?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard">
                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0">
                                <ArrowLeft size={24} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Banque <span className="text-accent">DKST Central</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Explorateur de Jeton & Livre de Compte Blockchain</p>
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

                {/* STATS OVERVIEW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Card className="glossy-card border-none rounded-[2.5rem] p-8 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><Coins size={24} /></div>
                            <Badge variant="outline" className="border-accent/20 text-accent font-black text-[8px] uppercase">Market Cap</Badge>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-40">Masse Monétaire (Supply)</p>
                            <p className="text-4xl font-black text-white italic">{economyStats.totalMinted.toLocaleString()} <span className="text-sm opacity-40 not-italic">DKST</span></p>
                        </div>
                    </Card>
                    <Card className="glossy-card border-none rounded-[2.5rem] p-8 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><RefreshCw size={24} /></div>
                            <Badge variant="outline" className="border-primary/20 text-primary font-black text-[8px] uppercase">Active</Badge>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-40">Volume Échanges P2P</p>
                            <p className="text-4xl font-black text-white italic">{economyStats.totalTransferred.toLocaleString()} <span className="text-sm opacity-40 not-italic">DKST</span></p>
                        </div>
                    </Card>
                    <Card className="glossy-card border-none rounded-[2.5rem] p-8 space-y-4">
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400"><Globe size={24} /></div>
                            <Badge variant="outline" className="border-green-500/20 text-green-400 font-black text-[8px] uppercase">Sync</Badge>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase opacity-40">Transactions Blockchain</p>
                            <p className="text-4xl font-black text-white italic">{economyStats.txCount}</p>
                        </div>
                    </Card>
                </div>

                {/* EXPLORER SEARCH */}
                <div className="mb-10 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input 
                        placeholder="Chercher par ID de transaction, Expéditeur ou Destinataire..." 
                        className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl focus:border-accent"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* LEDGER TABLE */}
                <Card className="glossy-card border-none rounded-[3rem] overflow-hidden">
                    <CardHeader className="p-10 border-b border-white/5 bg-accent/5">
                        <CardTitle className="text-xl font-black uppercase italic flex items-center gap-4">
                            <History className="text-accent" /> Registre de Transaction Hub (Ledger)
                        </CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <th className="p-6">Transaction ID</th>
                                    <th className="p-6">Type</th>
                                    <th className="p-6">Flux</th>
                                    <th className="p-6">Montant</th>
                                    <th className="p-6">Date</th>
                                    <th className="p-6 text-right">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {loadingTx ? (
                                    <tr><td colSpan={6} className="p-20 text-center"><Loader2 className="animate-spin text-accent mx-auto" /></td></tr>
                                ) : filteredTransactions && filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-accent"><Lock size={14} /></div>
                                                    <code className="text-[10px] font-mono text-muted-foreground group-hover:text-accent transition-colors">{tx.piTxId || tx.id.substring(0, 12)}</code>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <Badge className={cn(
                                                    "border-none uppercase text-[8px] font-black",
                                                    tx.type === 'mint' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                                                )}>
                                                    {tx.type === 'mint' ? 'Minting (Points)' : 'Transfert P2P'}
                                                </Badge>
                                            </td>
                                            <td className="p-6">
                                                {tx.type === 'mint' ? (
                                                    <span className="text-[10px] font-bold uppercase text-white/60">Expert: {tx.userName}</span>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
                                                        <span className="text-white/60">{tx.senderName}</span>
                                                        <ArrowLeft className="rotate-180 h-3 w-3 text-accent" />
                                                        <span className="text-white/60">{tx.recipientName}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-6">
                                                <span className="text-lg font-black italic text-white">{tx.tokenAmount} <span className="text-[10px] opacity-40">DKST</span></span>
                                            </td>
                                            <td className="p-6">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleString('fr-FR') : 'Récemment'}</span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex items-center justify-end gap-2 text-green-400 text-[10px] font-black uppercase">
                                                    <CheckCircle2 size={12} /> Confirmed
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={6} className="p-20 text-center opacity-20 italic">Aucune transaction trouvée.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </main>

            {/* TRANSFER SHEET */}
            <Sheet open={isTransferSheetOpen} onOpenChange={setIsTransferSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">Envoyer des Jetons</SheetTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Reconnaissance P2P Expert</p>
                    </SheetHeader>
                    
                    <form onSubmit={handleTransfer} className="flex-1 p-8 space-y-8 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Destinataire Expert</Label>
                                <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {staff?.filter(s => s.id !== user?.uid).map(member => (
                                        <button 
                                            key={member.id}
                                            type="button"
                                            onClick={() => setRecipientId(member.id)}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                                                recipientId === member.id ? "bg-accent border-accent text-black" : "bg-white/5 border-white/5 text-white hover:bg-white/10"
                                            )}
                                        >
                                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-black", recipientId === member.id ? "bg-black text-accent" : "bg-accent/10 text-accent")}>
                                                {member.name?.substring(0, 1)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold uppercase">{member.name}</p>
                                                <p className={cn("text-[9px] font-black uppercase opacity-40", recipientId === member.id && "opacity-100")}>{member.role}</p>
                                            </div>
                                            {recipientId === member.id && <CheckCircle2 size={20} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Montant à transférer</Label>
                                <div className="relative">
                                    <Coins size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" />
                                    <Input 
                                        type="number"
                                        placeholder="0.00"
                                        className="h-14 pl-14 bg-background/50 border-white/5 rounded-2xl text-xl font-black text-accent"
                                        value={transferAmount}
                                        onChange={(e) => setTransferAmount(e.target.value)}
                                        required
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">MAX: {user?.tokenBalance || 0}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Mémo / Raison (Optionnel)</Label>
                                <Input 
                                    placeholder="Ex: Merci pour l'aide sur le SAV #123"
                                    className="h-14 bg-background/50 border-white/5 rounded-2xl italic text-sm"
                                    value={transferMemo}
                                    onChange={(e) => setTransferMemo(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="pt-8">
                            <Button type="submit" disabled={isProcessing || !recipientId} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20 text-lg gap-3">
                                {isProcessing ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Valider la Transaction</>}
                            </Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default withAuth(TokenEconomyPage);
