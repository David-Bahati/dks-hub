
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
    Rocket,
    BarChart3,
    Activity,
    Network,
    Shield
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
            const canvas = await html2canvas(reportRef.current, { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: "#ffffff",
                logging: false
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`LIVRE_BLANC_DKS_HUB_2024_OFFICIEL.pdf`);
            toast({ title: "Document généré", description: "Le Livre Blanc officiel a été téléchargé avec succès." });
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
                        <Button variant="ghost" className="mb-10 gap-2 text-muted-foreground hover:text-accent font-black uppercase italic text-[10px] tracking-widest">
                            <ArrowLeft size={14} /> Retour à l'accueil
                        </Button>
                    </Link>
                    <Badge className="mb-10 bg-accent/20 text-accent border-accent/20 font-black uppercase tracking-[0.4em] px-8 py-2.5 rounded-full">
                        Document Stratégique Officiel v3.0
                    </Badge>
                    <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.8] mb-10">
                        LIVRE <br /><span className="premium-gradient-text">BLANC</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-3xl mx-auto uppercase tracking-widest leading-relaxed">
                        L'architecture d'un futur technologique souverain pour la province de l'Ituri.
                    </p>
                    <div className="mt-16">
                        <Button 
                            onClick={handleDownloadPDF} 
                            disabled={isGenerating}
                            className="h-20 px-12 rounded-[2rem] bg-white text-black font-black uppercase italic text-lg shadow-2xl hover:scale-105 transition-all gap-4"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <><Download size={24} /> Télécharger le PDF Certifié</>}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container max-w-5xl mx-auto px-6 py-32 space-y-40">
                
                {/* SECTION 1: VISION */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
                    <div className="md:col-span-4 space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-xl shadow-accent/10">
                            <Globe size={32} />
                        </div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tight leading-none">01. VISION <br /><span className="text-accent">SOUVERAINE</span></h2>
                    </div>
                    <div className="md:col-span-8 space-y-8 text-lg text-white/70 font-medium leading-relaxed italic">
                        <p>
                            "Le Hub DKS est la réponse technologique aux défis de l'Afrique Centrale. Nous créons un écosystème où le matériel de luxe finance l'éducation, et où l'éducation sécurise l'infrastructure régionale."
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                            <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-4">
                                <Activity className="text-accent" size={28} />
                                <p className="text-[10px] font-black uppercase text-white tracking-widest">Infrastructures Critiques</p>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider leading-relaxed">
                                    Déploiement de réseaux Starlink maillés et surveillance par IA pour la résilience économique.
                                </p>
                            </div>
                            <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-4">
                                <GraduationCap className="text-accent" size={28} />
                                <p className="text-[10px] font-black uppercase text-white tracking-widest">Capital Humain</p>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider leading-relaxed">
                                    Transformation de la jeunesse en une élite capable de piloter les nœuds du réseau DKS.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION 2: TOKENOMICS */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
                    <div className="md:col-span-4 space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-xl shadow-primary/10">
                            <Coins size={32} />
                        </div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tight leading-none">02. ÉCONOMIE <br /><span className="text-primary">HYBRIDE</span></h2>
                    </div>
                    <div className="md:col-span-8 space-y-8">
                        <p className="text-lg text-white/70 italic">
                            DKS introduit un système bi-monétaire révolutionnaire pour garantir la stabilité des prix et la valorisation du travail local.
                        </p>
                        <Card className="bg-black/40 border-primary/20 rounded-[3rem] p-12 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp size={140} /></div>
                            <div className="space-y-12 relative z-10">
                                <div className="space-y-4">
                                    <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase tracking-widest px-3">Valeur de Référence</Badge>
                                    <h4 className="text-2xl font-black uppercase italic text-white">Consensus Pi (GCV)</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        L'indexation sur le Consensus Global ($314,159) protège l'épargne des membres contre l'inflation locale et permet une acquisition de hardware premium à prix fixe mondial.
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <Badge className="bg-accent/10 text-accent border-none text-[8px] font-black uppercase tracking-widest px-3">Jeton Utilitaire</Badge>
                                    <h4 className="text-2xl font-black uppercase italic text-white">Le Jeton DKST</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Le DKST récompense la "Preuve d'Activité". Plus un membre contribue au Hub (minage, formation, services), plus il accumule de pouvoir économique dans l'écosystème.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </section>

                {/* SECTION 3: SÉCURITÉ */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
                    <div className="md:col-span-4 space-y-6">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 shadow-xl shadow-red-500/10">
                            <Shield size={32} />
                        </div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tight leading-none">03. SÉCURITÉ <br /><span className="text-red-500">ET HÉRITAGE</span></h2>
                    </div>
                    <div className="md:col-span-8 space-y-8">
                        <p className="text-lg text-white/70 italic leading-relaxed">
                            "Le patrimoine numérique ne doit jamais mourir." Notre protocole de succession garantit la transmission automatique des actifs aux héritiers désignés.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-[2.5rem] space-y-4">
                                <Lock size={24} className="text-red-500" />
                                <h4 className="text-sm font-black uppercase italic text-white">Dead Man's Switch</h4>
                                <p className="text-[10px] text-red-400 font-bold uppercase leading-relaxed">
                                    Déclenchement automatique après inactivité notariée (30, 90 ou 180 jours).
                                </p>
                            </div>
                            <div className="p-8 bg-red-500/5 border border-red-500/20 rounded-[2.5rem] space-y-4">
                                <HeartPulse size={24} className="text-red-500" />
                                <h4 className="text-sm font-black uppercase italic text-white">Vérification de Vie</h4>
                                <p className="text-[10px] text-red-400 font-bold uppercase leading-relaxed">
                                    Signature cryptographique hebdomadaire requise pour maintenir le heartbeat du wallet.
                                </p>
                            </div>
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

            {/* MODÈLE CACHÉ POUR GÉNÉRATION PDF AVEC CACHET ET SIGNATURE */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div ref={reportRef} className="bg-white text-black p-20 w-[800px] font-sans">
                    <header className="flex justify-between items-start border-b-8 border-black pb-12 mb-16">
                        <div className="space-y-6">
                            <Logo size="lg" />
                            <div className="space-y-1">
                                <div className="bg-black text-white px-6 py-2 inline-block font-black text-3xl italic tracking-tighter">DKS WHITE PAPER</div>
                                <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Bunia Technological Hub • RDC</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-6xl font-black uppercase italic tracking-tighter mb-4 leading-none">LIVRE<br/>BLANC</h2>
                            <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.3em]">ÉDITION STRATÉGIQUE 2024</p>
                        </div>
                    </header>

                    <div className="space-y-16">
                        <section className="space-y-6">
                            <h3 className="text-2xl font-black uppercase italic border-b-2 border-black pb-2">I. VISION ET ARCHITECTURE</h3>
                            <p className="text-sm leading-relaxed text-gray-700 italic">
                                Le projet Double King Shop (DKS) Hub repose sur la création d'un "Nœud de Résilience" en République Démocratique du Congo. Par l'intégration verticale du commerce de hardware premium et de l'éducation spécialisée, DKS Hub devient l'unique point d'accès à l'économie de la connaissance pour la province de l'Ituri.
                            </p>
                        </section>

                        <section className="space-y-6">
                            <h3 className="text-2xl font-black uppercase italic border-b-2 border-black pb-2">II. ÉCONOMIE SOUVERAINE (DKST)</h3>
                            <div className="grid grid-cols-2 gap-10">
                                <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100">
                                    <h4 className="font-black text-blue-600 uppercase text-xs mb-4">Pi GCV Integration</h4>
                                    <p className="text-[11px] text-gray-600 leading-relaxed">Standardisation de la valeur d'échange à $314,159 par Pi. Ce choix stratégique assure une stabilité monétaire absolue pour l'acquisition d'actifs technologiques lourds.</p>
                                </div>
                                <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100">
                                    <h4 className="font-black text-accent-foreground uppercase text-xs mb-4">DKST Utility Token</h4>
                                    <p className="text-[11px] text-gray-600 leading-relaxed">Masse monétaire plafonnée à 50M. Le jeton sert de moteur de gouvernance et de récompense pour le minage communautaire (65% de la distribution).</p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h3 className="text-2xl font-black uppercase italic border-b-2 border-black pb-2">III. INFRASTRUCTURE ET DÉPLOIEMENT</h3>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                DKS déploie des solutions de connectivité par satellite (Starlink Business) et de surveillance périmétrale par IA. Chaque déploiement est documenté et certifié, renforçant la confiance des acteurs économiques locaux (banques, ONGs, PMEs).
                            </p>
                            <div className="flex justify-between items-center bg-gray-50 p-8 rounded-[2rem] border border-gray-100">
                                <div className="text-center flex-1">
                                    <p className="text-4xl font-black">100%</p>
                                    <p className="text-[8px] font-bold uppercase text-gray-400 tracking-widest">Certification DKS</p>
                                </div>
                                <div className="w-px h-12 bg-gray-200" />
                                <div className="text-center flex-1">
                                    <p className="text-4xl font-black">50M</p>
                                    <p className="text-[8px] font-bold uppercase text-gray-400 tracking-widest">Supply Max DKST</p>
                                </div>
                                <div className="w-px h-12 bg-gray-200" />
                                <div className="text-center flex-1">
                                    <p className="text-4xl font-black">24/7</p>
                                    <p className="text-[8px] font-bold uppercase text-gray-400 tracking-widest">Support Élite</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <footer className="mt-40 pt-10 border-t-2 border-gray-100 flex justify-between items-end">
                        <div className="flex items-center gap-6">
                            <QrCode size={80} className="opacity-100 text-black" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase">Vérification de Stratégie</p>
                                <p className="text-[8px] font-medium text-gray-400 max-w-[320px] uppercase leading-tight">
                                    Document certifié par Double King Shop Hub Bunia. <br />
                                    Tout usage à des fins de présentation officielle est autorisé.
                                </p>
                            </div>
                        </div>
                        <div className="text-right space-y-6 relative">
                            <div className="absolute top-[-110px] right-0 flex flex-col items-center">
                                {/* CACHET SÉCURITÉ MONOGRAMME - MIDNIGHT BLUE */}
                                <div className="w-32 h-32 rounded-full border-[3px] border-double border-blue-900 flex flex-col items-center justify-center p-1 rotate-[-12deg] opacity-95 relative shadow-sm">
                                    <div className="absolute inset-0 border border-blue-900/20 rounded-full scale-[0.95]" />
                                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-60">
                                        <path id="wpCirclePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
                                        <text className="text-[4.5px] font-black fill-blue-900 uppercase">
                                            <textPath xlinkHref="#wpCirclePath">CERTIFIED BY DOUBLE KING SHOP • ORIGINAL STRATEGY • CERTIFIED BY DOUBLE KING SHOP •</textPath>
                                        </text>
                                    </svg>
                                    
                                    <p className="text-[6px] font-black text-blue-900 leading-none">DKS HUB</p>
                                    <div className="my-1.5">
                                        <svg viewBox="0 0 200 200" className="w-12 h-12 text-blue-900">
                                            <path d="M65 65V135M65 100L95 65M65 100L95 135" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M135 65V135M135 100L105 65M135 100L105 135" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <p className="text-[5px] font-bold text-blue-900 uppercase">OFFICIAL SEAL</p>
                                    <p className="text-[7px] font-black text-blue-900 uppercase tracking-widest mt-0.5">BUNIA</p>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <p className="text-[9px] font-black text-gray-400 italic">Signature de la Direction Générale</p>
                                <div className="h-10 w-40 flex items-center justify-center">
                                    <svg viewBox="0 0 200 60" className="w-full h-full text-blue-950 opacity-90">
                                        <path d="M20,40 Q50,10 80,40 T140,30 Q160,20 180,45" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                        <path d="M40,30 Q60,50 90,25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                                    </svg>
                                </div>
                                <p className="text-[11px] font-black uppercase italic tracking-tighter text-blue-900">Expert Bahati Nyeke David</p>
                                <div className="w-full h-[1px] bg-gray-100" />
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}

