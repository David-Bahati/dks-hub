
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { 
    GraduationCap, 
    Globe, 
    Cpu, 
    ArrowRight, 
    Loader2, 
    Calendar,
    Sparkles,
    MonitorSmartphone,
    MapPin,
    Smartphone,
    CheckCircle2,
    Star,
    Award,
    BookOpen,
    Users,
    ShieldCheck,
    Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from "@/lib/utils";

const ACADEMY_COURSES = [
    {
        id: "ia-mastery",
        category: "formation",
        title: "Masterclass IA & Productivité",
        subtitle: "L'excellence algorithmique au service du business.",
        description: "Un cursus intensif pour dompter ChatGPT-4, Midjourney et les agents IA autonomes.",
        price: 75,
        duration: "10 Heures",
        certification: "DKS Certified IA Expert",
        icon: <Sparkles className="text-accent" size={40} />,
        curriculum: ["Prompt Engineering Avancé", "Automatisation No-Code", "Générations Médias HD"],
        includes: ["Accès API GPT-4", "Support de cours digital", "Networking Privé"]
    },
    {
        id: "crypto-trading",
        category: "formation",
        title: "Économie Digitale & Crypto",
        subtitle: "Comprendre la Blockchain et le Web3.",
        description: "De la gestion de wallet à l'analyse fondamentale. Sécurisez votre avenir financier.",
        price: 50,
        duration: "8 Heures",
        certification: "Blockchain Associate",
        icon: <Award className="text-primary" size={40} />,
        curriculum: ["Sécurité des actifs", "Smart Contracts", "Analyse de Marché"],
        includes: ["Coaching Wallet Ledger", "Guide de sécurité", "Audit de portefeuille"]
    }
];

const TECHNICAL_SERVICES = [
    {
        id: "network-pro",
        category: "infrastructure",
        title: "Déploiement Réseau Starlink",
        description: "Installation haute performance pour entreprises et résidences de luxe.",
        price: 150,
        icon: <Globe className="text-accent" size={32} />,
    },
    {
        id: "hardware-extreme",
        category: "upgrade",
        title: "Optimisation Hardware Elite",
        description: "Le summum de la performance : Custom Watercooling & Overclocking.",
        price: 45,
        icon: <Cpu className="text-purple-400" size={32} />,
    }
];

export default function ServicesCataloguePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [selectedService, setSelectedService] = useState<any>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenBooking = (service: any) => {
        if (!user) { 
            toast({ title: "Accès Membre Requis", description: "Veuillez vous connecter pour accéder à nos services." }); 
            router.push('/login'); 
            return; 
        }
        setSelectedService(service);
        setIsSheetOpen(true);
    };

    const handleBooking = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            await addDoc(collection(db, "serviceBookings"), {
                userId: user?.uid,
                customerName: user?.name,
                customerPhone: formData.get('phone'),
                serviceId: selectedService.id,
                serviceTitle: selectedService.title,
                category: selectedService.category,
                level: formData.get('level'),
                status: 'pending',
                scheduledDate: formData.get('date'),
                location: formData.get('location') || 'shop',
                notes: formData.get('notes'),
                createdAt: serverTimestamp()
            });

            toast({ title: "Dossier Transmis", description: "Un conseiller DKS Academy va analyser votre profil." });
            setIsSheetOpen(false);
            router.push('/dashboard/services');
        } catch (error) {
            toast({ title: "Erreur Transmission", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <Navbar />
            
            {/* HERO SECTION PREMIUM */}
            <section className="relative py-32 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
                <div className="container max-w-6xl mx-auto text-center relative z-10">
                    <Badge className="bg-primary/20 text-primary border-primary/20 font-black uppercase tracking-[0.4em] px-8 py-2.5 mb-10 rounded-full">
                        Double King Academy & Solutions
                    </Badge>
                    <h1 className="text-7xl md:text-9xl font-black uppercase italic tracking-tighter leading-[0.8] mb-8">
                        L'ÉLITE <br /><span className="premium-gradient-text">TECH</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-3xl mx-auto uppercase tracking-widest leading-relaxed">
                        Formations certifiantes et infrastructures réseaux de nouvelle génération à Bunia.
                    </p>
                </div>
            </section>

            {/* SECTION AUDIT TECHNIQUE - NEW */}
            <section className="container max-w-7xl mx-auto px-6 mb-32">
                <Card className="bg-accent/10 border-accent/20 rounded-[4rem] p-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><Building2 size={240} /></div>
                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                        <div className="flex-1 space-y-8">
                            <Badge className="bg-accent text-black font-black uppercase tracking-[0.3em] px-4 py-1.5 italic">OFFRE CORPORATE</Badge>
                            <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9] text-white">
                                AUDIT TECHNIQUE <br /><span className="text-accent">INFRASTRUCTURE</span>
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-medium">
                                Votre entreprise fait face à des lenteurs réseaux ou des failles de sécurité ? Nos experts certifiés interviennent pour un audit complet de vos systèmes à Bunia.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-accent">
                                    <ShieldCheck size={14}/> Diagnostic Sécurité
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-accent">
                                    <Globe size={14}/> Optimisation Starlink
                                </div>
                            </div>
                        </div>
                        <div className="shrink-0">
                            <Link href="/services/audit">
                                <Button className="h-24 px-12 rounded-[2rem] bg-accent text-black font-black uppercase italic text-xl shadow-[0_0_50px_rgba(56,189,248,0.3)] hover:scale-105 active:scale-95 transition-all">
                                    Demander un Audit <ArrowRight size={28} className="ml-3" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Card>
            </section>

            {/* SECTION ACADEMY (LES FORMATIONS) */}
            <section className="container max-w-7xl mx-auto px-6 mb-32">
                <div className="flex items-center gap-6 mb-16">
                    <div className="h-px flex-1 bg-white/5" />
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                        <GraduationCap className="text-primary" /> DKS Academy
                    </h2>
                    <div className="h-px flex-1 bg-white/5" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {ACADEMY_COURSES.map((course) => (
                        <Card key={course.id} className="glossy-card border-none rounded-[3.5rem] overflow-hidden group hover:scale-[1.01] transition-all duration-500">
                            <div className="p-12 flex flex-col md:flex-row gap-10">
                                <div className="space-y-8 flex-1">
                                    <div className="flex items-start justify-between">
                                        <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center shadow-2xl group-hover:bg-primary/10 transition-colors">
                                            {course.icon}
                                        </div>
                                        <Badge className="bg-white/5 text-primary border-none font-black text-[10px] px-4 py-1.5 rounded-full uppercase italic">
                                            {course.duration}
                                        </Badge>
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black uppercase italic tracking-tight mb-2 leading-none">{course.title}</h3>
                                        <p className="text-primary text-[11px] font-black uppercase tracking-widest opacity-80">{course.subtitle}</p>
                                    </div>
                                    <p className="text-muted-foreground text-sm leading-relaxed italic">"{course.description}"</p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] flex items-center gap-2"><BookOpen size={12}/> Programme</p>
                                            {course.curriculum.map((item, i) => (
                                                <div key={i} className="flex items-center gap-3 text-[10px] font-bold text-white/70 uppercase">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {item}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em] flex items-center gap-2"><CheckCircle2 size={12}/> Avantages</p>
                                            {course.includes.map((item, i) => (
                                                <div key={i} className="flex items-center gap-3 text-[10px] font-bold text-white/70 uppercase">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-accent" /> {item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="md:w-64 bg-black/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 p-8 flex flex-col justify-between items-center text-center">
                                    <div className="space-y-2">
                                        <Badge className="bg-accent/10 text-accent border-none text-[8px] font-black uppercase tracking-widest px-3 py-1">Insigne Officiel</Badge>
                                        <div className="flex flex-col items-center gap-2">
                                            <Award size={48} className="text-accent opacity-50" />
                                            <p className="text-[9px] font-black uppercase leading-tight text-muted-foreground">{course.certification}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full space-y-6">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground italic">Investissement</p>
                                            <p className="text-4xl font-black text-white">${course.price}</p>
                                        </div>
                                        <Button 
                                            onClick={() => handleOpenBooking(course)}
                                            className="w-full h-14 bg-white text-black font-black uppercase italic rounded-2xl hover:bg-primary hover:text-white transition-all shadow-xl"
                                        >
                                            S'Inscrire <ArrowRight size={18} className="ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            {/* SECTION SERVICES TECHNIQUES PRO */}
            <section className="container max-w-7xl mx-auto px-6">
                <div className="flex items-center gap-6 mb-16">
                    <div className="h-px flex-1 bg-white/5" />
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                        <Cpu className="text-accent" /> Expertises Solutions
                    </h2>
                    <div className="h-px flex-1 bg-white/5" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {TECHNICAL_SERVICES.map((service) => (
                        <Card key={service.id} className="glossy-card border-none rounded-[3rem] p-10 group flex flex-col md:flex-row items-center gap-10">
                            <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center text-accent shrink-0 shadow-2xl">
                                {service.icon}
                            </div>
                            <div className="flex-1 text-center md:text-left space-y-4">
                                <div>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tight">{service.title}</h3>
                                    <p className="text-muted-foreground text-sm font-medium italic">"{service.description}"</p>
                                </div>
                                <div className="flex flex-wrap justify-center md:justify-start items-center gap-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground/40 italic">À partir de</span>
                                        <span className="text-2xl font-black text-white">${service.price}</span>
                                    </div>
                                    <Button 
                                        variant="outline"
                                        onClick={() => handleOpenBooking(service)}
                                        className="h-12 px-8 rounded-xl border-white/10 font-black uppercase italic text-xs hover:bg-accent hover:text-black transition-all"
                                    >
                                        Démarrer le projet
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </section>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-10 bg-primary/10 border-b border-white/5">
                        <div className="flex items-center gap-5 mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-xl shadow-primary/10">
                                <GraduationCap size={32} />
                            </div>
                            <div>
                                <SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">
                                    {selectedService?.category === 'formation' ? 'Demande d\'Admission' : 'Réservation Expert'}
                                </SheetTitle>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Planification Hub DKS</p>
                            </div>
                        </div>
                        <Badge className="w-fit bg-primary text-white border-none uppercase font-black italic">{selectedService?.title}</Badge>
                    </SheetHeader>

                    <form onSubmit={handleBooking} className="flex-1 p-10 space-y-8 overflow-y-auto custom-scrollbar">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Numéro WhatsApp Privilège</Label>
                                <div className="relative">
                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <Input name="phone" placeholder="+243..." required className="h-14 pl-12 bg-background/50 border-white/5 rounded-2xl focus:border-accent text-lg font-bold" />
                                </div>
                            </div>

                            {selectedService?.category === 'formation' && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Niveau d'Expertise Actuel</Label>
                                    <Select name="level" defaultValue="beginner">
                                        <SelectTrigger className="h-14 bg-background/50 border-white/5 rounded-2xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-white/10">
                                            <SelectItem value="beginner" className="font-black uppercase text-[10px]">Débutant (Curieux)</SelectItem>
                                            <SelectItem value="intermediate" className="font-black uppercase text-[10px]">Intermédiaire (Praticien)</SelectItem>
                                            <SelectItem value="expert" className="font-black uppercase text-[10px]">Expert (Professionnel)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Date d'Intervention Souhaitée</Label>
                                <Input name="date" type="date" required className="h-14 bg-background/50 border-white/5 rounded-2xl focus:border-accent uppercase font-black" />
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Objectifs Spécifiques</Label>
                                <Textarea name="notes" placeholder="Décrivez vos attentes ou le projet à réaliser..." className="min-h-[120px] bg-background/50 border-white/5 rounded-2xl italic text-sm" />
                            </div>
                        </div>

                        <div className="pt-8">
                            <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-primary text-white font-black uppercase italic rounded-2xl shadow-xl shadow-primary/20 text-lg">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Envoyer ma Candidature Academy"}
                            </Button>
                            <p className="text-[9px] font-bold text-center mt-6 text-muted-foreground uppercase opacity-40">Votre demande sera traitée sous 12 heures par un Expert DKS.</p>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    );
}
