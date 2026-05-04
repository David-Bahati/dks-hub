
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
  Zap
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, serverTimestamp, addDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exchangeRate, setExchangeRate] = useState(2500);
  
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

  const { data: rawOrders, isLoading: collectionLoading, error } = useCollection(ordersQuery);

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

  const updateOrderStatus = async (orderId: string, newStatus: string, userId: string) => {
    setUpdatingId(orderId);
    try {
        await updateDoc(doc(db, "orders", orderId), {
            status: newStatus,
            updatedAt: serverTimestamp()
        });

        await addDoc(collection(db, "notifications"), {
            userId: userId,
            title: "Statut Commande Mis à Jour",
            message: `Votre commande #${orderId.substring(0, 8)} est passée au statut : ${newStatus.toUpperCase()}.`,
            type: 'info',
            isRead: false,
            createdAt: serverTimestamp(),
            link: '/dashboard/orders'
        });

        toast({
            title: "Statut mis à jour",
            description: `La commande est désormais : ${newStatus}`,
        });
    } catch (err) {
        toast({ title: "Erreur", description: "Impossible de modifier le statut.", variant: "destructive" });
    } finally {
        setUpdatingId(null);
    }
  };

  const handleDownloadInvoice = async (order: any) => {
    setSelectedOrderForPDF(order);
    // On attend que le state soit mis à jour et le DOM rendu
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
        return <Badge className="bg-orange-500/10 text-orange-400 border-none uppercase text-[10px] font-black px-3 py-1 flex items-center gap-1"><Clock size={12} /> Attente Cash</Badge>;
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
                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Mode: {order.paymentMethod?.replace('_', ' ')}</p>
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
                                                    className="bg-green-500 hover:bg-green-600 text-white rounded-xl h-11 px-4 gap-2 font-black uppercase text-[9px]"
                                                    onClick={() => updateOrderStatus(order.id, 'payée', order.userId)}
                                                    disabled={updatingId === order.id}
                                                >
                                                    {updatingId === order.id ? <Loader2 className="animate-spin h-3 w-3" /> : <Check size={14} />}
                                                    Encaisser
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

        {/* FACTURE PDF CACHÉE (Générée lors du téléchargement) */}
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
                                <p className="text-sm font-bold">Mode : <span className="uppercase">{selectedOrderForPDF.paymentMethod?.replace('_', ' ')}</span></p>
                                <p className="text-sm font-bold">Statut : <span className="uppercase text-green-600">{selectedOrderForPDF.status}</span></p>
                                {selectedOrderForPDF.piValue && (
                                    <p className="text-xs font-medium text-orange-600 mt-2">Transaction Pi validée blockchain</p>
                                )}
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
                                        <p className="text-[10px] text-gray-400 uppercase mt-1">
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

                    <div className="flex justify-end">
                        <div className="w-80 space-y-4">
                            <div className="flex justify-between text-sm font-bold text-gray-500">
                                <span>SOUS-TOTAL</span>
                                <span>${selectedOrderForPDF.total?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold text-gray-500 border-b pb-4">
                                <span>TAXES (0%)</span>
                                <span>$0.00</span>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-black uppercase italic">TOTAL À PAYER</span>
                                    <span className="text-4xl font-black tracking-tighter">${selectedOrderForPDF.total?.toFixed(2)}</span>
                                </div>
                                <p className="text-right text-sm font-bold text-gray-400 uppercase">
                                    ≈ {(selectedOrderForPDF.total * exchangeRate).toLocaleString()} CDF
                                </p>
                            </div>
                            {selectedOrderForPDF.piValue && (
                                <div className="bg-orange-50 p-4 rounded-xl flex justify-between items-center border border-orange-100">
                                    <span className="text-[10px] font-black text-orange-800 uppercase">Valeur Pi (GCV)</span>
                                    <span className="text-sm font-black text-orange-800">{selectedOrderForPDF.piValue.toFixed(8)} π</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <footer className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-6">
                            <QrCode size={60} className="opacity-20" />
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
