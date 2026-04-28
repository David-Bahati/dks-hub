
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MOCK_PRODUCTS } from '@/lib/mock-data';
import { Product } from '@/lib/types';
import { Trash2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Pour la démo, nous simulons un panier avec quelques produits.
const MOCK_CART_ITEMS = [
    { ...MOCK_PRODUCTS[0], quantity: 1 },
    { ...MOCK_PRODUCTS[2], quantity: 2 },
];

export default function CartPage() {
    const [cartItems, setCartItems] = useState(MOCK_CART_ITEMS);
    const { toast } = useToast();

    const total = cartItems.reduce((acc, item) => acc + item.sellingPrice * item.quantity, 0);

    const handleCheckout = () => {
        // Simuler la création d'une commande
        console.log("Commande passée:", cartItems);

        // Déclencher la notification toast
        toast({
            title: "Commande Confirmée !",
            description: "Votre commande a bien été enregistrée et est en cours de préparation.",
        });

        // Vider le panier
        setCartItems([]);
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-background">
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
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold font-headline mb-8">Votre Panier</h1>
                <div className="glossy-card border-none rounded-xl p-6">
                    <div className="space-y-4">
                        {cartItems.map(item => (
                            <div key={item.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="rounded-lg object-cover" />
                                    <div>
                                        <h2 className="font-bold">{item.name}</h2>
                                        <p className="text-sm text-muted-foreground">Quantité: {item.quantity}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                     <p className="font-bold">${(item.sellingPrice * item.quantity).toFixed(2)}</p>
                                     <Button variant="ghost" size="icon" onClick={() => setCartItems(cartItems.filter(i => i.id !== item.id))}>
                                         <Trash2 className="h-4 w-4 text-destructive" />
                                     </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-white/10 mt-6 pt-6 flex justify-between items-center">
                        <p className="text-xl font-bold">Total</p>
                        <p className="text-2xl font-black">${total.toFixed(2)}</p>
                    </div>
                    <div className="mt-8 text-right">
                        <Button size="lg" className="font-bold neon-glow" onClick={handleCheckout}>
                           Procéder au paiement
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
