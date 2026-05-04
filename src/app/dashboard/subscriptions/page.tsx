
"use client";

import { useState } from 'react';
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
    XCircle
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, orderBy, updateDoc, doc, addDoc, serverTimestamp, where } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format, addMonths } from "date-fns";
import { fr } from "date-fns/locale";

function SubscriptionsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

            // Update next billing date
            const next = addMonths(new Date(sub.nextBillingDate), 1);
            await updateDoc(doc(db, "subscriptions", sub.id), {
                nextBillingDate: next.toISOString(),
                updatedAt: serverTimestamp()
            });

            toast({ title: "Facture mensuelle générée", description: "Rendez-vous en boutique pour le règlement." });
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); }
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
                        <Button onClick={() => setIsSheetOpen(true)} className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-primary/20">
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
                                        <div className="flex flex-col gap-2">
                                            {isStaff && sub.status === 'active' && (
                                                <Button 
                                                    className="bg-accent text-black rounded-xl h-11 px-4 gap-2 font-black uppercase italic text-[10px] shadow-lg"
                                                    onClick={() => generateMonthlyInvoice(sub)}
                                                >
                                                    <Receipt size={14} /> Facturer Période
                                                </Button>
                                            )}
                                            {!isStaff && sub.status === 'past_due' && (
                                                <Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-10 font-black uppercase text-[9px]">
                                                    Régler en Boutique
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
        </div>
    );
}

export default withAuth(SubscriptionsPage);
