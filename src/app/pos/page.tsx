
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useState, useRef } from "react";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { Product, PaymentMode, PI_CONVERSION_RATE } from "@/lib/types";
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
  Printer,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface CartItem extends Product {
  quantity: number;
}

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<{
    id: string;
    items: CartItem[];
    total: number;
    mode: PaymentMode;
    date: string;
  } | null>(null);

  const { toast } = useToast();

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowConfirmation(true);
  };

  const confirmPayment = async () => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const transactionId = Math.random().toString(36).substring(2, 9).toUpperCase();
    const now = new Date().toLocaleString();
    
    setLastTransaction({
      id: transactionId,
      items: [...cart],
      total: total,
      mode: paymentMode,
      date: now
    });

    setIsProcessing(false);
    setShowConfirmation(false);
    setShowReceipt(true);
    
    toast({
      title: "Vente Terminée",
      description: `Reçu généré pour la transaction #${transactionId}`,
    });
    setCart([]);
  };

  const filteredProducts = MOCK_PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Rechercher des produits..." 
              className="pl-10 h-12 bg-card/50 border-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(100vh-250px)] pb-10">
            {filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className="glossy-card cursor-pointer hover:border-accent/50 transition-all group border-none"
                onClick={() => addToCart(product)}
              >
                <div className="aspect-square relative overflow-hidden rounded-t-lg">
                  <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-accent">
                    {product.stockQuantity} en stock
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                  <p className="text-accent font-bold mt-1">${product.sellingPrice.toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="glossy-card border-none flex-1 flex flex-col">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart size={20} className="text-accent" />
                  Commande Actuelle
                </CardTitle>
                <span className="text-xs text-muted-foreground">{cart.length} articles</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30 p-10 text-center">
                  <ShoppingCart size={48} className="mb-4" />
                  <p>Le panier est vide.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {cart.map(item => (
                    <div key={item.id} className="p-4 flex items-center justify-between group">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">${item.sellingPrice.toFixed(2)} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1">
                          <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }} className="hover:text-accent"><Minus size={14}/></button>
                          <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                          <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }} className="hover:text-accent"><Plus size={14}/></button>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="text-muted-foreground hover:text-destructive"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col border-t border-white/5 p-4 gap-4 bg-black/20">
              <div className="w-full space-y-2">
                <div className="flex justify-between font-bold text-xl">
                  <span>Total</span>
                  <span className="text-accent">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-3 gap-2">
                <Button 
                  variant={paymentMode === "CASH" ? "default" : "outline"} 
                  className={cn("flex-col h-16 gap-1 border-white/10", paymentMode === "CASH" && "bg-primary border-primary")}
                  onClick={() => setPaymentMode("CASH")}
                >
                  <Banknote size={18} />
                  <span className="text-[10px] font-bold uppercase">Cash</span>
                </Button>
                <Button 
                  variant={paymentMode === "MOBILE_MONEY" ? "default" : "outline"} 
                  className={cn("flex-col h-16 gap-1 border-white/10", paymentMode === "MOBILE_MONEY" && "bg-primary border-primary")}
                  onClick={() => setPaymentMode("MOBILE_MONEY")}
                >
                  <Smartphone size={18} />
                  <span className="text-[10px] font-bold uppercase">M-Money</span>
                </Button>
                <Button 
                  variant={paymentMode === "PI_NETWORK" ? "default" : "outline"} 
                  className={cn("flex-col h-16 gap-1 border-white/10", paymentMode === "PI_NETWORK" && "bg-primary border-primary")}
                  onClick={() => setPaymentMode("PI_NETWORK")}
                >
                  <Coins size={18} />
                  <span className="text-[10px] font-bold uppercase">Pi Net</span>
                </Button>
              </div>

              <Button 
                className="w-full h-14 bg-accent text-accent-foreground hover:bg-accent/90 text-lg font-bold gap-2 neon-glow"
                disabled={cart.length === 0}
                onClick={handleCheckout}
              >
                <CheckCircle2 />
                Valider la Vente
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="bg-card border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl">Confirmation</DialogTitle>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground uppercase tracking-widest">Montant à régler</p>
              <h2 className="text-4xl font-black text-accent">${total.toFixed(2)}</h2>
            </div>
            <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span>Mode :</span>
                <Badge className="bg-accent/20 text-accent">{paymentMode.replace('_', ' ')}</Badge>
              </div>
              {paymentMode === "PI_NETWORK" && (
                <div className="flex flex-col items-center p-4 bg-black/20 rounded-lg border border-dashed border-white/10">
                  <QrCode size={120} />
                  <p className="text-xs mt-2 opacity-50">Scanner avec Pi Browser</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>Annuler</Button>
            <Button className="bg-accent text-accent-foreground min-w-[120px]" onClick={confirmPayment} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="animate-spin" /> : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="bg-white text-black p-0 overflow-hidden sm:max-w-[400px]">
          <div className="p-8 font-mono text-sm">
            <div className="text-center mb-6 border-b border-dashed border-gray-300 pb-4">
              <h2 className="text-2xl font-black uppercase tracking-tighter">dks SHOP</h2>
              <p className="text-[10px] mt-1">Professional Retail Management</p>
              <p className="text-[10px] mt-2">ID: {lastTransaction?.id}</p>
              <p className="text-[10px]">{lastTransaction?.date}</p>
            </div>
            
            <div className="space-y-2 mb-6">
              {lastTransaction?.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.quantity}x {item.name.substring(0, 20)}</span>
                  <span>${(item.sellingPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 pt-4 space-y-1">
              <div className="flex justify-between font-bold">
                <span>TOTAL USD</span>
                <span>${lastTransaction?.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs opacity-70">
                <span>TOTAL PI</span>
                <span>{(lastTransaction ? lastTransaction.total / PI_CONVERSION_RATE : 0).toFixed(4)} π</span>
              </div>
              <div className="flex justify-between text-xs mt-4">
                <span>PAYÉ VIA :</span>
                <span className="font-bold">{lastTransaction?.mode.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="text-center mt-10 border-t border-dashed border-gray-300 pt-6">
              <p className="text-[10px] font-bold uppercase">Merci de votre confiance !</p>
              <p className="text-[8px] mt-2 italic">A bientôt chez dks ShopManager</p>
            </div>
          </div>
          <div className="bg-gray-100 p-4 flex gap-2">
            <Button className="flex-1 gap-2" variant="default" onClick={() => window.print()}>
              <Printer size={16} /> Imprimer
            </Button>
            <Button className="flex-1 gap-2" variant="outline" onClick={() => setShowReceipt(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
