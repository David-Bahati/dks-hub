
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function CheckoutPage() {
    const { cartItems, totalPrice, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handlePlaceOrder = async () => {
        if (!user) {
            toast({
                title: "Erreur",
                description: "Vous devez être connecté pour passer une commande.",
                variant: "destructive"
            });
            router.push('/login');
            return;
        }

        try {
            await addDoc(collection(db, "orders"), {
                userId: user.uid,
                items: cartItems,
                total: totalPrice,
                createdAt: serverTimestamp(),
                status: 'pending'
            });

            clearCart();
            toast({
                title: "Commande passée !",
                description: "Votre commande a été enregistrée avec succès.",
            });
            router.push('/dashboard/orders');

        } catch (error) {
            console.error("Error placing order: ", error);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la validation de votre commande.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-2xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-bold font-headline mb-8">Récapitulatif de la commande</h1>
                <div className="border border-border rounded-xl p-6 shadow-lg">
                    <div className="space-y-4 mb-6">
                        {cartItems.map(item => (
                            <div key={item.id} className="flex justify-between items-center">
                                <span>{item.name} x {item.quantity}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-border pt-4 flex justify-between items-center font-bold text-xl">
                        <span>Total</span>
                        <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="mt-8 text-right">
                        <Button size="lg" className="font-bold" onClick={handlePlaceOrder}>
                           Valider la commande
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
