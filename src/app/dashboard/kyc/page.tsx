
"use client";

import { useState, useRef } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    ShieldCheck, 
    ArrowLeft, 
    Upload, 
    Camera, 
    UserCheck, 
    Loader2, 
    CheckCircle2, 
    AlertCircle, 
    FileText, 
    Fingerprint,
    X,
    Info,
    Shield
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

export default function KycPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form States
    const [docType, setDocType] = useState("national_id");
    const [docNumber, setDocNumber] = useState("");
    const [docImage, setDocImage] = useState<string | null>(null);
    const [selfieImage, setSelfieImage] = useState<string | null>(null);

    const docInputRef = useRef<HTMLInputElement>(null);
    const selfieInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'doc' | 'selfie') => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "Fichier trop lourd", description: "L'image ne doit pas dépasser 5Mo.", variant: "destructive" });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (target === 'doc') setDocImage(reader.result as string);
            else setSelfieImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmitKyc = async () => {
        if (!user) return;
        if (!docNumber || !docImage || !selfieImage) {
            toast({ title: "Dossier incomplet", description: "Veuillez remplir tous les champs et fournir les images.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                kycStatus: 'pending',
                kycDocumentType: docType,
                kycDocumentNumber: docNumber,
                kycDocumentImage: docImage,
                kycSelfieImage: selfieImage,
                kycSubmittedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            toast({ title: "Dossier KYC Soumis", description: "Nos experts valideront votre identité sous 48h." });
            router.push('/dashboard');
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de soumettre le dossier.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (user?.kycStatus === 'pending') {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <main className="max-w-4xl mx-auto px-6 py-24 text-center space-y-8">
                    <div className="w-24 h-24 rounded-[2rem] bg-orange-500/10 flex items-center justify-center mx-auto text-orange-500 animate-pulse shadow-xl shadow-orange-500/10">
                        <ShieldCheck size={48} />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">VÉRIFICATION <span className="text-orange-500">EN COURS</span></h1>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto italic">
                            Votre dossier KYC est actuellement en cours d'examen par le service de conformité du Hub DKS. Vous recevrez une notification dès validation.
                        </p>
                    </div>
                    <Button variant="outline" className="rounded-2xl border-white/10" asChild>
                        <Link href="/dashboard">Retour au Dashboard</Link>
                    </Button>
                </main>
            </div>
        );
    }

    if (user?.kycStatus === 'verified') {
        return (
            <div className="min-h-screen bg-background text-foreground">
                <Navbar />
                <main className="max-w-4xl mx-auto px-6 py-24 text-center space-y-8">
                    <div className="w-24 h-24 rounded-[2rem] bg-green-500/10 flex items-center justify-center mx-auto text-green-500 shadow-xl shadow-green-500/10">
                        <UserCheck size={48} />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">IDENTITÉ <span className="text-green-500">CERTIFIÉE</span></h1>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto italic">
                            Félicitations, votre profil est vérifié. Vous bénéficiez désormais de toutes les fonctionnalités avancées du DKS Network.
                        </p>
                    </div>
                    <Button variant="outline" className="rounded-2xl border-white/10" asChild>
                        <Link href="/dashboard">Retour au Dashboard</Link>
                    </Button>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="flex items-center gap-4 mb-12">
                    <Link href="/dashboard/settings">
                        <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 p-0"><ArrowLeft size={24} /></Button>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Vérification <span className="text-accent">KYC Élite</span></h1>
                        <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest opacity-40">Sécurisez votre compte et vos actifs numériques</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-accent/10 border-accent/20 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5"><Shield size={100} /></div>
                            <h3 className="text-xl font-black uppercase italic text-accent leading-none">Pourquoi <br />se vérifier ?</h3>
                            <div className="space-y-4 relative z-10">
                                <div className="flex items-start gap-4">
                                    <CheckCircle2 size={16} className="text-accent mt-1 shrink-0" />
                                    <p className="text-[10px] font-bold uppercase text-white/70 leading-relaxed">Plafonds de retrait augmentés sur le Wallet.</p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <CheckCircle2 size={16} className="text-accent mt-1 shrink-0" />
                                    <p className="text-[10px] font-bold uppercase text-white/70 leading-relaxed">Accès prioritaire aux missions DKS Work.</p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <CheckCircle2 size={16} className="text-accent mt-1 shrink-0" />
                                    <p className="text-[10px] font-bold uppercase text-white/70 leading-relaxed">Protection juridique de vos actifs (DMS).</p>
                                </div>
                            </div>
                        </Card>

                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Info size={12} /> Confidentialité</h4>
                            <p className="text-[9px] leading-relaxed text-white/40 italic uppercase font-bold">
                                Vos données sont cryptées et stockées sur des serveurs sécurisés. Elles ne sont utilisées que pour la conformité réglementaire DKS.
                            </p>
                        </div>
                    </div>

                    <div className="lg:col-span-8 space-y-10">
                        <Card className="glossy-card border-none rounded-[3rem] p-10 md:p-12 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Type de Document</Label>
                                    <Select value={docType} onValueChange={setDocType}>
                                        <SelectTrigger className="h-14 bg-background/50 border-white/5 rounded-2xl font-bold uppercase text-[10px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-white/10">
                                            <SelectItem value="national_id" className="text-[10px] font-black uppercase">Carte Nationale d'Identité</SelectItem>
                                            <SelectItem value="voter_card" className="text-[10px] font-black uppercase">Carte d'Électeur</SelectItem>
                                            <SelectItem value="passport" className="text-[10px] font-black uppercase">Passeport</SelectItem>
                                            <SelectItem value="driving_license" className="text-[10px] font-black uppercase">Permis de conduire</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Numéro du Document</Label>
                                    <Input 
                                        value={docNumber} 
                                        onChange={(e) => setDocNumber(e.target.value)} 
                                        placeholder="Ex: 1234-5678-90"
                                        className="h-14 bg-background/50 border-white/5 rounded-2xl font-mono text-accent"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1 text-center block">Photo du Document (Recto)</Label>
                                    <div 
                                        onClick={() => docInputRef.current?.click()}
                                        className={cn(
                                            "aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group relative",
                                            docImage ? "border-accent/50 bg-background" : "border-white/10 hover:border-accent/40 bg-white/5"
                                        )}
                                    >
                                        {docImage ? (
                                            <img src={docImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <FileText size={32} className="text-white/20 group-hover:text-accent transition-colors" />
                                                <span className="text-[8px] font-black uppercase mt-2 text-white/20">Cliquer pour charger</span>
                                            </>
                                        )}
                                        <input type="file" ref={docInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'doc')} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1 text-center block">Selfie avec le Document</Label>
                                    <div 
                                        onClick={() => selfieInputRef.current?.click()}
                                        className={cn(
                                            "aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group relative",
                                            selfieImage ? "border-accent/50 bg-background" : "border-white/10 hover:border-accent/40 bg-white/5"
                                        )}
                                    >
                                        {selfieImage ? (
                                            <img src={selfieImage} className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <Camera size={32} className="text-white/20 group-hover:text-accent transition-colors" />
                                                <span className="text-[8px] font-black uppercase mt-2 text-white/20">Cliquer pour charger</span>
                                            </>
                                        )}
                                        <input type="file" ref={selfieInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'selfie')} />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8">
                                <Button 
                                    onClick={handleSubmitKyc} 
                                    disabled={isSubmitting || !docNumber || !docImage || !selfieImage}
                                    className="w-full h-20 bg-accent text-black font-black uppercase italic rounded-[2rem] shadow-2xl text-xl gap-4 hover:scale-[1.02] transition-all"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={24} /> Soumettre ma Vérification</>}
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
