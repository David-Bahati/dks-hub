
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
    FlaskConical,
    DollarSign,
    ShieldCheck
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
        return items.filter(item => item.quantity <= item.minThreshold).map(item => {
            const qtyToOrder = Math.ceil(item.minThreshold * 3);
            return {
                ...item,
                qtyToOrder,
                estimatedCost: qtyToOrder * (item.unitCost || 0)
            };
        });
    }, [items]);

    const totalEstimatedBudget = useMemo(() => {
        return procurementList.reduce((acc, item) => acc + item.estimatedCost, 0);
    }, [procurementList]);

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
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Génération de bons de commande & estimation budgétaire</p>
                        </div>
                    </div>
                    
                    {procurementList.length > 0 && (
                        <div className="flex gap-4">
                            <Button 
                                onClick={handleDownloadOrder} 
                                disabled={isGenerating}
                                className="bg-primary text-white hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-primary/10"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" /> : <><FileDown size={20} /> Exporter Bon PDF</>}
                            </Button>
                        </div>
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
                                            <Badge variant="outline" className="bg-red-500/10 text-red-400 border-none uppercase text-[8px] font-black px-2">Critique</Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 shrink-0">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase text-accent mb-1 tracking-widest">Coût Estimé</p>
                                            <p className="text-2xl font-black text-white">${item.estimatedCost.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                            <CheckCircle2 size={80} strokeWidth={1} className="text-green-400" />
                            <p className="text-xl font-black uppercase italic tracking-tighter">Stocks au maximum</p>
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
                            </div>
                            <div className="text-right">
                                <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-2 leading-none">BON DE<br/>COMMANDE</h2>
                                <p className="text-lg font-bold">{new Date().toLocaleDateString('fr-FR')}</p>
                            </div>
                        </header>

                        <table className="w-full mb-12">
                            <thead>
                                <tr className="bg-gray-100 text-[10px] font-black uppercase tracking-widest">
                                    <th className="text-left p-4">Désignation</th>
                                    <th className="text-center p-4">Qté</th>
                                    <th className="text-right p-4">Prix Unit.</th>
                                    <th className="text-right p-4">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {procurementList.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-100">
                                        <td className="p-4 font-bold uppercase italic">{item.name}</td>
                                        <td className="p-4 text-center font-bold">{item.qtyToOrder} {item.unit}</td>
                                        <td className="p-4 text-right">${item.unitCost?.toFixed(2)}</td>
                                        <td className="p-4 text-right font-black">${item.estimatedCost.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <footer className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-end">
                            <div className="flex items-center gap-6">
                                <QrCode size={60} className="opacity-100 text-black" />
                                <p className="text-[8px] font-bold text-gray-400 uppercase leading-relaxed max-w-[250px]">
                                    Document officiel de gestion de stock Double King Shop. <br />
                                    Certification Logistique DKS-LOG-2024.
                                </p>
                            </div>
                            <div className="text-right space-y-4 relative">
                                <div className="absolute top-[-80px] right-0 flex flex-col items-center">
                                    {/* CACHET SÉCURITÉ MIDNIGHT BLUE */}
                                    <div className="w-28 h-28 rounded-full border-[3px] border-double border-blue-900 flex flex-col items-center justify-center p-1 rotate-[5deg] opacity-95 relative">
                                        <div className="absolute inset-0 border border-blue-900/20 rounded-full scale-[0.95]" />
                                        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-30">
                                            <path id="orderCirclePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
                                            <text className="text-[3px] font-black fill-blue-900 uppercase">
                                                <textPath xlinkHref="#orderCirclePath">
                                                    CERTIFIED BY DOUBLE KING SHOP • ORIGINAL DOCUMENT • CERTIFIED BY DOUBLE KING SHOP • 
                                                </textPath>
                                            </text>
                                        </svg>
                                        <p className="text-[5px] font-black text-blue-900 uppercase leading-none">DKS LOGISTICS</p>
                                        <ShieldCheck size={18} className="text-blue-900 my-0.5" />
                                        <p className="text-[4px] font-bold text-blue-900 uppercase">OFFICIAL SEAL</p>
                                        <p className="text-[6px] font-black text-blue-900 uppercase tracking-widest mt-0.5">BUNIA</p>
                                    </div>
                                    <div className="w-32 h-8 text-blue-950 mt-[-20px] rotate-[-5deg]">
                                        <svg viewBox="0 0 200 60" className="w-full h-full"><path d="M20,40 Q50,10 80,40 T140,30 Q160,20 180,45" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                                    </div>
                                </div>
                                <div className="h-16 w-32 border-2 border-gray-100 rounded-lg flex items-center justify-center italic text-gray-300 text-[8px] uppercase font-black">Visa Direction</div>
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
