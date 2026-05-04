
"use client";

import { useState, useMemo, useRef } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    ShoppingCart, 
    ArrowLeft, 
    Loader2, 
    AlertTriangle, 
    FileDown, 
    CheckCircle2, 
    PackagePlus,
    Printer,
    QrCode,
    Zap,
    FlaskConical
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';
import { cn } from "@/lib/utils";

function ProcurementPage() {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const inventoryQuery = useMemoFirebase(() => {
        return query(collection(db, "consumables"), orderBy("name", "asc"));
    }, []);

    const { data: items, isLoading } = useCollection(inventoryQuery);

    const procurementList = useMemo(() => {
        if (!items) return [];
        return items.filter(item => item.quantity <= item.minThreshold);
    }, [items]);

    const handleDownloadOrder = async () => {
        if (!reportRef.current || procurementList.length === 0) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`BON_COMMANDE_DKS_LABO_${new Date().toISOString().split('T')[0]}.pdf`);
            toast({ title: "Bon de commande prêt", description: "Le document PDF a été généré avec succès." });
        } catch (error) {
            toast({ title: "Erreur PDF", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard/maintenance">
                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0 transition-all">
                                <ArrowLeft size={24} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Besoins <span className="text-accent">Réappro</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Génération automatique de bons de commande fournisseurs</p>
                        </div>
                    </div>
                    
                    {procurementList.length > 0 && (
                        <Button 
                            onClick={handleDownloadOrder} 
                            disabled={isGenerating}
                            className="bg-primary text-white hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-primary/10"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <><FileDown size={20} /> Exporter Bon de Commande</>}
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                    ) : procurementList.length > 0 ? (
                        procurementList.map((item) => (
                            <Card key={item.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group">
                                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-10">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                        <AlertTriangle size={32} className="animate-pulse" />
                                    </div>
                                    
                                    <div className="flex-1 space-y-2 text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-3">
                                            <h3 className="text-2xl font-black uppercase italic tracking-tight">{item.name}</h3>
                                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-none uppercase text-[8px] font-black px-2">Stock Critique</Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-[10px] font-black uppercase italic text-muted-foreground/60 tracking-widest">
                                            <span className="flex items-center gap-2"><Zap size={12} className="text-accent" /> Famille: {item.category}</span>
                                            <span className="flex items-center gap-2"><PackagePlus size={12} /> Stock Actuel: {item.quantity} {item.unit}</span>
                                            <span className="flex items-center gap-2 text-red-400"><AlertTriangle size={12} /> Seuil: {item.minThreshold} {item.unit}</span>
                                        </div>
                                    </div>

                                    <div className="text-center md:text-right shrink-0 bg-black/20 p-6 rounded-3xl border border-white/5">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Réappro suggéré</p>
                                        <p className="text-3xl font-black text-white italic">+{Math.ceil(item.minThreshold * 3)} <span className="text-sm font-light opacity-40 not-italic">{item.unit}</span></p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                            <CheckCircle2 size={80} strokeWidth={1} className="text-green-400" />
                            <p className="text-xl font-black uppercase italic tracking-tighter">Stocks au maximum</p>
                            <p className="text-xs max-w-sm uppercase font-black tracking-widest leading-relaxed">Toutes les ressources de laboratoire sont au-dessus de leur seuil de sécurité.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* MODÈLE DE BON DE COMMANDE PDF (HIDDEN) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {procurementList.length > 0 && (
                    <div ref={reportRef} className="bg-white text-black p-16 w-[800px] font-sans">
                        <header className="flex justify-between items-start border-b-4 border-black pb-10 mb-12">
                            <div className="space-y-4">
                                <div className="bg-black text-white px-6 py-2 inline-block font-black text-3xl italic tracking-tighter">DKS SOLUTIONS</div>
                                <div className="text-sm font-bold uppercase tracking-widest text-gray-500">Logistique Labo & Maintenance</div>
                                <div className="text-[11px] leading-relaxed mt-4 font-medium">
                                    <p>Immeuble Bahati, Bunia, RDC</p>
                                    <p>Expertise Hardware Certifiée</p>
                                    <p>Email: supply@dks-shop.com</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-2 leading-none">BON DE<br/>COMMANDE</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Réf: REAPPRO-{new Date().getFullYear()}-{Math.floor(Math.random() * 1000)}</p>
                                <div className="mt-8">
                                    <p className="text-[10px] font-black uppercase text-gray-400">Date de génération</p>
                                    <p className="text-lg font-bold">{new Date().toLocaleDateString('fr-FR')}</p>
                                </div>
                            </div>
                        </header>

                        <div className="p-8 bg-gray-50 rounded-2xl mb-12 border border-gray-100">
                            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Résumé Logistique</h3>
                            <div className="grid grid-cols-3 gap-10">
                                <div>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase">Articles à réappro.</p>
                                    <p className="text-2xl font-black">{procurementList.length}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase">Priorité</p>
                                    <p className="text-2xl font-black text-red-600 italic uppercase">URGENT</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase">Destination</p>
                                    <p className="text-xl font-bold uppercase">Labo Bunia</p>
                                </div>
                            </div>
                        </div>

                        <table className="w-full mb-12">
                            <thead>
                                <tr className="bg-black text-white text-[10px] font-black uppercase tracking-widest">
                                    <th className="text-left p-4">Désignation Consommable</th>
                                    <th className="text-center p-4">Stock Actuel</th>
                                    <th className="text-center p-4">Seuil Sécu.</th>
                                    <th className="text-right p-4">Qté à Commander</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {procurementList.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-100">
                                        <td className="p-4">
                                            <p className="font-bold uppercase italic">{item.name}</p>
                                            <p className="text-[9px] text-gray-400 uppercase mt-1">Catégorie: {item.category}</p>
                                        </td>
                                        <td className="p-4 text-center text-red-600 font-bold">{item.quantity} {item.unit}</td>
                                        <td className="p-4 text-center font-medium text-gray-400">{item.minThreshold} {item.unit}</td>
                                        <td className="p-4 text-right font-black text-xl italic">{Math.ceil(item.minThreshold * 3)} {item.unit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <section className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 mb-12">
                            <h3 className="text-sm font-black uppercase italic mb-3 flex items-center gap-2">
                                <Zap size={16} className="text-black" /> Note Logistique
                            </h3>
                            <p className="text-[11px] leading-relaxed text-gray-600 font-medium italic">
                                "Ce document est généré par le système intelligent DKS Hub. Les quantités suggérées correspondent à 3 fois le seuil critique pour garantir une autonomie de 90 jours au laboratoire de Bunia."
                            </p>
                        </section>

                        <footer className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-end">
                            <div className="flex items-center gap-6">
                                <QrCode size={60} className="opacity-20" />
                                <p className="text-[8px] font-bold text-gray-400 uppercase leading-relaxed max-w-[250px]">
                                    Document officiel de gestion de stock Double King Shop. <br />
                                    Certification Logistique DKS-LOG-2024.
                                </p>
                            </div>
                            <div className="text-right space-y-4">
                                <div className="h-16 w-32 border-2 border-gray-100 rounded-lg flex items-center justify-center italic text-gray-300 text-[8px] uppercase font-black">Visa Logistique</div>
                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Solutions Lab Hub v3.0</p>
                            </div>
                        </footer>
                    </div>
                )}
            </div>
        </div>
    );
}

export default withAuth(ProcurementPage);
