
"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc } from "firebase/firestore";
import { signInAnonymously, updatePassword, updateProfile, updateEmail } from "firebase/auth";
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
  Lock,
  User,
  Mail,
  Sparkles,
  KeyRound,
  ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PaymentMethod = "PI_NETWORK" | "MOBILE_MONEY" | "CASH";
type MobileNetwork = "VODACOM" | "AIRTEL" | "ORANGE" | "AFRICELL";

const NETWORK_CONFIG = {
  VODACOM: { label: "Vodacom", color: "bg-red-600", prefixes: ["081", "082", "083"], hint: "081, 082 ou 083" },
  AIRTEL: { label: "Airtel", color: "bg-red-700", prefixes: ["097", "098", "099"], hint: "097, 098 ou 099" },
  ORANGE: { label: "Orange", color: "bg-orange-500", prefixes: ["084", "085", "089"], hint: "084, 085 ou 089" },
  AFRICELL: { label: "Africell", color: "bg-purple-600", prefixes: ["090", "091"], hint: "090 ou 091" }
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
    
    // Guest States for Silent Account Creation
    const [guestName, setGuestName] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [orderConfirmed, setOrderConfirmed] = useState(false);
    const [confirmedOrderId, setConfirmedOrderId] = useState("");
    
    // Account Finishing States
    const [password, setPassword] = useState("");
    const [isFinishingAccount, setIsFinishingAccount] = useState(false);

    useEffect(() => {
        if (cartItems.length === 0 && !isProcessing && !orderConfirmed) {
            router.push('/');
        }
    }, [cartItems, router, isProcessing, orderConfirmed]);

    const validatePhoneNumber = (phone: string, network: MobileNetwork) => {
        const config = NETWORK_CONFIG[network];
        const prefixPattern = config.prefixes.join("|");
        const regex = new RegExp(`^(${prefixPattern})\\d{7}$`);
        return regex.test(phone);
    };

    const handlePlaceOrder = async () => {
        let currentUserId = user?.uid;
        let finalName = user?.name || guestName;
        let finalEmail = user?.email || guestEmail;

        if (!user) {
            if (!guestName || !guestEmail) {
                toast({ title: "Infos requises", description: "Veuillez entrer votre nom et email.", variant: "destructive" });
                return;
            }
            setIsProcessing(true);
            try {
                const userCred = await signInAnonymously(auth);
                currentUserId = userCred.user.uid;
                await updateProfile(userCred.user, { displayName: guestName });
            } catch (err) {
                toast({ title: "Erreur session", description: "Impossible de créer une session invité.", variant: "destructive" });
                setIsProcessing(false);
                return;
            }
        }

        if (paymentMethod === 'MOBILE_MONEY') {
            if (!customerPhone || !validatePhoneNumber(customerPhone, mobileNetwork)) {
                toast({ title: "Numéro invalide", description: "Vérifiez votre numéro de téléphone.", variant: "destructive" });
                setIsProcessing(false);
                return;
            }
        }

        setIsProcessing(true);

        try {
            const orderData = {
                userId: currentUserId,
                customerEmail: finalEmail,
                customerName: finalName,
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
            setConfirmedOrderId(orderRef.id);

            // Notifications
            await addDoc(collection(db, "notifications"), {
                userId: 'staff',
                title: "Nouvelle Commande !",
                message: `Le client ${finalName} a passé une commande de $${totalPrice.toFixed(2)}.`,
                type: 'success',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/orders'
            });

            if (!user) {
                // Créer un document utilisateur temporaire
                await setDoc(doc(db, "users", currentUserId!), {
                    id: currentUserId,
                    email: finalEmail,
                    displayName: finalName,
                    name: finalName,
                    role: 'customer',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }

            clearCart();
            setOrderConfirmed(true);
            toast({ title: "Commande validée !", description: "Merci de votre confiance." });

        } catch (error) {
            console.error("Order error:", error);
            toast({ title: "Erreur", description: "Échec de l'enregistrement de la commande.", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFinishAccount = async () => {
        if (password.length < 6) {
            toast({ title: "Mot de passe court", description: "Minimum 6 caractères.", variant: "destructive" });
            return;
        }
        setIsFinishingAccount(true);
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                await updateEmail(currentUser, guestEmail);
                await updatePassword(currentUser, password);
                toast({ title: "Compte créé !", description: "Votre espace Premium est prêt." });
                router.push('/dashboard/orders');
            }
        } catch (err: any) {
            console.error(err);
            toast({ title: "Erreur", description: err.message, variant: "destructive" });
        } finally {
            setIsFinishingAccount(false);
        }
    };

    if (orderConfirmed) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
                <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden opacity-20">
                    <div className="absolute top-[20%] left-[20%] w-[60vw] h-[60vw] bg-accent/20 rounded-full blur-[120px]" />
                </div>
                
                <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-700">
                    <div className="w-24 h-24 bg-green-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-green-500 border border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
                        <CheckCircle2 size={48} />
                    </div>
                    
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">COMMANDE <span className="text-accent">ENREGISTRÉE</span></h1>
                        <p className="text-muted-foreground font-medium">Référence : #{confirmedOrderId.substring(0, 8).toUpperCase()}</p>
                    </div>

                    {!user && (
                        <Card className="glossy-card border-none rounded-[2.5rem] p-8 text-left space-y-6">
                            <div className="space-y-2">
                                <Badge className="bg-accent/10 text-accent border-none uppercase text-[10px] font-black px-3 py-1">Offre Exclusive</Badge>
                                <h2 className="text-xl font-black uppercase italic tracking-tight leading-none">Voulez-vous suivre votre setup ?</h2>
                                <p className="text-xs text-muted-foreground leading-relaxed">Définissez un mot de passe pour activer votre espace client, suivre vos garanties et vos futurs achats.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Votre nouveau mot de passe</Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                        <Input 
                                            type="password" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••" 
                                            className="h-14 pl-12 bg-background/50 border-white/5 rounded-2xl focus:border-accent"
                                        />
                                    </div>
                                </div>
                                <Button 
                                    className="w-full h-14 bg-accent text-black font-black uppercase italic rounded-2xl gap-2 group"
                                    onClick={handleFinishAccount}
                                    disabled={isFinishingAccount}
                                >
                                    {isFinishingAccount ? <Loader2 className="animate-spin" /> : (
                                        <>ACTIVER MON ESPACE <ArrowRight className="group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </Button>
                            </div>
                        </Card>
                    )}

                    <div className="pt-8">
                        <Button variant="ghost" onClick={() => router.push('/')} className="text-xs font-black uppercase italic opacity-40 hover:opacity-100">
                           Retour à la boutique
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

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
                        <ArrowLeft size={16} /> Retour
                    </Button>
                    <div className="flex items-center gap-2 text-accent">
                        <Lock size={14} className="opacity-50" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Transaction sécurisée SSL</span>
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

                        {!user && (
                            <Card className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 space-y-6">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="text-accent" size={20} />
                                    <h2 className="text-sm font-black uppercase tracking-widest italic">Informations Client</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nom complet</Label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                            <Input 
                                                value={guestName}
                                                onChange={(e) => setGuestName(e.target.value)}
                                                placeholder="Ex: John Doe" 
                                                className="h-12 pl-12 bg-background/50 border-white/5 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Email pour le reçu</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                            <Input 
                                                type="email"
                                                value={guestEmail}
                                                onChange={(e) => setGuestEmail(e.target.value)}
                                                placeholder="john@example.com" 
                                                className="h-12 pl-12 bg-background/50 border-white/5 rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <ShieldCheck size={20} className="text-accent" />
                                <h2 className="text-sm font-black uppercase tracking-widest italic">Mode de paiement</h2>
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
                                                ? "bg-accent/10 border-accent" 
                                                : "bg-white/5 border-white/5 hover:bg-white/10"
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
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-4 text-accent">
                                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center"><Coins size={24} /></div>
                                        <div>
                                            <h3 className="font-black uppercase italic tracking-tighter">Paiement Pi Network</h3>
                                            <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Consensus Global 1 π = $314,159</p>
                                        </div>
                                    </div>
                                    <div className="bg-accent/5 border border-accent/20 p-5 rounded-xl flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase text-accent">Total π :</span>
                                        <span className="font-black text-2xl text-white">{(totalPrice / PI_CONVERSION_RATE).toFixed(8)} π</span>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === "MOBILE_MONEY" && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-4 text-accent">
                                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center"><Smartphone size={24} /></div>
                                        <div><h3 className="font-black uppercase italic tracking-tighter">Mobile Money</h3><p className="text-[10px] uppercase font-bold opacity-60">M-Pesa, Airtel, Orange, Africell</p></div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Opérateur</Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {Object.entries(NETWORK_CONFIG).map(([id, config]) => (
                                                <button key={id} onClick={() => setMobileNetwork(id as MobileNetwork)} className={cn("p-4 rounded-xl border text-[10px] font-black uppercase transition-all flex flex-col items-center gap-2", mobileNetwork === id ? "bg-white text-black border-white shadow-xl scale-105" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10")}>
                                                    <div className={cn("w-3 h-3 rounded-full", config.color)} />{config.label}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="relative group">
                                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                            <Input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Numéro 10 chiffres" className="h-16 pl-14 rounded-2xl bg-background/50 border-white/5" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === "CASH" && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-4 text-orange-400">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-400/10 flex items-center justify-center"><MapPin size={24} /></div>
                                        <div><h3 className="font-black uppercase italic tracking-tighter">Paiement au Bureau</h3><p className="text-[10px] uppercase font-bold opacity-60">Immeuble Bahati, Bunia</p></div>
                                    </div>
                                    <div className="p-6 rounded-xl bg-orange-500/5 border border-orange-500/10 text-orange-200 text-xs">
                                        Veuillez vous présenter sous 24h avec votre ID de commande pour finaliser le retrait.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <Card className="glossy-card border-none rounded-[2.5rem] overflow-hidden sticky top-28">
                            <CardHeader className="bg-white/5 p-8 border-b border-white/5">
                                <CardTitle className="text-lg font-black uppercase italic tracking-tighter">Résumé</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-4">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-white/80">{item.name} x{item.quantity}</span>
                                        <span className="font-black text-white">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="pt-6 mt-6 border-t border-white/5 space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black uppercase text-muted-foreground">TOTAL</span>
                                        <div className="text-right">
                                            <p className="text-4xl font-black text-accent tracking-tighter leading-none">${totalPrice.toFixed(2)}</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">≈ {(totalPrice / PI_CONVERSION_RATE).toFixed(6)} π</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-8 bg-white/5">
                                <Button 
                                    className="w-full h-20 bg-accent text-black hover:bg-accent/90 rounded-2xl font-black uppercase italic text-xl gap-3 shadow-xl disabled:opacity-30"
                                    onClick={handlePlaceOrder}
                                    disabled={isProcessing || cartItems.length === 0}
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <><ShoppingBag size={24} /> CONFIRMER</>}
                                </Button>
                            </CardFooter>
                        </Card>
                        
                        <div className="flex items-center gap-3 px-6 py-4 bg-white/5 rounded-2xl border border-white/5 opacity-40">
                            <ShieldCheck size={20} className="text-accent" />
                            <p className="text-[9px] font-bold uppercase tracking-widest leading-relaxed">Paiement ultra-sécurisé & Protection DKS.</p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
