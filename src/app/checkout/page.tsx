
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
  Loader2,
  MapPin,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Phone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PaymentMethod = "PI_NETWORK" | "MOBILE_MONEY" | "CASH";
type MobileNetwork = "VODACOM" | "AIRTEL" | "ORANGE" | "AFRICELL";

export default function CheckoutPage() {
    const { cartItems, totalPrice, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PI_NETWORK");
    const [mobileNetwork, setMobileNetwork] = useState<MobileNetwork>("VODACOM");
    const [customerPhone, setCustomerPhone] = useState("");
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
                    <p className="text-muted-foreground mt-4">Veuillez ajouter des articles avant de commander.</p>
                    <Button className="mt-8" onClick={() => router.push('/')}>Retour à la boutique</Button>
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

        if (paymentMethod === 'MOBILE_MONEY' && (!customerPhone || customerPhone.length < 9)) {
            toast({
                title: "Numéro requis",
                description: "Veuillez saisir un numéro de téléphone valide pour le paiement mobile.",
                variant: "destructive"
            });
            return;
        }

        setIsProcessing(true);

        try {
            // Simulation d'envoi USSD pour Mobile Money
            if (paymentMethod === 'MOBILE_MONEY') {
                toast({
                    title: "Requête USSD envoyée",
                    description: `Veuillez confirmer le paiement sur votre téléphone (${mobileNetwork}).`,
                });
                // On attend un peu pour simuler le processus
                await new Promise(resolve => setTimeout(resolve, 3000));
            }

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
                mobileNetwork: paymentMethod === 'MOBILE_MONEY' ? mobileNetwork : null,
                customerPhone: paymentMethod === 'MOBILE_MONEY' ? customerPhone : null,
                createdAt: serverTimestamp(),
                status: paymentMethod === 'CASH' ? 'pending_payment' : 'pending',
                updatedAt: serverTimestamp(),
                piValue: totalPrice / PI_CONVERSION_RATE
            };

            await addDoc(collection(db, "orders"), orderData);

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
                    
                    <div className="lg:col-span-2 space-y-6">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-8">
                            Finaliser ma <span className="text-accent">Commande</span>
                        </h1>

                        <div className="space-y-4">
                            <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <ShieldCheck size={14} className="text-accent" />
                                Choisissez votre mode de paiement
                            </h2>
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
                                    <span className="font-bold uppercase italic text-xs">Pi Network (GCV)</span>
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
                                    <span className="font-bold uppercase italic text-xs">Mobile Money</span>
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

                        <div className="p-8 rounded-[2rem] bg-card/40 border border-white/10 backdrop-blur-xl">
                            {paymentMethod === "PI_NETWORK" && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-3 text-accent">
                                        <Coins size={20} />
                                        <h3 className="font-black uppercase italic">Paiement via Pi Network (GCV)</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Nous appliquons le taux <strong>GCV (1 π = $314,159)</strong>. La transaction s'effectuera via le <strong>Pi Browser</strong>.
                                    </p>
                                    <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl text-primary-foreground text-xs">
                                        Total à transférer : <span className="font-black text-accent">{(totalPrice / PI_CONVERSION_RATE).toFixed(8)} π</span>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === "MOBILE_MONEY" && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-3 text-accent">
                                        <Smartphone size={20} />
                                        <h3 className="font-black uppercase italic">Paiement Mobile Money</h3>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Sélectionnez votre réseau</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {[
                                                { id: "VODACOM", label: "Vodacom", color: "bg-red-600" },
                                                { id: "AIRTEL", label: "Airtel", color: "bg-red-700" },
                                                { id: "ORANGE", label: "Orange", color: "bg-orange-500" },
                                                { id: "AFRICELL", label: "Africell", color: "bg-purple-600" }
                                            ].map((net) => (
                                                <button
                                                    key={net.id}
                                                    onClick={() => setMobileNetwork(net.id as MobileNetwork)}
                                                    className={cn(
                                                        "p-3 rounded-xl border text-[10px] font-black uppercase transition-all flex flex-col items-center gap-2",
                                                        mobileNetwork === net.id 
                                                            ? "bg-white text-black border-white scale-105 shadow-lg" 
                                                            : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                                                    )}
                                                >
                                                    <div className={cn("w-3 h-3 rounded-full", net.color)} />
                                                    {net.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Votre numéro de téléphone</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                            <Input 
                                                type="tel"
                                                placeholder="Ex: 0823038945"
                                                className="h-14 pl-12 rounded-xl bg-background/50 border-white/10"
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground italic">
                                            Une demande de confirmation USSD sera envoyée automatiquement à ce numéro.
                                        </p>
                                    </div>

                                    <div className="bg-accent/5 border border-accent/20 p-4 rounded-xl flex items-start gap-3">
                                        <Info className="text-accent shrink-0" size={18} />
                                        <div className="text-[10px] leading-relaxed">
                                            <p className="font-bold text-accent uppercase mb-1">Indications Boutique</p>
                                            <p>Numéro de réception DKS : <span className="font-black text-white">+243 823 038 945</span></p>
                                            <p className="opacity-70 mt-1">Le montant de <strong>${totalPrice.toFixed(2)}</strong> sera converti au taux CDF/USD du jour.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === "CASH" && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-3 text-orange-400">
                                        <MapPin size={20} />
                                        <h3 className="font-black uppercase italic">Paiement au Bureau (Bunia)</h3>
                                    </div>
                                    <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-2xl text-orange-200 text-sm">
                                        <p className="font-black uppercase italic mb-3 flex items-center gap-2">
                                            <Info size={16} /> Attention
                                        </p>
                                        <strong>IMPORTANT :</strong> Veuillez vous présenter à notre bureau <strong>Double King Shop (Immeuble Bahati, Boulevard de la Libération, Bunia)</strong> sous 24h pour régler et retirer votre commande.
                                        <p className="mt-4 opacity-70 text-xs">Munissez-vous de votre numéro de commande qui vous sera communiqué après validation.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card className="glossy-card border-none rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="bg-white/5">
                                <CardTitle className="text-lg font-black uppercase italic">Récapitulatif</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                        <div className="flex flex-col">
                                            <span className="font-bold">{item.name}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase">Qté: {item.quantity}</span>
                                        </div>
                                        <span className="font-black">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="pt-4 space-y-2">
                                    <div className="flex justify-between items-center font-black text-xl">
                                        <span className="uppercase italic text-xs text-muted-foreground">Total</span>
                                        <span className="text-accent">${totalPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <Badge variant="outline" className="border-accent text-accent font-black text-[10px] mb-1">GCV RATE (Pi)</Badge>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">
                                            ≈ {(totalPrice / PI_CONVERSION_RATE).toFixed(8)} π
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-6 bg-white/5">
                                <Button 
                                    className="w-full h-16 bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl font-black uppercase italic text-lg gap-3 shadow-lg"
                                    onClick={handlePlaceOrder}
                                    disabled={isProcessing || cartItems.length === 0}
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
