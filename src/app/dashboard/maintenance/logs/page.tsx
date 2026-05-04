
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    BookText, 
    Plus, 
    ArrowLeft, 
    Loader2, 
    Search,
    MessageCircle,
    BadgeAlert,
    Send,
    User,
    Clock,
    Zap,
    AlertTriangle,
    CheckCircle2,
    Trash2,
    History,
    StickyNote
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

function TechnicianLogbookPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [search, setSearch] = useState("");
    const [filterType, setStatusFilter] = useState("all");

    const logsQuery = useMemoFirebase(() => {
        return query(collection(db, "technicianLogs"), orderBy("createdAt", "desc"));
    }, []);

    const { data: logs, isLoading } = useCollection(logsQuery);

    const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

    const handleAddLog = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            const logData = {
                userId: user?.uid,
                userName: user?.name || "Expert DKS",
                type: formData.get('type'),
                content: formData.get('content'),
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "technicianLogs"), logData);
            
            toast({ title: "Note enregistrée", description: "Votre observation a été ajoutée au journal." });
            (e.target as HTMLFormElement).reset();
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteLog = async (id: string) => {
        if (!window.confirm("Supprimer cette note du journal ?")) return;
        try {
            await deleteDoc(doc(db, "technicianLogs", id));
            toast({ title: "Note supprimée" });
        } catch (e) { toast({ title: "Erreur", variant: "destructive" }); }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'handover': return <Badge className="bg-purple-500/10 text-purple-400 border-none uppercase text-[8px] font-black">Passation</Badge>;
            case 'incident': return <Badge className="bg-red-500/10 text-red-400 border-none uppercase text-[8px] font-black animate-pulse">Incident</Badge>;
            case 'technical': return <Badge className="bg-blue-500/10 text-blue-400 border-none uppercase text-[8px] font-black">Note Tech</Badge>;
            default: return <Badge className="bg-white/5 text-muted-foreground border-none uppercase text-[8px] font-black">Info</Badge>;
        }
    };

    const filteredLogs = logs?.filter(l => {
        const matchesSearch = l.content?.toLowerCase().includes(search.toLowerCase()) || l.userName?.toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === "all" || l.type === filterType;
        return matchesSearch && matchesType;
    });

    if (!isStaff) return <div className="p-20 text-center">Accès réservé au personnel technique.</div>;

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                    <div className="flex items-start gap-5">
                        <Link href="/dashboard">
                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0">
                                <ArrowLeft size={24} />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Journal de <span className="text-accent">Bord Labo</span></h1>
                            <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Observations techniques & Passations de service</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Colonne Gauche: Formulaire de saisie */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="glossy-card border-none rounded-[2.5rem] p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-lg shadow-accent/10">
                                    <StickyNote size={24} />
                                </div>
                                <h2 className="text-xl font-black uppercase italic tracking-tight">Nouvelle Note</h2>
                            </div>

                            <form onSubmit={handleAddLog} className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Type d'entrée</Label>
                                    <Select name="type" defaultValue="info">
                                        <SelectTrigger className="h-12 bg-background/50 border-white/5 rounded-xl text-[10px] font-black uppercase">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-card border-white/10">
                                            <SelectItem value="info" className="text-[10px] font-black uppercase">Information Générale</SelectItem>
                                            <SelectItem value="technical" className="text-[10px] font-black uppercase text-blue-400">Rapport Technique</SelectItem>
                                            <SelectItem value="incident" className="text-[10px] font-black uppercase text-red-500">Signalement Incident</SelectItem>
                                            <SelectItem value="handover" className="text-[10px] font-black uppercase text-purple-400">Passation de service</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Observation</Label>
                                    <Textarea 
                                        name="content" 
                                        placeholder="Écrivez votre rapport ici..." 
                                        required 
                                        className="min-h-[150px] bg-background/50 border-white/5 rounded-2xl italic text-sm"
                                    />
                                </div>

                                <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-accent text-black font-black uppercase italic rounded-xl gap-2 shadow-xl shadow-accent/10">
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Publier au Journal</>}
                                </Button>
                            </form>
                        </Card>

                        <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Zap size={12} className="text-accent" /> Conseils de rédaction
                            </h3>
                            <p className="text-[10px] leading-relaxed text-white/40 italic">
                                "Soyez précis sur les numéros de série (S/N) et les codes d'erreur rencontrés. Pour les passations, notez clairement ce qui reste à finir pour l'équipe suivante."
                            </p>
                        </div>
                    </div>

                    {/* Colonne Droite: Timeline des logs */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                                <Input 
                                    placeholder="Chercher dans le journal..." 
                                    className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl focus:border-accent"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Select value={filterType} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-16 w-full md:w-[200px] bg-white/5 border-white/10 rounded-2xl font-black uppercase italic text-[10px]">
                                    <SelectValue placeholder="Filtrer" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-white/10">
                                    <SelectItem value="all">Tout le journal</SelectItem>
                                    <SelectItem value="info">Général</SelectItem>
                                    <SelectItem value="technical">Technique</SelectItem>
                                    <SelectItem value="incident">Incidents</SelectItem>
                                    <SelectItem value="handover">Passations</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="relative space-y-8 pl-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
                            {isLoading ? (
                                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-accent h-10 w-10" /></div>
                            ) : filteredLogs && filteredLogs.length > 0 ? (
                                filteredLogs.map((log) => (
                                    <div key={log.id} className="relative group animate-in slide-in-from-left-4 duration-300">
                                        <div className={cn(
                                            "absolute -left-10 top-1 w-6 h-6 rounded-full border-4 border-background flex items-center justify-center transition-transform group-hover:scale-125 z-10",
                                            log.type === 'incident' ? 'bg-red-500' : log.type === 'handover' ? 'bg-purple-500' : log.type === 'technical' ? 'bg-blue-500' : 'bg-accent'
                                        )}>
                                            <CheckCircle2 size={10} className="text-white" />
                                        </div>
                                        
                                        <Card className="bg-white/5 border-white/5 rounded-[2rem] hover:bg-white/[0.08] transition-all overflow-hidden group">
                                            <CardContent className="p-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-3">
                                                        {getTypeBadge(log.type)}
                                                        <span className="text-[9px] font-black uppercase text-accent tracking-widest flex items-center gap-1.5 opacity-60">
                                                            <Clock size={10} /> {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'Récemment'}
                                                        </span>
                                                    </div>
                                                    {isStaff && (user?.uid === log.userId || user?.role === 'Admin') && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 text-muted-foreground/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                            onClick={() => handleDeleteLog(log.id)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    )}
                                                </div>
                                                
                                                <p className="text-sm text-white/90 font-medium leading-relaxed italic whitespace-pre-wrap mb-6">
                                                    "{log.content}"
                                                </p>

                                                <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                                                    <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent text-[10px] font-black italic">
                                                        {log.userName?.substring(0, 1)}
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase italic text-muted-foreground/60 tracking-wider">
                                                        Rédigé par: {log.userName}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))
                            ) : (
                                <div className="py-32 text-center bg-white/[0.02] rounded-[3rem] border border-dashed border-white/5 flex flex-col items-center gap-6 opacity-30">
                                    <BookText size={80} strokeWidth={1} />
                                    <p className="text-xl font-black uppercase italic tracking-tighter">Journal vide</p>
                                    <p className="text-[10px] max-w-xs uppercase font-black tracking-widest leading-relaxed">Commencez à noter les observations du labo pour une meilleure coordination.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default withAuth(TechnicianLogbookPage);
