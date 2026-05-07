
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Trash2, ShoppingCart, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CartPage() {
    const { cartItems, removeFromCart, updateQuantity, totalPrice, cartCount } = useCart();

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <main className="max-w-4xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-center space-y-8">
                    <div className="w-32 h-32 rounded-[3rem] bg-white/5 flex items-center justify-center text-muted-foreground opacity-20">
                        <ShoppingBag size={64} />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Votre Panier est <span className="text-accent">Vide</span></h1>
                        <p className="text-muted-foreground font-medium uppercase text-xs tracking-widest">Le Hub attend vos prochaines acquisitions technologiques.</p>
                    </div>
                    <Link href="/#shop">
                       <Button className="h-16 px-10 rounded-2xl bg-accent text-black font-black uppercase italic gap-3 shadow-xl shadow-accent/20">
                           <ShoppingCart size={20} /> Explorer le Stock Hardware
                       </Button>
                    </Link>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                    <div className="space-y-2">
                        <Badge className="bg-accent/20 text-accent border-none font-black uppercase tracking-widest px-3">Mon Panier Élite</Badge>
                        <h1 className="text-5xl font-black uppercase italic tracking-tighter">RÉSUMÉ DE <span className="text-accent">SÉLECTION</span></h1>
                    </div>
                    <p className="text-sm font-bold text-white/40 uppercase tracking-widest">{cartCount} Articles sélectionnés</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    <div className="lg:col-span-8 space-y-4">
                        {cartItems.map(item => (
                            <Card key={item.id} className="glossy-card border-none rounded-[2rem] overflow-hidden group">
                                <CardContent className="p-6 flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-black/40 border border-white/5 shrink-0">
                                        <img 
                                            src={item.imageUrl || item.image || 'https://picsum.photos/seed/dks/400/300'} 
                                            alt={item.name} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 text-white/40">{item.category}</Badge>
                                        <h2 className="font-black text-lg uppercase italic leading-none">{item.name}</h2>
                                        <p className="text-accent font-bold">${(item.price || item.sellingPrice || 0).toFixed(2)} / unité</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                                            <button 
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="text-white/40 hover:text-accent transition-colors"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="font-black text-lg w-6 text-center">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="text-white/40 hover:text-accent transition-colors"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => removeFromCart(item.id)}
                                            className="h-12 w-12 rounded-xl text-white/10 hover:text-destructive hover:bg-destructive/10 transition-all"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        
                        <Link href="/#shop" className="inline-flex items-center gap-2 text-[10px] font-black uppercase italic text-white/40 hover:text-accent transition-colors mt-6">
                            <ArrowLeft size={14} /> Continuer mes achats
                        </Link>
                    </div>

                    <div className="lg:col-span-4">
                        <Card className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-10 space-y-8 sticky top-32 shadow-2xl">
                            <div className="space-y-6">
                                <h3 className="text-xl font-black uppercase italic border-b border-white/5 pb-4">Total Commande</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-bold uppercase text-white/40">
                                        <span>Sous-total</span>
                                        <span>${totalPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold uppercase text-white/40">
                                        <span>Taxes (Garantie incluse)</span>
                                        <span>$0.00</span>
                                    </div>
                                    <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                                        <span className="text-sm font-black uppercase italic">Total à régler</span>
                                        <span className="text-4xl font-black text-accent italic tracking-tighter">${totalPrice.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-accent/5 rounded-2xl border border-accent/20 space-y-2">
                                <p className="text-[10px] font-black uppercase text-accent flex items-center gap-2">
                                    <Coins size={12} /> Paiement GCV Pi Accepté
                                </p>
                                <p className="text-[9px] text-white/40 leading-relaxed italic">
                                    Finalisez votre commande et générez votre QR Code de paiement lors de l'étape suivante.
                                </p>
                            </div>

                            <Link href="/checkout" className="block w-full">
                                <Button className="w-full h-20 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20 text-lg gap-3 hover:scale-[1.02] transition-all">
                                    Procéder au Paiement <ArrowRight size={24} />
                                </Button>
                            </Link>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
