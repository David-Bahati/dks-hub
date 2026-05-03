'use client';

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
    Sparkles, 
    ArrowLeft, 
    Cpu, 
    Gamepad2, 
    Briefcase, 
    Palette, 
    Loader2, 
    ShoppingBag,
    CheckCircle2
} from "lucide-react";
import Link from 'next/link';
import { getHardwareAdvice } from '@/ai/flows/hardware-advisor';
import { useCart } from '@/context/CartContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function HardwareAdvisorPage() {
    const [budget, setBudget] = useState([800]);
    const [usage, setUsage] = useState<any>("gaming");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const { addToCart } = useCart();

    const handleGetAdvice = async () => {
        setLoading(true);
        try {
            const advice = await getHardwareAdvice({
                budget: budget[0],
                usage: usage,
            });
            setResult(advice);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="flex items-center gap-4 mb-10">
                    <Link href="/services">
                        <Button variant="outline" className="h-12 w-12 rounded-2xl border-white/10 p-0"><ArrowLeft size={20} /></Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black uppercase italic tracking-tighter">Assistant <span className="text-primary">Config Expert</span></h1>
                        <p className="text-muted-foreground text-sm">L'IA DKS analyse notre stock pour vous conseiller.</p>
                    </div>
                </div>

                {!result ? (
                    <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Votre Budget (USD)</Label>
                                <span className="text-4xl font-black text-primary">${budget[0]}</span>
                            </div>
                            <Slider 
                                value={budget} 
                                onValueChange={setBudget} 
                                max={5000} 
                                min={100} 
                                step={50}
                                className="py-4"
                            />
                        </div>

                        <div className="space-y-6">
                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Usage Principal</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[
                                    { id: 'gaming', icon: <Gamepad2 />, label: 'Gaming' },
                                    { id: 'work', icon: <Briefcase />, label: 'Boulot' },
                                    { id: 'graphics', icon: <Palette />, label: 'Graphisme' },
                                    { id: 'office', icon: <Cpu />, label: 'Bureautique' },
                                ].map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => setUsage(u.id)}
                                        className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all gap-3 ${usage === u.id ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`}
                                    >
                                        <div className={usage === u.id ? 'text-primary' : ''}>{u.icon}</div>
                                        <span className="text-[10px] font-black uppercase">{u.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button 
                            onClick={handleGetAdvice} 
                            disabled={loading}
                            className="w-full h-20 bg-primary text-white font-black uppercase italic rounded-2xl text-lg shadow-2xl shadow-primary/20 gap-3"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><Sparkles /> Générer ma recommandation</>}
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-8 animate-in zoom-in-95 duration-500">
                        <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={80} className="text-primary" /></div>
                            <Badge className="bg-primary text-white font-black uppercase italic px-4 py-1">Analyse Expert Terminée</Badge>
                            <div className="prose prose-invert max-w-none">
                                <p className="text-lg leading-relaxed text-white/90 whitespace-pre-wrap">{result.recommendation}</p>
                            </div>
                            <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black uppercase opacity-40">Estimation Total</p>
                                    <p className="text-3xl font-black text-primary">${result.totalEstimated}</p>
                                </div>
                                <Button variant="outline" onClick={() => setResult(null)} className="rounded-xl border-white/10 font-bold uppercase text-[10px]">Recommencer</Button>
                            </div>
                        </Card>

                        <div className="grid gap-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 ml-4">Composants suggérés (Stock DKS)</h3>
                            {result.items.length > 0 ? result.items.map((itemName: string, idx: number) => (
                                <Card key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-6 flex justify-between items-center hover:border-primary/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><CheckCircle2 size={20} /></div>
                                        <span className="font-bold text-sm uppercase">{itemName}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-primary font-black uppercase italic text-[10px] gap-2">
                                        Détails <ShoppingBag size={12} />
                                    </Button>
                                </Card>
                            )) : (
                                <p className="text-center italic opacity-30 text-xs">Consultez notre équipe pour valider la disponibilité exacte.</p>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
