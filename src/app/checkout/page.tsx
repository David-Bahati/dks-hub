
"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc } from "firebase/firestore";
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
    ShoppingBag,
    Banknote,
    Check,
    MapPin,
    Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { PI_GCV } from "@/lib/constants";

type PaymentMethod = 'pi' | 'dkst' | 'mobile_money' | 'visa' | 'cash';

const OPERATORS = [
    { id: 'vodacom', name: 'Vodacom', color: 'border-red-600', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Vodafone_icon.svg/1200px-Vodafone_icon.svg.png' },
    { id: 'airtel', name: 'Airtel', color: 'border-red-500', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Airtel_logo.svg/1200px-Airtel_logo.svg.png' },
    { id: 'orange', name: 'Orange', color: 'border-orange-500', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/1200px-Orange_logo.svg.png' },
    { id: 'africell', name: 'Africell', color: 'border-blue-600', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Africell_logo.svg/1200px-Africell_logo.svg.png' },
];

export default function CheckoutPage() {
    const { cartItems, totalPrice, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [method, setMethod] = useState<PaymentMethod>('pi');
    const [isProcessing, setIsProcessing] = useState(false);
    const [exchangeRate, setExchangeRate] = useState(2500);
    
    // Mobile Money specific states
    const [selectedOperator, setSelectedOperator] = useState<string | null>(null);
    const [phoneNumber, setPhone] = useState("");

    // PIN Verification States for DKST
    const [isPinOpen, setIsPinOpen] = useState(false);
    const [pin, setPin] = useState("");
    const [showPin, setShowPin] = useState(false);

    // Visa specific states
    const [cardNumber, setCardNumber] = useState("");

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const snap = await getDoc(doc(db, "system", "config"));
                if (snap.exists()) {
                    setExchangeRate(snap.data().exchangeRate || 2500);
                }
            } catch (e) {
                console.error("Erreur config:", e);
            }
        };
        fetchConfig();
    }, []);

    const handleOperatorSelect = (opId: string) => {
        setSelectedOperator(opId);
        if (!phoneNumber.startsWith("+243")) {
            setPhone("+243");
        }
    };

    const validateOrder = () => {
        if (!user) {
            toast({ title: "Connexion requise", description: "Veuillez vous connecter pour valider l'achat." });
            router.push(`/login?redirect=/checkout`);
            return;
        }

        if (method === 'dkst') {
            const currentBalance = user.tokenBalance || 0;
            
            if (currentBalance < totalPrice) {
                toast({ 
                    title: "Solde insuffisant", 
                    description: `Il vous manque ${(totalPrice - currentBalance).toFixed(2)} DKST.`,
                    variant: "destructive" 
                });
                return;
            }

            if (!user.walletPin) {
                toast({ 
                    title: "PIN non configuré", 
                    description: "Veuillez définir un code PIN dans vos réglages.",
                    variant: "destructive"
                });
                router.push('/dashboard/settings');
                return;
            }

            setIsPinOpen(true);
        } else if (method === 'pi') {
            handlePiPayment();
        } else {
            executeOrder();
        }
    };

    const handlePiPayment = () => {
        setIsProcessing(true);
        const isPiBrowser = typeof window !== 'undefined' && /PiBrowser/i.test(navigator.userAgent);
        
        // Generate a simulated hash for the invoice
        const mockTxId = `PI-HASH-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;

        if (isPiBrowser && (window as any).Pi) {
            toast({ title: "Ouverture du Pi Wallet...", description: "Veuillez confirmer la transaction dans votre Pi Browser." });
            setTimeout(() => executeOrder(mockTxId), 3000);
        } else {
            toast({ 
                title: "Hors Pi Browser", 
                description: "Le paiement Pi officiel nécessite le Pi Browser. Commande mise en attente." 
            });
            executeOrder(mockTxId);
        }
    };

    const confirmPinAndPay = () => {
        if (pin === user?.walletPin) {
            setIsPinOpen(false);
            executeOrder();
        } else {
            toast({ title: "Code PIN incorrect", variant: "destructive" });
            setPin("");
        }
    };

    const executeOrder = (piTxId?: string) => {
        setIsProcessing(true);
        
        const orderData = {
            userId: user?.uid,
            customerName: user?.name,
            customerEmail: user?.email,
            items: cartItems,
            total: totalPrice,
            piValue: totalPrice / PI_GCV,
            piTxId: piTxId || null,
            cdfValue: totalPrice * exchangeRate,
            status: method === 'dkst' || method === 'visa' || method === 'mobile_money' ? "paid" : "pending_payment",
            paymentMethod: method === 'pi' ? 'PI_NETWORK' : method.toUpperCase(),
            operator: selectedOperator || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const ordersRef = collection(db, "orders");
        
        addDoc(ordersRef, orderData)
            .then((orderRef) => {
                if (method === 'dkst' && user?.uid) {
                    const userRef = doc(db, "users", user.uid);
                    const txRef = collection(db, "tokenTransactions");

                    const balanceUpdate = {
                        tokenBalance: increment(-totalPrice),
                        updatedAt: serverTimestamp()
                    };

                    updateDoc(userRef, balanceUpdate).catch(async (err) => {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({
                            path: userRef.path,
                            operation: 'update',
                            requestResourceData: balanceUpdate
                        }));
                    });

                    const txData = {
                        userId: user.uid,
                        userName: user.name,
                        type: 'exchange',
                        tokenAmount: totalPrice,
                        memo: `Achat Boutique DKS #${orderRef.id.substring(0, 8)}`,
                        createdAt: serverTimestamp()
                    };

                    addDoc(txRef, txData).catch(async (err) => {
                        errorEmitter.emit('permission-error', new FirestorePermissionError({
                            path: txRef.path,
                            operation: 'create',
                            requestResourceData: txData
                        }));
                    });
                }

                toast({ 
                    title: "Commande confirmée !", 
                    description: "Votre reçu est disponible dans votre dashboard." 
                });
                
                clearCart();
                router.push('/dashboard/orders');
            })
            .catch(async (error) => {
                setIsProcessing(false);
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: ordersRef.path,
                    operation: 'create',
                    requestResourceData: orderData
                }));
            });
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

    const isBalanceInsufficient = method === 'dkst' && (user?.tokenBalance || 0) < totalPrice;

    const renderPriceContext = () => {
        switch(method) {
            case 'pi':
                return (
                    <div className="text-right">
                        <p className="text-4xl font-black text-white italic tracking-tighter">${totalPrice.toFixed(2)}</p>
                        <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mt-1">≈ {(totalPrice / PI_GCV).toFixed(6)} π (GCV)</p>
                    </div>
                );
            case 'mobile_money':
            case 'cash':
                return (
                    <div className="text-right">
                        <p className="text-4xl font-black text-white italic tracking-tighter">${totalPrice.toFixed(2)}</p>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest mt-1", method === 'cash' ? "text-green-500" : "text-primary")}>
                            ≈ {(totalPrice * exchangeRate).toLocaleString()} CDF
                        </p>
                    </div>
                );
            case 'dkst':
                return (
                    <div className="text-right">
                        <p className="text-4xl font-black text-white italic tracking-tighter">${totalPrice.toFixed(2)}</p>
                        <p className="text-[10px] font-black text-accent uppercase tracking-widest mt-1">{totalPrice.toFixed(2)} DKST</p>
                    </div>
                );
            default:
                return (
                    <div className="text-right">
                        <p className="text-4xl font-black text-white italic tracking-tighter">${totalPrice.toFixed(2)}</p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex items-center gap-4 mb-12">
                    <Button variant="ghost" onClick={() => router.back()} className="h-12 w-12 rounded-2xl border border-white/5"><ArrowRight className="rotate-180" /></Button>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter">Paiement <span className="text-accent">Sécurisé</span></h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
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
                                <span className="text-[10px] font-black uppercase text-white/40 mb-1">Total à régler</span>
                                {renderPriceContext()}
                            </div>
                        </Card>

                        <div className="p-6 bg-accent/5 rounded-3xl border border-accent/20 flex items-center gap-4">
                            <ShieldCheck className="text-accent" size={32} />
                            <p className="text-[10px] font-bold text-accent uppercase leading-relaxed italic">
                                Transactions protégées par le protocole DKS. Signature cryptographique requise pour les actifs numériques.
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest">Consensus GCV</p>
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
                                    <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest">Wallet Interne</p>
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
                                onClick={() => setMethod('cash')}
                                className={cn(
                                    "p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-start gap-4 text-left group relative overflow-hidden",
                                    method === 'cash' ? "bg-green-500/10 border-green-500 text-green-500" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                )}
                            >
                                <Banknote size={32} className={cn("transition-transform group-hover:scale-110", method === 'cash' ? "text-green-500" : "opacity-20")} />
                                <div>
                                    <p className="font-black uppercase italic text-lg">Cash / Espèces</p>
                                    <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest">Réglé au bureau</p>
                                </div>
                                {method === 'cash' && <CheckCircle2 size={24} className="absolute top-6 right-6" />}
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
                                    <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest">Transaction Directe</p>
                                </div>
                                {method === 'visa' && <CheckCircle2 size={24} className="absolute top-6 right-6" />}
                            </button>
                        </div>

                        <Card className="glossy-card border-none rounded-[3rem] p-10 animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
                            {method === 'mobile_money' && (
                                <div className="space-y-8">
                                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20 flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase text-primary tracking-widest">Montant à régler</span>
                                        <span className="text-xl font-black text-white">{(totalPrice * exchangeRate).toLocaleString()} CDF</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {OPERATORS.map((op) => (
                                                <button
                                                    key={op.id}
                                                    onClick={() => handleOperatorSelect(op.id)}
                                                    className={cn(
                                                        "p-4 rounded-2xl border-2 bg-white/5 transition-all flex flex-col items-center gap-3 group relative",
                                                        selectedOperator === op.id ? op.color : "border-white/5 opacity-60 hover:opacity-100"
                                                    )}
                                                >
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
                                                        <img src={op.logo} alt={op.name} className="w-full h-full object-contain" />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-tighter">{op.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Numéro de téléphone M-Money</Label>
                                        <Input 
                                            placeholder="+243..." 
                                            value={phoneNumber} 
                                            onChange={e => setPhone(e.target.value)} 
                                            className="h-14 bg-background/50 border-white/10 rounded-2xl text-xl font-bold focus:border-primary"
                                        />
                                    </div>
                                </div>
                            )}

                            {method === 'cash' && (
                                <div className="flex flex-col items-center text-center gap-8 py-4 animate-in zoom-in-95 duration-500">
                                    <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                                        <MapPin size={48} />
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Paiement <span className="text-green-500">au Bureau</span></h3>
                                        <p className="text-sm text-white/60 leading-relaxed italic max-w-md">
                                            Validez votre commande en ligne et présentez-vous à notre bureau physique de **Bunia (Immeuble Bahati)** pour effectuer le règlement en espèces.
                                        </p>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10 w-full max-w-sm flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase opacity-40">Total à prévoir</span>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-white italic">${totalPrice.toFixed(2)}</p>
                                            <p className="text-[10px] font-bold text-green-500 uppercase">≈ {(totalPrice * exchangeRate).toLocaleString()} CDF</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-white/40 italic">
                                        <Info size={14} className="text-green-500" />
                                        Votre matériel sera réservé pendant 24h.
                                    </div>
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
                                    <div className="text-center space-y-2">
                                        <p className="text-2xl font-black text-yellow-500 italic">{(totalPrice / PI_GCV).toFixed(6)} π</p>
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Valeur GCV $314,159</p>
                                    </div>
                                </div>
                            )}

                            {method === 'dkst' && (
                                <div className="p-8 bg-accent/5 rounded-[2.5rem] border border-accent/20 flex flex-col items-center gap-6 text-center">
                                    <Lock size={40} className="text-accent animate-pulse" />
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-black uppercase italic">Wallet interne DKS</h4>
                                        <p className="text-sm text-white/60 italic">
                                            Débit direct de votre solde miné. Signature PIN requise.
                                        </p>
                                    </div>
                                    <div className="w-full max-w-xs p-4 rounded-2xl border border-white/5 bg-black/40 flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase opacity-40">Solde</span>
                                        <span className={cn("text-lg font-black", isBalanceInsufficient ? "text-red-500" : "text-accent")}>
                                            {user?.tokenBalance?.toFixed(2) || 0} DKST
                                        </span>
                                    </div>
                                </div>
                            )}

                            <Button 
                                onClick={validateOrder} 
                                disabled={isProcessing || isBalanceInsufficient || (method === 'mobile_money' && (!phoneNumber || !selectedOperator))}
                                className={cn(
                                    "w-full h-20 font-black uppercase italic rounded-2xl shadow-xl text-lg mt-10 gap-3 hover:scale-[1.02] transition-all",
                                    (isBalanceInsufficient || (method === 'mobile_money' && (!phoneNumber || !selectedOperator))) ? "bg-white/5 text-white/20" : "bg-accent text-black shadow-accent/20"
                                )}
                            >
                                {isProcessing ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={24} /> Confirmer & Valider ${totalPrice.toFixed(2)}</>}
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
                                <input 
                                    type={showPin ? "text" : "password"} 
                                    maxLength={4} 
                                    value={pin} 
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} 
                                    className="h-20 w-full bg-background/50 border-white/10 rounded-2xl text-center text-5xl font-black tracking-[0.5em] focus:border-accent outline-none" 
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
