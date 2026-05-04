
"use client";

import { useState, useEffect } from 'react';
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
    BadgeAlert,
    Clock,
    Zap,
    ScrollText,
    CheckCircle2,
    Calendar,
    Send
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
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
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle 
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';

function HardwareParkPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);
    const [historyLogs, setHistoryLogs] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLogLoading, setIsLogLoading] = useState(false);

    const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

    const assetsQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        if (isStaff) {
            return query(collection(db, "hardwareAssets"), orderBy("createdAt", "desc"));
        }
        return query(collection(db, "hardwareAssets"), where("userId", "==", user.uid));
    }, [user?.uid, isStaff]);

    const { data: assets, isLoading } = useCollection(assetsQuery);

    // Fetch maintenance logs when history sheet opens
    useEffect(() => {
        if (isHistoryOpen && selectedAsset) {
            setIsLogLoading(true);
            const logsRef = collection(db, "hardwareAssets", selectedAsset.id, "logs");
            const q = query(logsRef, orderBy("createdAt", "desc"));
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setHistoryLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
                setIsLogLoading(false);
            });
            
            return () => unsubscribe();
        }
    }, [isHistoryOpen, selectedAsset]);

    const checkMaintenanceStatus = (lastDate: any) => {
        if (!lastDate?.toDate) return { status: 'ok', label: 'Optimum' };
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const date = lastDate.toDate();
        if (date < sixMonthsAgo) return { status: 'warning', label: 'Maintenance Requise' };
        return { status: 'ok', label: 'Santé OK' };
    };

    const handleAddAsset = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            const assetData = {
                userId: user?.uid,
                customerName: user?.name,
                brand: formData.get('brand'),
                model: formData.get('model'),
                serialNumber: formData.get('serialNumber'),
                specs: formData.get('specs'),
                status: 'excellent',
                createdAt: serverTimestamp(),
                lastMaintenance: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, "hardwareAssets"), assetData);

            // Create initial log
            await addDoc(collection(db, "hardwareAssets", docRef.id, "logs"), {
                type: 'checkup',
                description: 'Enregistrement initial de l\'appareil dans le Hub DKS.',
                technicianName: 'Système',
                createdAt: serverTimestamp()
            });

            toast({ title: "Appareil enregistré", description: "Il fait désormais partie de votre Parc Tech DKS." });
            setIsModalOpen(false);
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddLog = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedAsset) return;
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        try {
            const logData = {
                type: formData.get('type'),
                description: formData.get('description'),
                technicianName: user?.name || 'Expert DKS',
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "hardwareAssets", selectedAsset.id, "logs"), logData);
            await updateDoc(doc(db, "hardwareAssets", selectedAsset.id), {
                lastMaintenance: serverTimestamp(),
                status: 'good'
            });

            toast({ title: "Note ajoutée", description: "L'historique de l'appareil a été mis à jour." });
            (e.target as HTMLFormElement).reset();
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
                            <p className="text-muted-foreground font-light mt-1">Suivez la santé et prévoyez la maintenance de votre matériel.</p>
                        </div>
                    </div>
                    
                    <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl">
                        <Plus size={20} /> Enregistrer un appareil
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {isLoading ? (
                        <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                    ) : assets && assets.length > 0 ? (
                        assets.map((asset) => {
                            const health = checkMaintenanceStatus(asset.lastMaintenance);
                            return (
                                <Card key={asset.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group relative">
                                    <div className={cn(
                                        "absolute top-0 left-0 w-full h-1",
                                        health.status === 'warning' ? "bg-orange-500" : "bg-accent/20"
                                    )} />
                                    
                                    <CardHeader className="p-8 pb-4">
                                        <div className="flex justify-between items-start">
                                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-accent">
                                                <Laptop size={28} />
                                            </div>
                                            <div className="text-right">
                                                <Badge className={cn(
                                                    "border-none uppercase text-[8px] font-black px-3",
                                                    health.status === 'warning' ? 'bg-orange-500/10 text-orange-400 animate-pulse' : 'bg-green-500/10 text-green-400'
                                                )}>
                                                    {health.label}
                                                </Badge>
                                                <p className="text-[7px] font-bold uppercase text-muted-foreground mt-1">Status: {asset.status}</p>
                                            </div>
                                        </div>
                                        <div className="mt-6">
                                            <h3 className="text-xl font-black uppercase italic">{asset.brand} {asset.model}</h3>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">S/N: {asset.serialNumber || 'NON SPÉCIFIÉ'}</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-8 pb-8 space-y-6">
                                        <div className="p-4 bg-black/20 rounded-2xl border border-white/5 space-y-2">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-2">
                                                <Zap size={10} className="text-accent" /> Configuration Expert
                                            </p>
                                            <p className="text-xs font-medium text-white/80 line-clamp-2">{asset.specs || 'Détails non fournis.'}</p>
                                        </div>
                                        
                                        {health.status === 'warning' && (
                                            <div className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl flex items-center gap-3">
                                                <AlertTriangle size={14} className="text-orange-400" />
                                                <p className="text-[9px] font-bold text-orange-400/80 uppercase">Maintenance recommandée (6 mois+)</p>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 text-[9px] font-black uppercase italic text-muted-foreground/40">
                                            <span className="flex items-center gap-1"><Clock size={10} /> Dernier check: {asset.lastMaintenance?.toDate ? asset.lastMaintenance.toDate().toLocaleDateString() : 'Inconnu'}</span>
                                        </div>
                                    </CardContent>
                                    <div className="p-4 bg-white/5 flex gap-2">
                                        <Button 
                                            variant="ghost" 
                                            className="flex-1 rounded-xl h-10 font-black uppercase italic text-[9px] hover:bg-accent hover:text-black"
                                            onClick={() => {
                                                setSelectedAsset(asset);
                                                setIsHistoryOpen(true);
                                            }}
                                        >
                                            <History size={12} className="mr-2" /> Historique
                                        </Button>
                                        <Button variant="ghost" className="flex-1 rounded-xl h-10 font-black uppercase italic text-[9px] hover:bg-primary hover:text-white" asChild>
                                            <Link href="/dashboard/support">
                                                <Wrench size={12} className="mr-2" /> Réparation
                                            </Link>
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                            <BadgeAlert size={80} strokeWidth={1} />
                            <p className="text-xl font-black uppercase italic tracking-tighter">Votre parc tech est vide</p>
                            <p className="text-sm max-w-sm">Enregistrez vos appareils pour un suivi technique professionnel.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal d'ajout d'appareil */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="glossy-card border-none rounded-[2.5rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Ajouter au Hub Hardware</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddAsset} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Marque</Label>
                                <Input name="brand" placeholder="Ex: ASUS, Razer..." required className="h-12 bg-background/50 border-white/10 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Modèle</Label>
                                <Input name="model" placeholder="Ex: Zephyrus G14" required className="h-12 bg-background/50 border-white/10 rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Numéro de Série</Label>
                            <Input name="serialNumber" placeholder="Indispensable pour la garantie" className="h-12 bg-background/50 border-white/10 rounded-xl font-mono" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Spécifications (RAM, GPU, CPU...)</Label>
                            <Input name="specs" placeholder="Ex: 32GB RAM, RTX 3080..." className="h-12 bg-background/50 border-white/10 rounded-xl" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="font-bold uppercase text-[10px]">Annuler</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-accent text-black font-black uppercase italic rounded-xl px-10 h-14 shadow-xl">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Enregistrer dans mon Hub"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Carnet de Santé / Historique Log */}
            <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-xl flex flex-col p-0 overflow-hidden">
                    <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                                <ScrollText size={32} />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">Carnet de Santé</SheetTitle>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    {selectedAsset?.brand} {selectedAsset?.model} • S/N: {selectedAsset?.serialNumber}
                                </p>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-black/20">
                        {isStaff && (
                            <Card className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
                                <h4 className="text-[10px] font-black uppercase text-accent tracking-widest mb-2 flex items-center gap-2">
                                    <Plus size={12} /> Ajouter une note technique
                                </h4>
                                <form onSubmit={handleAddLog} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Select name="type" defaultValue="checkup">
                                            <SelectTrigger className="h-10 bg-background/50 border-white/5 rounded-xl text-[10px] font-bold uppercase">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-white/10">
                                                <SelectItem value="repair">Réparation</SelectItem>
                                                <SelectItem value="upgrade">Upgrade</SelectItem>
                                                <SelectItem value="checkup">Check-up</SelectItem>
                                                <SelectItem value="cleaning">Nettoyage</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <div className="flex items-center gap-2 px-3 text-[10px] text-muted-foreground uppercase font-bold italic">
                                            <Zap size={10} className="text-accent" /> Expert: {user?.name}
                                        </div>
                                    </div>
                                    <Textarea name="description" placeholder="Action effectuée, pièces changées..." required className="min-h-[80px] bg-background/50 border-white/5 rounded-xl text-xs" />
                                    <Button type="submit" disabled={isSubmitting} className="w-full h-11 bg-accent text-black font-black uppercase italic rounded-xl gap-2 shadow-lg">
                                        {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Send size={14} />} Enregistrer Log
                                    </Button>
                                </form>
                            </Card>
                        )}

                        <div className="relative space-y-8 pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
                            {isLogLoading ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-accent" /></div>
                            ) : historyLogs.length > 0 ? historyLogs.map((log) => (
                                <div key={log.id} className="relative">
                                    <div className={cn(
                                        "absolute -left-10 top-0 w-6 h-6 rounded-full border-4 border-background flex items-center justify-center",
                                        log.type === 'repair' ? 'bg-red-500' : log.type === 'upgrade' ? 'bg-primary' : 'bg-accent'
                                    )}>
                                        <CheckCircle2 size={10} className="text-white" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-start">
                                            <Badge variant="outline" className="border-white/10 text-[8px] font-black uppercase mb-1">
                                                {log.type?.toUpperCase()}
                                            </Badge>
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                <Calendar size={10} /> {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleDateString() : 'Récemment'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-white/90 font-medium leading-relaxed">{log.description}</p>
                                        <p className="text-[9px] font-black uppercase italic text-accent/60 tracking-tight">Technicien: {log.technicianName}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-20 text-center opacity-20 italic">Aucun historique disponible.</div>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default withAuth(HardwareParkPage);
