
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { Trash2, ShoppingCart, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function CartPage() {
    const { cartItems, removeFromCart, updateQuantity, totalPrice } = useCart();

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <main className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
                    <ShoppingCart size={64} className="text-muted-foreground mb-4"/>
                    <h1 className="text-3xl font-bold mb-2">Votre panier est vide</h1>
                    <p className="text-muted-foreground mb-6">Il est temps de faire du shopping !</p>
                    <Link href="/">
                       <Button>Découvrir nos produits</Button>
                    </Link>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold font-headline mb-8">Votre Panier</h1>
                <div className="border border-border rounded-xl p-6 shadow-lg">
                    <div className="space-y-4">
                        {cartItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Image src={item.imageUrl || '/placeholder.svg'} alt={item.name} width={64} height={64} className="rounded-lg object-cover" />
                                    <div>
                                        <h2 className="font-bold text-lg">{item.name}</h2>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                                            <span className="font-bold w-10 text-center">{item.quantity}</span>
                                            <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                     <p className="font-bold text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                                     <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                                         <Trash2 className="h-5 w-5 text-destructive" />
                                     </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-border mt-6 pt-6 flex justify-between items-center">
                        <p className="text-xl font-bold">Total</p>
                        <p className="text-2xl font-black">${totalPrice.toFixed(2)}</p>
                    </div>
                    <div className="mt-8 text-right">
                        <Link href="/checkout">
                            <Button size="lg" className="font-bold">
                               Procéder au paiement
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
