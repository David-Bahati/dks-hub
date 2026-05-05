
'use client';

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
    Users
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserGuideProps {
  role: string;
}

export function UserGuide({ role }: UserGuideProps) {
  const r = role?.toLowerCase();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
          <BookOpen size={24} />
        </div>
        <div>
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Guide d'Utilisation <span className="text-primary">{role}</span></h3>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] opacity-60">Maîtrisez les protocoles du Hub DKS</p>
        </div>
      </div>

      <Accordion type="single" collapsible className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0">
        {/* SECTION COMMUNE : WALLET (Toujours en premier car c'est le coeur) */}
        <AccordionItem value="wallet" className="border-none bg-white/[0.03] rounded-[2rem] px-8 hover:bg-white/[0.05] transition-all">
          <AccordionTrigger className="hover:no-underline py-6">
            <div className="flex items-center gap-4 text-xs font-black uppercase italic tracking-widest text-accent text-left">
              <Coins size={18} className="shrink-0" /> Architecture du Wallet DKST
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-xs text-white/60 leading-relaxed italic pb-6 border-t border-white/5 pt-4">
            Votre wallet gère vos actifs numériques. Vous pouvez **Miner** toutes les 24h, placer vos fonds dans le **Vault (Staking)** pour un rendement passif, ou transférer des DKST sans frais à d'autres membres via le système P2P du Hub.
          </AccordionContent>
        </AccordionItem>

        {/* ADMIN SPECIFIC */}
        {(r === 'admin') && (
          <>
            <AccordionItem value="economy" className="border-none bg-white/[0.03] rounded-[2rem] px-8 hover:bg-white/[0.05] transition-all">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-4 text-xs font-black uppercase italic tracking-widest text-red-400 text-left">
                  <Scale size={18} className="shrink-0" /> Pilotage Monétaire (PIB)
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-white/60 leading-relaxed italic pb-6 border-t border-white/5 pt-4">
                En tant qu'Admin, vous contrôlez la **Banque Centrale**. Vous pouvez déclencher le versement des dividendes hebdomadaires (0.5% PIB) et surveiller la Trésorerie multi-devises (Pi, DKST, USD, CDF).
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="notary" className="border-none bg-white/[0.03] rounded-[2rem] px-8 hover:bg-white/[0.05] transition-all">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-4 text-xs font-black uppercase italic tracking-widest text-red-400 text-left">
                  <ShieldCheck size={18} className="shrink-0" /> Sceau du Notaire
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-white/60 leading-relaxed italic pb-6 border-t border-white/5 pt-4">
                Surveillez les comptes inactifs. Lorsqu'un membre déclenche son **Dead Man's Switch**, vous intervenez pour valider la transmission sécurisée des actifs vers son héritier désigné.
              </AccordionContent>
            </AccordionItem>
          </>
        )}

        {/* SELLER SPECIFIC */}
        {(r === 'admin' || r === 'seller') && (
          <>
            <AccordionItem value="inventory" className="border-none bg-white/[0.03] rounded-[2rem] px-8 hover:bg-white/[0.05] transition-all">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-4 text-xs font-black uppercase italic tracking-widest text-blue-400 text-left">
                  <ShoppingBag size={18} className="shrink-0" /> Gestion de Stock & IA
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-white/60 leading-relaxed italic pb-6 border-t border-white/5 pt-4">
                Mettez à jour le catalogue Hardware. Utilisez l'**IA DKS** pour générer des descriptions techniques vendeuses et surveillez les alertes de stock faible pour vos prochains arrivages RTX.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="sav-support" className="border-none bg-white/[0.03] rounded-[2rem] px-8 hover:bg-white/[0.05] transition-all">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-4 text-xs font-black uppercase italic tracking-widest text-blue-400 text-left">
                  <Wrench size={18} className="shrink-0" /> Centre de Support Live
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-white/60 leading-relaxed italic pb-6 border-t border-white/5 pt-4">
                Intervenez sur les tickets SAV via le Chat Live. Vous pouvez déduire des pièces détachées du stock directement en discutant et clôturer l'intervention par une facturation automatique.
              </AccordionContent>
            </AccordionItem>
          </>
        )}

        {/* CASHIER SPECIFIC */}
        {(r === 'admin' || r === 'cashier') && (
          <AccordionItem value="pos-cash" className="border-none bg-white/[0.03] rounded-[2rem] px-8 hover:bg-white/[0.05] transition-all">
            <AccordionTrigger className="hover:no-underline py-6">
              <div className="flex items-center gap-4 text-xs font-black uppercase italic tracking-widest text-green-400 text-left">
                <ShoppingCart size={18} className="shrink-0" /> Terminal de Caisse (POS)
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-xs text-white/60 leading-relaxed italic pb-6 border-t border-white/5 pt-4">
              Pour chaque vente, proposez le paiement en **Crypto-monnaie**. Si le client choisit Pi Network, générez le QR Code GCV. S'il choisit DKST, la transaction est validée via son code PIN Wallet.
            </AccordionContent>
          </AccordionItem>
        )}

        {/* CUSTOMER SPECIFIC */}
        {(r === 'customer') && (
          <>
            <AccordionItem value="academy-edu" className="border-none bg-white/[0.03] rounded-[2rem] px-8 hover:bg-white/[0.05] transition-all">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-4 text-xs font-black uppercase italic tracking-widest text-purple-400 text-left">
                  <GraduationCap size={18} className="shrink-0" /> DKS Academy & Diplômes
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-white/60 leading-relaxed italic pb-6 border-t border-white/5 pt-4">
                Suivez votre progression dans vos cursus IA ou Blockchain. Dès validation par votre instructeur, téléchargez votre **Certificat de Réussite PDF** directement depuis l'onglet "Services Hub".
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="heritage-sec" className="border-none bg-white/[0.03] rounded-[2rem] px-8 hover:bg-white/[0.05] transition-all">
              <AccordionTrigger className="hover:no-underline py-6">
                <div className="flex items-center gap-4 text-xs font-black uppercase italic tracking-widest text-orange-400 text-left">
                  <HeartPulse size={18} className="shrink-0" /> Sécurité & Héritage
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-white/60 leading-relaxed italic pb-6 border-t border-white/5 pt-4">
                Protégez votre fortune GCV. Configurez votre **PIN de Signature** et désignez un héritier. En cas de perte d'accès ou d'inactivité, vos actifs seront transmis en toute sécurité au bénéficiaire choisi.
              </AccordionContent>
            </AccordionItem>
          </>
        )}
      </Accordion>
    </div>
  );
}
