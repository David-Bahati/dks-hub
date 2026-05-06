
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Product, Project } from '@/lib/types';
import { collection, query, where, getDocs, limit as firestoreLimit, addDoc, serverTimestamp, doc, orderBy } from 'firebase/firestore';
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
  FileText,
  Trophy,
  User,
  Megaphone,
  Rocket,
  Heart,
  Monitor,
  Video,
  Shield,
  Eye,
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/ui/Logo';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { 
    Carousel, 
    CarouselContent, 
    CarouselItem 
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const ICON_MAP: Record<string, any> = {
    "Zap": Zap,
    "Globe": Globe,
    "Video": Video,
    "Network": Network,
    "Cpu": Cpu,
    "Layout": Layout,
};

export default function LandingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { addToCart } = useCart();
  const { toast } = useToast();

  const configRef = useMemoFirebase(() => doc(db, "system", "config"), []);
  const { data: config } = useDoc(configRef);

  const projectsQuery = useMemoFirebase(() => {
    return query(collection(db, "projects"), where("isPublished", "==", true), orderBy("createdAt", "desc"), firestoreLimit(3));
  }, []);
  const { data: latestProjects, isLoading: loadingProjects } = useCollection<Project>(projectsQuery);

  const activeAds = useMemo(() => {
      const defaultAds = [
          {
              id: 'def-1',
              title: "Arrivage Spécial RTX 4090",
              subtitle: "Les cartes graphiques les plus puissantes du monde sont arrivées à Bunia.",
              buttonText: "Voir le Stock",
              link: "#shop",
              isActive: true
          },
          {
              id: 'def-2',
              title: "DKS Academy : Inscriptions Ouvertes",
              subtitle: "Devenez un expert en Intelligence Artificielle et Blockchain dès aujourd'hui.",
              buttonText: "S'inscrire",
              link: "/services",
              isActive: true
          }
      ];

      if (!config?.ads || !Array.isArray(config.ads) || config.ads.length === 0) {
          return defaultAds;
      }
      
      const filtered = config.ads.filter((ad: any) => ad.isActive);
      return filtered.length > 0 ? filtered : defaultAds;
  }, [config]);

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

  const handleShareProject = async (project: Project) => {
    const shareData = {
        title: `DKS Excellence: ${project.title}`,
        text: `Découvrez la réalisation de Double King Shop pour ${project.client}`,
        url: window.location.origin + '/portfolio',
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error("Error sharing:", err);
        }
    } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareData.title} - ${shareData.url}`)}`;
        window.open(whatsappUrl, '_blank');
    }
  };

  const getIcon = (name: string) => {
    const IconComp = ICON_MAP[name] || Zap;
    return <IconComp size={24} className="text-accent" />;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative min-h-[95vh] flex items-center justify-center pt-20 overflow-hidden px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent opacity-50" />
        <div className="container max-w-6xl mx-auto text-center relative z-10">
          <Badge className="mb-10 bg-white/5 text-accent border-white/10 px-6 py-2 text-[10px] font-black uppercase tracking-[0.4em] backdrop-blur-md animate-in slide-in-from-top-4 duration-700">
            L'Épicentre de l'Excellence Technologique • Bunia
          </Badge>
          <h1 className="text-6xl md:text-9xl font-black uppercase italic tracking-tighter leading-[0.8] mb-10 animate-in fade-in zoom-in-95 duration-1000">DOMINEZ <br /><span className="premium-gradient-text">LE FUTUR</span></h1>
          <p className="text-lg md:text-2xl text-white/60 font-medium uppercase max-w-3xl mx-auto mb-16 leading-relaxed italic animate-in slide-in-from-bottom-4 duration-1000">Hardware de luxe, Académie de nouvelle génération et infrastructures certifiées.</p>
          <div className="flex flex-wrap justify-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <Button size="lg" className="h-20 px-12 rounded-[2rem] bg-accent text-black font-black uppercase italic text-lg shadow-[0_0_50px_rgba(56,189,248,0.3)] hover:scale-105 transition-all group" asChild><Link href="#shop">Explorer le Stock <ArrowUpRight className="ml-2" /></Link></Button>
              <Button size="lg" variant="outline" className="h-20 px-12 rounded-[2rem] border-white/10 hover:bg-white/5 font-black uppercase italic text-lg backdrop-blur-xl" asChild><Link href="/services">Nos Solutions Business</Link></Button>
          </div>
        </div>
      </section>

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
            <div className="flex items-center gap-4 group cursor-default"><div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform"><Coins size={20} /></div><div><p className="text-[10px] font-black uppercase text-accent tracking-widest">Consensus GCV Pi</p><p className="text-lg font-black text-white italic">1 π = $314,159.00</p></div></div>
            <div className="flex items-center gap-4 group cursor-default"><div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><Gem size={20} /></div><div><p className="text-[10px] font-black uppercase text-primary tracking-widest">Économie DKS</p><p className="text-lg font-black text-white italic">50.0M DKST Cap</p></div></div>
            <div className="flex items-center gap-4 group cursor-default"><div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform"><ShieldCheck size={20} /></div><div><p className="text-[10px] font-black uppercase text-green-400 tracking-widest">Expertise Labo</p><p className="text-lg font-black text-white italic">100% Certifié Bunia</p></div></div>
        </div>
      </section>

      <section className="container max-w-7xl mx-auto px-6 py-10">
        <Carousel 
          opts={{ loop: true }} 
          plugins={[Autoplay({ delay: 4000 })]} 
          className="w-full"
        >
          <CarouselContent>
            {activeAds.map((ad: any) => (
              <CarouselItem key={ad.id}>
                <div className="bg-gradient-to-r from-accent/20 to-primary/20 border border-white/10 rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-xl shadow-2xl relative overflow-hidden group h-full">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><Megaphone size={120} /></div>
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-accent text-black flex items-center justify-center shrink-0 shadow-xl shadow-accent/20">
                      <Megaphone size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-accent tracking-[0.4em]">Annonce Spéciale Hub</p>
                      <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-white leading-tight">
                        {ad.title} <br />
                        <span className="text-white/60 text-sm italic">{ad.subtitle}</span>
                      </h3>
                    </div>
                  </div>
                  <Button className="h-16 px-10 rounded-2xl bg-white text-black font-black uppercase italic hover:bg-accent transition-all shrink-0 shadow-lg relative z-10" asChild>
                    <Link href={ad.link}>
                      {ad.buttonText} <ArrowRight size={18} className="ml-2" />
                    </Link>
                  </Button>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </section>

      <section className="container max-w-7xl mx-auto px-6 py-10 border-b border-white/5">
          <div className="flex flex-col items-center gap-8">
              <p className="text-[8px] font-black uppercase tracking-[0.6em] text-white/20">Propulsé par les leaders mondiaux</p>
              <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                  <span className="text-xl font-black italic tracking-tighter hover:text-green-500 cursor-default transition-colors">NVIDIA</span>
                  <span className="text-xl font-black italic tracking-tighter hover:text-accent cursor-default transition-colors">STARLINK</span>
                  <span className="text-xl font-black italic tracking-tighter hover:text-primary cursor-default transition-colors">ASUS ROG</span>
                  <span className="text-xl font-black italic tracking-tighter hover:text-orange-500 cursor-default transition-colors">PI NETWORK</span>
                  <span className="text-xl font-black italic tracking-tighter hover:text-blue-400 cursor-default transition-colors">INTEL</span>
              </div>
          </div>
      </section>

      <section className="container max-w-7xl mx-auto px-6 py-20">
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

      <section className="container max-w-7xl mx-auto px-6 py-20">
          <Card className="bg-white/[0.02] border border-white/5 rounded-[4rem] p-12 md:p-20 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-12">
                  <div className="text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary mb-6"><GraduationCap size={24}/></div>
                      <p className="text-5xl font-black text-white italic tracking-tighter">1,200+</p>
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Étudiants Certifiés</p>
                  </div>
                  <div className="text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto text-accent mb-6"><Globe size={24}/></div>
                      <p className="text-5xl font-black text-white italic tracking-tighter">45+</p>
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Déploiements Starlink</p>
                  </div>
                  <div className="text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto text-green-400 mb-6"><ShieldCheck size={24}/></div>
                      <p className="text-5xl font-black text-white italic tracking-tighter">100%</p>
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Garantie Hub Bunia</p>
                  </div>
                  <div className="text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto text-orange-400 mb-6"><Rocket size={24}/></div>
                      <p className="text-5xl font-black text-white italic tracking-tighter">24/7</p>
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Support Expert Direct</p>
                  </div>
              </div>
          </Card>
      </section>

      <section className="container max-w-7xl mx-auto px-6 py-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
              <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">L'EXCELLENCE <span className="text-accent">EN ACTION</span></h2>
                  <p className="text-muted-foreground text-sm uppercase font-bold tracking-[0.3em]">dernières réalisations et chantiers technologiques</p>
              </div>
              <Button variant="ghost" className="text-accent font-black uppercase italic text-xs tracking-widest hover:bg-accent/10" asChild>
                  <Link href="/portfolio">Tout voir <ArrowRight className="ml-2" size={14} /></Link>
              </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {loadingProjects ? (
                  <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-accent h-10 w-10" /></div>
              ) : latestProjects && latestProjects.length > 0 ? latestProjects.map((project) => (
                  <Card key={project.id} className="glossy-card border-none rounded-[3rem] overflow-hidden group relative">
                      <div className="aspect-[4/3] relative overflow-hidden">
                          <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          <div className="absolute top-6 left-6 flex flex-col gap-2">
                             <Badge className="bg-accent text-black font-black uppercase text-[8px] italic tracking-widest w-fit">{project.category}</Badge>
                             <Badge variant="secondary" className="bg-black/40 text-white border-white/10 text-[8px] font-black w-fit gap-1"><Eye size={10} /> {project.views || 0} vues</Badge>
                          </div>
                          <button 
                              onClick={() => handleShareProject(project)}
                              className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-accent hover:text-black opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                          >
                              <Share2 size={16} />
                          </button>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full p-8 space-y-2">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                  {getIcon(project.iconName)}
                              </div>
                              <h3 className="text-xl font-black uppercase italic text-white leading-tight">{project.title}</h3>
                          </div>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-11">Client: {project.client}</p>
                      </div>
                  </Card>
              )) : (
                  <div className="col-span-full py-20 text-center opacity-20 italic">Aucune réalisation affichée.</div>
              )}
          </div>
      </section>

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

      <footer className="bg-card/40 border-t border-white/5 pt-32 pb-16 relative overflow-hidden">
        <div className="container max-w-7xl mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 mb-24">
                <div className="lg:col-span-4 space-y-10">
                    <Logo showText={true} size="lg" />
                    <p className="text-muted-foreground text-sm leading-relaxed italic">"Le premier Hub Technologique Hybride de l'Ituri, alliant commerce de luxe, formation d'élite et déploiements d'infrastructures certifiées."</p>
                </div>

                <div className="lg:col-span-4 grid grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Hub</h4>
                        <ul className="space-y-4 text-xs font-bold uppercase italic text-muted-foreground">
                            <li><Link href="/" className="hover:text-accent">Stock Hardware</Link></li>
                            <li><Link href="/services" className="hover:text-accent">DKS Academy</Link></li>
                            <li><Link href="/founder" className="hover:text-accent flex items-center gap-2"><User size={12}/> Le Fondateur</Link></li>
                            <li><Link href="/dashboard/hall-of-fame" className="hover:text-accent flex items-center gap-2"><Trophy size={12}/> Hall of Fame</Link></li>
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
                                {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : <><Send size={20} /></>}
                            </Button>
                        </form>
                    )}
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
