"use client";

import { useState, useRef } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    FileText, 
    ArrowLeft, 
    Download, 
    Loader2, 
    Rocket, 
    Coins, 
    ShoppingBag, 
    ShieldCheck, 
    Pickaxe, 
    Zap,
    Users,
    Globe,
    Target,
    Award,
    QrCode,
    Flame,
    Gem,
    Cpu,
    CheckCircle2
} from "lucide-react";
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";
import withAuth from '@/components/auth/withAuth';
import { useAuth } from "@/context/AuthContext";

function ProjectPresentationPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const handleDownloadPresentation = async () => {
        if (!reportRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(reportRef.current, { 
                scale: 2, 
                useCORS: true, 
                backgroundColor: "#ffffff" 
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ 
                orientation: 'portrait', 
                unit: 'px', 
                format: [canvas.width / 2, canvas.height / 2] 
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`PRESENTATION_OFFICIELLE_DKS_HUB.pdf`);
            toast({ title: "Présentation générée", description: "Le document est prêt pour vos partenaires." });
        } catch (error) {
            toast({ title: "Erreur PDF", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    if (user?.role?.toLowerCase() !== 'admin') {
        return <div className="p-20 text-center uppercase font-black italic opacity-20">Accès réservé à la direction.</div>;
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
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">EXPOSÉ <span className="text-accent">STRATÉGIQUE</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Support de présentation officiel du Hub DKS</p>
                        </div>
                    </div>

                    <Button 
                        onClick={handleDownloadPresentation} 
                        disabled={isGenerating}
                        className="bg-primary text-white hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <><Download size={20} /> Exporter en PDF Officiel</>}
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-12">
                    <Card className="glossy-card border-none rounded-[3rem] p-12 space-y-12">
                        <section className="space-y-6">
                            <h2 className="text-3xl font-black uppercase italic flex items-center gap-4"><Rocket className="text-accent" /> 1. Vision et Objectifs</h2>
                            <p className="text-lg text-white/70 leading-relaxed italic">
                                Transformer Bunia en un pôle technologique majeur en facilitant l'accès au matériel de pointe tout en formant la main-d'œuvre locale aux métiers du futur.
                            </p>
                        </section>

                        <section className="space-y-8">
                            <h2 className="text-3xl font-black uppercase italic flex items-center gap-4"><Pickaxe className="text-orange-500" /> 2. Système de Minage (Proof of Activity)</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center"><Flame size={24} /></div>
                                    <h4 className="text-lg font-black uppercase italic text-orange-400">Cycles 24h</h4>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-bold">Extraction quotidienne gamifiée avec bonus de loyauté.</p>
                                </div>
                                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center"><Gem size={24} /></div>
                                    <h4 className="text-lg font-black uppercase italic text-accent">Rareté Blocs</h4>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-bold">Probabilités d'extraire des blocs Rare (x2) ou Légendaire (x5).</p>
                                </div>
                                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center"><TrendingUp size={24} /></div>
                                    <h4 className="text-lg font-black uppercase italic text-primary">Halving</h4>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed uppercase font-bold">Réduction des récompenses tous les 8M de tokens pour la rareté.</p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <h2 className="text-3xl font-black uppercase italic flex items-center gap-4"><ShoppingBag className="text-green-500" /> 3. Boutique Élite & POS</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="bg-black/40 border-white/5 p-8 rounded-[2.5rem] space-y-6">
                                    <h4 className="text-xl font-black uppercase italic text-accent">Consensus Pi (GCV)</h4>
                                    <p className="text-sm text-white/60 leading-relaxed italic">Indexation sur la valeur mondiale de $314,159 pour garantir un pouvoir d'achat international aux membres du Hub.</p>
                                    <div className="pt-4 flex items-center gap-3">
                                        <Badge className="bg-accent/10 text-accent border-none font-black text-[9px]">1 π = $314,159</Badge>
                                        <Badge className="bg-accent/10 text-accent border-none font-black text-[9px]">ZERO FRAIS</Badge>
                                    </div>
                                </Card>
                                <Card className="bg-black/40 border-white/5 p-8 rounded-[2.5rem] space-y-6">
                                    <h4 className="text-xl font-black uppercase italic text-primary">Paiements Hybrides</h4>
                                    <p className="text-sm text-white/60 leading-relaxed italic">Système POS acceptant Cash, Mobile Money (Vodacom, Airtel, Orange, Africell) et DKST.</p>
                                    <div className="pt-4 flex flex-wrap gap-2">
                                        <Badge variant="outline" className="border-white/10 text-white/40 text-[8px] font-black">CASH</Badge>
                                        <Badge variant="outline" className="border-white/10 text-white/40 text-[8px] font-black">M-MONEY</Badge>
                                        <Badge variant="outline" className="border-white/10 text-white/40 text-[8px] font-black">CRYPTO</Badge>
                                    </div>
                                </Card>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h2 className="text-3xl font-black uppercase italic flex items-center gap-4"><ShieldCheck className="text-blue-500" /> 4. Sécurité Institutionnelle</h2>
                            <p className="text-sm text-white/60 leading-relaxed">
                                Chaque document (Facture, Reçu, Diplôme) est automatiquement authentifié par notre cachet numérique "Haute Sécurité" Bleu Nuit et une signature manuscrite électronique certifiée.
                            </p>
                        </section>
                    </Card>
                </div>
            </main>

            {/* DOCUMENT PDF RÉEL (HIDDEN) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <div ref={reportRef} className="bg-white text-black p-20 w-[800px] font-sans">
                    <header className="flex justify-between items-start border-b-8 border-black pb-12 mb-16">
                        <div className="space-y-6">
                            <Logo size="lg" />
                            <div className="space-y-1">
                                <div className="bg-black text-white px-6 py-2 inline-block font-black text-3xl italic tracking-tighter">DKS HUB</div>
                                <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Présentation Officielle du Projet</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-4 leading-none">EXPOSÉ<br/>DÉTAILLÉ</h2>
                            <p className="text-xs font-bold text-gray-300 uppercase tracking-[0.3em]">VERSION 3.0 • 2024</p>
                        </div>
                    </header>

                    <div className="space-y-12">
                        <section className="space-y-4">
                            <h3 className="text-2xl font-black uppercase italic border-b-2 border-black pb-2">I. VISION & ÉDUCATION</h3>
                            <p className="text-sm leading-relaxed text-gray-700 italic">
                                Le Hub DKS redéfinit l'excellence en RDC. Par la convergence de la boutique Hardware de luxe et de la DKS Academy, nous formons une élite capable de piloter les infrastructures de demain.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-2xl font-black uppercase italic border-b-2 border-black pb-2">II. ÉCONOMIE & MINAGE</h3>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                Le protocole de minage (Proof of Activity) récompense l'engagement quotidien. Avec des raretés de blocs allant jusqu'à x5, nous favorisons une répartition équitable du jeton **DKST** (50M max supply).
                            </p>
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div className="p-4 bg-gray-50 rounded-xl text-center">
                                    <p className="text-xl font-black">20%</p>
                                    <p className="text-[8px] font-bold uppercase text-gray-400">Prob. Blocs Rares</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl text-center">
                                    <p className="text-xl font-black">5%</p>
                                    <p className="text-[8px] font-bold uppercase text-gray-400">Prob. Légendaire</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl text-center">
                                    <p className="text-xl font-black">24h</p>
                                    <p className="text-[8px] font-bold uppercase text-gray-400">Cycle de Minage</p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-2xl font-black uppercase italic border-b-2 border-black pb-2">III. BOUTIQUE & PAIEMENTS</h3>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                Notre terminal POS accepte le **Consensus Pi GCV ($314,159)**, le Cash et le Mobile Money. Cette flexibilité fait du Hub DKS le point d'échange le plus avancé de la région Ituri.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-2xl font-black uppercase italic border-b-2 border-black pb-2">IV. SÉCURITÉ INSTITUTIONNELLE</h3>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                Chaque transaction est scellée par le DMS (Héritage Digital) et authentifiée par notre système de cachet "High Security" anti-contrefaçon.
                            </p>
                        </section>
                    </div>

                    <footer className="mt-32 pt-10 border-t-2 border-gray-100 flex justify-between items-end">
                        <div className="flex items-center gap-6">
                            <QrCode size={80} className="opacity-100 text-black" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase">Vérification de Conformité</p>
                                <p className="text-[8px] font-medium text-gray-400 max-w-[300px] uppercase leading-tight">
                                    Document certifié par Double King Shop Hub Bunia. <br />
                                    Tout usage à des fins de présentation est autorisé par la direction.
                                </p>
                            </div>
                        </div>
                        <div className="text-right space-y-4">
                            {/* CACHET SÉCURITÉ MIDNIGHT BLUE */}
                            <div className="w-28 h-28 rounded-full border-[3px] border-double border-blue-900 flex flex-col items-center justify-center p-1 rotate-[-8deg] opacity-95 relative mx-auto shadow-sm">
                                <div className="absolute inset-0 border border-blue-900/20 rounded-full scale-[0.95]" />
                                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-60">
                                    <path id="presCirclePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
                                    <text className="text-[4px] font-black fill-blue-900 uppercase">
                                        <textPath xlinkHref="#presCirclePath">CERTIFIED BY DOUBLE KING SHOP • ORIGINAL DOCUMENT • CERTIFIED BY DOUBLE KING SHOP •</textPath>
                                    </text>
                                </svg>
                                <p className="text-[5px] font-black text-blue-900 leading-none">DKS HUB</p>
                                <ShieldCheck size={18} className="text-blue-900 my-0.5" />
                                <p className="text-[4px] font-bold text-blue-900 uppercase">OFFICIAL SEAL</p>
                                <p className="text-[6px] font-black text-blue-900 uppercase tracking-widest mt-0.5">BUNIA</p>
                            </div>
                            
                            <div className="space-y-1">
                                <div className="h-6 w-32 mx-auto">
                                    <svg viewBox="0 0 200 60" className="w-full h-full text-blue-950 opacity-80">
                                        <path d="M20,40 Q50,10 80,40 T140,30 Q160,20 180,45" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Visa Direction Générale</p>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </div>
    );
}

export default withAuth(ProjectPresentationPage);