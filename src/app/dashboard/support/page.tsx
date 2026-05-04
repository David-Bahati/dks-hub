
"use client";

import { useState, useEffect, useRef } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Wrench, 
    Clock, 
    ArrowLeft, 
    Loader2, 
    Plus, 
    Search,
    MessageCircle,
    BadgeAlert,
    Send,
    User as UserIcon,
    Image as ImageIcon,
    Upload,
    X,
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle,
} from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { SupportMessage } from '@/lib/types';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const ticketSchema = z.object({
  productName: z.string().min(3, "Veuillez préciser le matériel (min 3 car.)"),
  priority: z.string().min(1, "Veuillez choisir une priorité"),
  description: z.string().min(10, "Décrivez votre panne plus précisément (min 10 car.)"),
});

function SupportPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [ticketImage, setTicketImage] = useState<string | null>(null);
    const [chatImage, setChatImage] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const ticketFileInputRef = useRef<HTMLInputElement>(null);
    const chatFileInputRef = useRef<HTMLInputElement>(null);

    const ticketsQuery = useMemoFirebase(() => {
        return query(collection(db, "supportTickets"), orderBy("updatedAt", "desc"));
    }, []);

    const { data: tickets, isLoading } = useCollection(ticketsQuery);

    const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

    const form = useForm<z.infer<typeof ticketSchema>>({
      resolver: zodResolver(ticketSchema),
      defaultValues: {
        productName: "",
        priority: "medium",
        description: "",
      },
    });

    useEffect(() => {
        if (isChatOpen && selectedTicket) {
            const messagesRef = collection(db, "supportTickets", selectedTicket.id, "messages");
            const q = query(messagesRef, orderBy("createdAt", "asc"));
            
            const unsubscribe = onSnapshot(q, (snapshot) => {
                setChatMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SupportMessage[]);
                setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 100);
            });
            
            return () => unsubscribe();
        }
    }, [isChatOpen, selectedTicket]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'ticket' | 'chat') => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toast({ title: "Fichier trop lourd", description: "Max 2Mo pour le Hub.", variant: "destructive" });
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            if (target === 'ticket') setTicketImage(reader.result as string);
            else setChatImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    async function onSubmit(values: z.infer<typeof ticketSchema>) {
      try {
          const ticketData = {
              ...values,
              userId: user?.uid,
              customerName: user?.name || "Client DKS",
              status: 'pending',
              imageUrl: ticketImage,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
          };

          await addDoc(collection(db, "supportTickets"), ticketData);
          await addDoc(collection(db, "notifications"), {
              userId: 'staff',
              title: "SAV: Nouveau Dossier",
              message: `${user?.name} a ouvert une demande pour ${values.productName}.`,
              type: 'warning',
              isRead: false,
              createdAt: serverTimestamp(),
              link: '/dashboard/support'
          });

          toast({ title: "Ticket ouvert", description: "Expertise technique DKS activée." });
          setTicketImage(null);
          setIsSheetOpen(false);
          form.reset();
      } catch (error) {
          toast({ title: "Erreur", description: "Impossible d'ouvrir le ticket.", variant: "destructive" });
      }
    }

    const updateTicketStatus = async (ticketId: string, newStatus: string, ticketUserId: string) => {
        try {
            await updateDoc(doc(db, "supportTickets", ticketId), { status: newStatus, updatedAt: serverTimestamp() });
            await addDoc(collection(db, "notifications"), {
                userId: ticketUserId,
                title: "Mise à jour SAV",
                message: `L'état de votre réparation est : ${newStatus.toUpperCase()}.`,
                type: 'info',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/support'
            });
            toast({ title: "Statut mis à jour" });
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !chatImage) || !selectedTicket || !user) return;

        const text = newMessage.trim();
        const img = chatImage;
        setNewMessage("");
        setChatImage(null);

        try {
            await addDoc(collection(db, "supportTickets", selectedTicket.id, "messages"), {
                senderId: user.uid,
                senderName: user.name,
                senderRole: user.role,
                text: text,
                imageUrl: img,
                createdAt: serverTimestamp()
            });
            await updateDoc(doc(db, "supportTickets", selectedTicket.id), { updatedAt: serverTimestamp() });
        } catch (e) { console.error(e); }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge className="bg-orange-500/10 text-orange-400 border-none uppercase text-[9px] font-black">Attente</Badge>;
            case 'diagnosing': return <Badge className="bg-blue-500/10 text-blue-400 border-none uppercase text-[9px] font-black">Diagnostic</Badge>;
            case 'repairing': return <Badge className="bg-purple-500/10 text-purple-400 border-none uppercase text-[9px] font-black">Réparation</Badge>;
            case 'ready': return <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[9px] font-black">Prêt</Badge>;
            case 'completed': return <Badge className="bg-white/5 text-muted-foreground border-none uppercase text-[9px] font-black">Clôturé</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const filteredTickets = tickets?.filter(t => isStaff || t.userId === user?.uid)
        .filter(t => t.customerName?.toLowerCase().includes(search.toLowerCase()) || t.productName?.toLowerCase().includes(search.toLowerCase()));

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
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Support & <span className="text-accent">SAV</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Plateforme Technique Certifiée Bunia</p>
                        </div>
                    </div>
                    
                    {!isStaff && (
                        <Button onClick={() => setIsSheetOpen(true)} className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl shadow-primary/10">
                            <Plus size={20} /> Ouvrir un dossier
                        </Button>
                    )}
                </div>

                <div className="mb-10 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input 
                        placeholder="Rechercher par client ou produit..." 
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
                            <Card key={ticket.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group transition-all">
                                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-accent shrink-0 overflow-hidden relative">
                                        {ticket.imageUrl ? <img src={ticket.imageUrl} className="w-full h-full object-cover" /> : <Wrench size={28} />}
                                    </div>
                                    
                                    <div className="flex-1 space-y-3 text-center md:text-left">
                                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                                            <h3 className="text-xl font-black uppercase italic tracking-tight">{ticket.productName}</h3>
                                            {getStatusBadge(ticket.status)}
                                            <Badge variant="outline" className="border-white/10 text-[9px] uppercase font-bold opacity-30 tracking-widest">#{ticket.id.substring(0, 8)}</Badge>
                                        </div>
                                        <p className="text-sm text-white/70 italic max-w-2xl line-clamp-2">" {ticket.issueDescription} "</p>
                                        <div className="flex items-center justify-center md:justify-start gap-5 text-[9px] font-black uppercase italic text-muted-foreground/40 tracking-widest">
                                            <span className="flex items-center gap-2"><UserIcon size={12} className="text-accent" /> {ticket.customerName}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-2"><Clock size={12} /> {ticket.createdAt?.toDate?.().toLocaleDateString() || 'Récemment'}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 shrink-0 min-w-[220px]">
                                        <Button 
                                            variant="outline" 
                                            className="rounded-xl border-accent/20 text-accent hover:bg-accent hover:text-black gap-2 h-12 font-black uppercase italic text-[10px] transition-all"
                                            onClick={() => { setSelectedTicket(ticket); setIsChatOpen(true); }}
                                        >
                                            <MessageCircle size={16} /> Entrer en Chat Live
                                        </Button>
                                        {isStaff && (
                                            <Select value={ticket.status} onValueChange={(val) => updateTicketStatus(ticket.id, val, ticket.userId)}>
                                                <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl font-black uppercase italic text-[10px]">
                                                    <SelectValue placeholder="Statut Tech" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-white/10">
                                                    <SelectItem value="pending" className="text-[10px] font-black uppercase">Attente</SelectItem>
                                                    <SelectItem value="diagnosing" className="text-[10px] font-black uppercase">Diagnostic</SelectItem>
                                                    <SelectItem value="repairing" className="text-[10px] font-black uppercase">Réparation</SelectItem>
                                                    <SelectItem value="ready" className="text-[10px] font-black uppercase text-green-400">Prêt Retrait</SelectItem>
                                                    <SelectItem value="completed" className="text-[10px] font-black uppercase opacity-40">Terminé</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                            <BadgeAlert size={80} strokeWidth={1} />
                            <p className="text-xl font-black uppercase italic tracking-tighter">Aucun dossier SAV</p>
                        </div>
                    )}
                </div>
            </main>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-xl flex flex-col p-0">
                    <SheetHeader className="p-8 bg-primary/10 border-b border-white/5">
                        <SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">Ouvrir un Dossier SAV</SheetTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Centre Expertise Bunia</p>
                    </SheetHeader>
                    
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 p-8 space-y-8 overflow-y-auto">
                        <div className="space-y-6">
                            <FormField
                              control={form.control}
                              name="productName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Matériel & Modèle</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Ex: Laptop Razer Blade 15, RTX 3080..." className="h-14 bg-background/50 border-white/5 rounded-2xl" />
                                  </FormControl>
                                  <FormMessage className="text-[10px]" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="priority"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Priorité Intervention</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-14 bg-background/50 border-white/5 rounded-2xl">
                                          <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-card border-white/10">
                                        <SelectItem value="low" className="text-[10px] font-black uppercase">Standard</SelectItem>
                                        <SelectItem value="medium" className="text-[10px] font-black uppercase">Important</SelectItem>
                                        <SelectItem value="high" className="text-[10px] font-black uppercase text-orange-400">Urgent</SelectItem>
                                        <SelectItem value="urgent" className="text-[10px] font-black uppercase text-red-500">Critique / Bloquant</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-[10px]" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Description de la panne</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} placeholder="Détaillez le problème technique..." className="min-h-[120px] bg-background/50 border-white/5 rounded-2xl" />
                                  </FormControl>
                                  <FormMessage className="text-[10px]" />
                                </FormItem>
                              )}
                            />
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Photo de l'état (Optionnel)</Label>
                                <div onClick={() => ticketFileInputRef.current?.click()} className="aspect-video rounded-3xl border-2 border-dashed border-white/10 hover:border-accent/50 bg-black/20 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group">
                                    {ticketImage ? (
                                        <>
                                            <img src={ticketImage} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Upload className="text-white" /></div>
                                            <button type="button" className="absolute top-4 right-4 bg-destructive text-white p-2 rounded-full" onClick={(e) => { e.stopPropagation(); setTicketImage(null); }}><X size={14} /></button>
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon className="h-12 w-12 text-muted-foreground mb-3 opacity-20" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Cliquer pour joindre une photo</span>
                                        </>
                                    )}
                                </div>
                                <input type="file" ref={ticketFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'ticket')} />
                            </div>
                        </div>
                        <div className="pt-8">
                            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full h-16 bg-primary text-white font-black uppercase italic rounded-2xl shadow-xl shadow-primary/20 text-lg">
                                {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Soumettre aux Experts DKS"}
                            </Button>
                        </div>
                      </form>
                    </Form>
                </SheetContent>
            </Sheet>

            {/* Chat Live Interface */}
            <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                <DialogContent className="glossy-card border-none rounded-[2.5rem] sm:max-w-2xl h-[85vh] flex flex-col p-0 overflow-hidden">
                    <div className="bg-accent/10 p-6 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                                <MessageCircle size={24} />
                            </div>
                            <div>
                                <h3 className="font-black uppercase italic tracking-tighter">Support Expert : {selectedTicket?.productName}</h3>
                                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest"># {selectedTicket?.id.substring(0, 8)}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="rounded-full hover:bg-white/5 text-white/40"><X size={20}/></Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/40" ref={scrollRef}>
                        {chatMessages.map((msg) => {
                            const isMe = msg.senderId === user?.uid;
                            return (
                                <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                    <div className={cn(
                                        "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-xl",
                                        isMe ? "bg-accent text-black rounded-tr-none font-bold" : "bg-white/5 text-white border border-white/5 rounded-tl-none"
                                    )}>
                                        {msg.imageUrl && (
                                            <div className="mb-3 relative group">
                                                <img src={msg.imageUrl} className="rounded-xl max-w-full cursor-pointer hover:brightness-90 transition-all" onClick={() => window.open(msg.imageUrl)} />
                                            </div>
                                        )}
                                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                                    </div>
                                    <span className="text-[8px] font-black uppercase opacity-20 mt-2 tracking-widest px-2">{isMe ? 'Moi' : msg.senderName} • {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}</span>
                                </div>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-6 bg-black/60 border-t border-white/5 space-y-4">
                        {chatImage && (
                            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-accent shadow-2xl animate-in zoom-in-95">
                                <img src={chatImage} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setChatImage(null)} className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white hover:bg-destructive"><X size={12}/></button>
                            </div>
                        )}
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent transition-all" onClick={() => chatFileInputRef.current?.click()}><ImageIcon size={22}/></Button>
                            <input type="file" ref={chatFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'chat')} />
                            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Message technique..." className="h-14 bg-background/50 border-white/10 rounded-2xl focus:border-accent font-medium" />
                            <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-accent text-black shadow-xl shadow-accent/20"><Send size={22}/></Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default withAuth(SupportPage);
