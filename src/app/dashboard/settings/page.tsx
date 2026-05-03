
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
    Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    Tabs, 
    TabsContent, 
    TabsList, 
    TabsTrigger 
} from "@/components/ui/tabs";
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/lib/firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PI_CONVERSION_RATE } from '@/lib/constants';

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

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({ title: "Déconnexion", description: "Session fermée." });
            router.push('/login');
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Limite de taille simple (ex: 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast({ title: "Fichier volumineux", description: "Veuillez choisir une image de moins de 2MB.", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setPhotoURL(base64String);
            
            // Mise à jour immédiate pour le feedback visuel
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
                                RÉGLAGES <span className="text-accent font-light not-italic">SYSTÈME</span>
                            </h1>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-60">Gestion de compte</p>
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

                    <TabsContent value="security" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="glossy-card border-none rounded-[2.5rem]">
                            <CardHeader className="p-10 pb-0">
                                <CardTitle className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-3">
                                    <Lock className="text-accent" size={20} /> Sécurité
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-10">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold uppercase italic text-sm">Authentification à deux facteurs</h4>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Protégez vos achats importants.</p>
                                    </div>
                                    <Switch />
                                </div>
                            </CardContent>
                        </Card>
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
