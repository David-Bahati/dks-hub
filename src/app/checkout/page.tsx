
"use client";

import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc } from "firebase/firestore";
import { signInAnonymously, updatePassword, updateProfile, updateEmail } from "firebase/auth";
import { PI_CONVERSION_RATE } from "@/lib/constants";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  Coins, 
  Smartphone, 
  Banknote, 
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
  ShoppingBag,
  Star,
  Printer,
  QrCode,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PaymentMethod = "PI_NETWORK" | "MOBILE_MONEY" | "CASH";
type MobileNetwork = "VODACOM" | "AIRTEL" | "ORANGE" | "AFRICELL";

const NETWORK_CONFIG = {
  VODACOM: { label: "Vodacom", color: "bg-red-600", prefixes: ["081", "082", "083"] },
  AIRTEL: { label: "Airtel", color: "bg-red-700", prefixes: ["097", "098", "099"] },
  ORANGE: { label: "Orange", color: "bg-orange-500", prefixes: ["084", "085", "089"] },
  AFRICELL: { label: "Africell", color: "bg-purple-600", prefixes: ["090", "091"] }
};

export default function CheckoutPage() {
    const { cartItems, totalPrice, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const receiptRef = useRef<HTMLDivElement>(null);
    
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PI_NETWORK");
    const [mobileNetwork, setMobileNetwork] = useState<MobileNetwork>("VODACOM");
    const [customerPhone, setCustomerPhone] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [exchangeRate, setExchangeRate] = useState(2500);
    
    // Guest States
    const [guestName, setGuestName] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [orderConfirmed, setOrderConfirmed] = useState(false);
    const [confirmedOrderId, setConfirmedOrderId] = useState("");
    const [showFinishAccount, setShowFinishAccount] = useState(false);
    const [orderSnapshot, setOrderSnapshot] = useState<any>(null);
    
    // Account Finishing States
    const [password, setPassword] = useState("");
    const [isFinishingAccount, setIsFinishingAccount] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (cartItems.length === 0 && !isProcessing && !orderConfirmed) {
            router.push('/');
        }
        fetchRate();
    }, [cartItems, router, isProcessing, orderConfirmed]);

    const fetchRate = async () => {
        try {
            const snap = await getDoc(doc(db, "system", "config"));
            if (snap.exists()) setExchangeRate(snap.data().exchangeRate || 2500);
        } catch (e) {
            console.error(e);
        }
    };

    const validatePhoneNumber = (phone: string, network: MobileNetwork) => {
        const config = NETWORK_CONFIG[network];
        const prefixPattern = config.prefixes.join("|");
        const regex = new RegExp(`^(${prefixPattern})\\d{7}$`);
        return regex.test(phone);
    };

    const handlePlaceOrder = async () => {
        // Déterminer si on doit traiter l'utilisateur comme un invité
        // Un utilisateur est un invité s'il n'est pas connecté OU s'il n'a pas de rôle staff et pas de nom
        const wasGuest = !user || auth.currentUser?.isAnonymous;
        
        let currentUserId = user?.uid;
        let finalName = user?.name || guestName;
        let finalEmail = user?.email || guestEmail;

        if (wasGuest) {
            if (!guestName.trim() || !guestEmail.trim()) {
                toast({ title: "Infos requises", description: "Veuillez entrer votre nom et email pour le reçu.", variant: "destructive" });
                return;
            }
        }

        if (paymentMethod === 'MOBILE_MONEY') {
            if (!customerPhone || !validatePhoneNumber(customerPhone, mobileNetwork)) {
                toast({ title: "Numéro invalide", description: "Vérifiez votre numéro de téléphone.", variant: "destructive" });
                return;
            }
        }

        setIsProcessing(true);

        try {
            if (wasGuest) {
                const userCred = await signInAnonymously(auth);
                currentUserId = userCred.user.uid;
                await updateProfile(userCred.user, { displayName: guestName });
                
                await setDoc(doc(db, "users", currentUserId), {
                    id: currentUserId,
                    email: finalEmail,
                    displayName: finalName,
                    name: finalName,
                    role: 'customer',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }

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
            
            // On prépare la vue de succès AVANT de changer l'état global
            setConfirmedOrderId(orderRef.id);
            setOrderSnapshot(orderData);
            if (wasGuest) setShowFinishAccount(true);

            // Notifications Staff
            await addDoc(collection(db, "notifications"), {
                userId: 'staff',
                title: "Nouvelle Commande !",
                message: `Le client ${finalName} a passé une commande de $${totalPrice.toFixed(2)}.`,
                type: 'success',
                isRead: false,
                createdAt: serverTimestamp(),
                link: '/dashboard/orders'
            });

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
                // On essaie de lier l'email et le mot de passe
                await updateEmail(currentUser, guestEmail);
                await updatePassword(currentUser, password);
                toast({ title: "Compte activé !", description: "Bienvenue dans l'univers Premium DKS." });
                router.push('/dashboard');
            }
        } catch (err: any) {
            console.error(err);
            toast({ title: "Erreur", description: err.message, variant: "destructive" });
        } finally {
            setIsFinishingAccount(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!receiptRef.current) return;
        setIsDownloading(true);
        try {
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`BON_DKS_${confirmedOrderId.substring(0, 8).toUpperCase()}.pdf`);
            toast({ title: "Téléchargement réussi", description: "Votre bon est dans vos fichiers." });
        } catch (error) {
            console.error("PDF Error:", error);
            toast({ title: "Erreur", description: "Échec de la génération du PDF.", variant: "destructive" });
        } finally {
            setIsDownloading(false);
        }
    };

    // VUE DE SUCCÈS (APPRÈS CONFIRMATION)
    if (orderConfirmed) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-12 px-6">
                <style jsx global>{`
                    @media print {
                        .no-print { display: none !important; }
                        .print-only { display: block !important; }
                        body { background: white !important; color: black !important; }
                        .order-slip { border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
                    }
                `}</style>
                
                <div className="max-w-2xl w-full space-y-8 animate-in fade-in zoom-in duration-700">
                    <div className="text-center no-print">
                        <div className="w-20 h-20 bg-green-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-green-500 border border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.2)] mb-6">
                            <CheckCircle2 size={40} />
                        </div>
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">COMMANDE <span className="text-accent">RÉUSSIE</span></h1>
                        <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px] mt-2">Votre reçu numérique est prêt</p>
                    </div>

                    <div ref={receiptRef}>
                        <Card className="order-slip glossy-card border-none rounded-[2.5rem] overflow-hidden bg-white text-black shadow-2xl relative">
                            <div className="absolute top-0 left-0 w-full h-2 bg-accent no-print" />
                            <CardHeader className="p-10 border-b border-gray-100 flex flex-row justify-between items-start">
                                <div className="space-y-1">
                                    <div className="bg-black text-white px-3 py-1 font-black text-lg italic tracking-tighter inline-block mb-2">DKS SHOP</div>
                                    <h2 className="text-xl font-black uppercase italic leading-none">Bon de Commande</h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Réf : #{confirmedOrderId.substring(0, 10).toUpperCase()}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-[10px] font-black uppercase text-gray-400">Date</p>
                                    <p className="text-xs font-bold">{new Date().toLocaleDateString('fr-FR')}</p>
                                </div>
                            </CardHeader>
                            
                            <CardContent className="p-10 space-y-8">
                                <div className="grid grid-cols-2 gap-8 text-[10px] uppercase font-bold tracking-wider">
                                    <div>
                                        <p className="text-gray-400 mb-2">Client</p>
                                        <p className="text-sm font-black">{orderSnapshot?.customerName}</p>
                                        <p className="text-gray-500 font-medium lowercase">{orderSnapshot?.customerEmail}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-400 mb-2">Point de Retrait</p>
                                        <p className="text-sm font-black">Immeuble Bahati</p>
                                        <p className="text-gray-500 font-medium">BUNIA, ITURI, RDC</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase text-gray-400 border-b pb-2">Articles commandés</p>
                                    {orderSnapshot?.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center py-1">
                                            <div className="flex-1">
                                                <p className="text-sm font-bold uppercase italic">{item.name}</p>
                                                <p className="text-[10px] text-gray-400">Quantité : {item.quantity}</p>
                                            </div>
                                            <p className="font-black text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
                                    <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                                        <span>Mode de règlement</span>
                                        <span className="text-black">{orderSnapshot?.paymentMethod?.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-2 border-t border-gray-200">
                                        <span className="text-xs font-black uppercase">Total à payer</span>
                                        <div className="text-right">
                                            <p className="text-3xl font-black leading-none">${orderSnapshot?.total.toFixed(2)}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">≈ {(orderSnapshot?.total * exchangeRate).toLocaleString()} FC</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="p-10 bg-gray-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white border border-gray-200 rounded-lg">
                                        <QrCode size={40} className="text-black" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] font-black uppercase text-gray-400">Validation Interne</p>
                                        <p className="text-[7px] font-bold text-gray-300">SCAN_CODE_VERIFY_DKS</p>
                                    </div>
                                </div>
                                <p className="text-[9px] font-bold italic text-gray-400 max-w-[180px] text-right">
                                    Présentez ce bon à la caisse pour finaliser le retrait.
                                </p>
                            </CardFooter>
                        </Card>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 no-print">
                        <Button 
                            className="flex-1 h-14 bg-white text-black hover:bg-white/90 font-black uppercase italic rounded-2xl gap-3 shadow-xl"
                            onClick={() => window.print()}
                        >
                            <Printer size={20} /> Imprimer
                        </Button>
                        <Button 
                            className="flex-1 h-14 bg-accent text-black hover:bg-accent/90 font-black uppercase italic rounded-2xl gap-3 shadow-xl"
                            onClick={handleDownloadPDF}
                            disabled={isDownloading}
                        >
                            {isDownloading ? <Loader2 className="animate-spin" /> : <><Download size={20} /> Télécharger (PDF)</>}
                        </Button>
                    </div>

                    {/* CRÉATION DE COMPTE SILENCIEUSE (SI NOUVEAU CLIENT) */}
                    {showFinishAccount && (
                        <Card className="glossy-card border-none rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden no-print animate-in slide-in-from-bottom-4 delay-500 duration-1000">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
                            <div className="space-y-2 relative z-10">
                                <Badge className="bg-accent/20 text-accent border-none uppercase text-[10px] font-black px-3 py-1 mb-2">
                                    <Star size={10} className="mr-1 fill-accent" /> Offre Membre
                                </Badge>
                                <h2 className="text-xl font-black uppercase italic tracking-tight leading-none">ACTIVER VOTRE ESPACE PREMIUM ?</h2>
                                <p className="text-[11px] text-muted-foreground leading-relaxed font-light">
                                    Définissez un mot de passe pour suivre votre colis, gérer vos garanties et bénéficier de remises exclusives.
                                </p>
                            </div>
                            <div className="space-y-4 relative z-10">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Votre nouveau mot de passe</Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                        <Input 
                                            type="password" 
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••" 
                                            className="h-14 pl-12 bg-background/50 border-white/5 rounded-2xl focus:border-accent transition-all"
                                        />
                                    </div>
                                </div>
                                <Button 
                                    className="w-full h-14 bg-accent text-black font-black uppercase italic rounded-2xl gap-2 group shadow-xl shadow-accent/10"
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

                    <div className="text-center no-print">
                        <Button variant="ghost" className="uppercase font-black italic text-xs opacity-40 hover:opacity-100" onClick={() => router.push('/')}>
                            Retour à la boutique
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // VUE DU FORMULAIRE DE PAIEMENT
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

                        {/* RENSEIGNEMENTS CLIENT - VISIBLES SI PAS DE COMPTE PERMANENT */}
                        {(!user || auth.currentUser?.isAnonymous) && (
                            <Card className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 space-y-6 animate-in fade-in slide-in-from-top-4">
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
                                                className="h-12 pl-12 bg-background/50 border-white/5 rounded-xl focus:border-accent"
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
                                                className="h-12 pl-12 bg-background/50 border-white/5 rounded-xl focus:border-accent"
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
                                            <Input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Numéro de téléphone" className="h-16 pl-14 rounded-2xl bg-background/50 border-white/5" />
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
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">≈ {(totalPrice * exchangeRate).toLocaleString()} FC</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-8 bg-white/5">
                                <Button 
                                    className="w-full h-20 bg-accent text-black hover:bg-accent/90 rounded-2xl font-black uppercase italic text-xl gap-3 shadow-xl disabled:opacity-30 transition-all"
                                    onClick={handlePlaceOrder}
                                    disabled={isProcessing || cartItems.length === 0}
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <><ShoppingBag size={24} /> CONFIRMER</>}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                </div>
            </main>
        </div>
    );
}
