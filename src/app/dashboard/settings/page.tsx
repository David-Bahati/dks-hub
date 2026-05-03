
"use client";

import { useState, useEffect, useRef } from 'react';
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
    Upload,
    Monitor,
    History,
    AlertTriangle,
    CheckCircle2,
    Eye,
    EyeOff,
    Trash2
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
    DialogTrigger
} from "@/components/ui/dialog";
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
import { doc, updateDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PI_CONVERSION_RATE } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Form States
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [photoURL, setPhotoURL] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

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
    const [isFetchingRate, setIsFetchingRate] = useState(false);
    const [isSavingSystem, setIsSavingSystem] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setEmail(user.email || "");
            setPhotoURL(user.photoURL || "");
        }
        fetchSystemConfig();
    }, [user]);

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

    const getPasswordStrength = (pass: string) => {
        let score = 0;
        if (pass.length > 6) score += 20;
        if (pass.length > 10) score += 20;
        if (/[A-Z]/.test(pass)) score += 20;
        if (/[0-9]/.test(pass)) score += 20;
        if (/[^A-Za-z0-9]/.test(pass)) score += 20;
        return score;
    };

    const strength = getPasswordStrength(newPassword);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({ title: "Déconnexion", description: "Session fermée." });
            router.push('/login');
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const handleUpdatePassword = async () => {
        if (!auth.currentUser || !email) return;
        if (newPassword !== confirmPassword) {
            toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
            return;
        }
        if (newPassword.length < 6) {
            toast({ title: "Trop court", description: "Le mot de passe doit faire au moins 6 caractères.", variant: "destructive" });
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const credential = EmailAuthProvider.credential(email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            
            toast({ title: "Succès", description: "Votre mot de passe a été modifié." });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            toast({ title: "Erreur d'authentification", description: "Mot de passe actuel incorrect.", variant: "destructive" });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!auth.currentUser || !email) return;
        setIsDeletingAccount(true);
        try {
            const credential = EmailAuthProvider.credential(email, confirmDeletePass);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await deleteUser(auth.currentUser);
            toast({ title: "Compte supprimé", description: "Vos données ont été effacées." });
            router.push('/');
        } catch (err) {
            toast({ title: "Erreur", description: "Vérifiez votre mot de passe.", variant: "destructive" });
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast({ title: "Fichier volumineux", description: "Veuillez choisir une image de moins de 2MB.", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setPhotoURL(base64String);
            
            if (user?.uid) {
                try {
                    await updateDoc(doc(db, "users", user.uid), {
                        photoURL: base64String,
                        updatedAt: serverTimestamp()
                    });
                    
                    if (auth.currentUser) {
                        await updateProfile(auth.currentUser, { photoURL: base64String });
                    }
                    
                    toast({ title: "Photo mise à jour", description: "Votre nouvel avatar est enregistré." });
                } catch (err) {
                    toast({ title: "Erreur", description: "Impossible d'enregistrer l'image.", variant: "destructive" });
                }
            }
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateProfile = async () => {
        if (!user?.uid) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                name: name,
                displayName: name,
                phoneNumber: phone,
                updatedAt: serverTimestamp()
            });

            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: name });
            }

            toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées avec succès." });
        } catch (error) {
            console.error(error);
            toast({ title: "Erreur", description: "Impossible de mettre à jour le profil.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveSystem = async () => {
        setIsSavingSystem(true);
        try {
            await setDoc(doc(db, "system", "config"), {
                exchangeRate: parseInt(exchangeRate),
                piValue: parseFloat(piValue),
                updatedAt: serverTimestamp()
            }, { merge: true });
            toast({ title: "Configuration sauvegardée", description: "Le taux de change a été mis à jour pour toute la boutique." });
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsSavingSystem(false);
        }
    };

    const fetchTodayRate = async () => {
        setIsFetchingRate(true);
        try {
            const response = await fetch('https://open.er-api.com/v6/latest/USD');
            const data = await response.json();
            if (data && data.rates && data.rates.CDF) {
                const rate = Math.round(data.rates.CDF);
                setExchangeRate(rate.toString());
                toast({
                    title: "Taux récupéré",
                    description: `Le taux officiel est de ${rate} FC. N'oubliez pas de sauvegarder.`,
                });
            }
        } catch (error) {
            toast({ title: "Erreur API", variant: "destructive" });
        } finally {
            setIsFetchingRate(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-background text-foreground">
            <header className="border-b border-white/5 bg-background/40 backdrop-blur-2xl sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-lg shadow-accent/10">
                            <Settings size={22} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">
                                PARAMÈTRES <span className="text-accent font-light not-italic">CLIENT</span>
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-60">Gestion Premium DKS</p>
                        </div>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline" className="h-11 border-white/10 hover:bg-white/5 rounded-2xl gap-2 font-black uppercase italic text-[10px] tracking-widest px-6">
                            <ArrowLeft size={14} />
                            Retour
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <Tabs defaultValue="profile" className="space-y-12">
                    <TabsList className="bg-white/5 border border-white/5 p-1.5 rounded-[1.5rem] h-16 w-full flex justify-between items-stretch">
                        <TabsTrigger value="profile" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">
                            <User size={14} className="mr-2 hidden sm:inline" /> Profil
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">
                            <ShieldCheck size={14} className="mr-2 hidden sm:inline" /> Sécurité
                        </TabsTrigger>
                        {isAdmin && (
                          <TabsTrigger value="system" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">
                              <Database size={14} className="mr-2 hidden sm:inline" /> Système
                          </TabsTrigger>
                        )}
                    </TabsList>

                    {/* PROFIL TAB */}
                    <TabsContent value="profile" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
                            <div className="relative group">
                                <Avatar className="h-40 w-40 border-4 border-accent p-1.5 bg-background shadow-[0_0_40px_rgba(56,189,248,0.2)] overflow-visible">
                                    <AvatarImage src={photoURL || `https://picsum.photos/seed/${user?.uid}/200/200`} className="rounded-full object-cover" />
                                    <AvatarFallback className="bg-primary/20 text-accent text-4xl font-black italic">
                                        {user?.name?.substring(0, 1)}
                                    </AvatarFallback>
                                    
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-2 right-2 w-10 h-10 bg-accent text-black rounded-full flex items-center justify-center shadow-xl border-4 border-background hover:scale-110 active:scale-95 transition-all z-10"
                                        disabled={isUploading}
                                    >
                                        {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleImageChange} 
                                    />
                                </Avatar>
                            </div>
                            <div className="flex-1 space-y-3 pt-4">
                                <h3 className="text-4xl font-black uppercase italic tracking-tighter">{user?.name}</h3>
                                <Badge className="bg-accent/20 text-accent border-none font-black uppercase text-[10px] px-3 py-1 italic tracking-widest">{user?.role} Premium</Badge>
                                <p className="text-sm text-muted-foreground font-light max-w-md leading-relaxed">Gérez votre identité et votre image sur la plateforme.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="glossy-card border-none rounded-[2.5rem]">
                                <CardContent className="p-10 space-y-8">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nom complet</Label>
                                        <div className="relative">
                                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                            <Input 
                                                value={name} 
                                                onChange={(e) => setName(e.target.value)} 
                                                className="h-14 pl-14 bg-background/50 border-white/5 rounded-2xl focus:border-accent" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Adresse e-mail</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                            <Input value={email} disabled className="h-14 pl-14 bg-background/50 border-white/5 rounded-2xl opacity-50" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glossy-card border-none rounded-[2.5rem]">
                                <CardContent className="p-10 space-y-8">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Téléphone</Label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                            <Input 
                                                value={phone} 
                                                onChange={(e) => setPhone(e.target.value)} 
                                                placeholder="+243 ..." 
                                                className="h-14 pl-14 bg-background/50 border-white/5 rounded-2xl" 
                                            />
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={handleUpdateProfile} 
                                        disabled={isSaving}
                                        className="w-full h-14 bg-accent text-black font-black uppercase italic rounded-2xl"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin" /> : "Sauvegarder mon profil"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* SÉCURITÉ TAB */}
                    <TabsContent value="security" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Modification Mot de passe */}
                            <Card className="glossy-card border-none rounded-[2.5rem] overflow-hidden">
                                <CardHeader className="bg-white/5 p-8 border-b border-white/5">
                                    <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                                        <Lock size={16} className="text-accent" /> Accès & Code PIN
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Mot de passe actuel</Label>
                                            <Input type={showPasswords ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-12 bg-background/50 border-white/5 rounded-xl" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nouveau mot de passe</Label>
                                            <Input type={showPasswords ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12 bg-background/50 border-white/5 rounded-xl" />
                                            {newPassword && (
                                                <div className="space-y-1.5 pt-1">
                                                    <div className="flex justify-between text-[8px] font-black uppercase">
                                                        <span className="text-muted-foreground">Force du code</span>
                                                        <span className={cn(strength < 40 ? "text-red-400" : strength < 80 ? "text-orange-400" : "text-green-400")}>
                                                            {strength < 40 ? "Faible" : strength < 80 ? "Moyen" : "Supreme"}
                                                        </span>
                                                    </div>
                                                    <Progress value={strength} className="h-1 bg-white/5" indicatorClassName={cn(strength < 40 ? "bg-red-500" : strength < 80 ? "bg-orange-500" : "bg-green-500")} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Confirmer le nouveau code</Label>
                                            <Input type={showPasswords ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 bg-background/50 border-white/5 rounded-xl" />
                                        </div>
                                        <button onClick={() => setShowPasswords(!showPasswords)} className="text-[9px] font-black uppercase italic text-accent flex items-center gap-2 hover:underline">
                                            {showPasswords ? <EyeOff size={12} /> : <Eye size={12} />} {showPasswords ? "Masquer" : "Afficher les codes"}
                                        </button>
                                    </div>
                                    <Button onClick={handleUpdatePassword} disabled={isUpdatingPassword || !currentPassword || !newPassword} className="w-full bg-white text-black font-black uppercase italic h-12 rounded-xl">
                                        {isUpdatingPassword ? <Loader2 className="animate-spin" /> : "Mettre à jour le code"}
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Sessions & 2FA */}
                            <div className="space-y-8">
                                <Card className="glossy-card border-none rounded-[2.5rem]">
                                    <CardHeader className="p-8 pb-4">
                                        <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                                            <ShieldCheck size={16} className="text-accent" /> Sécurité Avancée
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-8 pt-0 space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="space-y-1">
                                                <p className="text-[11px] font-black uppercase italic">Protection Commandes</p>
                                                <p className="text-[9px] text-muted-foreground uppercase">Confirmer les achats par Email</p>
                                            </div>
                                            <Switch defaultChecked />
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Appareils Connectés</p>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-4 bg-accent/5 rounded-2xl border border-accent/20">
                                                    <div className="flex items-center gap-3">
                                                        <Smartphone size={20} className="text-accent" />
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase italic">Cet appareil</p>
                                                            <p className="text-[9px] text-muted-foreground">Bunia, RDC • Actif maintenant</p>
                                                        </div>
                                                    </div>
                                                    <Badge className="bg-accent text-black font-black text-[8px] border-none px-2 h-4">ACTUEL</Badge>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 opacity-50">
                                                    <div className="flex items-center gap-3">
                                                        <Monitor size={20} className="text-muted-foreground" />
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase italic">Chrome • Windows</p>
                                                            <p className="text-[9px] text-muted-foreground">Bunia, RDC • Il y a 2 jours</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" className="w-full text-[9px] font-black uppercase italic text-destructive hover:bg-destructive/10 h-10 rounded-xl">
                                                Se déconnecter de tous les autres appareils
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Historique d'activité */}
                                <Card className="glossy-card border-none rounded-[2.5rem]">
                                    <CardHeader className="p-8 pb-4">
                                        <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                                            <History size={16} className="text-accent" /> Journal de Sécurité
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-8 pb-8">
                                        <div className="space-y-4">
                                            {[
                                                { action: "Connexion réussie", date: "Aujourd'hui, 14:20", icon: CheckCircle2, color: "text-green-400" },
                                                { action: "Modification photo profil", date: "Hier, 09:45", icon: User, color: "text-accent" },
                                                { action: "Nouvelle commande #DKS...", date: "02/05/2024", icon: Smartphone, color: "text-accent" }
                                            ].map((log, idx) => (
                                                <div key={idx} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
                                                    <log.icon size={14} className={log.color} />
                                                    <div>
                                                        <p className="text-[10px] font-bold uppercase italic">{log.action}</p>
                                                        <p className="text-[8px] text-muted-foreground font-medium uppercase tracking-widest">{log.date}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Zone de Danger */}
                        <div className="pt-10 flex justify-center">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" className="text-destructive/40 hover:text-destructive hover:bg-destructive/5 font-black uppercase italic text-[9px] tracking-widest gap-2">
                                        <Trash2 size={12} /> Supprimer mon compte client
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-background border-destructive/20 rounded-[2rem]">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-black uppercase italic text-destructive">Action Irréversible</DialogTitle>
                                        <DialogDescription className="text-xs uppercase font-bold text-muted-foreground py-2">
                                            Toutes vos commandes et garanties seront effacées. Pour valider, entrez votre mot de passe actuel.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4 space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Votre mot de passe</Label>
                                        <Input type="password" value={confirmDeletePass} onChange={(e) => setConfirmDeletePass(e.target.value)} className="h-12 bg-white/5 border-white/10 rounded-xl" />
                                    </div>
                                    <DialogFooter className="gap-2">
                                        <Button variant="ghost" className="font-bold uppercase text-xs" onClick={() => setConfirmDeletePass("")}>Annuler</Button>
                                        <Button className="bg-destructive text-white font-black uppercase italic h-12 px-8 rounded-xl" onClick={handleDeleteAccount} disabled={isDeletingAccount || !confirmDeletePass}>
                                            {isDeletingAccount ? <Loader2 className="animate-spin" /> : "CONFIRMER LA SUPPRESSION"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </TabsContent>

                    {isAdmin && (
                      <TabsContent value="system" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <Card className="glossy-card border-none rounded-[2.5rem]">
                                  <CardHeader className="p-10 pb-0">
                                      <div className="flex justify-between items-start">
                                          <CardTitle className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-3">
                                              <RefreshCw className="text-accent" size={20} /> Taux de Change
                                          </CardTitle>
                                          <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              onClick={fetchTodayRate}
                                              disabled={isFetchingRate}
                                              className="h-9 px-3 border border-white/10 rounded-xl gap-2 font-black uppercase italic text-[9px]"
                                          >
                                              {isFetchingRate ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                              Auto-fetch
                                          </Button>
                                      </div>
                                  </CardHeader>
                                  <CardContent className="p-10 space-y-6">
                                      <div>
                                          <Label className="text-[10px] font-black uppercase opacity-60">1 USD en Franc Congolais (CDF)</Label>
                                          <div className="relative mt-2">
                                              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-black">FC</span>
                                              <Input 
                                                  type="number" 
                                                  value={exchangeRate}
                                                  onChange={(e) => setExchangeRate(e.target.value)}
                                                  className="h-16 pl-14 bg-background/50 border-white/5 rounded-2xl text-lg font-bold" 
                                              />
                                          </div>
                                      </div>
                                      <Button 
                                          onClick={handleSaveSystem}
                                          disabled={isSavingSystem}
                                          className="w-full bg-accent text-black font-black uppercase italic rounded-xl h-12"
                                      >
                                          {isSavingSystem ? <Loader2 className="animate-spin" /> : "Appliquer à la boutique"}
                                      </Button>
                                  </CardContent>
                              </Card>

                              <Card className="glossy-card border-none rounded-[2.5rem]">
                                  <CardHeader className="p-10 pb-0">
                                      <CardTitle className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-3">
                                          <Coins className="text-accent" size={20} /> Valeur Pi Network
                                      </CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-10">
                                      <Label className="text-[10px] font-black uppercase opacity-60">1 Pi en Dollars (USD)</Label>
                                      <div className="relative mt-2">
                                          <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                          <Input 
                                              type="number" 
                                              value={piValue}
                                              onChange={(e) => setPiValue(e.target.value)}
                                              className="h-16 pl-14 bg-background/50 border-white/5 rounded-2xl text-lg font-bold" 
                                          />
                                      </div>
                                      <p className="mt-4 text-[9px] text-muted-foreground uppercase font-black tracking-widest italic text-center">Valeur Consensus GCV: $314,159</p>
                                  </CardContent>
                              </Card>
                          </div>
                      </TabsContent>
                    )}
                </Tabs>

                <div className="mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent italic">DKS SHOPMANAGER SUPREME V2.9</p>
                    <Button 
                        variant="ghost" 
                        onClick={handleLogout}
                        className="text-destructive hover:bg-destructive/10 rounded-2xl px-12 h-14 font-black uppercase italic text-xs tracking-[0.2em] gap-3 border border-destructive/10"
                    >
                        <LogOut size={18} />
                        Fermer la session
                    </Button>
                </div>
            </main>
        </div>
    );
}
