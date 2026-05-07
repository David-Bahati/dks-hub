
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useState, useEffect, useMemo, useRef } from "react";
import { Product, PaymentMode } from "@/lib/types";
import { PI_GCV } from "@/lib/constants";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  Search,
  CheckCircle2,
  Banknote,
  Smartphone,
  Coins,
  QrCode,
  Loader2,
  Printer,
  User as UserIcon,
  ArrowLeft,
  History,
  Clock,
  ShoppingBag,
  ExternalLink,
  Zap,
  Globe,
  Lock,
  ShieldCheck,
  Receipt,
  Download,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, increment, query, orderBy, limit, getDoc, where } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import withAuth from "@/components/auth/withAuth";
import { Logo } from "@/components/ui/Logo";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface CartItem extends Product {
  quantity: number;
}

type CryptoSubMode = 'pi' | 'dkst';

function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [cryptoSubMode, setCryptoSubMode] = useState<CryptoSubMode>("pi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [exchangeRate, setExchangeRate] = useState(2500);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{
    id: string;
    items: any[];
    total: number;
    mode: string;
    cryptoType?: string;
    piTxId?: string;
    date: string;
    customerName: string;
    totalCDF: number;
  } | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const unsubscribeProds = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
      setLoadingProducts(false);
    });

    const fetchConfig = async () => {
        const configSnap = await getDoc(doc(db, "system", "config"));
        if (configSnap.exists()) {
            setExchangeRate(configSnap.data().exchangeRate || 2500);
        }
    };
    fetchConfig();

    return () => unsubscribeProds();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
        toast({ title: "Rupture de stock", description: "Cet article n'est plus disponible.", variant: "destructive" });
        return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
            toast({ title: "Stock limité", description: "Quantité maximale atteinte pour cet article.", variant: "destructive" });
            return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
    if (cart.length === 1) setActiveOrderId(null);
  };

  const updateQuantity = (id: string, delta: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        if (newQty > product.stockQuantity) {
            toast({ title: "Stock insuffisant", description: "Stock limité.", variant: "destructive" });
            return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + ((item.price || item.sellingPrice || 0) * item.quantity), 0);
  }, [cart]);

  const filteredProducts = useMemo(() => {
    const term = search.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.category.toLowerCase().includes(term)
    );
  }, [products, search]);

  const confirmPayment = async () => {
    setIsProcessing(true);
    const finalCustomerName = customerName.trim() || "Client Comptoir";
    
    try {
        const piTxId = paymentMode === 'PI_NETWORK' ? `PI-POS-${Math.random().toString(36).substring(2, 15).toUpperCase()}` : null;

        const saleData = {
            userId: user?.uid,
            customerName: finalCustomerName,
            items: cart.map(item => ({
                productId: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price || item.sellingPrice || 0
            })),
            totalAmount: total,
            totalCDF: total * exchangeRate,
            paymentMode: paymentMode,
            cryptoType: paymentMode === 'PI_NETWORK' ? cryptoSubMode : null,
            piTxId: piTxId,
            createdAt: serverTimestamp(),
            status: 'Payé',
            orderId: activeOrderId || null
        };

        const saleRef = await addDoc(collection(db, "sales"), saleData);

        await Promise.all(cart.map(item => {
            const productRef = doc(db, "products", item.id);
            return updateDoc(productRef, {
                stockQuantity: increment(-item.quantity)
            });
        }));

        const now = new Date().toLocaleString('fr-FR');
        setLastTransaction({
            id: saleRef.id,
            items: [...cart],
            total: total,
            totalCDF: total * exchangeRate,
            mode: paymentMode,
            cryptoType: paymentMode === 'PI_NETWORK' ? cryptoSubMode : undefined,
            piTxId: piTxId || undefined,
            date: now,
            customerName: finalCustomerName
        });

        toast({
            title: "Vente Terminée",
            description: `Reçu généré pour ${finalCustomerName}`,
        });

        setCart([]);
        setCustomerName("");
        setActiveOrderId(null);
        setShowConfirmation(false);
        setShowReceipt(true);
    } catch (error) {
        console.error("Erreur transaction:", error);
        toast({ title: "Erreur", description: "La transaction a échoué.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDownloadReceiptPDF = async () => {
      if (!receiptRef.current || !lastTransaction) return;
      setIsGeneratingPDF(true);
      try {
          const canvas = await html2canvas(receiptRef.current, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 150] });
          const imgWidth = 80;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
          pdf.save(`RECU_DKS_${lastTransaction.id.substring(0, 8).toUpperCase()}.pdf`);
          toast({ title: "PDF Généré", description: "Le reçu a été téléchargé." });
      } catch (error) {
          toast({ title: "Erreur PDF", variant: "destructive" });
      } finally {
          setIsGeneratingPDF(false);
      }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-FR').format(amount);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #printable-receipt-area, #printable-receipt-area * { visibility: visible; }
          #printable-receipt-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher des produits ou catégories..." 
                  className="pl-12 h-14 bg-card/40 border-white/10 rounded-2xl focus:border-accent transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(100vh-250px)] pb-10">
                {filteredProducts.map(product => (
                <Card 
                    key={product.id} 
                    className={cn(
                        "glossy-card cursor-pointer hover:border-accent/50 transition-all group border-none",
                        product.stockQuantity <= 0 && "opacity-40 grayscale pointer-events-none"
                    )}
                    onClick={() => addToCart(product)}
                >
                    <div className="aspect-square relative overflow-hidden rounded-t-2xl">
                    <img src={product.imageUrl || '/placeholder.png'} alt={product.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
                    </div>
                    <CardContent className="p-4">
                    <h3 className="font-bold text-sm line-clamp-1">{product.name}</h3>
                    <p className="text-accent font-black mt-1">${(product.sellingPrice || product.price || 0).toFixed(2)}</p>
                    </CardContent>
                </Card>
                ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="glossy-card border-none flex-1 flex flex-col overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/5">
                <CardTitle className="text-lg flex items-center gap-2 font-black italic uppercase">
                  <ShoppingCart size={20} className="text-accent" />
                  Panier Caisse
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30 p-10 text-center">
                  <ShoppingCart size={48} className="mb-4" />
                  <p className="font-bold uppercase text-xs italic">Prêt pour une nouvelle vente...</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {cart.map(item => (
                    <div key={item.id} className="p-4 flex items-center justify-between group bg-white/5">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold">{item.name}</h4>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">${(item.sellingPrice || item.price || 0).toFixed(2)} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-black/40 rounded-xl px-2 py-1">
                          <button onClick={() => updateQuantity(item.id, -1)}><Minus size={14}/></button>
                          <span className="w-6 text-center text-sm font-black">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)}><Plus size={14}/></button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)}><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col border-t border-white/5 p-6 gap-6 bg-black/40">
              <div className="flex justify-between items-end w-full">
                <span className="text-xs font-black uppercase text-muted-foreground">Total</span>
                <div className="text-right">
                  <span className="text-3xl font-black text-accent">${total.toFixed(2)}</span>
                </div>
              </div>
              <Button className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl" disabled={cart.length === 0 || isProcessing} onClick={() => setShowConfirmation(true)}>
                {isProcessing ? <Loader2 className="animate-spin" /> : "Valider la Vente"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="bg-card border-white/10 text-foreground rounded-[2rem] sm:max-w-lg">
          <DialogHeader><DialogTitle className="text-2xl font-black italic uppercase text-center">Paiement</DialogTitle></DialogHeader>
          <div className="py-6 flex flex-col gap-6">
            <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Client</Label>
                <Input placeholder="Nom du client" className="h-14 bg-background/50 border-white/10 rounded-xl font-bold" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="text-center">
              <h2 className="text-5xl font-black text-accent">${total.toFixed(2)}</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <Button variant={paymentMode === 'CASH' ? 'default' : 'outline'} onClick={() => setPaymentMode('CASH')}>Cash</Button>
                <Button variant={paymentMode === 'MOBILE_MONEY' ? 'default' : 'outline'} onClick={() => setPaymentMode('MOBILE_MONEY')}>M-Money</Button>
                <Button variant={paymentMode === 'PI_NETWORK' ? 'default' : 'outline'} onClick={() => setPaymentMode('PI_NETWORK')}>Crypto</Button>
            </div>
          </div>
          <DialogFooter><Button className="w-full bg-accent text-black font-black" onClick={confirmPayment} disabled={isProcessing}>Confirmer</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="bg-white text-black p-0 overflow-hidden sm:max-w-[420px] rounded-[2rem] shadow-2xl border-none flex flex-col relative">
          <button onClick={() => setShowReceipt(false)} className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 no-print"><X size={20} /></button>

          <div ref={receiptRef} id="printable-receipt-area" className="flex-1 overflow-y-auto p-8 font-mono text-[11px] leading-tight bg-white">
            <div className="text-center mb-6 border-b-2 border-dashed border-gray-300 pb-6">
              <div className="flex justify-center mb-3">
                 <div className="bg-black text-white px-4 py-1.5 font-black text-xl italic tracking-tighter rounded-md">DKS SHOP</div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Excellence Technologique</p>
              <div className="mt-4 space-y-1 text-[9px] font-bold uppercase"><p>Immeuble Bahati, Bunia, RDC</p></div>

              <div className="mt-6 flex flex-col items-center gap-2">
                <div className="p-2 border-2 border-black rounded-xl bg-white shadow-sm">
                    <QrCode size={70} className="text-black opacity-100" />
                </div>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-40">Authenticité Certifiée</p>
              </div>

              <div className="mt-6 p-2 bg-gray-100 rounded-xl inline-block w-full text-center">
                <p className="text-[9px] font-black">REÇU: #{lastTransaction?.id.toUpperCase().substring(0, 10)}</p>
              </div>
              <p className="text-[8px] mt-2 opacity-40 font-black tracking-widest">{lastTransaction?.date}</p>
            </div>
            
            <div className="space-y-3 mb-6">
              {lastTransaction?.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="flex-1 pr-4"><div className="font-bold text-[10px] uppercase">{item.name}</div><div className="text-[9px] opacity-60 italic">{item.quantity}x @ ${item.price?.toFixed(2)}</div></div>
                  <span className="font-bold text-[10px]">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-gray-100 pt-4 space-y-2">
              <div className="flex justify-between text-lg font-black border-t-2 border-dashed border-gray-300 pt-3">
                <span>TOTAL PAYÉ ($)</span>
                <span>${lastTransaction?.total.toFixed(2)}</span>
              </div>
              {lastTransaction?.mode === 'PI_NETWORK' && lastTransaction.piTxId && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                  <p className="text-[8px] font-black uppercase text-gray-400 flex items-center gap-1.5"><Lock size={10}/> HACHARAGE BLOCKCHAIN</p>
                  <p className="text-[8px] font-mono break-all leading-tight opacity-70">{lastTransaction.piTxId}</p>
                </div>
              )}
            </div>

            {/* CACHET AUTOMATIQUE HAUTE SÉCURITÉ */}
            <div className="mt-8 flex flex-col items-center gap-4 pt-6 border-t-2 border-dashed border-gray-200 relative">
              <div className="w-28 h-28 rounded-full border-[3px] border-double border-blue-900 flex flex-col items-center justify-center p-1 rotate-[-12deg] opacity-95 relative">
                <div className="absolute inset-0 border border-blue-900/20 rounded-full scale-[0.95]" />
                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-60">
                  <path id="receiptCirclePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
                  <text className="text-[4px] font-black fill-blue-900 uppercase">
                    <textPath xlinkHref="#receiptCirclePath">
                      CERTIFIED BY DOUBLE KING SHOP • ORIGINAL DOCUMENT • CERTIFIED BY DOUBLE KING SHOP • 
                    </textPath>
                  </text>
                </svg>
                <p className="text-[6px] font-black text-blue-900 leading-none">DOUBLE KING SHOP</p>
                <ShieldCheck size={26} className="text-blue-900 my-1.5" />
                <p className="text-[6px] font-bold text-blue-900 uppercase">CERTIFIED POS</p>
                <p className="text-[7px] font-black text-blue-900 uppercase tracking-widest mt-1">BUNIA</p>
              </div>
              
              <div className="text-center">
                  <p className="text-[9px] font-black uppercase italic text-blue-900">Expert Bahati Nyeke</p>
                  <p className="text-[7px] font-bold text-gray-400 uppercase tracking-[0.3em]">Validateur de Caisse</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 flex gap-4 no-print border-t border-gray-200">
            <Button className="flex-1 bg-black text-white rounded-xl" onClick={() => window.print()}><Printer size={20} /> Imprimer</Button>
            <Button className="flex-1 bg-white text-black border-gray-200" variant="outline" onClick={handleDownloadReceiptPDF} disabled={isGeneratingPDF}>
              {isGeneratingPDF ? <Loader2 className="animate-spin" /> : <Download size={20} />} PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(POS);
