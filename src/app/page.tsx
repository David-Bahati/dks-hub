
"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Coins, 
  Smartphone, 
  Zap, 
  Plus,
  Minus,
  Trash2,
  PackageCheck,
  Search,
  CheckCircle,
  Printer,
  ChevronRight
} from "lucide-react";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { Product, PI_CONVERSION_RATE } from "@/lib/types";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface CartItem extends Product {
  quantity: number;
}

export default function LandingPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderSummary, setOrderSummary] = useState<{
    id: string;
    items: CartItem[];
    total: number;
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
    toast({
      title: "Ajouté au panier",
      description: `${product.name} a été ajouté.`,
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const totalUSD = cart.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0);
  const totalPi = totalUSD / PI_CONVERSION_RATE;

  const handleCheckout = async () => {
    setIsOrdering(true);
    // Simulate payment process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const summary = {
      id: Math.random().toString(36).substring(2, 9).toUpperCase(),
      items: [...cart],
      total: totalUSD,
      date: new Date().toLocaleString()
    };
    
    setOrderSummary(summary);
    setCart([]);
    setIsOrdering(false);
    setShowReceipt(true);
    
    toast({
      title: "Commande Confirmée",
      description: "Votre reçu a été généré.",
    });
  };

  const publishedProducts = MOCK_PRODUCTS.filter(p => p.isPublished && p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-background/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center neon-glow">
              <span className="text-white font-bold text-lg">dks</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Shop<span className="text-accent">Manager</span></span>
          </div>
          
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative border-white/10 hover:bg-white/5">
                  <ShoppingCart size={20} />
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {cart.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-card border-l border-white/10 flex flex-col h-full">
                <SheetHeader>
                  <SheetTitle className="text-xl font-bold flex items-center gap-2">
                    <ShoppingCart className="text-accent" /> Votre Panier
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-6">
                  {cart.length === 0 ? (
                    <div className="text-center text-muted-foreground mt-20">
                      <PackageCheck size={48} className="mx-auto mb-4 opacity-20" />
                      <p>Votre panier est vide.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map(item => (
                        <div key={item.id} className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/5 group">
                          <img src={item.imageUrl} className="w-16 h-16 rounded-lg object-cover" />
                          <div className="flex-1">
                            <h4 className="text-sm font-bold line-clamp-1">{item.name}</h4>
                            <p className="text-xs text-accent font-bold">${item.sellingPrice}</p>
                            <div className="flex items-center gap-3 mt-2">
                               <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-accent"><Minus size={14}/></button>
                               <span className="text-sm font-bold">{item.quantity}</span>
                               <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-accent"><Plus size={14}/></button>
                            </div>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive self-start">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {cart.length > 0 && (
                  <SheetFooter className="border-t border-white/10 pt-6 flex-col items-stretch gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total USD</span>
                        <span className="font-bold">${totalUSD.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="text-accent font-bold">Total Pi</span>
                        <span className="text-accent font-black">{totalPi.toFixed(4)} π</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-accent text-accent-foreground font-bold h-12 neon-glow gap-2"
                      onClick={handleCheckout}
                      disabled={isOrdering}
                    >
                      {isOrdering ? "Traitement..." : "Finaliser la commande"}
                      {!isOrdering && <ChevronRight size={18} />}
                    </Button>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>

            <Link href="/dashboard">
              <Button className="bg-primary hover:bg-primary/90 text-sm font-bold">Espace Pro</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-10 pointer-events-none">
           <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent rounded-full blur-[150px]" />
           <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary rounded-full blur-[150px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center">
          <Badge className="mb-6 bg-accent/10 text-accent border-accent/20 px-4 py-1.5 font-bold">
            ⚡ Taux Pi Network : 1 π = ${PI_CONVERSION_RATE}
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black font-headline mb-6 tracking-tighter leading-tight">
            LE MATÉRIEL <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">DU FUTUR ICI</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-12">
            Paiement sécurisé en Pi Network, Mobile Money ou Cash. 
            Livraison express pour tous vos setups gaming et bureautiques.
          </p>

          <div className="relative max-w-2xl mx-auto mb-16">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Chercher un clavier, souris, écran..." 
              className="h-14 pl-12 bg-card/50 border-white/10 rounded-2xl focus:border-accent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Product List */}
      <section className="pb-24 max-w-7xl mx-auto px-4 w-full">
        <h2 className="text-2xl font-black mb-10 flex items-center gap-3">
          <Zap className="text-accent" /> CATALOGUE DISPONIBLE
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {publishedProducts.map(product => {
            const piPrice = product.sellingPrice / PI_CONVERSION_RATE;
            return (
              <div key={product.id} className="glossy-card border-none rounded-2xl overflow-hidden flex flex-col group">
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img src={product.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-accent">
                    Stock: {product.stockQuantity}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-sm mb-2 line-clamp-1">{product.name}</h3>
                  <div className="mt-auto space-y-1 mb-4">
                    <div className="text-lg font-black">${product.sellingPrice.toFixed(2)}</div>
                    <div className="text-xs font-bold text-accent">{piPrice.toFixed(4)} π</div>
                  </div>
                  <Button 
                    onClick={() => addToCart(product)}
                    className="w-full bg-white/5 hover:bg-accent hover:text-accent-foreground border border-white/10 transition-all font-bold text-xs gap-2"
                  >
                    <Plus size={14} /> Ajouter
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="bg-white text-black p-0 overflow-hidden sm:max-w-[400px]">
          <div className="p-8 font-mono text-sm">
            <div className="text-center mb-6 border-b border-dashed border-gray-300 pb-4">
              <div className="flex justify-center mb-2">
                <CheckCircle className="text-green-600" size={40} />
              </div>
              <h2 className="text-2xl font-black uppercase">COMMANDE RÉUSSIE</h2>
              <p className="text-[10px] mt-1">ID: #{orderSummary?.id}</p>
              <p className="text-[10px]">{orderSummary?.date}</p>
            </div>
            
            <div className="space-y-2 mb-6">
              {orderSummary?.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.quantity}x {item.name.substring(0, 15)}</span>
                  <span>${(item.sellingPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 pt-4 space-y-2">
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL</span>
                <span>${orderSummary?.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-accent font-bold">
                <span>TOTAL PI</span>
                <span>{(orderSummary ? orderSummary.total / PI_CONVERSION_RATE : 0).toFixed(4)} π</span>
              </div>
            </div>

            <div className="text-center mt-8 text-[10px] space-y-1 opacity-70">
              <p>Veuillez présenter ce reçu à la caisse</p>
              <p>pour le retrait de vos articles.</p>
              <p className="font-bold mt-4">MERCI DE VOTRE ACHAT !</p>
            </div>
          </div>
          <div className="bg-gray-100 p-4 flex gap-2">
            <Button className="flex-1 gap-2" onClick={() => window.print()}>
              <Printer size={16} /> Imprimer Reçu
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => setShowReceipt(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="mt-auto py-10 border-t border-white/5 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-muted-foreground">© 2024 dks ShopManager. Propulsé par Pi Network.</p>
          <div className="flex gap-4">
             <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground"><Coins size={12}/> Pi Network</div>
             <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground"><Smartphone size={12}/> Mobile Money</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
