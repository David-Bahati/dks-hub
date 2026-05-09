
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Building2, 
    ArrowLeft, 
    Loader2, 
    Search,
    ShieldCheck,
    XCircle,
    Eye,
    CheckCircle2,
    Clock,
    FileText,
    ExternalLink,
    X,
    MapPin,
    Briefcase
} from "lucide-center";
import { db } from '@/lib/firebase';
import { collection, query, where, updateDoc, doc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function KybManagementPage() {
    const { user: admin } = useAuth();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [selectedKyb, setSelectedKyb] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const pendingKybQuery = useMemoFirebase(() => {
        return query(
            collection(db, "users"), 
            where("kybStatus", "==", "pending"),
            orderBy("kybSubmittedAt", "asc")
        );
    }, []);

    const { data: pendings, isLoading } = useCollection(pendingKybQuery);

    const handleAction = async (userId: string, action: 'verify' | 'reject') => {
        setIsProcessing(true);
        try {
            const status = action === 'verify' ? 'verified' : 'rejected';
            await updateDoc(doc(db, "users", userId), {
                kybStatus: status,
                kybVerifiedAt: serverTimestamp(),
                kybRejectionReason: action === 'reject' ? rejectionReason : null,
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, "notifications"), {
                userId: userId,
                title: action === 'verify' ? "Certification Business Accordée !" : "Certification KYB Refusée",
                message: action === 'verify' 
                    ? `Félicitations, votre entreprise est désormais un Partenaire Officiel DKS Hub.` 
                    : `Votre dossier KYB a été rejeté. Motif : ${rejectionReason}`,
                type: action === 'verify' ? 'success' : 'error',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/kyb'
            });

            toast({ title: action === 'verify' ? "Entreprise Certifiée" : "Dossier Rejeté" });
            setSelectedKyb(null);
            setRejectionReason("");
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    if (admin?.role?.toLowerCase() !== 'admin') {
        return <div className="p-20 text-center uppercase font-black italic opacity-20">Accès réservé au service conformité business.</div>;
    }

    const filteredPendings = pendings?.filter(p => 
        p.businessName?.toLowerCase().includes(search.toLowerCase()) || 
        p.businessRegistrationNumber?.toLowerCase().includes(search.toLowerCase())
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
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Validateur <span className="text-primary">KYB Hub</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Audit des dossiers légaux des entreprises</p>
                        </div>
                    </div>
                </div>

                <div className="mb-10 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input 
                        placeholder="Chercher par raison sociale ou RCCM..." 
                        className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl focus:border-primary"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>
                    ) : filteredPendings && filteredPendings.length > 0 ? (
                        filteredPendings.map((pending) => (
                            <Card key={pending.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group">
                                <CardContent className="p-8 flex flex-col lg:flex-row items-center gap-10">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                                        <Briefcase className="text-primary" size={28} />
                                    </div>
                                    
                                    <div className="flex-1 space-y-2 text-center md:text-left">
                                        <h3 className="text-xl font-black uppercase italic tracking-tight">{pending.businessName}</h3>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-black uppercase italic text-muted-foreground/60 tracking-widest">
                                            <span className="flex items-center gap-2"><Badge variant="outline" className="h-4 text-[8px]">{pending.businessType}</Badge></span>
                                            <span>•</span>
                                            <span className="flex items-center gap-2">RCCM: {pending.businessRegistrationNumber}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-2"><MapPin size={12} /> {pending.businessAddress}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 shrink-0">
                                        <Button 
                                            onClick={() => setSelectedKyb(pending)}
                                            className="h-12 px-8 bg-white text-black font-black uppercase italic rounded-xl text-[10px] shadow-lg hover:bg-primary transition-all"
                                        >
                                            <Eye size={16} className="mr-2" /> Auditer Dossier
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                            <Building2 size={80} strokeWidth={1} />
                            <p className="text-xl font-black uppercase italic tracking-tighter">Aucun dossier Business en attente</p>
                        </div>
                    )}
                </div>
            </main>

            {/* KYB REVIEW DIALOG */}
            <Dialog open={!!selectedKyb} onOpenChange={() => setSelectedKyb(null)}>
                <DialogContent className="bg-card border-white/10 text-foreground rounded-[2.5rem] sm:max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar p-0">
                    <DialogHeader className="p-10 bg-primary/10 border-b border-white/5">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xl"><ShieldCheck size={32} /></div>
                                <div>
                                    <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Audit KYB Officiel</DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground opacity-60 mt-1">Entité : {selectedKyb?.businessName}</DialogDescription>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedKyb(null)} className="h-12 w-12 rounded-2xl hover:bg-white/5"><X size={24}/></Button>
                        </div>
                    </DialogHeader>

                    <div className="p-10 space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 block">Preuve d'Enregistrement / Patente</Label>
                                <div className="aspect-[4/3] rounded-3xl bg-black/40 border border-white/10 overflow-hidden shadow-inner group">
                                    <img src={selectedKyb?.businessLicenseImage} className="w-full h-full object-contain transition-transform group-hover:scale-110" />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 block">Détails de l'Entité</Label>
                                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 space-y-4">
                                    <div><p className="text-[8px] font-black uppercase opacity-40">RCCM</p><p className="font-bold text-primary">{selectedKyb?.businessRegistrationNumber}</p></div>
                                    <div><p className="text-[8px] font-black uppercase opacity-40">Numéro Impôt</p><p className="font-bold text-primary">{selectedKyb?.businessTaxId || 'Non fourni'}</p></div>
                                    <div><p className="text-[8px] font-black uppercase opacity-40">Siège Social</p><p className="text-sm font-medium italic">{selectedKyb?.businessAddress}</p></div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Motif de rejet (Si non conforme)</Label>
                            <Input 
                                value={rejectionReason} 
                                onChange={(e) => setRejectionReason(e.target.value)} 
                                placeholder="Indiquez pourquoi la certification est refusée..."
                                className="h-14 bg-background/50 border-white/5 rounded-2xl italic text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Button 
                                onClick={() => handleAction(selectedKyb.id, 'reject')}
                                disabled={isProcessing || !rejectionReason}
                                variant="outline"
                                className="h-16 rounded-2xl font-black uppercase italic text-xs border-red-500/20 text-red-500 hover:bg-red-500/10 gap-3"
                            >
                                <XCircle size={18} /> Refuser Certification
                            </Button>
                            <Button 
                                onClick={() => handleAction(selectedKyb.id, 'verify')}
                                disabled={isProcessing}
                                className="h-16 bg-primary text-white font-black uppercase italic rounded-2xl shadow-xl shadow-primary/20 gap-3 text-xs"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Certifier l'Entreprise</>}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default withAuth(KybManagementPage);

