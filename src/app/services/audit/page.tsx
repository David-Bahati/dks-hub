
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
    Briefcase,
    Calendar as CalendarIcon,
    Clock
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
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    const [date, setDate] = useState<Date>();
    const [timeSlot, setTimeSlot] = useState<string>("morning");

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

        if (!date) {
            toast({ title: "Date manquante", description: "Veuillez choisir une date pour l'expertise.", variant: "destructive" });
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
                scheduledDate: date.toISOString(),
                timeSlot: timeSlot,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await addDoc(collection(db, "audits"), auditData);

            await addDoc(collection(db, "notifications"), {
                userId: 'staff',
                title: "NOUVEAU DOSSIER BUSINESS",
                message: `Demande d'audit technique pour ${formData.get('businessName')} le ${format(date, "dd/MM")}.`,
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
                </div>
            </header>

            <main className="container max-w-6xl mx-auto px-6 py-20">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-1 space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-accent flex items-center gap-2">
                                <ShieldCheck size={16} /> Domaines d'Audit
                            </h2>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase opacity-60">Sélectionnez les pôles :</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {AUDIT_NEEDS.map((need) => (
                                <button
                                    key={need.id}
                                    type="button"
                                    onClick={() => toggleNeed(need.id)}
                                    className={cn(
                                        "flex items-center gap-4 p-5 rounded-[1.5rem] border-2 transition-all text-left",
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
                    </div>

                    <Card className="lg:col-span-2 glossy-card border-none rounded-[3rem] p-12 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5"><Building2 size={120} /></div>
                        
                        <div className="relative z-10 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Entreprise</Label>
                                    <Input name="businessName" placeholder="Ex: Banque de l'Ituri" required className="h-14 bg-background/50 border-white/5 rounded-2xl focus:border-accent text-lg font-bold" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Localisation</Label>
                                    <Input name="location" placeholder="Quartier..." required className="h-14 bg-background/50 border-white/5 rounded-2xl focus:border-accent" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Planification Expertise</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full h-14 justify-start text-left font-black uppercase italic text-xs bg-background/50 border-white/5 rounded-2xl",
                                                    !date && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-accent" />
                                                {date ? format(date, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-card border-white/10" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                initialFocus
                                                locale={fr}
                                                disabled={(date) => date < new Date()}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Créneau Horaire</Label>
                                    <Select value={timeSlot} onValueChange={setTimeSlot}>
                                        <SelectTrigger className="h-14 bg-background/50 border-white/5 rounded-2xl text-[10px] font-black uppercase">
                                            <Clock className="mr-2 h-4 w-4 text-accent" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-white/10">
                                            <SelectItem value="morning" className="text-[10px] font-black uppercase">Matinée (Expertise site)</SelectItem>
                                            <SelectItem value="afternoon" className="text-[10px] font-black uppercase">Après-midi (Audit technique)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Description technique</Label>
                                <Textarea name="description" placeholder="Problèmes rencontrés..." required className="min-h-[120px] bg-background/50 border-white/5 rounded-[2rem] p-6 text-sm italic" />
                            </div>

                            <div className="pt-6">
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className="w-full h-20 bg-accent text-black font-black uppercase italic rounded-2xl shadow-2xl shadow-accent/20 text-lg gap-3"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><ShieldCheck /> Lancer la Mission d'Expertise</>}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </form>
            </main>
        </div>
    );
}
