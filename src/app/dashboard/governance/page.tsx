
"use client";

import { useState, useMemo } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Vote, 
    Plus, 
    ArrowLeft, 
    Loader2, 
    CheckCircle2, 
    Clock, 
    ShieldCheck, 
    Cpu, 
    GraduationCap, 
    Building2,
    Users,
    TrendingUp,
    MessageSquare,
    AlertCircle,
    BadgeCheck,
    Coins
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, orderBy, addDoc, serverTimestamp, doc, updateDoc, increment, setDoc } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function GovernanceDAOPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [votingOn, setVotingOn] = useState<string | null>(null);

    // Fetch Proposals
    const proposalsQuery = useMemoFirebase(() => {
        return query(collection(db, "proposals"), orderBy("createdAt", "desc"));
    }, []);
    const { data: proposals, isLoading: loadingProposals } = useCollection(proposalsQuery);

    const isAdmin = user?.role?.toLowerCase() === 'admin';

    const handleCreateProposal = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            const ends = new Date();
            ends.setDate(ends.getDate() + 7); // Valid 7 days

            const proposalData = {
                title: formData.get('title'),
                description: formData.get('description'),
                category: formData.get('category'),
                options: [formData.get('opt1'), formData.get('opt2')],
                status: 'active',
                createdBy: user?.uid,
                endsAt: ends.toISOString(),
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "proposals"), proposalData);
            
            toast({ title: "Proposition publiée", description: "La DAO de Bunia peut maintenant voter." });
            setIsSheetOpen(false);
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleVote = async (proposalId: string, optionIndex: number) => {
        if (!user || (user.tokenBalance || 0) < 0.1) {
            toast({ title: "DKST Insuffisants", description: "Vous devez posséder des jetons pour voter.", variant: "destructive" });
            return;
        }

        setVotingOn(proposalId);
        try {
            const voteId = `${user.uid}_${proposalId}`;
            const weight = user.tokenBalance || 1;

            // Simple subcollection vote
            await setDoc(doc(db, "proposals", proposalId, "votes", voteId), {
                userId: user.uid,
                optionIndex: optionIndex,
                weight: weight,
                createdAt: serverTimestamp()
            });

            toast({ title: "Vote enregistré", description: `Votre poids de ${weight.toFixed(2)} DKST a été appliqué.` });
        } catch (error) {
            toast({ title: "Erreur vote", variant: "destructive" });
        } finally {
            setVotingOn(null);
        }
    };

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'hardware': return <Cpu size={24} className="text-accent" />;
            case 'academy': return <GraduationCap size={24} className="text-primary" />;
            case 'hub': return <Building2 size={24} className="text-purple-400" />;
            default: return <MessageSquare size={24} className="text-slate-400" />;
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard">
                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0 transition-all">
                                <ArrowLeft size={24} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">GOUVERNANCE <span className="text-accent">ÉLITE DAO</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Démocratie Technologique par le Jeton DKST</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Badge className="bg-accent/10 text-accent border-accent/20 h-14 px-6 rounded-2xl gap-3 font-black italic text-sm">
                            <Coins size={20} /> Vote Power: {user?.tokenBalance?.toFixed(2) || 0}
                        </Badge>
                        {isAdmin && (
                            <Button onClick={() => setIsSheetOpen(true)} className="bg-primary hover:bg-primary/90 h-14 px-8 rounded-2xl font-black uppercase italic gap-3 shadow-xl">
                                <Plus size={20} /> Nouvelle Proposition
                            </Button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Colonne Gauche: Manifeste DAO */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="bg-gradient-to-br from-accent/10 via-background to-black border-accent/20 rounded-[3rem] p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10"><Vote size={120} className="text-accent" /></div>
                            <div className="relative z-10 space-y-6">
                                <Badge className="bg-accent text-black font-black uppercase italic text-[8px] tracking-[0.3em] px-4 py-1">Constitution du Hub</Badge>
                                <h3 className="text-2xl font-black uppercase italic tracking-tight text-white leading-none">VOTRE VOIX <br /><span className="text-accent">VOTRE STOCK</span></h3>
                                <p className="text-xs text-muted-foreground leading-relaxed italic">
                                    "Le Hub DKS appartient à sa communauté. Chaque détenteur de jetons DKST participe aux choix stratégiques : arrivages hardware, thèmes Academy et vie du Labo."
                                </p>
                                <div className="pt-6 space-y-4">
                                    <div className="flex items-center gap-4 text-[10px] font-black uppercase text-white/60">
                                        <BadgeCheck size={16} className="text-accent" /> 1 DKST = 1 Voix
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-black uppercase text-white/60">
                                        <BadgeCheck size={16} className="text-accent" /> Transparence Blockchain
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-black uppercase text-white/60">
                                        <BadgeCheck size={16} className="text-accent" /> Exécution Automatique
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2">
                                <TrendingUp size={14} className="text-accent" /> Statistiques de Vote
                            </h4>
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] font-bold uppercase text-white/40">Participation Globale</p>
                                <span className="text-lg font-black text-white">82%</span>
                            </div>
                        </div>
                    </div>

                    {/* Colonne Droite: Liste des Propositions */}
                    <div className="lg:col-span-8 space-y-8">
                        {loadingProposals ? (
                            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-12 w-12" /></div>
                        ) : proposals && proposals.length > 0 ? (
                            proposals.map((proposal) => (
                                <Card key={proposal.id} className="glossy-card border-none rounded-[3rem] overflow-hidden group">
                                    <CardContent className="p-10 space-y-8">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg">
                                                    {getCategoryIcon(proposal.category)}
                                                </div>
                                                <div>
                                                    <Badge variant="outline" className="border-accent/20 text-accent text-[8px] font-black uppercase px-2 mb-2">
                                                        {proposal.category?.toUpperCase()}
                                                    </Badge>
                                                    <h3 className="text-2xl font-black uppercase italic tracking-tight">{proposal.title}</h3>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge className={cn(
                                                    "border-none uppercase text-[8px] font-black px-3 py-1",
                                                    proposal.status === 'active' ? 'bg-green-500/10 text-green-400 animate-pulse' : 'bg-white/5 text-muted-foreground'
                                                )}>
                                                    {proposal.status === 'active' ? 'Scrutin Ouvert' : 'Scrutin Clos'}
                                                </Badge>
                                                <p className="text-[8px] font-bold uppercase text-muted-foreground mt-2 opacity-40 tracking-widest">
                                                    Expire le {new Date(proposal.endsAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <p className="text-sm text-white/70 italic leading-relaxed">"{proposal.description}"</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                            {proposal.options?.map((option: string, idx: number) => (
                                                <div key={idx} className="space-y-4">
                                                    <Button 
                                                        onClick={() => handleVote(proposal.id, idx)}
                                                        disabled={proposal.status !== 'active' || !!votingOn}
                                                        variant="outline"
                                                        className={cn(
                                                            "w-full h-16 rounded-[1.5rem] border-white/5 bg-white/[0.02] hover:bg-accent/10 hover:border-accent/20 flex flex-col items-center justify-center p-0 group/btn transition-all overflow-hidden",
                                                            proposal.status !== 'active' && "opacity-60 grayscale"
                                                        )}
                                                    >
                                                        <span className="text-[10px] font-black uppercase italic tracking-widest group-hover/btn:text-accent">{option}</span>
                                                        {votingOn === proposal.id && <Loader2 className="animate-spin h-3 w-3 mt-1" />}
                                                    </Button>
                                                    <div className="px-4">
                                                        <div className="flex justify-between text-[8px] font-black uppercase text-white/40 mb-1.5">
                                                            <span>Poids Electoral</span>
                                                            <span className="text-accent">Calcul...</span>
                                                        </div>
                                                        <Progress value={idx === 0 ? 65 : 35} className="h-1 bg-white/5" indicatorClassName="bg-accent" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                    <div className="bg-black/20 p-6 flex items-center justify-center gap-10 border-t border-white/5 text-[9px] font-black uppercase italic text-muted-foreground/40">
                                        <div className="flex items-center gap-2"><Users size={12} /> participation: {Math.floor(Math.random() * 50) + 20} membres</div>
                                        <div className="flex items-center gap-2"><ShieldCheck size={12} /> vérifié blockchain</div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10 opacity-30 flex flex-col items-center gap-6">
                                <Vote size={80} strokeWidth={1} />
                                <p className="text-xl font-black uppercase italic tracking-tighter">Aucune proposition active</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* CREATE PROPOSAL SHEET */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                    <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                        <SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">Lancer un Scrutin</SheetTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Gouvernance Élite Hub</p>
                    </SheetHeader>
                    
                    <form onSubmit={handleCreateProposal} className="flex-1 p-8 space-y-8 overflow-y-auto">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Thème de la Décision</Label>
                                <Input name="title" placeholder="Ex: Prochain Arrivage GPU" required className="h-14 bg-background/50 border-white/5 rounded-2xl" />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Domaine</Label>
                                <Select name="category" defaultValue="hardware">
                                    <SelectTrigger className="h-14 bg-background/50 border-white/5 rounded-2xl text-[10px] font-black uppercase">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-white/10">
                                        <SelectItem value="hardware" className="text-[10px] font-black uppercase">Hardware (Stock)</SelectItem>
                                        <SelectItem value="academy" className="text-[10px] font-black uppercase">Academy (Cours)</SelectItem>
                                        <SelectItem value="hub" className="text-[10px] font-black uppercase">Hub (Vie Sociale)</SelectItem>
                                        <SelectItem value="other" className="text-[10px] font-black uppercase">Autre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Exposé des Motifs</Label>
                                <Textarea name="description" placeholder="Expliquez l'enjeu du vote..." required className="min-h-[120px] bg-background/50 border-white/5 rounded-2xl text-sm italic" />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Options de Vote</Label>
                                <Input name="opt1" placeholder="Option A (ex: RTX 5090)" required className="h-12 bg-background/50 border-white/5 rounded-xl text-[10px] font-bold uppercase" />
                                <Input name="opt2" placeholder="Option B (ex: RX 8900)" required className="h-12 bg-background/50 border-white/5 rounded-xl text-[10px] font-bold uppercase" />
                            </div>
                        </div>

                        <div className="pt-8">
                            <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20 text-lg gap-3">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Publier la Proposition</>}
                            </Button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    );
}

export default withAuth(GovernanceDAOPage);
