
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Laptop, 
    Plus, 
    Smartphone, 
    ShieldCheck, 
    Loader2, 
    ArrowLeft, 
    Search,
    History,
    Wrench,
    AlertTriangle,
    BadgeAlert
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function HardwareParkPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const assetsQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        const role = user.role?.toLowerCase();
        const isStaff = role === 'admin' || role === 'seller' || role === 'cashier';
        
        if (isStaff) {
            return query(collection(db, "hardwareAssets"), orderBy("userId"));
        }
        return query(collection(db, "hardwareAssets"), where("userId", "==", user.uid));
    }, [user?.uid, user?.role]);

    const { data: assets, isLoading } = useCollection(assetsQuery);

    const handleAddAsset = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            await addDoc(collection(db, "hardwareAssets"), {
                userId: user?.uid,
                customerName: user?.name,
                brand: formData.get('brand'),
                model: formData.get('model'),
                serialNumber: formData.get('serialNumber'),
                specs: formData.get('specs'),
                status: 'excellent',
                createdAt: serverTimestamp(),
                lastMaintenance: serverTimestamp()
            });

            toast({ title: "Appareil enregistré", description: "Il fait désormais partie de votre Parc Tech DKS." });
            setIsModalOpen(false);
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard">
                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0">
                                <ArrowLeft size={24} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Mon Parc <span className="text-accent">Hardware</span></h1>
                            <p className="text-muted-foreground font-light mt-1">Suivez la maintenance et la santé de votre matériel technologique.</p>
                        </div>
                    </div>
                    
                    <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl">
                        <Plus size={20} /> Enregistrer un appareil
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                    ) : assets && assets.length > 0 ? (
                        assets.map((asset) => (
                            <Card key={asset.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group">
                                <CardHeader className="p-8 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-accent">
                                            <Laptop size={28} />
                                        </div>
                                        <Badge className={asset.status === 'repair_needed' ? 'bg-destructive/20 text-destructive border-none uppercase text-[8px] font-black' : 'bg-green-500/10 text-green-400 border-none uppercase text-[8px] font-black'}>
                                            {asset.status === 'excellent' ? 'Optimum' : asset.status.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <div className="mt-6">
                                        <h3 className="text-xl font-black uppercase italic">{asset.brand} {asset.model}</h3>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">S/N: {asset.serialNumber || 'NON SPÉCIFIÉ'}</p>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-8 pb-8 space-y-4">
                                    <div className="p-4 bg-black/20 rounded-2xl border border-white/5 space-y-2">
                                        <p className="text-[9px] font-black uppercase text-muted-foreground">Configuration</p>
                                        <p className="text-xs font-medium text-white/80 line-clamp-2">{asset.specs || 'Aucun détail technique fourni.'}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-[9px] font-black uppercase italic text-muted-foreground/40">
                                        <span className="flex items-center gap-1"><History size={10} /> Mis à jour {asset.lastMaintenance?.toDate ? asset.lastMaintenance.toDate().toLocaleDateString() : 'Récemment'}</span>
                                    </div>
                                </CardContent>
                                <div className="p-4 bg-white/5 flex gap-2">
                                    <Button variant="ghost" className="flex-1 rounded-xl h-10 font-black uppercase italic text-[9px] hover:bg-accent hover:text-black" asChild>
                                        <Link href="/dashboard/support">
                                            <Wrench size={12} className="mr-2" /> Réparation
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" className="flex-1 rounded-xl h-10 font-black uppercase italic text-[9px] hover:bg-primary hover:text-white" asChild>
                                        <Link href="/services">
                                            <ShieldCheck size={12} className="mr-2" /> Upgrade
                                        </Link>
                                    </Button>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="col-span-full py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                            <BadgeAlert size={80} strokeWidth={1} />
                            <p className="text-xl font-black uppercase italic tracking-tighter">Votre parc tech est vide</p>
                            <p className="text-sm max-w-sm">Enregistrez vos PC pour recevoir des conseils d'entretien personnalisés.</p>
                        </div>
                    )}
                </div>
            </main>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="glossy-card border-none rounded-[2.5rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Enregistrer un Appareil</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddAsset} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Marque</Label>
                                <Input name="brand" placeholder="Ex: ASUS, MacBook..." required className="h-12 bg-background/50 border-white/10 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Modèle</Label>
                                <Input name="model" placeholder="Ex: ROG Strix, Air M2..." required className="h-12 bg-background/50 border-white/10 rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Numéro de Série</Label>
                            <Input name="serialNumber" placeholder="Optionnel" className="h-12 bg-background/50 border-white/10 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Spécifications (RAM, CPU, SSD...)</Label>
                            <Input name="specs" placeholder="Ex: 16GB RAM, 512GB SSD..." className="h-12 bg-background/50 border-white/10 rounded-xl" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="font-bold uppercase text-[10px]">Annuler</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-accent text-black font-black uppercase italic rounded-xl px-10 h-14 shadow-xl">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Ajouter à mon Hub"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default withAuth(HardwareParkPage);
