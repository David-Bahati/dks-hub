
"use client";

import { useState, useRef } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    FileText, 
    Plus, 
    ArrowLeft, 
    Loader2, 
    Search, 
    Download, 
    Printer, 
    CheckCircle2, 
    XCircle,
    Send,
    User,
    Calendar,
    ShoppingCart,
    Trash2,
    Zap,
    QrCode
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, orderBy, updateDoc, doc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';

function QuotesManagementPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Create Quote States
    const [quoteItems, setQuoteItems] = useState<any[]>([]);
    const [selectedOrderForPDF, setSelectedOrderForPDF] = useState<any | null>(null);
    const [isGeneratingPDF, setIsGeneratingCert] = useState(false);
    const quoteRef = useRef<HTMLDivElement>(null);

    const quotesQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        const role = user.role?.toLowerCase();
        const isStaff = role === 'admin' || role === 'seller' || role === 'cashier';
        
        if (isStaff) return query(collection(db, "quotes"), orderBy("createdAt", "desc"));
        return query(collection(db, "quotes"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    }, [user?.uid, user?.role]);

    const { data: quotes, isLoading } = useCollection(quotesQuery);

    const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

    const handleAddItem = () => {
        setQuoteItems([...quoteItems, { name: "", quantity: 1, price: 0 }]);
    };

    const removeItem = (index: number) => {
        setQuoteItems(quoteItems.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...quoteItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setQuoteItems(newItems);
    };

    const handleSubmitQuote = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (quoteItems.length === 0) {
            toast({ title: "Devis vide", description: "Ajoutez au moins un article.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const total = quoteItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        try {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 15); // Valid 15 days

            const quoteData = {
                userId: formData.get('userId') || user?.uid, // Can be for someone else if staff
                customerName: formData.get('customerName'),
                businessName: formData.get('businessName'),
                items: quoteItems,
                total: total,
                status: 'sent',
                expiryDate: expiry.toISOString(),
                notes: formData.get('notes'),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await addDoc(collection(db, "quotes"), quoteData);
            
            toast({ title: "Devis créé", description: "Le document est prêt à être exporté." });
            setIsSheetOpen(false);
            setQuoteItems([]);
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadQuote = async (quote: any) => {
        setSelectedOrderForPDF(quote);
        setTimeout(async () => {
            if (!quoteRef.current) return;
            setIsGeneratingCert(true);
            try {
                const canvas = await html2canvas(quoteRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
                pdf.save(`DEVIS_DKS_${quote.id.substring(0, 8).toUpperCase()}.pdf`);
                toast({ title: "PDF Généré", description: "Le devis a été téléchargé." });
            } catch (error) {
                toast({ title: "Erreur PDF", variant: "destructive" });
            } finally {
                setIsGeneratingCert(false);
                setSelectedOrderForPDF(null);
            }
        }, 500);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sent': return <Badge className="bg-blue-500/10 text-blue-400 border-none uppercase text-[9px] font-black">Proposition Envoyée</Badge>;
            case 'approved': return <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[9px] font-black">Approuvé</Badge>;
            case 'rejected': return <Badge className="bg-destructive/10 text-destructive border-none uppercase text-[9px] font-black">Refusé</Badge>;
            case 'expired': return <Badge className="bg-white/5 text-muted-foreground border-none uppercase text-[9px] font-black">Expiré</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

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
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">DEVIS <span className="text-accent">PROFESSIONNELS</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Édition de propositions techniques & financières</p>
                        </div>
                    </div>
                    {isStaff && (
                        <Button onClick={() => setIsSheetOpen(true)} className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl">
                            <Plus size={20} /> Nouveau Devis Pro
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                    ) : quotes && quotes.length > 0 ? (
                        quotes.map((quote) => (
                            <Card key={quote.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group">
                                <CardContent className="p-8 flex flex-col lg:flex-row items-center gap-10">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                                        <FileText className="text-accent" size={28} />
                                    </div>
                                    
                                    <div className="flex-1 space-y-3 text-center md:text-left">
                                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                                            <h3 className="text-xl font-black uppercase italic tracking-tight">{quote.businessName || quote.customerName}</h3>
                                            {getStatusBadge(quote.status)}
                                        </div>
                                        <div className="flex items-center justify-center md:justify-start gap-5 text-[9px] font-black uppercase italic text-muted-foreground/40 tracking-widest">
                                            <span className="flex items-center gap-2"><User size={12} className="text-accent" /> {quote.customerName}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-2"><Calendar size={12} /> Expire: {new Date(quote.expiryDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 shrink-0">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Montant Total</p>
                                            <p className="text-2xl font-black text-white">${quote.total.toFixed(2)}</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button 
                                                variant="outline" 
                                                className="rounded-xl h-11 border-white/10 hover:bg-accent hover:text-black gap-2 font-black uppercase italic text-[10px]"
                                                onClick={() => handleDownloadQuote(quote)}
                                                disabled={isGeneratingPDF}
                                            >
                                                {isGeneratingPDF ? <Loader2 className="animate-spin h-3 w-3" /> : <Download size={14} />} Télécharger PDF
                                            </Button>
                                            {!isStaff && quote.status === 'sent' && (
                                                <Button className="bg-green-500 hover:bg-green-600 text-white rounded-xl h-10 font-black uppercase text-[9px]">
                                                    Approuver & Commander
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                            <FileText size={80} strokeWidth={1} />
                            <p className="text-xl font-black uppercase italic tracking-tighter">Aucun devis en cours</p>
                        </div>
                    )}
                </div>
            </main>

            {/* CREATE QUOTE SHEET */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-2xl flex flex-col p-0">
                    <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">Éditeur de Devis Elite</SheetTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Proposition Technologique Officielle</p>
                    </SheetHeader>
                    
                    <form onSubmit={handleSubmitQuote} className="flex-1 p-8 space-y-10 overflow-y-auto custom-scrollbar">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Client / Entreprise</Label>
                                    <Input name="businessName" placeholder="Ex: RawBank Bunia" required className="h-12 bg-background/50 border-white/5 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Contact</Label>
                                    <Input name="customerName" placeholder="Nom du responsable" required className="h-12 bg-background/50 border-white/5 rounded-xl" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Lignes de Devis</Label>
                                    <Button type="button" size="sm" variant="ghost" onClick={handleAddItem} className="h-8 bg-accent/10 text-accent hover:bg-accent hover:text-black rounded-lg text-[9px] font-black uppercase italic gap-2">
                                        <Plus size={12} /> Ajouter une ligne
                                    </Button>
                                </div>
                                
                                <div className="space-y-3">
                                    {quoteItems.map((item, index) => (
                                        <div key={index} className="flex gap-3 animate-in fade-in slide-in-from-right-2">
                                            <Input 
                                                placeholder="Description (ex: Switch UniFi 24 ports)" 
                                                className="flex-1 h-11 bg-background/50 border-white/5 rounded-xl text-xs"
                                                value={item.name}
                                                onChange={(e) => updateItem(index, 'name', e.target.value)}
                                            />
                                            <Input 
                                                type="number" 
                                                placeholder="Qté" 
                                                className="w-20 h-11 bg-background/50 border-white/5 rounded-xl text-xs text-center"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                            />
                                            <Input 
                                                type="number" 
                                                placeholder="Prix $" 
                                                className="w-24 h-11 bg-background/50 border-white/5 rounded-xl text-xs text-right font-bold text-accent"
                                                value={item.price}
                                                onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value))}
                                            />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-11 w-11 text-destructive hover:bg-destructive/10"><Trash2 size={16}/></Button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Notes d'Expertise</Label>
                                <Textarea name="notes" placeholder="Garanties, délais d'installation, conditions spécifiques..." className="min-h-[100px] bg-background/50 border-white/5 rounded-xl text-xs italic" />
                            </div>
                        </div>

                        <div className="p-6 bg-accent/5 rounded-3xl border border-accent/20 flex justify-between items-center">
                            <span className="text-xs font-black uppercase italic">Total de la Proposition</span>
                            <span className="text-3xl font-black text-accent">${quoteItems.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}</span>
                        </div>

                        <div className="pt-6">
                            <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20 text-lg">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send className="mr-2" size={20} /> Valider & Envoyer la Proposition</>}
                            </Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>

            {/* QUOTE PDF TEMPLATE (HIDDEN) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {selectedOrderForPDF && (
                    <div ref={quoteRef} className="bg-white text-black p-16 w-[800px] font-sans">
                        <header className="flex justify-between items-start border-b-4 border-black pb-10 mb-12">
                            <div className="space-y-4">
                                <div className="bg-black text-white px-6 py-2 inline-block font-black text-3xl italic tracking-tighter">DKS SOLUTIONS</div>
                                <div className="text-sm font-bold uppercase tracking-widest text-gray-500">Expertise & Infrastructure</div>
                                <div className="text-[11px] leading-relaxed mt-4 font-medium">
                                    <p>Immeuble Bahati, Boulevard de la Libération</p>
                                    <p>Bunia, Province de l'Ituri, RDC</p>
                                    <p>Tél: +243 823 038 945</p>
                                    <p>Email: business@dks-shop.com</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-2">DEVIS PRO</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Réf: PRO-#{selectedOrderForPDF.id.substring(0, 10).toUpperCase()}</p>
                                <div className="mt-8">
                                    <p className="text-[10px] font-black uppercase text-gray-400">Date d'émission</p>
                                    <p className="text-lg font-bold">{new Date().toLocaleDateString('fr-FR')}</p>
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-2 gap-20 mb-12">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase text-gray-400 border-b pb-2 tracking-widest">Client / Institution</h3>
                                <div className="space-y-1">
                                    <p className="text-xl font-black uppercase italic">{selectedOrderForPDF.businessName}</p>
                                    <p className="text-sm text-gray-600">À l'attention de: {selectedOrderForPDF.customerName}</p>
                                    <p className="text-xs font-medium text-gray-400 mt-2">Validité: 15 jours</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase text-gray-400 border-b pb-2 tracking-widest">Résumé</h3>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold">Statut : <span className="uppercase text-blue-600">Offre Commerciale</span></p>
                                    <p className="text-xs leading-relaxed text-gray-500">Cette proposition inclut le matériel, la configuration et la garantie DKS.</p>
                                </div>
                            </div>
                        </div>

                        <table className="w-full mb-12">
                            <thead>
                                <tr className="bg-gray-100 text-[10px] font-black uppercase tracking-widest">
                                    <th className="text-left p-4">Désignation du Matériel / Service</th>
                                    <th className="text-center p-4">Qté</th>
                                    <th className="text-right p-4">Prix Unitaire</th>
                                    <th className="text-right p-4">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {selectedOrderForPDF.items?.map((item: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-100">
                                        <td className="p-4 font-bold uppercase italic">{item.name}</td>
                                        <td className="p-4 text-center font-bold">{item.quantity}</td>
                                        <td className="p-4 text-right font-medium">${item.price?.toFixed(2)}</td>
                                        <td className="p-4 text-right font-black">${(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-end">
                            <div className="w-80 space-y-4">
                                <div className="flex justify-between items-end border-b-2 border-black pb-4">
                                    <span className="text-lg font-black uppercase italic">TOTAL ESTIMÉ</span>
                                    <span className="text-4xl font-black tracking-tighter">${selectedOrderForPDF.total?.toFixed(2)}</span>
                                </div>
                                {selectedOrderForPDF.notes && (
                                    <div className="pt-4">
                                        <p className="text-[9px] font-black uppercase text-gray-400 mb-2">Conditions Particulières</p>
                                        <p className="text-[10px] italic text-gray-600 leading-relaxed">{selectedOrderForPDF.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <footer className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-6">
                                <QrCode size={60} className="opacity-20" />
                                <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed max-w-[250px]">
                                    Document contractuel valable pour la durée indiquée. <br />
                                    La signature du devis vaut acceptation des conditions générales de vente DKS.
                                </p>
                            </div>
                            <div className="text-right space-y-4">
                                <div className="h-20 w-40 border-2 border-gray-100 rounded-lg flex items-center justify-center italic text-gray-300 text-[10px] uppercase font-black">Cachet & Signature</div>
                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Solutions Business Hub v3.0</p>
                            </div>
                        </footer>
                    </div>
                )}
            </div>
        </div>
    );
}

export default withAuth(QuotesManagementPage);
