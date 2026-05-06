"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
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
    ShieldAlert,
    Zap,
    Cpu,
    Package,
    PlusCircle,
    CheckCircle2,
    Trash2,
    Receipt,
    FileText,
    QrCode
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, query, orderBy, onSnapshot, increment } from 'firebase/firestore';
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
    SheetFooter,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { SupportMessage, UsedPart, Product } from '@/lib/types';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
    const [isPartsSheetOpen, setIsPartsSheetOpen] = useState(false);
    const [isBillingDialogOpen, setIsBillingDialogOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [partSearch, setPartSearch] = useState("");
    const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
    const [usedParts, setUsedParts] = useState<UsedPart[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [laborCost, setLaborCost] = useState("15");
    const [ticketImage, setTicketImage] = useState<string | null>(null);
    const [chatImage, setChatImage] = useState<string | null>(null);
    
    const isGeneratingInvoiceRef = useRef(false);
    const invoiceRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const ticketFileInputRef = useRef<HTMLInputElement>(null);
    const chatFileInputRef = useRef<HTMLInputElement>(null);

    const ticketsQuery = useMemoFirebase(() => {
        return query(collection(db, "supportTickets"), orderBy("updatedAt", "desc"));
    }, []);

    const { data: tickets, isLoading } = useCollection(ticketsQuery);

    const productsQuery = useMemoFirebase(() => {
        return query(collection(db, "products"), orderBy("name", "asc"));
    }, []);
    const { data: products } = useCollection<Product>(productsQuery);

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
            const unsubscribeMsg = onSnapshot(q, (snapshot) => {
                setChatMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SupportMessage[]);
                setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 100);
            });

            const partsRef = collection(db, "supportTickets", selectedTicket.id, "usedParts");
            const unsubscribeParts = onSnapshot(partsRef, (snapshot) => {
                setUsedParts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UsedPart[]);
            });
            
            return () => {
                unsubscribeMsg();
                unsubscribeParts();
            };
        }
    }, [isChatOpen, selectedTicket]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'ticket' | 'chat') => {
        const file = e.target.files?.[0];
        if (!file) return;
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
            toast({ title: "Statut mis à jour" });
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); }
    };

    const handleAddPart = async (product: Product) => {
        if (!selectedTicket || product.stockQuantity <= 0) return;
        try {
            await addDoc(collection(db, "supportTickets", selectedTicket.id, "usedParts"), {
                productId: product.id,
                name: product.name,
                quantity: 1,
                unitPrice: product.sellingPrice,
                createdAt: serverTimestamp()
            });
            await updateDoc(doc(db, "products", product.id), { stockQuantity: increment(-1) });
            toast({ title: "Pièce ajoutée" });
        } catch (error) { toast({ title: "Erreur Stock", variant: "destructive" }); }
    };

    const handleFinalBilling = async () => {
        if (!selectedTicket) return;
        isGeneratingInvoiceRef.current = true;

        const partsTotal = usedParts.reduce((acc, p) => acc + (p.unitPrice * p.quantity), 0);
        const labor = parseFloat(laborCost);
        const grandTotal = partsTotal + labor;

        try {
            await addDoc(collection(db, "orders"), {
                userId: selectedTicket.userId,
                customerName: selectedTicket.customerName,
                items: [
                    { name: `Main d'œuvre SAV: ${selectedTicket.productName}`, quantity: 1, price: labor },
                    ...usedParts.map(p => ({ name: `Pièce: ${p.name}`, quantity: p.quantity, price: p.unitPrice }))
                ],
                total: grandTotal,
                status: "pending_payment",
                paymentMethod: "CASH",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                source: 'sav_repair',
                sourceId: selectedTicket.id
            });

            await updateDoc(doc(db, "supportTickets", selectedTicket.id), { status: 'completed', updatedAt: serverTimestamp() });

            setTimeout(async () => {
                if (invoiceRef.current) {
                    const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
                    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
                    pdf.save(`FACTURE_SAV_DKS_${selectedTicket.id.substring(0, 8).toUpperCase()}.pdf`);
                }
                toast({ title: "Clôture réussie" });
                setIsBillingDialogOpen(false);
                setIsChatOpen(false);
                isGeneratingInvoiceRef.current = false;
            }, 500);
        } catch (error) {
            toast({ title: "Erreur Facturation", variant: "destructive" });
            isGeneratingInvoiceRef.current = false;
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

    const filteredParts = useMemo(() => {
        if (!products) return [];
        return products.filter(p => p.name.toLowerCase().includes(partSearch.toLowerCase()));
    }, [products, partSearch]);

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

    const filteredTickets = (tickets || [])
        .filter(t => isStaff || t.userId === user?.uid)
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
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Plateforme Technique Certifiée Bunia</p>
                        </div>
                    </div>
                    
                    {!isStaff && (
                        <Button onClick={() => setIsSheetOpen(true)} className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl">
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
                    ) : filteredTickets.length > 0 ? (
                        filteredTickets.map((ticket) => (
                            <Card key={ticket.id} className={cn(
                                "glossy-card border-none rounded-[2.5rem] overflow-hidden group transition-all relative",
                                ticket.subscriptionId && "border-l-4 border-l-red-500 bg-red-500/[0.02]"
                            )}>
                                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-accent shrink-0 overflow-hidden">
                                        {ticket.imageUrl ? <img src={ticket.imageUrl} className="w-full h-full object-cover" alt="Ticket" /> : <Wrench size={28} />}
                                    </div>
                                    <div className="flex-1 space-y-3 text-center md:text-left">
                                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                                            <h3 className="text-xl font-black uppercase italic tracking-tight">{ticket.productName}</h3>
                                            {getStatusBadge(ticket.status)}
                                        </div>
                                        <p className="text-sm text-white/70 italic max-w-2xl line-clamp-2">" {ticket.issueDescription} "</p>
                                        <div className="flex items-center justify-center md:justify-start gap-5 text-[9px] font-black uppercase italic text-muted-foreground/40">
                                            <span className="flex items-center gap-2"><UserIcon size={12} className="text-accent" /> {ticket.customerName}</span>
                                            <span className="flex items-center gap-2"><Clock size={12} /> {ticket.createdAt?.toDate?.().toLocaleDateString('fr-FR') || 'Récemment'}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 shrink-0 min-w-[220px]">
                                        <Button variant="outline" className="rounded-xl border-accent/20 text-accent hover:bg-accent hover:text-black gap-2 h-12 font-black uppercase italic text-[10px]" onClick={() => { setSelectedTicket(ticket); setIsChatOpen(true); }}>
                                            <MessageCircle size={16} /> Entrer en Chat Live
                                        </Button>
                                        {isStaff && (
                                            <Select value={ticket.status} onValueChange={(val) => updateTicketStatus(ticket.id, val, ticket.userId)}>
                                                <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl font-black uppercase italic text-[10px]"><SelectValue placeholder="Statut Tech" /></SelectTrigger>
                                                <SelectContent className="bg-card border-white/10">
                                                    <SelectItem value="pending">Attente</SelectItem>
                                                    <SelectItem value="diagnosing">Diagnostic</SelectItem>
                                                    <SelectItem value="repairing">Réparation</SelectItem>
                                                    <SelectItem value="ready">Prêt Retrait</SelectItem>
                                                    <SelectItem value="completed">Terminé</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                            <BadgeAlert size={80} strokeWidth={1} /><p className="text-xl font-black uppercase italic tracking-tighter">Aucun dossier SAV</p>
                        </div>
                    )}
                </div>
            </main>

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-xl flex flex-col p-0">
                    <SheetHeader className="p-8 bg-primary/10 border-b border-white/5">
                        <SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">Ouvrir un Dossier SAV</SheetTitle>
                    </SheetHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 p-8 space-y-8 overflow-y-auto">
                        <div className="space-y-6">
                            <FormField control={form.control} name="productName" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60">Matériel & Modèle</FormLabel><FormControl><Input {...field} className="h-14 bg-background/50 border-white/5 rounded-2xl" /></FormControl><FormMessage className="text-[10px]" /></FormItem>
                            )} />
                            <FormField control={form.control} name="priority" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60">Priorité</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="h-14 bg-background/50 border-white/5 rounded-2xl"><SelectValue /></SelectTrigger></FormControl><SelectContent className="bg-card border-white/10"><SelectItem value="low">Standard</SelectItem><SelectItem value="medium">Important</SelectItem><SelectItem value="high">Urgent</SelectItem></SelectContent></Select><FormMessage className="text-[10px]" /></FormItem>
                            )} />
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60">Description</FormLabel><FormControl><Textarea {...field} className="min-h-[120px] bg-background/50 border-white/5 rounded-2xl" /></FormControl><FormMessage className="text-[10px]" /></FormItem>
                            )} />
                        </div>
                        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full h-16 bg-primary text-white font-black uppercase italic rounded-2xl text-lg">
                            {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : "Soumettre aux Experts DKS"}
                        </Button>
                      </form>
                    </Form>
                </SheetContent>
            </Sheet>

            <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                <DialogContent className="glossy-card border-none rounded-[2.5rem] sm:max-w-2xl h-[80vh] flex flex-col p-0 overflow-hidden">
                    <div className="bg-accent/10 p-6 border-b border-white/5 flex justify-between items-center">
                        <div className="flex items-center gap-4"><MessageCircle className="text-accent" /><h3 className="font-black uppercase italic">Support Expert</h3></div>
                        {isStaff && <Button onClick={() => setIsBillingDialogOpen(true)} className="bg-green-500 text-white h-10 rounded-xl text-[9px] uppercase font-black">Facturer & Clôturer</Button>}
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/40" ref={scrollRef}>
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={cn("flex flex-col", msg.senderId === user?.uid ? "items-end" : "items-start")}>
                                <div className={cn("max-w-[85%] p-4 rounded-2xl text-sm shadow-xl", msg.senderId === user?.uid ? "bg-accent text-black font-bold" : "bg-white/5 text-white")}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-6 bg-black/60 border-t border-white/5 flex gap-3">
                        <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Message technique..." className="h-14 bg-background/50 border-white/10 rounded-2xl focus:border-accent" />
                        <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl bg-accent text-black"><Send size={22}/></Button>
                    </form>
                </DialogContent>
            </Dialog>

            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {selectedTicket && (
                    <div ref={invoiceRef} className="bg-white text-black p-16 w-[800px] font-sans">
                        <header className="flex justify-between items-start border-b-4 border-black pb-10 mb-12">
                            <div className="space-y-4"><div className="bg-black text-white px-6 py-2 inline-block font-black text-3xl italic tracking-tighter">DKS SAV</div><p className="text-sm font-bold uppercase tracking-widest text-gray-500">Expertise & Réparation • Bunia</p></div>
                            <div className="text-right"><h2 className="text-5xl font-black uppercase italic tracking-tighter mb-2">FACTURE</h2><p className="text-lg font-bold">{new Date().toLocaleDateString('fr-FR')}</p></div>
                        </header>
                        <div className="grid grid-cols-2 gap-20 mb-12">
                            <div><h3 className="text-[10px] font-black uppercase text-gray-400 border-b pb-2 mb-4">Client</h3><p className="text-xl font-black uppercase italic">{selectedTicket.customerName}</p></div>
                            <div className="text-right"><p className="text-sm font-bold">TOTAL À RÉGLER</p><p className="text-4xl font-black tracking-tighter">${(parseFloat(laborCost) + usedParts.reduce((acc, p) => acc + (p.unitPrice * p.quantity), 0)).toFixed(2)}</p></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default withAuth(SupportPage);