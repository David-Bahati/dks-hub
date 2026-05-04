
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
    ShieldCheck, 
    ArrowLeft, 
    Loader2, 
    Globe, 
    Wifi, 
    Shield, 
    Server, 
    Video, 
    Building2,
    MapPin,
    Smartphone,
    User,
    CheckCircle2,
    Briefcase
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const AUDIT_NEEDS = [
    { id: "wifi", label: "Couverture Wi-Fi Intégrale", icon: <Wifi size={14}/> },
    { id: "security", label: "Cybersécurité & Firewall", icon: <Shield size={14}/> },
    { id: "cctv", label: "Vidéosurveillance IP 8K", icon: <Video size={14}/> },
    { id: "starlink", label: "Intégration Starlink Business", icon: <Globe size={14}/> },
    { id: "server", label: "Architecture Serveur & Cloud", icon: <Server size={14}/> },
    { id: "networking", label: "Câblage Structuré (Optique)", icon: <Briefcase size={14}/> },
];

export default function TechnicalAuditRequestPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toggleNeed = (id: string) => {
        setSelectedNeeds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Connexion requise", description: "Veuillez vous connecter pour demander un audit." });
            router.push('/login');
            return;
        }

        if (selectedNeeds.length === 0) {
            toast({ title: "Besoin non défini", description: "Veuillez sélectionner au moins un domaine d'expertise.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            const auditData = {
                userId: user.uid,
                businessName: formData.get('businessName'),
                contactPerson: formData.get('contactPerson'),
                phone: formData.get('phone'),
                location: formData.get('location'),
                needs: selectedNeeds,
                description: formData.get('description'),
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await addDoc(collection(db, "audits"), auditData);

            await addDoc(collection(db, "notifications"), {
                userId: 'staff',
                title: "NOUVEAU DOSSIER BUSINESS",
                message: `Demande d'audit technique pour l'entreprise ${formData.get('businessName')}.`,
                type: 'warning',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/audits'
            });

            toast({ title: "Demande d'Audit Transmise", description: "Le service Business DKS reviendra vers vous sous 24h." });
            router.push('/dashboard');
        } catch (error) {
            toast({ title: "Erreur de transmission", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <Navbar />
            
            <header className="relative py-24 px-6 overflow-hidden border-b border-white/5">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent opacity-40" />
                <div className="container max-w-4xl mx-auto text-center relative z-10">
                    <Link href="/services">
                        <Button variant="ghost" className="mb-8 gap-2 text-muted-foreground hover:text-accent font-bold uppercase italic text-[10px]">
                            <ArrowLeft size={14} /> Retour Solutions
                        </Button>
                    </Link>
                    <Badge className="bg-accent/20 text-accent border-accent/20 font-black uppercase tracking-[0.4em] px-8 py-2 mb-8 rounded-full">
                        Expertise Infrastructure Business
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none mb-6">
                        AUDIT <span className="premium-gradient-text">TECHNIQUE</span>
                    </h1>
                    <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto uppercase tracking-widest leading-relaxed">
                        Évaluation complète de votre environnement technologique par les experts certifiés de Double King Shop.
                    </p>
                </div>
            </header>

            <main className="container max-w-5xl mx-auto px-6 py-20">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Colonne de gauche: Besoins */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-accent flex items-center gap-2">
                                <ShieldCheck size={16} /> Domaines d'Audit
                            </h2>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase opacity-60">Sélectionnez les pôles à expertiser :</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {AUDIT_NEEDS.map((need) => (
                                <button
                                    key={need.id}
                                    type="button"
                                    onClick={() => toggleNeed(need.id)}
                                    className={cn(
                                        "flex items-center gap-4 p-5 rounded-[1.5rem] border-2 transition-all text-left group",
                                        selectedNeeds.includes(need.id)
                                            ? "bg-accent/20 border-accent text-white"
                                            : "bg-white/5 border-transparent text-white/40 hover:bg-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                        selectedNeeds.includes(need.id) ? "bg-accent text-black" : "bg-white/5"
                                    )}>
                                        {need.icon}
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-tight">{need.label}</span>
                                </button>
                            ))}
                        </div>

                        <Card className="bg-white/5 border-white/10 rounded-[2rem] p-8 space-y-4">
                            <p className="text-[9px] font-bold text-muted-foreground leading-relaxed uppercase">
                                L'audit technique DKS inclut un diagnostic sur site, une analyse de vulnérabilités et la remise d'un rapport de préconisations stratégiques.
                            </p>
                        </Card>
                    </div>

                    {/* Colonne de droite: Formulaire */}
                    <Card className="lg:col-span-2 glossy-card border-none rounded-[3rem] p-12 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Building2 size={120} /></div>
                        
                        <div className="relative z-10 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Nom de l'Institution / Entreprise</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                        <Input name="businessName" placeholder="Ex: Banque de l'Ituri" required className="h-14 pl-12 bg-background/50 border-white/5 rounded-2xl focus:border-accent text-lg font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Personne de Contact</Label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                        <Input name="contactPerson" defaultValue={user?.name} required className="h-14 pl-12 bg-background/50 border-white/5 rounded-2xl focus:border-accent" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Téléphone de l'Entreprise</Label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                        <Input name="phone" placeholder="+243..." required className="h-14 pl-12 bg-background/50 border-white/5 rounded-2xl focus:border-accent" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Localisation (Quartier/Commune)</Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                        <Input name="location" placeholder="Ex: Bunia, Centre-ville" required className="h-14 pl-12 bg-background/50 border-white/5 rounded-2xl focus:border-accent" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Description des défis techniques</Label>
                                <Textarea name="description" placeholder="Quels sont les problèmes rencontrés ? (Lenteurs, coupures, manque de sécurité...)" required className="min-h-[150px] bg-background/50 border-white/5 rounded-[2rem] p-6 text-sm italic" />
                            </div>

                            <div className="pt-6">
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className="w-full h-20 bg-accent text-black font-black uppercase italic rounded-2xl shadow-2xl shadow-accent/20 text-lg gap-3"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><ShieldCheck /> Lancer la Mission d'Expertise</>}
                                </Button>
                                <p className="text-[9px] font-bold text-center mt-6 text-muted-foreground uppercase opacity-40">Un consultant Business DKS prendra contact pour fixer le rendez-vous d'expertise.</p>
                            </div>
                        </div>
                    </Card>
                </form>
            </main>
        </div>
    );
}
