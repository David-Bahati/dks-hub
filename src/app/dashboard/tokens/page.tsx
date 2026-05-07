
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
    X,
    Banknote,
    BadgeCheck,
    AlertCircle,
    Building2,
    PieChart,
    Users,
    ArrowUpCircle,
    DollarSign,
    HeartPulse,
    LayoutDashboard,
    Flame,
    ArrowDownCircle
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, doc, updateDoc, increment, getDocs, where, Timestamp } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useDoc, useMemoFirebase } from '@/firebase';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TOTAL_SUPPLY = 50000000;
const DISTRIBUTION = {
    ceo: 0.20, // 20% - 10M
    team: 0.15, // 15% - 7.5M
    members: 0.65 // 65% - 32.5M
};

const HALVING_STEPS = [
    { label: "Phase 1", limit: 8000000, reward: "100%", multiplier: "x1.0" },
    { label: "Phase 2", limit: 16000000, reward: "50%", multiplier: "x0.5" },
    { label: "Phase 3", limit: 24000000, reward: "25%", multiplier: "x0.25" },
    { label: "Phase 4", limit: 32500000, reward: "12.5%", multiplier: "x0.125" },
];

function TokenEconomyPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isTransferSheetOpen, setIsTransferSheetOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDistributingDividends, setIsDistributingDividends] = useState(false);
    const [search, setSearch] = useState("");
    const [recipientId, setRecipientId] = useState("");
    const [transferAmount, setTransferAmount] = useState("");
    const [transferMemo, setTransferMemo] = useState("");

    // Fetch Treasury
    const treasuryRef = useMemoFirebase(() => doc(db, "system", "treasury"), []);
    const { data: treasury, isLoading: loadingTreasury } = useDoc(treasuryRef);

    // Fetch Global Ledger
    const transactionsQuery = useMemoFirebase(() => {
        return query(collection(db, "tokenTransactions"), orderBy("createdAt", "desc"), limit(50));
    }, []);
    const { data: transactions, isLoading: loadingTx } = useCollection(transactionsQuery);

    // Fetch All Users
    const allUsersQuery = useMemoFirebase(() => collection(db, "users"), []);
    const { data: allUsers } = useCollection(allUsersQuery);

    const economyStats = useMemo(() => {
        const totalMinted = treasury?.totalMinted || 0;
        const communitySupply = TOTAL_SUPPLY * DISTRIBUTION.members;
        const mintedPct = (totalMinted / TOTAL_SUPPLY) * 100;
        const communityPct = (totalMinted / communitySupply) * 100;

        return {
            totalMinted,
            mintedPct,
            communityPct,
            communitySupply,
            remainingCommunity: communitySupply - totalMinted
        };
    }, [treasury]);

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !recipientId || !transferAmount) return;
        
        const amount = parseFloat(transferAmount);
        if (amount > (user.tokenBalance || 0)) {
            toast({ title: "Solde insuffisant", variant: "destructive" });
            return;
        }

        const recipient = allUsers?.find(s => s.id === recipientId);
        if (!recipient) return;

        setIsProcessing(true);
        try {
            const piTxId = `PI-P2P-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;

            await updateDoc(doc(db, "users", user.uid), {
                tokenBalance: increment(-amount),
                updatedAt: serverTimestamp()
            });

            await updateDoc(doc(db, "users", recipient.id), {
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
                recipientId: recipient.id,
                recipientName: recipient.name || recipient.displayName,
                memo: transferMemo,
                piTxId: piTxId,
                createdAt: serverTimestamp()
            });

            await addDoc(collection(db, "tokenTransactions"), {
                userId: recipient.id,
                userName: recipient.name || recipient.displayName,
                type: 'transfer',
                tokenAmount: amount,
                direction: 'received',
                senderId: user.uid,
                senderName: user.name,
                memo: transferMemo,
                piTxId: piTxId,
                createdAt: serverTimestamp()
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

    const handleDistributeDividends = async () => {
        if (!user || user.role?.toLowerCase() !== 'admin') return;
        if (!window.confirm("Lancer la distribution hebdomadaire des dividendes (0.5% PIB Hub) ?")) return;

        setIsDistributingDividends(true);
        try {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const activeUsers = allUsers?.filter(u => {
                const lastActive = u.lastActivityAt?.toDate ? u.lastActivityAt.toDate() : new Date(u.lastActivityAt || u.createdAt);
                return lastActive >= sevenDaysAgo;
            });

            if (!activeUsers || activeUsers.length === 0) {
                toast({ title: "Aucun utilisateur actif", description: "Attendez plus d'activité dans le Hub." });
                return;
            }

            const dividendRate = 0.005;
            const batchPromises = activeUsers.map(async (u) => {
                const totalWealth = (u.tokenBalance || 0) + (u.stakedBalance || 0);
                const dividendAmount = parseFloat((totalWealth * dividendRate).toFixed(6));
                if (dividendAmount <= 0) return;

                await updateDoc(doc(db, "users", u.id), {
                    tokenBalance: increment(dividendAmount),
                    updatedAt: serverTimestamp()
                });

                await addDoc(collection(db, "tokenTransactions"), {
                    userId: u.id,
                    userName: u.name || u.displayName,
                    type: 'dividend',
                    tokenAmount: dividendAmount,
                    memo: `Dividende PIB Hub`,
                    createdAt: serverTimestamp()
                });
            });

            await Promise.all(batchPromises);
            toast({ title: "Dividendes distribués !", description: `${activeUsers.length} membres crédités.` });
        } catch (error) {
            toast({ title: "Erreur distribution", variant: "destructive" });
        } finally {
            setIsDistributingDividends(false);
        }
    };

    const filteredTransactions = transactions?.filter(tx => 
        tx.senderName?.toLowerCase().includes(search.toLowerCase()) || 
        tx.recipientName?.toLowerCase().includes(search.toLowerCase()) ||
        tx.userName?.toLowerCase().includes(search.toLowerCase()) ||
        tx.piTxId?.toLowerCase().includes(search.toLowerCase())
    );

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
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">BANQUE <span className="text-accent">DKST CENTRAL</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Gouvernance de la Masse Monétaire & Trésorerie Hub</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {user?.role?.toLowerCase() === 'admin' && (
                            <Button 
                                onClick={handleDistributeDividends} 
                                disabled={isDistributingDividends}
                                className="bg-primary text-white hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl"
                            >
                                {isDistributingDividends ? <Loader2 className="animate-spin" /> : <><Banknote size={20} /> Verser Dividendes</>}
                            </Button>
                        )}
                        <Button 
                            onClick={() => setIsTransferSheetOpen(true)}
                            className="bg-accent text-black hover:bg-accent/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-accent/20"
                        >
                            <Send size={20} /> Envoyer Jetons
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="tokenomics" className="space-y-10">
                    <TabsList className="bg-white/5 border border-white/5 p-1.5 rounded-[1.5rem] h-16 w-full max-w-md mx-auto flex">
                        <TabsTrigger value="tokenomics" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">
                            <PieChart size={14} className="mr-2" /> Tokenomics
                        </TabsTrigger>
                        <TabsTrigger value="treasury" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">
                            <Building2 size={14} className="mr-2" /> Trésorerie Hub
                        </TabsTrigger>
                        <TabsTrigger value="ledger" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">
                            <History size={14} className="mr-2" /> Registre
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="tokenomics" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <Card className="lg:col-span-5 bg-gradient-to-br from-accent/10 to-background border-accent/20 rounded-[3rem] p-12 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><Coins size={120} /></div>
                                <div className="relative z-10 space-y-8">
                                    <div>
                                        <Badge className="bg-accent text-black font-black uppercase italic text-[9px] px-4 py-1 mb-4">Masse Monétaire Fixée</Badge>
                                        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">50 000 000 <br /><span className="text-accent">DKST TOTAL</span></h3>
                                    </div>
                                    
                                    <div className="space-y-6 pt-6 border-t border-white/5">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase text-white/40">
                                                <span>Extraction Communautaire</span>
                                                <span className="text-accent">{economyStats.mintedPct.toFixed(2)}%</span>
                                            </div>
                                            <Progress value={economyStats.mintedPct} className="h-2.5 bg-white/5" indicatorClassName="bg-accent" />
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-500 flex items-center justify-center font-black">20%</div>
                                                    <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">Réserve CEO & Fondation</span>
                                                </div>
                                                <span className="text-xs font-black text-white">10M DKST</span>
                                            </div>
                                            <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center font-black">15%</div>
                                                    <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">Allocation Staff & Team</span>
                                                </div>
                                                <span className="text-xs font-black text-white">7.5M DKST</span>
                                            </div>
                                            <div className="p-5 bg-accent/5 rounded-2xl border border-accent/20 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center font-black">65%</div>
                                                    <span className="text-[10px] font-black uppercase text-accent tracking-widest">Pool de Minage Membres</span>
                                                </div>
                                                <span className="text-xs font-black text-accent">32.5M DKST</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="lg:col-span-7 space-y-8">
                                <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-5"><Flame size={100} className="text-orange-500" /></div>
                                    <div className="relative z-10 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500"><ArrowDownCircle size={28}/></div>
                                            <h4 className="text-xl font-black uppercase italic tracking-tight">Cycle de Halving</h4>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                                            "Pour garantir la rareté, les récompenses de minage diminuent par paliers de 8,000,000 DKST extraits de la pool communautaire."
                                        </p>
                                        <div className="grid grid-cols-1 gap-3">
                                            {HALVING_STEPS.map((step, idx) => (
                                                <div key={idx} className={cn(
                                                    "p-5 rounded-2xl border flex items-center justify-between transition-all",
                                                    (economyStats.totalMinted >= step.limit - 8000000 && economyStats.totalMinted < step.limit) 
                                                        ? "bg-orange-500/10 border-orange-500/30 text-white" 
                                                        : economyStats.totalMinted >= step.limit ? "bg-white/5 border-white/5 opacity-40" : "bg-white/5 border-white/5 opacity-80"
                                                )}>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                                                        <span className="text-[8px] font-bold opacity-40">CAP: {(step.limit/1000000).toFixed(1)}M</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className="border-orange-500/20 text-orange-400 font-black text-[9px] uppercase">{step.reward} REWARD</Badge>
                                                        <span className="text-xs font-black italic">{step.multiplier}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>

                                <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-6 bg-primary/5 border-primary/10">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary"><TrendingUp size={28}/></div>
                                    <h4 className="text-xl font-black uppercase italic tracking-tight text-white">Stabilité GCV</h4>
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Garantie par le Hub</p>
                                    <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                                        <p className="text-[9px] font-black uppercase text-white/40 mb-1">Indexation</p>
                                        <p className="text-lg font-black text-white">1 π = $314,159.00</p>
                                        <p className="text-[8px] font-bold text-primary uppercase mt-2">Zéro Frais à Bunia</p>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="treasury" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="bg-white/5 border-white/5 rounded-[2rem] p-8 space-y-4">
                                <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Trésorerie DKST</p>
                                <p className="text-3xl font-black text-white italic">{treasury?.dkstBalance?.toLocaleString() || 0}</p>
                            </Card>
                            <Card className="bg-white/5 border-white/5 rounded-[2rem] p-8 space-y-4">
                                <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Réserve Pi (π)</p>
                                <p className="text-3xl font-black text-yellow-500 italic">{treasury?.piBalance?.toFixed(6) || 0}</p>
                            </Card>
                            <Card className="bg-white/5 border-white/5 rounded-[2rem] p-8 space-y-4">
                                <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Fonds Propres (USD)</p>
                                <p className="text-3xl font-black text-green-400 italic">${treasury?.usdBalance?.toLocaleString() || 0}</p>
                            </Card>
                            <Card className="bg-white/5 border-white/5 rounded-[2rem] p-8 space-y-4">
                                <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Liquidité CDF</p>
                                <p className="text-2xl font-black text-white italic">{treasury?.cdfBalance?.toLocaleString() || 0} <span className="text-xs opacity-20">CDF</span></p>
                            </Card>
                        </div>

                        <Card className="glossy-card border-none rounded-[3rem] overflow-hidden">
                            <CardHeader className="p-10 border-b border-white/5 bg-accent/5">
                                <CardTitle className="text-xl font-black uppercase italic flex items-center gap-4">
                                    <TrendingUp className="text-accent" /> Sources de Revenus (Entrées)
                                </CardTitle>
                            </CardHeader>
                            <div className="divide-y divide-white/5">
                                {transactions?.filter(tx => tx.source).slice(0, 10).map((tx) => (
                                    <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-accent">
                                                {tx.source === 'sav_repair' ? <Wrench size={20}/> : tx.source === 'service_hub' ? <GraduationCap size={20}/> : <ShoppingCart size={20}/>}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold uppercase italic">{tx.source?.replace('_', ' ').toUpperCase()}</p>
                                                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">Client: {tx.userName}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-white">+${tx.tokenAmount.toFixed(2)}</p>
                                            <p className="text-[8px] font-bold opacity-30 uppercase">{tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleString() : 'Récemment'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="ledger" className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        <div className="relative">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <Input 
                                placeholder="Chercher dans le grand livre..." 
                                className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl focus:border-accent"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <Card className="glossy-card border-none rounded-[3rem] overflow-hidden">
                             <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            <th className="p-6">Transaction ID</th>
                                            <th className="p-6">Type</th>
                                            <th className="p-6">Flux</th>
                                            <th className="p-6">Montant</th>
                                            <th className="p-6 text-right">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm">
                                        {filteredTransactions?.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="p-6 font-mono text-[10px] text-muted-foreground">{tx.piTxId || tx.id.substring(0, 12)}</td>
                                                <td className="p-6">
                                                    <Badge className={cn(
                                                        "border-none uppercase text-[8px] font-black",
                                                        tx.type === 'mining' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
                                                    )}>{tx.type}</Badge>
                                                </td>
                                                <td className="p-6">
                                                    <span className="text-[10px] font-bold uppercase text-white/60">{tx.userName || tx.senderName}</span>
                                                </td>
                                                <td className="p-6">
                                                    <span className="text-lg font-black text-white">{tx.tokenAmount.toFixed(4)} <span className="text-[10px] opacity-40">DKST</span></span>
                                                </td>
                                                <td className="p-6 text-right text-green-400 text-[10px] font-black uppercase">Confirmed</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                            <div><SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">Envoyer des Jetons</SheetTitle><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Échange Universel DKS</p></div>
                        </div>
                    </SheetHeader>
                    <div className="flex-1 p-10 space-y-10 overflow-y-auto">
                        <form onSubmit={handleTransfer} className="space-y-10">
                            <div className="space-y-6">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Destinataire</Label>
                                <Select value={recipientId} onValueChange={setRecipientId}>
                                    <SelectTrigger className="h-14 bg-background/50 border-white/10 rounded-2xl focus:border-accent">
                                        <SelectValue placeholder="Choisir un membre" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-white/10">
                                        {allUsers?.filter(u => u.id !== user?.uid).map(u => (
                                            <SelectItem key={u.id} value={u.id} className="font-bold uppercase text-[10px]">{u.name || u.displayName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Montant</Label>
                                    <div className="relative">
                                        <Coins className="absolute left-6 top-1/2 -translate-y-1/2 text-accent" size={24} />
                                        <Input type="number" step="0.01" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="h-20 pl-16 bg-background/50 border-white/10 rounded-[2rem] text-4xl font-black text-accent" required />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Mémo</Label>
                                    <Input value={transferMemo} onChange={(e) => setTransferMemo(e.target.value)} placeholder="Ex: Service Hub..." className="h-14 bg-background/50 border-white/10 rounded-2xl italic text-sm" />
                                </div>
                            </div>
                            <Button type="submit" disabled={isProcessing || !recipientId} className="w-full h-20 bg-accent text-black font-black uppercase italic rounded-[2rem] shadow-2xl text-xl gap-4">
                                {isProcessing ? <Loader2 className="animate-spin" /> : <><Send size={24} /> Envoyer</>}
                            </Button>
                        </form>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default withAuth(TokenEconomyPage);
