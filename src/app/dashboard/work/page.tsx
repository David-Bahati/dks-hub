
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Briefcase, 
    ArrowLeft, 
    Zap, 
    CheckCircle2, 
    Clock, 
    MapPin, 
    DollarSign,
    PlusCircle,
    UserCheck,
    Loader2,
    Search,
    Filter
} from "lucide-react";
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const MOCK_MISSIONS = [
    { id: '1', title: 'Réparation Serveur PME', company: 'RawBank Bunia', reward: 50, category: 'Hardware', deadline: '24h', location: 'Boulevard de la Libération', difficulty: 'Expert' },
    { id: '2', title: 'Installation Caméras IP', company: 'Hôtel Plaza', reward: 30, category: 'Network', deadline: '48h', location: 'Quartier Lumumba', difficulty: 'Intermediate' },
    { id: '3', title: 'Audit Sécurité Starlink', company: 'ONG COOPI', reward: 100, category: 'Security', deadline: '5j', location: 'Base Humanitaire', difficulty: 'Master' },
];

function DKSWorkPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [isApplying, setIsApplying] = useState<string | null>(null);

    const handleApply = (missionId: string) => {
        if (user?.loyaltyLevel === 'Bronze' && missionId === '3') {
            toast({ title: "Grade insuffisant", description: "Cette mission requiert le grade Gold.", variant: "destructive" });
            return;
        }
        setIsApplying(missionId);
        setTimeout(() => {
            toast({ title: "Candidature Envoyée", description: "L'entreprise recevra votre profil certifié DKS." });
            setIsApplying(null);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard"><Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 p-0 hover:bg-accent/10 hover:text-accent"><ArrowLeft size={24} /></Button></Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">DKS <span className="text-primary">Work</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Plateforme de Gig Economy pour experts certifiés</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <Input 
                                placeholder="Chercher une mission technique..." 
                                className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl focus:border-primary"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {MOCK_MISSIONS.map((mission) => (
                                <Card key={mission.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group">
                                    <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Briefcase size={28} />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase">{mission.category}</Badge>
                                                <Badge variant="outline" className="border-white/10 text-white/40 text-[8px] font-black uppercase">{mission.difficulty}</Badge>
                                            </div>
                                            <h3 className="text-xl font-black uppercase italic tracking-tight">{mission.title}</h3>
                                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase">
                                                <span className="flex items-center gap-1.5"><UserCheck size={12} className="text-primary" /> {mission.company}</span>
                                                <span className="flex items-center gap-1.5"><MapPin size={12} /> {mission.location}</span>
                                                <span className="flex items-center gap-1.5"><Clock size={12} /> Deadline: {mission.deadline}</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 min-w-[150px]">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Salaire DKST</p>
                                            <p className="text-3xl font-black text-white italic">{mission.reward} <span className="text-sm opacity-40">ŧ</span></p>
                                            <Button 
                                                onClick={() => handleApply(mission.id)}
                                                disabled={isApplying === mission.id}
                                                className="mt-4 w-full bg-primary text-white font-black uppercase italic h-10 rounded-xl text-[10px]"
                                            >
                                                {isApplying === mission.id ? <Loader2 className="animate-spin" /> : "Postuler"}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-primary/10 border-primary/20 rounded-[3rem] p-10 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5"><Zap size={100} /></div>
                            <div className="relative z-10 space-y-4">
                                <h3 className="text-xl font-black uppercase italic tracking-tight text-white leading-none">Votre Indice <br /><span className="text-primary">d'Employabilité</span></h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black uppercase text-white/40">Confiance Hub</span>
                                        <span className="text-primary">85%</span>
                                    </div>
                                    <Progress value={85} className="h-2 bg-white/5" indicatorClassName="bg-primary" />
                                </div>
                                <p className="text-[10px] text-white/40 italic leading-relaxed">
                                    Plus vous effectuez de missions avec succès, plus votre indice augmente, vous ouvrant l'accès à des contrats Master à plus de 200 DKST.
                                </p>
                            </div>
                        </Card>
                        
                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><CheckCircle2 size={12} /> Conditions</h4>
                            <ul className="space-y-2 text-[9px] font-bold uppercase text-white/60 list-disc pl-4">
                                <li>Certification Academy obligatoire</li>
                                <li>Paiement via Escrow DKS</li>
                                <li>Frais de service Hub: 5%</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default withAuth(DKSWorkPage);
