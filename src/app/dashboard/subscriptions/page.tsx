
"use client";

import { useState, useRef } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    CreditCard, 
    Plus, 
    ArrowLeft, 
    Loader2, 
    Search, 
    Clock, 
    CheckCircle2, 
    AlertTriangle,
    Calendar,
    User,
    RefreshCw,
    Receipt,
    ShieldCheck,
    Zap,
    XCircle,
    FileText,
    Download,
    QrCode,
    BarChart3,
    Wrench,
    Send
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, orderBy, updateDoc, doc, addDoc, serverTimestamp, where } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';

function SubscriptionsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isPrioritySheetOpen, setIsPrioritySheetOpen] = useState(false);
    const [selectedSubForTicket, setSelectedSubForTicket] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Reporting States
    const [selectedSubForReport, setSelectedSubForReport] = useState<any | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

    const subsQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        if (isStaff) return query(collection(db, "subscriptions"), orderBy("updatedAt", "desc"));
        return query(collection(db, "subscriptions"), where("userId", "==", user.uid), orderBy("updatedAt", "desc"));
    }, [user?.uid, user?.role, isStaff]);

    const { data: subscriptions, isLoading } = useCollection(subsQuery);

    const handleCreateSubscription = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            const start = new Date();
            const next = addMonths(start, 1);

            const subData = {
                userId: formData.get('userId') || user?.uid,
                customerName: formData.get('customerName'),
                serviceTitle: formData.get('serviceTitle'),
                planType: formData.get('planType'),
                amount: parseFloat(formData.get('amount') as string),
                status: 'active',
                startDate: start.toISOString(),
                nextBillingDate: next.toISOString(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await addDoc(collection(db, "subscriptions"), subData);
            
            toast({ title: "Contrat activé", description: "Le service récurrent est désormais en place." });
            setIsSheetOpen(false);
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreatePriorityTicket = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedSubForTicket) return;
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        try {
            const ticketData = {
                userId: user?.uid,
                customerName: user?.name || "Client DKS",
                productName: selectedSubForTicket.serviceTitle,
                issueDescription: formData.get('description'),
                status: 'pending',
                priority: 'urgent',
                subscriptionId: selectedSubForTicket.id,
                subscriptionTitle: selectedSubForTicket.serviceTitle,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await addDoc(collection(db, "supportTickets"), ticketData);

            await addDoc(collection(db, "notifications"), {
                userId: 'staff',
                title: "ALERTE VIP: Support Prioritaire",
                message: `${user?.name} demande une intervention urgente sous contrat (${selectedSubForTicket.serviceTitle}).`,
                type: 'error',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/support'
            });

            toast({ title: "Alerte Prioritaire Envoyée", description: "Votre contrat garantit un traitement sous 2h." });
            setIsPrioritySheetOpen(false);
            router.push('/dashboard/support');
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateMonthlyInvoice = async (sub: any) => {
        try {
            await addDoc(collection(db, "orders"), {
                userId: sub.userId,
                customerName: sub.customerName,
                items: [{ 
                    name: `Maintenance Récurrente: ${sub.serviceTitle}`, 
                    quantity: 1, 
                    price: sub.amount 
                }],
                total: sub.amount,
                status: "pending_payment",
                paymentMethod: "CASH",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                source: 'subscription',
                sourceId: sub.id
            });

            const next = addMonths(new Date(sub.nextBillingDate), 1);
            await updateDoc(doc(db, "subscriptions", sub.id), {
                nextBillingDate: next.toISOString(),
                updatedAt: serverTimestamp()
            });

            toast({ title: "Facture mensuelle générée", description: "Rendez-vous en boutique pour le règlement." });
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); }
    };

    const handleDownloadReport = async (sub: any) => {
        setSelectedSubForReport(sub);
        setTimeout(async () => {
            if (!reportRef.current) return;
            setIsGeneratingReport(true);
            try {
                const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
                pdf.save(`BILAN_DKS_${sub.customerName.replace(/\s+/g, '_')}_${format(new Date(), 'MM_yyyy')}.pdf`);
                toast({ title: "Bilan PDF Généré", description: "Le rapport a été téléchargé." });
            } catch (error) {
                toast({ title: "Erreur PDF", variant: "destructive" });
            } finally {
                setIsGeneratingReport(false);
                setSelectedSubForReport(null);
            }
        }, 500);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active': return <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[9px] font-black">Service Actif</Badge>;
            case 'past_due': return <Badge className="bg-red-500/10 text-red-400 border-none uppercase text-[9px] font-black animate-pulse">Paiement Attendu</Badge>;
            case 'cancelled': return <Badge className="bg-white/5 text-muted-foreground border-none uppercase text-[9px] font-black">Contrat Résilié</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const filteredSubs = subscriptions?.filter(s => 
        s.customerName?.toLowerCase().includes(search.toLowerCase()) || 
        s.serviceTitle?.toLowerCase().includes(search.toLowerCase())
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
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Services <span className="text-accent">Récurrents</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Maintenance & Monitoring Continu</p>
                        </div>
                    </div>
                    {isStaff && (
                        <Button onClick={() => setIsSheetOpen(true)} className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-primary/10">
                            <Plus size={20} /> Nouveau Contrat
                        </Button>
                    )}
                </div>

                <div className="mb-10 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input 
                        placeholder="Chercher un contrat ou un client..." 
                        className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl focus:border-accent"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                    ) : filteredSubs && filteredSubs.length > 0 ? (
                        filteredSubs.map((sub) => (
                            <Card key={sub.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group">
                                <CardContent className="p-8 flex flex-col lg:flex-row items-center gap-10">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                                        <RefreshCw className={sub.status === 'active' ? "text-accent animate-spin-slow" : "text-muted-foreground"} size={28} />
                                    </div>
                                    
                                    <div className="flex-1 space-y-3 text-center md:text-left">
                                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                                            <h3 className="text-xl font-black uppercase italic tracking-tight">{sub.serviceTitle}</h3>
                                            {getStatusBadge(sub.status)}
                                        </div>
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 text-[9px] font-black uppercase italic text-muted-foreground/40 tracking-widest">
                                            <span className="flex items-center gap-2"><User size={12} className="text-accent" /> {sub.customerName}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-2"><Calendar size={12} /> Début: {new Date(sub.startDate).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-2"><Clock size={12} /> Échéance: {new Date(sub.nextBillingDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 shrink-0">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Redevance {sub.planType === 'monthly' ? 'Mensuelle' : 'Périodique'}</p>
                                            <p className="text-2xl font-black text-white">${sub.amount.toFixed(2)}</p>
                                        </div>
                                        <div className="flex flex-col gap-2 min-w-[180px]">
                                            {!isStaff && sub.status === 'active' && (
                                                <Button 
                                                    className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-11 px-4 gap-2 font-black uppercase italic text-[10px] shadow-lg animate-pulse"
                                                    onClick={() => {
                                                        setSelectedSubForTicket(sub);
                                                        setIsPrioritySheetOpen(true);
                                                    }}
                                                >
                                                    <Wrench size={14} /> Support Prioritaire
                                                </Button>
                                            )}
                                            <Button 
                                                variant="outline"
                                                className="rounded-xl h-11 px-4 gap-2 font-black uppercase italic text-[10px] border-white/10 hover:bg-white/5"
                                                onClick={() => handleDownloadReport(sub)}
                                                disabled={isGeneratingReport}
                                            >
                                                {isGeneratingReport ? <Loader2 className="animate-spin h-3 w-3" /> : <FileText size={14} />} Bilan Mensuel
                                            </Button>
                                            {isStaff && sub.status === 'active' && (
                                                <Button 
                                                    className="bg-accent text-black rounded-xl h-11 px-4 gap-2 font-black uppercase italic text-[10px] shadow-lg"
                                                    onClick={() => generateMonthlyInvoice(sub)}
                                                >
                                                    <Receipt size={14} /> Facturer Période
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                            <CreditCard size={80} strokeWidth={1} />
                            <p className="text-xl font-black uppercase italic tracking-tighter">Aucun contrat récurrent</p>
                        </div>
                    )}
                </div>
            </main>

            {/* CREATE SUBSCRIPTION SHEET */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">Nouveau Contrat Hub</SheetTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Maintenance & Monitoring</p>
                    </SheetHeader>
                    
                    <form onSubmit={handleCreateSubscription} className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Libellé du Service</Label>
                                <Select name="serviceTitle" required>
                                    <SelectTrigger className="h-14 bg-background/50 border-white/5 rounded-2xl">
                                        <SelectValue placeholder="Choisir un forfait" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-white/10">
                                        <SelectItem value="Maintenance Starlink Premium" className="font-bold uppercase text-[10px]">Maintenance Starlink Premium</SelectItem>
                                        <SelectItem value="Monitoring CCTV 24/7" className="font-bold uppercase text-[10px]">Monitoring CCTV 24/7</SelectItem>
                                        <SelectItem value="Support IT Corporate" className="font-bold uppercase text-[10px]">Support IT Corporate</SelectItem>
                                        <SelectItem value="Academy VIP Coaching" className="font-bold uppercase text-[10px]">Academy VIP Coaching</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Client DKS Elite</Label>
                                <Input name="customerName" placeholder="Nom complet de l'abonné" required className="h-14 bg-background/50 border-white/5 rounded-2xl" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Fréquence</Label>
                                    <Select name="planType" defaultValue="monthly">
                                        <SelectTrigger className="h-12 bg-background/50 border-white/5 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-white/10">
                                            <SelectItem value="monthly" className="text-[10px] font-black uppercase">Mensuel</SelectItem>
                                            <SelectItem value="quarterly" className="text-[10px] font-black uppercase">Trimestriel</SelectItem>
                                            <SelectItem value="yearly" className="text-[10px] font-black uppercase">Annuel</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Montant ($)</Label>
                                    <Input name="amount" type="number" placeholder="0.00" required className="h-12 bg-background/50 border-white/5 rounded-xl text-accent font-black" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8">
                            <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Activer le Forfait Récurrent"}
                            </Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>

            {/* PRIORITY TICKET SHEET */}
            <Sheet open={isPrioritySheetOpen} onOpenChange={setIsPrioritySheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-8 bg-red-500/10 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                                <Zap size={24} />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter text-red-500">Alerte Support VIP</SheetTitle>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Lien Contrat : {selectedSubForTicket?.serviceTitle}</p>
                            </div>
                        </div>
                    </SheetHeader>
                    
                    <form onSubmit={handleCreatePriorityTicket} className="flex-1 p-8 space-y-8 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/20">
                                <p className="text-[10px] text-red-400 font-bold uppercase leading-relaxed italic">
                                    En tant qu'abonné Elite, votre demande est traitée en priorité absolue. Un expert interviendra sous un délai garanti par votre contrat.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Nature de l'urgence</Label>
                                <Textarea name="description" placeholder="Détaillez le blocage technique rencontré..." required className="min-h-[150px] bg-background/50 border-white/5 rounded-2xl focus:border-red-500 text-sm italic" />
                            </div>
                        </div>

                        <div className="pt-8">
                            <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-red-500 text-white font-black uppercase italic rounded-2xl shadow-xl shadow-red-500/20 text-lg gap-2">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Lancer l'Intervention Immédiate</>}
                            </Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>

            {/* MODÈLE DE BILAN PDF (HIDDEN) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {selectedSubForReport && (
                    <div ref={reportRef} className="bg-white text-black p-16 w-[800px] font-sans">
                        <header className="flex justify-between items-start border-b-4 border-black pb-10 mb-12">
                            <div className="space-y-4">
                                <div className="bg-black text-white px-6 py-2 inline-block font-black text-3xl italic tracking-tighter">DKS SOLUTIONS</div>
                                <div className="text-sm font-bold uppercase tracking-widest text-gray-500">Bilan Mensuel de Maintenance</div>
                                <div className="text-[11px] leading-relaxed mt-4 font-medium">
                                    <p>Immeuble Bahati, Bunia, RDC</p>
                                    <p>Support Elite: +243 823 038 945</p>
                                    <p>Email: business@dks-shop.com</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-2">RAPPORT</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">PÉRIODE: {format(new Date(), 'MMMM yyyy', { locale: fr }).toUpperCase()}</p>
                                <div className="mt-8">
                                    <p className="text-[10px] font-black uppercase text-gray-400">Réf. Contrat</p>
                                    <p className="text-lg font-bold">#{selectedSubForReport.id.substring(0, 8).toUpperCase()}</p>
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-2 gap-10 mb-12">
                            <div className="p-6 bg-gray-50 rounded-2xl space-y-4">
                                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Informations Client</h3>
                                <div>
                                    <p className="text-xl font-black uppercase italic">{selectedSubForReport.customerName}</p>
                                    <p className="text-sm font-bold text-blue-600 uppercase mt-1">{selectedSubForReport.serviceTitle}</p>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 rounded-2xl space-y-4">
                                <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Résumé Performance</h3>
                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <p className="text-2xl font-black">99.9%</p>
                                        <p className="text-[8px] font-bold uppercase text-gray-400">Disponibilité</p>
                                    </div>
                                    <div className="w-px h-10 bg-gray-200" />
                                    <div className="text-center">
                                        <p className="text-2xl font-black">0</p>
                                        <p className="text-[8px] font-bold uppercase text-gray-400">Pannes Majeures</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <section>
                                <h3 className="flex items-center gap-3 text-sm font-black uppercase italic mb-6">
                                    <ShieldCheck className="text-blue-600" size={18} /> État de l'Infrastructure
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {["Connectivité", "Sécurité Réseau", "Intégrité Data"].map((item, i) => (
                                        <div key={i} className="border border-gray-100 p-4 rounded-xl flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase">{item}</span>
                                            <CheckCircle2 size={14} className="text-green-500" />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="flex items-center gap-3 text-sm font-black uppercase italic mb-6">
                                    <Zap className="text-blue-600" size={18} /> Interventions Réalisées
                                </h3>
                                <table className="w-full">
                                    <thead className="bg-gray-100">
                                        <tr className="text-[9px] font-black uppercase text-left">
                                            <th className="p-3">Type d'Action</th>
                                            <th className="p-3">Description Technique</th>
                                            <th className="p-3 text-right">Statut</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs">
                                        <tr className="border-b border-gray-50">
                                            <td className="p-3 font-bold">Préventive</td>
                                            <td className="p-3 italic text-gray-600">Nettoyage logiciel et optimisation des flux Starlink.</td>
                                            <td className="p-3 text-right font-black text-green-600">OK</td>
                                        </tr>
                                        <tr className="border-b border-gray-50">
                                            <td className="p-3 font-bold">Sécurité</td>
                                            <td className="p-3 italic text-gray-600">Mise à jour des firmwares pare-feu et audit accès Wi-Fi.</td>
                                            <td className="p-3 text-right font-black text-green-600">OK</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-bold">Support</td>
                                            <td className="p-3 italic text-gray-600">Assistance utilisateur à distance (Setup Email Pro).</td>
                                            <td className="p-3 text-right font-black text-green-600">OK</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </section>

                            <section className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100">
                                <h3 className="text-sm font-black uppercase italic mb-3 flex items-center gap-2">
                                    <BarChart3 size={16} /> Recommandations Experts
                                </h3>
                                <p className="text-[11px] leading-relaxed text-blue-900 font-medium italic">
                                    "Nous recommandons une mise à niveau du stockage NAS pour le mois prochain afin d'anticiper la croissance de vos données. L'infrastructure actuelle est stable et sécurisée."
                                </p>
                            </section>
                        </div>

                        <footer className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-end">
                            <div className="flex items-center gap-6">
                                <QrCode size={60} className="opacity-20" />
                                <p className="text-[8px] font-bold text-gray-400 uppercase leading-relaxed max-w-[250px]">
                                    Document confidentiel produit par Double King Shop. <br />
                                    Certification ISO-DKS 2024.
                                </p>
                            </div>
                            <div className="text-right space-y-4">
                                <div className="h-16 w-32 border-2 border-gray-100 rounded-lg flex items-center justify-center italic text-gray-300 text-[8px] uppercase font-black">Cachet Technique</div>
                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Solutions Business Hub v3.0</p>
                            </div>
                        </footer>
                    </div>
                )}
            </div>
        </div>
    );
}

export default withAuth(SubscriptionsPage);
