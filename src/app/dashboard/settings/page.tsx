
"use client";

import { useState, useEffect } from 'react';
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
    Coins,
    RefreshCw,
    Loader2,
    KeyRound,
    Eye,
    EyeOff,
    Fingerprint,
    ShieldAlert,
    CheckCircle2,
    Megaphone,
    Plus,
    Trash2,
    Save,
    Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { 
    signOut, 
    updateProfile, 
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";

interface Ad {
    id: string;
    title: string;
    subtitle: string;
    buttonText: string;
    link: string;
    isActive: boolean;
}

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    // Profile States
    const [name, setName] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [address, setAddress] = useState("");
    const [photoURL, setPhotoURL] = useState("");
    const [language, setLanguage] = useState("fr");
    const [isSaving, setIsSaving] = useState(false);

    // Security States
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    // Wallet PIN States
    const [walletPin, setWalletPin] = useState("");
    const [isUpdatingPin, setIsUpdatingPin] = useState(false);
    
    // System States
    const [exchangeRate, setExchangeRate] = useState("2500");
    const [isSavingSystem, setIsSavingSystem] = useState(false);

    // Multi-Ad States
    const [ads, setAds] = useState<Ad[]>([]);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setWhatsapp(user.whatsapp || user.phoneNumber || "");
            setAddress(user.address || "");
            setPhotoURL(user.photoURL || "");
            setLanguage(user.language || "fr");
            setWalletPin(user.walletPin || "");
        }
        fetchSystemConfig();
    }, [user]);

    const fetchSystemConfig = async () => {
        try {
            const configRef = doc(db, "system", "config");
            const configSnap = await getDoc(configRef);
            if (configSnap.exists()) {
                const data = configSnap.data();
                setExchangeRate(data.exchangeRate?.toString() || "2500");
                setAds(data.ads || []);
            }
        } catch (error) { console.error(error); }
    };

    const isAdmin = user?.role?.toLowerCase() === 'admin';

    const handleUpdateProfile = async () => {
        if (!user?.uid) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), { 
                name, 
                whatsapp, 
                address, 
                photoURL,
                language, 
                updatedAt: serverTimestamp() 
            });
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { 
                    displayName: name,
                    photoURL: photoURL 
                });
            }
            toast({ title: "Profil mis à jour" });
        } catch (error) { toast({ title: "Erreur", variant: "destructive" }); } finally { setIsSaving(false); }
    };

    const handleUpdateWalletPin = async () => {
        if (!user?.uid || walletPin.length !== 4) return;
        setIsUpdatingPin(true);
        try {
            await updateDoc(doc(db, "users", user.uid), { walletPin, updatedAt: serverTimestamp() });
            toast({ title: "Code PIN Wallet Mis à Jour", description: "Ce code sera requis pour chaque transfert." });
        } catch (error) { toast({ title: "Erreur PIN", variant: "destructive" }); } finally { setIsUpdatingPin(false); }
    };

    const handleAddAd = () => {
        const newAd: Ad = {
            id: Math.random().toString(36).substring(7),
            title: "Nouvelle Offre Élite",
            subtitle: "Détails de l'offre promotionnelle",
            buttonText: "Voir",
            link: "/services",
            isActive: true
        };
        setAds([...ads, newAd]);
    };

    const handleRemoveAd = (id: string) => {
        setAds(ads.filter(a => a.id !== id));
    };

    const handleUpdateAd = (id: string, fields: Partial<Ad>) => {
        setAds(ads.map(a => a.id === id ? { ...a, ...fields } : a));
    };

    const handleSaveSystemConfig = async () => {
        setIsSavingSystem(true);
        try {
            const configRef = doc(db, "system", "config");
            await setDoc(configRef, {
                exchangeRate: parseFloat(exchangeRate),
                ads,
                updatedAt: serverTimestamp()
            }, { merge: true });
            toast({ title: "Configuration Système Mise à Jour" });
        } catch (error) {
            toast({ title: "Erreur Système", variant: "destructive" });
        } finally {
            setIsSavingSystem(false);
        }
    };

    const handleLogout = async () => { await signOut(auth); router.push('/login'); };

    return (
        <div className="min-h-screen w-full bg-background text-foreground pb-20">
            <header className="border-b border-white/5 bg-background/40 backdrop-blur-2xl sticky top-0 z-50 h-20 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><Settings size={22} /></div>
                    <div>
                        <h1 className="text-xl font-black uppercase italic leading-none">RÉGLAGES <span className="text-accent">HUB</span></h1>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Écosystème DKS Bunia</p>
                    </div>
                </div>
                <Link href="/dashboard"><Button variant="outline" className="h-11 rounded-2xl gap-2 font-black uppercase italic text-[10px] tracking-widest"><ArrowLeft size={14} /> Retour</Button></Link>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-12">
                <Tabs defaultValue="profile" className="space-y-10">
                    <TabsList className="bg-white/5 border border-white/5 p-1.5 rounded-[1.5rem] h-16 w-full max-w-2xl mx-auto flex">
                        <TabsTrigger value="profile" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all"><User size={14} className="mr-2" /> Profil</TabsTrigger>
                        <TabsTrigger value="security" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all"><ShieldCheck size={14} className="mr-2" /> Sécurité</TabsTrigger>
                        <TabsTrigger value="wallet" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all"><Coins size={14} className="mr-2" /> Wallet</TabsTrigger>
                        {isAdmin && <TabsTrigger value="system" className="flex-1 rounded-xl font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all"><Database size={14} className="mr-2" /> Admin</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="profile" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <Card className="glossy-card border-none rounded-[2.5rem] p-8 text-center space-y-6">
                                <div className="relative inline-block mx-auto group">
                                    <Avatar className="h-40 w-40 border-4 border-accent p-1.5 bg-background shadow-2xl transition-transform group-hover:scale-105 duration-500">
                                        <AvatarImage src={photoURL} className="rounded-full object-cover" />
                                        <AvatarFallback className="bg-primary/20 text-accent text-5xl font-black italic">{user?.name?.substring(0, 1)}</AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-4 border-accent/20">
                                        <Camera size={32} className="text-white" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter truncate">{name}</h3>
                                <div className="p-5 bg-white/5 rounded-2xl border border-white/5 text-left space-y-2">
                                    <p className="text-[8px] font-black uppercase opacity-40">Détails Système</p>
                                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase"><Mail size={12} className="text-accent" /> {user?.email}</div>
                                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase"><Smartphone size={12} className="text-accent" /> {whatsapp}</div>
                                </div>
                            </Card>

                            <div className="lg:col-span-2">
                                <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-8">
                                    <div className="flex items-center gap-4"><User className="text-accent" size={24} /><div><h2 className="text-xl font-black uppercase italic tracking-tight">INFORMATIONS ÉLITE</h2><p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Identité officielle dans le Hub</p></div></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Nom complet</Label>
                                            <Input value={name} onChange={(e) => setName(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-2xl" />
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Numéro WhatsApp</Label>
                                            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-2xl" />
                                        </div>
                                        <div className="md:col-span-2 space-y-4">
                                            <Label className="text-[10px] font-black uppercase opacity-60 ml-1">URL de Photo de Profil</Label>
                                            <Input value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} placeholder="https://..." className="h-14 bg-background/50 border-white/5 rounded-2xl font-mono text-[10px]" />
                                        </div>
                                        <div className="md:col-span-2 space-y-4">
                                            <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Adresse à Bunia</Label>
                                            <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-2xl" />
                                        </div>
                                    </div>
                                    <Button onClick={handleUpdateProfile} disabled={isSaving} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl gap-3 shadow-xl">{isSaving ? <Loader2 className="animate-spin" /> : <Save size={18}/>} Enregistrer les modifications</Button>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-8">
                                <div className="flex items-center gap-4"><Lock className="text-accent" size={24} /><h2 className="text-xl font-black uppercase italic tracking-tight">ACCÈS COMPTE</h2></div>
                                <div className="space-y-4">
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60 ml-1">Ancien mot de passe</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-xl" /></div>
                                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase opacity-60 ml-1">Nouveau mot de passe</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-xl" /></div>
                                </div>
                                <Button className="w-full h-16 bg-white text-black font-black uppercase italic rounded-2xl">Appliquer le nouveau code</Button>
                            </Card>

                            <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-8">
                                <div className="flex items-center gap-4"><Fingerprint className="text-accent" size={24} /><h2 className="text-xl font-black uppercase italic tracking-tight">SESSIONS ACTIVES</h2></div>
                                <div className="p-6 rounded-3xl bg-accent/5 border border-accent/20 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><Smartphone size={20}/></div>
                                        <div><p className="font-bold text-xs">Cet appareil</p><p className="text-[9px] uppercase opacity-40">Actif maintenant • Bunia, RDC</p></div>
                                    </div>
                                    <Badge className="bg-accent text-black font-black text-[8px]">ONLINE</Badge>
                                </div>
                                <Button onClick={handleLogout} variant="ghost" className="w-full h-12 text-destructive hover:bg-destructive/10 uppercase font-black italic text-xs">Déconnexion Immédiate</Button>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="wallet" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <Card className="glossy-card border-none rounded-[3rem] p-12 space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><KeyRound size={120} /></div>
                                <div className="relative z-10 space-y-8">
                                    <div className="flex items-center gap-4"><KeyRound className="text-accent" size={24} /><h2 className="text-2xl font-black uppercase italic tracking-tight">SIGNATURE <span className="text-accent">DKST</span></h2></div>
                                    <p className="text-sm text-muted-foreground leading-relaxed italic">"Le code PIN Wallet est une couche de sécurité supplémentaire requise pour valider chaque transfert de jetons DKST."</p>
                                    
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Définir mon PIN (4 chiffres)</Label>
                                        <div className="flex justify-center gap-4">
                                            <Input 
                                                type="password" 
                                                maxLength={4} 
                                                value={walletPin} 
                                                onChange={(e) => setWalletPin(e.target.value.replace(/\D/g, ''))}
                                                className="h-20 bg-background/50 border-white/10 rounded-[2rem] text-center text-5xl font-black tracking-[0.5em] focus:border-accent"
                                            />
                                        </div>
                                    </div>

                                    <Button onClick={handleUpdateWalletPin} disabled={isUpdatingPin || walletPin.length !== 4} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20">
                                        {isUpdatingPin ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={20}/> Activer la Protection PIN</>}
                                    </Button>
                                </div>
                            </Card>

                            <Card className="bg-red-500/10 border-red-500/20 rounded-[3rem] p-12 space-y-8">
                                <div className="flex items-center gap-4 text-red-500"><ShieldAlert size={32} /><h3 className="text-2xl font-black uppercase italic tracking-tight">Zone Critique</h3></div>
                                <p className="text-sm text-red-400 font-medium leading-relaxed italic">En cas de perte de votre téléphone ou de suspicion de vol, utilisez le verrouillage d'urgence depuis votre dashboard Wallet pour geler vos actifs.</p>
                                <div className="pt-4 border-t border-red-500/20">
                                    <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-2xl border border-red-500/20">
                                        <div><p className="text-[10px] font-black uppercase text-red-500">Protection Passive</p><p className="text-[9px] text-white/40">Actif par défaut sur tous les comptes</p></div>
                                        <CheckCircle2 className="text-green-500" size={20} />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    {isAdmin && (
                        <TabsContent value="system" className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                            <Card className="glossy-card border-none rounded-[2.5rem] p-10 space-y-10">
                                <div className="flex items-center gap-4">
                                    <RefreshCw className="text-accent" size={24}/>
                                    <div>
                                        <h2 className="text-xl font-black uppercase italic">CONFIGURATION HUB</h2>
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Paramètres globaux de l'écosystème</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    {/* TAUX DE CHANGE */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent"><Coins size={16}/></div>
                                            <h3 className="text-sm font-black uppercase italic">Taux de Change</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase opacity-60">1 USD en Francs Congolais (CDF)</Label>
                                            <Input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(e.target.value)} className="h-16 bg-background/50 border-white/5 rounded-2xl text-2xl font-bold" />
                                        </div>
                                    </div>

                                    {/* GESTION PUBLICITÉ MULTI-ANNONCES */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Megaphone size={16}/></div>
                                                <h3 className="text-sm font-black uppercase italic">Carousel Publicitaire</h3>
                                            </div>
                                            <Button onClick={handleAddAd} size="sm" className="bg-accent text-black font-black uppercase text-[10px] rounded-xl h-10 px-4">
                                                <Plus size={14} className="mr-2" /> Ajouter une Annonce
                                            </Button>
                                        </div>

                                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {ads.map((ad) => (
                                                <div key={ad.id} className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4 relative group">
                                                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                                        <Badge variant="outline" className="text-[8px] font-black uppercase border-accent/20 text-accent">Annonce ID: {ad.id}</Badge>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-2">
                                                                <Label className="text-[8px] font-black uppercase opacity-40">Actif</Label>
                                                                <Switch 
                                                                    checked={ad.isActive} 
                                                                    onCheckedChange={(val) => handleUpdateAd(ad.id, { isActive: val })} 
                                                                    className="data-[state=checked]:bg-accent scale-75"
                                                                />
                                                            </div>
                                                            <button onClick={() => handleRemoveAd(ad.id)} className="text-white/20 hover:text-red-500 transition-colors">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label className="text-[8px] font-black uppercase opacity-40">Titre</Label>
                                                            <Input 
                                                                value={ad.title} 
                                                                onChange={(e) => handleUpdateAd(ad.id, { title: e.target.value })} 
                                                                className="h-10 bg-background/50 border-white/5 text-xs font-bold" 
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[8px] font-black uppercase opacity-40">Bouton</Label>
                                                            <Input 
                                                                value={ad.buttonText} 
                                                                onChange={(e) => handleUpdateAd(ad.id, { buttonText: e.target.value })} 
                                                                className="h-10 bg-background/50 border-white/5 text-[9px] font-black uppercase" 
                                                            />
                                                        </div>
                                                        <div className="space-y-2 md:col-span-2">
                                                            <Label className="text-[8px] font-black uppercase opacity-40">Sous-titre</Label>
                                                            <Input 
                                                                value={ad.subtitle} 
                                                                onChange={(e) => handleUpdateAd(ad.id, { subtitle: e.target.value })} 
                                                                className="h-10 bg-background/50 border-white/5 text-[10px] italic" 
                                                            />
                                                        </div>
                                                        <div className="space-y-2 md:col-span-2">
                                                            <Label className="text-[8px] font-black uppercase opacity-40">Lien</Label>
                                                            <Input 
                                                                value={ad.link} 
                                                                onChange={(e) => handleUpdateAd(ad.id, { link: e.target.value })} 
                                                                className="h-10 bg-background/50 border-white/5 text-[9px] font-mono" 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {ads.length === 0 && (
                                                <div className="py-20 text-center bg-white/5 rounded-[2rem] border border-dashed border-white/10 opacity-30 italic text-xs uppercase font-black">
                                                    Aucune annonce configurée.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Button onClick={handleSaveSystemConfig} disabled={isSavingSystem} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20 gap-3">
                                    {isSavingSystem ? <Loader2 className="animate-spin" /> : <><Save size={20}/> Sauvegarder la Configuration Hub</>}
                                </Button>
                            </Card>
                        </TabsContent>
                    )}
                </Tabs>
            </main>
        </div>
    );
}
