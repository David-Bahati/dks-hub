
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Coins, 
    ArrowLeft, 
    QrCode, 
    Smartphone, 
    ShieldCheck, 
    Banknote, 
    Loader2, 
    Zap,
    Download,
    Share2,
    ArrowRight,
    Info,
    CheckCircle2,
    DollarSign
} from "lucide-react";
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function DKSPayPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [amount, setAmount] = useState("");
    const [memo, setMemo] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [qrValue, setQrValue] = useState<string | null>(null);

    const handleGenerate = () => {
        if (!amount) return;
        setIsGenerating(true);
        setTimeout(() => {
            setQrValue(`DKSPAY-${user?.uid}-${amount}-${Date.now()}`);
            setIsGenerating(false);
            toast({ title: "Terminal Actif", description: "Présentez ce QR Code au client." });
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="flex items-center gap-4 mb-12">
                    <Link href="/dashboard"><Button variant="outline" className="h-14 w-14 rounded-2xl border-white/10 p-0 hover:bg-accent/10 hover:text-accent"><ArrowLeft size={24} /></Button></Link>
                    <div>
                        <h1 className="text-4xl font-black uppercase italic tracking-tighter">DKS <span className="text-accent">Pay</span></h1>
                        <p className="text-muted-foreground text-xs uppercase font-black opacity-40 mt-1">Terminal de paiement universel pour marchands de l'Ituri</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="glossy-card border-none rounded-[3rem] p-10 space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-accent text-black flex items-center justify-center shadow-lg"><Smartphone size={24} /></div>
                            <h2 className="text-xl font-black uppercase italic tracking-tight">Terminal Vendeur</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Montant à encaisser (USD)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" size={18} />
                                    <Input 
                                        type="number" 
                                        placeholder="0.00" 
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="h-16 pl-12 bg-background/50 border-white/5 rounded-2xl text-2xl font-black text-white" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Référence / Produit</Label>
                                <Input 
                                    placeholder="Ex: Facture Pharmacie #123" 
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                    className="h-14 bg-background/50 border-white/5 rounded-2xl italic" 
                                />
                            </div>
                            <Button 
                                onClick={handleGenerate} 
                                disabled={!amount || isGenerating}
                                className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20 gap-3"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" /> : <><QrCode size={20} /> Générer QR de Paiement</>}
                            </Button>
                        </div>
                    </Card>

                    <div className="flex flex-col gap-6">
                        {qrValue ? (
                            <Card className="bg-white text-black border-none rounded-[3.5rem] p-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-2 bg-accent" />
                                <Badge className="bg-accent text-black border-none font-black uppercase italic mb-8">Paiement DKS Network</Badge>
                                <div className="bg-white p-6 rounded-3xl shadow-2xl border-4 border-gray-100">
                                    <QrCode size={200} />
                                </div>
                                <div className="mt-8 space-y-1">
                                    <p className="text-4xl font-black italic tracking-tighter">${amount}</p>
                                    <p className="text-[10px] font-bold uppercase text-gray-400 tracking-[0.3em]">{memo || 'Sans mémo'}</p>
                                </div>
                                <div className="mt-10 flex gap-4 w-full">
                                    <Button variant="outline" className="flex-1 rounded-xl border-gray-200 text-gray-400"><Share2 size={16}/></Button>
                                    <Button onClick={() => setQrValue(null)} className="flex-1 bg-black text-white rounded-xl">Nouvelle Vente</Button>
                                </div>
                            </Card>
                        ) : (
                            <Card className="bg-white/5 border border-dashed border-white/10 rounded-[3.5rem] flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30">
                                <QrCode size={120} strokeWidth={1} />
                                <p className="mt-6 text-sm font-black uppercase italic tracking-widest leading-relaxed">
                                    Votre terminal est prêt.<br/>Entrez un montant pour démarrer.
                                </p>
                            </Card>
                        )}

                        <div className="p-6 bg-accent/5 rounded-[2rem] border border-accent/20 flex items-center gap-4">
                            <ShieldCheck className="text-accent" size={24} />
                            <p className="text-[9px] font-bold text-accent uppercase leading-relaxed italic">
                                Transactions sécurisées par le consensus Pi GCV et le protocole DKS. Règlement instantané.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default withAuth(DKSPayPage);
