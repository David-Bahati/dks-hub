
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    ShieldCheck, 
    ArrowLeft, 
    Loader2, 
    Search,
    UserCheck,
    XCircle,
    Eye,
    CheckCircle2,
    Clock,
    FileText,
    X,
    AlertCircle,
    UserX,
    RotateCcw
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

function KycManagementPage() {
    const { user: admin } = useAuth();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [selectedKyc, setSelectedKyc] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState("pending");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Récupération de tous les dossiers KYC (sauf ceux qui n'ont rien soumis)
    const kycQuery = useMemoFirebase(() => {
        return query(
            collection(db, "users"), 
            where("kycStatus", "in", ["pending", "verified", "rejected"])
        );
    }, []);

    const { data: allKyc, isLoading } = useCollection(kycQuery);

    const handleAction = async (userId: string, newStatus: 'pending' | 'verified' | 'rejected') => {
        setIsProcessing(true);
        try {
            await updateDoc(doc(db, "users", userId), {
                kycStatus: newStatus,
                kycVerifiedAt: newStatus === 'verified' ? serverTimestamp() : null,
                kycRejectionReason: newStatus === 'rejected' ? rejectionReason : null,
                updatedAt: serverTimestamp()
            });

            let notifTitle = "";
            let notifMsg = "";
            let notifType: 'success' | 'error' | 'info' = 'info';

            if (newStatus === 'verified') {
                notifTitle = "KYC Approuvé !";
                notifMsg = "Votre identité a été validée avec succès. Vous êtes maintenant un Membre Certifié DKS.";
                notifType = 'success';
            } else if (newStatus === 'rejected') {
                notifTitle = "KYC Refusé / Révoqué";
                notifMsg = `Désolé, votre statut KYC a été invalidé. Motif : ${rejectionReason || "Non spécifié"}`;
                notifType = 'error';
            } else {
                notifTitle = "KYC en cours de révision";
                notifMsg = "Votre dossier a été remis en attente pour un nouvel examen par nos experts.";
                notifType = 'info';
            }

            await addDoc(collection(db, "notifications"), {
                userId: userId,
                title: notifTitle,
                message: notifMsg,
                type: notifType,
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/kyc'
            });

            toast({ title: "Statut mis à jour", description: `Le dossier est maintenant : ${newStatus.toUpperCase()}` });
            setSelectedKyc(null);
            setRejectionReason("");
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredAndSortedKyc = useMemo(() => {
        if (!allKyc) return [];
        
        // Filtre par onglet
        let filtered = allKyc.filter(p => p.kycStatus === activeTab);

        // Filtre par recherche
        if (search.trim()) {
            const term = search.toLowerCase();
            filtered = filtered.filter(p => 
                (p.name || "").toLowerCase().includes(term) || 
                (p.displayName || "").toLowerCase().includes(term) ||
                (p.email || "").toLowerCase().includes(term) ||
                (p.kycDocumentNumber || "").toLowerCase().includes(term)
            );
        }

        // Tri par date
        return [...filtered].sort((a, b) => {
            const dateA = a.kycSubmittedAt?.toDate?.() || new Date(0);
            const dateB = b.kycSubmittedAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });
    }, [allKyc, search, activeTab]);

    if (admin?.role?.toLowerCase() !== 'admin') {
        return <div className="p-20 text-center uppercase font-black italic opacity-20">Accès réservé au service conformité.</div>;
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'verified': return <CheckCircle2 className="text-green-500" size={28} />;
            case 'rejected': return <UserX className="text-red-500" size={28} />;
            default: return <Clock className="text-orange-400 animate-pulse" size={28} />;
        }
    };

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
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Validateur <span className="text-accent">KYC Élite</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Audit et archivage des dossiers d'identité</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <Input 
                                placeholder="Chercher un membre par nom, email ou document..." 
                                className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl focus:border-accent"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                            <TabsList className="bg-white/5 border border-white/5 h-16 p-1.5 rounded-[1.5rem] flex w-full md:w-auto">
                                <TabsTrigger value="pending" className="flex-1 px-8 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                                    En attente
                                </TabsTrigger>
                                <TabsTrigger value="verified" className="flex-1 px-8 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-green-600 data-[state=active]:text-white">
                                    Vérifiés
                                </TabsTrigger>
                                <TabsTrigger value="rejected" className="flex-1 px-8 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-red-600 data-[state=active]:text-white">
                                    Rejetés
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {isLoading ? (
                            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                        ) : filteredAndSortedKyc.length > 0 ? (
                            filteredAndSortedKyc.map((pending) => (
                                <Card key={pending.id} className={cn(
                                    "glossy-card border-none rounded-[2.5rem] overflow-hidden group transition-all",
                                    pending.kycStatus === 'verified' ? "border-l-4 border-l-green-500" : 
                                    pending.kycStatus === 'rejected' ? "border-l-4 border-l-red-500" : ""
                                )}>
                                    <CardContent className="p-8 flex flex-col lg:flex-row items-center gap-10">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                                            {getStatusIcon(pending.kycStatus)}
                                        </div>
                                        
                                        <div className="flex-1 space-y-2 text-center md:text-left">
                                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                                                <h3 className="text-xl font-black uppercase italic tracking-tight">{pending.name || pending.displayName}</h3>
                                                {pending.kycStatus === 'verified' && <Badge className="bg-green-500 text-black border-none text-[8px] font-black uppercase px-2">Vérifié</Badge>}
                                                {pending.kycStatus === 'rejected' && <Badge className="bg-red-500 text-white border-none text-[8px] font-black uppercase px-2">Rejeté</Badge>}
                                            </div>
                                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-black uppercase italic text-muted-foreground/60 tracking-widest leading-none">
                                                <span className="flex items-center gap-2"><FileText size={12} className="text-accent" /> {pending.kycDocumentType?.replace('_', ' ').toUpperCase()}</span>
                                                <span className="opacity-20">•</span>
                                                <span className="flex items-center gap-2">S/N: {pending.kycDocumentNumber}</span>
                                                <span className="opacity-20">•</span>
                                                <span className="flex items-center gap-2"><Clock size={12} /> Reçu le {isMounted && pending.kycSubmittedAt?.toDate ? pending.kycSubmittedAt.toDate().toLocaleDateString() : 'Récemment'}</span>
                                            </div>
                                            {pending.kycStatus === 'rejected' && pending.kycRejectionReason && (
                                                <p className="text-[10px] text-red-400 font-bold bg-red-500/10 px-3 py-1 rounded-lg w-fit mt-3">
                                                    Motif : {pending.kycRejectionReason}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-3 shrink-0">
                                            <Button 
                                                onClick={() => setSelectedKyc(pending)}
                                                className="h-12 px-8 bg-white text-black font-black uppercase italic rounded-xl text-[10px] shadow-lg hover:bg-accent hover:text-black transition-all"
                                            >
                                                <Eye size={16} className="mr-2" /> 
                                                {pending.kycStatus === 'pending' ? 'Examiner Dossier' : 'Modifier Statut'}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                                <ShieldCheck size={80} strokeWidth={1} />
                                <p className="text-xl font-black uppercase italic tracking-tighter">Aucun dossier dans cette catégorie</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* KYC REVIEW DIALOG */}
            <Dialog open={!!selectedKyc} onOpenChange={() => setSelectedKyc(null)}>
                <DialogContent className="bg-card border-white/10 text-foreground rounded-[2.5rem] sm:max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar p-0">
                    <DialogHeader className="p-10 bg-accent/10 border-b border-white/5">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-accent text-black flex items-center justify-center shadow-xl"><UserCheck size={32} /></div>
                                <div>
                                    <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Gestion du Statut KYC</DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground opacity-60 mt-1">Membre : {selectedKyc?.name || selectedKyc?.displayName}</DialogDescription>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedKyc(null)} className="h-12 w-12 rounded-2xl hover:bg-white/5"><X size={24}/></Button>
                        </div>
                    </DialogHeader>

                    <div className="p-10 space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 block text-center">Pièce d'Identité (Recto)</Label>
                                <div className="aspect-video rounded-3xl bg-black/40 border border-white/10 overflow-hidden shadow-inner group cursor-zoom-in">
                                    <img src={selectedKyc?.kycDocumentImage} className="w-full h-full object-contain transition-transform group-hover:scale-110" alt="ID Document" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 block text-center">Selfie de Validation</Label>
                                <div className="aspect-video rounded-3xl bg-black/40 border border-white/10 overflow-hidden shadow-inner group cursor-zoom-in">
                                    <img src={selectedKyc?.kycSelfieImage} className="w-full h-full object-contain transition-transform group-hover:scale-110" alt="Selfie" />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 space-y-6">
                            <div className="flex items-center gap-4 text-accent"><CheckCircle2 size={24}/><h4 className="text-sm font-black uppercase italic tracking-widest">Résumé du Profil</h4></div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div><p className="text-[8px] font-black uppercase opacity-40 mb-1">Email</p><p className="text-xs font-bold truncate">{selectedKyc?.email}</p></div>
                                <div><p className="text-[8px] font-black uppercase opacity-40 mb-1">Numéro Document</p><p className="text-xs font-bold font-mono">{selectedKyc?.kycDocumentNumber}</p></div>
                                <div><p className="text-[8px] font-black uppercase opacity-40 mb-1">Status Actuel</p><Badge className="uppercase text-[8px] font-black">{selectedKyc?.kycStatus?.toUpperCase()}</Badge></div>
                            </div>
                        </div>

                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Motif de changement / rejet (Si applicable)</Label>
                                <Input 
                                    value={rejectionReason} 
                                    onChange={(e) => setRejectionReason(e.target.value)} 
                                    placeholder="Ex: Image floue, audit complémentaire nécessaire..."
                                    className="h-14 bg-background/50 border-white/5 rounded-2xl italic text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                                <Button 
                                    onClick={() => handleAction(selectedKyc?.id, 'pending')}
                                    disabled={isProcessing || selectedKyc?.kycStatus === 'pending'}
                                    variant="outline"
                                    className="h-16 rounded-2xl font-black uppercase italic text-xs border-white/10 hover:bg-white/5 gap-3"
                                >
                                    <RotateCcw size={18} /> Remettre en Attente
                                </Button>
                                <Button 
                                    onClick={() => handleAction(selectedKyc?.id, 'rejected')}
                                    disabled={isProcessing || selectedKyc?.kycStatus === 'rejected'}
                                    variant="outline"
                                    className="h-16 rounded-2xl font-black uppercase italic text-xs border-red-500/20 text-red-500 hover:bg-red-500/10 gap-3"
                                >
                                    <XCircle size={18} /> Rejeter / Révoquer
                                </Button>
                                <Button 
                                    onClick={() => handleAction(selectedKyc?.id, 'verified')}
                                    disabled={isProcessing || selectedKyc?.kycStatus === 'verified'}
                                    className="h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20 gap-3 text-xs"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Approuver l'Identité</>}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default withAuth(KycManagementPage);
