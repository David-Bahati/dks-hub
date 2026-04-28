
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
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
  ChevronRight,
  User,
  ArrowRight,
  Wallet,
  CreditCard
} from "lucide-react";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { Product, PI_CONVERSION_RATE, User as UserType } from "@/lib/types";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';
import { createPiPayment } from "@/lib/pi-payment";

interface CartItem extends Product {
  quantity: number;
}

export default function LandingPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [orderSummary, setOrderSummary] = useState<{
    id: string;
    items: CartItem[];
    total: number;
    date: string;
    paymentMethod: string;
  } | null>(null);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem("dks_user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

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
      description: `${product.name} a été ajouté avec succès.`,
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

  const completeOrder = (method: string) => {
    const summary = {
      id: Math.random().toString(36).substring(2, 9).toUpperCase(),
      items: [...cart],
      total: totalUSD,
      date: new Date().toLocaleString(),
      paymentMethod: method,
    };
    
    setOrderSummary(summary);
    setCart([]);
    setShowReceipt(true);
    
    toast({
      title: "Commande Validée et Payée",
      description: "Votre reçu de retrait a été généré avec succès.",
      className: "bg-green-600 border-none text-white"
    });

    setIsOrdering(false);
  }

  const handlePayment = async (method: string) => {
    if (!currentUser) {
      router.push("/login");
      return toast({ title: "Connexion requise", variant: "destructive" });
    }

    setIsOrdering(true);
    setShowPaymentModal(false);

    switch (method) {
      case 'Pi Network':
        const paymentData = {
            amount: parseFloat(totalPi.toFixed(4)),
            memo: `Commande DKS ShopManager (${currentUser.username})`,
            metadata: { cart: cart.map(i => ({ id: i.id, qty: i.quantity })) }
        };

        const callbacks = {
            onReadyForServerApproval: (paymentId: string) => {
                console.log("[FRONTEND] onReadyForServerApproval", paymentId);
                toast({ title: "Action requise", description: "Approbation de la transaction en cours..." });
                
                fetch("/api/pi/approve", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentId })
                });
            },
            onReadyForServerCompletion: (paymentId: string, txid: string) => {
                console.log("[FRONTEND] onReadyForServerCompletion", paymentId, txid);
                toast({ title: "Transaction soumise", description: "Finalisation et vérification du paiement..." });

                fetch("/api/pi/complete", {
                    method: "POST",
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentId, txid })
                }).then(async (res) => {
                    if (res.ok) {
                        console.log("[FRONTEND] La commande est finalisée avec succès par le backend.");
                        completeOrder(method);
                    } else {
                        const { error } = await res.json();
                        toast({ title: "Erreur de Finalisation", description: error || "Le serveur n'a pas pu vérifier la transaction.", variant: "destructive" });
                        setIsOrdering(false);
                    }
                }).catch(err => {
                    toast({ title: "Erreur Réseau", description: "Impossible de contacter le serveur pour finaliser le paiement.", variant: "destructive" });
                    setIsOrdering(false);
                });
            },
            onCancel: (paymentId: string) => {
                console.log("[FRONTEND] onCancel", paymentId);
                toast({ title: "Paiement Annulé", description: "La transaction a été annulée.", variant: "destructive" });
                setIsOrdering(false);
            },
            onError: (error: Error, payment: any) => {
                console.error("[FRONTEND] onError", error);
                toast({ title: "Erreur de Paiement Pi", description: error.message, variant: "destructive" });
                setIsOrdering(false);
            }
        };

        try {
          await createPiPayment(paymentData, callbacks);
        } catch(error) {
          setIsOrdering(false);
        }

        break;
      case 'Mobile Money':
        toast({ title: "Demande de paiement envoyée..." });
        await new Promise(resolve => setTimeout(resolve, 5000));
        completeOrder(method);
        break;
      case 'Cash au retrait':
        toast({ title: "Commande enregistrée" });
        completeOrder(method);
        break;
    }
  };

  const publishedProducts = MOCK_PRODUCTS.filter(p => p.isPublished && p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col custom-scrollbar">
      {/* ... (Le reste du JSX reste identique) ... */}
            {/* Navbar */}
      <header className="border-b border-white/5 bg-background/40 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center neon-glow group-hover:scale-110 transition-transform">
              <span className="text-white font-black text-xl italic uppercase">dks</span>
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">
              Shop<span className="text-accent">Manager</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative border-white/10 hover:bg-accent/10 hover:text-accent h-12 w-12 rounded-2xl p-0 transition-all">
                  <ShoppingCart size={22} />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                      {cart.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-card/95 backdrop-blur-2xl border-l border-white/10 flex flex-col h-full sm:max-w-md">
                <SheetHeader className="pb-6 border-b border-white/10">
                  <SheetTitle className="text-2xl font-black uppercase italic flex items-center gap-3">
                    <ShoppingCart className="text-accent" /> Panier Client
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-6 space-y-4 custom-scrollbar">
                  {cart.length === 0 ? (
                    <div className="text-center text-muted-foreground mt-20 space-y-4">
                      <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                        <PackageCheck size={32} className="opacity-20" />
                      </div>
                      <p className="font-bold uppercase tracking-widest text-xs">Votre panier est vide</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex gap-4 p-4 bg-white/5 rounded-3xl border border-white/5 group hover:border-white/20 transition-all">
                        <Image src={item.imageUrl} alt={item.name} width={80} height={80} className="w-20 h-20 rounded-2xl object-cover" />
                        <div className="flex-1">
                          <h4 className="text-sm font-black uppercase line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-accent font-black mt-1">${item.sellingPrice} | {(item.sellingPrice / PI_CONVERSION_RATE).toFixed(4)} π</p>
                          <div className="flex items-center gap-4 mt-3">
                             <div className="flex items-center gap-3 bg-black/40 rounded-xl px-3 py-1">
                               <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-accent transition-colors"><Minus size={14}/></button>
                               <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                               <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-accent transition-colors"><Plus size={14}/></button>
                             </div>
                             <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                               <Trash2 size={16} />
                             </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {cart.length > 0 && (
                  <SheetFooter className="border-t border-white/10 pt-6 flex-col items-stretch gap-6">
                    <div className="space-y-3 bg-black/40 p-6 rounded-3xl">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground uppercase font-bold tracking-widest">Total USD</span>
                        <span className="font-black text-lg">${totalUSD.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-accent font-black uppercase tracking-widest">Total Pi</span>
                        <span className="text-accent text-2xl font-black">{totalPi.toFixed(4)} π</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-accent text-accent-foreground font-black h-14 rounded-2xl neon-glow gap-3 uppercase italic text-lg"
                      onClick={() => setShowPaymentModal(true)}
                      disabled={isOrdering}
                    >
                      {isOrdering ? "Traitement en cours..." : "Finaliser la Commande"}
                      {!isOrdering && <ArrowRight size={20} />}
                    </Button>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>

            <Link href={currentUser ? "/dashboard" : "/login"}>
              <Button className="bg-primary hover:bg-primary/90 text-sm font-black h-12 px-8 rounded-2xl gap-3 uppercase italic">
                <User size={20} />
                {currentUser ? "Mon Dashboard" : "Espace Pro"}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
           <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] animate-pulse" />
           <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center">
          <Badge className="mb-8 bg-accent/20 text-accent border-accent/30 px-6 py-2 font-black uppercase tracking-[0.2em] italic animate-fade-in">
            ⚡ 1 PI = ${PI_CONVERSION_RATE}
          </Badge>
          <h1 className="text-6xl md:text-8xl font-black font-headline mb-8 tracking-tighter leading-[0.9] uppercase italic">
            HARDWARE <br />
            <span className="premium-gradient-text">ULTRA PREMIUM</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-16 leading-relaxed">
            Optimisez votre setup avec le meilleur du matériel informatique. 
            Paiement hybride : <strong>Pi Network</strong>, <strong>Mobile Money</strong> ou <strong>Cash</strong>.
          </p>

          <div className="relative max-w-3xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={24} />
            <Input 
              placeholder="Chercher une RTX, un clavier, un écran..." 
              className="h-16 pl-16 pr-8 bg-card/60 backdrop-blur-xl border-white/10 rounded-[2rem] focus:border-accent text-lg font-medium shadow-2xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Liste de Produits */}
      <section className="pb-32 max-w-7xl mx-auto px-4 w-full">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-black flex items-center gap-4 uppercase italic">
            <Zap className="text-accent fill-accent" size={32} /> 
            Catalogue <span className="text-accent">Live</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {publishedProducts.map(product => {
            const piPrice = product.sellingPrice / PI_CONVERSION_RATE;
            return (
              <div key={product.id} className="glossy-card rounded-[2.5rem] overflow-hidden flex flex-col group border-none">
                <div className="aspect-square overflow-hidden relative">
                  <Image src={product.imageUrl} alt={product.name} fill className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-5 right-5 bg-black/80 backdrop-blur-xl px-4 py-1.5 rounded-full text-[10px] font-black text-accent border border-accent/20">
                    {product.stockQuantity} EN STOCK
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <Badge className="bg-primary/20 text-accent border-none w-fit mb-4 text-[10px] uppercase font-black">
                    {product.category}
                  </Badge>
                  <h3 className="font-black text-lg mb-3 line-clamp-1 uppercase italic tracking-tight">{product.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-6 h-8 leading-relaxed">
                    {product.description}
                  </p>
                  
                  <div className="mt-auto space-y-1 mb-6">
                    <div className="text-3xl font-black tracking-tighter">${product.sellingPrice.toFixed(2)}</div>
                    <div className="text-sm font-black text-accent uppercase tracking-widest">{piPrice.toFixed(4)} π</div>
                  </div>

                  <Button 
                    onClick={() => addToCart(product)}
                    className="w-full h-14 bg-white/5 hover:bg-accent hover:text-accent-foreground border border-white/10 transition-all font-black uppercase italic gap-3 rounded-2xl"
                  >
                    <Plus size={18} /> Ajouter au Panier
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal de Sélection de Paiement */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="bg-card/95 backdrop-blur-2xl border-white/10 sm:max-w-md rounded-[2rem]">
          <DialogHeader className="pb-4 border-b border-white/10">
            <DialogTitle className="text-2xl font-black uppercase italic flex items-center gap-3">
              <CreditCard className="text-accent" /> Mode de Paiement
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              Veuillez sélectionner votre méthode de paiement préférée pour finaliser la transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col gap-4">
            <Button
              onClick={() => handlePayment('Pi Network')}
              className="w-full h-16 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 transition-all font-black uppercase italic gap-4 rounded-2xl text-lg justify-start px-6"
            >
              <Coins size={24} /> Payer avec Pi Network
            </Button>
            <Button
              onClick={() => handlePayment('Mobile Money')}
              className="w-full h-16 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 transition-all font-black uppercase italic gap-4 rounded-2xl text-lg justify-start px-6"
            >
              <Smartphone size={24} /> Payer par Mobile Money
            </Button>
            <Button
              onClick={() => handlePayment('Cash au retrait')}
              className="w-full h-16 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-all font-black uppercase italic gap-4 rounded-2xl text-lg justify-start px-6"
            >
              <Wallet size={24} /> Paiement au Retrait
            </Button>
          </div>
        </DialogContent>
      </Dialog>


      {/* Reçu de Retrait */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="bg-white text-black p-0 overflow-hidden sm:max-w-[450px] rounded-[2rem] border-none">
          <div className="p-10 font-mono text-sm relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-accent" />
            
            <div className="text-center mb-8 border-b border-dashed border-gray-300 pb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                   <CheckCircle className="text-green-600" size={40} />
                </div>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">REÇU DE COMMANDE</h2>
              <p className="text-[10px] mt-2 font-bold text-gray-400">#TRANS-{orderSummary?.id}</p>
              <p className="text-[10px] text-gray-400">{orderSummary?.date}</p>
            </div>
            
            <div className="space-y-3 mb-8">
              {orderSummary?.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <span className="flex-1 font-bold">{item.quantity}x {item.name}</span>
                  <span className="font-bold">${(item.sellingPrice * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 pt-6 space-y-4">
               <div className="flex justify-between font-bold text-xs">
                <span className="text-gray-500">MÉTHODE</span>
                <span>{orderSummary?.paymentMethod}</span>
              </div>
              <div className="flex justify-between font-black text-xl">
                <span>TOTAL USD</span>
                <span>${orderSummary?.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-accent font-black text-lg">
                <span>TOTAL PI NETWORK</span>
                <span>{(orderSummary ? orderSummary.total / PI_CONVERSION_RATE : 0).toFixed(4)} π</span>
              </div>
            </div>

            <div className="text-center mt-12 bg-gray-50 p-6 rounded-2xl space-y-2">
              <p className="text-[10px] font-black uppercase">Veuillez présenter ce reçu au guichet</p>
              <p className="text-[10px] font-medium text-gray-500">pour le retrait immédiat de vos articles.</p>
              <div className="pt-4 flex justify-center">
                <div className="w-32 h-32 bg-white border border-gray-200 p-2 rounded-xl">
                  {/* Simulate QR Code */}
                  <div className="w-full h-full bg-black/10 rounded-lg flex items-center justify-center">
                    <span className="text-[8px] text-gray-400">QR CODE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 p-6 flex gap-4">
            <Button className="flex-1 h-14 bg-black text-white font-black uppercase italic rounded-2xl gap-2 shadow-xl" onClick={() => window.print()}>
              <Printer size={20} /> Imprimer
            </Button>
            <Button className="flex-1 h-14 rounded-2xl font-black uppercase italic" variant="outline" onClick={() => setShowReceipt(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="mt-auto py-16 border-t border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                 <span className="text-white font-black italic text-xs uppercase">dks</span>
               </div>
               <span className="text-xl font-black tracking-tighter uppercase italic">Shop<span className="text-accent">Manager</span></span>
             </div>
             <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Premium Retail & Hardware Ecosystem</p>
          </div>
          
          <div className="flex gap-8">
             <div className="flex flex-col items-center gap-2 group cursor-pointer">
               <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-accent/20 transition-all">
                 <Coins size={20} className="text-accent" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest">Pi Network</span>
             </div>
             <div className="flex flex-col items-center gap-2 group cursor-pointer">
               <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-accent/20 transition-all">
                 <Smartphone size={20} className="text-accent" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-widest">M-Money</span>
             </div>
          </div>
          
          <p className="text-xs text-muted-foreground font-medium italic">© 2024 dks ShopManager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
