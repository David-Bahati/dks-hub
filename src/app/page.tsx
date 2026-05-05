
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';
import { collection, query, where, getDocs, limit as firestoreLimit } from 'firebase/firestore';
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
  Star
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/ui/Logo';

export default function LandingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchData() {
      try {
        const q = query(collection(db, "products"), where("isPublished", "==", true), firestoreLimit(8));
        const snapshot = await getDocs(q);
        const productsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsList);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/30 selection:text-accent">
      <Navbar />

      {/* HERO SECTION INSTITUTIONNELLE */}
      <section className="relative min-h-[95vh] flex items-center justify-center pt-20 overflow-hidden px-4">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent opacity-50" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-pulse delay-1000" />
        
        <div className="container max-w-6xl mx-auto text-center relative z-10">
          <Badge className="mb-10 bg-white/5 text-accent border-white/10 px-6 py-2 text-[10px] font-black uppercase tracking-[0.4em] backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-700">
            <Sparkles className="w-3 h-3 mr-2 animate-pulse" />
            L'Épicentre de l'Excellence Technologique • Bunia
          </Badge>
          
          <h1 className="text-6xl md:text-9xl font-black uppercase italic tracking-tighter leading-[0.8] mb-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            DOMINEZ <br />
            <span className="premium-gradient-text">LE FUTUR</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-white/60 font-medium uppercase tracking-[0.1em] max-w-3xl mx-auto mb-16 leading-relaxed italic animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Hardware de luxe, Académie de nouvelle génération et infrastructures certifiées. Propulsé par l'économie globale <span className="text-accent">DKST & Pi Network</span>.
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
              <Button size="lg" className="h-20 px-12 rounded-[2rem] bg-accent text-black font-black uppercase italic text-lg shadow-[0_0_50px_rgba(56,189,248,0.3)] hover:scale-105 active:scale-95 transition-all group" asChild>
                  <Link href="#shop">
                    Explorer le Stock <ArrowUpRight className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-20 px-12 rounded-[2rem] border-white/10 hover:bg-white/5 font-black uppercase italic text-lg backdrop-blur-xl" asChild>
                  <Link href="/services">Nos Solutions Business</Link>
              </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-20">
            <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
            <span className="text-[8px] font-black uppercase tracking-[0.5em] rotate-90 origin-left ml-2">Scroll</span>
        </div>
      </section>

      {/* BANDEAU D'INDICATEURS ÉCONOMIQUES (TRUST BAR) */}
      <section className="bg-white/[0.02] border-y border-white/5 py-8 backdrop-blur-3xl relative z-20">
        <div className="container max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap justify-center md:justify-between items-center gap-10">
                <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform"><Coins size={20} /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-accent tracking-widest">Consensus GCV Pi</p>
                        <p className="text-lg font-black text-white italic">1 π = $314,159.00</p>
                    </div>
                </div>
                <div className="w-px h-10 bg-white/5 hidden md:block" />
                <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><Gem size={20} /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest">Économie DKS</p>
                        <p className="text-lg font-black text-white italic">50.0M DKST Cap</p>
                    </div>
                </div>
                <div className="w-px h-10 bg-white/5 hidden md:block" />
                <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform"><ShieldCheck size={20} /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-green-400 tracking-widest">Expertise Labo</p>
                        <p className="text-lg font-black text-white italic">100% Certifié Bunia</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* SECTION DES 3 PILIERS (LES SERVICES) */}
      <section className="container max-w-7xl mx-auto px-6 py-32">
        <div className="text-center mb-24 space-y-4">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">NOS <span className="text-accent">PÔLES D'EXCELLENCE</span></h2>
            <p className="text-muted-foreground text-sm uppercase font-bold tracking-[0.3em]">L'écosystème technologique le plus avancé de l'Ituri</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
                { 
                    icon: <Cpu size={32} />, 
                    title: "Hardware Élite", 
                    desc: "Composants haut de gamme, RTX Serie 40, Laptops Pro et configurations sur mesure.", 
                    link: "#shop",
                    color: "text-accent",
                    badge: "Elite Stock"
                },
                { 
                    icon: <GraduationCap size={32} />, 
                    title: "DKS Academy", 
                    desc: "Formations certifiantes en Intelligence Artificielle, Blockchain et Économie Digitale.", 
                    link: "/services",
                    color: "text-primary",
                    badge: "Education 2.0"
                },
                { 
                    icon: <Globe size={32} />, 
                    title: "Solutions Business", 
                    desc: "Déploiement Starlink, CCTV 8K, Câblage Optique et Infrastructures pour entreprises.", 
                    link: "/services/audit",
                    color: "text-purple-400",
                    badge: "Infrastructure"
                }
            ].map((s, i) => (
                <Link key={i} href={s.link}>
                    <Card className="glossy-card border-none rounded-[3.5rem] p-12 group cursor-pointer h-full flex flex-col justify-between hover:scale-[1.02] transition-all">
                        <div>
                            <div className={cn("w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform shadow-2xl", s.color)}>
                                {s.icon}
                            </div>
                            <Badge variant="outline" className="mb-4 border-white/10 text-white/40 text-[8px] font-black uppercase tracking-widest">{s.badge}</Badge>
                            <h3 className="text-3xl font-black uppercase italic tracking-tight mb-6">{s.title}</h3>
                            <p className="text-muted-foreground leading-relaxed italic text-sm">"{s.desc}"</p>
                        </div>
                        <div className="pt-10 flex items-center gap-4 text-white/20 group-hover:text-accent transition-colors">
                            <span className="text-[10px] font-black uppercase tracking-widest">En savoir plus</span>
                            <ArrowRight size={16} />
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
      </section>

      {/* CATALOGUE HARDWARE (LE SHOP) */}
      <section id="shop" className="bg-white/[0.01] py-32 border-y border-white/5">
        <div className="container max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-20">
                <div className="space-y-4">
                    <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
                        BOUTIQUE <span className="text-accent">ELITE</span>
                    </h2>
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm italic">Hardware premium disponible immédiatement à Bunia.</p>
                </div>
                <div className="w-full max-w-xl">
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Chercher un composant (ex: RTX, Razer, i9...)" 
                            className="w-full h-20 pl-16 pr-8 bg-black/40 border border-white/10 rounded-[2rem] focus:border-accent transition-all text-lg font-medium backdrop-blur-xl"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="aspect-[4/5] rounded-[3rem] bg-white/5 animate-pulse" />
                    ))
                ) : filteredProducts.map((product) => (
                    <Card key={product.id} className="glossy-card rounded-[3rem] overflow-hidden group border-none flex flex-col h-full bg-card/60">
                        <div className="aspect-[4/5] relative overflow-hidden bg-black">
                            <img 
                                src={product.imageUrl} 
                                alt={product.name} 
                                className="object-cover w-full h-full opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                            />
                            <div className="absolute top-6 left-6">
                                <Badge className="bg-black/60 backdrop-blur-md text-accent border-none font-black text-[8px] uppercase tracking-widest px-3 py-1">
                                    {product.category}
                                </Badge>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                        </div>
                        <CardContent className="p-10 space-y-8 flex-1 flex flex-col justify-between">
                            <div className="space-y-4">
                                <h3 className="text-2xl font-black uppercase italic tracking-tight leading-none line-clamp-2">{product.name}</h3>
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={10} className="fill-accent text-accent" />)}
                                    </div>
                                    <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">Elite Rating</span>
                                </div>
                            </div>
                            
                            <div className="pt-6 border-t border-white/5 space-y-6">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black uppercase text-muted-foreground italic">Prix au Hub</p>
                                        <p className="text-4xl font-black text-white italic tracking-tighter">${(product.sellingPrice || 0).toFixed(0)}</p>
                                    </div>
                                    <Badge variant="outline" className="bg-accent/10 border-accent/20 text-accent font-black text-[8px] uppercase px-3 py-1 animate-pulse">
                                        <Coins size={10} className="mr-1.5" /> DKST OK
                                    </Badge>
                                </div>
                                <Button className="w-full h-14 rounded-2xl bg-white/5 hover:bg-accent hover:text-black font-black uppercase italic transition-all group" onClick={() => addToCart(product)}>
                                    Ajouter au Panier <ShoppingCart size={18} className="ml-3 group-hover:scale-110 transition-transform" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredProducts.length === 0 && !loading && (
                <div className="py-32 text-center bg-white/5 rounded-[4rem] border border-dashed border-white/10 opacity-30">
                    <p className="text-xl font-black uppercase italic tracking-widest italic">Aucun article ne correspond à votre élite...</p>
                </div>
            )}
            
            <div className="mt-20 text-center">
                <Link href="/shop">
                    <Button variant="ghost" className="h-16 px-10 rounded-2xl font-black uppercase italic gap-3 text-accent hover:bg-accent/5">
                        Consulter tout le catalogue <ArrowRight size={20} />
                    </Button>
                </Link>
            </div>
        </div>
      </section>

      {/* PORTFOLIO & SAVOIR-FAIRE (REALISATIONS) */}
      <section className="py-32 container max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="space-y-4">
                <Badge className="bg-primary/20 text-primary border-none font-black uppercase tracking-[0.4em] px-5 py-1.5 rounded-full">Projets d'Exception</Badge>
                <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">NOTRE <span className="text-primary">HÉRITAGE</span></h2>
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest italic">Transformer Bunia par la haute technologie.</p>
            </div>
            <Link href="/portfolio">
                <Button variant="outline" className="h-14 px-8 rounded-2xl border-white/10 font-black uppercase italic text-xs gap-3">
                    Voir toutes les réalisations <Layout size={18} />
                </Button>
            </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <Card className="overflow-hidden rounded-[4rem] border-none aspect-video relative group cursor-pointer">
                <img src="https://picsum.photos/seed/build1/1200/800" className="object-cover w-full h-full group-hover:scale-105 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-12 flex flex-col justify-end">
                    <div className="flex items-center gap-4 mb-6">
                        <Badge className="bg-accent text-black font-black uppercase text-[10px] tracking-widest px-4 py-1">Infrastructure</Badge>
                        <span className="text-[10px] font-bold uppercase text-white/60">Bunia, Immeuble Bahati</span>
                    </div>
                    <h3 className="text-4xl font-black uppercase italic text-white tracking-tight leading-none group-hover:text-accent transition-colors">Déploiement Wi-Fi Business <br /> Maillé Haute Densité</h3>
                    <p className="text-white/40 text-sm mt-4 max-w-lg italic opacity-0 group-hover:opacity-100 transition-opacity">Expertise UniFi & Starlink pour une connectivité sans faille.</p>
                </div>
            </Card>
            <Card className="overflow-hidden rounded-[4rem] border-none aspect-video relative group cursor-pointer">
                <img src="https://picsum.photos/seed/build2/1200/800" className="object-cover w-full h-full group-hover:scale-105 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-12 flex flex-col justify-end">
                    <div className="flex items-center gap-4 mb-6">
                        <Badge className="bg-primary text-white font-black uppercase text-[10px] tracking-widest px-4 py-1">Custom PC</Badge>
                        <span className="text-[10px] font-bold uppercase text-white/60">Client VIP Élite</span>
                    </div>
                    <h3 className="text-4xl font-black uppercase italic text-white tracking-tight leading-none group-hover:text-primary transition-colors">Station de Travail 8K <br /> Optimisation IA GCV</h3>
                    <p className="text-white/40 text-sm mt-4 max-w-lg italic opacity-0 group-hover:opacity-100 transition-opacity">Refroidissement liquide sur mesure et performances brutes.</p>
                </div>
            </Card>
        </div>
      </section>

      {/* SECTION CTA ACADEMY "ELITE FUTURE" */}
      <section className="container max-w-6xl mx-auto px-6 mb-32">
          <Card className="bg-gradient-to-br from-primary/20 via-background to-black border-primary/20 rounded-[5rem] p-20 text-center relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-45 group-hover:rotate-0 transition-transform duration-[3s]"><GraduationCap size={400} className="text-primary" /></div>
              <div className="relative z-10 space-y-10">
                  <Badge className="bg-primary text-white font-black uppercase italic tracking-[0.4em] px-8 py-2 rounded-full">Rejoignez l'élite du savoir</Badge>
                  <h2 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.8] text-white">
                      NE SOYEZ PAS <br /><span className="text-primary">SPECTATEUR</span>
                  </h2>
                  <p className="text-xl text-white/40 font-medium max-w-2xl mx-auto leading-relaxed italic">
                      Apprenez à maîtriser l'Intelligence Artificielle et la Blockchain avec nos experts. Obtenez une certification reconnue par le Hub DKS.
                  </p>
                  <div className="pt-8">
                      <Link href="/services">
                        <Button className="h-24 px-16 rounded-[2.5rem] bg-primary text-white font-black uppercase italic text-2xl shadow-[0_0_60px_rgba(59,130,246,0.3)] hover:scale-105 active:scale-95 transition-all gap-5">
                            S'inscrire à l'Academy <Zap size={32} />
                        </Button>
                      </Link>
                  </div>
              </div>
          </Card>
      </section>

      {/* FOOTER PREMIUM */}
      <footer className="bg-card/40 border-t border-white/5 pt-32 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="container max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-32">
            <div className="space-y-10">
              <Logo showText={true} size="lg" className="transition-transform hover:scale-105" />
              <p className="text-muted-foreground text-sm leading-relaxed italic">
                Double King Shop est le premier Hub Technologique Hybride de l'Ituri, alliant commerce de luxe, formation d'élite et infrastructures numériques de pointe.
              </p>
              <div className="flex gap-4">
                  {[1, 2, 3].map(i => <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:border-accent transition-all cursor-pointer" />)}
              </div>
            </div>
            
            <div className="space-y-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Écosystème Hub</h4>
              <ul className="space-y-6 text-sm font-bold uppercase italic tracking-widest">
                <li><Link href="/" className="text-muted-foreground hover:text-white transition-colors">Boutique Hardware</Link></li>
                <li><Link href="/services" className="text-muted-foreground hover:text-white transition-colors">DKS Academy</Link></li>
                <li><Link href="/portfolio" className="text-muted-foreground hover:text-white transition-colors">Réalisations Pro</Link></li>
                <li><Link href="/graduates" className="text-muted-foreground hover:text-white transition-colors">Registre des Certifiés</Link></li>
              </ul>
            </div>

            <div className="space-y-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Support & Expert</h4>
              <ul className="space-y-6 text-sm font-bold uppercase italic tracking-widest">
                <li><Link href="/dashboard" className="text-muted-foreground hover:text-white transition-colors">Mon Espace Hub</Link></li>
                <li><Link href="/dashboard/wallet" className="text-muted-foreground hover:text-white transition-colors">Wallet GCV Central</Link></li>
                <li><Link href="/dashboard/support" className="text-muted-foreground hover:text-white transition-colors">Centre SAV Bunia</Link></li>
                <li><Link href="/dashboard/remote" className="text-muted-foreground hover:text-white transition-colors">Assistance Directe</Link></li>
              </ul>
            </div>

            <div className="space-y-10">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Contact Élite</h4>
              <div className="space-y-4">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                      <p className="text-[10px] font-black uppercase text-accent mb-2">Siège Central</p>
                      <p className="text-xs font-bold text-white italic">Immeuble Bahati, Boulevard de la Libération, Bunia, RDC</p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                      <p className="text-[10px] font-black uppercase text-accent mb-2">Ligne Directe Experts</p>
                      <p className="text-lg font-black text-white italic">+243 823 038 945</p>
                  </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-16 border-t border-white/5 gap-8 text-center md:text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
              © 2024 DOUBLE KING SHOP MANAGER • TOUS DROITS RÉSERVÉS
            </p>
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-white/20">
                <Link href="#" className="hover:text-accent">Terms</Link>
                <Link href="#" className="hover:text-accent">Privacy</Link>
                <Link href="#" className="hover:text-accent">Blockchain Audit</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
