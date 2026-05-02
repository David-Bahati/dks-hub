
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useState, useEffect, useMemo } from "react";
import { Product, PaymentMode } from "@/lib/types";
import { PI_CONVERSION_RATE } from "@/lib/constants";
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
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, increment, query, orderBy, limit } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import withAuth from "@/components/auth/withAuth";

interface CartItem extends Product {
  quantity: number;
}

function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [lastTransaction, setLastTransaction] = useState<{
    id: string;
    items: any[];
    total: number;
    mode: string;
    date: string;
    customerName: string;
  } | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch Products
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
      setLoadingProducts(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Recent Sales for History
  useEffect(() => {
    const q = query(collection(db, "sales"), orderBy("createdAt", "desc"), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        formattedDate: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toLocaleString('fr-FR') : "Date inconnue"
      }));
      setRecentSales(sales);
    });
    return () => unsubscribe();
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

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowConfirmation(true);
  };

  const confirmPayment = async () => {
    setIsProcessing(true);
    const finalCustomerName = customerName.trim() || "Client Comptoir";
    
    try {
        const saleData = {
            userId: user?.uid,
            customerName: finalCustomerName,
            items: cart.map(item => ({
                productId: item.id,
                name: item.name, // Important to save name for reprinting
                quantity: item.quantity,
                price: item.price || item.sellingPrice || 0
            })),
            totalAmount: total,
            paymentMode: paymentMode,
            createdAt: serverTimestamp(),
            status: 'Payé'
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
            mode: paymentMode,
            date: now,
            customerName: finalCustomerName
        });

        toast({
            title: "Vente Terminée",
            description: `Reçu généré pour ${finalCustomerName}`,
        });

        setCart([]);
        setCustomerName("");
        setShowConfirmation(false);
        setShowReceipt(true);
    } catch (error) {
        console.error("Erreur transaction:", error);
        toast({ title: "Erreur", description: "La transaction a échoué.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  const reprintReceipt = (sale: any) => {
    setLastTransaction({
        id: sale.id,
        items: sale.items,
        total: sale.totalAmount,
        mode: sale.paymentMode,
        date: sale.formattedDate,
        customerName: sale.customerName
    });
    setShowReceipt(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-to-print, .receipt-to-print * {
            visibility: visible;
          }
          .receipt-to-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 10px !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
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
            
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0">
                        <History size={24} />
                    </Button>
                </SheetTrigger>
                <SheetContent className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-xl font-black uppercase italic flex items-center gap-3">
                            <Clock className="text-accent" /> Historique Ventes
                        </SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 overflow-y-auto max-h-[85vh] pr-2 custom-scrollbar">
                        {recentSales.map(sale => (
                            <div key={sale.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3 hover:border-accent/20 transition-all group">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-sm uppercase italic">#{sale.id.substring(0, 8)}</p>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{sale.formattedDate}</p>
                                    </div>
                                    <Badge className="bg-accent/10 text-accent font-black uppercase text-[10px] border-none">
                                        {sale.paymentMode?.replace('_', ' ')}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-xs text-white/60">Client: {sale.customerName}</p>
                                        <p className="text-lg font-black text-white">${sale.totalAmount.toFixed(2)}</p>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-9 gap-2 font-black uppercase italic text-[10px] bg-white/5 hover:bg-accent hover:text-black rounded-xl"
                                        onClick={() => reprintReceipt(sale)}
                                    >
                                        <Printer size={14} /> Reçu
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {recentSales.length === 0 && (
                            <div className="text-center py-20 opacity-20 italic">Aucune vente récente</div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
          </div>
          
          {loadingProducts ? (
              <div className="flex-1 flex items-center justify-center opacity-50">
                  <Loader2 className="animate-spin h-10 w-10 text-accent" />
              </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(100vh-250px)] pb-10 scrollbar-hide">
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
                    <div className={cn(
                        "absolute top-2 right-2 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-black uppercase",
                        product.stockQuantity < 5 ? "bg-destructive/80 text-white" : "bg-black/60 text-accent"
                    )}>
                        {product.stockQuantity} dispos
                    </div>
                    </div>
                    <CardContent className="p-4">
                    <h3 className="font-bold text-sm line-clamp-1">{product.name}</h3>
                    <p className="text-accent font-black mt-1">${(product.sellingPrice || product.price || 0).toFixed(2)}</p>
                    </CardContent>
                </Card>
                ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card className="glossy-card border-none flex-1 flex flex-col overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 font-black italic uppercase">
                  <ShoppingCart size={20} className="text-accent" />
                  Panier Caisse
                </CardTitle>
                <Badge className="bg-accent text-accent-foreground font-black">{cart.length} ITEMS</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-hide">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30 p-10 text-center">
                  <ShoppingCart size={48} className="mb-4" />
                  <p className="font-bold uppercase text-xs italic">Prêt pour une nouvelle vente...</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {cart.map(item => (
                    <div key={item.id} className="p-4 flex items-center justify-between group bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold">{item.name}</h4>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">
                            ${(item.sellingPrice || item.price || 0).toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-black/40 rounded-xl px-2 py-1 border border-white/5">
                          <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-accent transition-colors"><Minus size={14}/></button>
                          <span className="w-6 text-center text-sm font-black">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-accent transition-colors"><Plus size={14}/></button>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col border-t border-white/5 p-6 gap-6 bg-black/40 backdrop-blur-xl">
              <div className="w-full space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black uppercase text-muted-foreground tracking-widest">Total Transaction</span>
                  <div className="text-right">
                    <span className="text-3xl font-black text-accent">${total.toFixed(2)}</span>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">≈ {(total / PI_CONVERSION_RATE).toFixed(4)} π</p>
                  </div>
                </div>
              </div>

              <div className="w-full grid grid-cols-3 gap-2">
                <Button 
                  variant="outline"
                  className={cn("flex-col h-16 gap-1 border-white/10 rounded-2xl transition-all", paymentMode === "CASH" ? "bg-primary border-primary text-white" : "bg-white/5")}
                  onClick={() => setPaymentMode("CASH")}
                >
                  <Banknote size={18} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">Cash</span>
                </Button>
                <Button 
                  variant="outline"
                  className={cn("flex-col h-16 gap-1 border-white/10 rounded-2xl transition-all", paymentMode === "MOBILE_MONEY" ? "bg-primary border-primary text-white" : "bg-white/5")}
                  onClick={() => setPaymentMode("MOBILE_MONEY")}
                >
                  <Smartphone size={18} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">M-Money</span>
                </Button>
                <Button 
                  variant="outline"
                  className={cn("flex-col h-16 gap-1 border-white/10 rounded-2xl transition-all", paymentMode === "PI_NETWORK" ? "bg-primary border-primary text-white" : "bg-white/5")}
                  onClick={() => setPaymentMode("PI_NETWORK")}
                >
                  <Coins size={18} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">Pi Network</span>
                </Button>
              </div>

              <Button 
                className="w-full h-16 bg-accent text-accent-foreground hover:bg-accent/90 text-lg font-black gap-3 rounded-2xl neon-glow uppercase italic"
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckout}
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
                Valider la Vente
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="bg-card border-white/10 text-foreground rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic uppercase text-center">Finaliser le Paiement</DialogTitle>
          </DialogHeader>
          <div className="py-6 flex flex-col gap-6">
            <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                    <UserIcon size={12} className="text-accent" /> Nom du Client (Optionnel)
                </Label>
                <Input 
                    placeholder="Ex: John Doe" 
                    className="h-14 bg-background/50 border-white/10 rounded-xl font-bold"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                />
            </div>

            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground uppercase font-black tracking-[0.2em] mb-2">Montant à encaisser</p>
              <h2 className="text-5xl font-black text-accent">${total.toFixed(2)}</h2>
            </div>
            
            <div className="w-full p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase text-xs">Mode de paiement sélectionné</span>
                <Badge className="bg-accent/20 text-accent font-black border-none px-4 py-1">{paymentMode.replace('_', ' ')}</Badge>
              </div>
              {paymentMode === "PI_NETWORK" && (
                <div className="flex flex-col items-center p-6 bg-black/40 rounded-2xl border border-dashed border-white/20">
                  <QrCode size={120} className="text-white" />
                  <p className="text-[10px] mt-4 font-black uppercase tracking-widest text-muted-foreground">Scanner via Pi Browser</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="ghost" onClick={() => setShowConfirmation(false)} className="rounded-xl font-bold uppercase text-xs">Annuler</Button>
            <Button className="bg-accent text-accent-foreground min-w-[160px] rounded-xl font-black uppercase italic" onClick={confirmPayment} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="animate-spin" /> : "Confirmer la Vente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="bg-white text-black p-0 overflow-hidden sm:max-w-[400px] rounded-3xl shadow-2xl border-none flex flex-col max-h-[95vh]">
          <div className="flex-1 overflow-y-auto p-8 font-mono text-[10px] leading-tight receipt-to-print custom-scrollbar">
            <div className="text-center mb-4 border-b-2 border-dashed border-gray-300 pb-4">
              <div className="flex justify-center mb-2">
                 <div className="bg-black text-white px-3 py-1 font-black text-lg italic tracking-tighter">DKS SHOP</div>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Matériel Informatique Premium</p>
              <div className="mt-2 space-y-0.5 text-[8px] font-bold uppercase">
                <p>Immeuble Bahati, Boulevard de la Libération</p>
                <p>Bunia, Ituri, RDC | Tél: +243 823 038 945</p>
              </div>

              <div className="mt-4 flex flex-col items-center gap-1">
                <div className="p-1 border-2 border-black rounded-md bg-white">
                    <QrCode size={60} />
                </div>
                <p className="text-[7px] font-black uppercase tracking-widest opacity-40">Vérifier la Transaction</p>
              </div>

              <div className="mt-4 p-1.5 bg-gray-100 rounded-md inline-block w-full text-center">
                <p className="text-[8px] font-black">REÇU: #{lastTransaction?.id.toUpperCase().substring(0, 10)}</p>
                <p className="text-[8px] font-black">CLIENT: {lastTransaction?.customerName.toUpperCase()}</p>
              </div>
              <p className="text-[7px] mt-1 opacity-40 font-black">{lastTransaction?.date}</p>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between font-black border-b border-gray-100 pb-1 mb-1 uppercase text-[9px]">
                <span>Description</span>
                <span>Total</span>
              </div>
              {lastTransaction?.items.map((item, idx) => {
                const unitPrice = item.price || item.sellingPrice || 0;
                return (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex-1 pr-2">
                      <div className="font-bold">{(item.name || "Produit").toUpperCase()}</div>
                      <div className="text-[8px] opacity-60">
                        {item.quantity}x @${unitPrice.toFixed(2)}
                      </div>
                    </div>
                    <span className="font-bold">${(unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-100 pt-2 space-y-1">
              <div className="flex justify-between font-bold text-[8px]">
                <span>SOUS-TOTAL (USD)</span>
                <span>${lastTransaction?.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-[8px] opacity-40">
                <span>TAXE (0%)</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-base font-black border-t-2 border-dashed border-gray-300 pt-2 mt-1">
                <span>TOTAL PAYÉ</span>
                <span>${lastTransaction?.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold opacity-60 text-[8px] mt-1">
                <span>VALEUR PI (π)</span>
                <span>{(lastTransaction ? lastTransaction.total / PI_CONVERSION_RATE : 0).toFixed(6)} π</span>
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 italic font-black">
                <span>RÈGLEMENT :</span>
                <span>{lastTransaction?.mode.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-[8px] font-black uppercase tracking-tighter opacity-40 italic border-y border-gray-100 py-1">
                Ni repris, ni échangés après sortie
              </p>
            </div>

            <div className="text-center pt-3">
              <div className="bg-black text-white px-4 py-1.5 inline-block font-black uppercase italic tracking-widest text-[9px] mb-2">
                 Merci de votre confiance
              </div>
              <p className="text-[7px] font-bold opacity-40 uppercase tracking-widest">À bientôt chez Double King Shop</p>
            </div>
          </div>

          <div className="bg-gray-100 p-4 flex gap-3 no-print border-t border-gray-200">
            <Button 
                className="flex-1 gap-2 bg-black text-white hover:bg-black/90 rounded-xl font-black uppercase text-[10px] h-14" 
                onClick={() => window.print()}
            >
              <Printer size={18} /> Imprimer le Ticket
            </Button>
            <Button 
                className="flex-1 gap-2 border-black text-black hover:bg-black/5 rounded-xl font-black uppercase text-[10px] h-14" 
                variant="outline" 
                onClick={() => setShowReceipt(false)}
            >
              <ArrowLeft size={18} /> Retour
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(POS);
