
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useState } from "react";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { Product, PaymentMode } from "@/lib/types";
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
  Loader2
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

interface CartItem extends Product {
  quantity: number;
}

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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
    // Simulate payment gateway delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setShowConfirmation(false);
    
    toast({
      title: "Transaction Réussie !",
      description: `Vente effectuée via ${paymentMode.replace('_', ' ')}. Total: $${total.toFixed(2)}`,
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
        {/* Product Selection Area */}
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
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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

        {/* Cart / Checkout Area */}
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
                  <p>Le panier est vide. Sélectionnez des produits pour commencer.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {cart.map(item => (
                    <div key={item.id} className="p-4 flex items-center justify-between group">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">${item.sellingPrice.toFixed(2)} l'unité</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-accent"><Minus size={14}/></button>
                          <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-accent"><Plus size={14}/></button>
                        </div>
                        <p className="text-sm font-bold w-16 text-right">${(item.sellingPrice * item.quantity).toFixed(2)}</p>
                        <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col border-t border-white/5 p-4 gap-4 bg-black/20">
              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-xl">
                  <span>Total</span>
                  <span className="text-accent">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-3 gap-2">
                <Button 
                  variant={paymentMode === "CASH" ? "default" : "outline"} 
                  className={cn("flex-col h-20 gap-1 border-white/10 transition-all", paymentMode === "CASH" && "bg-primary border-primary")}
                  onClick={() => setPaymentMode("CASH")}
                >
                  <Banknote size={20} />
                  <span className="text-[10px] font-bold">CASH</span>
                </Button>
                <Button 
                  variant={paymentMode === "MOBILE_MONEY" ? "default" : "outline"} 
                  className={cn("flex-col h-20 gap-1 border-white/10 transition-all", paymentMode === "MOBILE_MONEY" && "bg-primary border-primary")}
                  onClick={() => setPaymentMode("MOBILE_MONEY")}
                >
                  <Smartphone size={20} />
                  <span className="text-[10px] font-bold text-center">MOBILE MONEY</span>
                </Button>
                <Button 
                  variant={paymentMode === "PI_NETWORK" ? "default" : "outline"} 
                  className={cn("flex-col h-20 gap-1 border-white/10 transition-all", paymentMode === "PI_NETWORK" && "bg-primary border-primary")}
                  onClick={() => setPaymentMode("PI_NETWORK")}
                >
                  <Coins size={20} />
                  <span className="text-[10px] font-bold">PI NETWORK</span>
                </Button>
              </div>

              <Button 
                className="w-full h-14 bg-accent text-accent-foreground hover:bg-accent/90 text-lg font-bold gap-2 neon-glow"
                disabled={cart.length === 0}
                onClick={handleCheckout}
              >
                <CheckCircle2 />
                Terminer la Vente
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="bg-card border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle className="text-2xl">Confirmation du Paiement</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Veuillez confirmer le règlement de la commande.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 flex flex-col items-center gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground uppercase tracking-widest">Montant Total</p>
              <h2 className="text-4xl font-black text-accent">${total.toFixed(2)}</h2>
            </div>

            <div className="w-full p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">Mode de Paiement</span>
                <Badge variant="secondary" className="bg-accent/20 text-accent uppercase px-3 py-1">
                  {paymentMode.replace('_', ' ')}
                </Badge>
              </div>

              {paymentMode === "PI_NETWORK" && (
                <div className="flex flex-col items-center gap-3 p-4 bg-black/40 rounded-lg">
                  <QrCode size={120} className="text-white opacity-80" />
                  <p className="text-xs text-center text-muted-foreground">Scannez pour payer avec votre wallet Pi</p>
                </div>
              )}

              {paymentMode === "MOBILE_MONEY" && (
                <div className="flex flex-col items-center gap-3 p-4 bg-black/40 rounded-lg">
                  <Smartphone size={48} className="text-accent" />
                  <p className="text-sm font-bold">En attente du push USSD...</p>
                  <p className="text-xs text-muted-foreground">Entrez votre code secret sur votre téléphone</p>
                </div>
              )}

              {paymentMode === "CASH" && (
                <div className="flex flex-col items-center gap-3 p-4 bg-black/40 rounded-lg">
                  <Banknote size={48} className="text-green-500" />
                  <p className="text-sm font-bold">Réception des espèces</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmation(false)} className="border-white/10">
              Annuler
            </Button>
            <Button 
              className="bg-accent text-accent-foreground hover:bg-accent/80 min-w-[150px]"
              onClick={confirmPayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                "Valider le Paiement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
