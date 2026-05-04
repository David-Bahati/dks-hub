
"use client";

import { useState, useMemo } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
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
    ShieldCheck,
    MessageCircle,
    ArrowRight,
    Share2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import withAuth from "@/components/auth/withAuth";
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

function AmbassadorProgramPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [hasCopied, setHasCopied] = useState(false);

    const referralCode = useMemo(() => {
        // En prod, ceci serait stocké en base. Ici on le génère de façon déterministe pour la démo.
        return user?.referralCode || `DKS-${user?.name?.substring(0, 3).toUpperCase()}-${user?.uid?.substring(0, 4).toUpperCase()}`;
    }, [user]);

    const stats = {
        referrals: user?.referralCount || 0,
        points: user?.points || 0,
        level: user?.loyaltyLevel || 'Bronze'
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`Rejoignez Double King Shop avec mon code expert : ${referralCode}`);
        setHasCopied(true);
        toast({ title: "Code Copié", description: "Partagez-le avec votre réseau à Bunia." });
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex items-center gap-4 mb-10">
                    <Link href="/dashboard">
                        <Button variant="outline" className="h-12 w-12 rounded-2xl border-white/10 p-0 transition-all hover:bg-accent/10 hover:text-accent"><ArrowLeft size={20} /></Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black uppercase italic tracking-tighter">Programme <span className="text-accent">Ambassadeur</span></h1>
                        <p className="text-muted-foreground text-sm uppercase font-bold tracking-widest opacity-40">Développez l'élite technologique de Bunia</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Colonne Statut & Carte Virtuelle */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="bg-gradient-to-br from-card to-background border-none rounded-[3rem] p-8 text-center relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Logo size="xl" /></div>
                            <div className="relative z-10">
                                <div className="w-24 h-24 bg-accent/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-accent shadow-[0_0_30px_rgba(56,189,248,0.3)] animate-pulse">
                                    {stats.level === 'Gold' ? <Crown size={48} /> : stats.level === 'Silver' ? <Star size={48} /> : <Trophy size={48} />}
                                </div>
                                <Badge className="bg-accent text-black font-black uppercase italic px-5 py-1.5 mb-4 text-[10px] tracking-widest">
                                    AMBASSADEUR {stats.level}
                                </Badge>
                                <h3 className="text-2xl font-black uppercase italic tracking-tight">{user?.name}</h3>
                                
                                <div className="mt-12 space-y-6">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Invitations actives</p>
                                        <span className="text-lg font-black text-accent">{stats.referrals} / 10</span>
                                    </div>
                                    <Progress value={(stats.referrals / 10) * 100} className="h-3 bg-white/5" indicatorClassName="bg-accent shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
                                    <p className="text-[8px] font-bold uppercase opacity-30 text-center tracking-tighter">Plus que {10 - stats.referrals} parrainages pour le grade Silver</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="glossy-card border-none rounded-[2.5rem] p-8 space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 italic flex items-center gap-2">
                                <Zap size={14} className="text-accent" /> Avantages Actuels
                            </h4>
                            <div className="space-y-4">
                                {[
                                    { t: "Priorité SAV 24h", active: true },
                                    { t: "Diagnostic PC Offert", active: stats.level !== 'Bronze' },
                                    { t: "Accès VIP Ateliers IA", active: stats.level === 'Gold' },
                                    { t: "Commision 5% sur Ventes", active: stats.level === 'Gold' }
                                ].map((p, i) => (
                                    <div key={i} className={`flex items-center gap-4 p-3 rounded-xl border ${p.active ? 'border-accent/10 bg-accent/5 text-white' : 'border-white/5 opacity-20'}`}>
                                        <Check size={14} className={p.active ? 'text-accent' : 'text-white/40'} />
                                        <span className="text-[10px] font-black uppercase tracking-tight">{p.t}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Colonne Actions & Gains */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="bg-primary/10 border-primary/20 rounded-[3rem] p-12 relative overflow-hidden group">
                            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary/20 rounded-full blur-[100px] group-hover:bg-primary/40 transition-all duration-1000" />
                            <div className="relative z-10 space-y-8">
                                <div className="space-y-4">
                                    <Badge className="bg-white/10 text-primary border-none font-black uppercase tracking-widest px-4 py-1">ÉLITE ITURI</Badge>
                                    <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-[0.9] text-white">
                                        VOTRE RÉSEAU <br /><span className="text-primary">VOTRE RÉPUTATION</span>
                                    </h2>
                                    <p className="text-muted-foreground text-sm max-w-lg leading-relaxed font-medium">
                                        Recommandez l'excellence technique à vos partenaires, entreprises ou amis. Pour chaque nouveau client "Hub" ou étudiant "Academy", vous débloquez des ressources d'élite pour votre propre matériel.
                                    </p>
                                </div>
                                
                                <div className="p-8 bg-black/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 flex flex-col sm:flex-row items-center gap-10 shadow-2xl">
                                    <div className="flex-1 space-y-3">
                                        <p className="text-[10px] font-black uppercase text-primary tracking-[0.3em]">Code Expert Unique</p>
                                        <code className="text-4xl font-black text-white tracking-[0.2em] font-mono">{referralCode}</code>
                                    </div>
                                    <div className="flex flex-col gap-3 w-full sm:w-auto">
                                        <Button onClick={copyToClipboard} className="h-16 px-10 rounded-2xl bg-primary text-white font-black uppercase italic gap-3 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                            {hasCopied ? <Check size={20} /> : <Copy size={20} />}
                                            {hasCopied ? "Code Copié !" : "Copier le code"}
                                        </Button>
                                        <Button variant="outline" className="h-12 border-white/10 rounded-xl gap-2 font-black uppercase italic text-[10px]" asChild>
                                            <a href={`https://wa.me/?text=Rejoignez%20le%20Hub%20Technologique%20Double%20King%20Shop%20à%20Bunia%20avec%20mon%20code%20expert%20:%20${referralCode}`} target="_blank" rel="noopener noreferrer">
                                                <MessageCircle size={16} className="text-green-500" /> Partager sur WhatsApp
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-6 relative overflow-hidden group">
                                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform"><Gift size={32}/></div>
                                <h4 className="text-xl font-black uppercase italic tracking-tight">Points Élite DKS</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed italic">
                                    Chaque parrainage actif vous crédite **500 Points DKS**. Ces points sont déductibles de vos achats de composants RTX ou de vos frais de formation IA.
                                </p>
                                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase opacity-40 tracking-widest">Solde actuel</span>
                                    <span className="text-2xl font-black text-orange-400">{stats.points} PTS</span>
                                </div>
                            </Card>

                            <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-6 relative overflow-hidden group">
                                <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform"><ShieldCheck size={32}/></div>
                                <h4 className="text-xl font-black uppercase italic tracking-tight">Statut Partenaire</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed italic">
                                    En atteignant le grade **Gold**, vous recevez un certificat officiel de "Partenaire Technologique DKS" et devenez un point de contact privilégié en Ituri.
                                </p>
                                <Button variant="ghost" className="p-0 h-auto font-black uppercase italic text-[10px] text-green-400 hover:text-green-300 gap-2">
                                    Voir le guide partenaire <ArrowRight size={14} />
                                </Button>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default withAuth(AmbassadorProgramPage);
