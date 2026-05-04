
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Hammer, 
    Plus, 
    ArrowLeft, 
    Loader2, 
    Wrench, 
    AlertTriangle, 
    CheckCircle2, 
    Activity, 
    Clock, 
    ShieldCheck, 
    History,
    RefreshCw,
    PlusCircle,
    Zap,
    Settings2
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, orderBy, increment } from 'firebase/firestore';
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

function ToolMaintenancePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toolsQuery = useMemoFirebase(() => {
        return query(collection(db, "labTools"), orderBy("name", "asc"));
    }, []);

    const { data: tools, isLoading } = useCollection(toolsQuery);

    const handleSaveTool = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        
        const toolData = {
            name: formData.get('name'),
            serialNumber: formData.get('serialNumber'),
            usageThreshold: parseInt(formData.get('usageThreshold') as string),
            usageCount: 0,
            status: 'excellent',
            lastMaintenance: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        try {
            await addDoc(collection(db, "labTools"), toolData);
            toast({ title: "Outil ajouté", description: `${toolData.name} est enregistré dans le parc.` });
            setIsSheetOpen(false);
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const recordUsage = async (tool: any) => {
        try {
            const newCount = tool.usageCount + 1;
            let newStatus = tool.status;
            
            if (newCount >= tool.usageThreshold) {
                newStatus = 'service_needed';
            } else if (newCount >= tool.usageThreshold * 0.8) {
                newStatus = 'warning';
            }

            await updateDoc(doc(db, "labTools", tool.id), {
                usageCount: increment(1),
                status: newStatus,
                updatedAt: serverTimestamp()
            });

            toast({ title: "Utilisation notée", description: `Session enregistrée pour ${tool.name}.` });
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        }
    };

    const performMaintenance = async (tool: any) => {
        try {
            await updateDoc(doc(db, "labTools", tool.id), {
                usageCount: 0,
                status: 'excellent',
                lastMaintenance: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, "maintenanceLogs"), {
                toolId: tool.id,
                toolName: tool.name,
                type: 'checkup',
                description: 'Maintenance préventive complète et remise à zéro des cycles.',
                technicianName: user?.name || 'Expert DKS',
                createdAt: serverTimestamp()
            });

            toast({ title: "Maintenance Validée", description: `${tool.name} repart pour un nouveau cycle.` });
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'excellent': return <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[8px] font-black">État Optimal</Badge>;
            case 'good': return <Badge className="bg-blue-500/10 text-blue-400 border-none uppercase text-[8px] font-black">Bon État</Badge>;
            case 'warning': return <Badge className="bg-orange-500/10 text-orange-400 border-none uppercase text-[8px] font-black animate-pulse">Entretien Proche</Badge>;
            case 'service_needed': return <Badge className="bg-red-500 text-white border-none uppercase text-[8px] font-black animate-bounce">Maintenance Requise</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard/maintenance">
                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0 transition-all">
                                <ArrowLeft size={24} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Santé <span className="text-accent">Outillage</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Maintenance préventive des actifs de précision</p>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={() => setIsSheetOpen(true)}
                        className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-primary/10"
                    >
                        <PlusCircle size={20} /> Nouvel Équipement
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {isLoading ? (
                        <div className="py-20 flex justify-center col-span-full"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                    ) : tools && tools.length > 0 ? (
                        tools.map((tool) => {
                            const wearPercentage = Math.min(100, (tool.usageCount / tool.usageThreshold) * 100);
                            return (
                                <Card key={tool.id} className={cn(
                                    "glossy-card border-none rounded-[2.5rem] overflow-hidden group relative transition-all",
                                    tool.status === 'service_needed' && "border-l-4 border-l-red-500 bg-red-500/[0.02]"
                                )}>
                                    <CardHeader className="p-8 pb-4">
                                        <div className="flex justify-between items-start">
                                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-accent">
                                                <Hammer size={28} />
                                            </div>
                                            <div className="text-right">
                                                {getStatusBadge(tool.status)}
                                                <p className="text-[7px] font-bold uppercase text-muted-foreground mt-2 opacity-40 tracking-widest">S/N: {tool.serialNumber || 'LAB-N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-8">
                                            <h3 className="text-xl font-black uppercase italic truncate">{tool.name}</h3>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Cycles: {tool.usageCount} / {tool.usageThreshold}</p>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="px-8 pb-8 space-y-8">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                                                <span className="text-white/40">Usure Progressive</span>
                                                <span className={cn(wearPercentage > 80 ? "text-red-400" : "text-accent")}>{wearPercentage.toFixed(0)}%</span>
                                            </div>
                                            <Progress value={wearPercentage} className="h-2 bg-white/5" indicatorClassName={cn(
                                                wearPercentage > 90 ? "bg-red-500" : wearPercentage > 75 ? "bg-orange-500" : "bg-accent"
                                            )} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <Button 
                                                variant="outline" 
                                                className="rounded-xl h-11 border-white/10 hover:bg-accent hover:text-black gap-2 font-black uppercase italic text-[9px]"
                                                onClick={() => recordUsage(tool)}
                                            >
                                                <Activity size={14} /> Usage+
                                            </Button>
                                            <Button 
                                                className={cn(
                                                    "rounded-xl h-11 gap-2 font-black uppercase italic text-[9px] shadow-lg",
                                                    tool.status === 'service_needed' ? "bg-red-500 text-white" : "bg-white/5 text-white hover:bg-white/10"
                                                )}
                                                onClick={() => performMaintenance(tool)}
                                            >
                                                <RefreshCw size={14} /> Entretien
                                            </Button>
                                        </div>
                                        
                                        {tool.status === 'service_needed' && (
                                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                                                <AlertTriangle size={14} className="text-red-500 animate-pulse" />
                                                <p className="text-[8px] font-black text-red-500 uppercase leading-tight">Calibration requise pour garantir la précision.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })
                    ) : (
                        <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6 col-span-full">
                            <Settings2 size={80} strokeWidth={1} />
                            <p className="text-xl font-black uppercase italic tracking-tighter">Parc outillage vide</p>
                        </div>
                    )}
                </div>
            </main>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter text-accent">Nouvel Outil Labo</SheetTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Enregistrement Actif Précision</p>
                    </SheetHeader>
                    
                    <form onSubmit={handleSaveTool} className="flex-1 p-8 space-y-8 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Désignation</Label>
                                <Input name="name" placeholder="Ex: Station Soudage JBC CD-2B" required className="h-14 bg-background/50 border-white/5 rounded-2xl font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Numéro de Série</Label>
                                <Input name="serialNumber" placeholder="Ex: DKS-TOOL-001" className="h-14 bg-background/50 border-white/5 rounded-2xl font-mono" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Seuil de Maintenance (Cycles)</Label>
                                <Input name="usageThreshold" type="number" defaultValue={500} required className="h-14 bg-background/50 border-white/5 rounded-2xl font-black text-accent" />
                                <p className="text-[8px] text-muted-foreground italic mt-2">Nombre d'utilisations maximum avant révision.</p>
                            </div>
                        </div>

                        <div className="pt-8">
                            <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Ajouter au Parc Technique"}
                            </Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default withAuth(ToolMaintenancePage);
