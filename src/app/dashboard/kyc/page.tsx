
"use client";

import { useState, useRef, useEffect } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    ShieldCheck, 
    ArrowLeft, 
    Upload, 
    UserCheck, 
    Loader2, 
    FileText, 
    Shield, 
    MapPin, 
    Briefcase, 
    User, 
    CheckCircle2, 
    ArrowRight, 
    ArrowLeft as ArrowLeftIcon, 
    Video as VideoIcon,
    Smartphone,
    FileBadge,
    XCircle,
    RotateCcw,
    Lock,
    Info,
    AlertCircle
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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type Step = 1 | 2 | 3 | 4 | 5;

export default function KycPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [forceShowForm, setForceShowForm] = useState(false);
    
    // Form States - Part 1: Identity
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [birthPlace, setBirthPlace] = useState("");
    const [nationality, setNationality] = useState("");
    const [gender, setGender] = useState("M");

    // Part 2: Documents
    const [docType, setDocType] = useState("national_id");
    const [docNumber, setDocNumber] = useState("");
    const [docImageFront, setDocImageFront] = useState<string | null>(null);
    const [docImageBack, setDocImageBack] = useState<string | null>(null);

    // Part 3: Contact & Address
    const [addressProofImage, setAddressProofImage] = useState<string | null>(null);
    const [residentialAddress, setResidentialAddress] = useState("");
    const [city, setCity] = useState("Bunia");
    const [country, setCountry] = useState("RDC");
    const [zipCode, setZipCode] = useState("");

    // Part 4: Professional & AML
    const [profession, setProfession] = useState("");
    const [sourceOfFunds, setSourceOfFunds] = useState("salaire");
    const [isPep, setIsPep] = useState(false);

    // Part 5: Liveness Simulation
    const [livenessStatus, setLivenessStatus] = useState<'not_started' | 'recording' | 'passed'>('not_started');
    const [livenessProgress, setLivenessProgress] = useState(0);

    const fileRefs = {
        front: useRef<HTMLInputElement>(null),
        back: useRef<HTMLInputElement>(null),
        address: useRef<HTMLInputElement>(null)
    };

    useEffect(() => {
        if (user) {
            setFirstName(user.kycFirstName || "");
            setLastName(user.kycLastName || "");
            setBirthDate(user.kycBirthDate || "");
            setBirthPlace(user.kycBirthPlace || "");
            setNationality(user.kycNationality || "");
            setGender(user.kycGender || "M");
            setDocType(user.kycDocumentType || "national_id");
            setDocNumber(user.kycDocumentNumber || "");
            setResidentialAddress(user.kycResidentialAddress || "");
            setProfession(user.kycProfession || "");
            setSourceOfFunds(user.kycSourceOfFunds || "salaire");
            setIsPep(user.kycIsPep || false);
        }
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'front' | 'back' | 'address') => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            toast({ title: "Fichier trop lourd", description: "L'image ne doit pas dépasser 5Mo.", variant: "destructive" });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            if (target === 'front') setDocImageFront(reader.result as string);
            else if (target === 'back') setDocImageBack(reader.result as string);
            else setAddressProofImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const simulateLiveness = () => {
        setLivenessStatus('recording');
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setLivenessProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                setLivenessStatus('passed');
                toast({ title: "Vivacité validée", description: "Mouvements biométriques confirmés." });
            }
        }, 100);
    };

    const handleSubmitKyc = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                kycStatus: 'pending',
                kycFirstName: firstName,
                kycLastName: lastName,
                kycBirthDate: birthDate,
                kycBirthPlace: birthPlace,
                kycNationality: nationality,
                kycGender: gender,
                kycDocumentType: docType,
                kycDocumentNumber: docNumber,
                kycDocumentImage: docImageFront,
                kycDocumentImageBack: docImageBack,
                kycAddressProofImage: addressProofImage,
                kycResidentialAddress: residentialAddress,
                kycCity: city,
                kycCountry: country,
                kycZipCode: zipCode,
                kycProfession: profession,
                kycSourceOfFunds: sourceOfFunds,
                kycIsPep: isPep,
                kycLivenessVideoStatus: 'passed',
                kycSubmittedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            toast({ title: "Dossier Soumis", description: "Audit en cours par le Sceau du Hub." });
            setForceShowForm(false);
            router.push('/dashboard');
        } catch (error) {
            toast({ title: "Erreur", description: "Échec de la soumission.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (user?.kycStatus === 'pending' && !forceShowForm) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <Navbar />
                <main className="flex-1 max-w-4xl mx-auto px-6 py-24 text-center space-y-10">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-accent/10 flex items-center justify-center mx-auto text-accent animate-pulse shadow-xl shadow-accent/10">
                        <ShieldCheck size={48} />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">AUDIT KYC <span className="text-accent">EN COURS</span></h1>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto italic">
                            Votre dossier complet est en cours d'examen par le comité de conformité. Cette étape garantit la sécurité de l'écosystème.
                        </p>
                    </div>
                    <Button variant="outline" className="rounded-2xl border-white/10" asChild>
                        <Link href="/dashboard">Retour au Dashboard</Link>
                    </Button>
                </main>
            </div>
        );
    }

    if (user?.kycStatus === 'verified' && !forceShowForm) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <Navbar />
                <main className="flex-1 max-w-4xl mx-auto px-6 py-24 text-center space-y-10">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-green-500/10 flex items-center justify-center mx-auto text-green-500 shadow-xl shadow-green-500/10">
                        <UserCheck size={48} />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">MEMBRE <span className="text-green-500">CERTIFIÉ</span></h1>
                        <p className="text-muted-foreground text-sm max-w-md mx-auto italic">
                            Votre identité a été validée. Vous bénéficiez désormais de tous les privilèges Élite du Hub DKS.
                        </p>
                    </div>
                    <Button variant="outline" className="rounded-2xl border-white/10" asChild>
                        <Link href="/dashboard">Retour au Dashboard</Link>
                    </Button>
                </main>
            </div>
        );
    }

    if (user?.kycStatus === 'rejected' && !forceShowForm) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <Navbar />
                <main className="flex-1 max-w-4xl mx-auto px-6 py-24 text-center space-y-10">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-red-500/10 flex items-center justify-center mx-auto text-red-500 shadow-xl shadow-red-500/10">
                        <XCircle size={48} />
                    </div>
                    <div className="space-y-6">
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">AUDIT <span className="text-red-500">REFUSÉ</span></h1>
                        <Alert variant="destructive" className="bg-red-500/5 border-red-500/20 max-w-lg mx-auto rounded-3xl p-6">
                            <AlertCircle className="h-5 w-5" />
                            <AlertTitle className="font-black uppercase italic text-sm">Motif de la décision</AlertTitle>
                            <AlertDescription className="text-xs italic opacity-80 mt-2">
                                {user.kycRejectionReason || "Documents non conformes ou illisibles."}
                            </AlertDescription>
                        </Alert>
                    </div>
                    <div className="flex justify-center gap-4">
                        <Button variant="outline" className="rounded-2xl border-white/10" asChild>
                            <Link href="/dashboard">Dashboard</Link>
                        </Button>
                        <Button onClick={() => setForceShowForm(true)} className="rounded-2xl bg-accent text-black font-black uppercase italic gap-2">
                            <RotateCcw size={18} /> Ressoumettre mon dossier
                        </Button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/settings">
                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 p-0"><ArrowLeft size={24} /></Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Vérification <span className="text-accent">KYC Élite</span></h1>
                            <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest opacity-40">Protocole de Conformité v4.0</p>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[200px]">
                        <div className="flex justify-between text-[10px] font-black uppercase opacity-60">
                            <span>Étape {step} / 5</span>
                            <span>{Math.round((step / 5) * 100)}%</span>
                        </div>
                        <Progress value={(step / 5) * 100} className="h-2 bg-white/5" indicatorClassName="bg-accent shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* GUIDANCE SIDEBAR */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-accent/10 border-accent/20 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-5"><Shield size={100} /></div>
                            <h3 className="text-xl font-black uppercase italic text-accent leading-none">Niveau <br />de Confiance 4</h3>
                            <div className="space-y-4 relative z-10">
                                <div className="flex items-start gap-4">
                                    <CheckCircle2 size={16} className="text-accent mt-1 shrink-0" />
                                    <p className="text-[9px] font-bold uppercase text-white/70 leading-relaxed">Transactions illimitées sur le Hub.</p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <CheckCircle2 size={16} className="text-accent mt-1 shrink-0" />
                                    <p className="text-[9px] font-bold uppercase text-white/70 leading-relaxed">Accès au protocole Heritage (DMS).</p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <CheckCircle2 size={16} className="text-accent mt-1 shrink-0" />
                                    <p className="text-[9px] font-bold uppercase text-white/70 leading-relaxed">Validation prioritaire en caisse POS.</p>
                                </div>
                            </div>
                        </Card>

                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Lock size={12} /> Confidentialité</h4>
                            <p className="text-[9px] leading-relaxed text-white/40 italic uppercase font-bold">
                                Vos données sont protégées par un cryptage militaire. Seuls les auditeurs DKS ont accès à ces pièces pour vérification.
                            </p>
                        </div>
                    </div>

                    {/* STEPPER CONTENT */}
                    <div className="lg:col-span-8">
                        <Card className="glossy-card border-none rounded-[3rem] p-10 md:p-12 min-h-[500px] flex flex-col">
                            
                            <div className="flex-1">
                                {/* STEP 1: IDENTITY */}
                                {step === 1 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="flex items-center gap-4 text-accent mb-6">
                                            <User size={32}/>
                                            <div>
                                                <h3 className="text-2xl font-black uppercase italic tracking-tight">Identité Civile</h3>
                                                <p className="text-[10px] uppercase font-bold opacity-40">Informations telles qu'elles figurent sur votre ID</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3"><Label className="text-[10px] font-black uppercase opacity-60 ml-1">Nom de famille</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nom" className="h-14 bg-background/50 border-white/5 rounded-2xl" /></div>
                                            <div className="space-y-3"><Label className="text-[10px] font-black uppercase opacity-60 ml-1">Tous les Prénoms</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Prénoms" className="h-14 bg-background/50 border-white/5 rounded-2xl" /></div>
                                            <div className="space-y-3"><Label className="text-[10px] font-black uppercase opacity-60 ml-1">Date de Naissance</Label><Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-2xl" /></div>
                                            <div className="space-y-3"><Label className="text-[10px] font-black uppercase opacity-60 ml-1">Nationalité</Label><Input value={nationality} onChange={e => setNationality(e.target.value)} placeholder="Ex: Congolaise (RDC)" className="h-14 bg-background/50 border-white/5 rounded-2xl" /></div>
                                            <div className="space-y-3"><Label className="text-[10px] font-black uppercase opacity-60 ml-1">Lieu de Naissance</Label><Input value={birthPlace} onChange={e => setBirthPlace(e.target.value)} placeholder="Ville, Pays" className="h-14 bg-background/50 border-white/5 rounded-2xl" /></div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Sexe</Label>
                                                <Select value={gender} onValueChange={setGender}>
                                                    <SelectTrigger className="h-14 bg-background/50 border-white/5 rounded-2xl font-black uppercase text-[10px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-card border-white/10">
                                                        <SelectItem value="M">Masculin</SelectItem>
                                                        <SelectItem value="F">Féminin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: DOCUMENTS */}
                                {step === 2 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="flex items-center gap-4 text-accent mb-6">
                                            <FileText size={32}/>
                                            <div>
                                                <h3 className="text-2xl font-black uppercase italic tracking-tight">Preuve d'Identité</h3>
                                                <p className="text-[10px] uppercase font-bold opacity-40">Numérisation de votre document officiel</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Type de Document</Label>
                                                <Select value={docType} onValueChange={setDocType}>
                                                    <SelectTrigger className="h-14 bg-background/50 border-white/5 rounded-2xl font-black uppercase text-[10px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-card border-white/10">
                                                        <SelectItem value="national_id">Carte Nationale d'Identité</SelectItem>
                                                        <SelectItem value="passport">Passeport International</SelectItem>
                                                        <SelectItem value="driving_license">Permis de Conduire</SelectItem>
                                                        <SelectItem value="voter_card">Carte d'Électeur</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-3"><Label className="text-[10px] font-black uppercase opacity-60 ml-1">Numéro du Document</Label><Input value={docNumber} onChange={e => setDocNumber(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-2xl font-mono text-accent" /></div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase opacity-40 block text-center">Recto du Document</Label>
                                                <div onClick={() => fileRefs.front.current?.click()} className={cn("aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-white/5 border-white/10 hover:border-accent/40")}>
                                                    {docImageFront ? <img src={docImageFront} className="w-full h-full object-cover" alt="ID Front" /> : <><Upload size={24} className="opacity-20"/><span className="text-[8px] font-black uppercase mt-2">Charger Recto</span></>}
                                                    <input type="file" ref={fileRefs.front} className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'front')} />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase opacity-40 block text-center">Verso du Document</Label>
                                                <div onClick={() => fileRefs.back.current?.click()} className={cn("aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-white/5 border-white/10 hover:border-accent/40")}>
                                                    {docImageBack ? <img src={docImageBack} className="w-full h-full object-cover" alt="ID Back" /> : <><Upload size={24} className="opacity-20"/><span className="text-[8px] font-black uppercase mt-2">Charger Verso</span></>}
                                                    <input type="file" ref={fileRefs.back} className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'back')} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: ADDRESS */}
                                {step === 3 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="flex items-center gap-4 text-accent mb-6">
                                            <MapPin size={32}/>
                                            <div>
                                                <h3 className="text-2xl font-black uppercase italic tracking-tight">Adresse & Domicile</h3>
                                                <p className="text-[10px] uppercase font-bold opacity-40">Preuve de résidence physique</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="md:col-span-2 space-y-3"><Label className="text-[10px] font-black uppercase opacity-60 ml-1">Adresse complète (Rue, Quartier)</Label><Input value={residentialAddress} onChange={e => setResidentialAddress(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-2xl" /></div>
                                            <div className="space-y-3"><Label className="text-[10px] font-black uppercase opacity-60 ml-1">Ville</Label><Input value={city} onChange={e => setCity(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-2xl" /></div>
                                            <div className="space-y-3"><Label className="text-[10px] font-black uppercase opacity-60 ml-1">Pays</Label><Input value={country} onChange={e => setCountry(e.target.value)} className="h-14 bg-background/50 border-white/5 rounded-2xl" /></div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase opacity-40 block text-center">Preuve de Domicile (Facture SNEL/REGIDESO -3 mois)</Label>
                                            <div onClick={() => fileRefs.address.current?.click()} className={cn("h-32 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-white/5 border-white/10 hover:border-accent/40")}>
                                                {addressProofImage ? <img src={addressProofImage} className="w-full h-full object-cover" alt="Proof" /> : <><FileBadge size={24} className="opacity-20"/><span className="text-[8px] font-black uppercase mt-2">Charger Justificatif</span></>}
                                                <input type="file" ref={fileRefs.address} className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'address')} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 4: AML */}
                                {step === 4 && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="flex items-center gap-4 text-accent mb-6">
                                            <Briefcase size={32}/>
                                            <div>
                                                <h3 className="text-2xl font-black uppercase italic tracking-tight">Déclaration Financière</h3>
                                                <p className="text-[10px] uppercase font-bold opacity-40">Profil de risque et origine des fonds</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3"><Label className="text-[10px] font-black uppercase opacity-60 ml-1">Profession</Label><Input value={profession} onChange={e => setProfession(e.target.value)} placeholder="Ex: Entrepreneur, Ingénieur" className="h-14 bg-background/50 border-white/5 rounded-2xl" /></div>
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase opacity-60 ml-1">Origine des Fonds</Label>
                                                <Select value={sourceOfFunds} onValueChange={setSourceOfFunds}>
                                                    <SelectTrigger className="h-14 bg-background/50 border-white/5 rounded-2xl font-black uppercase text-[10px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-card border-white/10">
                                                        <SelectItem value="salaire">Salaire</SelectItem>
                                                        <SelectItem value="epargne">Épargne</SelectItem>
                                                        <SelectItem value="heritage">Héritage</SelectItem>
                                                        <SelectItem value="business">Revenus Commerciaux</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="p-8 rounded-3xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-xs font-black uppercase italic">Statut PEP</p>
                                                <p className="text-[8px] text-red-400 font-bold uppercase">Êtes-vous une Personne Exposée Politiquement ?</p>
                                            </div>
                                            <Button 
                                                variant={isPep ? "destructive" : "outline"} 
                                                onClick={() => setIsPep(!isPep)}
                                                className="h-10 px-6 rounded-xl font-black text-[10px] uppercase"
                                            >
                                                {isPep ? "OUI (Déclaré)" : "NON"}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 5: LIVENESS */}
                                {step === 5 && (
                                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center text-accent shadow-xl"><VideoIcon size={40} /></div>
                                            <div>
                                                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Vérification de Vivacité</h3>
                                                <p className="text-sm text-white/60 italic max-w-sm mx-auto mt-2">
                                                    Prouvez votre humanité en effectuant les mouvements demandés devant la caméra.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="aspect-video max-w-sm mx-auto rounded-[2.5rem] bg-black/60 border-4 border-white/5 relative overflow-hidden flex items-center justify-center">
                                            {livenessStatus === 'not_started' && (
                                                <Button onClick={simulateLiveness} className="bg-accent text-black font-black uppercase italic rounded-xl px-10 h-14 shadow-2xl">Démarrer le Test</Button>
                                            )}
                                            {livenessStatus === 'recording' && (
                                                <div className="w-full h-full flex flex-col items-center justify-center space-y-6 p-10">
                                                    <Loader2 className="animate-spin text-accent h-16 w-16" />
                                                    <div className="w-full space-y-3">
                                                        <p className="text-[10px] font-black uppercase text-accent animate-pulse">Analyse Biométrique : Tournez la tête...</p>
                                                        <Progress value={livenessProgress} className="h-1.5 bg-white/10" indicatorClassName="bg-accent" />
                                                    </div>
                                                </div>
                                            )}
                                            {livenessStatus === 'passed' && (
                                                <div className="text-green-500 flex flex-col items-center gap-4 animate-in zoom-in">
                                                    <CheckCircle2 size={64} />
                                                    <p className="text-xs font-black uppercase tracking-widest">Identité Vivante Validée</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* NAVIGATION BUTTONS */}
                            <div className="flex gap-4 pt-10 mt-10 border-t border-white/5">
                                {step > 1 && (
                                    <Button variant="ghost" onClick={() => setStep((step - 1) as Step)} className="h-16 flex-1 rounded-2xl font-black uppercase italic text-xs gap-3">
                                        <ArrowLeftIcon size={18} /> Précédent
                                    </Button>
                                )}
                                {step < 5 ? (
                                    <Button onClick={() => setStep((step + 1) as Step)} className="h-16 flex-[2] bg-white text-black font-black uppercase italic rounded-2xl shadow-xl gap-3">
                                        Étape Suivante <ArrowRight size={18} />
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={handleSubmitKyc} 
                                        disabled={isSubmitting || livenessStatus !== 'passed'}
                                        className="h-16 flex-[2] bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20 gap-3 text-lg"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={24} /> Sceller mon Dossier</>}
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

