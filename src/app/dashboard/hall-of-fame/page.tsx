
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Crown, Star, Medal, User, Calendar, Award, Loader2, Sparkles } from "lucide-react";
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

export default function HallOfFamePage() {
    const entriesQuery = useMemoFirebase(() => {
        return query(collection(db, "hallOfFame"), orderBy("createdAt", "desc"));
    }, []);

    const { data: entries, isLoading } = useCollection(entriesQuery);

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <Navbar />
            
            <header className="relative py-24 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent opacity-50" />
                <div className="container max-w-4xl mx-auto text-center relative z-10">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="mb-8 gap-2 text-muted-foreground hover:text-accent font-bold uppercase italic text-[10px]">
                            <ArrowLeft size={14} /> Retour Dashboard
                        </Button>
                    </Link>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20 font-black uppercase tracking-[0.4em] px-8 py-2 mb-8 rounded-full">
                        <Trophy size={14} className="mr-2" /> Le Mur des Légendes DKS
                    </Badge>
                    <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85] mb-8">
                        HALL OF <br /><span className="text-yellow-500">FAME</span>
                    </h1>
                    <p className="text-xl text-muted-foreground font-light max-w-2xl mx-auto uppercase tracking-widest leading-relaxed">
                        Célébrons les membres dont l'excellence et la générosité ont marqué l'histoire du Hub.
                    </p>
                </div>
            </header>

            <main className="container max-w-6xl mx-auto px-6">
                {isLoading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-yellow-500 h-12 w-12" /></div>
                ) : entries && entries.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {entries.map((entry) => (
                            <Card key={entry.id} className="glossy-card border-none rounded-[3rem] overflow-hidden group hover:scale-[1.02] transition-all duration-500">
                                <CardContent className="p-10 space-y-8">
                                    <div className="flex justify-between items-start">
                                        <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                                            {entry.title?.includes("Philanthrope") ? <Sparkles size={32} /> : <Crown size={32} />}
                                        </div>
                                        <Badge className="bg-white/5 text-yellow-400 border-none uppercase text-[8px] font-black px-3 py-1">
                                            {entry.period}
                                        </Badge>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-black uppercase italic tracking-tight text-white mb-1">{entry.userName}</h3>
                                        <p className="text-yellow-500 text-[11px] font-black uppercase tracking-widest leading-none">
                                            {entry.title}
                                        </p>
                                    </div>

                                    <div className="p-6 bg-black/40 rounded-3xl border border-white/5">
                                        <p className="text-xs text-white/60 italic leading-relaxed">"{entry.achievement}"</p>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 flex items-center gap-3">
                                        <Calendar size={14} className="text-muted-foreground opacity-40" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Inscrit à l'histoire le {new Date(entry.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                        <Medal size={80} strokeWidth={1} />
                        <p className="text-xl font-black uppercase italic tracking-tighter">L'histoire s'écrit maintenant...</p>
                        <p className="text-xs max-w-sm uppercase font-black tracking-widest leading-relaxed">Les premiers membres seront inscrits à la fin du mois en cours.</p>
                    </div>
                )}
            </main>

            <footer className="mt-32 text-center">
                <Logo size="sm" className="justify-center opacity-20" />
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/10 mt-4">EST. 2024 • DOUBLE KING SHOP HUB</p>
            </footer>
        </div>
    );
}
