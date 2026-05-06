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
import { Loader2, ShoppingBag, CreditCard, Banknote, ShieldCheck, Coins, Zap, Globe, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CryptoOption = 'pi' | 'dkst';

export default function CheckoutPage() {
    const { cartItems, totalPrice, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [cryptoOption, setCryptoOption] = useState<CryptoOption>('pi');

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
                status: "pending_payment",
                paymentMethod: "PI_NETWORK",
                cryptoType: cryptoOption,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            clearCart();
            toast({ 
                title: "Commande validée !", 
                description: `Votre réservation en ${cryptoOption.toUpperCase()} est confirmée. Rendez-vous au Hub pour le scan final.` 
            });
            router.push('/dashboard/orders');
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
                <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-10">Paiement <span className="text-accent">Élite</span></h1>
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
                            <CardTitle className="text-sm font-black uppercase italic tracking-widest">Choix de la Crypto-monnaie</CardTitle>
                            
                            <div className="grid grid-cols-1 gap-3">
                                <button 
                                    onClick={() => setCryptoOption('pi')}
                                    className={cn(
                                        "p-6 rounded-2xl border transition-all flex items-center gap-4 text-left group",
                                        cryptoOption === 'pi' ? "bg-accent/10 border-accent text-accent" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                    )}
                                >
                                    <Globe size={24} className={cn(cryptoOption === 'pi' ? "text-accent" : "opacity-20")} />
                                    <div>
                                        <p className="font-black uppercase italic text-xs">Pi Network (GCV)</p>
                                        <p className="text-[10px] opacity-60">Consensus Global $314,159</p>
                                    </div>
                                    {cryptoOption === 'pi' && <CheckCircle2 size={16} className="ml-auto" />}
                                </button>

                                <button 
                                    onClick={() => setCryptoOption('dkst')}
                                    className={cn(
                                        "p-6 rounded-2xl border transition-all flex items-center gap-4 text-left group",
                                        cryptoOption === 'dkst' ? "bg-accent/10 border-accent text-accent" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                    )}
                                >
                                    <Zap size={24} className={cn(cryptoOption === 'dkst' ? "text-accent" : "opacity-20")} />
                                    <div>
                                        <p className="font-black uppercase italic text-xs">Jeton DKST (Interne)</p>
                                        <p className="text-[10px] opacity-60">Utilisez votre solde de minage</p>
                                    </div>
                                    {cryptoOption === 'dkst' && <CheckCircle2 size={16} className="ml-auto" />}
                                </button>
                            </div>

                            <div className="p-5 bg-black/40 rounded-2xl border border-white/5 flex items-center gap-4">
                                <Banknote size={20} className="text-muted-foreground opacity-40" />
                                <span className="font-bold uppercase italic text-[10px] text-muted-foreground opacity-40">Paiement Cash au Bureau (Indisponible)</span>
                            </div>

                            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                Le paiement s'effectue par scan de QR Code au Hub Double King Shop. 
                                Préparez votre Pi Browser ou votre Wallet DKS pour valider la transaction.
                            </p>
                         </div>
                         <Button className="w-full h-16 bg-accent text-black font-black uppercase italic mt-10 shadow-xl shadow-accent/20" onClick={handlePlaceOrder} disabled={isProcessing || cartItems.length === 0}>
                            {isProcessing ? <Loader2 className="animate-spin" /> : <><Coins className="mr-2" /> Valider avec {cryptoOption.toUpperCase()}</>}
                         </Button>
                    </Card>
                </div>
            </main>
        </div>
    );
}
