
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    MonitorSmartphone, 
    Loader2, 
    ArrowLeft, 
    Plus, 
    CheckCircle2, 
    XCircle, 
    ExternalLink, 
    Copy,
    Activity,
    Clock,
    Terminal,
    ShieldAlert
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

function RemoteSupportPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
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
                title: "URGENT: Demande Support à Distance",
                message: `${user?.name} demande une prise en main via ${formData.get('software')}.`,
                type: 'warning',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/remote'
            });

            toast({ title: "Demande envoyée", description: "Veuillez garder votre logiciel ouvert. Un expert va se connecter." });
            setIsModalOpen(false);
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateStatus = async (sessionId: string, newStatus: string, clientUserId: string) => {
        try {
            await updateDoc(doc(db, "remoteSessions", sessionId), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, "notifications"), {
                userId: clientUserId,
                title: "Statut Prise en Main",
                message: `L'expert DKS a mis à jour votre session : ${newStatus.toUpperCase()}.`,
                type: 'info',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/remote'
            });

            toast({ title: "Statut mis à jour" });
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge className="bg-orange-500/10 text-orange-400 border-none uppercase text-[9px] font-black animate-pulse">En attente</Badge>;
            case 'active': return <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[9px] font-black">Session Active</Badge>;
            case 'completed': return <Badge className="bg-white/5 text-muted-foreground border-none uppercase text-[9px] font-black">Terminé</Badge>;
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
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Support <span className="text-accent">À Distance</span></h1>
                            <p className="text-muted-foreground font-light mt-1">Résolution immédiate de vos soucis logiciels partout à Bunia.</p>
                        </div>
                    </div>
                    
                    {!isStaff && (
                        <Button onClick={() => setIsModalOpen(true)} className="bg-accent text-black hover:bg-accent/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-accent/20">
                            <MonitorSmartphone size={20} /> Nouvelle Session Directe
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
                                        <Activity className={session.status === 'active' ? 'text-green-400 animate-pulse' : 'text-slate-500'} size={28} />
                                    </div>
                                    
                                    <div className="flex-1 space-y-2 text-center md:text-left">
                                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                                            <h3 className="text-xl font-black uppercase italic tracking-tight">{session.customerName}</h3>
                                            {getStatusBadge(session.status)}
                                            <Badge variant="outline" className="border-white/10 text-[9px] uppercase font-bold text-accent">ID: {session.remoteId}</Badge>
                                        </div>
                                        <div className="flex items-center justify-center md:justify-start gap-4 text-[10px] font-black uppercase italic text-muted-foreground/40">
                                            <span className="flex items-center gap-2"><Terminal size={12} /> Logiciel: {session.software.toUpperCase()}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-2"><Clock size={12} /> Demandé le {session.createdAt?.toDate?.().toLocaleTimeString() || 'Récemment'}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2 italic">" {session.issueDescription} "</p>
                                    </div>

                                    <div className="flex flex-col gap-3 shrink-0 min-w-[220px]">
                                        {isStaff ? (
                                            <>
                                                <Button className="bg-primary text-white rounded-xl h-12 font-black uppercase italic text-[10px] gap-2 shadow-lg" onClick={() => updateStatus(session.id, 'active', session.userId)}>
                                                    <ExternalLink size={14} /> Lancer la Connexion
                                                </Button>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" className="flex-1 rounded-xl border-white/10 text-[9px] font-black uppercase h-10" onClick={() => updateStatus(session.id, 'completed', session.userId)}>
                                                        <CheckCircle2 size={12} className="mr-1" /> Fixé
                                                    </Button>
                                                    <Button variant="outline" className="flex-1 rounded-xl border-white/10 text-destructive/60 hover:text-destructive text-[9px] font-black h-10" onClick={() => updateStatus(session.id, 'cancelled', session.userId)}>
                                                        <XCircle size={12} className="mr-1" /> Annuler
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="p-4 bg-black/20 rounded-2xl border border-white/5 text-center">
                                                <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Votre accès expert</p>
                                                <p className="text-lg font-mono font-black text-accent tracking-widest">{session.remoteId}</p>
                                                <p className="text-[7px] font-bold uppercase text-white/40 mt-1">Gardez {session.software} ouvert</p>
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
                            <p className="text-xs max-w-xs leading-relaxed">Le support à distance permet une résolution rapide des problèmes logiciels sans déplacement.</p>
                        </div>
                    )}
                </div>

                <Card className="mt-12 bg-accent/5 border-accent/20 rounded-[2.5rem] p-8 flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                        <ShieldAlert size={24} />
                    </div>
                    <div>
                        <h4 className="font-black uppercase italic text-sm">Garantie de Sécurité DKS</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Nous ne nous connectons qu'avec votre autorisation. Vous pouvez couper la session à tout moment en fermant votre logiciel de prise en main.
                        </p>
                    </div>
                </Card>
            </main>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="glossy-card border-none rounded-[2.5rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Demander une Prise en Main</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateSession} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Logiciel Utilisé</Label>
                                <Select name="software" defaultValue="anydesk">
                                    <SelectTrigger className="h-14 bg-background/50 border-white/10 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-white/10">
                                        <SelectItem value="anydesk">AnyDesk</SelectItem>
                                        <SelectItem value="teamviewer">TeamViewer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Votre ID / Adresse</Label>
                                <Input name="remoteId" placeholder="Ex: 123 456 789" required className="h-14 bg-background/50 border-white/10 rounded-xl font-mono text-lg tracking-widest" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Problème rencontré</Label>
                            <Textarea name="description" placeholder="Décrivez brièvement ce que vous souhaitez que l'expert règle..." required className="min-h-[100px] bg-background/50 border-white/10 rounded-xl" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="font-bold uppercase text-[10px]">Annuler</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-accent text-black font-black uppercase italic rounded-xl px-10 h-14 shadow-xl flex-1">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Lancer l'alerte Expert"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default withAuth(RemoteSupportPage);
