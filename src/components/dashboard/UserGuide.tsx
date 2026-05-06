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
    Trophy
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
  
  // Simulation de progression basée sur le profil (en prod on checkerait les champs réels)
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
        toast({ title: "Certificat de Maîtrise généré", description: "Félicitations, vous êtes un Power User Élite !" });
    } catch (error) {
        toast({ title: "Erreur génération", variant: "destructive" });
    } finally {
        setIsGenerating(false);
    }
  };

  const r = role?.toLowerCase();

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER DU GUIDE AVEC PROGRESSION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
              <BookOpen size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Guide d'Utilisation <span className="text-primary">{role}</span></h3>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] opacity-60">Maîtrisez les protocoles du Hub DKS</p>
            </div>
          </div>

          <div className="w-full md:w-72 space-y-4">
             <div className="flex justify-between items-end">
                <p className="text-[9px] font-black uppercase text-accent tracking-widest flex items-center gap-2">
                    <Sparkles size={12} className="animate-pulse" /> Maîtrise du Hub
                </p>
                <span className="text-sm font-black italic">{masteryStats.score}%</span>
             </div>
             <Progress value={masteryStats.score} className="h-1.5 bg-white/5" indicatorClassName="bg-accent shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
             {masteryStats.score >= 80 ? (
                <Button 
                    onClick={handleDownloadMasteryCert}
                    disabled={isGenerating}
                    className="w-full h-10 bg-accent text-black font-black uppercase italic text-[9px] rounded-xl gap-2 animate-in zoom-in duration-500 shadow-xl shadow-accent/20"
                >
                    {isGenerating ? <Loader2 className="animate-spin w-3 h-3" /> : <Medal size={14} />} 
                    Obtenir mon Diplôme de Maîtrise
                </Button>
             ) : (
                <p className="text-[8px] font-bold text-white/20 uppercase text-center italic">Complétez 80% des étapes pour débloquer votre certificat</p>
             )}
          </div>
      </div>

      <Accordion type="single" collapsible className="grid grid-cols-1 md:grid-cols-2 gap-6 space-y-0">
        {/* SECTION COMMUNE : WALLET */}
        <AccordionItem value="wallet" className="border-none bg-white/[0.03] rounded-[2.5rem] px-8 hover:bg-white/[0.05] transition-all">
          <AccordionTrigger className="hover:no-underline py-8">
            <div className="flex items-center gap-5 text-xs font-black uppercase italic tracking-widest text-accent text-left">
              <Coins size={22} className="shrink-0" /> Architecture du Wallet DKST
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-white/60 leading-relaxed italic pb-8 border-t border-white/5 pt-6 space-y-4">
            <p>Votre wallet gère vos actifs numériques valorisés au <strong>GCV Pi</strong>.</p>
            <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-3 p-3 bg-black/20 rounded-2xl border border-white/5">
                    <CheckCircle2 size={14} className={masteryStats.steps.mining ? "text-green-400" : "text-white/10"} />
                    <span className="text-[9px] font-bold uppercase">Cycle de Minage (Toutes les 24h)</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-black/20 rounded-2xl border border-white/5">
                    <CheckCircle2 size={14} className={masteryStats.steps.staking ? "text-green-400" : "text-white/10"} />
                    <span className="text-[9px] font-bold uppercase">Vault DKS (Staking & Intérêts)</span>
                </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ADMIN SPECIFIC */}
        {(r === 'admin') && (
          <>
            <AccordionItem value="economy" className="border-none bg-white/[0.03] rounded-[2.5rem] px-8 hover:bg-white/[0.05] transition-all">
              <AccordionTrigger className="hover:no-underline py-8">
                <div className="flex items-center gap-5 text-xs font-black uppercase italic tracking-widest text-red-400 text-left">
                  <Scale size={22} className="shrink-0" /> Pilotage Monétaire (PIB)
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-white/60 leading-relaxed italic pb-8 border-t border-white/5 pt-6">
                En tant qu'Admin, vous contrôlez la **Banque Centrale**. Vous pouvez déclencher le versement des dividendes hebdomadaires (0.5% PIB) et surveiller la Trésorerie multi-devises (Pi, DKST, USD, CDF).
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="notary" className="border-none bg-white/[0.03] rounded-[2.5rem] px-8 hover:bg-white/[0.05] transition-all">
              <AccordionTrigger className="hover:no-underline py-8">
                <div className="flex items-center gap-5 text-xs font-black uppercase italic tracking-widest text-red-400 text-left">
                  <ShieldCheck size={22} className="shrink-0" /> Sceau du Notaire
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-white/60 leading-relaxed italic pb-8 border-t border-white/5 pt-6">
                Surveillez les comptes inactifs. Lorsqu'un membre déclenche son **Dead Man's Switch**, vous intervenez pour valider la transmission sécurisée des actifs vers son héritier désigné.
              </AccordionContent>
            </AccordionItem>
          </>
        )}

        {/* SELLER SPECIFIC */}
        {(r === 'admin' || r === 'seller') && (
          <>
            <AccordionItem value="inventory" className="border-none bg-white/[0.03] rounded-[2.5rem] px-8 hover:bg-white/[0.05] transition-all">
              <AccordionTrigger className="hover:no-underline py-8">
                <div className="flex items-center gap-5 text-xs font-black uppercase italic tracking-widest text-blue-400 text-left">
                  <ShoppingBag size={22} className="shrink-0" /> Gestion de Stock & IA
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-white/60 leading-relaxed italic pb-8 border-t border-white/5 pt-6">
                Mettez à jour le catalogue Hardware. Utilisez l'**IA DKS** pour générer des descriptions techniques vendeuses et surveillez les alertes de stock faible pour vos prochains arrivages RTX.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="sav-support" className="border-none bg-white/[0.03] rounded-[2.5rem] px-8 hover:bg-white/[0.05] transition-all">
              <AccordionTrigger className="hover:no-underline py-8">
                <div className="flex items-center gap-5 text-xs font-black uppercase italic tracking-widest text-blue-400 text-left">
                  <Wrench size={22} className="shrink-0" /> Centre de Support Live
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-white/60 leading-relaxed italic pb-8 border-t border-white/5 pt-6">
                Intervenez sur les tickets SAV via le Chat Live. Vous pouvez déduire des pièces détachées du stock directement en discutant et clôturer l'intervention par une facturation automatique.
              </AccordionContent>
            </AccordionItem>
          </>
        )}

        {/* CASHIER SPECIFIC */}
        {(r === 'admin' || r === 'cashier') && (
          <AccordionItem value="pos-cash" className="border-none bg-white/[0.03] rounded-[2.5rem] px-8 hover:bg-white/[0.05] transition-all">
            <AccordionTrigger className="hover:no-underline py-8">
              <div className="flex items-center gap-5 text-xs font-black uppercase italic tracking-widest text-green-400 text-left">
                <ShoppingCart size={22} className="shrink-0" /> Terminal de Caisse (POS)
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-xs text-white/60 leading-relaxed italic pb-8 border-t border-white/5 pt-6">
              Pour chaque vente, proposez le paiement en **Crypto-monnaie**. Si le client choisit Pi Network, générez le QR Code GCV. S'il choisit DKST, la transaction est validée via son code PIN Wallet.
            </AccordionContent>
          </AccordionItem>
        )}

        {/* CUSTOMER SPECIFIC */}
        {(r === 'customer') && (
          <>
            <AccordionItem value="academy-edu" className="border-none bg-white/[0.03] rounded-[2.5rem] px-8 hover:bg-white/[0.05] transition-all">
              <AccordionTrigger className="hover:no-underline py-8">
                <div className="flex items-center gap-5 text-xs font-black uppercase italic tracking-widest text-purple-400 text-left">
                  <GraduationCap size={22} className="shrink-0" /> DKS Academy & Diplômes
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-white/60 leading-relaxed italic pb-8 border-t border-white/5 pt-6 space-y-4">
                <p>Suivez votre progression dans vos cursus IA ou Blockchain. Vos certificats sont archivés ici après validation.</p>
                <Link href="/dashboard/services">
                    <Button variant="outline" className="w-full h-10 border-purple-500/20 text-purple-400 hover:bg-purple-500/10 gap-2 font-black uppercase text-[9px] rounded-xl">
                        <FileBadge size={14} /> Accéder à mes Diplômes
                    </Button>
                </Link>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="heritage-sec" className="border-none bg-white/[0.03] rounded-[2.5rem] px-8 hover:bg-white/[0.05] transition-all">
              <AccordionTrigger className="hover:no-underline py-8">
                <div className="flex items-center gap-5 text-xs font-black uppercase italic tracking-widest text-orange-400 text-left">
                  <HeartPulse size={22} className="shrink-0" /> Sécurité & Héritage
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-white/60 leading-relaxed italic pb-8 border-t border-white/5 pt-6 space-y-4">
                <p>Protégez votre fortune GCV.</p>
                <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-3 p-3 bg-black/20 rounded-2xl border border-white/5">
                        <CheckCircle2 size={14} className={masteryStats.steps.security ? "text-green-400" : "text-white/10"} />
                        <span className="text-[9px] font-bold uppercase">Signature PIN de Sécurité</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-black/20 rounded-2xl border border-white/5">
                        <CheckCircle2 size={14} className={masteryStats.steps.heritage ? "text-green-400" : "text-white/10"} />
                        <span className="text-[9px] font-bold uppercase">Désignation Héritier Web3</span>
                    </div>
                </div>
                <Link href="/dashboard/wallet">
                    <Button variant="ghost" className="w-full h-8 text-accent font-black uppercase text-[8px] hover:bg-accent/5">Configurer maintenant</Button>
                </Link>
              </AccordionContent>
            </AccordionItem>
          </>
        )}
      </Accordion>

      {/* MODÈLE DE CERTIFICAT DE MAÎTRISE CACHÉ */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={certRef} className="bg-white text-black p-0 w-[1123px] h-[794px] font-serif relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 border-[40px] border-double border-[#0f172a]" />
            <div className="absolute inset-10 border-4 border-[#19d4f0]/20" />
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none"><Logo size="xl" /></div>

            <div className="relative z-10 text-center w-full px-40 space-y-12">
                <div className="flex flex-col items-center gap-6">
                    <Logo size="lg" />
                    <div className="space-y-1">
                        <h2 className="text-sm font-bold tracking-[0.4em] uppercase text-[#0f172a]">Double King Hub Certification</h2>
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-40">Programme d'Excellence Technologique • Bunia, RDC</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-6xl font-black uppercase italic tracking-tighter text-[#0f172a]">CERTIFICAT DE MAÎTRISE</h1>
                    <p className="text-xl font-light italic text-gray-500 uppercase tracking-widest">Niveau : Power User Élite</p>
                </div>

                <div className="space-y-6 py-8">
                    <p className="text-lg font-medium text-gray-400">Le présent titre honorifique est décerné à</p>
                    <h3 className="text-5xl font-black uppercase tracking-tight border-b-2 border-gray-100 inline-block pb-2 px-10 italic">
                        {user?.name}
                    </h3>
                    <p className="text-lg font-medium text-gray-500 max-w-2xl mx-auto leading-relaxed italic">
                        Pour avoir démontré une maîtrise exceptionnelle des protocoles financiers, sécuritaires et techniques de l'écosystème **Double King Shop**.
                    </p>
                </div>

                <div className="grid grid-cols-3 items-end pt-12">
                    <div className="text-center space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date de distinction</p>
                        <p className="text-sm font-bold">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-3 border-2 border-gray-100 rounded-2xl bg-gray-50/50 shadow-xl"><QrCode size={60} className="opacity-20" /></div>
                        <p className="text-[8px] font-bold text-gray-300 uppercase tracking-tighter">ID: DKS-MASTER-{user?.uid.substring(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="text-center space-y-2">
                        <div className="w-40 h-px bg-gray-200 mx-auto" />
                        <div className="flex flex-col items-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Direction du Hub</p>
                            <p className="text-sm font-black italic">Expert Bahati Nyeke</p>
                            <ShieldCheck size={24} className="text-[#19d4f0] mt-2 opacity-30" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#19d4f0]/5 rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#0f172a]/5 rounded-tr-full" />
        </div>
      </div>
    </div>
  );
}
