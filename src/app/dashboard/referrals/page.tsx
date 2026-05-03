
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
        return user?.referralCode || `DKS-${user?.name?.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
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
                        <Button variant="outline" className="h-12 w-12 rounded-2xl border-white/10 p-0"><ArrowLeft size={20} /></Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black uppercase italic tracking-tighter">Cercle des <span className="text-accent">Ambassadeurs</span></h1>
                        <p className="text-muted-foreground text-sm">Devenez un partenaire de l'excellence technologique à Bunia.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Colonne Statut */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="glossy-card border-none rounded-[2.5rem] p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Crown size={80} className="text-accent" /></div>
                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-accent/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-accent shadow-[0_0_30px_rgba(56,189,248,0.2)]">
                                    {stats.level === 'Gold' ? <Crown size={40} /> : stats.level === 'Silver' ? <Star size={40} /> : <Trophy size={40} />}
                                </div>
                                <Badge className="bg-accent text-black font-black uppercase italic px-4 py-1 mb-2">Membre {stats.level}</Badge>
                                <h3 className="text-xl font-black uppercase italic">{user?.name}</h3>
                                <div className="mt-8 space-y-4">
                                    <div className="flex justify-between text-[10px] font-black uppercase opacity-40">
                                        <span>Progression vers Silver</span>
                                        <span>{stats.referrals}/5 Invitations</span>
                                    </div>
                                    <Progress value={(stats.referrals / 5) * 100} className="h-2 bg-white/5" indicatorClassName="bg-accent" />
                                </div>
                            </div>
                        </Card>

                        <Card className="glossy-card border-none rounded-[2.5rem] p-6 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Vos Privilèges Actuels</h4>
                            <ul className="space-y-3">
                                {[
                                    { t: "Priorité SAV 24h", active: true },
                                    { t: "Diagnostic PC Offert", active: stats.level !== 'Bronze' },
                                    { t: "Accès VIP Ateliers IA", active: stats.level === 'Gold' }
                                ].map((p, i) => (
                                    <li key={i} className={`flex items-center gap-3 text-xs font-bold ${p.active ? 'text-white' : 'text-white/20 line-through'}`}>
                                        <Check size={14} className={p.active ? 'text-accent' : 'text-white/10'} /> {p.t}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    </div>

                    {/* Colonne Actions & Explications */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="bg-primary/10 border-primary/20 rounded-[2.5rem] p-10 relative overflow-hidden group">
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/40 transition-all duration-700" />
                            <div className="relative z-10 space-y-6">
                                <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none text-white">DÉVELOPPEZ VOTRE <br /><span className="text-primary">RÉSEAU TECH</span></h2>
                                <p className="text-muted-foreground text-sm max-w-md leading-relaxed">
                                    Invitez vos collègues ou entreprises partenaires à rejoindre le Hub DKS. Pour chaque nouveau membre actif, vous débloquez des avantages exclusifs pour votre propre matériel.
                                </p>
                                
                                <div className="p-6 bg-black/40 rounded-3xl border border-white/5 flex flex-col sm:flex-row items-center gap-6">
                                    <div className="flex-1 space-y-2">
                                        <p className="text-[10px] font-black uppercase text-primary tracking-widest">Votre Code Expert Unique</p>
                                        <code className="text-2xl font-black text-white tracking-widest">{referralCode}</code>
                                    </div>
                                    <Button onClick={copyToClipboard} className="h-14 px-8 rounded-xl bg-primary text-white font-black uppercase italic gap-2 shadow-xl">
                                        {hasCopied ? <Check size={18} /> : <Copy size={18} />}
                                        {hasCopied ? "Copié !" : "Copier"}
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="glossy-card border-none rounded-[2.5rem] p-8 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400"><Gift size={24}/></div>
                                <h4 className="font-black uppercase italic text-sm">Gains Ambassadeur</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Chaque parrainage réussi vous rapporte 500 Points DKS, utilisables pour payer vos formations IA ou vos upgrades hardware.
                                </p>
                            </Card>
                            <Card className="glossy-card border-none rounded-[2.5rem] p-8 space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400"><ShieldCheck size={24}/></div>
                                <h4 className="font-black uppercase italic text-sm">Élite Ituri</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Les membres Gold reçoivent un certificat officiel "Partenaire Tech DKS" et un accès prioritaire aux nouveaux stocks.
                                </p>
                            </Card>
                        </div>

                        <div className="pt-6">
                            <Button variant="outline" className="w-full h-16 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 gap-3 font-black uppercase italic text-xs" asChild>
                                <a href={`https://wa.me/?text=Rejoignez%20le%20Hub%20Technologique%20Double%20King%20Shop%20à%20Bunia%20avec%20mon%20code%20expert%20:%20${referralCode}`} target="_blank" rel="noopener noreferrer">
                                    <MessageCircle size={20} className="text-green-500" /> Partager sur WhatsApp
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default withAuth(AmbassadorProgramPage);
