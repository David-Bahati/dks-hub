
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    MonitorSmartphone, 
    Loader2, 
    ArrowLeft, 
    CheckCircle2, 
    XCircle, 
    ExternalLink, 
    Activity,
    Clock,
    Terminal,
    ShieldAlert,
    Receipt
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle,
    SheetFooter 
} from "@/components/ui/sheet";

function RemoteSupportPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const sessionsQuery = useMemoFirebase(() => {
        return query(collection(db, "remoteSessions"), orderBy("updatedAt", "desc"));
    }, []);

    const { data: sessions, isLoading } = useCollection(sessionsQuery);

    const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

    const handleCreateSession = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            const sessionData = {
                userId: user?.uid,
                customerName: user?.name || "Client DKS",
                software: formData.get('software'),
                remoteId: formData.get('remoteId'),
                issueDescription: formData.get('description'),
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await addDoc(collection(db, "remoteSessions"), sessionData);

            await addDoc(collection(db, "notifications"), {
                userId: 'staff',
                title: "ALERTE: Support à Distance",
                message: `${user?.name} demande une prise en main immédiate (${formData.get('software')}).`,
                type: 'warning',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/remote'
            });

            toast({ title: "Signal envoyé", description: "Gardez votre logiciel ouvert, un expert DKS se connecte." });
            setIsSheetOpen(false);
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateStatus = async (session: any, newStatus: string) => {
        try {
            await updateDoc(doc(db, "remoteSessions", session.id), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });

            if (newStatus === 'completed') {
                await addDoc(collection(db, "orders"), {
                    userId: session.userId,
                    customerName: session.customerName,
                    items: [{ 
                        name: `Support Direct: ${session.issueDescription.substring(0, 30)}...`, 
                        quantity: 1, 
                        price: 15 
                    }],
                    total: 15,
                    status: "pending_payment",
                    paymentMethod: "CASH",
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    source: 'remote_support',
                    sourceId: session.id
                });
                toast({ title: "Session clôturée", description: "Facture de 15$ générée." });
            }

            await addDoc(collection(db, "notifications"), {
                userId: session.userId,
                title: "Statut Prise en Main",
                message: `Mise à jour : ${newStatus.toUpperCase()}.`,
                type: 'info',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/remote'
            });

            if (newStatus !== 'completed') toast({ title: "Statut mis à jour" });
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge className="bg-orange-500/10 text-orange-400 border-none uppercase text-[9px] font-black animate-pulse">En attente</Badge>;
            case 'active': return <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[9px] font-black">Expert en Ligne</Badge>;
            case 'completed': return <Badge className="bg-white/5 text-muted-foreground border-none uppercase text-[9px] font-black">Terminé & Facturé</Badge>;
            case 'cancelled': return <Badge className="bg-destructive/10 text-destructive border-none uppercase text-[9px] font-black">Annulé</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const filteredSessions = sessions?.filter(s => isStaff || s.userId === user?.uid);

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
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Support <span className="text-accent">Direct</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Prise en main logicielle immédiate à Bunia</p>
                        </div>
                    </div>
                    
                    {!isStaff && (
                        <Button onClick={() => setIsSheetOpen(true)} className="bg-accent text-black hover:bg-accent/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-accent/20">
                            <MonitorSmartphone size={20} /> Lancer une session
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                    ) : filteredSessions && filteredSessions.length > 0 ? (
                        filteredSessions.map((session) => (
                            <Card key={session.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group">
                                <CardContent className="p-8 flex flex-col lg:flex-row items-center gap-8">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                                        <Activity className={session.status === 'active' ? 'text-green-400 animate-pulse' : 'text-white/20'} size={28} />
                                    </div>
                                    
                                    <div className="flex-1 space-y-3 text-center md:text-left">
                                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                                            <h3 className="text-xl font-black uppercase italic tracking-tight">{session.customerName}</h3>
                                            {getStatusBadge(session.status)}
                                        </div>
                                        <div className="flex items-center justify-center md:justify-start gap-5 text-[9px] font-black uppercase italic text-muted-foreground/40 tracking-widest">
                                            <span className="flex items-center gap-2"><Terminal size={12} className="text-accent" /> {session.software?.toUpperCase()}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-2"><Clock size={12} /> {session.createdAt?.toDate?.().toLocaleTimeString() || 'Récemment'}</span>
                                        </div>
                                        <p className="text-sm text-white/70 italic max-w-2xl">" {session.issueDescription} "</p>
                                    </div>

                                    <div className="flex flex-col gap-3 shrink-0 min-w-[220px]">
                                        {isStaff ? (
                                            <>
                                                {session.status !== 'completed' && session.status !== 'cancelled' && (
                                                    <Button className="bg-primary text-white rounded-xl h-12 font-black uppercase italic text-[10px] gap-2 shadow-lg" onClick={() => updateStatus(session, 'active')}>
                                                        <ExternalLink size={14} /> Se Connecter
                                                    </Button>
                                                )}
                                                <div className="flex gap-2">
                                                    {session.status !== 'completed' && session.status !== 'cancelled' && (
                                                        <Button variant="outline" className="flex-1 rounded-xl border-white/10 text-[9px] font-black uppercase h-10 hover:bg-green-500/10 hover:text-green-400" onClick={() => updateStatus(session, 'completed')}>
                                                            <Receipt size={12} className="mr-2" /> Clôturer
                                                        </Button>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="p-5 bg-black/40 rounded-2xl border border-white/5 text-center">
                                                <p className="text-[8px] font-black uppercase text-muted-foreground mb-2 tracking-[0.2em]">Votre ID Partagé</p>
                                                <p className="text-xl font-mono font-black text-accent tracking-[0.3em]">{session.remoteId}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                            <MonitorSmartphone size={80} strokeWidth={1} />
                            <p className="text-xl font-black uppercase italic tracking-tighter">Aucune session active</p>
                            <p className="text-xs max-w-sm uppercase font-black tracking-widest leading-relaxed">Le support à distance permet une résolution logicielle immédiate sans déplacement.</p>
                        </div>
                    )}
                </div>
            </main>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">Nouvelle Demande Directe</SheetTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Assistance Logicielle Instantanée</p>
                    </SheetHeader>
                    <form onSubmit={handleCreateSession} className="flex-1 p-8 space-y-8 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Logiciel de Prise en Main</Label>
                                <Select name="software" defaultValue="anydesk">
                                    <SelectTrigger className="h-14 bg-background/50 border-white/5 rounded-2xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-white/10">
                                        <SelectItem value="anydesk" className="font-bold uppercase text-[10px]">AnyDesk (Recommandé)</SelectItem>
                                        <SelectItem value="teamviewer" className="font-bold uppercase text-[10px]">TeamViewer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Identifiant / Adresse ID</Label>
                                <Input name="remoteId" placeholder="Ex: 123 456 789" required className="h-14 bg-background/50 border-white/5 rounded-2xl font-mono text-xl tracking-widest text-accent text-center" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Nature du Problème</Label>
                                <Textarea name="description" placeholder="Ex: Erreur installation driver, lenteur système..." required className="min-h-[120px] bg-background/50 border-white/5 rounded-2xl text-sm" />
                            </div>
                        </div>
                        <div className="pt-8">
                            <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Lancer l'Alerte Expert DKS"}
                            </Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default withAuth(RemoteSupportPage);
