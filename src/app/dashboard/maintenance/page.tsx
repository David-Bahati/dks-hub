
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
    Maximize,
    ArrowUpCircle,
    ArrowDownCircle,
    Box,
    Barcode,
    Printer,
    Download,
    QrCode,
    ShoppingCart
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
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';

function MaintenanceInventoryPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false);
    const [scannerMode, setScannerMode] = useState<'usage' | 'restock'>('usage');
    const [editingItem, setEditingItem] = useState<any>(null);
    const [selectedItemForLabel, setSelectedItemForLabel] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingLabel, setIsGeneratingLabel] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const labelRef = useRef<HTMLDivElement>(null);

    const inventoryQuery = useMemoFirebase(() => {
        return query(collection(db, "consumables"), orderBy("name", "asc"));
    }, []);

    const { data: items, isLoading } = useCollection(inventoryQuery);

    const alertCount = items?.filter(i => i.quantity <= i.minThreshold).length || 0;

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
                toast({ title: "Sortie de stock", description: `-1 ${item.unit} de ${item.name}` });
            } else {
                toast({ title: "Arrivage enregistré", description: `+1 ${item.unit} de ${item.name}`, variant: "default" });
            }
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        }
    };

    const handleDownloadLabel = async () => {
        if (!labelRef.current || !selectedItemForLabel) return;
        setIsGeneratingLabel(true);
        try {
            const canvas = await html2canvas(labelRef.current, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [100, 60] });
            pdf.addImage(imgData, 'PNG', 0, 0, 100, 60);
            pdf.save(`LABEL_DKS_${selectedItemForLabel.name.replace(/\s+/g, '_')}.pdf`);
            toast({ title: "Étiquette générée", description: "Le PDF est prêt pour l'impression thermique." });
        } catch (error) {
            toast({ title: "Erreur PDF", variant: "destructive" });
        } finally {
            setIsGeneratingLabel(false);
        }
    };

    const handleMockScan = (item: any) => {
        const delta = scannerMode === 'usage' ? -1 : 1;
        updateQuantity(item, delta);
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
                        <Link href="/dashboard/maintenance/procurement">
                            <Button 
                                variant="outline"
                                className="h-14 px-6 rounded-2xl border-red-500/20 text-red-400 bg-red-500/5 font-black uppercase italic gap-3 hover:bg-red-500/10 transition-all relative"
                            >
                                <ShoppingCart size={20} /> Besoins Réappro
                                {alertCount > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black h-6 min-w-[24px] flex items-center justify-center p-1 rounded-full border-2 border-background animate-bounce">{alertCount}</span>
                                )}
                            </Button>
                        </Link>
                        <Button 
                            onClick={() => { setScannerMode('usage'); setIsScannerOpen(true); }} 
                            className="bg-accent text-black hover:bg-accent/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-accent/20"
                        >
                            <Scan size={20} /> Scanner Ressource
                        </Button>
                        <Button 
                            onClick={() => { setScannerMode('restock'); setIsScannerOpen(true); }} 
                            className="bg-primary text-white hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-primary/20"
                        >
                            <Box size={20} /> Réception Livraison
                        </Button>
                        <Button 
                            onClick={() => { setEditingItem(null); setIsSheetOpen(true); }}
                            variant="outline"
                            className="h-14 px-6 rounded-2xl border-white/10 font-black uppercase italic gap-3 hover:bg-white/5 transition-all"
                        >
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
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-accent">
                                                <FlaskConical size={24} />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-black uppercase italic truncate max-w-[150px]">{item.name}</CardTitle>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{item.category}</p>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-10 w-10 rounded-xl hover:bg-accent/10 hover:text-accent opacity-0 group-hover:opacity-100 transition-all"
                                            onClick={() => { setSelectedItemForLabel(item); setIsLabelDialogOpen(true); }}
                                        >
                                            <Barcode size={20} />
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-8 space-y-6">
                                    <div className="flex justify-between items-end bg-black/20 p-6 rounded-[2rem] border border-white/5">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase opacity-40">Réserve Labo</p>
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

                    <div className="w-full max-w-4xl space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="text-center md:text-left space-y-2">
                                <div className="flex items-center gap-4 justify-center md:justify-start">
                                    <Badge className={cn(
                                        "font-black uppercase italic px-4 py-1",
                                        scannerMode === 'usage' ? "bg-orange-500 text-white" : "bg-green-500 text-white"
                                    )}>
                                        {scannerMode === 'usage' ? "MODE CONSOMMATION" : "MODE RÉCEPTION LIVRAISON"}
                                    </Badge>
                                    <Badge variant="outline" className="border-white/20 text-white/40 uppercase font-black text-[9px] tracking-widest">Multi-Scan Actif</Badge>
                                </div>
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                                    Lecteur <span className="text-accent">Optique Hub</span>
                                </h2>
                            </div>

                            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                                <button 
                                    onClick={() => setScannerMode('usage')}
                                    className={cn(
                                        "px-6 h-12 rounded-xl font-black uppercase italic text-[10px] flex items-center gap-2 transition-all",
                                        scannerMode === 'usage' ? "bg-orange-500 text-white shadow-lg" : "text-white/40 hover:text-white"
                                    )}
                                >
                                    <ArrowDownCircle size={14} /> Sortie Stock
                                </button>
                                <button 
                                    onClick={() => setScannerMode('restock')}
                                    className={cn(
                                        "px-6 h-12 rounded-xl font-black uppercase italic text-[10px] flex items-center gap-2 transition-all",
                                        scannerMode === 'restock' ? "bg-green-500 text-white shadow-lg" : "text-white/40 hover:text-white"
                                    )}
                                >
                                    <ArrowUpCircle size={14} /> Entrée Livraison
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                            <div className="lg:col-span-7 relative aspect-video rounded-[3rem] overflow-hidden border-4 border-white/5 shadow-[0_0_50px_rgba(255,255,255,0.05)]">
                                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className={cn(
                                        "w-64 h-64 border-2 rounded-3xl relative transition-colors duration-500",
                                        scannerMode === 'usage' ? "border-orange-500" : "border-green-500"
                                    )}>
                                        <div className={cn(
                                            "absolute inset-0 animate-pulse",
                                            scannerMode === 'usage' ? "bg-orange-500/5" : "bg-green-500/5"
                                        )} />
                                        <div className={cn(
                                            "absolute top-1/2 left-0 w-full h-0.5 shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-[scan_2s_ease-in-out_infinite]",
                                            scannerMode === 'usage' ? "bg-orange-500" : "bg-green-500"
                                        )} />
                                        
                                        <div className={cn("absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 rounded-tl-xl", scannerMode === 'usage' ? "border-orange-500" : "border-green-500")} />
                                        <div className={cn("absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 rounded-tr-xl", scannerMode === 'usage' ? "border-orange-500" : "border-green-500")} />
                                        <div className={cn("absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 rounded-bl-xl", scannerMode === 'usage' ? "border-orange-500" : "border-green-500")} />
                                        <div className={cn("absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 rounded-br-xl", scannerMode === 'usage' ? "border-orange-500" : "border-green-500")} />
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

                            <div className="lg:col-span-5 space-y-6">
                                <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
                                            <Plus size={12} className="text-accent" /> Sélection Directe (Simulée)
                                        </p>
                                        <p className="text-[9px] text-white/30 italic uppercase">Cliquer pour simuler le scan d'une étiquette</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                        {items?.map(item => (
                                            <Button 
                                                key={item.id} 
                                                variant="ghost" 
                                                className={cn(
                                                    "w-full justify-between h-14 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl px-5 border border-white/5 transition-all group",
                                                    scannerMode === 'usage' ? "hover:border-orange-500/30" : "hover:border-green-500/30"
                                                )}
                                                onClick={() => handleMockScan(item)}
                                            >
                                                <div className="text-left">
                                                    <p className="text-[10px] font-black uppercase italic group-hover:text-white transition-colors">{item.name}</p>
                                                    <p className="text-[8px] font-mono opacity-40 uppercase">Stock: {item.quantity} {item.unit}</p>
                                                </div>
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                                    scannerMode === 'usage' ? "bg-orange-500/10 text-orange-500" : "bg-green-500/10 text-green-500"
                                                )}>
                                                    {scannerMode === 'usage' ? <Minus size={14}/> : <Plus size={14}/>}
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LABEL PRINT DIALOG */}
            <Dialog open={isLabelDialogOpen} onOpenChange={setIsLabelDialogOpen}>
                <DialogContent className="bg-card border-white/10 text-foreground rounded-[2.5rem] sm:max-w-xl overflow-hidden p-0">
                    <DialogHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Générateur d'Étiquette</DialogTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Format Thermique Standard (100x60mm)</p>
                    </DialogHeader>
                    
                    <div className="p-10 flex flex-col items-center justify-center space-y-10 bg-black/20">
                        <div ref={labelRef} className="w-[400px] h-[240px] bg-white text-black p-8 rounded-lg shadow-2xl relative overflow-hidden flex flex-col justify-between font-sans">
                            <div className="flex justify-between items-start">
                                <div className="space-y-4">
                                    <div className="bg-black text-white px-4 py-1.5 inline-block font-black text-xl italic tracking-tighter rounded-md">DKS SOLUTIONS</div>
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Ressource Labo</p>
                                        <h3 className="text-2xl font-black uppercase italic leading-none mt-1">{selectedItemForLabel?.name}</h3>
                                    </div>
                                </div>
                                <Logo size="sm" />
                            </div>

                            <div className="flex justify-between items-end border-t border-gray-100 pt-6">
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-gray-400">Famille</p>
                                        <p className="text-xs font-bold uppercase">{selectedItemForLabel?.category}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black uppercase text-gray-400">Conditionnement</p>
                                        <p className="text-xs font-bold uppercase">1 {selectedItemForLabel?.unit}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="p-2 border-2 border-black rounded-lg bg-gray-50">
                                        <QrCode size={60} />
                                    </div>
                                    <p className="text-[7px] font-black text-gray-300 uppercase tracking-tighter">ID: {selectedItemForLabel?.id.substring(0, 10).toUpperCase()}</p>
                                </div>
                            </div>
                            
                            <div className="absolute top-0 right-0 w-16 h-16 bg-gray-50 rounded-bl-full -z-10" />
                        </div>

                        <div className="w-full flex gap-4">
                            <Button 
                                onClick={handleDownloadLabel} 
                                disabled={isGeneratingLabel}
                                className="flex-1 h-14 bg-accent text-black font-black uppercase italic rounded-2xl gap-3 shadow-xl shadow-accent/10"
                            >
                                {isGeneratingLabel ? <Loader2 className="animate-spin" /> : <><Download size={18} /> Télécharger PDF</>}
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => window.print()}
                                className="flex-1 h-14 border-white/10 rounded-2xl font-black uppercase italic gap-3 text-xs"
                            >
                                <Printer size={18} /> Imprimer Directement
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">
                            {editingItem ? 'Modifier Ressource' : 'Nouveau Consommable'}
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
