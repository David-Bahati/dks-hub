
'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
    BookOpen, 
    ShieldCheck, 
    Zap, 
    Coins, 
    ShoppingBag, 
    Wrench, 
    GraduationCap, 
    ShoppingCart,
    HeartPulse,
    Scale,
    CheckCircle2,
    Download,
    FileBadge,
    Loader2,
    QrCode,
    Sparkles,
    Medal,
    Trophy,
    Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Logo } from '@/components/ui/Logo';

interface UserGuideProps {
  role: string;
}

export function UserGuide({ role }: UserGuideProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);
  
  const masteryStats = useMemo(() => {
    let score = 0;
    const steps = {
        security: !!user?.walletPin,
        heritage: !!user?.beneficiaryId,
        mining: !!user?.lastMiningAt,
        staking: (user?.stakedBalance || 0) > 0,
        academy: (user?.pointsConverted || 0) > 0
    };

    if (steps.security) score += 20;
    if (steps.heritage) score += 20;
    if (steps.mining) score += 20;
    if (steps.staking) score += 20;
    if (steps.academy) score += 20;

    return { score, steps };
  }, [user]);

  const handleDownloadMasteryCert = async () => {
    if (!certRef.current) return;
    setIsGenerating(true);
    try {
        const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`CERTIF_MAITRISE_DKS_${user?.name?.replace(/\s+/g, '_')}.pdf`);
        toast({ title: "Certificat généré" });
    } catch (error) {
        toast({ title: "Erreur génération", variant: "destructive" });
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
          <h3 className="text-xl font-black uppercase italic tracking-tighter">Maîtrise du <span className="text-primary">Hub</span></h3>
          {masteryStats.score >= 80 && (
              <Button onClick={handleDownloadMasteryCert} disabled={isGenerating} className="bg-accent text-black font-black uppercase italic text-[9px] rounded-xl h-10 px-4 shadow-xl">
                  {isGenerating ? <Loader2 className="animate-spin" /> : <Medal size={14} className="mr-2" />} Obtenir Certificat
              </Button>
          )}
      </div>

      {/* MODÈLE CACHÉ DU CERTIFICAT DE MAÎTRISE */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={certRef} className="bg-white text-black p-0 w-[1123px] h-[794px] font-serif relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 border-[40px] border-double border-[#0f172a]" />
            <div className="absolute inset-10 border-4 border-blue-900/10" />

            <div className="relative z-10 text-center w-full px-40 space-y-12">
                <div className="flex flex-col items-center gap-6">
                    <Logo size="lg" />
                    <h2 className="text-sm font-bold tracking-[0.4em] uppercase text-blue-900">Double King Hub Certification</h2>
                </div>

                <h1 className="text-6xl font-black uppercase italic tracking-tighter text-[#0f172a]">CERTIFICAT DE MAÎTRISE</h1>

                <div className="space-y-8 py-10 bg-gray-50/50 rounded-[3rem] border border-gray-100">
                    <p className="text-lg font-medium text-gray-400">Décerné à l'Expert Elite</p>
                    <h3 className="text-5xl font-black uppercase tracking-tight border-b-2 border-gray-100 inline-block pb-2 px-14 italic">{user?.name}</h3>
                    <p className="text-lg font-medium text-gray-600 max-w-2xl mx-auto leading-relaxed italic px-10">Pour avoir atteint une maîtrise complète des protocoles sécuritaires et financiers du Hub DKS.</p>
                </div>

                <div className="grid grid-cols-3 items-end pt-12">
                    <div className="text-center">
                        <p className="text-sm font-bold">{new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <QrCode size={60} className="opacity-100 text-black" />
                    </div>
                    <div className="text-center space-y-4 relative">
                        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 flex flex-col items-center">
                            {/* CACHET SÉCURITÉ HAUTE DÉFINITION */}
                            <div className="w-28 h-28 rounded-full border-[3px] border-double border-blue-900 flex flex-col items-center justify-center p-1 rotate-[12deg] opacity-95 relative">
                                <div className="absolute inset-0 border border-blue-900/20 rounded-full scale-[0.95]" />
                                <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-60">
                                    <path id="masterCirclePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
                                    <text className="text-[4px] font-black fill-blue-900 uppercase">
                                        <textPath xlinkHref="#masterCirclePath">
                                            CERTIFIED BY DOUBLE KING SHOP • ORIGINAL DOCUMENT • CERTIFIED BY DOUBLE KING SHOP • 
                                        </textPath>
                                    </text>
                                </svg>
                                <p className="text-[5px] font-black text-blue-900 leading-none">DKS HUB MASTER</p>
                                <ShieldCheck size={18} className="text-blue-900 my-0.5" />
                                <p className="text-[4px] font-bold text-blue-900 uppercase">OFFICIAL SEAL</p>
                                <p className="text-[6px] font-black text-blue-900 uppercase tracking-widest mt-0.5">BUNIA</p>
                            </div>
                            <div className="w-32 h-8 text-blue-950 mt-[-20px] rotate-[-5deg]">
                                <svg viewBox="0 0 200 60" className="w-full h-full"><path d="M20,40 Q50,10 80,40 T140,30 Q160,20 180,45" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                            </div>
                        </div>
                        <p className="text-sm font-black italic">Expert Bahati Nyeke</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
