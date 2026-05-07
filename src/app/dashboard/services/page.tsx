
"use client";

import { useState, useEffect, useRef } from 'react';
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
    Receipt,
    Star,
    Award,
    Download,
    FileBadge,
    QrCode,
    ShieldCheck,
    MessageSquareText,
    Send,
    UsersRound,
    FileText,
    Trophy,
    Lock
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
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Mapping des prix pour la facturation automatique
const SERVICE_PRICES: Record<string, number> = {
    "ia-mastery": 75,
    "ia-workshop": 50,
    "crypto-trading": 50,
    "pc-building": 35,
    "cyber-audit": 250,
    "network-pro": 150,
    "cctv-install": 150,
    "hardware-extreme": 45,
    "network-install": 150,
    "hardware-upgrade": 25,
    "support": 15
};

function ServiceManagementPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [staffMembers, setStaffMembers] = useState<any[]>([]);
    
    // Review States
    const [isReviewSheetOpen, setIsReviewSheetOpen] = useState(false);
    const [selectedBookingForReview, setSelectedBookingForReview] = useState<any>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

    // PDF Generation States
    const [selectedBookingForCert, setSelectedBookingForCert] = useState<any | null>(null);
    const [isGeneratingCert, setIsGeneratingCert] = useState(false);
    const certRef = useRef<HTMLDivElement>(null);

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

            if (newStatus === 'completed') {
                const finalPrice = booking.totalAmount || SERVICE_PRICES[booking.serviceId] || 30;
                
                await addDoc(collection(db, "orders"), {
                    userId: booking.userId,
                    customerName: booking.customerName,
                    items: [{ 
                        name: `Academy/Solution: ${booking.serviceTitle} ${booking.groupSize > 1 ? `(Groupe x${booking.groupSize})` : ''}`, 
                        quantity: 1, 
                        price: finalPrice 
                    }],
                    total: finalPrice,
                    status: "pending_payment",
                    paymentMethod: "CASH",
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    source: 'service_hub',
                    sourceId: booking.id
                });

                toast({ title: "Prestation terminée", description: `Facture de ${finalPrice}$ générée.` });
            }

            await addDoc(collection(db, "notifications"), {
                userId: booking.userId,
                title: "Statut DKS Academy",
                message: `Mise à jour : ${newStatus.toUpperCase()}.${newStatus === 'completed' ? ' Votre certificat est prêt !' : ''}`,
                type: 'info',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/services'
            });

            if (newStatus !== 'completed') toast({ title: "Statut mis à jour" });
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        }
    };

    const handleSubmitReview = async () => {
        if (!selectedBookingForReview || !user) return;
        setIsReviewSubmitting(true);
        try {
            await addDoc(collection(db, "reviews"), {
                bookingId: selectedBookingForReview.id,
                userId: user.uid,
                userName: user.name,
                userPhoto: user.photoURL || null,
                serviceId: selectedBookingForReview.serviceId,
                serviceTitle: selectedBookingForReview.serviceTitle,
                rating: rating,
                comment: comment,
                createdAt: serverTimestamp()
            });

            await updateDoc(doc(db, "serviceBookings", selectedBookingForReview.id), {
                hasReview: true
            });

            toast({ title: "Merci pour votre avis !", description: "Votre témoignage aide la communauté DKS." });
            setIsReviewSheetOpen(false);
            setComment("");
            setRating(5);
        } catch (e) {
            toast({ title: "Erreur", description: "Impossible d'envoyer l'avis.", variant: "destructive" });
        } finally {
            setIsReviewSubmitting(false);
        }
    };

    const handleDownloadCertificate = async (booking: any) => {
        setSelectedBookingForCert(booking);
        setTimeout(async () => {
            if (!certRef.current) return;
            setIsGeneratingCert(true);
            try {
                const canvas = await html2canvas(certRef.current, { 
                    scale: 2, 
                    useCORS: true, 
                    backgroundColor: "#ffffff" 
                });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
                const fileName = booking.groupSize > 1 
                    ? `CERTIF_GROUPE_DKS_${booking.customerName.replace(/\s+/g, '_')}.pdf`
                    : `CERTIF_DKS_${booking.customerName.replace(/\s+/g, '_')}.pdf`;
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
                pdf.save(fileName);
                toast({ title: "Certificat généré", description: "Félicitations pour cette réussite !" });
            } catch (error) {
                toast({ title: "Erreur PDF", variant: "destructive" });
            } finally {
                setIsGeneratingCert(false);
                setSelectedBookingForCert(null);
            }
        }, 500);
    };

    const assignTechnician = async (bookingId: string, techId: string, techName: string) => {
        try {
            await updateDoc(doc(db, "serviceBookings", bookingId), {
                technicianId: techId,
                technicianName: techName,
                updatedAt: serverTimestamp()
            });
            toast({ title: "Instructeur assigné", description: `${techName} pilote ce dossier.` });
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge className="bg-orange-500/10 text-orange-400 border-none uppercase text-[9px] font-black">Candidature</Badge>;
            case 'confirmed': return <Badge className="bg-blue-500/10 text-blue-400 border-none uppercase text-[9px] font-black">Admis / Planifié</Badge>;
            case 'in_progress': return <Badge className="bg-purple-500/10 text-purple-400 border-none uppercase text-[9px] font-black">En Cours</Badge>;
            case 'completed': return <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[9px] font-black">Diplômé / Terminé</Badge>;
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

    const filteredBookings = (bookings || []).filter(b => {
        const matchesSearch = b.customerName?.toLowerCase().includes(search.toLowerCase()) || b.serviceTitle?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || b.status === statusFilter;
        const matchesUser = isStaff || b.userId === user?.uid;
        return matchesSearch && matchesStatus && matchesUser;
    });

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard"><Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0"><ArrowLeft size={24} /></Button></Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Pilotage <span className="text-primary">Academy & Solutions</span></h1>
                            <p className="text-muted-foreground font-light mt-1">Gestion des admissions et déploiements techniques DKS.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="animate-spin text-accent h-12 w-12" />
                        </div>
                    ) : filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                            <Card key={booking.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group">
                                <CardContent className="p-8 flex flex-col lg:flex-row items-center gap-8">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">{getCategoryIcon(booking.category)}</div>
                                    
                                    <div className="flex-1 space-y-4 text-center md:text-left">
                                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                                            <h3 className="text-xl font-black uppercase italic tracking-tight">{booking.serviceTitle}</h3>
                                            {getStatusBadge(booking.status)}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-6 text-[10px] font-black uppercase italic text-muted-foreground/60">
                                            <div className="flex items-center gap-2"><User size={12} className="text-primary"/> {booking.customerName}</div>
                                            <div className="flex items-center gap-2"><Calendar size={12} className="text-accent"/> {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'Date à fixer'}</div>
                                            <div className="flex items-center gap-2"><Receipt size={12} className="text-accent"/> Total: ${booking.totalAmount || 'Calcul...'}</div>
                                            <div className="flex items-center gap-2"><UserCheck size={12} className="text-primary"/> Expert: {booking.technicianName || 'Non assigné'}</div>
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
                                                        <SelectValue placeholder="Assigner Instructeur" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-card border-white/10">
                                                        {staffMembers.map(m => <SelectItem key={m.id} value={m.id}>{m.displayName || m.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <div className="flex gap-2">
                                                    <Select value={booking.status} onValueChange={(val) => updateBookingStatus(booking, val)}>
                                                        <SelectTrigger className="flex-1 h-10 bg-white/5 border-white/10 rounded-xl font-black uppercase italic text-[9px]"><SelectValue placeholder="Suivi Cursus" /></SelectTrigger>
                                                        <SelectContent className="bg-card border-white/10">
                                                            <SelectItem value="pending">En attente</SelectItem>
                                                            <SelectItem value="confirmed">Admettre / Confirmer</SelectItem>
                                                            <SelectItem value="in_progress">En cours</SelectItem>
                                                            <SelectItem value="completed">Diplômer & Facturer</SelectItem>
                                                            <SelectItem value="cancelled">Refuser / Annuler</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {booking.status === 'completed' && booking.category === 'formation' && (
                                                        <Button 
                                                            size="icon" 
                                                            variant="outline" 
                                                            className={cn("h-10 w-10 border-accent/20 text-accent", booking.groupSize > 1 && "bg-accent/10")}
                                                            onClick={() => handleDownloadCertificate(booking)}
                                                            disabled={isGeneratingCert}
                                                        >
                                                            {isGeneratingCert ? <Loader2 className="animate-spin h-4 w-4" /> : <Download size={16} />}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                {booking.status === 'completed' && booking.category === 'formation' && (
                                                    <Button 
                                                        className="bg-accent text-black h-12 rounded-xl font-black uppercase italic text-[10px] gap-2 shadow-lg"
                                                        onClick={() => handleDownloadCertificate(booking)}
                                                        disabled={isGeneratingCert}
                                                    >
                                                        {isGeneratingCert ? <Loader2 className="animate-spin h-4 w-4" /> : <FileBadge size={16} />}
                                                        Télécharger mon Diplôme
                                                    </Button>
                                                )}
                                                <Button variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/10 gap-2 h-12 font-black uppercase italic text-[10px]" asChild>
                                                    <a href={`https://wa.me/243823038945?text=Bonjour,%20je%20souhaite%20contacter%20mon%20instructeur%20DKS%20pour%20le%20cursus%20${booking.serviceTitle}.`} target="_blank" rel="noopener noreferrer">
                                                        <Smartphone size={14} /> Contacter mon Instructeur
                                                    </a>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                            <GraduationCap size={80} strokeWidth={1} /><p className="text-xl font-black uppercase italic tracking-tighter">Aucun cursus actif</p>
                        </div>
                    )}
                </div>
            </main>

            {/* MODÈLE DE CERTIFICAT ACADEMY AVEC CACHET HAUTE SÉCURITÉ */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {selectedBookingForCert && (
                    <div ref={certRef} className="bg-white text-black p-0 w-[1123px] h-[794px] font-serif relative overflow-hidden flex items-center justify-center">
                        <div className="absolute inset-0 border-[30px] border-double border-[#0f172a]" />
                        <div className="absolute inset-10 border-4 border-blue-900/10" />
                        <div className="relative z-10 text-center w-full px-40 space-y-12">
                            <div className="flex flex-col items-center gap-6"><Logo size="lg" /><div className="space-y-1"><h2 className="text-sm font-bold tracking-[0.4em] uppercase text-blue-900">Double King Academy</h2><p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-40">Excellence Technologique • Bunia, RDC</p></div></div>
                            <div className="space-y-4"><h1 className="text-6xl font-black uppercase italic tracking-tighter text-[#0f172a]">{selectedBookingForCert.groupSize > 1 ? "CERTIFICAT COLLECTIF" : "CERTIFICAT"}</h1><p className="text-xl font-light italic text-gray-500">DE RÉUSSITE ACADÉMIQUE</p></div>
                            <div className="space-y-6 py-8"><p className="text-lg font-medium text-gray-400">Le présent certificat est décerné à</p><h3 className="text-5xl font-black uppercase tracking-tight border-b-2 border-gray-100 inline-block pb-2 px-10 italic">{selectedBookingForCert.customerName}</h3><h4 className="text-3xl font-bold italic text-blue-900 uppercase mt-4">{selectedBookingForCert.serviceTitle}</h4></div>
                            
                            <div className="grid grid-cols-3 items-end pt-12">
                                <div className="text-center space-y-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date de délivrance</p>
                                    <p className="text-sm font-bold">{new Date().toLocaleDateString('fr-FR')}</p>
                                </div>
                                <div className="flex flex-col items-center gap-4">
                                    <div className="p-3 border-2 border-gray-100 rounded-2xl bg-white"><QrCode size={60} className="opacity-100 text-black" /></div>
                                    <p className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">ID: DKS-CERT-{selectedBookingForCert.id.substring(0, 8).toUpperCase()}</p>
                                </div>
                                
                                <div className="text-center space-y-4 relative">
                                    <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 flex flex-col items-center">
                                        {/* CACHET HAUTE SÉCURITÉ MIDNIGHT BLUE */}
                                        <div className="w-28 h-28 rounded-full border-[3px] border-double border-blue-900 flex flex-col items-center justify-center p-1 rotate-[15deg] opacity-95 relative">
                                            <div className="absolute inset-0 border border-blue-900/20 rounded-full scale-[0.95]" />
                                            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-60">
                                                <path id="certCirclePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
                                                <text className="text-[4px] font-black fill-blue-900 uppercase">
                                                    <textPath xlinkHref="#certCirclePath">
                                                        CERTIFIED BY DOUBLE KING SHOP • ORIGINAL DOCUMENT • CERTIFIED BY DOUBLE KING SHOP • 
                                                    </textPath>
                                                </text>
                                            </svg>
                                            <p className="text-[5px] font-black text-blue-900 uppercase leading-none">DKS ACADEMY</p>
                                            <ShieldCheck size={18} className="text-blue-900 my-0.5" />
                                            <p className="text-[4px] font-bold text-blue-900 uppercase">OFFICIAL SEAL</p>
                                            <p className="text-[6px] font-black text-blue-900 uppercase tracking-widest mt-0.5">BUNIA</p>
                                        </div>
                                        <div className="w-32 h-8 text-blue-950 mt-[-20px] rotate-[-5deg]">
                                            <svg viewBox="0 0 200 60" className="w-full h-full">
                                                <path d="M20,40 Q50,10 80,40 T140,30 Q160,20 180,45" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="w-40 h-px bg-gray-200 mx-auto" />
                                    <div className="flex flex-col items-center">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Direction Technique</p>
                                        <p className="text-sm font-black italic text-[#0f172a]">Expert Bahati Nyeke</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default withAuth(ServiceManagementPage);
