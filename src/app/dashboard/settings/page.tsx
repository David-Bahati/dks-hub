
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
    Smartphone
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
import { Card, CardContent } from '@/components/ui/card';

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
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                            <Settings size={20} />
                        </div>
                        <h1 className="text-xl font-black tracking-tighter uppercase italic">
                            Réglages <span className="text-accent">Système</span>
                        </h1>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline" className="h-10 border-white/10 hover:bg-white/5 rounded-xl gap-2 font-black uppercase italic text-[10px]">
                            <ArrowLeft size={14} />
                            Tableau de bord
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12">
                <Tabs defaultValue="profile" className="space-y-10">
                    <TabsList className="bg-white/5 border border-white/5 p-1 rounded-2xl h-14">
                        <TabsTrigger value="profile" className="rounded-xl px-8 font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">
                            <User size={14} className="mr-2" /> Profil
                        </TabsTrigger>
                        <TabsTrigger value="security" className="rounded-xl px-8 font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">
                            <ShieldCheck size={14} className="mr-2" /> Sécurité
                        </TabsTrigger>
                        <TabsTrigger value="preferences" className="rounded-xl px-8 font-black uppercase italic text-[10px] data-[state=active]:bg-accent data-[state=active]:text-black transition-all">
                            <Globe size={14} className="mr-2" /> Préférences
                        </TabsTrigger>
                    </TabsList>

                    {/* SECTION PROFIL */}
                    <TabsContent value="profile" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="relative group">
                                <Avatar className="h-32 w-32 border-2 border-accent p-1 bg-background shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                                    <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200/200`} />
                                    <AvatarFallback className="bg-primary/20 text-accent text-2xl font-black">
                                        {user?.name?.substring(0, 1)}
                                    </AvatarFallback>
                                </Avatar>
                                <Button size="icon" className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-accent text-black hover:scale-110 transition-transform">
                                    <Camera size={18} />
                                </Button>
                            </div>
                            <div className="flex-1 space-y-2">
                                <h3 className="text-2xl font-black uppercase italic">{user?.name}</h3>
                                <Badge className="bg-accent/10 text-accent border-none font-black uppercase text-[10px]">{user?.role} Premium</Badge>
                                <p className="text-sm text-muted-foreground font-light max-w-md">Gérez vos informations personnelles et votre identité visuelle sur la plateforme DKS.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="glossy-card border-none rounded-[2rem]">
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                                            <User size={12} className="text-accent" /> Nom d'affichage
                                        </Label>
                                        <Input defaultValue={user?.name} className="h-14 bg-background/50 border-white/10 rounded-xl focus:border-accent" />
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                                            <Mail size={12} className="text-accent" /> Email Professionnel
                                        </Label>
                                        <Input defaultValue={user?.email} className="h-14 bg-background/50 border-white/10 rounded-xl focus:border-accent" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glossy-card border-none rounded-[2rem]">
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                                            <Phone size={12} className="text-accent" /> Numéro de téléphone
                                        </Label>
                                        <Input placeholder="+243 ..." className="h-14 bg-background/50 border-white/10 rounded-xl focus:border-accent" />
                                    </div>
                                    <Button className="w-full h-14 bg-accent text-black font-black uppercase italic rounded-xl neon-glow">
                                        Sauvegarder les modifications
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* SECTION SÉCURITÉ */}
                    <TabsContent value="security" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="md:col-span-2 glossy-card border-none rounded-[2rem]">
                                <CardContent className="p-10 space-y-8">
                                    <div className="flex justify-between items-center">
                                        <div className="space-y-1">
                                            <h4 className="font-black uppercase italic">Mot de passe</h4>
                                            <p className="text-xs text-muted-foreground font-light">Dernière modification il y a 3 mois</p>
                                        </div>
                                        <Button variant="outline" className="border-white/10 rounded-xl font-black uppercase italic text-xs h-12 px-8">
                                            <Lock size={14} className="mr-2" /> Modifier
                                        </Button>
                                    </div>

                                    <div className="flex justify-between items-center pt-8 border-t border-white/5">
                                        <div className="space-y-1">
                                            <h4 className="font-black uppercase italic">Double Authentification (2FA)</h4>
                                            <p className="text-xs text-muted-foreground font-light">Protégez votre compte avec un code SMS ou App.</p>
                                        </div>
                                        <Switch className="data-[state=checked]:bg-accent" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glossy-card border-none rounded-[2rem] bg-accent/5">
                                <CardContent className="p-10 flex flex-col items-center justify-center text-center gap-4 h-full">
                                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                                        <ShieldCheck size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Niveau de sécurité</p>
                                        <p className="text-xl font-black text-white uppercase italic">EXCELLENT</p>
                                    </div>
                                    <Badge className="bg-accent text-black font-black uppercase text-[10px] px-4 py-1 mt-2">Compte Vérifié</Badge>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* SECTION PRÉFÉRENCES */}
                    <TabsContent value="preferences" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="glossy-card border-none rounded-[2.5rem]">
                            <CardContent className="p-10 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                                            <Globe size={12} className="text-accent" /> Langue de l'interface
                                        </Label>
                                        <Select value={language} onValueChange={setLanguage}>
                                            <SelectTrigger className="h-14 bg-background/50 border-white/10 rounded-xl">
                                                <SelectValue placeholder="Choisir une langue" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-white/10">
                                                <SelectItem value="fr" className="font-bold">Français (Congo)</SelectItem>
                                                <SelectItem value="en" className="font-bold">English (UK)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-6">
                                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
                                            <Bell size={12} className="text-accent" /> Notifications
                                        </Label>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <span className="text-xs font-bold uppercase italic">Alertes par Email</span>
                                                <Switch defaultChecked className="data-[state=checked]:bg-gradient-to-r from-accent to-primary" />
                                            </div>
                                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                                <span className="text-xs font-bold uppercase italic">Rapports de Ventes Jour</span>
                                                <Switch className="data-[state=checked]:bg-gradient-to-r from-accent to-primary" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Footer Actions */}
                <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-30 italic">DKS SHOPMANAGER V2.4 - Bunia Ituri</p>
                    <Button 
                        variant="ghost" 
                        onClick={handleLogout}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl px-8 font-black uppercase italic text-xs gap-3"
                    >
                        <LogOut size={16} />
                        Se déconnecter
                    </Button>
                </div>
            </main>
        </div>
    );
}
