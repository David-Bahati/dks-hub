
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
    Smartphone,
    Database,
    HardDrive,
    Layout
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

const SERVICES = [
    {
        id: "ia-workshop",
        category: "formation",
        title: "Atelier Maîtrise de l'IA",
        description: "Apprenez à utiliser ChatGPT, Gemini et Midjourney pour booster votre productivité professionnelle.",
        price: 50,
        duration: "3h",
        icon: <GraduationCap className="text-primary" size={40} />,
        features: ["Pratique sur PC DKS", "Supports de cours offerts", "Accès groupe WhatsApp Pro"]
    },
    {
        id: "crypto-security",
        category: "formation",
        title: "Formation Crypto & Sécurité",
        description: "Sécurisez vos Pi et autres crypto-actifs. Sessions pratiques sur le 2FA, Seed Phrases et Hardware Wallets.",
        price: 40,
        duration: "2h",
        icon: <ShieldCheck className="text-green-400" size={40} />,
        features: ["Audit de sécurité personnel", "Audit Pi Wallet", "Prévention arnaques locales"]
    },
    {
        id: "network-install",
        category: "infrastructure",
        title: "Installation Réseau & Wi-Fi",
        description: "Optimisation de votre connexion. Configuration de routeurs, répéteurs et câblage pour bureaux ou domicile.",
        price: 150,
        duration: "Sur devis",
        icon: <Globe className="text-accent" size={40} />,
        features: ["Analyse couverture signal", "Configuration Starlink/Fibre", "Garantie stabilité 3 mois"]
    },
    {
        id: "hardware-upgrade",
        category: "upgrade",
        title: "Optimisation SSD & RAM",
        description: "Donnez une seconde vie à votre ancien laptop. Remplacement HDD par SSD et ajout de mémoire vive.",
        price: 25,
        duration: "1h",
        icon: <Cpu className="text-purple-400" size={40} />,
        features: ["Installation Windows 11 incluse", "Nettoyage interne offert", "Transfert de données safe"]
    },
    {
        id: "web-deployment",
        category: "digitalisation",
        title: "Point de Déploiement Web",
        description: "Mise en ligne de votre site vitrine. Création de présence digitale pour les commerçants de Bunia.",
        price: 250,
        duration: "7 jours",
        icon: <Rocket className="text-orange-400" size={40} />,
        features: ["Nom de domaine .cd", "Emails pro", "Formation gestion basique"]
    },
    {
        id: "data-recovery",
        category: "digitalisation",
        title: "Récupération de Données",
        description: "Service critique pour récupérer vos fichiers sur clés USB, disques durs ou cartes SD endommagés.",
        price: 80,
        duration: "48h",
        icon: <HardDrive className="text-red-400" size={40} />,
        features: ["Diagnostic gratuit", "Paiement au succès uniquement", "Confidentialité totale"]
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

            await addDoc(collection(db, "notifications"), {
                userId: 'staff',
                title: "Nouvelle Demande de Service",
                message: `Le client ${user?.name} souhaite réserver : ${selectedService.title}.`,
                type: 'info',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/services'
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
                <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-30">
                    <div className="absolute top-0 left-[20%] w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-6xl mx-auto text-center space-y-6">
                    <Badge className="bg-accent/20 text-accent border-none font-black uppercase tracking-[0.2em] px-5 py-2">Centre de Services Technologiques</Badge>
                    <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">VOTRE EXPERT <br /><span className="text-accent">À BUNIA</span></h1>
                    <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto">
                        Nous ne vendons pas seulement du matériel, nous propulsons votre transition numérique en Ituri.
                    </p>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 py-20">
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
                                        <p className="text-3xl font-black text-accent">${service.price}<span className="text-xs font-light opacity-50 ml-1">USD</span></p>
                                    </div>
                                    <Button 
                                        onClick={() => handleOpenBooking(service)}
                                        className="bg-white text-black font-black uppercase italic rounded-xl px-6 h-12 shadow-xl hover:bg-accent hover:text-black transition-all"
                                    >
                                        Réserver <ArrowRight size={16} className="ml-2" />
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>

            <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                <DialogContent className="glossy-card border-none rounded-[2.5rem] max-w-xl p-0 overflow-hidden">
                    <div className="bg-primary p-10 text-white shrink-0">
                        <DialogHeader>
                            <div className="flex items-center gap-4 mb-4">
                                <Calendar size={32} />
                                <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Réserver une Intervention</DialogTitle>
                            </div>
                            <p className="text-primary-foreground/80 font-light italic">{selectedService?.title}</p>
                        </DialogHeader>
                    </div>

                    <form onSubmit={handleBooking} className="p-10 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Numéro WhatsApp (Bunia)</Label>
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
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Adresse ou détails complémentaires</Label>
                            <Textarea name="address" placeholder="Quartier, Avenue, N° Maison ou précisions sur le problème..." className="min-h-[80px] bg-background/50 border-white/10 rounded-xl" />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsBookingOpen(false)} className="font-bold uppercase text-[10px]">Annuler</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-accent text-black font-black uppercase italic rounded-xl px-10 h-14 shadow-xl flex-1">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Envoyer la demande de réservation"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
