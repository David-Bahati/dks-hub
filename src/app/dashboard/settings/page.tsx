
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    User, 
    ShieldCheck, 
    Settings, 
    Mail, 
    LogOut, 
    ArrowLeft,
    Lock,
    Smartphone,
    Database,
    DollarSign,
    Coins,
    RefreshCw,
    Loader2,
    Camera,
    MapPin,
    History,
    Trash2,
    MessageCircle,
    Moon,
    Sun,
    Languages,
    Trophy,
    Github,
    Globe,
    ShieldAlert,
    Eye,
    EyeOff,
    Wallet,
    ExternalLink,
    AlertTriangle,
    Crown,
    Star,
    Sparkles,
    CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
    Tabs, 
    TabsContent, 
    TabsList, 
    TabsTrigger 
} from "@/components/ui/tabs";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase';
import { 
    signOut, 
    updateProfile, 
    updatePassword, 
    reauthenticateWithCredential, 
    EmailAuthProvider 
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PI_CONVERSION_RATE, PI_MERCHANT_WALLET } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useTheme } from "next-themes";

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { theme, setTheme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Profile States
    const [name, setName] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [address, setAddress] = useState("");
    const [photoURL, setPhotoURL] = useState("");
    const [language, setLanguage] = useState("fr");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [orderCount, setOrderCount] = useState(0);

    // Security States
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);
    
    // System States
    const [exchangeRate, setExchangeRate] = useState("2500");
    const [piValue, setPiValue] = useState(PI_CONVERSION_RATE.toString());
    const [isSavingSystem, setIsSavingSystem] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setWhatsapp(user.whatsapp || user.phoneNumber || "");
            setAddress(user.address || "");
            setPhotoURL(user.photoURL || "");
            setLanguage(user.language || "fr");
            fetchUserStats();
        }
        fetchSystemConfig();
    }, [user]);

    const fetchUserStats = async () => {
        if (!user?.uid) return;
        try {
            const q = query(collection(db, "orders"), where("userId", "==", user.uid));
            const snap = await getDocs(q);
            setOrderCount(snap.size);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchSystemConfig = async () => {
        try {
            const configRef = doc(db, "system", "config");
            const configSnap = await getDoc(configRef);
            if (configSnap.exists()) {
                setExchangeRate(configSnap.data().exchangeRate?.toString() || "2500");
                setPiValue(configSnap.data().piValue?.toString() || PI_CONVERSION_RATE.toString());
            }
        } catch (error) {
            console.error("Config fetch error:", error);
        }
    };

    const isAdmin = user?.role?.toLowerCase() === 'admin';

    // Loyalty Info Calculation
    const loyalty = useMemo(() => {
        const points = orderCount * 100;
        if (points >= 1000) return { label: "Membre Gold", level: 3, icon: <Crown size={24} className="text-yellow-400" />, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20", perks: ["Priorité SAV 24h", "Livraison Bunia Offerte", "Ateliers IA Gratuits"] };
        if (points >= 500) return { label: "Membre Silver", level: 2, icon: <Star size={24} className="text-slate-300" />, color: "text-slate-300", bg: "bg-slate-300/10", border: "border-slate-300/20", perks: ["Priorité SAV 48h", "-10% sur Formations", "Diagnostic Diagnostic Offert"] };
        return { label: "Membre Bronze", level: 1, icon: <Trophy size={24} className="text-orange-400" />, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20", perks: ["Accès au Hub Central", "Support par Ticket", "Historique Digital"] };
    }, [orderCount]);

    const handleUpdateProfile = async () => {
        if (!user?.uid) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                name,
                displayName: name,
                whatsapp,
                address,
                language,
                updatedAt: serverTimestamp()
            });

            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: name });
            }

            toast({ title: "Profil mis à jour", description: "Vos informations DKS sont à jour." });
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de sauvegarder.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            toast({ title: "Fichier volumineux", description: "La taille maximale est de 2Mo.", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setPhotoURL(base64String);
            if (user?.uid) {
                await updateDoc(doc(db, "users", user.uid), { photoURL: base64String });
                if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: base64String });
                toast({ title: "Photo mise à jour" });
            }
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push('/login');
    };

    return (
        <div className="min-h-screen w-full bg-background text-foreground pb-20">
            <header className="border-b border-white/5 bg-background/40 backdrop-blur-2xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                            <Settings size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">RÉGLAGES <span className="text-accent">HUB</span></h1>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Plateforme Elite DKS</p>
                        </div>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline" className="h-11 border-white/10 rounded-2xl gap-2 font-black uppercase italic text-[10px] tracking-widest">
                            <ArrowLeft size={14} /> Retour
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-12">
                <Tabs defaultValue="profile" className="space-y-10">
                    <TabsList className="bg-white/5 border border-white/5 p-1.5 rounded-[1.5rem] h-16 w-full max-w-2xl mx-auto flex">
                        <TabsTrigger value="profile" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">
                            <User size={14} className="mr-2" /> Profil
                        </TabsTrigger>
                        <TabsTrigger value="loyalty" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">
                            <Crown size={14} className="mr-2" /> Fidélité
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">
                            <ShieldCheck size={14} className="mr-2" /> Sécurité
                        </TabsTrigger>
                        {isAdmin && (
                          <TabsTrigger value="system" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">
                              <Database size={14} className="mr-2" /> Admin
                          </TabsTrigger>
                        )}
                    </TabsList>

                    {/* ONGLET PROFIL */}
                    <TabsContent value="profile" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-1 space-y-6">
                                <Card className="glossy-card border-none rounded-[2.5rem] overflow-hidden text-center p-8">
                                    <div className="relative inline-block mx-auto mb-6 group">
                                        <Avatar className="h-40 w-40 border-4 border-accent p-1.5 bg-background shadow-2xl">
                                            <AvatarImage src={photoURL} className="rounded-full object-cover" />
                                            <AvatarFallback className="bg-primary/20 text-accent text-5xl font-black italic">
                                                {user?.name?.substring(0, 1)}
                                            </AvatarFallback>
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="absolute bottom-2 right-2 w-10 h-10 bg-accent text-black rounded-full flex items-center justify-center shadow-xl border-4 border-background hover:scale-110 active:scale-95 transition-all"
                                            >
                                                {isUploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Camera size={16} />}
                                            </button>
                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                                        </Avatar>
                                    </div>
                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter truncate">{name}</h3>
                                    <p className="text-xs text-muted-foreground uppercase font-bold opacity-60 mb-6">{user?.email}</p>
                                    
                                    <div className={cn("p-6 rounded-[2rem] border flex flex-col items-center gap-3 relative overflow-hidden", loyalty.bg, loyalty.border)}>
                                        <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles className={loyalty.color} size={60} /></div>
                                        {loyalty.icon}
                                        <p className={cn("text-xs font-black uppercase italic tracking-widest", loyalty.color)}>{loyalty.label}</p>
                                    </div>
                                </Card>

                                <Card className="glossy-card border-none rounded-[2.5rem] p-8 space-y-6">
                                    <div className="flex items-center gap-3"><Globe size={18} className="text-accent" /><h4 className="text-[11px] font-black uppercase italic tracking-widest">Préférences Interface</h4></div>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                {theme === 'dark' ? <Moon size={16} className="text-accent" /> : <Sun size={16} className="text-yellow-400" />}
                                                <span className="text-[10px] font-black uppercase">Mode Sombre</span>
                                            </div>
                                            <Switch checked={theme === 'dark'} onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase opacity-40 ml-1">Langue de l'interface</Label>
                                            <Select value={language} onValueChange={setLanguage}>
                                                <SelectTrigger className="h-12 bg-background/50 border-white/5 rounded-xl text-xs font-bold uppercase">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-white/10">
                                                    <SelectItem value="fr" className="text-xs font-bold uppercase">Français (RDC)</SelectItem>
                                                    <SelectItem value="en" className="text-xs font-bold uppercase">English (Global)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            <div className="lg:col-span-2 space-y-6">
                                <Card className="glossy-card border-none rounded-[2.5rem] p-10">
                                    <div className="flex items-center gap-4 mb-10">
                                        <User className="text-accent" size={24} />
                                        <div>
                                            <h2 className="text-xl font-black uppercase italic tracking-tight">INFORMATIONS DE CONTACT</h2>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Utilisées pour vos factures DKS</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Nom complet</Label>
                                            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-2xl focus:border-accent text-sm" />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Numéro WhatsApp</Label>
                                                <Badge className="bg-green-500/10 text-green-400 border-none text-[8px] h-4">VALIDÉ BUNIA</Badge>
                                            </div>
                                            <div className="relative">
                                                <MessageCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+243..." className="h-14 pl-14 bg-background/50 border-white/5 rounded-2xl focus:border-accent" />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Adresse de livraison à Bunia</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Quartier, Avenue, N° Maison..." className="h-14 pl-14 bg-background/50 border-white/5 rounded-2xl focus:border-accent" />
                                            </div>
                                        </div>
                                    </div>

                                    <Button onClick={handleUpdateProfile} disabled={isSaving} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl gap-3 shadow-xl shadow-accent/10">
                                        {isSaving ? <Loader2 className="animate-spin" /> : <><RefreshCw size={18} /> Mettre à jour mon profil</>}
                                    </Button>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ONGLET FIDÉLITÉ (NOUVEAU) */}
                    <TabsContent value="loyalty" className="animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             <Card className={cn("border-none rounded-[3rem] p-10 relative overflow-hidden flex flex-col justify-between h-[500px]", loyalty.bg, loyalty.border)}>
                                <div className="absolute top-0 right-0 p-12 opacity-5"><Logo size="xl" /></div>
                                
                                <div className="space-y-6 relative z-10">
                                    <Badge className="bg-white/10 text-white font-black uppercase italic border-none px-4 py-1.5">CARTE DIGITALE DKS ELITE</Badge>
                                    <div className="space-y-2">
                                        <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-tight text-white">STATUT <br /><span className={loyalty.color}>{loyalty.label}</span></h2>
                                        <p className="text-sm font-bold opacity-60 uppercase">Titulaire : {name}</p>
                                    </div>
                                </div>

                                <div className="space-y-8 relative z-10">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black uppercase opacity-40">Points Fidélité ({orderCount * 100})</span>
                                            <span className="text-[10px] font-black uppercase text-accent">{orderCount * 100} / {loyalty.level === 3 ? '1000+' : loyalty.level === 2 ? '1000' : '500'} pts</span>
                                        </div>
                                        <Progress value={Math.min(100, ((orderCount * 100) / (loyalty.level === 1 ? 500 : 1000)) * 100)} className="h-3 bg-black/20" indicatorClassName={cn("transition-all duration-1000", loyalty.color === 'text-yellow-400' ? 'bg-yellow-400' : loyalty.color === 'text-slate-300' ? 'bg-slate-300' : 'bg-orange-400')} />
                                        <p className="text-[8px] font-black uppercase italic opacity-40 text-center">Plus vous utilisez nos services, plus vous montez en grade.</p>
                                    </div>
                                    <div className="flex justify-between items-center bg-black/20 p-6 rounded-3xl border border-white/5">
                                        <div>
                                            <p className="text-[9px] font-black uppercase opacity-40">Membre depuis</p>
                                            <p className="text-sm font-bold uppercase">{user?.createdAt?.toDate ? user.createdAt.toDate().getFullYear() : '2024'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase opacity-40">ID Membre</p>
                                            <p className="text-sm font-mono font-bold">DKS-{user?.uid.substring(0, 6).toUpperCase()}</p>
                                        </div>
                                    </div>
                                </div>
                             </Card>

                             <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <Sparkles className="text-accent" size={24} />
                                    <h2 className="text-xl font-black uppercase italic tracking-tight">VOS AVANTAGES ÉLITE</h2>
                                </div>
                                <div className="space-y-4">
                                    {loyalty.perks.map((perk, i) => (
                                        <div key={i} className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-accent/5 transition-all">
                                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <span className="font-bold text-sm uppercase italic tracking-tight">{perk}</span>
                                        </div>
                                    ))}
                                    <div className="p-8 mt-4 rounded-[2rem] bg-accent/10 border border-accent/20 text-center space-y-4">
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            En atteignant le statut <strong>Gold</strong>, vous obtenez un accès illimité à notre support technique prioritaire et des tarifs réduits sur tout le hardware.
                                        </p>
                                        <Link href="/services">
                                            <Button variant="outline" className="rounded-xl border-accent/20 text-accent font-black uppercase italic text-[10px]">
                                                Explorer les services premium
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                             </Card>
                        </div>
                    </TabsContent>

                    {/* ONGLET SÉCURITÉ */}
                    <TabsContent value="security" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <Lock className="text-accent" size={24} />
                                    <h2 className="text-xl font-black uppercase italic tracking-tight">ACCÈS & PROTECTION</h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Mot de passe actuel</Label>
                                        <Input type={showPasswords ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Nouveau mot de passe</Label>
                                        <Input type={showPasswords ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Confirmer le nouveau code</Label>
                                        <Input type={showPasswords ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-xl" />
                                    </div>
                                    <button onClick={() => setShowPasswords(!showPasswords)} className="text-[10px] font-black uppercase italic text-accent hover:underline ml-1">
                                        {showPasswords ? "Masquer les codes" : "Afficher les codes"}
                                    </button>
                                </div>
                                <Button onClick={async () => {
                                    if (newPassword !== confirmPassword) { toast({ title: "Incohérent", description: "Les mots de passe ne correspondent pas.", variant: "destructive" }); return; }
                                    if (newPassword.length < 6) { toast({ title: "Trop court", description: "Minimum 6 caractères.", variant: "destructive" }); return; }
                                    setIsUpdatingPassword(true);
                                    try {
                                        const credential = EmailAuthProvider.credential(user?.email || "", currentPassword);
                                        await reauthenticateWithCredential(auth.currentUser!, credential);
                                        await updatePassword(auth.currentUser!, newPassword);
                                        toast({ title: "Sécurité mise à jour", description: "Votre nouveau mot de passe est actif." });
                                        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
                                    } catch (e) { toast({ title: "Échec", description: "Vérifiez votre mot de passe actuel.", variant: "destructive" }); }
                                    setIsUpdatingPassword(false);
                                }} disabled={isUpdatingPassword || !currentPassword} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/10">
                                    {isUpdatingPassword ? <Loader2 className="animate-spin" /> : "Appliquer la nouvelle sécurité"}
                                </Button>
                             </Card>

                             <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-6">
                                <div className="flex items-center gap-4"><ShieldAlert size={24} className="text-accent" /><h2 className="text-xl font-black uppercase italic tracking-tight">SESSIONS ACTIVES</h2></div>
                                <div className="space-y-4">
                                    <div className="p-5 bg-accent/5 border border-accent/20 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><Smartphone size={20} /></div>
                                            <div>
                                                <p className="text-xs font-black uppercase italic">Cet appareil</p>
                                                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Bunia, RDC • Actif maintenant</p>
                                            </div>
                                        </div>
                                        <Badge className="bg-accent text-black font-black text-[9px] px-2 h-5">EN LIGNE</Badge>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest text-center mt-6">Utilisez uniquement le Pi Browser pour une sécurité maximale.</p>
                                </div>
                             </Card>
                        </div>
                    </TabsContent>

                    {/* ONGLET SYSTÈME (ADMIN SEULEMENT) */}
                    {isAdmin && (
                        <TabsContent value="system" className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-8">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-4"><RefreshCw className="text-accent" size={22} /><h2 className="text-xl font-black uppercase italic tracking-tight">TAUX DE CHANGE</h2></div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Valeur de 1 USD en CDF</Label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-black">FC</span>
                                            <Input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className="h-16 pl-14 bg-background/50 border-white/5 rounded-2xl text-xl font-bold" />
                                        </div>
                                    </div>
                                    <Button onClick={async () => {
                                        setIsSavingSystem(true);
                                        await setDoc(doc(db, "system", "config"), { exchangeRate: parseInt(exchangeRate) }, { merge: true });
                                        toast({ title: "Taux mis à jour", description: `1$ = ${exchangeRate} CDF` });
                                        setIsSavingSystem(false);
                                    }} disabled={isSavingSystem} className="w-full h-14 bg-accent text-black font-black uppercase italic rounded-xl shadow-lg shadow-accent/10">{isSavingSystem ? <Loader2 className="animate-spin" /> : "Mettre à jour la boutique"}</Button>
                                </Card>

                                <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-8">
                                    <div className="flex items-center gap-4"><Wallet className="text-accent" size={22} /><h2 className="text-xl font-black uppercase italic tracking-tight">INTERFACE PI NETWORK</h2></div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Portefeuille Merchant (Sandbox)</Label>
                                            <div className="p-4 bg-background/50 border border-white/5 rounded-2xl flex items-center justify-between group">
                                                <code className="text-[10px] font-mono text-muted-foreground break-all">{PI_MERCHANT_WALLET || 'NON CONFIGURÉ'}</code>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex gap-4">
                                            <AlertTriangle className="text-orange-500 shrink-0" size={18} />
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase text-orange-500">Mode Consensus GCV Actif</p>
                                                <p className="text-[9px] text-muted-foreground leading-tight">La boutique applique le taux 1π = $314,159 pour tous les services techniques.</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </TabsContent>
                    )}
                </Tabs>

                <div className="mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/40 italic">DKS SHOPMANAGER SUPREME V3.0 • EXCELLENCE ITURI</p>
                    <Button variant="ghost" onClick={handleLogout} className="text-destructive hover:bg-destructive/10 rounded-2xl px-12 h-14 font-black uppercase italic text-xs tracking-[0.2em] gap-3 border border-destructive/10">
                        <LogOut size={18} /> FERMER LA SESSION HUB
                    </Button>
                </div>
            </main>
        </div>
    );
}
