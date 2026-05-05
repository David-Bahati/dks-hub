
"use client";

import { useState, useRef } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    FileText, 
    ShieldCheck, 
    Coins, 
    Globe, 
    Cpu, 
    GraduationCap, 
    Scale, 
    HeartPulse, 
    TrendingUp, 
    Download, 
    Loader2, 
    ArrowLeft,
    CheckCircle2,
    Zap,
    Lock,
    Users,
    Gem,
    QrCode,
    Timer,
    MapPin,
    Flame,
    Rocket
} from "lucide-react";
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';
import { useToast } from '@/hooks/use-toast';

export default function WhitePaperPage() {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`LIVRE_BLANC_DKS_HUB_2024.pdf`);
            toast({ title: "Document généré", description: "Le Livre Blanc officiel a été téléchargé." });
        } catch (error) {
            toast({ title: "Erreur PDF", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <Navbar />
            
            {/* HERO SECTION INSTITUTIONNELLE */}
            <header className="relative py-32 px-6 overflow-hidden border-b border-white/5">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent opacity-50" />
                <div className="container max-w-5xl mx-auto text-center relative z-10">
                    <Link href="/">
                        <Button variant="ghost" className="mb-10 gap-2 text-muted-foreground hover:text-accent font-bold uppercase italic text-[10px] tracking-widest">
                            <ArrowLeft size={14} /> Retour à l'accueil
                        </Button>
                    </Link>
                    <Badge className="bg-accent/20 text-accent border-accent/20 font-black uppercase tracking-[0.4em] px-8 py-2.5 mb-10 rounded-full">
                        Document Stratégique Officiel v3.0
                    </Badge>
                    <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.8] mb-10">
                        LIVRE <br /><span className="premium-gradient-text">BLANC</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-3xl mx-auto uppercase tracking-widest leading-relaxed">
                        Architecture d'un écosystème technologique hybride au cœur de l'Ituri.
                    </p>
                    <div className="mt-16">
                        <Button 
                            onClick={handleDownloadPDF} 
                            disabled={isGenerating}
                            className="h-20 px-12 rounded-[2rem] bg-white text-black font-black uppercase italic text-lg shadow-2xl hover:scale-105 transition-all gap-4"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <><Download size={24} /> Télécharger le PDF</>}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container max-w-5xl mx-auto px-6 py-32 space-y-32">
                
                {/* SECTION 1: VISION */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
                    <div className="md:col-span-4 space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-xl shadow-accent/10">
                            <Globe size={32} />
                        </div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tight leading-none">01. VISION <br /><span className="text-accent">BUNIA 2030</span></h2>
                    </div>
                    <div className="md:col-span-8 space-y-8 text-lg text-white/70 font-medium leading-relaxed italic">
                        <p>
                            "Le Double King Shop (DKS) n'est pas seulement une boutique ; c'est le premier Hub Technologique Hybride de la République Démocratique du Congo. Notre mission est d'éradiquer le fossé numérique en Ituri par la convergence du commerce de luxe, de l'éducation d'élite et de l'infrastructure certifiée."
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-3">
                                <CheckCircle2 className="text-accent" size={24} />
                                <p className="text-[10px] font-black uppercase text-white">Infrastructures</p>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Déploiement Starlink & CCTV 8K pour sécuriser la région.</p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-3">
                                <CheckCircle2 className="text-accent" size={24} />
                                <p className="text-[10px] font-black uppercase text-white">Éducation</p>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Formation de 1000+ experts IA et Blockchain d'ici 2026.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 2: ÉCONOMIE */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
                    <div className="md:col-span-4 space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-xl shadow-primary/10">
                            <Coins size={32} />
                        </div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tight leading-none">02. MODÈLE <br /><span className="text-primary">ÉCONOMIQUE</span></h2>
                    </div>
                    <div className="md:col-span-8 space-y-8">
                        <p className="text-lg text-white/70 italic">
                            DKS introduit un système bi-monétaire unique pour garantir la fluidité des échanges et la valorisation du savoir-faire local.
                        </p>
                        <Card className="bg-black/40 border-primary/20 rounded-[3rem] p-10 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp size={100} /></div>
                            <div className="space-y-10 relative z-10">
                                <div className="space-y-4">
                                    <h4 className="text-xl font-black uppercase italic text-primary">Le Consensus Pi (GCV)</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Nous adoptons le consensus global Pi Network ($314,159) comme étalon de valeur pour nos transactions hardware. Cela permet d'intégrer Bunia dans une économie mondiale décentralisée.
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-xl font-black uppercase italic text-accent">Le Jeton DKST</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Monnaie interne utilitaire récompensant le minage de blocs, le staking (APR jusqu'à 12%) et le mérite académique. 1 DKST est indexé sur la valeur brute des actifs physiques du Hub.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </section>

                {/* SECTION 3: ROADMAP (NOUVEAU) */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
                    <div className="md:col-span-4 space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center text-orange-500 shadow-xl shadow-orange-500/10">
                            <Rocket size={32} />
                        </div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tight leading-none">03. FEUILLE <br /><span className="text-orange-500">DE ROUTE</span></h2>
                    </div>
                    <div className="md:col-span-8 space-y-12">
                        {[
                            { year: "2024", title: "Consolidation Hub", desc: "Lancement du Mainnet DKST, certification Starlink Business et automatisation de l'Academy par l'IA.", icon: <ShieldCheck size={20} className="text-accent" /> },
                            { year: "2025", title: "Expansion Régionale", desc: "Ouverture du DKS Hub Kisangani, déploiement des terminaux de paiement NFC et tokenisation du stock physique.", icon: <Globe size={20} className="text-primary" /> },
                            { year: "2026", title: "Écosystème Global", desc: "Lancement de DKS Venture pour financer les startups tech locales et intégration du Hub dans le commerce transfrontalier via Pi.", icon: <Gem size={20} className="text-yellow-500" /> }
                        ].map((step, idx) => (
                            <div key={idx} className="relative pl-12 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-white/10 group">
                                <div className="absolute left-[-10px] top-0 w-5 h-5 rounded-full bg-background border-2 border-white/10 flex items-center justify-center group-hover:border-accent transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-white/20 group-hover:bg-accent animate-pulse" />
                                </div>
                                <div className="space-y-2">
                                    <Badge className="bg-white/5 text-white/40 border-none font-black text-[10px] px-3">{step.year}</Badge>
                                    <h4 className="text-xl font-black uppercase italic flex items-center gap-3">{step.icon} {step.title}</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed italic">"{step.desc}"</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SECTION 4: HERITAGE */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
                    <div className="md:col-span-4 space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 shadow-xl shadow-red-500/10">
                            <HeartPulse size={32} />
                        </div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tight leading-none">04. HÉRITAGE <br /><span className="text-red-500">DIGITAL</span></h2>
                    </div>
                    <div className="md:col-span-8 space-y-8">
                        <p className="text-lg text-white/70 italic leading-relaxed">
                            "L'immortalité de vos actifs est garantie." Le protocole **Dead Man's Switch (DMS)** de DKS assure que vos jetons DKST et vos accès seront transmis automatiquement à votre héritier désigné après un seuil d'inactivité notarié par le Hub.
                        </p>
                        <div className="p-8 bg-red-500/5 border border-red-500/10 rounded-[3rem] flex items-center gap-8">
                            <ShieldCheck className="text-red-500 shrink-0" size={48} />
                            <p className="text-xs text-red-400 font-bold uppercase tracking-widest leading-relaxed">
                                Premier système de succession Web3 certifié en RDC, protégeant le patrimoine des familles de l'Ituri contre la perte de clés privées.
                            </p>
                        </div>
                    </div>
                </section>

                {/* CALL TO ACTION FINAL */}
                <section className="pt-20">
                    <Card className="bg-gradient-to-br from-accent/20 to-primary/20 border-white/10 rounded-[4rem] p-16 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/tech/1200/800')] opacity-10 mix-blend-overlay group-hover:scale-105 transition-transform duration-[5s]" />
                        <div className="relative z-10 space-y-10">
                            <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white">REJOIGNEZ <br />L'HISTOIRE</h2>
                            <p className="text-xl text-white/60 font-light max-w-2xl mx-auto uppercase tracking-[0.2em]">Devenez un pionnier de l'écosystème Double King Shop.</p>
                            <div className="flex flex-wrap justify-center gap-6">
                                <Link href="/register">
                                    <Button size="lg" className="h-20 px-12 rounded-[2rem] bg-accent text-black font-black uppercase italic text-lg shadow-2xl shadow-accent/20">Créer mon compte Élite</Button>
                                </Link>
                                <Button size="lg" variant="outline" className="h-20 px-12 rounded-[2rem] border-white/10 font-black uppercase italic text-lg backdrop-blur-xl">Contacter le CEO</Button>
                            </div>
                        </div>
                    </Card>
                </section>
            </main>

            {/* MODÈLE CACHÉ POUR GÉNÉRATION PDF */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div ref={reportRef} className="bg-white text-black p-20 w-[800px] font-sans">
                    <header className="flex justify-between items-start border-b-8 border-black pb-12 mb-16">
                        <div className="space-y-6">
                            <Logo size="lg" />
                            <div className="space-y-1">
                                <div className="bg-black text-white px-6 py-2 inline-block font-black text-3xl italic tracking-tighter">DKS STRATEGY</div>
                                <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Bunia Technological Hub • RDC</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-6xl font-black uppercase italic tracking-tighter mb-4 leading-none">LIVRE<br/>BLANC</h2>
                            <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.3em]">ÉDITION OFFICIELLE 2024</p>
                        </div>
                    </header>

                    <div className="space-y-16">
                        <section className="space-y-6">
                            <h3 className="text-2xl font-black uppercase italic border-b-2 border-black pb-2">I. INTRODUCTION STRATÉGIQUE</h3>
                            <p className="text-sm leading-relaxed text-gray-700 italic">
                                Le Double King Shop (DKS) redéfinit l'interaction entre technologie de pointe et besoins locaux. En Ituri, l'accès au matériel de haute performance est un luxe, mais la formation est une nécessité. Notre modèle intègre ces deux dimensions pour créer un écosystème autosuffisant et tourné vers l'avenir.
                            </p>
                        </section>

                        <section className="space-y-6">
                            <h3 className="text-2xl font-black uppercase italic border-b-2 border-black pb-2">II. ARCHITECTURE FINANCIÈRE</h3>
                            <div className="grid grid-cols-2 gap-10">
                                <div className="p-6 bg-gray-50 rounded-2xl">
                                    <h4 className="font-black text-blue-600 uppercase text-xs mb-3">Consensus Pi GCV</h4>
                                    <p className="text-xs text-gray-600 leading-relaxed">Valorisation standardisée à $314,159 par Pi pour tous les échanges de composants hardware premium, garantissant un pouvoir d'achat mondial à la communauté locale.</p>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-2xl">
                                    <h4 className="font-black text-accent-foreground uppercase text-xs mb-3">DKST Utility Token</h4>
                                    <p className="text-xs text-gray-600 leading-relaxed">Jeton utilitaire sécurisé par le travail réel du Hub (interventions techniques, formation). Utilisé pour le Staking et la gouvernance DAO.</p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h3 className="text-2xl font-black uppercase italic border-b-2 border-black pb-2">III. DKS ACADEMY & CAPITAL HUMAIN</h3>
                            <p className="text-sm leading-relaxed text-gray-700">
                                Notre académie certifie les talents de demain. En formant les jeunes de Bunia à l'Intelligence Artificielle et à la Cybersécurité, nous créons un vivier de compétences qui alimente nos propres besoins en infrastructure et ceux des entreprises partenaires de la région.
                            </p>
                            <div className="flex justify-between items-center bg-gray-50 p-6 rounded-2xl">
                                <div className="text-center flex-1">
                                    <p className="text-3xl font-black">100%</p>
                                    <p className="text-[8px] font-bold uppercase text-gray-400">Certification Hub</p>
                                </div>
                                <div className="w-px h-10 bg-gray-200" />
                                <div className="text-center flex-1">
                                    <p className="text-3xl font-black">2024</p>
                                    <p className="text-[8px] font-bold uppercase text-gray-400">Lancement Mainnet</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <footer className="mt-32 pt-10 border-t-2 border-gray-100 flex justify-between items-end">
                        <div className="flex items-center gap-6">
                            <QrCode size={80} className="opacity-20" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase">Document Approuvé</p>
                                <p className="text-[8px] font-medium text-gray-400 max-w-[300px] uppercase leading-tight">
                                    Ce livre blanc est une propriété intellectuelle de Double King Shop. <br />
                                    Toute reproduction sans autorisation est interdite.
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="h-20 w-40 border-2 border-gray-100 rounded-lg flex items-center justify-center italic text-gray-300 text-[10px] uppercase font-black">Sceau de la Direction</div>
                            <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-4">EST. 2024 • BUNIA, RDC</p>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}
