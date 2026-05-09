
"use client";

import { useState, useRef } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Building2, 
    ArrowLeft, 
    Upload, 
    FileText, 
    CheckCircle2, 
    Loader2, 
    ShieldCheck, 
    Briefcase,
    Globe,
    MapPin,
    AlertCircle,
    Info,
    Search
} from "lucide-react";
import Link from 'next/link';
import { useAuth } from "@/context/AuthContext";
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function KybPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form States
    const [businessName, setBusinessName] = useState("");
    const [businessType, setBusinessType] = useState("SARL");
    const [regNumber, setRegNumber] = useState("");
    const [taxId, setTaxId] = useState("");
    const [licenseImage, setLicenseImage] = useState<string | null>(null);
    const [address, setAddress] = useState("");

    const licenseInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "Fichier trop lourd", description: "L'image ne doit pas dépasser 5Mo.", variant: "destructive" });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setLicenseImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmitKyb = async () => {
        if (!user) return;
        if (!businessName || !regNumber || !licenseImage || !address) {
            toast({ title: "Dossier incomplet", description: "Veuillez remplir tous les champs obligatoires.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                kybStatus: 'pending',
                businessName,
                businessType,
                businessRegistrationNumber: regNumber,
                businessTaxId: taxId,
                businessLicenseImage: licenseImage,
                businessAddress: address,
                kybSubmittedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            toast({ title: "Dossier KYB Soumis", description: "Votre entreprise sera auditée sous 72h." });
            router.push('/dashboard');
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de soumettre le dossier.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (user?.kybStatus === 'pending') {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <main className="max-w-4xl mx-auto px-6 py-24 text-center space-y-8">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-blue-500/10 flex items-center justify-center mx-auto text-blue-500 animate-pulse shadow-xl shadow-blue-500/10">
                        <Building2 size={48} />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">AUDIT BUSINESS <span className="text-blue-500">EN COURS</span></h1>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto italic">
                            Votre demande de certification Business est entre les mains de nos analystes. Cette étape est cruciale pour devenir un Marchand Officiel DKS.
                        </p>
                    </div>
                    <Button variant="outline" className="rounded-2xl border-white/10" asChild>
                        <Link href="/dashboard">Retour au Dashboard</Link>
                    </Button>
                </main>
            </div>
        );
    }

    if (user?.kybStatus === 'verified') {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <main className="max-w-4xl mx-auto px-6 py-24 text-center space-y-8">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-green-500/10 flex items-center justify-center mx-auto text-green-500 shadow-xl shadow-green-500/10">
                        <ShieldCheck size={48} />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">ENTREPRISE <span className="text-green-500">CERTIFIÉE</span></h1>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto italic">
                            {user.businessName} est désormais un partenaire officiel du Hub DKS. Vos privilèges marchands sont activés.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                        <Button className="rounded-2xl bg-accent text-black font-black uppercase italic h-14" asChild>
                            <Link href="/dashboard/pay">Ouvrir Terminal Pay</Link>
                        </Button>
                        <Button variant="outline" className="rounded-2xl border-white/10 h-14" asChild>
                            <Link href="/dashboard">Dashboard</Link>
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex items-center gap-4 mb-12">
                    <Link href="/dashboard/settings">
                        <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 p-0"><ArrowLeft size={24} /></Button>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Certification <span className="text-primary">KYB Business</span></h1>
                        <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest opacity-40">Devenez un partenaire officiel de l'écosystème DKS</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-primary/10 border-primary/20 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5"><Briefcase size={100} /></div>
                            <h3 className="text-xl font-black uppercase italic text-primary leading-none">Statut <br />Marchand</h3>
                            <div className="space-y-4 relative z-10">
                                <div className="flex items-start gap-4">
                                    <CheckCircle2 size={16} className="text-primary mt-1 shrink-0" />
                                    <p className="text-[10px] font-bold uppercase text-white/70 leading-relaxed">Possibilité d'encaisser des paiements Pi et DKST via notre SDK.</p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <CheckCircle2 size={16} className="text-primary mt-1 shrink-0" />
                                    <p className="text-[10px] font-bold uppercase text-white/70 leading-relaxed">Publication prioritaire d'annonces sur la Marketplace P2P.</p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <CheckCircle2 size={16} className="text-primary mt-1 shrink-0" />
                                    <p className="text-[10px] font-bold uppercase text-white/70 leading-relaxed">Accès au portail de recrutement de talents certifiés.</p>
                                </div>
                            </div>
                        </Card>

                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Globe size={12} /> Rayonnement</h4>
                            <p className="text-[9px] leading-relaxed text-white/40 italic uppercase font-bold">
                                La certification KYB est la garantie de confiance pour les 5000+ membres de la communauté DKS en Ituri.
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-8">
                        <Card className="glossy-card border-none rounded-[3rem] p-10 md:p-12 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Raison Sociale (Nom Légal)</Label>
                                    <Input 
                                        value={businessName} 
                                        onChange={(e) => setBusinessName(e.target.value)} 
                                        placeholder="Ex: ETS BAHATI NYEKE SOLUTIONS"
                                        className="h-14 bg-background/50 border-white/5 rounded-2xl font-bold"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Forme Juridique</Label>
                                    <Select value={businessType} onValueChange={setBusinessType}>
                                        <SelectTrigger className="h-14 bg-background/50 border-white/5 rounded-2xl font-bold uppercase text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-white/10">
                                            <SelectItem value="SARL" className="text-[10px] font-black uppercase">SARL (Société à resp. limitée)</SelectItem>
                                            <SelectItem value="ETS" className="text-[10px] font-black uppercase">ETS (Établissement individuel)</SelectItem>
                                            <SelectItem value="ONG" className="text-[10px] font-black uppercase">ONG / ASBL</SelectItem>
                                            <SelectItem value="COOP" className="text-[10px] font-black uppercase">Coopérative</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Numéro RCCM / Enregistrement</Label>
                                    <Input 
                                        value={regNumber} 
                                        onChange={(e) => setRegNumber(e.target.value)} 
                                        placeholder="Ex: CD/BUN/RCCM/24-B-..."
                                        className="h-14 bg-background/50 border-white/5 rounded-2xl font-mono text-primary"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">ID National / Numéro Impôt</Label>
                                    <Input 
                                        value={taxId} 
                                        onChange={(e) => setTaxId(e.target.value)} 
                                        placeholder="Identification Nationale..."
                                        className="h-14 bg-background/50 border-white/5 rounded-2xl font-mono text-primary"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Adresse du Siège à Bunia</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <Input 
                                        value={address} 
                                        onChange={(e) => setAddress(e.target.value)} 
                                        placeholder="Ex: Immeuble Bahati, Boulevard de la Libération"
                                        className="h-14 pl-12 bg-background/50 border-white/5 rounded-2xl"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1 text-center block">Copie de la Patente / Licence Commerciale</Label>
                                <div 
                                    onClick={() => licenseInputRef.current?.click()}
                                    className={cn(
                                        "aspect-[21/9] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group relative",
                                        licenseImage ? "border-primary/50 bg-background" : "border-white/10 hover:border-primary/40 bg-white/5"
                                    )}
                                >
                                    {licenseImage ? (
                                        <img src={licenseImage} className="w-full h-full object-contain" />
                                    ) : (
                                        <>
                                            <FileText size={32} className="text-white/20 group-hover:text-primary transition-colors" />
                                            <span className="text-[8px] font-black uppercase mt-2 text-white/20">Cliquer pour charger le document</span>
                                        </>
                                    )}
                                    <input type="file" ref={licenseInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
                                </div>
                            </div>

                            <div className="pt-8">
                                <Button 
                                    onClick={handleSubmitKyb} 
                                    disabled={isSubmitting || !businessName || !regNumber || !licenseImage}
                                    className="w-full h-20 bg-primary text-white font-black uppercase italic rounded-[2rem] shadow-2xl text-xl gap-4 hover:scale-[1.02] transition-all"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><Briefcase size={24} /> Soumettre la Certification Business</>}
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

