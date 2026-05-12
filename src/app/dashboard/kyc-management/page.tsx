
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
    X as CloseIcon,
    RotateCcw,
    MapPin,
    User as UserIcon,
    Calendar as CalendarIcon,
    Briefcase,
    Globe as GlobeIcon,
    Smartphone,
    Scale as ScaleIcon,
    Video as VideoIcon
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
                notifTitle = "KYC Élite Approuvé !";
                notifMsg = "Votre dossier a été validé. Vous bénéficiez désormais des pleins privilèges du Hub.";
                notifType = 'success';
            } else if (newStatus === 'rejected') {
                notifTitle = "KYC Refusé";
                notifMsg = `Audit négatif. Motif : ${rejectionReason || "Pièces non conformes"}`;
                notifType = 'error';
            } else {
                notifTitle = "KYC en réexamen";
                notifMsg = "Votre dossier a été remis en attente pour un audit complémentaire.";
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

            toast({ title: "Audit Scellé", description: `Statut : ${newStatus.toUpperCase()}` });
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
        let filtered = allKyc.filter(p => p.kycStatus === activeTab);
        if (search.trim()) {
            const term = search.toLowerCase();
            filtered = filtered.filter(p => 
                (p.kycLastName || "").toLowerCase().includes(term) || 
                (p.kycFirstName || "").toLowerCase().includes(term) ||
                (p.email || "").toLowerCase().includes(term)
            );
        }
        return [...filtered].sort((a, b) => {
            const dateA = a.kycSubmittedAt?.toDate?.() || 0;
            const dateB = b.kycSubmittedAt?.toDate?.() || 0;
            const timeA = dateA instanceof Date ? dateA.getTime() : 0;
            const timeB = dateB instanceof Date ? dateB.getTime() : 0;
            return timeB - timeA;
        });
    }, [allKyc, search, activeTab]);

    if (admin?.role?.toLowerCase() !== 'admin') {
        return <div className="p-20 text-center uppercase font-black italic opacity-20">Accès réservé au Sceau du Hub.</div>;
    }

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
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Auditeur <span className="text-accent">KYC Élite</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Vérification de conformité v4.0</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <Input placeholder="Chercher par nom ou email..." className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl focus:border-accent" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                            <TabsList className="bg-white/5 border border-white/5 h-16 p-1.5 rounded-[1.5rem] flex w-full md:w-auto">
                                <TabsTrigger value="pending" className="flex-1 px-8 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-orange-500">En attente</TabsTrigger>
                                <TabsTrigger value="verified" className="flex-1 px-8 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-green-600">Vérifiés</TabsTrigger>
                                <TabsTrigger value="rejected" className="flex-1 px-8 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-red-600">Rejetés</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {isLoading ? (
                            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                        ) : filteredAndSortedKyc.length > 0 ? (
                            filteredAndSortedKyc.map((pending) => (
                                <Card key={pending.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group">
                                    <CardContent className="p-8 flex flex-col lg:flex-row items-center gap-10">
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                                            <ShieldCheck className={pending.kycStatus === 'verified' ? "text-green-500" : "text-accent"} size={28} />
                                        </div>
                                        <div className="flex-1 space-y-2 text-center md:text-left">
                                            <h3 className="text-xl font-black uppercase italic tracking-tight">{pending.kycLastName} {pending.kycFirstName}</h3>
                                            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-black uppercase italic text-muted-foreground/60 tracking-widest leading-none">
                                                <span className="flex items-center gap-2"><GlobeIcon size={12} className="text-accent" /> {pending.kycNationality}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-2"><Smartphone size={12} /> {pending.kycDocumentNumber}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-2"><Clock size={12} /> Reçu le {isMounted && pending.kycSubmittedAt?.toDate ? pending.kycSubmittedAt.toDate().toLocaleDateString() : 'Récemment'}</span>
                                            </div>
                                        </div>
                                        <Button onClick={() => setSelectedKyc(pending)} className="h-12 px-8 bg-white text-black font-black uppercase italic rounded-xl text-[10px] shadow-lg hover:bg-accent transition-all">
                                            <Eye size={16} className="mr-2" /> Examiner Dossier
                                        </Button>
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

            <Dialog open={!!selectedKyc} onOpenChange={() => setSelectedKyc(null)}>
                <DialogContent className="bg-card border-white/10 text-foreground rounded-[2.5rem] sm:max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar p-0">
                    <DialogHeader className="p-10 bg-accent/10 border-b border-white/5">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-accent text-black flex items-center justify-center shadow-xl"><UserCheck size={32} /></div>
                                <div>
                                    <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Audit de Conformité Élite</DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground opacity-60 mt-1">Dossier : {selectedKyc?.kycLastName} {selectedKyc?.kycFirstName}</DialogDescription>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedKyc(null)} className="h-12 w-12 rounded-2xl hover:bg-white/5"><CloseIcon size={24}/></Button>
                        </div>
                    </DialogHeader>

                    <div className="p-10 space-y-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <h4 className="text-xs font-black uppercase text-accent tracking-[0.4em] flex items-center gap-2"><UserIcon size={16}/> État Civil & Identité</h4>
                                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <p className="text-[8px] font-black uppercase opacity-40 mb-1">Nom complet</p>
                                        <p className="text-sm font-bold uppercase">{selectedKyc?.kycLastName} {selectedKyc?.kycFirstName}</p>
                                    </div>
                                    <div><p className="text-[8px] font-black uppercase opacity-40 mb-1">Sexe</p><p className="text-sm font-bold uppercase">{selectedKyc?.kycGender === 'M' ? 'Masculin' : 'Féminin'}</p></div>
                                    <div><p className="text-[8px] font-black uppercase opacity-40 mb-1">Date de Naissance</p><p className="text-sm font-bold">{selectedKyc?.kycBirthDate}</p></div>
                                    <div className="col-span-2"><p className="text-[8px] font-black uppercase opacity-40 mb-1">Nationalité</p><p className="text-sm font-bold uppercase">{selectedKyc?.kycNationality}</p></div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-xs font-black uppercase text-accent tracking-[0.4em] flex items-center gap-2"><ScaleIcon size={16}/> Conformité AML/PEP</h4>
                                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-6">
                                    <div><p className="text-[8px] font-black uppercase opacity-40 mb-1">Origine des Fonds</p><Badge className="bg-primary/20 text-primary border-none uppercase font-black text-[9px]">{selectedKyc?.kycSourceOfFunds}</Badge></div>
                                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                        <p className="text-[10px] font-black uppercase">Statut PEP</p>
                                        {selectedKyc?.kycIsPep ? <Badge className="bg-red-500 text-white border-none uppercase text-[8px] font-black">OUI (RISQUE HAUT)</Badge> : <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[8px] font-black">NON</Badge>}
                                    </div>
                                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                        <p className="text-[10px] font-black uppercase">Test de Vivacité</p>
                                        <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[8px] font-black flex items-center gap-2"><VideoIcon size={10}/> VALIDE</Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-xs font-black uppercase text-accent tracking-[0.4em] flex items-center gap-2"><FileText size={16}/> Pièces Justificatives</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-[8px] font-black uppercase opacity-40 block text-center">ID Recto</Label>
                                    <div className="aspect-video rounded-3xl bg-black/40 border border-white/10 overflow-hidden group cursor-zoom-in">
                                        <img src={selectedKyc?.kycDocumentImage} className="w-full h-full object-contain" alt="ID Front" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[8px] font-black uppercase opacity-40 block text-center">ID Verso</Label>
                                    <div className="aspect-video rounded-3xl bg-black/40 border border-white/10 overflow-hidden group cursor-zoom-in">
                                        <img src={selectedKyc?.kycDocumentImageBack} className="w-full h-full object-contain" alt="ID Back" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[8px] font-black uppercase opacity-40 block text-center">Preuve Domicile</Label>
                                    <div className="aspect-video rounded-3xl bg-black/40 border border-white/10 overflow-hidden group cursor-zoom-in">
                                        <img src={selectedKyc?.kycAddressProofImage} className="w-full h-full object-contain" alt="Residence" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-10 border-t border-white/5">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Commentaire d'Audit / Motif de Rejet</Label>
                            <Input value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Précisez les raisons du changement de statut..." className="h-16 bg-background/50 border-white/5 rounded-2xl italic text-sm" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Button onClick={() => handleAction(selectedKyc?.id, 'pending')} disabled={isProcessing || selectedKyc?.kycStatus === 'pending'} variant="outline" className="h-16 rounded-2xl font-black uppercase italic text-xs border-white/10 hover:bg-white/5 gap-3"><RotateCcw size={18} /> Réexaminer</Button>
                            <Button onClick={() => handleAction(selectedKyc?.id, 'rejected')} disabled={isProcessing || selectedKyc?.kycStatus === 'rejected'} variant="outline" className="h-16 rounded-2xl font-black uppercase italic text-xs border-red-500/20 text-red-500 hover:bg-red-500/10 gap-3"><XCircle size={18} /> Rejeter Dossier</Button>
                            <Button onClick={() => handleAction(selectedKyc?.id, 'verified')} disabled={isProcessing || selectedKyc?.kycStatus === 'verified'} className="h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20 gap-3 text-xs">{isProcessing ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Certifier l'Identité</>}</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default withAuth(KycManagementPage);
