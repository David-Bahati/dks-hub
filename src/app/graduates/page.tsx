
"use client";

import { useState, useMemo } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Award, 
    Search, 
    ShieldCheck, 
    User, 
    Calendar, 
    CheckCircle2, 
    Loader2, 
    Sparkles, 
    Globe,
    Cpu,
    BookOpen,
    MessageSquareText,
    Star,
    Quote
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useCollection, useMemoFirebase } from '@/firebase';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function GraduatesDirectoryPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");

    // Fetch only completed formation bookings
    const graduatesQuery = useMemoFirebase(() => {
        return query(
            collection(db, "serviceBookings"),
            where("status", "==", "completed"),
            where("category", "==", "formation"),
            orderBy("createdAt", "desc")
        );
    }, []);

    const { data: graduates, isLoading } = useCollection(graduatesQuery);

    // Fetch reviews for testimonials wall
    const reviewsQuery = useMemoFirebase(() => {
        return query(
            collection(db, "reviews"),
            orderBy("createdAt", "desc"),
            limit(6)
        );
    }, []);
    const { data: reviews, isLoading: reviewsLoading } = useCollection(reviewsQuery);

    const filteredGraduates = useMemo(() => {
        if (!graduates) return [];
        return graduates.filter(g => {
            const matchesSearch = g.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 g.serviceTitle?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = activeFilter === "all" || g.serviceId === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }, [graduates, searchTerm, activeFilter]);

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <Navbar />

            {/* HERO SECTION */}
            <section className="relative py-24 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent opacity-50" />
                <div className="container max-w-6xl mx-auto text-center relative z-10">
                    <Badge className="bg-accent/20 text-accent border-accent/20 font-black uppercase tracking-[0.4em] px-8 py-2 mb-8 rounded-full">
                        DKS Certified Experts
                    </Badge>
                    <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.8] mb-8">
                        L'ÉLITE <br /><span className="premium-gradient-text">CERTIFIÉE</span>
                    </h1>
                    <p className="text-xl text-muted-foreground font-light max-w-3xl mx-auto uppercase tracking-widest leading-relaxed">
                        Le répertoire officiel des talents formés et validés par Double King Academy à Bunia.
                    </p>
                </div>
            </section>

            {/* TESTIMONIALS WALL */}
            {reviews && reviews.length > 0 && (
                <section className="container max-w-7xl mx-auto px-6 mb-32">
                    <div className="flex items-center gap-6 mb-12">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent flex items-center gap-2">
                           <MessageSquareText size={14} /> Témoignages d'Élite
                        </h2>
                        <div className="h-px flex-1 bg-accent/10" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {reviews.map((rev) => (
                            <Card key={rev.id} className="bg-white/[0.03] border-white/5 rounded-[2rem] p-8 relative overflow-hidden group">
                                <Quote className="absolute -top-4 -right-4 w-20 h-20 text-accent/5 rotate-12" />
                                <div className="relative z-10 space-y-6">
                                    <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={12} className={cn(i < rev.rating ? "text-accent fill-accent" : "text-white/10")} />
                                        ))}
                                    </div>
                                    <p className="text-sm italic leading-relaxed text-white/80 line-clamp-4">"{rev.comment || "Une expérience exceptionnelle avec les experts de Double King Shop."}"</p>
                                    <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                                        <Avatar className="h-10 w-10 border border-accent/20">
                                            <AvatarImage src={rev.userPhoto} />
                                            <AvatarFallback className="bg-accent/10 text-accent font-bold text-xs">{rev.userName?.substring(0, 1)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-xs font-black uppercase italic text-white">{rev.userName}</p>
                                            <p className="text-[8px] font-bold uppercase text-accent/60 tracking-widest">{rev.serviceTitle}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* DIRECTORY CONTROLS */}
            <section className="container max-w-7xl mx-auto px-6 mb-16">
                <div className="flex items-center gap-6 mb-12">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-2">
                       <User size={14} /> Registre des Experts
                    </h2>
                    <div className="h-px flex-1 bg-primary/10" />
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <input 
                            type="text" 
                            placeholder="Rechercher un nom ou une certification..." 
                            className="w-full h-16 pl-14 pr-6 bg-white/5 border border-white/10 rounded-2xl focus:border-accent transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        {[
                            { id: "all", label: "Tous", icon: null },
                            { id: "ia-mastery", label: "IA Expert", icon: <Sparkles size={12}/> },
                            { id: "crypto-trading", label: "Blockchain", icon: <Globe size={12}/> },
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setActiveFilter(f.id)}
                                className={cn(
                                    "px-6 h-16 rounded-2xl font-black uppercase italic text-[10px] tracking-widest border transition-all flex items-center gap-2",
                                    activeFilter === f.id 
                                        ? "bg-accent border-accent text-black" 
                                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                                )}
                            >
                                {f.icon} {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* GRADUATES GRID */}
            <section className="container max-w-7xl mx-auto px-6">
                {isLoading ? (
                    <div className="py-32 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-accent h-12 w-12" />
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Chargement de l'excellence...</p>
                    </div>
                ) : filteredGraduates.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredGraduates.map((grad) => (
                            <Card key={grad.id} className="glossy-card border-none rounded-[3rem] overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                                <CardContent className="p-10 space-y-8">
                                    <div className="flex justify-between items-start">
                                        <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                                            <User size={32} />
                                        </div>
                                        <div className="text-right">
                                            <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[8px] font-black px-3 py-1 mb-2">
                                                <ShieldCheck size={10} className="mr-1" /> Vérifié DKS
                                            </Badge>
                                            <p className="text-[8px] font-black uppercase text-muted-foreground opacity-40 tracking-widest">
                                                Certifié le {grad.updatedAt?.toDate ? grad.updatedAt.toDate().toLocaleDateString('fr-FR') : 'Récemment'}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-black uppercase italic tracking-tight text-white mb-1">{grad.customerName}</h3>
                                        <p className="text-accent text-[11px] font-black uppercase tracking-widest leading-none">
                                            {grad.serviceTitle}
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
                                                <Award size={16} />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Spécialisation: {grad.level || 'Expert'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
                                                <BookOpen size={16} />
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ID Certif: DKS-CERT-{grad.id.substring(0,6).toUpperCase()}</span>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 hover:bg-accent/10 hover:text-accent font-black uppercase italic text-[10px]" asChild>
                                            <a href={`https://wa.me/243823038945?text=Bonjour,%20je%20souhaite%20contacter%20l'expert%20${grad.customerName}%20concernant%20sa%20certification%20${grad.serviceTitle}.`} target="_blank" rel="noopener noreferrer">
                                                Contacter via le Hub
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                        <Award size={80} strokeWidth={1} />
                        <p className="text-xl font-black uppercase italic tracking-tighter">La promotion est en cours...</p>
                        <p className="text-xs max-w-sm uppercase font-black tracking-widest leading-relaxed">Les premiers experts d'élite seront affichés dès validation de leurs examens.</p>
                    </div>
                )}
            </section>

            {/* RECRUITER CTA */}
            <section className="container max-w-5xl mx-auto px-6 mt-32">
                <Card className="bg-primary/10 border-primary/20 rounded-[3rem] p-12 relative overflow-hidden text-center md:text-left">
                    <div className="absolute top-0 right-0 p-12 opacity-5"><Logo size="xl" /></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                        <div className="space-y-6">
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">RECRUTEZ NOS <br /><span className="text-primary">TALENTS</span></h2>
                            <p className="text-muted-foreground max-w-md">Toutes les entreprises de l'Ituri peuvent consulter ce registre pour trouver des collaborateurs qualifiés en IA et Infrastructure.</p>
                        </div>
                        <Button className="h-16 px-10 rounded-2xl bg-white text-primary font-black uppercase italic shadow-xl">Audit de Certification</Button>
                    </div>
                </Card>
            </section>
        </div>
    );
}
