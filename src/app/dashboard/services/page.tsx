
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Calendar, 
    Clock, 
    MapPin, 
    User, 
    CheckCircle2, 
    Loader2, 
    ArrowLeft, 
    Search,
    Wrench,
    GraduationCap,
    Globe,
    Cpu,
    Filter,
    Plus,
    UserCheck,
    Smartphone,
    Receipt
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, orderBy, updateDoc, doc, addDoc, serverTimestamp, onSnapshot, where } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Mapping des prix pour la facturation automatique
const SERVICE_PRICES: Record<string, number> = {
    "ia-workshop": 50,
    "network-install": 150,
    "hardware-upgrade": 25,
    "formation": 50,
    "infrastructure": 150,
    "upgrade": 25,
    "support": 15
};

function ServiceManagementPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [staffMembers, setStaffMembers] = useState<any[]>([]);

    useEffect(() => {
        const q = query(collection(db, "users"), where("role", "in", ["admin", "Admin", "seller", "Seller", "cashier", "Cashier"]));
        const unsub = onSnapshot(q, (snap) => {
            setStaffMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    const bookingsQuery = useMemoFirebase(() => {
        return query(collection(db, "serviceBookings"), orderBy("createdAt", "desc"));
    }, []);

    const { data: bookings, isLoading } = useCollection(bookingsQuery);

    const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

    const updateBookingStatus = async (booking: any, newStatus: string) => {
        try {
            await updateDoc(doc(db, "serviceBookings", booking.id), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });

            // LOGIQUE DE FACTURATION AUTOMATIQUE
            if (newStatus === 'completed') {
                const price = SERVICE_PRICES[booking.serviceId] || SERVICE_PRICES[booking.category] || 30;
                
                await addDoc(collection(db, "orders"), {
                    userId: booking.userId,
                    customerName: booking.customerName,
                    items: [{ 
                        name: `Prestation Hub: ${booking.serviceTitle}`, 
                        quantity: 1, 
                        price: price 
                    }],
                    total: price,
                    status: "pending_payment",
                    paymentMethod: "CASH",
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    source: 'service_hub',
                    sourceId: booking.id
                });

                toast({ title: "Service terminé", description: `Facture de ${price}$ générée pour le client.` });
            }

            await addDoc(collection(db, "notifications"), {
                userId: booking.userId,
                title: "Statut de votre Service",
                message: `Le statut de votre prestation "${booking.serviceTitle}" a été mis à jour : ${newStatus.toUpperCase()}.${newStatus === 'completed' ? ' Une facture a été générée.' : ''}`,
                type: 'info',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/services'
            });

            if (newStatus !== 'completed') toast({ title: "Statut mis à jour", description: "Le client a été notifié." });
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        }
    };

    const assignTechnician = async (bookingId: string, techId: string, techName: string) => {
        try {
            await updateDoc(doc(db, "serviceBookings", bookingId), {
                technicianId: techId,
                technicianName: techName,
                updatedAt: serverTimestamp()
            });
            toast({ title: "Technicien assigné", description: `${techName} prend en charge ce dossier.` });
        } catch (e) { toast({ title: "Erreur assignation", variant: "destructive" }); }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge className="bg-orange-500/10 text-orange-400 border-none uppercase text-[9px] font-black">Attente</Badge>;
            case 'confirmed': return <Badge className="bg-blue-500/10 text-blue-400 border-none uppercase text-[9px] font-black">Confirmé</Badge>;
            case 'in_progress': return <Badge className="bg-purple-500/10 text-purple-400 border-none uppercase text-[9px] font-black">En cours</Badge>;
            case 'completed': return <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[9px] font-black">Terminé & Facturé</Badge>;
            case 'cancelled': return <Badge className="bg-white/5 text-muted-foreground border-none uppercase text-[9px] font-black">Annulé</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'formation': return <GraduationCap size={24} className="text-primary" />;
            case 'infrastructure': return <Globe size={24} className="text-accent" />;
            case 'upgrade': return <Cpu size={24} className="text-purple-400" />;
            default: return <Wrench size={24} className="text-slate-400" />;
        }
    };

    const filteredBookings = bookings?.filter(b => {
        const matchesSearch = b.customerName?.toLowerCase().includes(search.toLowerCase()) || b.serviceTitle?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || b.status === statusFilter;
        const matchesUser = isStaff || b.userId === user?.uid;
        return matchesSearch && matchesStatus && matchesUser;
    });

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard"><Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0"><ArrowLeft size={24} /></Button></Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Pôle <span className="text-accent">Services Hub</span></h1>
                            <p className="text-muted-foreground font-light mt-1">Interventions techniques et formations professionnelles à Bunia.</p>
                        </div>
                    </div>
                    {!isStaff && <Link href="/services"><Button className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl"><Plus size={20} /> Nouvelle demande</Button></Link>}
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-10">
                    <div className="relative flex-1">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <Input placeholder="Rechercher par client ou service..." className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl focus:border-accent" value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-16 w-full md:w-[200px] bg-white/5 border-white/10 rounded-2xl font-black uppercase italic text-[10px]"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Filtrer" /></SelectTrigger>
                        <SelectContent className="bg-card border-white/10">
                            <SelectItem value="all">Tous les statuts</SelectItem>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="confirmed">Confirmé</SelectItem>
                            <SelectItem value="in_progress">En cours</SelectItem>
                            <SelectItem value="completed">Terminé</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div> : filteredBookings && filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                            <Card key={booking.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group">
                                <CardContent className="p-8 flex flex-col lg:flex-row items-center gap-8">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">{getCategoryIcon(booking.category)}</div>
                                    
                                    <div className="flex-1 space-y-2 text-center md:text-left">
                                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                                            <h3 className="text-xl font-black uppercase italic tracking-tight">{booking.serviceTitle}</h3>
                                            {getStatusBadge(booking.status)}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-6 text-[10px] font-black uppercase italic text-muted-foreground/60">
                                            <div className="flex items-center gap-2"><User size={12} className="text-accent"/> {booking.customerName}</div>
                                            <div className="flex items-center gap-2"><Calendar size={12} className="text-accent"/> {booking.scheduledDate || 'Date à fixer'}</div>
                                            <div className="flex items-center gap-2"><MapPin size={12} className="text-accent"/> {booking.location === 'shop' ? 'Boutique' : 'Sur site'}</div>
                                            <div className="flex items-center gap-2"><UserCheck size={12} className="text-primary"/> {booking.technicianName || 'Expert non assigné'}</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 shrink-0 min-w-[220px]">
                                        {isStaff ? (
                                            <div className="space-y-3">
                                                <Select value={booking.technicianId || ""} onValueChange={(val) => {
                                                    const tech = staffMembers.find(s => s.id === val);
                                                    assignTechnician(booking.id, val, tech?.displayName || tech?.name);
                                                }}>
                                                    <SelectTrigger className="h-10 bg-primary/10 border-primary/20 rounded-xl font-bold uppercase text-[9px]">
                                                        <UserCheck className="mr-2 h-3 w-3" />
                                                        <SelectValue placeholder="Assigner Expert" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-card border-white/10">
                                                        {staffMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.displayName || m.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Select value={booking.status} onValueChange={(val) => updateBookingStatus(booking, val)}>
                                                    <SelectTrigger className="h-10 bg-white/5 border-white/10 rounded-xl font-black uppercase italic text-[9px]"><SelectValue placeholder="Statut" /></SelectTrigger>
                                                    <SelectContent className="bg-card border-white/10">
                                                        <SelectItem value="pending">En attente</SelectItem>
                                                        <SelectItem value="confirmed">Confirmer</SelectItem>
                                                        <SelectItem value="in_progress">Démarrer</SelectItem>
                                                        <SelectItem value="completed">Terminer & Facturer</SelectItem>
                                                        <SelectItem value="cancelled">Annuler</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ) : (
                                            <Button variant="outline" className="rounded-xl border-accent/20 text-accent hover:bg-accent/10 gap-2 h-12 font-black uppercase italic text-[10px]" asChild>
                                                <a href={`https://wa.me/243823038945?text=Bonjour,%20je%20vous%20contacte%20pour%20ma%20réservation%20#${booking.id.substring(0, 8)}`} target="_blank" rel="noopener noreferrer">
                                                    <Smartphone size={14} /> WhatsApp Support
                                                </a>
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                            <Calendar size={80} strokeWidth={1} /><p className="text-xl font-black uppercase italic tracking-tighter">Aucune activité prévue</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default withAuth(ServiceManagementPage);
