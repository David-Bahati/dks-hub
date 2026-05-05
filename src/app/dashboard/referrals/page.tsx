
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
    QrCode
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

function AmbassadorProgramPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [hasCopied, setHasCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const certRef = useRef<HTMLDivElement>(null);

    const referralCode = useMemo(() => {
        return user?.referralCode || `DKS-${user?.name?.substring(0, 3).toUpperCase()}-${user?.uid?.substring(0, 4).toUpperCase()}`;
    }, [user]);

    const stats = {
        referrals: user?.referralCount || 0,
        points: user?.points || 0,
        level: user?.loyaltyLevel || 'Bronze',
        discount: Math.min(25, (user?.referralCount || 0) * 5)
    };

    const isGold = stats.level === 'Gold';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`Rejoignez le Hub Double King Shop avec mon code expert pour obtenir une remise : ${referralCode}`);
        setHasCopied(true);
        toast({ title: "Code Copié", description: "Partagez l'excellence technologique avec votre réseau." });
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

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Carte Statut Ambassadeur */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-gradient-to-br from-accent/20 via-background to-black border-accent/20 rounded-[3.5rem] p-10 text-center relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-6 opacity-10 scale-150 rotate-12"><Logo size="xl" /></div>
                            <div className="relative z-10">
                                <div className="w-28 h-28 bg-accent/20 rounded-[3rem] flex items-center justify-center mx-auto mb-8 text-accent shadow-[0_0_40px_rgba(56,189,248,0.3)] animate-pulse">
                                    {stats.level === 'Gold' ? <Crown size={56} /> : stats.level === 'Silver' ? <Star size={56} /> : <Trophy size={56} />}
                                </div>
                                <Badge className="bg-accent text-black font-black uppercase italic px-6 py-2 mb-6 text-[10px] tracking-widest rounded-full">
                                    AMBASSADEUR {stats.level}
                                </Badge>
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter">{user?.name}</h3>
                                
                                <div className="mt-14 space-y-6">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Filleuls Actifs</p>
                                        <span className="text-xl font-black text-accent italic">{stats.referrals} / 10</span>
                                    </div>
                                    <Progress value={(stats.referrals / 10) * 100} className="h-2.5 bg-white/5" indicatorClassName="bg-accent shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
                                    <div className="flex justify-center gap-4">
                                        <Badge variant="outline" className="border-white/10 text-white/40 text-[8px] font-black uppercase">Bronze</Badge>
                                        <Badge variant="outline" className="border-white/10 text-white/40 text-[8px] font-black uppercase">Silver (10)</Badge>
                                        <Badge variant="outline" className="border-white/10 text-white/40 text-[8px] font-black uppercase">Gold (25)</Badge>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Avantages Dynamiques */}
                        <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-8">
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 italic flex items-center gap-2">
                                <Zap size={14} className="text-accent" /> Privilèges d'Influenceur
                            </h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-5 p-5 bg-accent/5 rounded-2xl border border-accent/20 transition-all group hover:scale-[1.02]">
                                    <div className="w-12 h-12 rounded-xl bg-accent text-black flex items-center justify-center shrink-0 shadow-lg shadow-accent/10"><Percent size={24} /></div>
                                    <div>
                                        <p className="font-black text-xs uppercase italic text-accent">Remise Services -{stats.discount}%</p>
                                        <p className="text-[9px] text-white/40 uppercase font-bold mt-1">Valable sur Academy & SAV</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 p-5 bg-white/5 rounded-2xl border border-white/5 transition-all group hover:scale-[1.02]">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><Coins size={24} className="text-orange-400" /></div>
                                    <div>
                                        <p className="font-black text-xs uppercase italic">Bonus Points</p>
                                        <p className="text-[9px] text-white/40 uppercase font-bold mt-1">+500 PTS par nouveau stagiaire</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Zone d'action et Partage */}
                    <div className="lg:col-span-8 space-y-8">
                        <Card className="bg-primary/10 border-primary/20 rounded-[4rem] p-12 md:p-20 relative overflow-hidden group shadow-2xl">
                            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-primary/20 rounded-full blur-[120px] group-hover:bg-primary/40 transition-all duration-1000" />
                            <div className="relative z-10 space-y-12">
                                <div className="space-y-6">
                                    <Badge className="bg-white/10 text-primary border-none font-black uppercase tracking-[0.3em] px-6 py-2 italic text-[10px]">REJOIGNEZ LA FONDATION DKS</Badge>
                                    <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.85] text-white">
                                        PROTÉGEZ <br /><span className="text-primary">VOTRE RÉPUTATION</span>
                                    </h2>
                                    <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed font-medium">
                                        Le Hub appartient à ceux qui le construisent. En parrainant de nouveaux stagiaires à l'Academy ou des entreprises pour nos solutions réseaux, vous réduisez vos propres coûts d'équipement et d'expertise.
                                    </p>
                                </div>
                                
                                <div className="p-10 bg-black/60 backdrop-blur-3xl rounded-[3rem] border border-white/10 flex flex-col sm:flex-row items-center gap-12 shadow-inner">
                                    <div className="flex-1 space-y-4">
                                        <p className="text-[10px] font-black uppercase text-primary tracking-[0.4em] ml-2">Code Ambassadeur Unique</p>
                                        <div className="p-4 bg-white/5 rounded-2xl inline-block">
                                            <code className="text-4xl md:text-5xl font-black text-white tracking-[0.15em] font-mono">{referralCode}</code>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4 w-full sm:w-auto min-w-[240px]">
                                        <Button onClick={copyToClipboard} className="h-16 px-10 rounded-2xl bg-primary text-white font-black uppercase italic gap-3 shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-sm">
                                            {hasCopied ? <Check size={24} /> : <Copy size={24} />}
                                            {hasCopied ? "Copié !" : "Copier mon Code"}
                                        </Button>
                                        <Button variant="outline" className="h-14 border-white/10 rounded-2xl gap-3 font-black uppercase italic text-[10px] tracking-widest hover:bg-green-500/10 hover:text-green-400" asChild>
                                            <a href={`https://wa.me/?text=Bonjour,%20rejoignez%20le%20Hub%20Technologique%20Double%20King%20Shop%20à%20Bunia%20avec%20mon%20code%20expert%20pour%20obtenir%20une%20remise%20sur%20votre%20formation%20IA%20:%20${referralCode}`} target="_blank" rel="noopener noreferrer">
                                                <MessageCircle size={18} /> Partager sur WhatsApp
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="glossy-card border-none rounded-[3rem] p-12 space-y-6 relative overflow-hidden group">
                                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform shadow-lg"><Gift size={36}/></div>
                                <h4 className="text-2xl font-black uppercase italic tracking-tight">Récompense Directe</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed italic">
                                    En plus des remises sur les services, recevez **500 Points Prestige** convertibles en DKST pour chaque parrainage validé après le premier cours.
                                </p>
                                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Points acquis par parrainage</span>
                                    <Badge className="bg-orange-500 text-white font-black italic px-3">+500 PTS</Badge>
                                </div>
                            </Card>

                            <Card className="glossy-card border-none rounded-[3rem] p-12 space-y-6 relative overflow-hidden group">
                                <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform shadow-lg"><ArrowRight size={36}/></div>
                                <h4 className="text-2xl font-black uppercase italic tracking-tight">Échelle de Grade</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed italic">
                                    Atteignez le grade **Silver** (10 parrainages) ou **Gold** (25 parrainages) pour débloquer les commissions directes sur les ventes hardware du Hub.
                                </p>
                                <Button variant="ghost" className="p-0 h-auto font-black uppercase italic text-[10px] text-green-400 hover:text-green-300 gap-2 mt-4">
                                    Voir la grille des commissions <ArrowRight size={14} />
                                </Button>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            {/* MODÈLE DE CERTIFICAT DE PARTENAIRE CACHÉ */}
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
                            <h3 className="text-5xl font-black uppercase tracking-tight border-b-2 border-yellow-200 inline-block pb-2 px-14 italic">
                                {user?.name}
                            </h3>
                            <p className="text-lg font-medium text-gray-600 max-w-2xl mx-auto leading-relaxed italic px-10">
                                Est reconnu comme **Partenaire Stratégique du Hub DKS** pour son implication exceptionnelle dans le rayonnement technologique de la province de l'Ituri.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 items-end pt-12">
                            <div className="text-center space-y-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Délivré le</p>
                                <p className="text-sm font-bold">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                            <div className="flex flex-col items-center gap-4">
                                <div className="p-3 border-2 border-gray-100 rounded-2xl bg-white shadow-xl"><QrCode size={60} className="opacity-20" /></div>
                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">ID-PARTNER: {user?.uid.substring(0, 10).toUpperCase()}</p>
                            </div>
                            <div className="text-center space-y-4">
                                <div className="w-40 h-px bg-gray-200 mx-auto" />
                                <div className="flex flex-col items-center">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Direction Générale</p>
                                    <p className="text-sm font-black italic">Expert Bahati Nyeke</p>
                                    <ShieldCheck size={24} className="text-yellow-600 mt-2 opacity-30" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-bl-full -z-10" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/5 rounded-tr-full -z-10" />
                </div>
            </div>
        </div>
    );
}

export default withAuth(AmbassadorProgramPage);
