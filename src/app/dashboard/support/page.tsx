
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Wrench, 
    Clock, 
    CheckCircle2, 
    AlertTriangle, 
    ArrowLeft, 
    Loader2, 
    Plus, 
    Search,
    MessageCircle,
    BadgeAlert,
    ExternalLink
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, orderBy } from 'firebase/firestore';
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function SupportPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState("");

    const ticketsQuery = useMemoFirebase(() => {
        const baseRef = collection(db, "supportTickets");
        return query(baseRef, orderBy("updatedAt", "desc"));
    }, []);

    const { data: tickets, isLoading } = useCollection(ticketsQuery);

    const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

    const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            await addDoc(collection(db, "supportTickets"), {
                userId: user?.uid,
                customerName: user?.name || "Client DKS",
                productName: formData.get('productName'),
                issueDescription: formData.get('description'),
                status: 'pending',
                priority: formData.get('priority'),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, "notifications"), {
                userId: 'staff',
                title: "Nouveau Ticket SAV",
                message: `Le client ${user?.name} a ouvert une demande d'assistance pour : ${formData.get('productName')}.`,
                type: 'warning',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/support'
            });

            toast({ title: "Ticket ouvert", description: "Notre équipe technique reviendra vers vous rapidement." });
            setIsModalOpen(false);
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible d'ouvrir le ticket.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateTicketStatus = async (ticketId: string, newStatus: string, ticketUserId: string) => {
        try {
            await updateDoc(doc(db, "supportTickets", ticketId), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, "notifications"), {
                userId: ticketUserId,
                title: "Mise à jour Support SAV",
                message: `L'état de votre réparation a changé : ${newStatus.toUpperCase()}.`,
                type: 'info',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/support'
            });

            toast({ title: "Statut mis à jour" });
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge className="bg-orange-500/10 text-orange-400 border-none uppercase text-[9px] font-black">En attente</Badge>;
            case 'diagnosing': return <Badge className="bg-blue-500/10 text-blue-400 border-none uppercase text-[9px] font-black">Diagnostic</Badge>;
            case 'repairing': return <Badge className="bg-purple-500/10 text-purple-400 border-none uppercase text-[9px] font-black">Réparation</Badge>;
            case 'ready': return <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[9px] font-black">Prêt pour retrait</Badge>;
            case 'completed': return <Badge className="bg-white/5 text-muted-foreground border-none uppercase text-[9px] font-black">Terminé</Badge>;
            default: return <Badge>{status}</Badge>;
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
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Support & <span className="text-accent">SAV</span></h1>
                            <p className="text-muted-foreground font-light mt-1">Gestion technique et garanties Double King Shop Bunia.</p>
                        </div>
                    </div>
                    
                    {!isStaff && (
                        <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-primary/10">
                            <Wrench size={20} /> Demander une assistance
                        </Button>
                    )}
                </div>

                {isStaff && (
                    <div className="mb-10 relative">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <Input 
                            placeholder="Rechercher un ticket par nom de client ou produit..." 
                            className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl focus:border-accent"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                    ) : tickets && tickets.length > 0 ? (
                        tickets
                        .filter(t => !isStaff ? t.userId === user?.uid : (t.customerName?.toLowerCase().includes(search.toLowerCase()) || t.productName?.toLowerCase().includes(search.toLowerCase())))
                        .map((ticket) => (
                            <Card key={ticket.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group">
                                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                                    <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                                        <Wrench size={28} />
                                    </div>
                                    
                                    <div className="flex-1 space-y-2 text-center md:text-left">
                                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                                            <h3 className="text-xl font-black uppercase italic tracking-tight">{ticket.productName}</h3>
                                            {getStatusBadge(ticket.status)}
                                            <Badge variant="outline" className="border-white/10 text-[9px] uppercase font-bold opacity-40">#{ticket.id.substring(0, 8)}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground max-w-2xl">{ticket.issueDescription}</p>
                                        <div className="flex items-center justify-center md:justify-start gap-4 text-[10px] font-black uppercase italic text-muted-foreground/40">
                                            <span>Client: {ticket.customerName}</span>
                                            <span>•</span>
                                            <span>Ouvert le {ticket.createdAt?.toDate?.().toLocaleDateString() || 'Récemment'}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 shrink-0 min-w-[200px]">
                                        {isStaff ? (
                                            <Select value={ticket.status} onValueChange={(val) => updateTicketStatus(ticket.id, val, ticket.userId)}>
                                                <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl font-black uppercase italic text-[10px]">
                                                    <SelectValue placeholder="Changer statut" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-white/10">
                                                    <SelectItem value="pending">En attente</SelectItem>
                                                    <SelectItem value="diagnosing">Diagnostic</SelectItem>
                                                    <SelectItem value="repairing">Réparation</SelectItem>
                                                    <SelectItem value="ready">Prêt (Retrait)</SelectItem>
                                                    <SelectItem value="completed">Terminé</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Button variant="outline" className="rounded-xl border-green-500/20 text-green-500 hover:bg-green-500/10 gap-2 h-12 font-black uppercase italic text-[10px]" asChild>
                                                <a href={`https://wa.me/243823038945?text=Bonjour,%20je%20vous%20contacte%20pour%20mon%20ticket%20SAV%20#${ticket.id.substring(0, 8).toUpperCase()}`}>
                                                    <MessageCircle size={14} /> Aide WhatsApp
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                            <BadgeAlert size={80} strokeWidth={1} />
                            <p className="text-xl font-black uppercase italic tracking-tighter">Aucun ticket en cours</p>
                        </div>
                    )}
                </div>
            </main>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="glossy-card border-none rounded-[2.5rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Demander une Assistance</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTicket} className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Matériel concerné</Label>
                            <Input name="productName" placeholder="Ex: Laptop ASUS ROG, RTX 4070..." required className="h-14 bg-background/50 border-white/10 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Priorité</Label>
                            <Select name="priority" defaultValue="medium">
                                <SelectTrigger className="h-14 bg-background/50 border-white/10 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-white/10">
                                    <SelectItem value="low">Faible</SelectItem>
                                    <SelectItem value="medium">Normale</SelectItem>
                                    <SelectItem value="high">Haute</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Description du problème</Label>
                            <Textarea name="description" placeholder="Détaillez le souci technique ou la demande de garantie..." required className="min-h-[120px] bg-background/50 border-white/10 rounded-xl" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="font-bold uppercase text-[10px]">Annuler</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-accent text-black font-black uppercase italic rounded-xl px-10 h-14 shadow-xl">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Ouvrir le Ticket SAV"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default withAuth(SupportPage);
