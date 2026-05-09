
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    RefreshCw, 
    ArrowLeft, 
    ShoppingBag, 
    ShieldCheck, 
    Plus, 
    Search, 
    Filter, 
    Zap, 
    Coins,
    User,
    CheckCircle2,
    Lock,
    Hammer,
    Monitor
} from "lucide-react";
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MOCK_P2P_ITEMS = [
    { id: '1', name: 'RTX 3080 d\'occasion', price: 450, seller: 'Expert_Justin', condition: 'Excellent', audit: true, category: 'GPU' },
    { id: '2', name: 'MacBook Air M1 8GB', price: 650, seller: 'Dave_DKS', condition: 'Bon état', audit: true, category: 'Laptop' },
    { id: '3', name: 'Clavier Razer Blackwidow', price: 40, seller: 'Mery_Elite', condition: 'Usé', audit: false, category: 'Accessory' },
];

function DKSP2PPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [search, setSearch] = useState("");

    const handleBuy = (item: any) => {
        if (!item.audit) {
            toast({ title: "Audit requis", description: "Ce matériel n'a pas été certifié par le Labo DKS.", variant: "destructive" });
            return;
        }
        toast({ title: "Requête Séquestre", description: `Vos ${item.price} DKST sont bloqués en séquestre jusqu'à livraison.` });
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard"><Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 p-0 hover:bg-accent/10 hover:text-accent"><ArrowLeft size={24} /></Button></Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Marketplace <span className="text-primary">P2P</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Échange sécurisé de matériel entre membres Élite</p>
                        </div>
                    </div>
                    <Button className="bg-primary text-white h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-primary/20">
                        <Plus size={20} /> Vendre un article
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                            <Input 
                                placeholder="Chercher un article d'occasion..." 
                                className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl focus:border-primary"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {MOCK_P2P_ITEMS.map((item) => (
                                <Card key={item.id} className="glossy-card border-none rounded-[3rem] overflow-hidden group">
                                    <div className="aspect-video bg-black/40 flex items-center justify-center relative">
                                        <Monitor size={48} className="text-white/10" />
                                        {item.audit && (
                                            <Badge className="absolute top-4 left-4 bg-green-500 text-black font-black uppercase text-[8px] italic tracking-widest gap-1">
                                                <ShieldCheck size={10}/> Certifié Labo
                                            </Badge>
                                        )}
                                    </div>
                                    <CardContent className="p-8 space-y-6">
                                        <div className="space-y-1">
                                            <Badge variant="outline" className="border-white/10 text-white/40 text-[8px] font-black uppercase">{item.category}</Badge>
                                            <h3 className="text-xl font-black uppercase italic">{item.name}</h3>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2"><User size={10} className="text-primary"/> Vendeur: {item.seller}</p>
                                        </div>
                                        <div className="flex justify-between items-end border-t border-white/5 pt-6">
                                            <div>
                                                <p className="text-[10px] font-black uppercase opacity-40 mb-1">Prix P2P</p>
                                                <p className="text-2xl font-black text-white italic">{item.price} <span className="text-xs opacity-40 not-italic">DKST</span></p>
                                            </div>
                                            <Button onClick={() => handleBuy(item)} className="bg-white text-black font-black uppercase italic h-12 rounded-xl text-[10px]">Acheter via Escrow</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-primary/10 border-primary/20 rounded-[3rem] p-10 space-y-8">
                             <div className="flex items-center gap-4 text-primary"><Lock size={32}/><h3 className="text-xl font-black uppercase italic tracking-tight">Système Séquestre</h3></div>
                             <p className="text-xs text-white/60 leading-relaxed italic">
                                "La marketplace DKS utilise un système de 'smart-séquestre'. Vos fonds ne sont libérés au vendeur qu'après confirmation technique de la bonne réception du matériel par notre équipe."
                             </p>
                             <div className="space-y-4 pt-4">
                                 <div className="flex items-center gap-4 text-[10px] font-black uppercase text-white/60"><CheckCircle2 size={16} className="text-primary"/> Zéro Frais en DKST</div>
                                 <div className="flex items-center gap-4 text-[10px] font-black uppercase text-white/60"><CheckCircle2 size={16} className="text-primary"/> Audit technique possible</div>
                                 <div className="flex items-center gap-4 text-[10px] font-black uppercase text-white/60"><CheckCircle2 size={16} className="text-primary"/> Protection acheteur 24h</div>
                             </div>
                        </Card>

                        <div className="p-8 bg-accent/5 rounded-[2.5rem] border border-accent/20 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2"><Hammer size={12} /> Service de Labo</h4>
                            <p className="text-[9px] leading-relaxed text-white/40 italic">
                                "Pour 10 DKST, faites certifier votre vente par nos techniciens au Hub. Un badge 'Certifié Labo' sera ajouté à votre annonce, augmentant vos chances de vente de 80%."
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default withAuth(DKSP2PPage);
