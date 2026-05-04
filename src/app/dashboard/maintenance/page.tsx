
"use client";

import { useState, useEffect, useRef } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    FlaskConical, 
    Plus, 
    ArrowLeft, 
    Loader2, 
    Search, 
    Trash2, 
    Edit2, 
    AlertTriangle,
    CheckCircle2,
    Minus,
    PackageSearch,
    History,
    BarChart3,
    Scan,
    Camera,
    X,
    Zap,
    Maximize
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy, increment } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle,
    SheetFooter 
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

function MaintenanceInventoryPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const inventoryQuery = useMemoFirebase(() => {
        return query(collection(db, "consumables"), orderBy("name", "asc"));
    }, []);

    const { data: items, isLoading } = useCollection(inventoryQuery);

    // Camera Logic
    useEffect(() => {
        if (isScannerOpen) {
            const getCameraPermission = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                    setHasCameraPermission(true);
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (error) {
                    console.error('Error accessing camera:', error);
                    setHasCameraPermission(false);
                    toast({
                        variant: 'destructive',
                        title: 'Accès Caméra Refusé',
                        description: 'Veuillez autoriser la caméra pour utiliser le scanner.',
                    });
                }
            };
            getCameraPermission();
        } else {
            // Stop stream when closing
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        }
    }, [isScannerOpen, toast]);

    const handleSaveItem = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        
        const itemData = {
            name: formData.get('name'),
            category: formData.get('category'),
            quantity: parseFloat(formData.get('quantity') as string),
            unit: formData.get('unit'),
            minThreshold: parseFloat(formData.get('minThreshold') as string),
            updatedAt: serverTimestamp()
        };

        try {
            if (editingItem) {
                await updateDoc(doc(db, "consumables", editingItem.id), itemData);
                toast({ title: "Article mis à jour", description: `${itemData.name} a été modifié.` });
            } else {
                await addDoc(collection(db, "consumables"), itemData);
                toast({ title: "Article ajouté", description: `${itemData.name} est prêt pour le labo.` });
            }
            setIsSheetOpen(false);
            setEditingItem(null);
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateQuantity = async (item: any, delta: number) => {
        try {
            await updateDoc(doc(db, "consumables", item.id), {
                quantity: increment(delta),
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, "consumptionLogs"), {
                consumableId: item.id,
                consumableName: item.name,
                category: item.category,
                quantity: Math.abs(delta),
                type: delta < 0 ? 'usage' : 'restock',
                userId: user?.uid,
                createdAt: serverTimestamp()
            });

            if (delta < 0) {
                toast({ title: "Consommation enregistrée", description: `-1 ${item.unit} de ${item.name}` });
            }
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        }
    };

    const handleMockScan = (item: any) => {
        updateQuantity(item, -1);
        setIsScannerOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Supprimer cet article du stock interne ?")) return;
        try {
            await deleteDoc(doc(db, "consumables", id));
            toast({ title: "Supprimé" });
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); }
    };

    const filteredItems = items?.filter(i => 
        i.name?.toLowerCase().includes(search.toLowerCase()) || 
        i.category?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard">
                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0 transition-all">
                                <ArrowLeft size={24} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Stocks <span className="text-accent">Internes Labo</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Gestion des consommables & maintenance certifiée</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        <Button 
                            onClick={() => setIsScannerOpen(true)} 
                            className="bg-accent text-black hover:bg-accent/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-accent/20"
                        >
                            <Scan size={20} /> Scanner Ressource
                        </Button>
                        <Link href="/dashboard/maintenance/stats">
                            <Button variant="outline" className="h-14 px-6 rounded-2xl border-white/10 font-black uppercase italic gap-3 hover:bg-white/5 transition-all">
                                <BarChart3 size={20} /> Statistiques
                            </Button>
                        </Link>
                        <Button onClick={() => { setEditingItem(null); setIsSheetOpen(true); }} className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl">
                            <Plus size={20} /> Nouvel Article
                        </Button>
                    </div>
                </div>

                <div className="mb-10 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input 
                        placeholder="Chercher une ressource (ex: Pâte, Étain, Alcool...)" 
                        className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl focus:border-accent"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="py-20 flex justify-center col-span-full"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                    ) : filteredItems && filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                            <Card key={item.id} className={cn(
                                "glossy-card border-none rounded-[2.5rem] overflow-hidden group relative",
                                item.quantity <= item.minThreshold && "border-l-4 border-l-red-500 bg-red-500/[0.03]"
                            )}>
                                {item.quantity <= item.minThreshold && (
                                    <div className="absolute top-4 right-6">
                                        <Badge className="bg-red-500 text-white border-none text-[8px] font-black uppercase px-2 animate-pulse">Stock Critique</Badge>
                                    </div>
                                )}
                                
                                <CardHeader className="p-8 pb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-accent">
                                            <FlaskConical size={24} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black uppercase italic truncate">{item.name}</CardTitle>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.category}</p>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-8 space-y-6">
                                    <div className="flex justify-between items-end bg-black/20 p-6 rounded-[2rem] border border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase opacity-40">Quantité en réserve</p>
                                            <p className={cn("text-4xl font-black italic", item.quantity <= item.minThreshold ? "text-red-500" : "text-accent")}>
                                                {item.quantity} <span className="text-lg font-light opacity-60 not-italic">{item.unit}</span>
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button onClick={() => updateQuantity(item, 1)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-accent hover:text-black flex items-center justify-center transition-all"><Plus size={16}/></button>
                                            <button onClick={() => updateQuantity(item, -1)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center transition-all"><Minus size={16}/></button>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button 
                                            variant="ghost" 
                                            className="flex-1 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase italic gap-2"
                                            onClick={() => { setEditingItem(item); setIsSheetOpen(true); }}
                                        >
                                            <Edit2 size={12} /> Modifier
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            className="w-11 h-11 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-500"
                                            onClick={() => handleDelete(item.id)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6 col-span-full">
                            <FlaskConical size={80} strokeWidth={1} />
                            <p className="text-xl font-black uppercase italic tracking-tighter">Inventaire Labo vide</p>
                        </div>
                    )}
                </div>
            </main>

            {/* SCANNER BARCODE OVERLAY */}
            {isScannerOpen && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="absolute top-6 right-6">
                        <Button variant="ghost" size="icon" onClick={() => setIsScannerOpen(false)} className="h-14 w-14 rounded-full bg-white/5 hover:bg-white/10 text-white">
                            <X size={32} />
                        </Button>
                    </div>

                    <div className="w-full max-w-2xl space-y-8">
                        <div className="text-center space-y-2">
                            <Badge className="bg-accent text-black font-black uppercase italic px-4 py-1">Mode Scan Actif</Badge>
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Lecteur <span className="text-accent">Optique Hub</span></h2>
                        </div>

                        <div className="relative aspect-video rounded-[3rem] overflow-hidden border-4 border-accent/20 shadow-[0_0_50px_rgba(56,189,248,0.1)]">
                            <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                            
                            {/* Scanner Overlays */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-64 h-64 border-2 border-accent rounded-3xl relative">
                                    <div className="absolute inset-0 bg-accent/5 animate-pulse" />
                                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-accent shadow-[0_0_15px_rgba(56,189,248,0.8)] animate-[scan_2s_ease-in-out_infinite]" />
                                    
                                    {/* Corners */}
                                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-accent rounded-tl-xl" />
                                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-accent rounded-tr-xl" />
                                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-accent rounded-bl-xl" />
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-accent rounded-br-xl" />
                                </div>
                            </div>

                            {!hasCameraPermission && (
                                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center p-10 text-center">
                                    <Camera size={48} className="text-muted-foreground mb-4 opacity-20" />
                                    <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-500 max-w-sm rounded-2xl">
                                        <AlertTitle className="font-black uppercase italic text-xs">Accès Caméra Requis</AlertTitle>
                                        <AlertDescription className="text-[10px] font-bold uppercase opacity-80">
                                            Autorisez l'accès à la caméra pour scanner vos ressources de laboratoire.
                                        </AlertDescription>
                                    </Alert>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">Ressources en attente de détection</p>
                                <div className="max-h-[200px] overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                    {items?.slice(0, 4).map(item => (
                                        <Button 
                                            key={item.id} 
                                            variant="ghost" 
                                            className="w-full justify-between h-12 bg-white/[0.02] hover:bg-accent/10 hover:text-accent rounded-xl px-4 border border-white/5"
                                            onClick={() => handleMockScan(item)}
                                        >
                                            <span className="text-[10px] font-black uppercase italic">{item.name}</span>
                                            <span className="text-[9px] font-mono opacity-40">SORTIE DIRECTE</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="p-8 bg-accent/10 rounded-[2.5rem] border border-accent/20 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                                    <Maximize size={32} />
                                </div>
                                <p className="text-xs font-medium text-white/80 leading-relaxed italic">
                                    Placez le code-barres de la ressource dans le cadre pour une identification automatique.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">
                            {editingItem ? 'Modifier Ressource' : 'Nouvel Consommable'}
                        </SheetTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Gestion Labo Interne</p>
                    </SheetHeader>
                    
                    <form onSubmit={handleSaveItem} className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Nom de l'article</Label>
                                <Input name="name" defaultValue={editingItem?.name} required className="h-14 bg-background/50 border-white/5 rounded-2xl font-bold" placeholder="Ex: Pâte Thermique MX-6" />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Famille Labo</Label>
                                <Select name="category" defaultValue={editingItem?.category || "chemical"}>
                                    <SelectTrigger className="h-14 bg-background/50 border-white/5 rounded-2xl text-[10px] font-black uppercase">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-white/10">
                                        <SelectItem value="chemical" className="text-[10px] font-black uppercase">Chimie (Flux, Alcool, Pâte)</SelectItem>
                                        <SelectItem value="metal" className="text-[10px] font-black uppercase">Métaux (Étain, Tresses)</SelectItem>
                                        <SelectItem value="cleaning" className="text-[10px] font-black uppercase">Nettoyage (Cotons, Chiffons)</SelectItem>
                                        <SelectItem value="tools" className="text-[10px] font-black uppercase">Outils Usables (Pointes, Lames)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Quantité Initiale</Label>
                                    <Input name="quantity" type="number" step="0.1" defaultValue={editingItem?.quantity} required className="h-12 bg-background/50 border-white/5 rounded-xl text-accent font-black" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Unité (ml, g, u...)</Label>
                                    <Input name="unit" defaultValue={editingItem?.unit || "ml"} required className="h-12 bg-background/50 border-white/5 rounded-xl uppercase font-black text-center" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Seuil de Réapprovisionnement</Label>
                                <Input name="minThreshold" type="number" step="0.1" defaultValue={editingItem?.minThreshold || 5} required className="h-12 bg-background/50 border-white/5 rounded-xl font-black text-red-400" />
                                <p className="text-[8px] font-bold text-muted-foreground uppercase opacity-40 italic">Une alerte sera générée en dessous de ce niveau.</p>
                            </div>
                        </div>

                        <div className="pt-8">
                            <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/10">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : editingItem ? "Appliquer les Changements" : "Valider l'Entrée en Stock"}
                            </Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default withAuth(MaintenanceInventoryPage);
