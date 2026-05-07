
"use client";

import { useMemo, useState, useRef } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Award, 
    Zap, 
    ArrowLeft, 
    Loader2, 
    Trophy, 
    Target, 
    GraduationCap, 
    Wrench, 
    BookText, 
    CheckCircle2, 
    Star, 
    History as HistoryIcon,
    ShieldCheck,
    Cpu,
    Briefcase,
    Crown,
    FileDown,
    QrCode,
    User as UserIcon,
    ShieldAlert,
    ShoppingCart,
    TrendingUp,
    Coins,
    RefreshCw,
    Wallet,
    Globe,
    ExternalLink,
    Lock,
    Medal,
    Sparkles,
    Flame
} from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, updateDoc, doc, addDoc, serverTimestamp, increment, limit } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';
import { useToast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input";

function ExpertProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const logsQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return query(collection(db, "technicianLogs"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    }, [user?.uid]);
    const { data: logs } = useCollection(logsQuery);

    const handleExportReport = async () => {
        if (!reportRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`BILAN_EXPERT_DKS_${user?.name?.replace(/\s+/g, '_')}.pdf`);
            toast({ title: "Bilan exporté" });
        } catch (error) {
            toast({ title: "Erreur PDF", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex justify-between items-center mb-12">
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter">Profil <span className="text-accent">Expert</span></h1>
                    <Button onClick={handleExportReport} disabled={isGenerating} variant="outline">
                        {isGenerating ? <Loader2 className="animate-spin" /> : "Exporter Rapport"}
                    </Button>
                </div>
            </main>

            {/* HIDDEN REPORT TEMPLATE */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                {user && (
                    <div ref={reportRef} className="bg-white text-black p-16 w-[800px] font-sans">
                        <header className="flex justify-between items-start border-b-4 border-black pb-10 mb-12">
                            <Logo size="lg" />
                            <div className="text-right">
                                <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-2">RAPPORT EXPERT</h2>
                                <p className="text-lg font-bold">{user.name}</p>
                            </div>
                        </header>

                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-10">
                            <p className="text-xl italic text-gray-400">Attestation de performance certifiée</p>
                            <QrCode size={100} className="opacity-100 text-black" />
                        </div>

                        <footer className="mt-32 pt-10 border-t border-gray-100 flex justify-between items-end">
                            <div className="text-right space-y-4 relative">
                                <div className="absolute top-[-100px] right-0 flex flex-col items-center">
                                    {/* CACHET SÉCURITÉ MIDNIGHT BLUE */}
                                    <div className="w-28 h-28 rounded-full border-[3px] border-double border-blue-900 flex flex-col items-center justify-center p-1 rotate-[-5deg] opacity-95 relative">
                                        <div className="absolute inset-0 border border-blue-900/20 rounded-full scale-[0.95]" />
                                        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-30">
                                            <path id="expertCirclePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
                                            <text className="text-[3px] font-black fill-blue-900 uppercase">
                                                <textPath xlinkHref="#expertCirclePath">
                                                    CERTIFIED BY DOUBLE KING SHOP • ORIGINAL DOCUMENT • CERTIFIED BY DOUBLE KING SHOP • 
                                                </textPath>
                                            </text>
                                        </svg>
                                        <p className="text-[5px] font-black text-blue-900 uppercase leading-none">DKS EXPERT CERT</p>
                                        <ShieldCheck size={18} className="text-blue-900 my-0.5" />
                                        <p className="text-[4px] font-bold text-blue-900 uppercase">OFFICIAL SEAL</p>
                                        <p className="text-[6px] font-black text-blue-900 uppercase tracking-widest mt-0.5">BUNIA</p>
                                    </div>
                                    <div className="w-32 h-8 text-blue-950 mt-[-20px] rotate-[3deg]">
                                        <svg viewBox="0 0 200 60" className="w-full h-full"><path d="M20,40 Q50,10 80,40 T140,30 Q160,20 180,45" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                                    </div>
                                </div>
                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Visa Direction Technique Hub</p>
                            </div>
                        </footer>
                    </div>
                )}
            </div>
        </div>
    );
}

export default withAuth(ExpertProfilePage);
