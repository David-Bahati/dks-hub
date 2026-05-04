
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    ShieldCheck, 
    Clock, 
    ArrowLeft, 
    Loader2, 
    Search,
    Building2,
    MapPin,
    Calendar,
    Phone,
    FileText,
    ExternalLink,
    CheckCircle2,
    XCircle,
    UserCheck,
    Zap,
    PlusCircle
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, orderBy, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

function AuditsManagementPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const auditsQuery = useMemoFirebase(() => {
        return query(collection(db, "audits"), orderBy("createdAt", "desc"));
    }, []);

    const { data: audits, isLoading } = useCollection(auditsQuery);

    const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

    const updateAuditStatus = async (auditId: string, newStatus: string, userId: string, businessName: string) => {
        try {
            await updateDoc(doc(db, "audits", auditId), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, "notifications"), {
                userId: userId,
                title: "Mise à jour Audit DKS",
                message: `Le statut de l'audit pour ${businessName} est passé à : ${newStatus.toUpperCase()}.`,
                type: 'info',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard'
            });

            toast({ title: "Audit mis à jour", description: `Statut : ${newStatus}` });
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge className="bg-orange-500/10 text-orange-400 border-none uppercase text-[9px] font-black">Demande Reçue</Badge>;
            case 'scheduled': return <Badge className="bg-blue-500/10 text-blue-400 border-none uppercase text-[9px] font-black">Mission Planifiée</Badge>;
            case 'completed': return <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[9px] font-black">Rapport Terminé</Badge>;
            case 'cancelled': return <Badge className="bg-white/5 text-muted-foreground border-none uppercase text-[9px] font-black">Annulé</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const filteredAudits = audits?.filter(a => {
        const matchesSearch = a.businessName?.toLowerCase().includes(search.toLowerCase()) || a.contactPerson?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || a.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (!isStaff) {
        return <div className="min-h-screen flex items-center justify-center">Accès réservé aux consultants Business DKS.</div>;
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
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Pilotage <span className="text-accent">Audits Business</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Gestion des expertises d'infrastructures en Ituri</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-10">
                    <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <Input 
                            placeholder="Chercher une entreprise ou un contact..." 
                            className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl focus:border-accent"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-16 w-full md:w-[200px] bg-white/5 border-white/10 rounded-2xl font-black uppercase italic text-[10px]">
                            <SelectValue placeholder="Filtrer" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-white/10">
                            <SelectItem value="all">Tous les audits</SelectItem>
                            <SelectItem value="pending">Nouveaux</SelectItem>
                            <SelectItem value="scheduled">Planifiés</SelectItem>
                            <SelectItem value="completed">Remis</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                    ) : filteredAudits && filteredAudits.length > 0 ? (
                        filteredAudits.map((audit) => (
                            <Card key={audit.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group">
                                <CardContent className="p-8 flex flex-col lg:flex-row items-center gap-10">
                                    <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center shrink-0">
                                        <Building2 className="text-accent" size={36} />
                                    </div>
                                    
                                    <div className="flex-1 space-y-4 text-center md:text-left">
                                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                                            <h3 className="text-2xl font-black uppercase italic tracking-tight">{audit.businessName}</h3>
                                            {getStatusBadge(audit.status)}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6 text-[10px] font-black uppercase italic text-muted-foreground/60">
                                            <div className="flex items-center gap-2"><UserCheck size={12} className="text-accent"/> Responsable: {audit.contactPerson}</div>
                                            <div className="flex items-center gap-2"><Phone size={12} className="text-accent"/> {audit.phone}</div>
                                            <div className="flex items-center gap-2"><MapPin size={12} className="text-accent"/> Bunia: {audit.location}</div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {audit.needs?.map((need: string, i: number) => (
                                                <Badge key={i} variant="outline" className="bg-white/5 border-white/10 text-[8px] font-black uppercase px-2 py-0.5">{need}</Badge>
                                            ))}
                                        </div>

                                        <p className="text-xs text-white/60 italic leading-relaxed border-t border-white/5 pt-4">"{audit.description}"</p>
                                    </div>

                                    <div className="flex flex-col gap-3 shrink-0 min-w-[240px]">
                                        <Link href="/dashboard/quotes">
                                            <Button className="w-full h-12 bg-accent text-black rounded-xl font-black uppercase italic text-[10px] gap-2 shadow-lg">
                                                <PlusCircle size={14} /> Transformer en Devis
                                            </Button>
                                        </Link>
                                        <Select value={audit.status} onValueChange={(val) => updateAuditStatus(audit.id, val, audit.userId, audit.businessName)}>
                                            <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl font-black uppercase italic text-[10px]">
                                                <SelectValue placeholder="Suivi Mission" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-white/10">
                                                <SelectItem value="pending" className="text-[10px] font-black uppercase">En attente</SelectItem>
                                                <SelectItem value="scheduled" className="text-[10px] font-black uppercase text-blue-400">Planifier Visite Site</SelectItem>
                                                <SelectItem value="completed" className="text-[10px] font-black uppercase text-green-400">Audit Remis</SelectItem>
                                                <SelectItem value="cancelled" className="text-[10px] font-black uppercase opacity-40">Annuler / Refuser</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="outline" className="h-12 border-white/10 text-white rounded-xl font-black uppercase italic text-[10px] gap-2">
                                            <FileText size={14} /> Rapport de Visite
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                            <ShieldCheck size={80} strokeWidth={1} />
                            <p className="text-xl font-black uppercase italic tracking-tighter">Aucune mission d'audit</p>
                            <p className="text-xs max-w-sm uppercase font-black tracking-widest leading-relaxed">Les demandes d'audit business s'afficheront ici pour planification.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default withAuth(AuditsManagementPage);
