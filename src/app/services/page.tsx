
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { 
    GraduationCap, 
    Globe, 
    Cpu, 
    Rocket, 
    ShieldCheck, 
    Zap, 
    ArrowRight, 
    Loader2, 
    Calendar,
    Sparkles,
    Smartphone,
    HardDrive,
    MonitorSmartphone
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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

const SERVICES = [
    {
        id: "ia-workshop",
        category: "formation",
        title: "Atelier Maîtrise de l'IA",
        description: "Apprenez à utiliser ChatGPT, Gemini et Midjourney pour booster votre productivité professionnelle.",
        price: 50,
        icon: <GraduationCap className="text-primary" size={40} />,
        features: ["Pratique sur PC DKS", "Supports de cours offerts", "Accès groupe WhatsApp Pro"]
    },
    {
        id: "remote-fix",
        category: "support",
        title: "Dépannage à Distance",
        description: "Assistance logicielle immédiate via AnyDesk. Résolution de bugs, installation de drivers ou nettoyage système.",
        price: 15,
        icon: <MonitorSmartphone className="text-accent" size={40} />,
        features: ["Intervention en moins de 30min", "Sécurisé & Transparent", "Paiement après résultat"]
    },
    {
        id: "network-install",
        category: "infrastructure",
        title: "Installation Réseau & Wi-Fi",
        description: "Optimisation de votre connexion. Configuration de routeurs, répéteurs et câblage pour bureaux ou domicile.",
        price: 150,
        icon: <Globe className="text-accent" size={40} />,
        features: ["Analyse couverture signal", "Configuration Starlink/Fibre", "Garantie stabilité 3 mois"]
    },
    {
        id: "hardware-upgrade",
        category: "upgrade",
        title: "Optimisation SSD & RAM",
        description: "Donnez une seconde vie à votre ancien laptop. Remplacement HDD par SSD et ajout de mémoire vive.",
        price: 25,
        icon: <Cpu className="text-purple-400" size={40} />,
        features: ["Installation Windows 11 incluse", "Nettoyage interne offert", "Transfert de données safe"]
    }
];

export default function ServicesCataloguePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [selectedService, setSelectedService] = useState<any>(null);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleOpenBooking = (service: any) => {
        if (service.id === 'remote-fix') {
            router.push('/dashboard/remote');
            return;
        }
        
        if (!user) {
            toast({ title: "Identification requise", description: "Veuillez vous connecter pour réserver un service." });
            router.push('/login');
            return;
        }
        setSelectedService(service);
        setIsBookingOpen(true);
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
                status: 'pending',
                scheduledDate: formData.get('date'),
                location: formData.get('location'),
                address: formData.get('address'),
                notes: formData.get('notes'),
                createdAt: serverTimestamp()
            });

            toast({ title: "Réservation envoyée !", description: "Notre équipe vous contactera pour confirmer le créneau." });
            setIsBookingOpen(false);
            router.push('/dashboard/services');
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible d'envoyer la demande.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            
            <section className="py-20 px-6 relative overflow-hidden">
                <div className="max-w-6xl mx-auto text-center space-y-6">
                    <Badge className="bg-accent/20 text-accent border-none font-black uppercase tracking-[0.2em] px-5 py-2">Centre de Services Technologiques</Badge>
                    <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">VOTRE EXPERT <br /><span className="text-accent">À BUNIA</span></h1>
                    <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
                        Nous propulsons votre transition numérique en Ituri avec des solutions sur mesure.
                    </p>
                </div>
            </section>

            {/* AI ADVISOR PROMO */}
            <section className="max-w-7xl mx-auto px-6 mb-20">
                <Card className="bg-primary/10 border-primary/20 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5"><Sparkles size={150} /></div>
                    <div className="flex-1 space-y-6 relative z-10 text-center md:text-left">
                        <Badge className="bg-primary text-white font-black uppercase italic">Nouveauté IA</Badge>
                        <h2 className="text-4xl font-black uppercase italic tracking-tight">Pas sûr de votre choix ? <br />Demandez à l'IA DKS.</h2>
                        <p className="text-muted-foreground">Notre conseiller intelligent analyse votre budget et notre stock pour vous proposer la config parfaite.</p>
                        <Link href="/services/advisor">
                            <Button className="h-14 px-8 rounded-2xl bg-white text-primary font-black uppercase italic shadow-xl hover:bg-accent hover:text-black">
                                Essayer l'Assistant IA <ArrowRight size={20} className="ml-2" />
                            </Button>
                        </Link>
                    </div>
                    <div className="w-64 h-64 bg-primary/20 rounded-full flex items-center justify-center border-4 border-primary/10 animate-pulse">
                        <Cpu size={80} className="text-primary" />
                    </div>
                </Card>
            </section>

            <section className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {SERVICES.map((service) => (
                        <Card key={service.id} className="glossy-card border-none rounded-[3rem] overflow-hidden flex flex-col group hover:scale-[1.02] transition-transform duration-500">
                            <CardHeader className="p-10 space-y-6">
                                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                                    {service.icon}
                                </div>
                                <div>
                                    <Badge className="bg-white/5 text-muted-foreground border-none uppercase text-[9px] font-black tracking-widest mb-3">{service.category}</Badge>
                                    <CardTitle className="text-2xl font-black uppercase italic tracking-tight">{service.title}</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="px-10 flex-1 space-y-6">
                                <p className="text-muted-foreground text-sm leading-relaxed font-light">{service.description}</p>
                                <ul className="space-y-3">
                                    {service.features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-3 text-[10px] font-black uppercase italic text-white/40">
                                            <Zap size={12} className="text-accent" /> {f}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter className="p-10 bg-white/5 border-t border-white/5">
                                <div className="flex justify-between items-end w-full">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground/40 italic">Tarif indicatif</p>
                                        <p className="text-3xl font-black text-accent">${service.price}</p>
                                    </div>
                                    <Button 
                                        onClick={() => handleOpenBooking(service)}
                                        className="bg-white text-black font-black uppercase italic rounded-xl px-6 h-12 shadow-xl hover:bg-accent hover:text-black transition-all"
                                    >
                                        {service.id === 'remote-fix' ? 'Démarrer' : 'Réserver'} <ArrowRight size={16} className="ml-2" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>

            <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                <DialogContent className="glossy-card border-none rounded-[2.5rem] max-w-xl p-0 overflow-hidden">
                    <div className="bg-primary p-10 text-white">
                        <DialogHeader>
                            <div className="flex items-center gap-4 mb-4">
                                <Calendar size={32} />
                                <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Réserver un Service</DialogTitle>
                            </div>
                            <p className="text-primary-foreground/80 font-light italic">{selectedService?.title}</p>
                        </DialogHeader>
                    </div>

                    <form onSubmit={handleBooking} className="p-10 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Numéro WhatsApp</Label>
                                <Input name="phone" placeholder="+243..." required className="h-12 bg-background/50 border-white/10 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Date souhaitée</Label>
                                <Input name="date" type="date" required className="h-12 bg-background/50 border-white/10 rounded-xl" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Lieu de l'intervention</Label>
                            <Select name="location" defaultValue="shop">
                                <SelectTrigger className="h-12 bg-background/50 border-white/10 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-white/10">
                                    <SelectItem value="shop">En boutique (Immeuble Bahati)</SelectItem>
                                    <SelectItem value="client_site">À domicile / Bureau (Bunia Ville)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Notes ou précisions</Label>
                            <Textarea name="notes" placeholder="Détaillez votre besoin..." className="min-h-[80px] bg-background/50 border-white/10 rounded-xl" />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsBookingOpen(false)} className="font-bold uppercase text-[10px]">Annuler</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-accent text-black font-black uppercase italic rounded-xl px-10 h-14 shadow-xl flex-1">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Envoyer la réservation"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
