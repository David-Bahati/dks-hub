
"use client";

import { useState, useEffect, useRef } from 'react';
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
    ExternalLink,
    Send,
    User as UserIcon,
    ShieldCheck,
    Image as ImageIcon,
    Upload,
    X,
    Maximize2
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, orderBy, onSnapshot, where } from 'firebase/firestore';
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
import { cn } from '@/lib/utils';
import { SupportMessage } from '@/lib/types';

function SupportPage() {
    const { user } = userAuth();
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [ticketImage, setTicketImage] = useState<string | null>(null);
    const [chatImage, setChatImage] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const ticketFileInputRef = useRef<HTMLInputElement>(null);
    const chatFileInputRef = useRef<HTMLInputElement>(null);

    const ticketsQuery = useMemoFirebase(() => {
        const baseRef = collection(db, "supportTickets");
        return query(baseRef, orderBy("updatedAt", "desc"));
    }, []);

    const { data: tickets, isLoading } = useCollection(ticketsQuery);

    const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

    useEffect(() => {
        if (isChatOpen && selectedTicket) {
            const messagesRef = collection(db, "supportTickets", selectedTicket.id, "messages");
            const q = query(messagesRef, orderBy("createdAt", "asc"));
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SupportMessage[];
                setChatMessages(messages);
                setTimeout(() => {
                    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }, 100);
            });
            
            return () => unsubscribe();
        }
    }, [isChatOpen, selectedTicket]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'ticket' | 'chat') => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toast({ title: "Fichier trop lourd", description: "La taille maximale est de 2Mo.", variant: "destructive" });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (target === 'ticket') setTicketImage(reader.result as string);
            else setChatImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            const ticketData = {
                userId: user?.uid,
                customerName: user?.name || "Client DKS",
                productName: formData.get('productName'),
                issueDescription: formData.get('description'),
                status: 'pending',
                priority: formData.get('priority'),
                imageUrl: ticketImage,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await addDoc(collection(db, "supportTickets"), ticketData);

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
            setTicketImage(null);
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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !chatImage) || !selectedTicket || !user) return;

        const text = newMessage.trim();
        const img = chatImage;
        setNewMessage("");
        setChatImage(null);

        try {
            const messagesRef = collection(db, "supportTickets", selectedTicket.id, "messages");
            await addDoc(messagesRef, {
                senderId: user.uid,
                senderName: user.name,
                senderRole: user.role,
                text: text,
                imageUrl: img,
                createdAt: serverTimestamp()
            });

            await updateDoc(doc(db, "supportTickets", selectedTicket.id), {
                updatedAt: serverTimestamp()
            });

            const recipientId = isStaff ? selectedTicket.userId : 'staff';
            await addDoc(collection(db, "notifications"), {
                userId: recipientId,
                title: "Nouveau message Support",
                message: img ? `${user.name} a envoyé une image.` : `${user.name} : ${text.substring(0, 50)}`,
                type: 'info',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/support'
            });

        } catch (error) {
            console.error(error);
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

    // Helper to get only user's tickets if not staff
    const filteredTickets = tickets?.filter(t => isStaff || t.userId === user?.uid)
        .filter(t => t.customerName?.toLowerCase().includes(search.toLowerCase()) || t.productName?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
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

                <div className="mb-10 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input 
                        placeholder="Rechercher un ticket par nom de client ou produit..." 
                        className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl focus:border-accent"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                    ) : filteredTickets && filteredTickets.length > 0 ? (
                        filteredTickets.map((ticket) => (
                            <Card key={ticket.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group">
                                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                                    <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shrink-0 overflow-hidden relative">
                                        {ticket.imageUrl ? (
                                            <img src={ticket.imageUrl} className="w-full h-full object-cover" alt="Panne" />
                                        ) : (
                                            <Wrench size={28} />
                                        )}
                                        {ticket.imageUrl && <div className="absolute inset-0 bg-black/20" />}
                                    </div>
                                    
                                    <div className="flex-1 space-y-2 text-center md:text-left">
                                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                                            <h3 className="text-xl font-black uppercase italic tracking-tight">{ticket.productName}</h3>
                                            {getStatusBadge(ticket.status)}
                                            <Badge variant="outline" className="border-white/10 text-[9px] uppercase font-bold opacity-40">#{ticket.id.substring(0, 8)}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground max-w-2xl">{ticket.issueDescription}</p>
                                        <div className="flex items-center justify-center md:justify-start gap-4 text-[10px] font-black uppercase italic text-muted-foreground/40">
                                            <span className="flex items-center gap-1"><UserIcon size={10} /> Client: {ticket.customerName}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><Clock size={10} /> Ouvert le {ticket.createdAt?.toDate?.().toLocaleDateString() || 'Récemment'}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 shrink-0 min-w-[200px]">
                                        <Button 
                                            variant="outline" 
                                            className="rounded-xl border-accent/20 text-accent hover:bg-accent/10 gap-2 h-12 font-black uppercase italic text-[10px]"
                                            onClick={() => {
                                                setSelectedTicket(ticket);
                                                setIsChatOpen(true);
                                            }}
                                        >
                                            <MessageCircle size={14} /> Chat Live
                                        </Button>
                                        {isStaff && (
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
                                        )}
                                        {!isStaff && (
                                            <Button variant="outline" className="rounded-xl border-green-500/20 text-green-500 hover:bg-green-500/10 gap-2 h-12 font-black uppercase italic text-[10px]" asChild>
                                                <a href={`https://wa.me/243823038945?text=Bonjour,%20je%20vous%20contacte%20pour%20mon%20ticket%20SAV%20#${ticket.id.substring(0, 8).toUpperCase()}`} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink size={14} /> WhatsApp Aide
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

            {/* Modal de création de ticket avec Upload Photo */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="glossy-card border-none rounded-[2.5rem] sm:max-w-2xl overflow-hidden p-0">
                    <div className="bg-primary p-8 text-white">
                         <DialogHeader>
                            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Ouvrir un Dossier SAV</DialogTitle>
                            <p className="text-primary-foreground/80 font-light italic">Expertise technique certifiée Bunia.</p>
                        </DialogHeader>
                    </div>
                    
                    <form onSubmit={handleCreateTicket} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Matériel concerné</Label>
                                    <Input name="productName" placeholder="Ex: Laptop ASUS ROG, RTX 4070..." required className="h-14 bg-background/50 border-white/10 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Niveau d'Urgence</Label>
                                    <Select name="priority" defaultValue="medium">
                                        <SelectTrigger className="h-14 bg-background/50 border-white/10 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-white/10">
                                            <SelectItem value="low">Standard</SelectItem>
                                            <SelectItem value="medium">Important</SelectItem>
                                            <SelectItem value="high">Urgent</SelectItem>
                                            <SelectItem value="urgent">Critique (Bloquant)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Description du problème</Label>
                                    <Textarea name="description" placeholder="Détaillez le souci technique rencontré..." required className="min-h-[120px] bg-background/50 border-white/10 rounded-xl" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Photo de la panne (Optionnel)</Label>
                                <div 
                                    onClick={() => ticketFileInputRef.current?.click()}
                                    className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-accent/50 bg-background/50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group"
                                >
                                    {ticketImage ? (
                                        <>
                                            <img src={ticketImage} className="w-full h-full object-cover" alt="Preview" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Upload className="text-white" />
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="destructive" 
                                                size="icon" 
                                                className="absolute top-2 right-2 h-8 w-8 rounded-full z-20"
                                                onClick={(e) => { e.stopPropagation(); setTicketImage(null); }}
                                            >
                                                <X size={14} />
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon className="h-10 w-10 text-muted-foreground mb-2 group-hover:text-accent transition-colors" />
                                            <span className="text-[10px] font-black uppercase text-muted-foreground group-hover:text-accent">Cliquez pour joindre une photo</span>
                                        </>
                                    )}
                                </div>
                                <input type="file" ref={ticketFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'ticket')} />
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="font-bold uppercase text-[10px]">Annuler</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-accent text-black font-black uppercase italic rounded-xl px-10 h-14 shadow-xl flex-1">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Envoyer ma demande technique"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal de Chat Live avec Upload Photo */}
            <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                <DialogContent className="glossy-card border-none rounded-[2.5rem] sm:max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden">
                    <div className="bg-accent/10 p-6 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                                <MessageCircle size={24} />
                            </div>
                            <div>
                                <h3 className="font-black uppercase italic tracking-tighter">Support Direct : {selectedTicket?.productName}</h3>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">ID Ticket: #{selectedTicket?.id.substring(0, 8)}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="rounded-full hover:bg-white/5 text-white/40"><X size={20}/></Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/20" ref={scrollRef}>
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 text-xs text-muted-foreground italic mb-10 relative">
                            <p className="font-black uppercase text-[10px] mb-3 text-accent tracking-widest">Résumé du problème :</p>
                            "{selectedTicket?.issueDescription}"
                            {selectedTicket?.imageUrl && (
                                <div className="mt-4 relative group w-fit">
                                    <img src={selectedTicket.imageUrl} className="rounded-xl max-h-48 object-cover cursor-pointer hover:opacity-80 transition-opacity" alt="Panne initiale" onClick={() => window.open(selectedTicket.imageUrl)} />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 p-2 rounded-lg pointer-events-none">
                                        <Maximize2 size={12} className="text-white" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {chatMessages.length === 0 && (
                            <div className="text-center py-20 opacity-20 italic text-sm">
                                <MessageCircle size={48} className="mx-auto mb-4" />
                                <p>Aucun message. Entrez en contact avec l'expert DKS.</p>
                            </div>
                        )}

                        {chatMessages.map((msg) => {
                            const isMe = msg.senderId === user?.uid;
                            return (
                                <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                    <div className={cn(
                                        "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed overflow-hidden shadow-lg",
                                        isMe ? "bg-accent text-black rounded-tr-none font-medium" : "bg-white/5 text-white border border-white/5 rounded-tl-none"
                                    )}>
                                        {msg.imageUrl && (
                                            <div className="mb-3 relative group">
                                                <img src={msg.imageUrl} className="rounded-lg max-w-full cursor-pointer hover:brightness-90 transition-all" alt="Support" onClick={() => window.open(msg.imageUrl)} />
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Maximize2 size={12} className="text-white bg-black/40 p-1 rounded" />
                                                </div>
                                            </div>
                                        )}
                                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5 px-2">
                                        <span className={cn("text-[8px] font-black uppercase tracking-widest", isMe ? 'text-accent/60' : 'opacity-30')}>
                                            {isMe ? 'Moi' : msg.senderName}
                                        </span>
                                        <span className="text-[8px] opacity-20">•</span>
                                        <span className="text-[8px] opacity-20">
                                            {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-6 bg-black/40 border-t border-white/5 flex flex-col gap-4">
                        {chatImage && (
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-accent shadow-lg animate-in zoom-in-95">
                                <img src={chatImage} className="w-full h-full object-cover" alt="To send" />
                                <button type="button" onClick={() => setChatImage(null)} className="absolute top-1.5 right-1.5 bg-black/60 rounded-full p-1 text-white hover:bg-destructive transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="icon" 
                                className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent shrink-0 transition-all"
                                onClick={() => chatFileInputRef.current?.click()}
                            >
                                <ImageIcon size={22} />
                            </Button>
                            <input type="file" ref={chatFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'chat')} />
                            
                            <Input 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Message technique ou photo..."
                                className="h-14 bg-background/50 border-white/10 rounded-2xl focus:border-accent text-sm"
                                disabled={isLoading}
                            />
                            <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-accent text-black shadow-xl shadow-accent/20 shrink-0 hover:scale-105 active:scale-95 transition-all">
                                <Send size={22} />
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function userAuth() {
    return useAuth();
}

export default withAuth(SupportPage);
