
"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
    Loader2, 
    CreditCard, 
    Smartphone, 
    Coins, 
    Zap, 
    Globe, 
    CheckCircle2, 
    ShieldCheck, 
    Lock, 
    Eye, 
    EyeOff, 
    ArrowRight,
    QrCode,
    AlertCircle,
    ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type PaymentMethod = 'pi' | 'dkst' | 'mobile_money' | 'visa';

export default function CheckoutPage() {
    const { cartItems, totalPrice, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [method, setMethod] = useState<PaymentMethod>('pi');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // PIN Verification States for DKST
    const [isPinOpen, setIsPinOpen] = useState(false);
    const [pin, setPin] = useState("");
    const [showPin, setShowPin] = useState(false);

    // Mobile Money / Visa specific states
    const [phoneNumber, setPhone] = useState("");
    const [cardNumber, setCardNumber] = useState("");

    const validateOrder = async () => {
        if (!user) {
            toast({ title: "Connexion requise", description: "Veuillez vous connecter pour valider l'achat." });
            router.push(`/login?redirect=/checkout`);
            return;
        }

        if (method === 'dkst') {
            if (!user.walletPin) {
                toast({ title: "PIN non configuré", description: "Veuillez définir un code PIN dans vos réglages de sécurité." });
                router.push('/dashboard/settings');
                return;
            }
            if ((user.tokenBalance || 0) < totalPrice) {
                toast({ title: "Solde DKST insuffisant", variant: "destructive" });
                return;
            }
            setIsPinOpen(true);
        } else if (method === 'pi') {
            handlePiPayment();
        } else {
            // Mobile Money / Visa simulation
            executeOrder();
        }
    };

    const handlePiPayment = async () => {
        setIsProcessing(true);
        // Simulate Pi SDK Call or use real window.Pi if available
        const isPiBrowser = typeof window !== 'undefined' && /PiBrowser/i.test(navigator.userAgent);
        
        if (isPiBrowser && (window as any).Pi) {
            try {
                toast({ title: "Ouverture du Pi Wallet...", description: "Veuillez confirmer la transaction dans votre Pi Browser." });
                // En production, on appellerait Pi.createPayment(...)
                // Simulation pour le prototype :
                setTimeout(() => executeOrder(), 3000);
            } catch (e) {
                setIsProcessing(false);
                toast({ title: "Erreur Pi SDK", variant: "destructive" });
            }
        } else {
            toast({ 
                title: "Hors Pi Browser", 
                description: "Le paiement Pi officiel nécessite le Pi Browser. Commande mise en attente de scan au Hub." 
            });
            executeOrder();
        }
    };

    const confirmPinAndPay = async () => {
        if (pin === user?.walletPin) {
            setIsPinOpen(false);
            executeOrder();
        } else {
            toast({ title: "Code PIN incorrect", variant: "destructive" });
            setPin("");
        }
    };

    const executeOrder = async () => {
        setIsProcessing(true);
        try {
            const orderData = {
                userId: user?.uid,
                customerName: user?.name,
                customerEmail: user?.email,
                items: cartItems,
                total: totalPrice,
                status: method === 'dkst' || method === 'visa' || method === 'mobile_money' ? "paid" : "pending_payment",
                paymentMethod: method.toUpperCase(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            const orderRef = await addDoc(collection(db, "orders"), orderData);

            // Deduct tokens if DKST
            if (method === 'dkst' && user?.uid) {
                await updateDoc(doc(db, "users", user.uid), {
                    tokenBalance: increment(-totalPrice),
                    updatedAt: serverTimestamp()
                });

                await addDoc(collection(db, "tokenTransactions"), {
                    userId: user.uid,
                    userName: user.name,
                    type: 'exchange',
                    tokenAmount: totalPrice,
                    memo: `Achat Boutique DKS #${orderRef.id.substring(0, 8)}`,
                    createdAt: serverTimestamp()
                });
            }

            toast({ 
                title: "Commande confirmée !", 
                description: "Votre reçu est disponible dans votre dashboard." 
            });
            
            clearCart();
            router.push('/dashboard/orders');
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de valider la commande.", variant: "destructive" });
        } finally {
            setIsProcessing(false);
        }
    };

    if (cartItems.length === 0 && !isProcessing) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
                <ShoppingBag size={64} className="opacity-20" />
                <h1 className="text-3xl font-black uppercase italic">Votre panier est vide</h1>
                <Button onClick={() => router.push('/')} className="bg-accent text-black font-black uppercase italic rounded-2xl">Retour Boutique</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex items-center gap-4 mb-12">
                    <Button variant="ghost" onClick={() => router.back()} className="h-12 w-12 rounded-2xl border border-white/5"><ArrowRight className="rotate-180" /></Button>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter">Paiement <span className="text-accent">Sécurisé</span></h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* RÉSUMÉ */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="glossy-card border-none rounded-[2.5rem] p-8 space-y-6">
                            <CardHeader className="p-0 border-b border-white/5 pb-4">
                                <CardTitle className="text-sm font-black uppercase italic tracking-widest text-accent">Articles sélectionnés</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <p className="font-bold truncate uppercase italic text-[11px]">{item.name}</p>
                                            <p className="text-[10px] text-white/40">Quantité: {item.quantity}</p>
                                        </div>
                                        <span className="font-black text-accent">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                                    </div>
                                ))}
                            </CardContent>
                            <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                                <span className="text-[10px] font-black uppercase text-white/40">Total à régler</span>
                                <span className="text-4xl font-black text-white italic tracking-tighter">${totalPrice.toFixed(2)}</span>
                            </div>
                        </Card>

                        <div className="p-6 bg-accent/5 rounded-3xl border border-accent/20 flex items-center gap-4">
                            <ShieldCheck className="text-accent" size={32} />
                            <p className="text-[10px] font-bold text-accent uppercase leading-relaxed italic">
                                Transactions protégées par le protocole DKS. Signature cryptographique requise pour les actifs numériques.
                            </p>
                        </div>
                    </div>

                    {/* MODES DE PAIEMENT */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                                onClick={() => setMethod('pi')}
                                className={cn(
                                    "p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-start gap-4 text-left group relative overflow-hidden",
                                    method === 'pi' ? "bg-yellow-500/10 border-yellow-500 text-yellow-500" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                )}
                            >
                                <Globe size={32} className={cn("transition-transform group-hover:scale-110", method === 'pi' ? "text-yellow-500" : "opacity-20")} />
                                <div>
                                    <p className="font-black uppercase italic text-lg">Pi Network</p>
                                    <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest">Consensus GCV $314,159</p>
                                </div>
                                {method === 'pi' && <CheckCircle2 size={24} className="absolute top-6 right-6" />}
                            </button>

                            <button 
                                onClick={() => setMethod('dkst')}
                                className={cn(
                                    "p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-start gap-4 text-left group relative overflow-hidden",
                                    method === 'dkst' ? "bg-accent/10 border-accent text-accent" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                )}
                            >
                                <Zap size={32} className={cn("transition-transform group-hover:scale-110", method === 'dkst' ? "text-accent" : "opacity-20")} />
                                <div>
                                    <p className="font-black uppercase italic text-lg">Jeton DKST</p>
                                    <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest">Paiement par Wallet Interne</p>
                                </div>
                                {method === 'dkst' && <CheckCircle2 size={24} className="absolute top-6 right-6" />}
                            </button>

                            <button 
                                onClick={() => setMethod('mobile_money')}
                                className={cn(
                                    "p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-start gap-4 text-left group relative overflow-hidden",
                                    method === 'mobile_money' ? "bg-primary/10 border-primary text-primary" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                )}
                            >
                                <Smartphone size={32} className={cn("transition-transform group-hover:scale-110", method === 'mobile_money' ? "text-primary" : "opacity-20")} />
                                <div>
                                    <p className="font-black uppercase italic text-lg">Mobile Money</p>
                                    <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest">Airtel, Orange, M-Pesa</p>
                                </div>
                                {method === 'mobile_money' && <CheckCircle2 size={24} className="absolute top-6 right-6" />}
                            </button>

                            <button 
                                onClick={() => setMethod('visa')}
                                className={cn(
                                    "p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-start gap-4 text-left group relative overflow-hidden",
                                    method === 'visa' ? "bg-white/10 border-white text-white" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                )}
                            >
                                <CreditCard size={32} className={cn("transition-transform group-hover:scale-110", method === 'visa' ? "text-white" : "opacity-20")} />
                                <div>
                                    <p className="font-black uppercase italic text-lg">Carte Visa / MC</p>
                                    <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest">Transaction Bancaire Directe</p>
                                </div>
                                {method === 'visa' && <CheckCircle2 size={24} className="absolute top-6 right-6" />}
                            </button>
                        </div>

                        {/* FORMULAIRES DYNAMIQUES */}
                        <Card className="glossy-card border-none rounded-[3rem] p-10 animate-in fade-in slide-in-from-bottom-4">
                            {method === 'mobile_money' && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Numéro de téléphone M-Money</Label>
                                        <Input 
                                            placeholder="+243..." 
                                            value={phoneNumber} 
                                            onChange={e => setPhone(e.target.value)} 
                                            className="h-14 bg-background/50 border-white/10 rounded-2xl text-xl font-bold"
                                        />
                                    </div>
                                    <p className="text-[9px] text-muted-foreground italic uppercase">Une demande de confirmation sera envoyée sur votre téléphone.</p>
                                </div>
                            )}

                            {method === 'visa' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Numéro de Carte</Label>
                                            <Input 
                                                placeholder="**** **** **** ****" 
                                                value={cardNumber} 
                                                onChange={e => setCardNumber(e.target.value)} 
                                                className="h-14 bg-background/50 border-white/10 rounded-2xl"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Expiration</Label>
                                                <Input placeholder="MM/YY" className="h-14 bg-background/50 border-white/10 rounded-2xl text-center" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">CVC</Label>
                                                <Input placeholder="***" className="h-14 bg-background/50 border-white/10 rounded-2xl text-center" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {method === 'pi' && (
                                <div className="flex flex-col items-center gap-6 py-4">
                                    <QrCode size={120} className="text-white opacity-20" />
                                    <p className="text-sm text-white/70 italic text-center max-w-md">
                                        Si vous n'êtes pas dans le Pi Browser, vous pourrez scanner le code QR officiel au comptoir du Hub pour finaliser le transfert GCV.
                                    </p>
                                </div>
                            )}

                            {method === 'dkst' && (
                                <div className="p-8 bg-accent/5 rounded-[2.5rem] border border-accent/20 flex flex-col items-center gap-6 text-center">
                                    <Lock size={40} className="text-accent animate-pulse" />
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-black uppercase italic">Wallet interne DKS</h4>
                                        <p className="text-sm text-white/60 italic leading-relaxed">
                                            Le montant sera déduit de votre solde miné. Votre **Signature PIN** sera demandée à l'étape suivante.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-accent text-black font-black uppercase text-[10px]">Solde: {user?.tokenBalance?.toFixed(2) || 0} DKST</Badge>
                                    </div>
                                </div>
                            )}

                            <Button 
                                onClick={validateOrder} 
                                disabled={isProcessing}
                                className="w-full h-20 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20 text-lg mt-10 gap-3 hover:scale-[1.02] transition-all"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={24} /> Confirmer & Payer ${totalPrice.toFixed(2)}</>}
                            </Button>
                        </Card>
                    </div>
                </div>
            </main>

            {/* PIN VERIFICATION DIALOG */}
            <Dialog open={isPinOpen} onOpenChange={setIsPinOpen}>
                <DialogContent className="bg-card border-white/10 text-foreground rounded-[2.5rem] sm:max-w-md overflow-hidden p-0">
                    <DialogHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-accent/20 flex items-center justify-center text-accent shadow-xl shadow-accent/10"><Lock size={40} /></div>
                            <div className="text-center">
                                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Signature Élite</DialogTitle>
                                <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 mt-2">Autorisation requise pour débit DKST</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="p-10 space-y-10">
                        <div className="space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-center block opacity-40">Entrez votre code secret à 4 chiffres</Label>
                            <div className="relative w-full max-w-[200px] mx-auto">
                                <Input 
                                    type={showPin ? "text" : "password"} 
                                    maxLength={4} 
                                    value={pin} 
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} 
                                    className="h-20 bg-background/50 border-white/10 rounded-2xl text-center text-5xl font-black tracking-[0.5em] focus:border-accent" 
                                    autoFocus 
                                />
                                <button onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-accent transition-colors">
                                    {showPin ? <EyeOff size={20}/> : <Eye size={20}/>}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Button variant="ghost" onClick={() => setIsPinOpen(false)} className="h-14 rounded-2xl font-black uppercase italic text-xs">Annuler</Button>
                            <Button onClick={confirmPinAndPay} disabled={pin.length < 4 || isProcessing} className="h-14 bg-accent text-black font-black uppercase italic text-xs rounded-2xl shadow-xl shadow-accent/20">Signer & Valider</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
