
"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  ArrowLeft, 
  Loader2, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle,
  Check,
  MessageCircle,
  MapPin,
  ExternalLink,
  Search,
  Download,
  Printer,
  FileText,
  QrCode,
  Zap,
  Coins,
  ShieldCheck,
  Globe,
  Lock,
  Banknote,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, serverTimestamp, addDoc, getDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription 
} from '@/components/ui/dialog';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';
import { PI_GCV } from '@/lib/constants';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exchangeRate, setExchangeRate] = useState(2500);
  
  // Payment Dialog States
  const [orderToPay, setOrderToPay] = useState<any | null>(null);
  const [collectMethod, setCollectMethod] = useState("CASH");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // PDF Generation States
  const [selectedOrderForPDF, setSelectedOrderForPDF] = useState<any | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRate = async () => {
        try {
            const snap = await getDoc(doc(db, "system", "config"));
            if (snap.exists()) setExchangeRate(snap.data().exchangeRate || 2500);
        } catch (e) { console.error(e); }
    };
    fetchRate();
  }, []);

  const ordersQuery = useMemoFirebase(() => {
    if (authLoading || !user?.uid) return null;
    
    const role = user.role?.toLowerCase();
    const isStaff = role === 'admin' || role === 'seller' || role === 'cashier';
    const baseRef = collection(db, "orders");
    
    if (isStaff) {
      return query(baseRef);
    }
    
    return query(
      baseRef, 
      where("userId", "==", user.uid)
    );
  }, [user?.uid, user?.role, authLoading]);

  const { data: rawOrders, isLoading: collectionLoading } = useCollection(ordersQuery);

  const filteredOrders = useMemo(() => {
    if (!rawOrders) return [];
    
    let result = [...rawOrders];

    if (statusFilter !== "all") {
      result = result.filter(order => {
        const s = order.status?.toLowerCase();
        if (statusFilter === "pending") return s?.includes("attente") || s === "pending" || s === "pending_payment";
        if (statusFilter === "paid") return s?.includes("payé") || s?.includes("payée") || s === "completed";
        if (statusFilter === "cancelled") return s?.includes("annulé") || s === "cancelled";
        return true;
      });
    }

    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(order => 
        order.customerName?.toLowerCase().includes(term) ||
        order.id.toLowerCase().includes(term) ||
        order.customerEmail?.toLowerCase().includes(term)
      );
    }

    return result.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
  }, [rawOrders, search, statusFilter]);

  const handleRegisterPayment = async () => {
    if (!orderToPay) return;
    setIsProcessingPayment(true);

    try {
        const piTxId = collectMethod === 'PI_NETWORK' ? `PI-COLLECT-${Math.random().toString(36).substring(2, 10).toUpperCase()}` : null;

        // 1. Update Order
        await updateDoc(doc(db, "orders", orderToPay.id), {
            status: 'payée',
            paymentMethod: collectMethod,
            piTxId: piTxId,
            updatedAt: serverTimestamp()
        });

        // 2. Register as a Sale for Reports
        await addDoc(collection(db, "sales"), {
            userId: user?.uid,
            customerName: orderToPay.customerName,
            items: orderToPay.items,
            totalAmount: orderToPay.total,
            totalCDF: orderToPay.total * exchangeRate,
            paymentMode: collectMethod,
            piTxId: piTxId,
            orderId: orderToPay.id,
            createdAt: serverTimestamp()
        });

        // 3. Decrement Stock
        if (orderToPay.items) {
            await Promise.all(orderToPay.items.map((item: any) => {
                const productRef = doc(db, "products", item.id || item.productId);
                return updateDoc(productRef, {
                    stockQuantity: increment(-item.quantity)
                }).catch(e => console.warn("Stock update failed for", item.name, e));
            }));
        }

        // 4. Notify User
        await addDoc(collection(db, "notifications"), {
            userId: orderToPay.userId,
            title: "Paiement Reçu au Bureau",
            message: `Votre commande #${orderToPay.id.substring(0, 8)} a été validée. Merci de votre confiance !`,
            type: 'success',
            isRead: false,
            createdAt: serverTimestamp(),
            link: '/dashboard/orders'
        });

        toast({ title: "Paiement Enregistré", description: "La commande est désormais clôturée." });
        setOrderToPay(null);
    } catch (err) {
        toast({ title: "Erreur", description: "Impossible d'enregistrer le paiement.", variant: "destructive" });
    } finally {
        setIsProcessingPayment(false);
    }
  };

  const handleDownloadInvoice = async (order: any) => {
    setSelectedOrderForPDF(order);
    setTimeout(async () => {
        if (!invoiceRef.current) return;
        setIsGeneratingPDF(true);
        try {
            const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`FACTURE_DKS_${order.id.substring(0, 8).toUpperCase()}.pdf`);
            toast({ title: "Facture générée", description: "Le PDF a été téléchargé." });
        } catch (error) {
            toast({ title: "Erreur PDF", variant: "destructive" });
        } finally {
            setIsGeneratingPDF(false);
            setSelectedOrderForPDF(null);
        }
    }, 500);
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'completed':
      case 'payé':
      case 'terminé':
      case 'payée':
        return <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[10px] font-black px-3 py-1 flex items-center gap-1"><CheckCircle size={12} /> Confirmé</Badge>;
      case 'pending_payment':
      case 'en attente':
        return <Badge className="bg-orange-500/10 text-orange-400 border-none uppercase text-[10px] font-black px-3 py-1 flex items-center gap-1"><Clock size={12} /> Attente Encaissement</Badge>;
      case 'cancelled':
      case 'annulé':
        return <Badge className="bg-destructive/10 text-destructive border-none uppercase text-[10px] font-black px-3 py-1 flex items-center gap-1"><XCircle size={12} /> Annulé</Badge>;
      default:
        return <Badge className="bg-blue-500/10 text-blue-400 border-none uppercase text-[10px] font-black px-3 py-1 flex items-center gap-1"><Clock size={12} /> En cours</Badge>;
    }
  };

  const isLoading = authLoading || collectionLoading;
  const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
        <header className="border-b border-white/5 bg-background/40 backdrop-blur-2xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                <h1 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                    <ShoppingBag className="text-accent"/> {isStaff ? 'Gestion des' : 'Mes'} <span className="text-accent">Commandes</span>
                </h1>
                <Link href="/dashboard">
                    <Button variant="outline" className="h-12 border-white/10 rounded-2xl gap-2 font-black uppercase italic text-xs">
                        <ArrowLeft size={16} />
                        Retour
                    </Button>
                </Link>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
            {isStaff && (
              <div className="mb-10 space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input 
                      placeholder="Chercher par nom, email ou #ID..." 
                      className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl focus:border-accent"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-fit">
                    <TabsList className="bg-white/5 border border-white/5 h-14 p-1 rounded-2xl">
                      <TabsTrigger value="all" className="rounded-xl font-bold uppercase text-[10px] px-6">Toutes</TabsTrigger>
                      <TabsTrigger value="pending" className="rounded-xl font-bold uppercase text-[10px] px-6">En attente</TabsTrigger>
                      <TabsTrigger value="paid" className="rounded-xl font-bold uppercase text-[10px] px-6">Payées</TabsTrigger>
                      <TabsTrigger value="cancelled" className="rounded-xl font-bold uppercase text-[10px] px-6">Annulées</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin h-12 w-12 text-accent" />
                </div>
            ) : filteredOrders.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {filteredOrders.map((order: any) => (
                        <Card key={order.id} className="glossy-card border-none rounded-[2rem] overflow-hidden">
                            <div className="p-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black uppercase text-muted-foreground">Commande #{order.id.substring(0, 8)}</span>
                                            {getStatusBadge(order.status)}
                                            {order.source && <Badge className="bg-accent/10 text-accent border-none uppercase text-[8px] font-black"><Zap size={10} className="mr-1" /> SERVICE HUB</Badge>}
                                        </div>
                                        <h3 className="text-xl font-black uppercase italic">{order.customerName || 'Client DKS'}</h3>
                                        <p className="text-xs text-muted-foreground">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'Date inconnue'}</p>
                                    </div>
                                    
                                    <div className="flex-1 max-w-md">
                                        <div className="flex flex-wrap gap-2">
                                            {order.items?.map((item: any, idx: number) => (
                                                <Badge key={idx} variant="secondary" className="bg-white/5 border-none text-[10px] font-bold">
                                                    {item.quantity}x {item.name}
                                                </Badge>
                                            ))}
                                        </div>
                                        
                                        {!isStaff && (
                                            <div className="mt-4 flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                                                <MapPin size={14} className="text-accent" />
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black uppercase text-muted-foreground">Point de Retrait</p>
                                                    <p className="text-[10px] font-bold">Immeuble Bahati, Bunia</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Mode: {order.paymentMethod === 'PI_NETWORK' ? 'Crypto-monnaie' : order.paymentMethod?.replace('_', ' ')}</p>
                                            <p className="text-2xl font-black text-accent">${(order.total || 0).toFixed(2)}</p>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <Button 
                                                variant="outline"
                                                size="sm"
                                                className="border-white/10 hover:bg-white/5 text-[9px] font-black uppercase italic rounded-xl h-11 px-4 gap-2"
                                                onClick={() => handleDownloadInvoice(order)}
                                                disabled={isGeneratingPDF}
                                            >
                                                <FileText size={14} /> Facture PDF
                                            </Button>

                                            {isStaff && !["payée", "payé", "terminé", "completed", "cancelled", "annulé"].includes(order.status?.toLowerCase()) && (
                                                <Button 
                                                    size="sm" 
                                                    className="bg-green-500 hover:bg-green-600 text-white rounded-xl h-11 px-4 gap-2 font-black uppercase text-[9px] shadow-xl shadow-green-500/20"
                                                    onClick={() => setOrderToPay(order)}
                                                >
                                                    <CheckCircle2 size={14} /> Encaisser
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center py-20 bg-card/60 rounded-[2.5rem] border border-white/10">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Package size={48} className="text-primary opacity-50" />
                    </div>
                    <h2 className="text-4xl font-black uppercase italic mb-4">Aucune Commande</h2>
                    <p className="text-muted-foreground max-w-md">Le registre est actuellement vide.</p>
                </div>
            )}
        </main>

        {/* DIALOG D'ENCAISSEMENT */}
        <Dialog open={!!orderToPay} onOpenChange={() => setOrderToPay(null)}>
            <DialogContent className="bg-card border-white/10 text-foreground rounded-[2.5rem] sm:max-w-md">
                <DialogHeader className="p-4 bg-accent/10 border-b border-white/5 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-accent text-black flex items-center justify-center mx-auto mb-4 shadow-xl"><Banknote size={32} /></div>
                    <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Enregistrer l'Argent</DialogTitle>
                    <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Validation manuelle de la commande</DialogDescription>
                </DialogHeader>

                <div className="p-8 space-y-8">
                    <div className="text-center space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground opacity-40">Montant à percevoir</p>
                        <h2 className="text-5xl font-black text-accent italic">${orderToPay?.total?.toFixed(2)}</h2>
                        <p className="text-lg font-bold text-white/40">≈ {(orderToPay?.total * exchangeRate).toLocaleString()} CDF</p>
                    </div>

                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Mode de règlement physique</Label>
                        <Select value={collectMethod} onValueChange={setCollectMethod}>
                            <SelectTrigger className="h-14 bg-background/50 border-white/10 rounded-2xl text-[10px] font-black uppercase italic">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-white/10">
                                <SelectItem value="CASH" className="font-bold uppercase text-[10px] text-green-400">Espèces / Cash</SelectItem>
                                <SelectItem value="MOBILE_MONEY" className="font-bold uppercase text-[10px] text-blue-400">Mobile Money</SelectItem>
                                <SelectItem value="PI_NETWORK" className="font-bold uppercase text-[10px] text-yellow-500">Crypto-monnaie (Pi)</SelectItem>
                                <SelectItem value="VISA" className="font-bold uppercase text-[10px]">Carte Bancaire</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                        <p className="text-[8px] font-black uppercase text-muted-foreground">Client : {orderToPay?.customerName}</p>
                        <p className="text-[8px] font-black uppercase text-muted-foreground">Articles : {orderToPay?.items?.length}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <Button variant="ghost" onClick={() => setOrderToPay(null)} className="h-14 rounded-2xl font-black uppercase italic text-xs">Annuler</Button>
                        <Button onClick={handleRegisterPayment} disabled={isProcessingPayment} className="h-14 bg-accent text-black font-black uppercase italic text-xs rounded-2xl shadow-xl shadow-accent/20">
                            {isProcessingPayment ? <Loader2 className="animate-spin" /> : <><CheckCircle size={16} className="mr-2" /> Valider l'Encaissement</>}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        {/* FACTURE PDF CACHÉE AVEC CACHET ET SIGNATURE AUTOMATIQUES - LOOK "PAPIER" */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            {selectedOrderForPDF && (
                <div ref={invoiceRef} className="bg-white text-black p-16 w-[800px] font-sans">
                    <header className="flex justify-between items-start border-b-4 border-black pb-10 mb-12">
                        <div className="space-y-4">
                            <div className="bg-black text-white px-6 py-2 inline-block font-black text-3xl italic tracking-tighter">DKS SHOP</div>
                            <div className="text-sm font-bold uppercase tracking-widest text-gray-500">Excellence Informatique</div>
                            <div className="text-[11px] leading-relaxed mt-4 font-medium">
                                <p>Immeuble Bahati, Boulevard de la Libération</p>
                                <p>Bunia, Province de l'Ituri, RDC</p>
                                <p>Tél: +243 823 038 945</p>
                                <p>Email: contact@dks-shop.com</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-2">FACTURE</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Réf: #{selectedOrderForPDF.id.substring(0, 12).toUpperCase()}</p>
                            <div className="mt-8">
                                <p className="text-[10px] font-black uppercase text-gray-400">Date d'émission</p>
                                <p className="text-lg font-bold">{new Date().toLocaleDateString('fr-FR')}</p>
                            </div>
                        </div>
                    </header>

                    <div className="grid grid-cols-2 gap-20 mb-12">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase text-gray-400 border-b pb-2 tracking-widest">Facturé à</h3>
                            <div className="space-y-1">
                                <p className="text-xl font-black uppercase italic">{selectedOrderForPDF.customerName}</p>
                                <p className="text-sm text-gray-600">{selectedOrderForPDF.customerEmail || "Client Double King Shop"}</p>
                                <p className="text-xs font-medium text-gray-400 mt-2">Client ID: {selectedOrderForPDF.userId?.substring(0, 8)}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase text-gray-400 border-b pb-2 tracking-widest">Paiement</h3>
                            <div className="space-y-1">
                                <p className="text-sm font-bold">Mode : <span className="uppercase">{selectedOrderForPDF.paymentMethod === 'PI_NETWORK' ? 'Crypto-monnaie (Pi)' : selectedOrderForPDF.paymentMethod?.replace('_', ' ')}</span></p>
                                <p className="text-sm font-bold">Statut : <span className="uppercase text-green-600">{selectedOrderForPDF.status}</span></p>
                            </div>
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
                            {selectedOrderForPDF.items?.map((item: any, idx: number) => (
                                <tr key={idx} className="border-b border-gray-100">
                                    <td className="p-4">
                                        <p className="font-bold uppercase italic">{item.name}</p>
                                        <p className="text-[9px] text-gray-400 uppercase mt-1">
                                            {selectedOrderForPDF.source ? "Garantie Service Hub Incluse" : "Garantie Hardware DKS incluse"}
                                        </p>
                                    </td>
                                    <td className="p-4 text-center font-bold">{item.quantity}</td>
                                    <td className="p-4 text-right font-medium">${item.price?.toFixed(2)}</td>
                                    <td className="p-4 text-right font-black">${(item.price * item.quantity).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end gap-20">
                        {/* ZONE CACHET ET SIGNATURE FLOTTANTS */}
                        <div className="flex flex-col items-center justify-center p-6 min-w-[280px] relative">
                            <div className="relative flex flex-col items-center text-center">
                                {/* CACHET HAUTE SÉCURITÉ MIDNIGHT BLUE */}
                                <div className="w-32 h-32 rounded-full border-[3px] border-double border-blue-900 flex flex-col items-center justify-center relative p-1 rotate-[-5deg] opacity-95">
                                    <div className="absolute inset-0 border border-blue-900/20 rounded-full scale-[0.95]" />
                                    {/* Texte de sécurité circulaire simulé */}
                                    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-spin-slow opacity-30">
                                        <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
                                        <text className="text-[3px] font-black fill-blue-900 uppercase">
                                            <textPath xlinkHref="#circlePath">
                                                CERTIFIED BY DOUBLE KING SHOP • ORIGINAL DOCUMENT • CERTIFIED BY DOUBLE KING SHOP • ORIGINAL DOCUMENT • 
                                            </textPath>
                                        </text>
                                    </svg>
                                    
                                    <p className="text-[8px] font-black text-blue-900 uppercase leading-none tracking-tighter z-10">DOUBLE KING SHOP</p>
                                    <div className="my-1 z-10">
                                        <ShieldCheck className="text-blue-900" size={24} />
                                    </div>
                                    <p className="text-[6px] font-bold text-blue-900 uppercase leading-none z-10">OFFICIAL HUB</p>
                                    <p className="text-[7px] font-black text-blue-900 uppercase tracking-widest mt-0.5 z-10">BUNIA • RDC</p>
                                </div>

                                <div className="space-y-1 mt-4">
                                    <p className="text-[8px] font-black text-gray-400 italic">Signature Autorisée</p>
                                    {/* Signature manuscrite SVG "flottante" */}
                                    <div className="h-10 w-40 flex items-center justify-center">
                                        <svg viewBox="0 0 200 60" className="w-full h-full text-blue-900 opacity-80" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }}>
                                            <path d="M20,40 Q50,10 80,40 T140,30 Q160,20 180,45" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                            <path d="M40,30 Q60,50 90,25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                                            <path d="M110,40 Q130,10 150,50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
                                        </svg>
                                    </div>
                                    <p className="text-[10px] font-black uppercase italic tracking-tighter text-blue-900">Expert Bahati Nyeke</p>
                                    <div className="w-24 h-[1px] bg-blue-900/20 mx-auto mt-1" />
                                </div>
                            </div>
                        </div>

                        <div className="w-80 space-y-4">
                            <div className="flex justify-between text-sm font-bold text-gray-500">
                                <span>SOUS-TOTAL</span>
                                <span>${selectedOrderForPDF.total?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-gray-500 border-b pb-4">
                                <span>TAXES (0%)</span>
                                <span>$0.00</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-black uppercase italic">TOTAL À PAYER</span>
                                    <span className="text-4xl font-black tracking-tighter">${selectedOrderForPDF.total?.toFixed(2)}</span>
                                </div>
                                
                                {selectedOrderForPDF.paymentMethod === 'PI_NETWORK' && (
                                    <div className="bg-orange-50 p-6 rounded-2xl flex flex-col gap-3 border border-orange-100 animate-in zoom-in duration-500">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Globe className="text-orange-600" size={16} />
                                                <span className="text-[10px] font-black text-orange-800 uppercase">Valeur Pi (GCV)</span>
                                            </div>
                                            <Badge className="bg-orange-200 text-orange-800 border-none text-[8px] font-black">Consensus $314,159</Badge>
                                        </div>
                                        <span className="text-3xl font-black text-orange-800 italic">
                                            {(selectedOrderForPDF.total / PI_GCV).toFixed(8)} π
                                        </span>
                                        
                                        {selectedOrderForPDF.piTxId && (
                                            <div className="pt-3 border-t border-orange-200 mt-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Lock size={10} className="text-orange-600" />
                                                    <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest">Hachage Blockchain</span>
                                                </div>
                                                <p className="text-[9px] font-mono font-bold text-orange-800 break-all bg-white/50 p-2 rounded-lg border border-orange-200/50">
                                                    {selectedOrderForPDF.piTxId}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <p className="text-right text-xs font-bold text-gray-400 uppercase">
                                    Équivalent : {(selectedOrderForPDF.cdfValue || selectedOrderForPDF.total * exchangeRate).toLocaleString()} CDF
                                </p>
                            </div>
                        </div>
                    </div>

                    <footer className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <QrCode size={60} className="opacity-100 text-black" />
                            <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed max-w-[250px]">
                                Cette facture est un document officiel de Double King Shop. <br />
                                Les prestations de service ne sont pas remboursables après exécution.
                            </p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-[10px] font-black uppercase italic">Merci de votre confiance</p>
                            <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">DKS ShopManager Supreme v3.0</p>
                        </div>
                    </footer>
                </div>
            )}
        </div>
    </div>
  );
}

