
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Network, 
    ArrowLeft, 
    Wifi, 
    Server, 
    Cpu, 
    Globe, 
    ShieldCheck, 
    Zap, 
    Activity,
    PlusCircle,
    Loader2,
    Database,
    Cloud,
    CheckCircle2
} from "lucide-react";
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function DKSNodesPage() {
    const { user } = useAuth();
    const [isActivating, setIsActivating] = useState(false);

    const handleActivateNode = () => {
        setIsActivating(true);
        setTimeout(() => {
            setIsActivating(false);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard"><Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 p-0"><ArrowLeft size={24} /></Button></Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">DKS <span className="text-accent">Nodes</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Décentralisation du Hardware & Hosting Souverain</p>
                        </div>
                    </div>
                    <Badge className="bg-accent text-black font-black uppercase italic px-6 py-2 rounded-full text-[10px] tracking-widest">Miner Booster x10 Activable</Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-gradient-to-br from-accent/20 via-background to-black border-accent/20 rounded-[3rem] p-10 relative overflow-hidden">
                             <div className="absolute top-0 right-0 p-6 opacity-5"><Network size={120} /></div>
                             <div className="relative z-10 space-y-8">
                                <h3 className="text-2xl font-black uppercase italic leading-none">Hébergez <br/><span className="text-accent">un Nœud</span></h3>
                                <p className="text-xs text-white/60 italic leading-relaxed">
                                    "Transformez votre kit Starlink ou votre Serveur DKS en point de relais réseau pour la ville de Bunia et décuplez vos revenus DKST."
                                </p>
                                <div className="space-y-4 pt-6">
                                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <Wifi size={20} className="text-accent" />
                                        <div><p className="text-[10px] font-black uppercase">Relais Wi-Fi</p><p className="text-[8px] text-white/40 uppercase">Partagez votre bande passante</p></div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <Database size={20} className="text-primary" />
                                        <div><p className="text-[10px] font-black uppercase">Cloud Local</p><p className="text-[8px] text-white/40 uppercase">Stockage décentralisé</p></div>
                                    </div>
                                </div>
                             </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-8 space-y-8">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-accent shadow-lg"><Server size={28}/></div>
                                    <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[8px] font-black">Certifié DKS</Badge>
                                </div>
                                <div>
                                    <h4 className="text-xl font-black uppercase italic">Serveur DKS Master</h4>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Status: Non Connecté</p>
                                </div>
                                <Button onClick={handleActivateNode} disabled={isActivating} className="w-full h-14 bg-white text-black font-black uppercase italic rounded-2xl shadow-xl">
                                    {isActivating ? <Loader2 className="animate-spin" /> : "Lancer l'Hébergement"}
                                </Button>
                             </Card>

                             <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-6">
                                <div className="flex justify-between items-start">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-primary shadow-lg"><Globe size={28}/></div>
                                    <Badge className="bg-white/5 text-muted-foreground border-none uppercase text-[8px] font-black">Inactif</Badge>
                                </div>
                                <div>
                                    <h4 className="text-xl font-black uppercase italic">Antenne Starlink DKS</h4>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Status: Prêt pour relais</p>
                                </div>
                                <Button variant="outline" className="w-full h-14 border-white/10 rounded-2xl font-black uppercase italic hover:bg-white/5">Configurer le Relais</Button>
                             </Card>
                         </div>

                         <Card className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 space-y-8">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground flex items-center gap-2"><Activity size={14} /> Performance Réseau Global (Bunia)</h4>
                            <div className="h-24 flex items-end gap-1 px-2">
                                {[40, 60, 45, 80, 55, 90, 70, 85, 40, 60, 45, 80, 55, 90, 70, 85].map((h, i) => (
                                    <div key={i} className="flex-1 bg-accent/20 rounded-t-sm relative group">
                                        <div className="absolute bottom-0 left-0 w-full bg-accent transition-all group-hover:bg-primary" style={{ height: `${h}%` }} />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center pt-6 border-t border-white/5">
                                <div><p className="text-[8px] font-black uppercase opacity-40">Débit Total Partagé</p><p className="text-lg font-black text-white italic">2.4 Gbps</p></div>
                                <div><p className="text-[8px] font-black uppercase opacity-40">Nœuds Actifs</p><p className="text-lg font-black text-white italic">14</p></div>
                                <div><p className="text-[8px] font-black uppercase opacity-40">Récompenses Pool</p><p className="text-lg font-black text-accent italic">1,450 DKST / 24h</p></div>
                            </div>
                         </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default withAuth(DKSNodesPage);
