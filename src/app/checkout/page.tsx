
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
  Phone,
  ArrowLeft,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PaymentMethod = "PI_NETWORK" | "MOBILE_MONEY" | "CASH";
type MobileNetwork = "VODACOM" | "AIRTEL" | "ORANGE" | "AFRICELL";

const NETWORK_CONFIG = {
  VODACOM: {
    label: "Vodacom",
    color: "bg-red-600",
    prefixes: ["081", "082", "083"],
    hint: "Commence par 081, 082 ou 083"
  },
  AIRTEL: {
    label: "Airtel",
    color: "bg-red-700",
    prefixes: ["097", "098", "099"],
    hint: "Commence par 097, 098 ou 099"
  },
  ORANGE: {
    label: "Orange",
    color: "bg-orange-500",
    prefixes: ["084", "085", "089"],
    hint: "Commence par 084, 085 ou 089"
  },
  AFRICELL: {
    label: "Africell",
    color: "bg-purple-600",
    prefixes: ["090", "091"],
    hint: "Commence par 090 ou 091"
  }
};

export default function CheckoutPage() {
    const { cartItems, totalPrice, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PI_NETWORK");
    const [mobileNetwork, setMobileNetwork] = useState<MobileNetwork>("VODACOM");
    const [customerPhone, setCustomerPhone] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

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
                    <h1 className="text-3xl font-bold uppercase italic text-white">Votre panier est vide</h1>
                    <p className="text-muted-foreground mt-4 uppercase text-[10px] tracking-[0.3em] font-black">Redirection imminente...</p>
                    <Button className="mt-8 rounded-xl font-black uppercase italic" onClick={() => router.push('/')}>Retour à la boutique</Button>
                </main>
            </div>
        );
    }

    const validatePhoneNumber = (phone: string, network: MobileNetwork) => {
        const config = NETWORK_CONFIG[network];
        const prefixPattern = config.prefixes.join("|");
        const regex = new RegExp(`^(${prefixPattern})\\d{7}$`);
        return regex.test(phone);
    };

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

        if (paymentMethod === 'MOBILE_MONEY') {
            if (!customerPhone) {
                toast({
                    title: "Numéro requis",
                    description: "Veuillez saisir votre numéro de téléphone.",
                    variant: "destructive"
                });
                return;
            }

            if (!validatePhoneNumber(customerPhone, mobileNetwork)) {
                toast({
                    title: "Format invalide",
                    description: `Pour ${NETWORK_CONFIG[mobileNetwork].label}, le numéro doit être de 10 chiffres et ${NETWORK_CONFIG[mobileNetwork].hint}.`,
                    variant: "destructive"
                });
                return;
            }
        }

        setIsProcessing(true);

        try {
            if (paymentMethod === 'MOBILE_MONEY') {
                toast({
                    title: "Requête USSD envoyée",
                    description: `Veuillez confirmer le paiement sur votre téléphone (${mobileNetwork}).`,
                });
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
                    price: item.price || item.sellingPrice || 0
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

            const orderRef = await addDoc(collection(db, "orders"), orderData);

            // Trigger Notification for Staff
            await addDoc(collection(db, "notifications"), {
                userId: 'staff',
                title: "Nouvelle Commande !",
                message: `Le client ${user.name} a passé une commande de $${totalPrice.toFixed(2)} (${paymentMethod}).`,
                type: 'success',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/orders'
            });

            // Trigger Notification for Customer
            await addDoc(collection(db, "notifications"), {
                userId: user.uid,
                title: "Commande Enregistrée",
                message: "Votre commande est bien reçue. Vous recevrez une notification dès qu'elle sera prête.",
                type: 'info',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/orders'
            });

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
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="mb-10 flex items-center justify-between">
                    <Button 
                        variant="ghost" 
                        onClick={() => router.back()}
                        className="rounded-xl gap-2 font-black uppercase italic text-[10px] tracking-widest text-muted-foreground hover:text-white"
                    >
                        <ArrowLeft size={16} />
                        Retour au panier
                    </Button>
                    <div className="flex items-center gap-2 text-accent">
                        <Lock size={14} className="opacity-50" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Paiement ultra-sécurisé & crypté</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    <div className="lg:col-span-2 space-y-10">
                        <div className="space-y-2">
                            <h1 className="text-5xl font-black uppercase italic tracking-tighter leading-none">
                                FINALISER LA <span className="text-accent">COMMANDE</span>
                            </h1>
                            <p className="text-muted-foreground font-light uppercase tracking-widest text-xs opacity-60">Validation de votre sélection premium</p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={20} className="text-accent" />
                                <h2 className="text-sm font-black uppercase tracking-widest italic">Modes de paiement acceptés</h2>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { id: "PI_NETWORK", label: "Pi Network (GCV)", icon: Coins },
                                    { id: "MOBILE_MONEY", label: "Mobile Money", icon: Smartphone },
                                    { id: "CASH", label: "Cash au Bureau", icon: Banknote }
                                ].map((method) => (
                                    <button 
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                                        className={cn(
                                            "relative h-28 flex flex-col items-center justify-center gap-3 rounded-[1.5rem] border transition-all duration-300",
                                            paymentMethod === method.id 
                                                ? "bg-accent/10 border-accent shadow-[0_0_30px_rgba(56,189,248,0.1)]" 
                                                : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                                        )}
                                    >
                                        <method.icon size={28} className={cn(paymentMethod === method.id ? "text-accent" : "text-muted-foreground")} />
                                        <span className={cn("font-black uppercase italic text-[10px] tracking-widest", paymentMethod === method.id ? "text-white" : "text-muted-foreground")}>
                                            {method.label}
                                        </span>
                                        {paymentMethod === method.id && (
                                            <CheckCircle2 size={16} className="absolute top-3 right-3 text-accent animate-in zoom-in" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-10 rounded-[2.5rem] bg-card/40 border border-white/5 backdrop-blur-3xl shadow-2xl">
                            {paymentMethod === "PI_NETWORK" && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-4 text-accent">
                                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                                            <Coins size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-black uppercase italic tracking-tighter">Paiement via Pi Network (GCV)</h3>
                                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Consensus Global 1 π = $314,159</p>
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                        <p className="text-sm text-muted-foreground leading-relaxed font-light">
                                            La transaction s'effectuera via le <strong>Pi Browser</strong>. Assurez-vous d'être connecté à votre compte Pi Network pour valider l'opération.
                                        </p>
                                        <div className="bg-accent/5 border border-accent/20 p-5 rounded-xl flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-accent tracking-[0.2em]">Total à transférer :</span>
                                            <span className="font-black text-2xl text-white">{(totalPrice / PI_CONVERSION_RATE).toFixed(8)} π</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === "MOBILE_MONEY" && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-4 text-accent">
                                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                                            <Smartphone size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-black uppercase italic tracking-tighter">Paiement Mobile Money</h3>
                                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Confirmation instantanée par USSD</p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Choisir votre Opérateur</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {Object.entries(NETWORK_CONFIG).map(([id, config]) => (
                                                <button
                                                    key={id}
                                                    onClick={() => setMobileNetwork(id as MobileNetwork)}
                                                    className={cn(
                                                        "p-4 rounded-2xl border text-[10px] font-black uppercase transition-all flex flex-col items-center gap-2",
                                                        mobileNetwork === id 
                                                            ? "bg-white text-black border-white shadow-xl scale-105" 
                                                            : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                                                    )}
                                                >
                                                    <div className={cn("w-3 h-3 rounded-full shadow-lg", config.color)} />
                                                    {config.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Numéro de téléphone (RDC)</Label>
                                        <div className="relative group">
                                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" size={20} />
                                            <Input 
                                                type="tel"
                                                placeholder={NETWORK_CONFIG[mobileNetwork].prefixes[0] + "XXXXXXX"}
                                                className="h-16 pl-14 rounded-2xl bg-background/50 border-white/5 focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all text-sm font-bold"
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            />
                                        </div>
                                        <div className="bg-orange-500/5 border border-orange-500/10 p-5 rounded-xl flex items-start gap-4">
                                            <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                                                <Info className="text-orange-500" size={14} />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-[10px] text-orange-200/60 leading-relaxed uppercase font-black tracking-widest">
                                                    Format requis : 10 chiffres. Pour {NETWORK_CONFIG[mobileNetwork].label} : {NETWORK_CONFIG[mobileNetwork].hint}.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === "CASH" && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center gap-4 text-orange-400">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-400/10 flex items-center justify-center">
                                            <MapPin size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-black uppercase italic tracking-tighter">Paiement au Bureau (Bunia)</h3>
                                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Retrait direct en magasin</p>
                                        </div>
                                    </div>
                                    <div className="p-8 rounded-[2rem] bg-orange-500/5 border border-orange-500/10 text-orange-200 text-sm leading-relaxed">
                                        <p className="font-black uppercase italic mb-4 flex items-center gap-2">
                                            <Info size={16} /> Informations de Retrait
                                        </p>
                                        Veuillez vous présenter à notre bureau <strong>Double King Shop (Immeuble Bahati, Boulevard de la Libération, Bunia)</strong> sous 24h muni de votre ID de commande pour finaliser l'achat.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <Card className="glossy-card border-none rounded-[2.5rem] overflow-hidden sticky top-28">
                            <CardHeader className="bg-white/5 p-8 border-b border-white/5">
                                <CardTitle className="text-lg font-black uppercase italic tracking-tighter">Résumé Commande</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-4">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-xs group">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white/80 group-hover:text-white transition-colors">{item.name}</span>
                                            <span className="text-[9px] text-muted-foreground uppercase font-black">Qté: {item.quantity}</span>
                                        </div>
                                        <span className="font-black text-white">${((item.price || item.sellingPrice || 0) * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="pt-6 mt-6 border-t border-white/5 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Montant Total</span>
                                        <div className="text-right">
                                            <p className="text-4xl font-black text-accent tracking-tighter leading-none">${totalPrice.toFixed(2)}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">≈ {(totalPrice / PI_CONVERSION_RATE).toFixed(6)} π</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-8 bg-white/5">
                                <Button 
                                    className="w-full h-20 bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl font-black uppercase italic text-xl gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                                    onClick={handlePlaceOrder}
                                    disabled={isProcessing || cartItems.length === 0}
                                >
                                    {isProcessing ? (
                                        <Loader2 className="animate-spin" />
                                    ) : (
                                        <>
                                            Confirmer
                                            <ArrowRight size={24} />
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                        
                        <div className="flex items-center gap-3 px-6 py-4 bg-white/5 rounded-2xl border border-white/5 opacity-40">
                            <ShieldCheck size={20} className="text-accent" />
                            <p className="text-[9px] font-bold uppercase tracking-widest leading-relaxed">
                                Votre achat est protégé par la garantie DKS. Transaction cryptée SSL 256-bit.
                            </p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
