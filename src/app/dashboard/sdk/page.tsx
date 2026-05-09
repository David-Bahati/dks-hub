
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Cpu, 
    ArrowLeft, 
    Terminal, 
    ShieldCheck, 
    KeyRound, 
    Code2, 
    BookOpen, 
    Zap, 
    Copy, 
    Check, 
    Loader2,
    Globe,
    Activity,
    Database,
    Lock
} from "lucide-react";
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

function DKSSDKPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [hasCopied, setHasCopied] = useState(false);

    const generateKey = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setApiKey(`dks_live_${Math.random().toString(36).substring(2, 20)}_${Date.now()}`);
            setIsGenerating(false);
            toast({ title: "Clé API générée", description: "Gardez-la secrète, elle permet d'encaisser du DKST." });
        }, 1500);
    };

    const copyKey = () => {
        if (!apiKey) return;
        navigator.clipboard.writeText(apiKey);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard"><Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 p-0 hover:bg-accent/10 hover:text-accent"><ArrowLeft size={24} /></Button></Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">DKS <span className="text-primary">SDK</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Portail Développeur & Intégration Business</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-10">
                        <Card className="bg-white/5 border-white/10 rounded-[3rem] p-10 space-y-8 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Terminal size={120} /></div>
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/10"><KeyRound size={28}/></div>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tight">Authentification Marchand</h3>
                                </div>
                                <p className="text-sm text-white/60 leading-relaxed italic">
                                    "Générez vos identifiants sécurisés pour intégrer les paiements DKST et Pi Network dans votre propre système de gestion, site web ou application mobile."
                                </p>
                                
                                <div className="p-8 bg-black/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 space-y-6">
                                    {apiKey ? (
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Clé API Live (Restricted Access)</Label>
                                            <div className="flex gap-2">
                                                <div className="flex-1 p-4 bg-background border border-primary/20 rounded-2xl overflow-hidden">
                                                    <p className="font-mono text-[10px] text-primary truncate">{apiKey}</p>
                                                </div>
                                                <Button onClick={copyKey} variant="outline" className="h-14 w-14 rounded-2xl border-primary/20 text-primary">
                                                    {hasCopied ? <Check size={20}/> : <Copy size={20}/>}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 space-y-6">
                                            <Lock className="mx-auto text-white/10" size={48} />
                                            <Button onClick={generateKey} disabled={isGenerating} className="h-16 px-10 rounded-2xl bg-primary text-white font-black uppercase italic shadow-xl shadow-primary/20 gap-3">
                                                {isGenerating ? <Loader2 className="animate-spin" /> : "Générer une clé API Live"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 ml-4 flex items-center gap-2"><BookOpen size={14}/> Documentation Rapide</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="bg-white/5 border-white/10 rounded-[2.5rem] p-8 space-y-4 hover:bg-white/[0.08] transition-all cursor-pointer group">
                                    <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent"><Code2 size={20}/></div>
                                    <h5 className="font-black uppercase italic">Paiement Web</h5>
                                    <p className="text-[10px] text-white/40 leading-relaxed uppercase font-bold">SDK JavaScript pour intégrer un bouton "Payer en DKST" sur votre site e-commerce.</p>
                                </Card>
                                <Card className="bg-white/5 border-white/10 rounded-[2.5rem] p-8 space-y-4 hover:bg-white/[0.08] transition-all cursor-pointer group">
                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary"><Database size={20}/></div>
                                    <h5 className="font-black uppercase italic">Webhooks & API</h5>
                                    <p className="text-[10px] text-white/40 leading-relaxed uppercase font-bold">Recevez des notifications en temps réel lors de la confirmation d'un transfert.</p>
                                </Card>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                         <Card className="bg-accent/10 border-accent/20 rounded-[3rem] p-10 space-y-6 relative overflow-hidden">
                             <div className="absolute -bottom-10 -right-10 p-6 opacity-5"><Zap size={140} className="text-accent" /></div>
                             <div className="relative z-10 space-y-6">
                                <Badge className="bg-accent text-black font-black uppercase italic text-[8px] tracking-[0.2em] px-4 py-1">Économie Ouverte</Badge>
                                <h3 className="text-2xl font-black uppercase italic leading-tight text-white">Étendez <br/><span className="text-accent">le DKST</span></h3>
                                <p className="text-xs text-white/60 italic leading-relaxed">
                                    "En ouvrant notre API, nous permettons à chaque marchand de Bunia de rejoindre le réseau. Votre boutique devient une partie intégrante du protocole DKS."
                                </p>
                                <div className="pt-6">
                                    <div className="flex justify-between items-end mb-4"><p className="text-[9px] font-black uppercase opacity-40">Requêtes API (24h)</p><span className="text-lg font-black text-white">0 / 10k</span></div>
                                    <Progress value={0} className="h-1.5 bg-white/5" indicatorClassName="bg-accent" />
                                </div>
                             </div>
                         </Card>

                         <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Activity size={14} /> Server Status</h4>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase text-white/60">API Gateway</span>
                                    <Badge className="bg-green-500/10 text-green-400 border-none text-[8px]">Stable</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase text-white/60">Pi Sync Bridge</span>
                                    <Badge className="bg-green-500/10 text-green-400 border-none text-[8px]">Stable</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase text-white/60">Mainnet Explorer</span>
                                    <Badge className="bg-blue-500/10 text-blue-400 border-none text-[8px]">Syncing</Badge>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default withAuth(DKSSDKPage);
