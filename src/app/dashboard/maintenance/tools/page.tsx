
"use client";

import { useState, useRef } from 'react';
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
    Settings2,
    FileBadge,
    Download,
    QrCode,
    Printer,
    Lock
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
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';

function ToolMaintenancePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedTool, setSelectedTool] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Certificate States
    const [selectedToolForCert, setSelectedToolForCert] = useState<any | null>(null);
    const [isGeneratingCert, setIsGeneratingCert] = useState(false);
    const certRef = useRef<HTMLDivElement>(null);

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

    const handleDownloadCertificate = async (tool: any) => {
        setSelectedToolForCert(tool);
        setTimeout(async () => {
            if (!certRef.current) return;
            setIsGeneratingCert(true);
            try {
                const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
                pdf.save(`CERTIF_CALIBRATION_DKS_${tool.name.replace(/\s+/g, '_')}.pdf`);
                toast({ title: "Certificat généré", description: "Le document de conformité est prêt." });
            } catch (error) {
                toast({ title: "Erreur PDF", variant: "destructive" });
            } finally {
                setIsGeneratingCert(false);
                setSelectedToolForCert(null);
            }
        }, 500);
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
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {isLoading ? (
                        <div className="py-20 flex justify-center col-span-full"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                    ) : tools && tools.length > 0 ? (
                        tools.map((tool) => (
                            <Card key={tool.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group">
                                <CardHeader className="p-8 pb-4">
                                    <h3 className="text-xl font-black uppercase italic truncate">{tool.name}</h3>
                                </CardHeader>
                                <CardContent className="px-8 pb-8 space-y-6">
                                    <Button 
                                        variant="ghost"
                                        className="w-full rounded-xl h-10 bg-white/5 hover:bg-accent hover:text-black gap-2 font-black uppercase italic text-[8px]"
                                        onClick={() => handleDownloadCertificate(tool)}
                                        disabled={isGeneratingCert}
                                    >
                                        {isGeneratingCert ? <Loader2 className="animate-spin h-3 w-3" /> : <FileBadge size={14} />} Certificat Calibration
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    ) : null}
                </div>
            </main>

            {/* CALIBRATION CERTIFICATE TEMPLATE (HIDDEN) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {selectedToolForCert && (
                    <div ref={certRef} className="bg-white text-black p-0 w-[1123px] h-[794px] font-serif relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 border-[40px] border-double border-[#1e293b]" />
                        <div className="absolute inset-10 border-4 border-blue-900/10" />
                        
                        <div className="relative z-10 text-center w-full px-40 space-y-12">
                            <div className="flex flex-col items-center gap-6">
                                <Logo size="lg" />
                                <div className="space-y-1">
                                    <h2 className="text-sm font-bold tracking-[0.4em] uppercase text-blue-900">DKS SOLUTIONS LAB</h2>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h1 className="text-6xl font-black uppercase italic tracking-tighter text-[#1e293b]">CERTIFICAT DE CALIBRATION</h1>
                            </div>

                            <div className="space-y-10 py-10 bg-gray-50/50 rounded-[3rem] border border-gray-100">
                                <p className="text-lg font-medium text-gray-400">Désignation de l'actif</p>
                                <p className="text-3xl font-black uppercase italic text-blue-900">{selectedToolForCert.name}</p>
                            </div>

                            <div className="grid grid-cols-3 items-end pt-12">
                                <div className="text-center">
                                    <p className="text-sm font-bold uppercase">{selectedToolForCert.usageThreshold} Cycles</p>
                                </div>
                                <div className="flex flex-col items-center gap-4">
                                    <QrCode size={60} className="opacity-100 text-black" />
                                </div>
                                <div className="text-center space-y-4 relative">
                                    <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 flex flex-col items-center">
                                        {/* CACHET SÉCURITÉ MIDNIGHT BLUE */}
                                        <div className="w-28 h-28 rounded-full border-[3px] border-double border-blue-900 flex flex-col items-center justify-center p-1 rotate-[10deg] opacity-95 relative">
                                            <div className="absolute inset-0 border border-blue-900/20 rounded-full scale-[0.95]" />
                                            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-30">
                                                <path id="toolCirclePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
                                                <text className="text-[3px] font-black fill-blue-900 uppercase">
                                                    <textPath xlinkHref="#toolCirclePath">
                                                        CERTIFIED BY DOUBLE KING SHOP • ORIGINAL DOCUMENT • CERTIFIED BY DOUBLE KING SHOP • 
                                                    </textPath>
                                                </text>
                                            </svg>
                                            <p className="text-[5px] font-black text-blue-900 uppercase leading-none">DKS LAB CALIB</p>
                                            <ShieldCheck size={18} className="text-blue-900 my-0.5" />
                                            <p className="text-[4px] font-bold text-blue-900 uppercase">OFFICIAL SEAL</p>
                                            <p className="text-[6px] font-black text-blue-900 uppercase tracking-widest mt-0.5">BUNIA</p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black italic">{user?.name || 'Expert DKS'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default withAuth(ToolMaintenancePage);
