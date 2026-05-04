
"use client";

import { useMemo, useState, useRef } from 'react';
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
    Crown,
    FileDown,
    QrCode,
    User as UserIcon,
    ShieldAlert,
    ShoppingCart,
    TrendingUp,
    Coins,
    RefreshCw,
    Wallet
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, updateDoc, doc, addDoc, serverTimestamp, increment } from 'firebase/firestore';
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
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';
import { useToast } from '@/hooks/use-toast';

const POINTS_PER_TOKEN = 100;

function ExpertProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isMinting, setIsMinting] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    // Fetch User Logs
    const logsQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return query(collection(db, "technicianLogs"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    }, [user?.uid]);
    const { data: logs, isLoading: loadingLogs } = useCollection(logsQuery);

    // Fetch User Academy sessions
    const academyQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return query(collection(db, "serviceBookings"), where("technicianId", "==", user.uid), where("status", "==", "completed"));
    }, [user?.uid]);
    const { data: academySessions, isLoading: loadingAcademy } = useCollection(academyQuery);

    // Fetch SAV tickets
    const savQuery = useMemoFirebase(() => {
        return query(collection(db, "supportTickets"), where("status", "==", "completed"));
    }, []);
    const { data: savTickets, isLoading: loadingSAV } = useCollection(savQuery);

    // Fetch Sales
    const salesQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return query(collection(db, "sales"), where("userId", "==", user.uid));
    }, [user?.uid]);
    const { data: sales, isLoading: loadingSales } = useCollection(salesQuery);

    const careerStats = useMemo(() => {
        if (!user || !logs) return null;

        const myLogs = logs || [];
        const myAcademy = academySessions || [];
        const mySAVCount = savTickets?.filter(t => t.technicianId === user.uid).length || 0;
        const mySales = sales || [];
        const myTotalSalesAmount = mySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);

        // Point calculation matches leaderboard logic in Dashboard
        let totalPoints = myLogs.length * 10;
        totalPoints += myAcademy.length * 50;
        totalPoints += mySAVCount * 30;
        mySales.forEach(sale => {
            if (sale.totalAmount >= 1000) totalPoints += 100;
            else if (sale.totalAmount >= 500) totalPoints += 50;
            else totalPoints += 20;
        });

        const stats = {
            logs: myLogs.length,
            academy: myAcademy.length,
            sav: mySAVCount,
            sales: mySales.length,
            totalSalesAmount: myTotalSalesAmount,
            totalPoints,
            totalActions: myLogs.length + myAcademy.length + mySAVCount + mySales.length
        };

        const badges = [];
        if (stats.totalActions >= 100) badges.push({ id: 'legend', label: 'Légende DKS', icon: <Crown size={14} />, color: 'bg-yellow-500/20 text-yellow-500' });
        else if (stats.totalActions >= 50) badges.push({ id: 'expert', label: 'Expert Senior', icon: <ShieldCheck size={14} />, color: 'bg-accent/20 text-accent' });
        
        if (stats.sales >= 20) badges.push({ id: 'closer', label: 'Top Closer', icon: <TrendingUp size={14} />, color: 'bg-green-500/20 text-green-400' });
        if (stats.academy >= 5) badges.push({ id: 'mentor', label: 'Mentor Academy', icon: <GraduationCap size={14} />, color: 'bg-primary/20 text-primary' });
        if (stats.logs >= 30) badges.push({ id: 'keeper', label: 'Gardien du Savoir', icon: <BookText size={14} />, color: 'bg-orange-500/20 text-orange-500' });

        const radarData = [
            { subject: 'SAV', A: Math.min(100, stats.sav * 10), fullMark: 100 },
            { subject: 'Academy', A: Math.min(100, stats.academy * 20), fullMark: 100 },
            { subject: 'Documentation', A: Math.min(100, stats.logs * 2), fullMark: 100 },
            { subject: 'Commercial', A: Math.min(100, stats.sales * 5), fullMark: 100 },
            { subject: 'Qualité', A: 95, fullMark: 100 },
        ];

        return { stats, badges, radarData };
    }, [user, logs, academySessions, savTickets, sales]);

    const mintTokens = async () => {
        if (!user || !careerStats) return;
        const availablePoints = careerStats.stats.totalPoints - (user.pointsConverted || 0);
        
        if (availablePoints < POINTS_PER_TOKEN) {
            toast({ 
                title: "Points insuffisants", 
                description: `Il vous faut au moins ${POINTS_PER_TOKEN} points pour frapper 1 DKST.`,
                variant: "destructive"
            });
            return;
        }

        const tokensToMint = Math.floor(availablePoints / POINTS_PER_TOKEN);
        const pointsToConvert = tokensToMint * POINTS_PER_TOKEN;

        setIsMinting(true);
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                tokenBalance: increment(tokensToMint),
                pointsConverted: increment(pointsToConvert),
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, "tokenTransactions"), {
                userId: user.uid,
                type: 'mint',
                pointsAmount: pointsToConvert,
                tokenAmount: tokensToMint,
                createdAt: serverTimestamp()
            });

            toast({ 
                title: "Points Tokenisés !", 
                description: `Vous avez généré ${tokensToMint} DKST. Votre wallet a été mis à jour.` 
            });
        } catch (error) {
            toast({ title: "Erreur de frappe", variant: "destructive" });
        } finally {
            setIsMinting(false);
        }
    };

    const handleExportReport = async () => {
        if (!reportRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`BILAN_EXPERT_DKS_${user?.name?.replace(/\s+/g, '_')}.pdf`);
            toast({ title: "Bilan exporté", description: "Le document de performance est prêt." });
        } catch (error) {
            toast({ title: "Erreur PDF", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    if (loadingLogs || loadingAcademy || loadingSAV || loadingSales) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-accent" /></div>;
    }

    const redeemableTokens = Math.floor((careerStats?.stats.totalPoints || 0) - (user?.pointsConverted || 0)) / POINTS_PER_TOKEN;

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

                    <div className="flex gap-3">
                        <Button 
                            onClick={handleExportReport} 
                            disabled={isGenerating}
                            variant="outline"
                            className="border-white/10 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 hover:bg-white/5 transition-all"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <><FileDown size={20} /> Bilan PDF</>}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Colonne Gauche: Identité & Wallet */}
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
                                
                                <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-2 gap-y-8">
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-white">{careerStats?.stats.sav}</p>
                                        <p className="text-[8px] font-black uppercase opacity-40">Tickets SAV</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-primary">{careerStats?.stats.academy}</p>
                                        <p className="text-[8px] font-black uppercase opacity-40">Cours Academy</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* TOKEN WALLET SECTION */}
                        <Card className="bg-accent/10 border-accent/20 rounded-[3rem] p-10 space-y-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-10"><Coins size={80} className="text-accent" /></div>
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-accent text-black flex items-center justify-center shadow-lg"><Wallet size={20}/></div>
                                    <h4 className="text-lg font-black uppercase italic tracking-tight">DKS Token Wallet</h4>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-accent/60 tracking-widest">Solde Actuel</p>
                                    <p className="text-5xl font-black text-white italic">{user?.tokenBalance || 0} <span className="text-sm font-light opacity-40 not-italic">DKST</span></p>
                                </div>

                                <div className="p-6 bg-black/40 rounded-2xl border border-white/5 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[8px] font-black uppercase opacity-40">Points convertibles</p>
                                        <span className="text-xs font-bold text-accent">{(careerStats?.stats.totalPoints || 0) - (user?.pointsConverted || 0)} / {POINTS_PER_TOKEN}</span>
                                    </div>
                                    <Progress value={Math.min(100, (((careerStats?.stats.totalPoints || 0) - (user?.pointsConverted || 0)) / POINTS_PER_TOKEN) * 100)} className="h-1.5 bg-white/5" indicatorClassName="bg-accent" />
                                    
                                    <Button 
                                        onClick={mintTokens} 
                                        disabled={isMinting || redeemableTokens < 1}
                                        className="w-full h-12 bg-accent text-black font-black uppercase italic text-[10px] rounded-xl gap-2 shadow-xl shadow-accent/10 mt-2"
                                    >
                                        {isMinting ? <Loader2 className="animate-spin h-4 w-4" /> : <><RefreshCw size={14} /> Frapper des Jetons (Mint)</>}
                                    </Button>
                                </div>
                                <p className="text-[7px] text-center text-muted-foreground uppercase font-black tracking-tighter opacity-40">Conversion automatique : 100 Points = 1 DKST</p>
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
                                            <p className="text-[8px] font-black uppercase opacity-40">Volume Commercial</p>
                                            <p className="text-sm font-black uppercase italic">Ventes Elite: {careerStats?.stats.totalSalesAmount.toLocaleString()}$</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[8px] font-black uppercase">
                                            <span>Progression Closer</span>
                                            <span>{careerStats?.stats.sales} / 20 ventes</span>
                                        </div>
                                        <Progress value={(careerStats?.stats.sales || 0) / 20 * 100} className="h-2 bg-white/5" indicatorClassName="bg-accent" />
                                    </div>
                                </Card>

                                <Card className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center"><Zap size={24} /></div>
                                        <div>
                                            <p className="text-[8px] font-black uppercase opacity-40">Pôle Technique</p>
                                            <p className="text-sm font-black uppercase italic">Expert Infrastructure & SAV</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary">Réseaux</Badge>
                                        <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary">Hardware 8K</Badge>
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
                                    {academySessions?.slice(0, 2).map((session) => (
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
                                    {sales?.slice(0, 2).map((sale) => (
                                        <div key={sale.id} className="relative group">
                                            <div className="absolute -left-10 top-0 w-6 h-6 rounded-full border-4 border-background bg-green-500 flex items-center justify-center">
                                                <ShoppingCart size={10} className="text-white" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-green-500 mb-1">Vente Conclue</p>
                                                <h5 className="font-bold text-sm uppercase italic">Transaction #{sale.id.substring(0,8)}</h5>
                                                <p className="text-xs text-muted-foreground mt-1">Montant: {sale.totalAmount}$ • Client: {sale.customerName}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>

            {/* HIDDEN PERFORMANCE REPORT FOR PDF GENERATION */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {user && careerStats && (
                    <div ref={reportRef} className="bg-white text-black p-16 w-[800px] font-sans">
                        <header className="flex justify-between items-start border-b-4 border-black pb-10 mb-12">
                            <div className="space-y-4">
                                <div className="bg-black text-white px-6 py-2 inline-block font-black text-3xl italic tracking-tighter">DKS ELITE HUB</div>
                                <div className="text-sm font-bold uppercase tracking-widest text-gray-500">Direction des Ressources Techniques</div>
                                <div className="text-[11px] leading-relaxed mt-4 font-medium">
                                    <p>Immeuble Bahati, Bunia, RDC</p>
                                    <p>Évaluation de Performance Individuelle</p>
                                    <p>Document Confidentiel • ISO-DKS 2024</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-2 leading-none">RAPPORT<br/>EXPERT</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Période: {new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
                                <div className="mt-8">
                                    <p className="text-[10px] font-black uppercase text-gray-400">Date de génération</p>
                                    <p className="text-lg font-bold">{new Date().toLocaleDateString('fr-FR')}</p>
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-2 gap-10 mb-12">
                            <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 flex flex-col justify-center">
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Identification de l'Expert</p>
                                <h3 className="text-3xl font-black uppercase italic leading-none mb-2">{user.name}</h3>
                                <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">{user.role} Certifié DKS</p>
                                <p className="text-[9px] font-mono text-gray-400 mt-4 uppercase">ID: DKS-EXP-{user.uid.substring(0, 10).toUpperCase()}</p>
                            </div>
                            <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 space-y-6">
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Prestige & Titres</p>
                                <div className="flex flex-wrap gap-2">
                                    {careerStats.badges.map((b, i) => (
                                        <div key={i} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-[9px] font-black uppercase italic">{b.label}</div>
                                    ))}
                                    {careerStats.badges.length === 0 && <p className="text-xs italic text-gray-400">En cours d'acquisition...</p>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-12">
                            {[
                                { l: "Tickets SAV", v: careerStats.stats.sav, c: "text-blue-600" },
                                { l: "Academy", v: careerStats.stats.academy, c: "text-purple-600" },
                                { l: "Points Prestige", v: careerStats.stats.totalPoints, c: "text-orange-600" },
                                { l: "Ventes (Qty)", v: careerStats.stats.sales, c: "text-green-600" }
                            ].map((stat, i) => (
                                <div key={i} className="p-6 text-center border-2 border-gray-50 rounded-2xl">
                                    <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest mb-1">{stat.l}</p>
                                    <p className={cn("text-3xl font-black italic", stat.c)}>{stat.v}</p>
                                </div>
                            ))}
                        </div>

                        <section className="mb-12">
                            <h3 className="text-sm font-black uppercase italic border-b-2 border-black pb-2 mb-6 flex items-center gap-2">
                                <Zap size={16} /> Synthèse des Compétences
                            </h3>
                            <div className="bg-gray-50 p-10 rounded-[3rem] border border-gray-100 flex flex-col items-center">
                                <div className="w-full h-40 grid grid-cols-5 gap-4">
                                    {careerStats.radarData.map((d, i) => (
                                        <div key={i} className="flex flex-col items-center gap-4">
                                            <div className="flex-1 w-full bg-gray-200 rounded-full relative overflow-hidden flex items-end">
                                                <div className="w-full bg-black" style={{ height: `${d.A}%` }} />
                                            </div>
                                            <p className="text-[8px] font-black uppercase text-gray-400">{d.subject}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <footer className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-end">
                            <div className="flex items-center gap-6">
                                <QrCode size={60} className="opacity-10" />
                                <p className="text-[8px] font-bold text-gray-400 uppercase leading-relaxed max-w-[250px]">
                                    Ce document fait foi de l'historique de carrière de l'agent au sein du Double King Hub. <br />
                                    Certification de compétence technique certifiée DKS-HR-2024.
                                </p>
                            </div>
                            <div className="text-right space-y-4">
                                <div className="h-16 w-32 border-2 border-gray-100 rounded-lg flex items-center justify-center italic text-gray-200 text-[8px] uppercase font-black">Visa Direction Technique</div>
                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Solutions RH Expert v3.0</p>
                            </div>
                        </footer>
                    </div>
                )}
            </div>
        </div>
    );
}

export default withAuth(ExpertProfilePage);
