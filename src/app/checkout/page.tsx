
"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { PI_CONVERSION_RATE } from "@/lib/constants";
import { 
  Coins, 
  Smartphone, 
  Banknote, 
  Info, 
  CheckCircle2, 
  Loader2,
  MapPin,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PaymentMethod = "PI_NETWORK" | "MOBILE_MONEY" | "CASH";

export default function CheckoutPage() {
    const { cartItems, totalPrice, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PI_NETWORK");
    const [isProcessing, setIsProcessing] = useState(false);

    // Rediriger si le panier est vide
    useEffect(() => {
        if (cartItems.length === 0 && !isProcessing) {
            const timer = setTimeout(() => {
                router.push('/');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [cartItems, router, isProcessing]);

    if (cartItems.length === 0 && !isProcessing) {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <main className="max-w-7xl mx-auto px-4 py-20 text-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                        <Info className="text-muted-foreground" size={40} />
                    </div>
                    <h1 className="text-3xl font-bold uppercase italic">Votre panier est vide</h1>
                    <p className="text-muted-foreground mt-4">Redirection vers la boutique...</p>
                </main>
            </div>
        );
    }

    const handlePlaceOrder = async () => {
        if (!user) {
            toast({
                title: "Connexion requise",
                description: "Veuillez vous connecter pour passer commande.",
                variant: "destructive"
            });
            router.push('/login');
            return;
        }

        setIsProcessing(true);

        try {
            const orderData = {
                userId: user.uid,
                customerEmail: user.email,
                customerName: user.name,
                items: cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                })),
                total: totalPrice,
                paymentMethod: paymentMethod,
                createdAt: serverTimestamp(),
                status: paymentMethod === 'CASH' ? 'pending_payment' : 'pending',
                updatedAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, "orders"), orderData);

            toast({
                title: "Commande enregistrée !",
                description: paymentMethod === 'CASH' 
                    ? "Rendez-vous au bureau pour le paiement." 
                    : "Votre commande est en cours de traitement.",
            });

            clearCart();
            router.push('/dashboard/orders');

        } catch (error) {
            console.error("Error placing order: ", error);
            toast({
                title: "Erreur",
                description: "Impossible de valider votre commande.",
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Section Gauche : Récapitulatif & Paiement */}
                    <div className="lg:col-span-2 space-y-6">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-8">
                            Finaliser ma <span className="text-accent">Commande</span>
                        </h1>

                        {/* Choix du mode de paiement */}
                        <div className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Choisir un mode de paiement</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Button 
                                    variant="outline"
                                    className={cn(
                                        "h-24 flex-col gap-2 rounded-2xl border-white/10 transition-all",
                                        paymentMethod === "PI_NETWORK" ? "bg-primary border-primary text-white neon-glow" : "bg-white/5 hover:bg-white/10"
                                    )}
                                    onClick={() => setPaymentMethod("PI_NETWORK")}
                                >
                                    <Coins size={24} />
                                    <span className="font-bold uppercase italic text-xs">Pi Network</span>
                                </Button>
                                <Button 
                                    variant="outline"
                                    className={cn(
                                        "h-24 flex-col gap-2 rounded-2xl border-white/10 transition-all",
                                        paymentMethod === "MOBILE_MONEY" ? "bg-primary border-primary text-white neon-glow" : "bg-white/5 hover:bg-white/10"
                                    )}
                                    onClick={() => setPaymentMethod("MOBILE_MONEY")}
                                >
                                    <Smartphone size={24} />
                                    <span className="font-bold uppercase italic text-xs">M-Money</span>
                                </Button>
                                <Button 
                                    variant="outline"
                                    className={cn(
                                        "h-24 flex-col gap-2 rounded-2xl border-white/10 transition-all",
                                        paymentMethod === "CASH" ? "bg-primary border-primary text-white neon-glow" : "bg-white/5 hover:bg-white/10"
                                    )}
                                    onClick={() => setPaymentMethod("CASH")}
                                >
                                    <Banknote size={24} />
                                    <span className="font-bold uppercase italic text-xs">Cash</span>
                                </Button>
                            </div>
                        </div>

                        {/* Instructions contextuelles */}
                        <div className="p-6 rounded-[2rem] bg-card/40 border border-white/10 backdrop-blur-xl">
                            {paymentMethod === "PI_NETWORK" && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-accent">
                                        <Coins size={20} />
                                        <h3 className="font-black uppercase italic">Paiement via Pi Browser</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Une fois la commande validée, vous serez redirigé vers l'interface de paiement sécurisée de Pi Network. Assurez-vous d'être dans le <strong>Pi Browser</strong> pour finaliser la transaction.
                                    </p>
                                </div>
                            )}
                            {paymentMethod === "MOBILE_MONEY" && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-accent">
                                        <Smartphone size={20} />
                                        <h3 className="font-black uppercase italic">Mobile Money (Orange / Airtel / M-Pesa)</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Vous recevrez une demande de confirmation sur votre téléphone pour valider le montant de <strong>${totalPrice.toFixed(2)}</strong> converti au taux du jour.
                                    </p>
                                </div>
                            )}
                            {paymentMethod === "CASH" && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-3 text-orange-400">
                                        <MapPin size={20} />
                                        <h3 className="font-black uppercase italic">Paiement au Bureau</h3>
                                    </div>
                                    <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl text-orange-200 text-sm">
                                        <strong>IMPORTANT :</strong> Votre commande sera réservée pendant 24h. Veuillez vous présenter au bureau <strong>Double King Shop (Immeuble Bahati, Bunia)</strong> pour régler en espèces et retirer vos articles.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section Droite : Panier */}
                    <div className="space-y-6">
                        <Card className="glossy-card border-none rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="bg-white/5">
                                <CardTitle className="text-lg font-black uppercase italic">Votre Panier</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{item.name}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">Qté: {item.quantity}</span>
                                        </div>
                                        <span className="font-black">${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="pt-4 space-y-2">
                                    <div className="flex justify-between items-center font-black text-xl">
                                        <span className="uppercase italic text-xs text-muted-foreground">Total</span>
                                        <span className="text-accent">${totalPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                                            ≈ {(totalPrice / PI_CONVERSION_RATE).toFixed(6)} π
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-6 bg-white/5">
                                <Button 
                                    className="w-full h-16 bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl font-black uppercase italic text-lg gap-3 shadow-lg"
                                    onClick={handlePlaceOrder}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        <>
                                            Confirmer
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                </div>
            </main>
        </div>
    );
}
