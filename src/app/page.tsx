
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';
import { collection, query, where, getDocs, limit as firestoreLimit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCart } from '@/context/CartContext';
import { 
  Search, 
  Sparkles, 
  ArrowRight,
  Cpu,
  GraduationCap,
  Globe,
  Layout,
  ShieldCheck,
  Zap,
  Coins,
  ArrowUpRight,
  Gem,
  Award,
  Star,
  ShoppingCart,
  Server,
  Network,
  Newspaper,
  Calendar,
  MessageSquare,
  Send,
  MailCheck,
  CheckCircle,
  Activity,
  Flame,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/ui/Logo';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

export default function LandingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { addToCart } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        const q = query(collection(db, "products"), where("isPublished", "==", true), firestoreLimit(8));
        const snapshot = await getDocs(q);
        const productsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
        setProducts(productsList);
      } catch (error) { console.error(error); } finally { setLoading(false); }
    }
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const partners = [
    { name: "NVIDIA", icon: <Zap size={20} /> },
    { name: "Starlink", icon: <Globe size={20} /> },
    { name: "ASUS ROG", icon: <Cpu size={20} /> },
    { name: "Pi Network", icon: <Coins size={20} /> },
    { name: "Ubiquiti", icon: <Network size={20} /> },
    { name: "Intel", icon: <Server size={20} /> }
  ];

  const news = [
    { date: "12 Mai 2024", category: "Communiqué", title: "DKS Solutions devient Installateur Certifié Starlink en Ituri", excerpt: "Une nouvelle ère de connectivité s'ouvre pour les entreprises de Bunia.", icon: <Globe className="text-accent" /> },
    { date: "08 Mai 2024", category: "Arrivage", title: "Stock RTX 4090 Founders Edition disponible au Hub", excerpt: "Le fleuron de NVIDIA arrive enfin dans notre boutique.", icon: <Cpu className="text-primary" /> },
    { date: "01 Mai 2024", category: "Événement", title: "Succès du premier Atelier IA 'Prompt Engineering'", excerpt: "Plus de 50 participants formés à la maîtrise des outils génératifs.", icon: <Sparkles className="text-yellow-500" /> }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative min-h-[95vh] flex items-center justify-center pt-20 overflow-hidden px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent opacity-50" />
        <div className="container max-w-6xl mx-auto text-center relative z-10">
          <Badge className="mb-10 bg-white/5 text-accent border-white/10 px-6 py-2 text-[10px] font-black uppercase tracking-[0.4em] backdrop-blur-md">
            L'Épicentre de l'Excellence Technologique • Bunia
          </Badge>
          <h1 className="text-6xl md:text-9xl font-black uppercase italic tracking-tighter leading-[0.8] mb-10">DOMINEZ <br /><span className="premium-gradient-text">LE FUTUR</span></h1>
          <p className="text-lg md:text-2xl text-white/60 font-medium uppercase max-w-3xl mx-auto mb-16 leading-relaxed italic">Hardware de luxe, Académie de nouvelle génération et infrastructures certifiées.</p>
          <div className="flex flex-wrap justify-center gap-6">
              <Button size="lg" className="h-20 px-12 rounded-[2rem] bg-accent text-black font-black uppercase italic text-lg shadow-[0_0_50px_rgba(56,189,248,0.3)] hover:scale-105 transition-all group" asChild><Link href="#shop">Explorer le Stock <ArrowUpRight className="ml-2" /></Link></Button>
              <Button size="lg" variant="outline" className="h-20 px-12 rounded-[2rem] border-white/10 hover:bg-white/5 font-black uppercase italic text-lg backdrop-blur-xl" asChild><Link href="/services">Nos Solutions Business</Link></Button>
          </div>
        </div>
      </section>

      {/* LIVE HUB ACTIVITY TICKER */}
      <section className="bg-accent/5 border-y border-white/5 py-6 overflow-hidden relative group">
          <div className="absolute left-0 top-0 h-full w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-background to-transparent z-10" />
          <div className="flex whitespace-nowrap animate-in slide-in-from-right-full duration-[30s] infinite gap-12 items-center">
              {[1, 2].map(i => (
                  <div key={i} className="flex gap-12 items-center">
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-accent"><Flame size={14} className="animate-pulse" /> Bloc légendaire miné par @Expert_Bahati (+5.0 DKST)</div>
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary"><UserCheck size={14} /> Nouvel Expert Certifié IA : @John_Doe_Bunia</div>
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-green-400"><Globe size={14} /> Déploiement Starlink activé : @RawBank_Bunia</div>
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-yellow-500"><Coins size={14} /> Consensus GCV validé par 24 validateurs</div>
                  </div>
              ))}
          </div>
      </section>

      <section className="bg-white/[0.02] border-b border-white/5 py-8">
        <div className="container max-w-7xl mx-auto px-6 flex flex-wrap justify-center md:justify-between items-center gap-10">
            <div className="flex items-center gap-4 group"><div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent"><Coins size={20} /></div><div><p className="text-[10px] font-black uppercase text-accent tracking-widest">Consensus GCV Pi</p><p className="text-lg font-black text-white italic">1 π = $314,159.00</p></div></div>
            <div className="flex items-center gap-4 group"><div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Gem size={20} /></div><div><p className="text-[10px] font-black uppercase text-primary tracking-widest">Économie DKS</p><p className="text-lg font-black text-white italic">50.0M DKST Cap</p></div></div>
            <div className="flex items-center gap-4 group"><div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400"><ShieldCheck size={20} /></div><div><p className="text-[10px] font-black uppercase text-green-400 tracking-widest">Expertise Labo</p><p className="text-lg font-black text-white italic">100% Certifié Bunia</p></div></div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="py-12 bg-black/20">
        <div className="container max-w-7xl mx-auto px-6 flex flex-col items-center gap-8">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">Nos Partenaires Stratégiques</p>
          <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8 opacity-40 hover:opacity-100 transition-opacity">
            {partners.map((p, i) => <div key={i} className="flex items-center gap-3 text-white group cursor-default"><div className="group-hover:text-accent transition-colors">{p.icon}</div><span className="font-black uppercase italic text-sm tracking-tighter group-hover:text-white transition-colors">{p.name}</span></div>)}
          </div>
        </div>
      </section>

      {/* NEWS */}
      <section className="py-32 bg-background">
        <div className="container max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-6 mb-16"><h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4"><Newspaper className="text-accent" /> DKS <span className="text-accent">PRESS</span></h2><div className="h-px flex-1 bg-white/5" /></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {news.map((item, idx) => (
                    <Card key={idx} className="bg-white/[0.02] border-white/5 rounded-[2.5rem] overflow-hidden hover:bg-white/[0.05] transition-all group">
                        <CardContent className="p-8 space-y-6">
                            <div className="flex justify-between items-start"><div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">{item.icon}</div><Badge variant="outline" className="border-accent/20 text-accent text-[8px] font-black uppercase px-2">{item.category}</Badge></div>
                            <div className="space-y-3"><div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase"><Calendar size={10} /> {item.date}</div><h3 className="text-xl font-black uppercase italic leading-tight">{item.title}</h3><p className="text-xs text-muted-foreground italic leading-relaxed">"{item.excerpt}"</p></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </section>

      <section className="container max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
        <div className="text-center mb-24 space-y-4"><h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">NOS <span className="text-accent">PÔLES D'EXCELLENCE</span></h2><p className="text-muted-foreground text-sm uppercase font-bold tracking-[0.3em]">L'écosystème technologique le plus avancé de l'Ituri</p></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
                { icon: <Cpu size={32} />, title: "Hardware Élite", desc: "Composants haut de gamme, RTX Serie 40 et configurations sur mesure.", link: "#shop", color: "text-accent", badge: "Elite Stock" },
                { icon: <GraduationCap size={32} />, title: "DKS Academy", desc: "Formations certifiantes en Intelligence Artificielle et Blockchain.", link: "/services", color: "text-primary", badge: "Education 2.0" },
                { icon: <Globe size={32} />, title: "Solutions Business", desc: "Déploiement Starlink, CCTV 8K et Infrastructures réseaux.", link: "/services/audit", color: "text-purple-400", badge: "Infrastructure" }
            ].map((s, i) => (
                <Link key={i} href={s.link}>
                    <Card className="glossy-card border-none rounded-[3rem] p-12 group cursor-pointer h-full flex flex-col justify-between hover:scale-[1.02] transition-all">
                        <div><div className={cn("w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform shadow-2xl", s.color)}>{s.icon}</div><Badge variant="outline" className="mb-4 border-white/10 text-white/40 text-[8px] font-black uppercase tracking-widest">{s.badge}</Badge><h3 className="text-3xl font-black uppercase italic tracking-tight mb-6">{s.title}</h3><p className="text-muted-foreground leading-relaxed italic text-sm">"{s.desc}"</p></div>
                    </Card>
                </Link>
            ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-card/40 border-t border-white/5 pt-32 pb-16 relative overflow-hidden">
        <div className="container max-w-7xl mx-auto px-6 relative z-10 text-center">
            <Logo showText={true} size="lg" className="justify-center mb-10" />
            <p className="text-muted-foreground text-sm max-w-xl mx-auto italic mb-12">Double King Shop est le premier Hub Technologique Hybride de l'Ituri, alliant commerce de luxe et formation d'élite.</p>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">© 2024 DOUBLE KING SHOP MANAGER • TOUS DROITS RÉSERVÉS</p>
        </div>
      </footer>
    </div>
  );
}
