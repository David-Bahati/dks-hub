
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
    EyeOff
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
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
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
    EmailAuthProvider,
    deleteUser 
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PI_CONVERSION_RATE } from '@/lib/constants';
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
    const [confirmDeletePass, setConfirmDeletePass] = useState("");
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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

    // Loyalty Logic
    const loyaltyInfo = useMemo(() => {
        if (orderCount >= 10) return { label: "Membre Or", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" };
        if (orderCount >= 5) return { label: "Membre Argent", color: "text-slate-300", bg: "bg-slate-300/10", border: "border-slate-300/20" };
        return { label: "Membre Bronze", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" };
    }, [orderCount]);

    // Password strength logic
    const passwordStrength = useMemo(() => {
        if (!newPassword) return 0;
        let score = 0;
        if (newPassword.length >= 8) score += 25;
        if (/[A-Z]/.test(newPassword)) score += 25;
        if (/[0-9]/.test(newPassword)) score += 25;
        if (/[^A-Za-z0-9]/.test(newPassword)) score += 25;
        return score;
    }, [newPassword]);

    const getStrengthColor = (score: number) => {
        if (score <= 25) return "bg-red-500";
        if (score <= 50) return "bg-orange-500";
        if (score <= 75) return "bg-yellow-500";
        return "bg-green-500";
    };

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
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Édition Premium DKS</p>
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
                        <TabsTrigger value="security" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">
                            <ShieldCheck size={14} className="mr-2" /> Sécurité
                        </TabsTrigger>
                        {isAdmin && (
                          <TabsTrigger value="system" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">
                              <Database size={14} className="mr-2" /> Système
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
                                    
                                    <div className={cn("p-4 rounded-2xl border flex flex-col items-center gap-2", loyaltyInfo.bg, loyaltyInfo.border)}>
                                        <Trophy className={cn("w-8 h-8", loyaltyInfo.color)} />
                                        <p className={cn("text-[10px] font-black uppercase italic tracking-widest", loyaltyInfo.color)}>{loyaltyInfo.label}</p>
                                        <div className="w-full h-1.5 bg-black/20 rounded-full mt-2">
                                            <div className={cn("h-full rounded-full bg-current opacity-50 transition-all duration-1000", loyaltyInfo.color)} style={{ width: `${Math.min(100, (orderCount/10)*100)}%` }} />
                                        </div>
                                        <p className="text-[8px] font-bold uppercase text-muted-foreground">{orderCount}/10 commandes vers Or</p>
                                    </div>
                                </Card>

                                <Card className="glossy-card border-none rounded-[2.5rem] p-8 space-y-6">
                                    <div className="flex items-center gap-3"><Globe size={18} className="text-accent" /><h4 className="text-[11px] font-black uppercase italic tracking-widest">Préférences</h4></div>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                                                <span className="text-[10px] font-bold uppercase">Mode Sombre</span>
                                            </div>
                                            <Switch checked={theme === 'dark'} onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[9px] font-black uppercase opacity-40">Langue de l'interface</Label>
                                            <Select value={language} onValueChange={setLanguage}>
                                                <SelectTrigger className="h-10 bg-background/50 border-white/5 rounded-xl text-xs font-bold uppercase">
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
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Détails essentiels pour vos factures DKS</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nom complet</Label>
                                            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-2xl focus:border-accent text-sm" />
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Numéro WhatsApp</Label>
                                                <Badge className="bg-green-500/10 text-green-400 border-none text-[8px] h-4">PRIORITAIRE BUNIA</Badge>
                                            </div>
                                            <div className="relative">
                                                <MessageCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+243..." className="h-14 pl-14 bg-background/50 border-white/5 rounded-2xl focus:border-accent" />
                                            </div>
                                        </div>
                                        <div className="md:col-span-2 space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Adresse de livraison par défaut</Label>
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

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-4">COMPTES SOCIAUX LIÉS</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Card className="bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                                    </svg>
                                                </div>
                                                <span className="text-xs font-bold uppercase italic">Google</span>
                                            </div>
                                            <Badge className="bg-accent/10 text-accent border-none text-[8px] px-2 h-5">LIÉ</Badge>
                                        </Card>
                                        <Card className="bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                                    <Github size={20} />
                                                </div>
                                                <span className="text-xs font-bold uppercase italic">GitHub</span>
                                            </div>
                                            <Badge className="bg-accent/10 text-accent border-none text-[8px] px-2 h-5">LIÉ</Badge>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ONGLET SÉCURITÉ */}
                    <TabsContent value="security" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                             <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <Lock className="text-accent" size={24} />
                                    <h2 className="text-xl font-black uppercase italic tracking-tight">ACCÈS & CODE PIN</h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Mot de passe actuel</Label>
                                        <Input type={showPasswords ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end mb-1">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nouveau mot de passe</Label>
                                            <span className="text-[8px] font-bold uppercase opacity-40">Force: {passwordStrength}%</span>
                                        </div>
                                        <Input type={showPasswords ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-xl" />
                                        <Progress value={passwordStrength} className="h-1 bg-white/5" indicatorClassName={getStrengthColor(passwordStrength)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Confirmer</Label>
                                        <Input type={showPasswords ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-xl" />
                                    </div>
                                    <button onClick={() => setShowPasswords(!showPasswords)} className="text-[10px] font-black uppercase italic text-accent hover:underline">
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
                                        toast({ title: "Succès !", description: "Sécurité mise à jour." });
                                        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
                                    } catch (e) { toast({ title: "Échec", description: "Vérifiez votre mot de passe actuel.", variant: "destructive" }); }
                                    setIsUpdatingPassword(false);
                                }} disabled={isUpdatingPassword || !currentPassword} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/10">
                                    {isUpdatingPassword ? <Loader2 className="animate-spin" /> : "Mettre à jour la sécurité"}
                                </Button>
                             </Card>

                             <div className="space-y-8">
                                <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-6">
                                    <div className="flex items-center gap-4"><Smartphone size={24} className="text-accent" /><h2 className="text-xl font-black uppercase italic tracking-tight">SESSIONS ACTIVES</h2></div>
                                    <div className="space-y-4">
                                        <div className="p-5 bg-accent/5 border border-accent/20 rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><Smartphone size={20} /></div>
                                                <div>
                                                    <p className="text-xs font-black uppercase italic">Cet appareil</p>
                                                    <p className="text-[9px] text-muted-foreground uppercase font-bold">Bunia, RDC • Actif maintenant</p>
                                                </div>
                                            </div>
                                            <Badge className="bg-accent text-black font-black text-[9px] px-2 h-5">SESSION</Badge>
                                        </div>
                                        
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black uppercase italic">Confirmation par email</span>
                                                <span className="text-[8px] text-muted-foreground uppercase">Protéger les commandes sensibles</span>
                                            </div>
                                            <Switch />
                                        </div>

                                        <Button variant="ghost" className="w-full h-12 text-[10px] font-black uppercase italic text-destructive hover:bg-destructive/5 rounded-xl border border-dashed border-destructive/20">Se déconnecter de tous les autres appareils</Button>
                                    </div>
                                </Card>

                                <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-6">
                                    <div className="flex items-center gap-4"><History size={24} className="text-accent" /><h2 className="text-xl font-black uppercase italic tracking-tight">JOURNAL SÉCURITÉ</h2></div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 py-2 border-b border-white/5">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <div><p className="text-[10px] font-black uppercase italic">Connexion réussie</p><p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Il y a quelques instants • Bunia</p></div>
                                        </div>
                                        <div className="flex items-center gap-4 py-2">
                                            <div className="w-2 h-2 rounded-full bg-accent" />
                                            <div><p className="text-[10px] font-black uppercase italic">Profil Premium Activé</p><p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Aujourd'hui, {new Date().getHours()}:{new Date().getMinutes()}</p></div>
                                        </div>
                                    </div>
                                </Card>
                             </div>
                        </div>

                        <div className="flex justify-center pt-10">
                            <Button variant="ghost" className="text-destructive/40 hover:text-destructive hover:bg-destructive/5 font-black uppercase italic text-[10px] tracking-[0.2em] gap-2">
                                <ShieldAlert size={14} /> Supprimer mon compte client
                            </Button>
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
                                        <Label className="text-[10px] font-black uppercase opacity-60">1 USD en Franc Congolais (CDF)</Label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-black">FC</span>
                                            <Input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className="h-16 pl-14 bg-background/50 border-white/5 rounded-2xl text-xl font-bold" />
                                        </div>
                                    </div>
                                    <Button onClick={async () => {
                                        setIsSavingSystem(true);
                                        await setDoc(doc(db, "system", "config"), { exchangeRate: parseInt(exchangeRate) }, { merge: true });
                                        toast({ title: "Boutique mise à jour", description: `Taux fixé à ${exchangeRate} CDF.` });
                                        setIsSavingSystem(false);
                                    }} disabled={isSavingSystem} className="w-full h-14 bg-accent text-black font-black uppercase italic rounded-xl">{isSavingSystem ? <Loader2 className="animate-spin" /> : "Appliquer à la boutique"}</Button>
                                </Card>
                            </div>
                        </TabsContent>
                    )}
                </Tabs>

                <div className="mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent/40 italic">DKS SHOPMANAGER SUPREME V3.0</p>
                    <Button variant="ghost" onClick={handleLogout} className="text-destructive hover:bg-destructive/10 rounded-2xl px-12 h-14 font-black uppercase italic text-xs tracking-[0.2em] gap-3 border border-destructive/10">
                        <LogOut size={18} /> FERMER LA SESSION
                    </Button>
                </div>
            </main>
        </div>
    );
}
