
"use client";

import { useState, useRef, useMemo } from 'react';
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
    QrCode,
    ShieldCheck,
    Lock,
    PlusCircle,
    Minus,
    Building2,
    Briefcase
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, updateDoc, doc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
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
import { Product } from '@/lib/types';

function QuotesManagementPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Create Quote States
    const [customerName, setCustomerName] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [quoteItems, setQuoteItems] = useState<any[]>([]);
    const [productSearch, setProductSearch] = useState("");
    
    // PDF Generation States
    const [selectedQuoteForPDF, setSelectedQuoteForPDF] = useState<any | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const quoteRef = useRef<HTMLDivElement>(null);

    // Data Fetching
    const quotesQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        const role = user.role?.toLowerCase();
        const isStaff = role === 'admin' || role === 'seller' || role === 'cashier';
        
        if (isStaff) return query(collection(db, "quotes"), orderBy("createdAt", "desc"));
        return query(collection(db, "quotes"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    }, [user?.uid, user?.role]);

    const { data: quotes, isLoading } = useCollection(quotesQuery);

    const productsQuery = useMemoFirebase(() => query(collection(db, "products"), where("isPublished", "==", true)), []);
    const { data: products } = useCollection<Product>(productsQuery);

    const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

    // Quote Logic
    const addItem = (product: Product) => {
        const existing = quoteItems.find(item => item.id === product.id);
        if (existing) {
            setQuoteItems(quoteItems.map(item => 
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setQuoteItems([...quoteItems, { 
                id: product.id, 
                name: product.name, 
                price: product.sellingPrice, 
                quantity: 1 
            }]);
        }
        toast({ title: "Produit ajouté", description: product.name });
    };

    const updateItemQty = (id: string, delta: number) => {
        setQuoteItems(quoteItems.map(item => {
            if (item.id === id) {
                return { ...item, quantity: Math.max(1, item.quantity + delta) };
            }
            return item;
        }));
    };

    const removeItem = (id: string) => {
        setQuoteItems(quoteItems.filter(item => item.id !== id));
    };

    const quoteTotal = useMemo(() => {
        return quoteItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }, [quoteItems]);

    const handleCreateQuote = async () => {
        if (!customerName || quoteItems.length === 0) {
            toast({ title: "Données manquantes", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const quoteData = {
                customerName,
                businessName: businessName || customerName,
                items: quoteItems,
                total: quoteTotal,
                status: 'pending',
                createdBy: user?.uid,
                createdByName: user?.name,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await addDoc(collection(db, "quotes"), quoteData);
            
            toast({ title: "Devis Enregistré", description: "Le dossier est maintenant dans le registre." });
            setIsSheetOpen(false);
            setQuoteItems([]);
            setCustomerName("");
            setBusinessName("");
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDownloadQuote = async (quote: any) => {
        setSelectedQuoteForPDF(quote);
        setTimeout(async () => {
            if (!quoteRef.current) return;
            setIsGeneratingPDF(true);
            try {
                const canvas = await html2canvas(quoteRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
                pdf.save(`DEVIS_DKS_${quote.id.substring(0, 8).toUpperCase()}.pdf`);
                toast({ title: "PDF Généré", description: "Le devis est prêt pour le client." });
            } catch (error) {
                toast({ title: "Erreur PDF", variant: "destructive" });
            } finally {
                setIsGeneratingPDF(false);
                setSelectedQuoteForPDF(null);
            }
        }, 500);
    };

    const filteredQuotes = quotes?.filter(q => 
        q.customerName?.toLowerCase().includes(search.toLowerCase()) || 
        q.businessName?.toLowerCase().includes(search.toLowerCase()) ||
        q.id.toLowerCase().includes(search.toLowerCase())
    );

    const filteredProducts = products?.filter(p => 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase())
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
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Registre <span className="text-accent">Devis Pro</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Gestion des offres commerciales Hardware & Solutions</p>
                        </div>
                    </div>

                    {isStaff && (
                        <Button onClick={() => setIsSheetOpen(true)} className="bg-primary text-white hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl">
                            <PlusCircle size={20} /> Nouveau Devis
                        </Button>
                    )}
                </div>

                <div className="mb-10 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input 
                        placeholder="Chercher par client, entreprise ou référence..." 
                        className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl focus:border-accent"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {isLoading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                    ) : filteredQuotes && filteredQuotes.length > 0 ? (
                        filteredQuotes.map((quote) => (
                            <Card key={quote.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group">
                                <CardContent className="p-8 flex flex-col lg:flex-row items-center gap-10">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                                        <FileText className="text-accent" size={28} />
                                    </div>
                                    
                                    <div className="flex-1 space-y-2 text-center md:text-left">
                                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4">
                                            <h3 className="text-xl font-black uppercase italic tracking-tight">{quote.businessName}</h3>
                                            <Badge variant="outline" className="border-white/10 text-white/40 uppercase text-[8px] font-black">Réf: {quote.id.substring(0, 8).toUpperCase()}</Badge>
                                        </div>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-6 text-[10px] font-black uppercase italic text-muted-foreground/60 tracking-widest">
                                            <span className="flex items-center gap-2"><User size={12} className="text-accent" /> Client: {quote.customerName}</span>
                                            <span className="flex items-center gap-2"><Clock size={12} /> Émis le {quote.createdAt?.toDate ? quote.createdAt.toDate().toLocaleDateString() : 'Récemment'}</span>
                                            <span className="flex items-center gap-2"><Zap size={12} /> Articles: {quote.items?.length || 0}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 shrink-0">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Montant Devisé</p>
                                            <p className="text-2xl font-black text-accent">${quote.total?.toFixed(2)}</p>
                                        </div>
                                        <div className="flex flex-col gap-2 min-w-[160px]">
                                            <Button 
                                                onClick={() => handleDownloadQuote(quote)}
                                                disabled={isGeneratingPDF}
                                                className="h-11 bg-white text-black font-black uppercase italic rounded-xl text-[10px] shadow-lg hover:bg-accent transition-all"
                                            >
                                                {isGeneratingPDF ? <Loader2 className="animate-spin h-4 w-4" /> : <Download size={14} className="mr-2" />} Exporter PDF
                                            </Button>
                                            {isStaff && (
                                                <Button variant="ghost" className="h-11 text-muted-foreground hover:text-red-500 rounded-xl text-[9px] font-black uppercase">
                                                    <Trash2 size={12} className="mr-2" /> Annuler Devis
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
                            <p className="text-xl font-black uppercase italic tracking-tighter">Aucun devis enregistré</p>
                        </div>
                    )}
                </div>
            </main>

            {/* CREATE QUOTE SHEET */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-2xl flex flex-col p-0">
                    <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-accent text-black flex items-center justify-center shadow-xl"><PlusCircle size={28} /></div>
                            <div>
                                <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">Nouveau Devis</SheetTitle>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Offre Élite Hardware</p>
                            </div>
                        </div>
                    </SheetHeader>
                    
                    <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nom du Client</Label>
                                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Ex: Jean Bahati" className="h-12 bg-background/50 border-white/5 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Entreprise (Optionnel)</Label>
                                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ex: RawBank" className="h-12 bg-background/50 border-white/5 rounded-xl" />
                            </div>
                        </div>

                        {/* PRODUCT SELECTION */}
                        <div className="space-y-6">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2"><ShoppingCart size={14}/> Sélection du Stock</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Chercher un produit..." className="h-11 pl-10 bg-white/5 border-white/5 rounded-xl text-xs" />
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                {filteredProducts?.map(p => (
                                    <button key={p.id} onClick={() => addItem(p)} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-accent/10 hover:border-accent/20 transition-all flex justify-between items-center group">
                                        <div className="text-left">
                                            <p className="font-bold text-xs uppercase">{p.name}</p>
                                            <p className="text-[10px] text-muted-foreground">${p.sellingPrice.toFixed(2)}</p>
                                        </div>
                                        <Plus size={16} className="text-accent opacity-0 group-hover:opacity-100" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ITEMS LIST */}
                        <div className="space-y-6 pt-6 border-t border-white/5">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Articles dans le devis</h4>
                            {quoteItems.length > 0 ? (
                                <div className="space-y-3">
                                    {quoteItems.map((item) => (
                                        <div key={item.id} className="p-4 bg-white/5 rounded-2xl flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-bold text-sm uppercase italic">{item.name}</p>
                                                <p className="text-[10px] text-accent font-black">${item.price.toFixed(2)}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded-lg">
                                                    <button onClick={() => updateItemQty(item.id, -1)} className="hover:text-accent"><Minus size={14}/></button>
                                                    <span className="w-6 text-center font-black text-sm">{item.quantity}</span>
                                                    <button onClick={() => updateItemQty(item.id, 1)} className="hover:text-accent"><Plus size={14}/></button>
                                                </div>
                                                <button onClick={() => removeItem(item.id)} className="text-destructive/40 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="pt-6 border-t border-dashed border-white/10 flex justify-between items-end">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground">Total Devisé</p>
                                        <p className="text-3xl font-black text-accent italic">${quoteTotal.toFixed(2)}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-10 text-center opacity-20 italic text-xs">Aucun article sélectionné.</div>
                            )}
                        </div>
                    </div>

                    <SheetFooter className="p-8 bg-black/40 border-t border-white/5">
                        <Button 
                            onClick={handleCreateQuote} 
                            disabled={isSubmitting || quoteItems.length === 0} 
                            className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 className="mr-2" /> Valider & Enregistrer le Devis</>}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* QUOTE PDF TEMPLATE (HIDDEN) */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {selectedQuoteForPDF && (
                    <div ref={quoteRef} className="bg-white text-black p-16 w-[800px] font-sans">
                        <header className="flex justify-between items-start border-b-4 border-black pb-10 mb-12">
                            <div className="space-y-4">
                                <div className="bg-black text-white px-6 py-2 inline-block font-black text-3xl italic tracking-tighter">DKS SOLUTIONS</div>
                                <div className="text-sm font-bold uppercase tracking-widest text-gray-500">Expertise & Infrastructure IT</div>
                                <div className="text-[11px] leading-relaxed mt-4 font-medium">
                                    <p>Immeuble Bahati, Boulevard de la Libération</p>
                                    <p>Bunia, Province de l'Ituri, RDC</p>
                                    <p>Tél: +243 823 038 945</p>
                                    <p>Email: business@dks-shop.com</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-2">DEVIS PRO</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Réf: #{selectedQuoteForPDF.id.substring(0, 12).toUpperCase()}</p>
                                <div className="mt-8">
                                    <p className="text-[10px] font-black uppercase text-gray-400">Date d'émission</p>
                                    <p className="text-lg font-bold">{new Date().toLocaleDateString('fr-FR')}</p>
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-2 gap-20 mb-12">
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase text-gray-400 border-b pb-2 tracking-widest">Client</h3>
                                <div className="space-y-1">
                                    <p className="text-xl font-black uppercase italic">{selectedQuoteForPDF.businessName}</p>
                                    <p className="text-sm text-gray-600">À l'attention de {selectedQuoteForPDF.customerName}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase text-gray-400 border-b pb-2 tracking-widest">Validité</h3>
                                <p className="text-sm font-bold uppercase">Offre valable 15 jours</p>
                            </div>
                        </div>

                        <table className="w-full mb-12">
                            <thead>
                                <tr className="bg-gray-100 text-[10px] font-black uppercase tracking-widest">
                                    <th className="text-left p-4">Description de l'article / Service</th>
                                    <th className="text-center p-4">Qté</th>
                                    <th className="text-right p-4">Prix Unitaire</th>
                                    <th className="text-right p-4">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {selectedQuoteForPDF.items?.map((item: any, idx: number) => (
                                    <tr key={idx} className="border-b border-gray-100">
                                        <td className="p-4 font-bold uppercase italic">{item.name}</td>
                                        <td className="p-4 text-center font-bold">{item.quantity}</td>
                                        <td className="p-4 text-right">${item.price?.toFixed(2)}</td>
                                        <td className="p-4 text-right font-black">${(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-end gap-20">
                            <div className="w-80 space-y-4">
                                <div className="flex justify-between text-sm font-bold text-gray-500">
                                    <span>SOUS-TOTAL</span>
                                    <span>${selectedQuoteForPDF.total?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-gray-500 border-b pb-4">
                                    <span>TAXES (0%)</span>
                                    <span>$0.00</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-black uppercase italic">TOTAL ESTIMÉ</span>
                                    <span className="text-4xl font-black tracking-tighter">${selectedQuoteForPDF.total?.toFixed(2)}</span>
                                </div>
                                <p className="text-right text-[10px] font-bold text-gray-400 uppercase italic">Zéro frais d'installation inclus dans ce devis.</p>
                            </div>
                        </div>

                        <footer className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-end">
                            <div className="flex items-center gap-6">
                                <QrCode size={60} className="opacity-100 text-black" />
                                <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed max-w-[250px]">
                                    Document officiel de Double King Shop. <br />
                                    Certification Infrastructure DKS-PRO-2024.
                                </p>
                            </div>
                            <div className="text-right space-y-4 relative">
                                <div className="absolute top-[-100px] right-0 flex flex-col items-center">
                                    {/* CACHET SÉCURITÉ MONOGRAMME */}
                                    <div className="w-32 h-32 rounded-full border-[3px] border-double border-blue-900 flex flex-col items-center justify-center p-1 rotate-[-8deg] opacity-95 relative">
                                        <div className="absolute inset-0 border border-blue-900/20 rounded-full scale-[0.95]" />
                                        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-60">
                                            <path id="quoteCirclePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
                                            <text className="text-[4px] font-black fill-blue-900 uppercase">
                                                <textPath xlinkHref="#quoteCirclePath">
                                                    CERTIFIED BY DOUBLE KING SHOP • ORIGINAL DOCUMENT • CERTIFIED BY DOUBLE KING SHOP • 
                                                </textPath>
                                            </text>
                                        </svg>
                                        <p className="text-[6px] font-black text-blue-900 leading-none">DOUBLE KING SHOP</p>
                                        <div className="my-1.5">
                                            <svg viewBox="0 0 200 200" className="w-12 h-12 text-blue-900">
                                                <path d="M65 65V135M65 100L95 65M65 100L95 135" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M135 65V135M135 100L105 65M135 100L105 135" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <p className="text-[6px] font-bold text-blue-900 uppercase">OFFICIAL QUOTE</p>
                                        <p className="text-[7px] font-black text-blue-900 uppercase tracking-widest mt-1">BUNIA</p>
                                    </div>
                                    <div className="w-32 h-8 text-blue-950 mt-[-20px] rotate-[-5deg]">
                                        <svg viewBox="0 0 200 60" className="w-full h-full"><path d="M20,40 Q50,10 80,40 T140,30 Q160,20 180,45" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                                    </div>
                                </div>
                                <div className="h-16 w-32 border-2 border-gray-100 rounded-lg flex items-center justify-center italic text-gray-300 text-[8px] uppercase font-black">Visa Direction</div>
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
