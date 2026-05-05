
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
  UserCheck,
  Info,
  Plus,
  Loader2,
  FileText
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

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
        await addDoc(collection(db, "newsletter"), { email, createdAt: serverTimestamp() });
        setSubscribed(true);
        toast({ title: "Inscription réussie", description: "Vous faites désormais partie de l'élite informée." });
    } catch (e) {
        toast({ title: "Erreur", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

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

      {/* KEY INDICATORS */}
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
            {partners.map((p, i) => (
                <div key={i} className="flex items-center gap-3 text-white group cursor-default">
                    <div className="group-hover:text-accent transition-colors">{p.icon}</div>
                    <span className="font-black uppercase italic text-sm tracking-tighter group-hover:text-white transition-colors">{p.name}</span>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* POLES OF EXCELLENCE */}
      <section className="container max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-24 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">NOS <span className="text-accent">PÔLES D'EXCELLENCE</span></h2>
            <p className="text-muted-foreground text-sm uppercase font-bold tracking-[0.3em]">L'écosystème technologique le plus avancé de l'Ituri</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
                { icon: <Cpu size={32} />, title: "Hardware Élite", desc: "Composants haut de gamme, RTX Serie 40 et configurations sur mesure.", link: "#shop", color: "text-accent", badge: "Elite Stock" },
                { icon: <GraduationCap size={32} />, title: "DKS Academy", desc: "Formations certifiantes en Intelligence Artificielle et Blockchain.", link: "/services", color: "text-primary", badge: "Education 2.0" },
                { icon: <Globe size={32} />, title: "Solutions Business", desc: "Déploiement Starlink, CCTV 8K et Infrastructures réseaux.", link: "/services/audit", color: "text-purple-400", badge: "Infrastructure" }
            ].map((s, i) => (
                <Link key={i} href={s.link}>
                    <Card className="glossy-card border-none rounded-[3rem] p-12 group cursor-pointer h-full flex flex-col justify-between hover:scale-[1.02] transition-all">
                        <div>
                            <div className={cn("w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform shadow-2xl", s.color)}>
                                {s.icon}
                            </div>
                            <Badge variant="outline" className="mb-4 border-white/10 text-white/40 text-[8px] font-black uppercase tracking-widest">{s.badge}</Badge>
                            <h3 className="text-3xl font-black uppercase italic tracking-tight mb-6">{s.title}</h3>
                            <p className="text-muted-foreground leading-relaxed italic text-sm">"{s.desc}"</p>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
      </section>

      {/* ELITE STOCK SHOWCASE */}
      <section id="shop" className="py-32 bg-black/20">
        <div className="container max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
                <div className="space-y-4">
                    <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">ELITE <span className="text-accent">STOCK</span></h2>
                    <p className="text-muted-foreground text-sm uppercase font-bold tracking-[0.3em]">Arrivages Hardware certifiés DKS</p>
                </div>
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input 
                        placeholder="Chercher un composant..." 
                        className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl focus:border-accent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-accent h-10 w-10" /></div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {filteredProducts.map(product => (
                        <Card key={product.id} className="glossy-card border-none rounded-[2.5rem] overflow-hidden group">
                            <div className="aspect-square relative overflow-hidden">
                                <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <Button variant="secondary" size="icon" className="rounded-xl"><Info size={18}/></Button>
                                    <Button className="rounded-xl bg-accent text-black" onClick={() => addToCart(product)}><ShoppingCart size={18}/></Button>
                                </div>
                                {product.stockQuantity < 5 && <Badge className="absolute top-4 right-4 bg-red-500 text-white border-none text-[8px] font-black uppercase px-2">Stock Limité</Badge>}
                            </div>
                            <CardContent className="p-8">
                                <Badge variant="outline" className="border-accent/20 text-accent text-[8px] font-black uppercase px-2 mb-3">{product.category}</Badge>
                                <h3 className="text-lg font-black uppercase italic truncate mb-4">{product.name}</h3>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Prix Elite</p>
                                        <p className="text-2xl font-black text-white italic">${product.sellingPrice.toFixed(2)}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => addToCart(product)} className="text-accent hover:bg-accent/10 h-10 w-10"><Plus size={20}/></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
      </section>

      {/* DKS PRESS */}
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

      {/* ACADEMY CTA */}
      <section className="container max-w-7xl mx-auto px-6 py-32">
        <Card className="bg-primary/10 border-primary/20 rounded-[3rem] p-8 md:p-20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000"><GraduationCap size={240} /></div>
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 text-center lg:text-left">
                <div className="flex-1 space-y-8">
                    <Badge className="bg-primary text-white font-black uppercase tracking-[0.3em] px-4 py-1.5 italic">ACADEMY 2.0</Badge>
                    <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9] text-white">
                        REJOIGNEZ L'ÉLITE <br /><span className="text-primary">DU SAVOIR</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed font-medium">
                        Ne soyez plus spectateur de la révolution IA et Blockchain. Devenez un acteur certifié par Double King Academy à Bunia.
                    </p>
                </div>
                <div className="shrink-0 w-full sm:w-auto">
                    <Link href="/services">
                        <Button className="h-24 w-full sm:w-auto px-12 rounded-[2rem] bg-primary text-white font-black uppercase italic text-xl shadow-[0_0_50px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95 transition-all">
                            Voir les Cursus <ArrowRight size={28} className="ml-3" />
                        </Button>
                    </Link>
                </div>
            </div>
        </Card>
      </section>

      {/* INSTITUTIONAL FOOTER */}
      <footer className="bg-card/40 border-t border-white/5 pt-32 pb-16 relative overflow-hidden">
        <div className="container max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-24">
                <div className="lg:col-span-4 space-y-10">
                    <Logo showText={true} size="lg" />
                    <p className="text-muted-foreground text-sm leading-relaxed italic">"Le premier Hub Technologique Hybride de l'Ituri, alliant commerce de luxe, formation d'élite et déploiements d'infrastructures certifiées."</p>
                    <div className="flex gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-accent transition-all cursor-pointer" />)}
                    </div>
                </div>

                <div className="lg:col-span-4 grid grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Hub</h4>
                        <ul className="space-y-4 text-xs font-bold uppercase italic text-muted-foreground">
                            <li><Link href="/" className="hover:text-accent">Stock Hardware</Link></li>
                            <li><Link href="/services" className="hover:text-accent">DKS Academy</Link></li>
                            <li><Link href="/portfolio" className="hover:text-accent">Portfolio</Link></li>
                            <li><Link href="/whitepaper" className="hover:text-accent flex items-center gap-2"><FileText size={12}/> Livre Blanc</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Support</h4>
                        <ul className="space-y-4 text-xs font-bold uppercase italic text-muted-foreground">
                            <li><Link href="/dashboard/support" className="hover:text-accent">SAV Live</Link></li>
                            <li><Link href="/dashboard/wallet" className="hover:text-accent">Pi GCV Wallet</Link></li>
                            <li><Link href="/login" className="hover:text-accent">Connexion</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">REJOINDRE L'ALERTE ÉLITE</h4>
                    {subscribed ? (
                        <div className="p-8 bg-accent/10 border border-accent/20 rounded-3xl animate-in zoom-in duration-500">
                            <div className="flex items-center gap-4 text-accent">
                                <MailCheck size={32} />
                                <div><p className="font-black uppercase italic text-sm">Abonnement Actif</p><p className="text-[10px] font-bold opacity-60">Vous recevrez les arrivages RTX en priorité.</p></div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleNewsletter} className="relative group">
                            <Input 
                                type="email" 
                                placeholder="Votre email officiel..." 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-16 pl-6 pr-16 bg-white/5 border-white/10 rounded-2xl focus:border-accent transition-all"
                            />
                            <Button type="submit" disabled={submitting} className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-xl bg-accent text-black p-0 shadow-lg shadow-accent/20">
                                {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Send size={20} />}
                            </Button>
                        </form>
                    )}
                    <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Informez-vous sur les stocks, sessions Academy et opportunités Mining.</p>
                </div>
            </div>

            <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">© 2024 DOUBLE KING SHOP HUB • EST. BUNIA, RDC</p>
                <div className="flex items-center gap-6">
                    <Badge variant="outline" className="border-white/5 text-white/20 text-[8px] font-black uppercase">Infrastructure Certifiée</Badge>
                    <Badge variant="outline" className="border-white/5 text-white/20 text-[8px] font-black uppercase">Pi GCV compliant</Badge>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
