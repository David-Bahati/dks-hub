
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { 
    CheckCircle2, 
    Package, 
    MapPin, 
    ArrowRight, 
    ShoppingBag, 
    ShieldCheck, 
    Clock,
    QrCode,
    FileText,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get("id");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!orderId && mounted) {
            // router.push("/"); // Optionnel : redirection si pas d'ID
        }
    }, [orderId, mounted]);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            
            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 text-center">
                {/* HERO SUCCESS */}
                <div className="relative mb-12">
                    <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full scale-150 animate-pulse" />
                    <div className="relative">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-[3rem] bg-accent text-black flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(56,189,248,0.4)] animate-in zoom-in-50 duration-700">
                            <CheckCircle2 size={64} className="md:size-80" />
                        </div>
                        <div className="mt-8 space-y-3">
                            <Badge className="bg-accent/20 text-accent border-none font-black uppercase tracking-[0.3em] px-4 py-1 italic text-[10px]">Transaction Approuvée</Badge>
                            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">MERCI POUR <br /><span className="text-accent">VOTRE CONFIANCE</span></h1>
                            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Commande #{orderId?.substring(0, 12).toUpperCase() || "CONFIRMÉE"}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mb-16">
                    {/* INSTRUCTIONS DE RETRAIT */}
                    <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700"><MapPin size={80} /></div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-lg"><Package size={24} /></div>
                                <h3 className="text-xl font-black uppercase italic tracking-tight">Retrait au Hub</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1"><CheckCircle2 size={14} className="text-accent" /></div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-white/40 mb-1">Localisation</p>
                                        <p className="text-sm font-bold italic">Immeuble Bahati, Boulevard de la Libération, Bunia.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="mt-1"><CheckCircle2 size={14} className="text-accent" /></div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-white/40 mb-1">Horaires d'ouverture</p>
                                        <p className="text-sm font-bold italic">Lundi - Samedi : 08:30 - 17:30</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* SÉCURITÉ & SUIVI */}
                    <Card className="bg-white/5 border-white/5 rounded-[3rem] p-10 space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700"><ShieldCheck size={80} /></div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-lg"><ShieldCheck size={24} /></div>
                                <h3 className="text-xl font-black uppercase italic tracking-tight">Sécurité</h3>
                            </div>
                            <p className="text-xs text-white/60 leading-relaxed italic">
                                Pour retirer votre matériel, veuillez vous munir de votre **pièce d'identité** et présenter le **QR Code de votre facture** disponible dans votre espace client.
                            </p>
                            <div className="pt-4 flex items-center gap-3 text-accent animate-pulse">
                                <Clock size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Matériel prêt sous 2h</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* CTAS */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <Link href="/dashboard/orders" className="w-full sm:w-auto">
                        <Button className="w-full sm:w-auto h-20 px-12 rounded-[2rem] bg-accent text-black font-black uppercase italic text-lg shadow-xl shadow-accent/20 hover:scale-105 transition-all gap-3">
                            <FileText size={20} /> Suivre ma Commande
                        </Button>
                    </Link>
                    <Link href="/" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:w-auto h-20 px-12 rounded-[2rem] border-white/10 hover:bg-white/5 font-black uppercase italic text-lg gap-3">
                            <ShoppingBag size={20} /> Continuer les Achats
                        </Button>
                    </Link>
                </div>

                <div className="mt-20 pt-10 border-t border-white/5 flex flex-col items-center gap-4 opacity-20 italic font-black uppercase text-[10px] tracking-[0.5em]">
                    <Sparkles size={24} className="mb-2" />
                    <span>Double King Shop Hub • Bunia • Ituri</span>
                </div>
            </main>
        </div>
    );
}
