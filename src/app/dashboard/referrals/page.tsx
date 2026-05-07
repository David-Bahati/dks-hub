
"use client";

import { useState, useMemo, useRef } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Trophy, 
    Users, 
    Zap, 
    Gift, 
    Copy, 
    Check, 
    ArrowLeft, 
    Star, 
    Crown, 
    MessageCircle,
    ArrowRight,
    Coins,
    Percent,
    FileBadge,
    Download,
    Loader2,
    ShieldCheck,
    QrCode,
    Activity,
    Flame,
    Clock,
    UserCheck,
    Search
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import withAuth from "@/components/auth/withAuth";
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/ui/Logo";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cn } from "@/lib/utils";
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, differenceInHours } from 'date-fns';
import { fr } from 'date-fns/locale';

function AmbassadorProgramPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [hasCopied, setHasCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const certRef = useRef<HTMLDivElement>(null);

    // Fetch referred users
    const referralsQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return query(
            collection(db, "users"), 
            where("referredBy", "==", user.uid),
            orderBy("createdAt", "desc")
        );
    }, [user?.uid]);

    const { data: referrals, isLoading: loadingReferrals } = useCollection(referralsQuery);

    const referralCode = useMemo(() => {
        return user?.referralCode || `DKS-${user?.name?.substring(0, 3).toUpperCase()}-${user?.uid?.substring(0, 4).toUpperCase()}`;
    }, [user]);

    const stats = {
        referrals: referrals?.length || 0,
        points: user?.points || 0,
        level: user?.loyaltyLevel || 'Bronze',
        discount: Math.min(25, (referrals?.length || 0) * 5)
    };

    const isGold = stats.level === 'Gold';

    const copyToClipboard = () => {
        const link = `${window.location.origin}/register?ref=${referralCode}`;
        navigator.clipboard.writeText(`Rejoignez le Hub Double King Shop avec mon code expert pour obtenir une remise : ${link}`);
        setHasCopied(true);
        toast({ title: "Lien Copié", description: "Partagez l'excellence technologique avec votre réseau." });
        setTimeout(() => setHasCopied(false), 2000);
    };

    const handleDownloadPartnerCert = async () => {
        if (!certRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`CERTIF_PARTENAIRE_DKS_${user?.name?.replace(/\s+/g, '_')}.pdf`);
            toast({ title: "Certificat généré", description: "Votre titre de Partenaire Officiel est prêt pour l'impression." });
        } catch (error) {
            toast({ title: "Erreur génération", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    const checkMiningStatus = (lastMiningAt: any) => {
        if (!lastMiningAt) return false;
        const lastDate = lastMiningAt?.toDate ? lastMiningAt.toDate() : new Date(lastMiningAt);
        const hours = differenceInHours(new Date(), lastDate);
        return hours < 24;
    };

    const filteredReferrals = useMemo(() => {
        if (!referrals) return [];
        return referrals.filter(r => 
            r.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            r.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [referrals, searchTerm]);

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 p-0 transition-all hover:bg-accent/10 hover:text-accent"><ArrowLeft size={24} /></Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Programme <span className="text-accent">Ambassadeur Élite</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-bold tracking-widest opacity-40 mt-1">Développez l'écosystème technologique de l'Ituri</p>
                        </div>
                    </div>

                    {isGold && (
                        <Button 
                            onClick={handleDownloadPartnerCert}
                            disabled={isGenerating}
                            className="h-14 px-8 rounded-2xl bg-yellow-500 text-black font-black uppercase italic gap-3 shadow-xl shadow-yellow-500/20 hover:scale-105 transition-all"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <><FileBadge size={20} /> Certificat Partenaire</>}
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Carte Statut Ambassadeur */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card className="bg-gradient-to-br from-accent/20 via-background to-black border-accent/20 rounded-[3.5rem] p-10 text-center relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-6 opacity-10 scale-150 rotate-12"><Logo size="xl" /></div>
                            <div className="relative z-10">
                                <div className="w-28 h-28 bg-accent/20 rounded-[3rem] flex items-center justify-center mx-auto mb-8 text-accent shadow-[0_0_40px_rgba(56,189,248,0.3)]">
                                    {stats.level === 'Gold' ? <Crown size={56} /> : stats.level === 'Silver' ? <Star size={56} /> : <Trophy size={56} />}
                                </div>
                                <Badge className="bg-accent text-black font-black uppercase italic px-6 py-2 mb-6 text-[10px] tracking-widest rounded-full">
                                    AMBASSADEUR {stats.level}
                                </Badge>
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter truncate">{user?.name}</h3>
                                
                                <div className="mt-14 space-y-6">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Mon Réseau</p>
                                        <span className="text-xl font-black text-accent italic">{stats.referrals} Membres</span>
                                    </div>
                                    <Progress value={Math.min(100, (stats.referrals / 10) * 100)} className="h-2.5 bg-white/5" indicatorClassName="bg-accent shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
                                </div>
                            </div>
                        </Card>

                        <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-8">
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 italic flex items-center gap-2">
                                <Zap size={14} className="text-accent" /> Avantages Actifs
                            </h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-5 p-5 bg-accent/5 rounded-2xl border border-accent/20">
                                    <div className="w-12 h-12 rounded-xl bg-accent text-black flex items-center justify-center shrink-0 shadow-lg shadow-accent/10"><Percent size={24} /></div>
                                    <div>
                                        <p className="font-black text-xs uppercase italic text-accent">Remise Services -{stats.discount}%</p>
                                        <p className="text-[9px] text-white/40 uppercase font-bold mt-1">Sur Academy & SAV</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 p-5 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><Coins size={24} className="text-orange-400" /></div>
                                    <div>
                                        <p className="font-black text-xs uppercase italic">Bonus Points</p>
                                        <p className="text-[9px] text-white/40 uppercase font-bold mt-1">+500 PTS par admission</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Zone de Partage et Liste des Filleuls */}
                    <div className="lg:col-span-8 space-y-10">
                        <Card className="bg-primary/10 border-primary/20 rounded-[3.5rem] p-10 md:p-14 relative overflow-hidden group shadow-2xl">
                            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-[120px]" />
                            <div className="relative z-10 space-y-8">
                                <div className="space-y-4">
                                    <Badge className="bg-white/10 text-primary border-none font-black uppercase tracking-[0.3em] px-4 py-1 italic text-[9px]">DKS HUB NETWORK</Badge>
                                    <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-[0.85] text-white">
                                        VOTRE LIEN <br /><span className="text-primary">D'EXCELLENCE</span>
                                    </h2>
                                </div>
                                
                                <div className="p-8 bg-black/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 flex flex-col sm:flex-row items-center gap-10">
                                    <div className="flex-1 space-y-2">
                                        <p className="text-[9px] font-black uppercase text-primary tracking-[0.4em] ml-1">Partagez l'écosystème</p>
                                        <div className="p-3 bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                                            <p className="text-[10px] font-mono text-primary truncate">{typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${referralCode}` : '...'}</p>
                                        </div>
                                    </div>
                                    <Button onClick={copyToClipboard} className="h-16 px-8 rounded-2xl bg-primary text-white font-black uppercase italic gap-3 shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-sm shrink-0">
                                        {hasCopied ? <Check size={20} /> : <Copy size={20} />} {hasCopied ? "Copié" : "Copier"}
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* LISTE DES MEMBRES INVITÉS */}
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><Users size={20}/></div>
                                    <h3 className="text-xl font-black uppercase italic">Membres <span className="text-accent">du Réseau</span></h3>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                                    <Input 
                                        placeholder="Chercher un membre..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="h-10 pl-9 bg-white/5 border-white/10 rounded-xl text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {loadingReferrals ? (
                                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-10 w-10" /></div>
                                ) : filteredReferrals.length > 0 ? (
                                    filteredReferrals.map((referral) => {
                                        const isMining = checkMiningStatus(referral.lastMiningAt);
                                        return (
                                            <Card key={referral.id} className="bg-white/[0.02] border-white/5 rounded-[2rem] overflow-hidden group hover:bg-white/[0.05] transition-all">
                                                <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center font-black text-xl italic text-accent shrink-0 border border-white/5">
                                                        {(referral.name || referral.displayName || "?").substring(0, 1)}
                                                    </div>
                                                    
                                                    <div className="flex-1 space-y-1 text-center md:text-left">
                                                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                                                            <h4 className="font-black uppercase italic text-sm">{referral.name || referral.displayName}</h4>
                                                            <Badge variant="outline" className="border-white/10 text-[8px] font-black uppercase text-white/40">{referral.loyaltyLevel || 'Bronze'}</Badge>
                                                        </div>
                                                        <div className="flex items-center justify-center md:justify-start gap-4 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                                            <span className="flex items-center gap-1.5"><Clock size={10} /> Inscrit le {referral.createdAt?.toDate ? format(referral.createdAt.toDate(), "dd MMM yyyy", { locale: fr }) : "Récemment"}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-8 shrink-0">
                                                        <div className="text-center">
                                                            <p className="text-[8px] font-black uppercase text-white/20 mb-1 tracking-widest">Puissance</p>
                                                            <div className="flex items-center gap-1.5 justify-center">
                                                                <Zap size={10} className="text-accent" />
                                                                <span className="text-xs font-black text-white">{(referral.miningPower || 1.0).toFixed(1)} GH/s</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col items-center gap-2 min-w-[120px]">
                                                            <p className="text-[8px] font-black uppercase text-white/20 tracking-widest">Statut Minage</p>
                                                            {isMining ? (
                                                                <Badge className="bg-green-500 text-black border-none px-3 py-1 uppercase text-[8px] font-black flex items-center gap-1.5 animate-pulse">
                                                                    <Activity size={10} /> Extraction Active
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-white/5 border-white/10 text-muted-foreground uppercase text-[8px] font-black px-3 py-1 flex items-center gap-1.5">
                                                                    <Clock size={10} /> Inactif
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })
                                ) : (
                                    <div className="py-20 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-4">
                                        <Users size={48} strokeWidth={1} />
                                        <p className="text-[10px] font-black uppercase tracking-widest italic">Aucun parrainage actif.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* MODÈLE DE CERTIFICAT CACHÉ (Inchangé) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div ref={certRef} className="bg-white text-black p-0 w-[1123px] h-[794px] font-serif relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 border-[40px] border-double border-[#1e293b]" />
                    <div className="absolute inset-10 border-4 border-yellow-600/20" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none"><Logo size="xl" /></div>
                    <div className="relative z-10 text-center w-full px-40 space-y-12">
                        <div className="flex flex-col items-center gap-6">
                            <Logo size="lg" />
                            <div className="space-y-1">
                                <h2 className="text-sm font-bold tracking-[0.4em] uppercase text-yellow-600">Double King Foundation</h2>
                                <p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-40">Bunia Hub • RDC</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 font-black uppercase italic tracking-[0.3em] px-6 py-2">Membre Élite Ambassadeur Gold</Badge>
                            <h1 className="text-6xl font-black uppercase italic tracking-tighter text-[#1e293b]">TITRE DE PARTENAIRE</h1>
                            <p className="text-xl font-light italic text-gray-500 uppercase tracking-widest">Écosystème Technologique Hybride</p>
                        </div>
                        <div className="space-y-8 py-10 bg-yellow-50/30 rounded-[3rem] border border-yellow-100">
                            <p className="text-lg font-medium text-gray-500">Nous certifions officiellement que</p>
                            <h3 className="text-5xl font-black uppercase tracking-tight border-b-2 border-yellow-200 inline-block pb-2 px-14 italic">{user?.name}</h3>
                            <p className="text-lg font-medium text-gray-600 max-w-2xl mx-auto leading-relaxed italic px-10">Est reconnu comme **Partenaire Stratégique du Hub DKS** pour son implication exceptionnelle dans le rayonnement technologique de la province de l'Ituri.</p>
                        </div>
                        <div className="grid grid-cols-3 items-end pt-12">
                            <div className="text-center space-y-2"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Délivré le</p><p className="text-sm font-bold">{new Date().toLocaleDateString('fr-FR')}</p></div>
                            <div className="flex flex-col items-center gap-4"><div className="p-3 border-2 border-gray-100 rounded-2xl bg-white shadow-xl"><QrCode size={60} className="opacity-20" /></div><p className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">ID-PARTNER: {user?.uid.substring(0, 10).toUpperCase()}</p></div>
                            <div className="text-center space-y-4"><div className="w-40 h-px bg-gray-200 mx-auto" /><div className="flex flex-col items-center"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Direction Générale</p><p className="text-sm font-black italic">Expert Bahati Nyeke</p><ShieldCheck size={24} className="text-yellow-600 mt-2 opacity-30" /></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(AmbassadorProgramPage);
