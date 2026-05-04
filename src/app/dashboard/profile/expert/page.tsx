
"use client";

import { useMemo } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Award, 
    Zap, 
    ArrowLeft, 
    Loader2, 
    Trophy, 
    Target, 
    GraduationCap, 
    Wrench, 
    BookText, 
    CheckCircle2, 
    Star, 
    History as HistoryIcon,
    ShieldCheck,
    Cpu,
    Briefcase,
    Crown
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { 
    Radar, 
    RadarChart, 
    PolarGrid, 
    PolarAngleAxis, 
    PolarRadiusAxis, 
    ResponsiveContainer 
} from 'recharts';

function ExpertProfilePage() {
    const { user } = useAuth();

    // Fetch User Logs for Prestige
    const logsQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return query(collection(db, "technicianLogs"), where("userId", "==", user.uid));
    }, [user?.uid]);
    const { data: logs, isLoading: loadingLogs } = useCollection(logsQuery);

    // Fetch User Academy sessions
    const academyQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return query(collection(db, "serviceBookings"), where("technicianId", "==", user.uid), where("status", "==", "completed"));
    }, [user?.uid]);
    const { data: academySessions, isLoading: loadingAcademy } = useCollection(academyQuery);

    // Fetch SAV tickets handled (simulated via messages for now or status)
    const savQuery = useMemoFirebase(() => {
        return query(collection(db, "supportTickets"), where("status", "==", "completed"));
    }, []);
    const { data: savTickets, isLoading: loadingSAV } = useCollection(savQuery);

    const careerStats = useMemo(() => {
        if (!user || !logs) return null;

        const myLogs = logs || [];
        const myAcademy = academySessions || [];
        // We'll filter SAV by messages where I am the technician if direct ID not yet populated
        const mySAVCount = savTickets?.filter(t => t.technicianId === user.uid).length || 0;

        const stats = {
            logs: myLogs.length,
            academy: myAcademy.length,
            sav: mySAVCount,
            totalActions: myLogs.length + myAcademy.length + mySAVCount
        };

        // Badge Logic (Reuse existing logic)
        const badges = [];
        if (stats.totalActions >= 100) badges.push({ id: 'legend', label: 'Légende DKS', icon: <Crown size={14} />, color: 'bg-yellow-500/20 text-yellow-500' });
        else if (stats.totalActions >= 50) badges.push({ id: 'expert', label: 'Expert Senior', icon: <ShieldCheck size={14} />, color: 'bg-accent/20 text-accent' });
        else if (stats.totalActions >= 10) badges.push({ id: 'confirmed', label: 'Technicien Confirmé', icon: <Trophy size={14} />, color: 'bg-blue-500/20 text-blue-500' });

        if (stats.academy >= 5) badges.push({ id: 'mentor', label: 'Mentor Academy', icon: <GraduationCap size={14} />, color: 'bg-primary/20 text-primary' });
        if (stats.logs >= 30) badges.push({ id: 'keeper', label: 'Gardien du Savoir', icon: <BookText size={14} />, color: 'bg-orange-500/20 text-orange-500' });

        // Radar Data
        const radarData = [
            { subject: 'SAV', A: stats.sav * 10, fullMark: 100 },
            { subject: 'Academy', A: stats.academy * 20, fullMark: 100 },
            { subject: 'Documentation', A: stats.logs * 2, fullMark: 100 },
            { subject: 'Réactivité', A: 85, fullMark: 100 },
            { subject: 'Qualité', A: 95, fullMark: 100 },
        ];

        return { stats, badges, radarData };
    }, [user, logs, academySessions, savTickets]);

    if (loadingLogs || loadingAcademy || loadingSAV) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-accent" /></div>;
    }

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
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Profil <span className="text-accent">Expert Élite</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Traçabilité & Historique de Carrière Technologique</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Colonne Gauche: Identité & Badges */}
                    <div className="lg:col-span-4 space-y-8">
                        <Card className="glossy-card border-none rounded-[3rem] p-10 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5"><Cpu size={120} /></div>
                            <div className="relative z-10">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-accent/20 flex items-center justify-center mx-auto mb-8 text-accent shadow-[0_0_40px_rgba(56,189,248,0.2)]">
                                    <UserIcon size={64} />
                                </div>
                                <Badge className="bg-accent text-black font-black uppercase italic px-4 py-1 mb-4 text-[10px] tracking-widest">
                                    {user?.role?.toUpperCase()} CERTIFIÉ
                                </Badge>
                                <h3 className="text-3xl font-black uppercase italic tracking-tight">{user?.name}</h3>
                                <p className="text-xs text-muted-foreground font-bold uppercase mt-2 opacity-60">ID EXPERT: DKS-{user?.uid.substring(0, 8).toUpperCase()}</p>
                                
                                <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-white">{careerStats?.stats.sav}</p>
                                        <p className="text-[8px] font-black uppercase opacity-40">Tickets SAV</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-primary">{careerStats?.stats.academy}</p>
                                        <p className="text-[8px] font-black uppercase opacity-40">Cours Academy</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-orange-500">{careerStats?.stats.logs}</p>
                                        <p className="text-[8px] font-black uppercase opacity-40">Notes Labo</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 italic flex items-center gap-2">
                                <Award size={14} className="text-accent" /> Mur de Prestige
                            </h4>
                            <div className="flex flex-wrap gap-3">
                                {careerStats?.badges.map((b, i) => (
                                    <div key={i} className={cn("px-4 py-2 rounded-xl flex items-center gap-2 font-black uppercase italic text-[9px] shadow-lg", b.color)}>
                                        {b.icon} {b.label}
                                    </div>
                                ))}
                                {careerStats?.badges.length === 0 && (
                                    <p className="text-[10px] text-white/20 uppercase font-black italic">Aucun insigne débloqué.</p>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Colonne Droite: Graphique & Timeline */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="glossy-card border-none rounded-[3rem] p-8 flex flex-col items-center">
                                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6 w-full text-left">Matrice d'Expertise</h4>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={careerStats?.radarData}>
                                            <PolarGrid stroke="#ffffff10" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                            <Radar
                                                name="Expertise"
                                                dataKey="A"
                                                stroke="hsl(var(--accent))"
                                                fill="hsl(var(--accent))"
                                                fillOpacity={0.2}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <div className="space-y-6">
                                <Card className="bg-accent/5 border border-accent/20 rounded-[2.5rem] p-8 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-accent text-black flex items-center justify-center"><Target size={24} /></div>
                                        <div>
                                            <p className="text-[8px] font-black uppercase opacity-40">Prochain Objectif</p>
                                            <p className="text-sm font-black uppercase italic">Maître Instructeur Academy</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[8px] font-black uppercase">
                                            <span>Progression</span>
                                            <span>{careerStats?.stats.academy} / 10 sessions</span>
                                        </div>
                                        <Progress value={(careerStats?.stats.academy || 0) / 10 * 100} className="h-2 bg-white/5" indicatorClassName="bg-accent" />
                                    </div>
                                </Card>

                                <Card className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center"><Zap size={24} /></div>
                                        <div>
                                            <p className="text-[8px] font-black uppercase opacity-40">Spécialité Hardware</p>
                                            <p className="text-sm font-black uppercase italic">Architecte Réseaux Starlink</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary">Certifié Ubiquiti</Badge>
                                        <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary">Expert VPN</Badge>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        <Card className="glossy-card border-none rounded-[3rem] overflow-hidden">
                            <CardHeader className="p-10 border-b border-white/5 bg-white/[0.02]">
                                <CardTitle className="text-xl font-black uppercase italic flex items-center gap-4">
                                    <HistoryIcon className="text-accent" /> Timeline d'Interventions
                                </CardTitle>
                            </CardHeader>
                            <div className="p-10">
                                <div className="relative space-y-10 pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
                                    {academySessions?.slice(0, 3).map((session) => (
                                        <div key={session.id} className="relative group">
                                            <div className="absolute -left-10 top-0 w-6 h-6 rounded-full border-4 border-background bg-primary flex items-center justify-center">
                                                <GraduationCap size={10} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-primary mb-1">Academy Session Terminée</p>
                                                <h5 className="font-bold text-sm uppercase italic">{session.serviceTitle}</h5>
                                                <p className="text-xs text-muted-foreground mt-1">Étudiant: {session.customerName} • {session.scheduledDate}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {logs?.slice(0, 3).map((log) => (
                                        <div key={log.id} className="relative group">
                                            <div className="absolute -left-10 top-0 w-6 h-6 rounded-full border-4 border-background bg-orange-500 flex items-center justify-center">
                                                <BookText size={10} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-orange-500 mb-1">Rapport de Savoir Publié</p>
                                                <h5 className="font-bold text-sm uppercase italic line-clamp-1">"{log.content}"</h5>
                                                <p className="text-xs text-muted-foreground mt-1">{log.createdAt?.toDate?.().toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!academySessions?.length && !logs?.length) && (
                                        <p className="text-center py-10 opacity-20 italic font-black uppercase text-[10px] tracking-widest">Aucun historique récent.</p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default withAuth(ExpertProfilePage);
