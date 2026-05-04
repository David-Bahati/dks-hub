
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
    Smartphone
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetFooter 
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

const SERVICES = [
    {
        id: "ia-workshop",
        category: "formation",
        title: "Atelier Maîtrise de l'IA",
        description: "Domptez ChatGPT, Gemini et les outils de génération d'images pour décupler votre productivité.",
        price: 50,
        icon: <GraduationCap className="text-primary" size={40} />,
        features: ["Pratique intensive", "Accès GPT-4 Pro inclus", "Certificat DKS Elite"]
    },
    {
        id: "remote-fix",
        category: "support",
        title: "Expertise Directe à Distance",
        description: "Dépannage logiciel instantané par prise en main sécurisée. Réparons vos bugs sans attendre.",
        price: 15,
        icon: <MonitorSmartphone className="text-accent" size={40} />,
        features: ["Intervention < 15min", "Diagnostic complet", "Satisfait ou Remboursé"]
    },
    {
        id: "network-install",
        category: "infrastructure",
        title: "Réseau & Wi-Fi Business",
        description: "Installation Starlink, configuration routeurs maillés et sécurisation de vos accès d'entreprise.",
        price: 150,
        icon: <Globe className="text-accent" size={40} />,
        features: ["Audit couverture", "Pare-feu matériel", "Garantie stabilité"]
    },
    {
        id: "hardware-upgrade",
        category: "upgrade",
        title: "Optimisation & Turbo Upgrade",
        description: "Boostez votre matériel actuel. Migration SSD NVMe et extension RAM haute fréquence.",
        price: 25,
        icon: <Cpu className="text-purple-400" size={40} />,
        features: ["Installation OS Pro", "Nettoyage interne", "Vérification Thermique"]
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
        if (service.id === 'remote-fix') { router.push('/dashboard/remote'); return; }
        if (!user) { toast({ title: "Accès Membre Requis", description: "Connectez-vous pour accéder au planning d'expertise." }); router.push('/login'); return; }
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
                status: 'pending',
                scheduledDate: formData.get('date'),
                location: formData.get('location'),
                notes: formData.get('notes'),
                createdAt: serverTimestamp()
            });

            toast({ title: "Mission Enregistrée", description: "L'équipe DKS analyse votre demande pour confirmation." });
            setIsSheetOpen(false);
            router.push('/dashboard/services');
        } catch (error) {
            toast({ title: "Erreur Transmission", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            
            <section className="py-24 px-6 text-center">
                <Badge className="bg-accent/20 text-accent border-none font-black uppercase tracking-[0.3em] px-6 py-2 mb-8">Pôle Services Technologiques</Badge>
                <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none mb-6">EXPERTISES <br /><span className="text-accent">D'ÉLITE</span></h1>
                <p className="text-xl text-muted-foreground font-light max-w-3xl mx-auto uppercase tracking-widest opacity-60 italic">
                    Propulsez vos performances numériques avec le savoir-faire Double King Shop.
                </p>
            </section>

            <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-32">
                {SERVICES.map((service) => (
                    <Card key={service.id} className="glossy-card border-none rounded-[3rem] overflow-hidden flex flex-col group hover:scale-[1.03] transition-all duration-500">
                        <CardHeader className="p-10 space-y-6">
                            <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center group-hover:bg-accent/10 transition-colors shadow-2xl">
                                {service.icon}
                            </div>
                            <div>
                                <Badge className="bg-white/5 text-accent border-none uppercase text-[9px] font-black tracking-widest mb-3">{service.category}</Badge>
                                <CardTitle className="text-2xl font-black uppercase italic tracking-tight leading-none">{service.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="px-10 flex-1 space-y-6">
                            <p className="text-muted-foreground text-sm leading-relaxed font-medium italic opacity-80">"{service.description}"</p>
                            <div className="space-y-3">
                                {service.features.map((f, i) => (
                                    <div key={i} className="flex items-center gap-3 text-[10px] font-black uppercase text-white/40 tracking-widest">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> {f}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                        <CardFooter className="p-10 bg-white/5 border-t border-white/5">
                            <div className="flex justify-between items-end w-full">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground/40 italic">Tarif Hub</p>
                                    <p className="text-3xl font-black text-white">${service.price}</p>
                                </div>
                                <Button 
                                    onClick={() => handleOpenBooking(service)}
                                    className="bg-white text-black font-black uppercase italic rounded-xl px-8 h-12 shadow-xl hover:bg-accent hover:text-black transition-all"
                                >
                                    Démarrer <ArrowRight size={18} className="ml-2" />
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </section>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-10 bg-primary/10 border-b border-white/5">
                        <div className="flex items-center gap-5 mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-xl shadow-primary/10">
                                <Calendar size={32} />
                            </div>
                            <div>
                                <SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">Réserver Expertise</SheetTitle>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Planification Hub DKS</p>
                            </div>
                        </div>
                        <Badge className="w-fit bg-primary text-white border-none uppercase font-black italic">{selectedService?.title}</Badge>
                    </SheetHeader>

                    <form onSubmit={handleBooking} className="flex-1 p-10 space-y-8 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Numéro WhatsApp</Label>
                                <div className="relative">
                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <Input name="phone" placeholder="+243..." required className="h-14 pl-12 bg-background/50 border-white/5 rounded-2xl focus:border-accent text-lg font-bold" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Date d'Intervention Souhaitée</Label>
                                <Input name="date" type="date" required className="h-14 bg-background/50 border-white/5 rounded-2xl focus:border-accent uppercase font-black" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Localisation</Label>
                                <Select name="location" defaultValue="shop">
                                    <SelectTrigger className="h-14 bg-background/50 border-white/5 rounded-2xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-white/10">
                                        <SelectItem value="shop" className="font-black uppercase text-[10px]">
                                            <div className="flex items-center gap-2"><MapPin size={12} className="text-accent" /> Boutique (Immeuble Bahati)</div>
                                        </SelectItem>
                                        <SelectItem value="client_site" className="font-black uppercase text-[10px]">
                                            <div className="flex items-center gap-2"><Globe size={12} className="text-primary" /> À Domicile / Bureau (Bunia)</div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Notes Additionnelles</Label>
                                <Textarea name="notes" placeholder="Détails sur l'équipement, contraintes de temps..." className="min-h-[100px] bg-background/50 border-white/5 rounded-2xl italic" />
                            </div>
                        </div>

                        <div className="pt-8">
                            <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-primary text-white font-black uppercase italic rounded-2xl shadow-xl shadow-primary/20 text-lg">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Envoyer ma Demande Hub"}
                            </Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    );
}
