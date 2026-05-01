
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
  Printer
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
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, increment } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import withAuth from "@/components/auth/withAuth";

interface CartItem extends Product {
  quantity: number;
}

function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [lastTransaction, setLastTransaction] = useState<{
    id: string;
    items: CartItem[];
    total: number;
    mode: PaymentMode;
    date: string;
  } | null>(null);

  const { toast } = useToast();
  const { user } = useAuth();

  // Charger les produits en temps réel
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
            toast({ title: "Stock insuffisant", description: "Vous ne pouvez pas vendre plus que le stock disponible.", variant: "destructive" });
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
    
    try {
        // 1. Enregistrer la vente dans Firestore
        const saleRef = await addDoc(collection(db, "sales"), {
            userId: user?.uid,
            items: cart.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price || item.sellingPrice || 0
            })),
            totalAmount: total,
            paymentMode: paymentMode,
            createdAt: serverTimestamp(),
            status: 'Payé'
        });

        // 2. Mettre à jour les stocks de chaque produit
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
            date: now
        });

        toast({
            title: "Vente Terminée",
            description: `Reçu généré pour la transaction #${saleRef.id.substring(0, 8)}`,
        });

        setCart([]);
        setShowConfirmation(false);
        setShowReceipt(true);
    } catch (error) {
        console.error("Erreur transaction:", error);
        toast({ title: "Erreur", description: "La transaction a échoué.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Rechercher des produits ou catégories..." 
              className="pl-10 h-14 bg-card/40 border-white/10 rounded-2xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {loadingProducts ? (
              <div className="flex-1 flex items-center justify-center opacity-50">
                  <Loader2 className="animate-spin h-10 w-10" />
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
          <div className="py-8 flex flex-col items-center gap-8">
            <div className="text-center">
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
                  <QrCode size={160} className="text-white" />
                  <p className="text-[10px] mt-4 font-black uppercase tracking-widest text-muted-foreground">Scanner via Pi Browser</p>
                </div>
              )}
              {paymentMode === "MOBILE_MONEY" && (
                <div className="text-center p-6 bg-black/40 rounded-2xl border border-dashed border-white/20">
                   <p className="text-sm font-bold">Veuillez composer le code USSD sur le téléphone du client.</p>
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
        <DialogContent className="bg-white text-black p-0 overflow-hidden sm:max-w-[420px] rounded-3xl shadow-2xl border-none">
          <div className="p-10 font-mono text-[11px] leading-relaxed">
            <div className="text-center mb-10 border-b-2 border-dashed border-gray-300 pb-8">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">dks SHOP</h2>
              <p className="text-[10px] font-bold mt-1 uppercase tracking-widest opacity-60">Professional Hardware Solutions</p>
              <p className="text-[9px] mt-4 font-bold">BUNIA, IMMEUBLE BAHATI</p>
              <p className="text-[9px] mt-1 font-bold">TRANS ID: {lastTransaction?.id.toUpperCase()}</p>
              <p className="text-[9px] mt-1 font-bold">{lastTransaction?.date}</p>
            </div>
            
            <div className="space-y-3 mb-10">
              <div className="flex justify-between font-bold border-b border-gray-100 pb-2 mb-2">
                <span>DESCRIPTION</span>
                <span>TOTAL</span>
              </div>
              {lastTransaction?.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="flex-1 pr-4">{item.quantity}x {item.name.toUpperCase()}</span>
                  <span className="font-bold">${((item.sellingPrice || item.price || 0) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-dashed border-gray-300 pt-8 space-y-2">
              <div className="flex justify-between text-lg font-black">
                <span>TOTAL PAYÉ (USD)</span>
                <span>${lastTransaction?.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold opacity-60">
                <span>VALEUR PI (π)</span>
                <span>{(lastTransaction ? lastTransaction.total / PI_CONVERSION_RATE : 0).toFixed(6)} π</span>
              </div>
              <div className="flex justify-between mt-8 pt-4 border-t border-gray-100 italic">
                <span>MODE DE RÈGLEMENT :</span>
                <span className="font-bold uppercase">{lastTransaction?.mode.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="text-center mt-12 border-t-2 border-dashed border-gray-300 pt-10">
              <div className="bg-black text-white px-4 py-2 inline-block font-black uppercase italic tracking-widest mb-4">
                 Merci de votre visite
              </div>
              <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest">A bientôt chez Double King Shop</p>
            </div>
          </div>
          <div className="bg-gray-100 p-6 flex gap-3">
            <Button className="flex-1 gap-2 bg-black text-white hover:bg-black/90 rounded-xl font-bold uppercase text-[10px]" onClick={() => window.print()}>
              <Printer size={16} /> Imprimer Reçu
            </Button>
            <Button className="flex-1 gap-2 border-gray-300 rounded-xl font-bold uppercase text-[10px]" variant="outline" onClick={() => setShowReceipt(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(POS);
