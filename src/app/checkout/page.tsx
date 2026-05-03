"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ShoppingBag, CreditCard, Banknote, ShieldCheck } from "lucide-react";

export default function CheckoutPage() {
    const { cartItems, totalPrice, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePlaceOrder = async () => {
        if (!user) {
            toast({ title: "Connexion requise", description: "Veuillez vous connecter pour commander." });
            router.push('/login');
            return;
        }

        setIsProcessing(true);
        try {
            await addDoc(collection(db, "orders"), {
                userId: user.uid,
                customerName: user.name,
                customerEmail: user.email,
                items: cartItems,
                total: totalPrice,
                status: "pending",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            clearCart();
            toast({ title: "Commande passée !", description: "Elle est en cours de traitement." });
            router.push('/dashboard');
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-10">Paiement</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <Card className="glossy-card border-none p-8 space-y-6">
                        <CardHeader className="p-0"><CardTitle className="text-sm font-black uppercase italic tracking-widest text-accent">Résumé de commande</CardTitle></CardHeader>
                        <CardContent className="p-0 space-y-4">
                            {cartItems.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span className="opacity-60">{item.name} x{item.quantity}</span>
                                    <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="pt-4 border-t border-white/5 flex justify-between text-2xl font-black">
                                <span>TOTAL</span>
                                <span>${totalPrice.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glossy-card border-none p-8 flex flex-col justify-between">
                         <div className="space-y-6">
                            <CardTitle className="text-sm font-black uppercase italic tracking-widest">Mode de règlement</CardTitle>
                            <div className="p-6 bg-white/5 rounded-2xl border border-accent/20 flex items-center gap-4 text-accent">
                                <Banknote size={24} />
                                <span className="font-bold uppercase italic text-xs">Paiement Cash au Bureau</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                                Les paiements Pi Network et Mobile Money sont gérés manuellement en boutique pour le moment. 
                                Validez votre commande pour réserver votre matériel.
                            </p>
                         </div>
                         <Button className="w-full h-16 bg-accent text-black font-black uppercase italic mt-10" onClick={handlePlaceOrder} disabled={isProcessing || cartItems.length === 0}>
                            {isProcessing ? <Loader2 className="animate-spin" /> : "Confirmer la commande"}
                         </Button>
                    </Card>
                </div>
            </main>
        </div>
    );
}
