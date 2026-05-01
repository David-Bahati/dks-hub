
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
    User, 
    ShieldCheck, 
    Settings, 
    Mail, 
    Phone, 
    Globe, 
    Bell, 
    LogOut, 
    ArrowLeft,
    Camera,
    CheckCircle2,
    Lock,
    Smartphone,
    Info,
    ShieldAlert
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [language, setLanguage] = useState("fr");

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({ title: "Déconnexion", description: "Vous avez été déconnecté avec succès." });
            router.push('/login');
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <div className="min-h-screen w-full bg-background text-foreground">
            {/* Header Luxe */}
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
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 opacity-60">Configuration globale du compte</p>
                        </div>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline" className="h-11 border-white/10 hover:bg-white/5 rounded-2xl gap-2 font-black uppercase italic text-[10px] tracking-widest px-6">
                            <ArrowLeft size={14} />
                            Retour au hub
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <Tabs defaultValue="profile" className="space-y-12">
                    <TabsList className="bg-white/5 border border-white/5 p-1.5 rounded-[1.5rem] h-16 w-fit mx-auto md:mx-0">
                        <TabsTrigger value="profile" className="rounded-xl px-10 font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all h-full">
                            <User size={14} className="mr-2" /> Profil
                        </TabsTrigger>
                        <TabsTrigger value="security" className="rounded-xl px-10 font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all h-full">
                            <ShieldCheck size={14} className="mr-2" /> Sécurité
                        </TabsTrigger>
                        <TabsTrigger value="preferences" className="rounded-xl px-10 font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all h-full">
                            <Globe size={14} className="mr-2" /> Préférences
                        </TabsTrigger>
                    </TabsList>

                    {/* SECTION PROFIL */}
                    <TabsContent value="profile" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
                            <div className="relative group">
                                <Avatar className="h-40 w-40 border-4 border-accent p-1.5 bg-background shadow-[0_0_40px_rgba(56,189,248,0.2)] transition-transform duration-700 group-hover:scale-105">
                                    <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200/200`} />
                                    <AvatarFallback className="bg-primary/20 text-accent text-4xl font-black italic">
                                        {user?.name?.substring(0, 1)}
                                    </AvatarFallback>
                                </Avatar>
                                <Button size="icon" className="absolute bottom-1 right-1 h-12 w-12 rounded-2xl bg-accent text-black hover:scale-110 transition-transform shadow-xl border-4 border-background">
                                    <Camera size={20} />
                                </Button>
                            </div>
                            <div className="flex-1 space-y-3">
                                <h3 className="text-4xl font-black uppercase italic tracking-tighter">{user?.name}</h3>
                                <div className="flex items-center gap-3 justify-center md:justify-start">
                                    <Badge className="bg-accent/20 text-accent border-none font-black uppercase text-[10px] px-3 py-1 italic tracking-widest">{user?.role} Premium</Badge>
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">Membre depuis 2024</span>
                                </div>
                                <p className="text-sm text-muted-foreground font-light max-w-md leading-relaxed">Personnalisez votre identité sur la plateforme. Ces informations seront visibles par le staff DKS lors de vos transactions.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Card className="glossy-card border-none rounded-[2.5rem]">
                                <CardContent className="p-10 space-y-8">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2 mb-2">
                                            <User size={12} className="text-accent" /> Nom complet de l'utilisateur
                                        </Label>
                                        <div className="relative">
                                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                            <Input defaultValue={user?.name} className="h-14 pl-14 bg-background/50 border-white/5 rounded-2xl focus:border-accent transition-all text-sm font-medium" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2 mb-2">
                                            <Mail size={12} className="text-accent" /> Adresse e-mail de contact
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                            <Input defaultValue={user?.email} className="h-14 pl-14 bg-background/50 border-white/5 rounded-2xl focus:border-accent transition-all text-sm font-medium" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glossy-card border-none rounded-[2.5rem]">
                                <CardContent className="p-10 space-y-8">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2 mb-2">
                                            <Phone size={12} className="text-accent" /> Numéro de téléphone portable
                                        </Label>
                                        <div className="relative">
                                            <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                            <Input placeholder="+243 ..." className="h-14 pl-14 bg-background/50 border-white/5 rounded-2xl focus:border-accent transition-all text-sm font-medium" />
                                        </div>
                                    </div>
                                    <Button className="w-full h-14 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/10 hover:scale-[1.02] active:scale-95 transition-all">
                                        Enregistrer mon profil
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* SECTION SÉCURITÉ */}
                    <TabsContent value="security" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <Card className="md:col-span-2 glossy-card border-none rounded-[2.5rem]">
                                <CardHeader className="p-10 pb-0">
                                    <CardTitle className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-3">
                                        <Lock className="text-accent" size={20} /> Contrôle des Accès
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-10 space-y-10">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="space-y-1">
                                            <h4 className="font-bold uppercase italic text-sm">Mot de passe de connexion</h4>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Dernière mise à jour il y a 90 jours</p>
                                        </div>
                                        <Button variant="outline" className="border-white/10 rounded-2xl font-black uppercase italic text-[10px] h-12 px-10 tracking-widest hover:bg-white/5">
                                            Modifier
                                        </Button>
                                    </div>

                                    <div className="flex justify-between items-center pt-10 border-t border-white/5">
                                        <div className="space-y-1">
                                            <h4 className="font-bold uppercase italic text-sm">Authentification à deux facteurs (2FA)</h4>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Sécurisez vos retraits de fonds et vos achats importants.</p>
                                        </div>
                                        <Switch className="data-[state=checked]:bg-accent" />
                                    </div>

                                    <div className="flex justify-between items-center pt-10 border-t border-white/5">
                                        <div className="space-y-1">
                                            <h4 className="font-bold uppercase italic text-sm">Alertes de connexion suspecte</h4>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Recevez un mail en cas de connexion depuis un nouvel IP.</p>
                                        </div>
                                        <Switch defaultChecked className="data-[state=checked]:bg-accent" />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-8">
                                <Card className="glossy-card border-none rounded-[2.5rem] bg-accent/5 relative overflow-hidden group">
                                    <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                                        <ShieldCheck size={200} />
                                    </div>
                                    <CardContent className="p-10 flex flex-col items-center justify-center text-center gap-6 h-full relative z-10">
                                        <div className="w-20 h-20 rounded-[2rem] bg-accent/10 flex items-center justify-center text-accent shadow-inner">
                                            <ShieldCheck size={40} className="animate-pulse" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Statut Protection</p>
                                            <p className="text-3xl font-black text-white uppercase italic tracking-tighter">RENFORCÉ</p>
                                        </div>
                                        <Badge className="bg-accent text-black font-black uppercase text-[10px] px-6 py-2 rounded-xl italic tracking-widest">Vérification OK</Badge>
                                    </CardContent>
                                </Card>
                                
                                <Card className="glossy-card border-none rounded-[2.5rem] bg-orange-500/5 border border-orange-500/10">
                                    <CardContent className="p-8 flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                                            <ShieldAlert size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold uppercase italic text-orange-200">Conseil Sécurité</p>
                                            <p className="text-[10px] leading-relaxed text-orange-200/60 uppercase font-bold tracking-widest">Activez le 2FA pour augmenter votre limite de transaction Pi Network.</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* SECTION PRÉFÉRENCES */}
                    <TabsContent value="preferences" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="glossy-card border-none rounded-[2.5rem]">
                            <CardHeader className="p-10 pb-0">
                                <CardTitle className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-3">
                                    <Globe className="text-accent" size={20} /> Expérience Utilisateur
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-10 space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2 mb-2">
                                            <Globe size={12} className="text-accent" /> Langue par défaut du système
                                        </Label>
                                        <Select value={language} onValueChange={setLanguage}>
                                            <SelectTrigger className="h-16 bg-background/50 border-white/5 rounded-2xl focus:border-accent text-sm font-bold">
                                                <SelectValue placeholder="Choisir une langue" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-white/10 backdrop-blur-2xl">
                                                <SelectItem value="fr" className="font-bold py-3">Français (République Démocratique du Congo)</SelectItem>
                                                <SelectItem value="en" className="font-bold py-3">English (International Standard)</SelectItem>
                                                <SelectItem value="sw" className="font-bold py-3">Kiswahili (Afrique de l'Est)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest italic px-2">Modifie l'interface pour tous les services DKS.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2 mb-2">
                                            <Bell size={12} className="text-accent" /> Gestion des Notifications Push
                                        </Label>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-5 bg-white/5 rounded-[1.5rem] border border-white/5 hover:bg-white/10 transition-all">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold uppercase italic">Mises à jour du catalogue</span>
                                                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Nouveautés Hardware</span>
                                                </div>
                                                <Switch defaultChecked className="data-[state=checked]:bg-gradient-to-r from-accent to-primary" />
                                            </div>
                                            <div className="flex items-center justify-between p-5 bg-white/5 rounded-[1.5rem] border border-white/5 hover:bg-white/10 transition-all">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold uppercase italic">Alertes de commande</span>
                                                    <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Suivi en temps réel</span>
                                                </div>
                                                <Switch defaultChecked className="data-[state=checked]:bg-gradient-to-r from-accent to-primary" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <div className="bg-accent/5 p-10 rounded-[2.5rem] border border-accent/10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6 text-center md:text-left">
                                <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                                    <Info size={28} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-black uppercase italic tracking-widest text-white">Rapport d'activité DKS</h4>
                                    <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">Souhaitez-vous recevoir un récapitulatif mensuel de vos transactions et points de fidélité ?</p>
                                </div>
                            </div>
                            <Button className="h-14 px-10 rounded-2xl bg-white text-black font-black uppercase italic text-xs tracking-widest hover:bg-accent hover:text-black transition-all">
                                M'abonner au rapport
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Footer Actions */}
                <div className="mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent italic">DKS SHOPMANAGER SUPREME V2.8</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-30">© 2024 DOUBLE KING SHOP - Bunia Ituri - Congo RDC</p>
                    </div>
                    <Button 
                        variant="ghost" 
                        onClick={handleLogout}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-2xl px-12 h-14 font-black uppercase italic text-xs tracking-[0.2em] gap-3 border border-destructive/10"
                    >
                        <LogOut size={18} />
                        Fermer la session
                    </Button>
                </div>
            </main>
        </div>
    );
}

