
"use client";

import { useState, useMemo } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Scale, 
    ArrowLeft, 
    Loader2, 
    UserX, 
    UserCheck, 
    HeartPulse, 
    ShieldAlert, 
    Clock, 
    ArrowRight,
    Gavel,
    FileText,
    History,
    Search,
    CheckCircle2
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, updateDoc, doc, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";

function NotaryManagementPage() {
    const { user: admin } = useAuth();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Fetch users with beneficiaries and potentially expired heartbeats
    const successionQuery = useMemoFirebase(() => {
        return query(collection(db, "users"), where("beneficiaryId", "!=", null));
    }, []);

    const { data: users, isLoading } = useCollection(successionQuery);

    const dossiers = useMemo(() => {
        if (!users) return [];
        
        return users.map(u => {
            const lastActive = u.lastActivityAt?.toDate ? u.lastActivityAt.toDate() : new Date(u.lastActivityAt || u.createdAt);
            const daysInactive = differenceInDays(new Date(), lastActive);
            const threshold = u.heritageThresholdDays || 90;
            const isExpired = daysInactive >= threshold;

            return {
                ...u,
                lastActive,
                daysInactive,
                threshold,
                isExpired,
                urgency: isExpired ? 'critical' : daysInactive > threshold * 0.8 ? 'warning' : 'normal'
            };
        }).filter(u => u.isExpired || admin?.role === 'Admin'); // Admins see all for monitoring
    }, [users, admin]);

    const executeSuccession = async (deceased: any) => {
        if (!window.confirm(`Confirmer l'exécution de la succession de ${deceased.name} vers ${deceased.beneficiaryName} ?`)) return;
        
        setProcessingId(deceased.id);
        try {
            const totalTokens = (deceased.tokenBalance || 0) + (deceased.stakedBalance || 0);
            const piTxId = `HERITAGE-EXEC-${deceased.id.substring(0,6)}-${Date.now()}`;

            // 1. Transfer to Beneficiary
            await updateDoc(doc(db, "users", deceased.beneficiaryId), {
                tokenBalance: increment(totalTokens),
                updatedAt: serverTimestamp()
            });

            // 2. Clear Deceased Balances
            await updateDoc(doc(db, "users", deceased.id), {
                tokenBalance: 0,
                stakedBalance: 0,
                stakingStartedAt: null,
                beneficiaryId: null, // Succession completed
                isWalletLocked: true, // Archive account
                updatedAt: serverTimestamp()
            });

            // 3. Log Official Transaction
            await addDoc(collection(db, "tokenTransactions"), {
                userId: deceased.beneficiaryId,
                userName: deceased.beneficiaryName,
                type: 'heritage',
                tokenAmount: totalTokens,
                senderId: deceased.id,
                senderName: deceased.name,
                memo: `SUCCESSION NOTARIÉE : Transfert des actifs de ${deceased.name} (Inactif >${deceased.threshold}j)`,
                piTxId: piTxId,
                createdAt: serverTimestamp()
            });

            // 4. Notify Beneficiary
            await addDoc(collection(db, "notifications"), {
                userId: deceased.beneficiaryId,
                title: "Succession DKS Exécutée",
                message: `Le Notaire du Hub a validé le transfert de ${totalTokens.toFixed(2)} DKST suite à l'héritage de ${deceased.name}.`,
                type: 'success',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/wallet'
            });

            toast({ title: "Succession Validée", description: "Les actifs ont été transmis au bénéficiaire." });
        } catch (error) {
            toast({ title: "Erreur Notariale", variant: "destructive" });
        } finally {
            setProcessingId(null);
        }
    };

    if (admin?.role?.toLowerCase() !== 'admin') {
        return <div className="p-20 text-center uppercase font-black italic opacity-20">Accès réservé au Sceau du Hub.</div>;
    }

    const filteredDossiers = dossiers.filter(d => 
        d.name?.toLowerCase().includes(search.toLowerCase()) || 
        d.beneficiaryName?.toLowerCase().includes(search.toLowerCase())
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
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Notaire <span className="text-accent">du Hub</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Supervision des transmissions d'actifs intergénérationnelles</p>
                        </div>
                    </div>
                    <div className="flex bg-accent/10 border border-accent/20 px-6 py-2 rounded-2xl items-center gap-4 shadow-xl shadow-accent/5">
                        <Gavel className="text-accent" size={24} />
                        <div>
                            <p className="text-[8px] font-black uppercase opacity-60">Sceau d'Autorité</p>
                            <p className="text-sm font-black uppercase italic">Validateur Certifié DKS</p>
                        </div>
                    </div>
                </div>

                <div className="mb-10 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input 
                        placeholder="Chercher un dossier par nom..." 
                        className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl focus:border-accent"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                    ) : filteredDossiers.length > 0 ? (
                        filteredDossiers.map((dossier) => (
                            <Card key={dossier.id} className={cn(
                                "glossy-card border-none rounded-[2.5rem] overflow-hidden group transition-all",
                                dossier.isExpired && "bg-red-500/[0.03] border-l-4 border-l-red-500"
                            )}>
                                <CardContent className="p-8 flex flex-col lg:flex-row items-center gap-10">
                                    <div className={cn(
                                        "w-20 h-20 rounded-[2rem] flex items-center justify-center shrink-0 shadow-lg",
                                        dossier.isExpired ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-white/5 text-muted-foreground"
                                    )}>
                                        <UserX size={36} />
                                    </div>
                                    
                                    <div className="flex-1 space-y-4 text-center md:text-left">
                                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                                            <h3 className="text-2xl font-black uppercase italic tracking-tight">{dossier.name}</h3>
                                            {dossier.isExpired ? (
                                                <Badge className="bg-red-500 text-white border-none uppercase text-[8px] font-black px-3 py-1">Succession Ouverte</Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-white/10 text-white/40 uppercase text-[8px] font-black">Heartbeat Actif</Badge>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] font-black uppercase italic text-muted-foreground/60 tracking-widest">
                                            <div className="flex items-center gap-2"><Clock size={12} className="text-accent" /> Inactif depuis: {dossier.daysInactive} jours</div>
                                            <div className="flex items-center gap-2"><ShieldAlert size={12} className="text-accent" /> Seuil Test: {dossier.threshold} jours</div>
                                            <div className="flex items-center gap-2"><UserCheck size={12} className="text-green-400" /> Héritier: {dossier.beneficiaryName}</div>
                                        </div>

                                        <div className="p-5 bg-black/40 rounded-2xl border border-white/5 flex flex-wrap gap-10">
                                            <div>
                                                <p className="text-[8px] font-black uppercase opacity-40 mb-1">Masse Successorale (DKST)</p>
                                                <p className="text-xl font-black text-white italic">{( (dossier.tokenBalance || 0) + (dossier.stakedBalance || 0) ).toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black uppercase opacity-40 mb-1">Dernière Pulsation</p>
                                                <p className="text-sm font-bold text-white/60">{format(dossier.lastActive, "dd MMMM yyyy", { locale: fr })}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 shrink-0 min-w-[240px]">
                                        <Button 
                                            disabled={!dossier.isExpired || processingId === dossier.id}
                                            onClick={() => executeSuccession(dossier)}
                                            className={cn(
                                                "w-full h-14 rounded-2xl font-black uppercase italic text-[10px] gap-3 shadow-xl transition-all",
                                                dossier.isExpired ? "bg-accent text-black hover:bg-accent/90" : "bg-white/5 text-white/20"
                                            )}
                                        >
                                            {processingId === dossier.id ? <Loader2 className="animate-spin" /> : <><Scale size={18} /> Exécuter la Succession</>}
                                        </Button>
                                        <Button variant="outline" className="h-12 border-white/10 text-white rounded-xl font-black uppercase italic text-[9px] gap-2">
                                            <FileText size={14} /> Consulter Preuve de décès
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                            <Scale size={80} strokeWidth={1} />
                            <p className="text-xl font-black uppercase italic tracking-tighter">Aucun dossier en attente</p>
                            <p className="text-xs max-w-sm uppercase font-black tracking-widest leading-relaxed">Les successions n'apparaissent ici que si le Dead Man's Switch d'un membre est déclenché.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default withAuth(NotaryManagementPage);
