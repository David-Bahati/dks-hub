
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';
import { collection, query, where, getDocs, limit as firestoreLimit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCart } from '@/context/CartContext';
import { PI_CONVERSION_RATE } from '@/lib/constants';
import { 
  Search, 
  ShoppingCart, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Headset, 
  ArrowRight,
  Star,
  Mail,
  Instagram,
  Twitter,
  Linkedin,
  Facebook,
  Cpu,
  Loader2,
  Smartphone,
  CheckCircle2,
  Laptop,
  MousePointer2,
  Monitor,
  Headphones,
  MessageSquare,
  Zap,
  Lock,
  LayoutGrid
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/Logo';
import { useCollection, useMemoFirebase } from '@/firebase';
import { cn } from '@/lib/utils';

const TESTIMONIALS = [
  {
    name: "Jean-Pierre Kabila",
    role: "Architecte Logiciel",
    content: "Le meilleur matériel que j'ai pu trouver à Bunia. Le service est impeccable et les délais sont respectés.",
    stars: 5,
    avatar: "https://picsum.photos/seed/user1/100/100"
  },
  {
    name: "Sarah Mwamba",
    role: "Graphiste Pro",
    content: "Ma nouvelle RTX 4090 tourne à merveille. DKS est devenu ma référence pour tout mon setup créatif.",
    stars: 5,
    avatar: "https://picsum.photos/seed/user2/100/100"
  },
  {
    name: "Dr. Marc Uziel",
    role: "Clinique de l'Espoir",
    content: "Nous avons équipé tout notre service informatique via DKS. Fiabilité et professionnalisme au rendez-vous.",
    stars: 5,
    avatar: "https://picsum.photos/seed/user3/100/100"
  }
];

const BRANDS = [
  "INTEL", "NVIDIA", "ASUS", "SAMSUNG", "LOGITECH", "RAZER", "CORSAIR", "MSI"
];

const SEARCH_TAGS = ["RTX 4090", "Clavier Mécanique", "Laptop Pro", "SSD 1TB", "Ecran Gaming"];

export default function LandingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(2500);
  const { addToCart } = useCart();

  const categoriesQuery = useMemoFirebase(() => collection(db, "categories"), []);
  const { data: categories } = useCollection(categoriesQuery);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Exchange Rate
        const configSnap = await getDoc(doc(db, "system", "config"));
        if (configSnap.exists()) {
          setExchangeRate(configSnap.data().exchangeRate || 2500);
        }

        // Fetch Products
        const q = query(collection(db, "products"), where("isPublished", "==", true), firestoreLimit(24));
        const snapshot = await getDocs(q);
        const productsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsList);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-FR').format(amount);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 scroll-smooth">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex items-center justify-center pt-20 overflow-hidden px-4">
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] right-[5%] w-[40vw] h-[40vw] bg-accent/10 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>

        <div className="container max-w-6xl mx-auto text-center">
          <Badge className="mb-8 bg-white/5 text-accent border-white/10 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Sparkles className="w-3 h-3 mr-2" />
            L'Élite du Hardware en Ituri
          </Badge>
          
          <h1 className="text-6xl md:text-9xl font-black uppercase italic tracking-tighter leading-[0.85] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            VOTRE SETUP <br />
            <span className="premium-gradient-text">SANS LIMITES</span>
          </h1>
          
          <div className="space-y-4 mb-14 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <p className="text-xl md:text-2xl text-white font-bold uppercase italic tracking-tight">
              Le plus grand stock de composants informatiques certifiés à Bunia.
            </p>
            <p className="text-base md:text-lg text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
              Livraison flash en <span className="text-accent font-bold">2 heures</span> et garantie locale sur site. 
              Paiements en Pi (GCV), Mobile Money ou Cash.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700">
            <Button size="lg" className="h-20 px-12 rounded-2xl bg-primary text-white font-black uppercase italic text-lg shadow-[0_0_40px_-10px_hsl(var(--primary))] hover:shadow-[0_0_60px_-5px_hsl(var(--primary))] transition-all group scale-105 active:scale-95" asChild>
              <Link href="#shop">
                Explorer le Stock
                <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-20 px-12 rounded-2xl border-white/10 bg-white/5 backdrop-blur-xl font-black uppercase italic text-lg text-white hover:bg-white/10 transition-all active:scale-95" asChild>
              <Link href="/login">Espace Client Pro</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Banner Locale */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-5 p-6 rounded-3xl bg-white/5 border border-white/5">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                    <Smartphone size={24} />
                </div>
                <div>
                    <h4 className="font-black uppercase italic text-xs">Paiement Local</h4>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">M-Pesa, Airtel, Orange acceptés</p>
                </div>
            </div>
            <div className="flex items-center gap-5 p-6 rounded-3xl bg-white/5 border border-white/5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Zap size={24} />
                </div>
                <div>
                    <h4 className="font-black uppercase italic text-xs">SAV Ultra-Réactif</h4>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Support à l'Immeuble Bahati</p>
                </div>
            </div>
            <div className="flex items-center gap-5 p-6 rounded-3xl bg-white/5 border border-white/5">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
                    <CheckCircle2 size={24} />
                </div>
                <div>
                    <h4 className="font-black uppercase italic text-xs">100% Original</h4>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Aucun reconditionné (No Refurbished)</p>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Partners Section */}
      <section className="py-16 border-b border-white/5 overflow-hidden">
        <div className="container max-w-7xl mx-auto px-6 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mb-10 italic">Partenaires Technologiques Officiels</p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-30 grayscale hover:opacity-100 transition-all duration-700">
                {BRANDS.map(brand => (
                    <span key={brand} className="text-2xl md:text-3xl font-black italic tracking-tighter text-white hover:text-accent transition-colors cursor-default">
                        {brand}
                    </span>
                ))}
            </div>
        </div>
      </section>

      {/* Shop Section */}
      <section id="shop" className="container max-w-7xl mx-auto px-6 py-40">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
          <div className="max-w-2xl">
            <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6 leading-none">
              DERNIERS <br /><span className="text-accent">ARRIVAGES</span>
            </h2>
            <p className="text-muted-foreground text-xl font-light">
              Le hardware mondial, disponible à Bunia aujourd'hui.
            </p>
          </div>
          
          <div className="w-full max-w-xl space-y-6">
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" />
                <input 
                type="text" 
                placeholder="Rechercher (RTX, Clavier, SSD...)" 
                className="w-full h-20 pl-16 pr-8 bg-white/5 border border-white/10 rounded-3xl focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all text-lg font-medium shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex flex-wrap gap-2 px-2">
                <span className="text-[10px] font-black uppercase text-muted-foreground/40 mt-1 mr-2 italic">Recherches populaires :</span>
                {SEARCH_TAGS.map(tag => (
                    <button 
                        key={tag} 
                        onClick={() => setSearchTerm(tag)}
                        className="text-[9px] font-black uppercase italic tracking-widest px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-accent/30 hover:text-accent transition-all"
                    >
                        {tag}
                    </button>
                ))}
            </div>
          </div>
        </div>

        {/* Category Icons Row (Synchronisée avec Firestore) */}
        <div className="flex flex-wrap gap-4 mb-16">
            <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                    "flex flex-col items-center justify-center gap-3 h-32 min-w-[120px] px-6 rounded-[2rem] border transition-all duration-500",
                    selectedCategory === null 
                        ? "bg-accent text-black border-accent shadow-xl scale-105" 
                        : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                )}
            >
                <LayoutGrid size={28} strokeWidth={selectedCategory === null ? 2.5 : 1.5} />
                <span className="text-[10px] font-black uppercase italic tracking-widest">Tous</span>
            </button>

            {categories?.map((cat: any) => (
                <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={cn(
                        "flex flex-col items-center justify-center gap-3 h-32 min-w-[120px] px-6 rounded-[2rem] border transition-all duration-500",
                        selectedCategory === cat.name 
                            ? "bg-accent text-black border-accent shadow-xl scale-105" 
                            : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                    )}
                >
                    <span className="text-3xl">{cat.icon || "📦"}</span>
                    <span className="text-[10px] font-black uppercase italic tracking-widest">{cat.name}</span>
                </button>
            ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="h-[500px] rounded-[3rem] bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.length > 0 ? filteredProducts.map((product) => (
              <Card key={product.id} className="glossy-card rounded-[3rem] overflow-hidden group border-none flex flex-col h-full hover:scale-[1.02] transition-transform duration-500">
                <div className="aspect-[4/5] relative overflow-hidden bg-black">
                  <Image 
                    src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/800`} 
                    alt={product.name} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-1000 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                  
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <Badge className="bg-black/60 backdrop-blur-md border-none uppercase text-[9px] font-black px-4 py-1.5 tracking-widest w-fit">
                      {product.category}
                    </Badge>
                  </div>

                  <div className="absolute bottom-6 left-6">
                    <div className="flex items-center gap-2 bg-green-500/20 backdrop-blur-md border border-green-500/30 px-3 py-1.5 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[9px] font-black uppercase text-green-400">En stock à Bunia</span>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-8 flex flex-col flex-1 relative z-10">
                  <h3 className="text-xl font-black uppercase italic mb-3 line-clamp-1 group-hover:text-accent transition-colors">{product.name}</h3>
                  <p className="text-xs text-muted-foreground font-light line-clamp-2 mb-8 flex-1 leading-relaxed">
                    {product.description || "Matériel informatique de pointe pour professionnels et gamers exigeants."}
                  </p>
                  
                  <div className="space-y-6 pt-4 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-4xl font-black text-white">${product.sellingPrice.toFixed(2)}</span>
                      <span className="text-accent font-black text-[11px] uppercase tracking-widest mt-1">
                         ≈ {formatCurrency(product.sellingPrice * exchangeRate)} FC
                      </span>
                    </div>
                    
                    <Button 
                      className="w-full h-16 rounded-2xl bg-white/5 hover:bg-primary hover:text-white border border-white/10 hover:border-primary font-black uppercase italic transition-all gap-4 text-xs active:scale-95 shadow-lg"
                      onClick={() => addToCart(product)}
                    >
                      <ShoppingCart size={18} />
                      Ajouter au panier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full py-32 text-center opacity-30">
                 <p className="text-2xl font-black uppercase italic">Aucun produit trouvé.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Testimonials Section */}
      <section className="py-40 bg-white/[0.01] border-y border-white/5">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-6">ILS NOUS FONT <span className="text-primary">CONFIANCE</span></h2>
            <p className="text-muted-foreground font-light text-lg">Rejoignez la communauté des leaders technologiques en Ituri.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {TESTIMONIALS.map((t, i) => (
              <Card key={i} className="bg-card/30 border-white/5 p-10 rounded-[3rem] hover:bg-card/50 transition-all flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                    <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-black uppercase italic text-sm">{t.name}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, starIdx) => (
                    <Star key={starIdx} size={14} className={starIdx < t.stars ? "fill-[#FFD700] text-[#FFD700]" : "text-white/10"} />
                  ))}
                </div>
                <p className="text-base italic font-light leading-relaxed text-muted-foreground">"{t.content}"</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="container max-w-4xl mx-auto px-6 text-center">
            <div className="w-20 h-20 rounded-[2rem] bg-green-500/10 flex items-center justify-center mx-auto mb-10 text-green-500">
                <MessageSquare size={40} />
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-6">PROJET <span className="text-accent">ENTREPRISE ?</span></h2>
            <p className="text-xl text-muted-foreground font-light mb-12 leading-relaxed">
                Besoin d'un devis personnalisé pour équiper vos bureaux ou votre cybercafé ? <br />
                Nos experts sont disponibles immédiatement sur WhatsApp.
            </p>
            <Button size="lg" className="h-20 px-12 rounded-[2rem] bg-green-600 hover:bg-green-700 text-white font-black uppercase italic text-lg gap-4 shadow-xl transition-all hover:scale-105" asChild>
                <Link href="https://wa.me/243823038945" target="_blank">
                    Discuter sur WhatsApp
                    <ArrowRight size={24} />
                </Link>
            </Button>
        </div>
      </section>

      {/* Footer Professional */}
      <footer className="bg-card/40 border-t border-white/5 pt-32 pb-24">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-20 mb-32">
            <div className="lg:col-span-2 space-y-10">
              <Logo showText={true} size="lg" />
              <p className="text-muted-foreground text-lg font-light leading-relaxed max-w-md">
                L'excellence informatique au cœur de l'Ituri. Nous fournissons le matériel qui propulse vos ambitions numériques.
              </p>
              
              <div className="space-y-4 pt-6">
                <h4 className="font-black uppercase italic text-xs tracking-widest opacity-60">Abonnez-vous aux exclusivités</h4>
                <div className="flex gap-3 max-w-md">
                  <div className="relative flex-1">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input placeholder="Votre e-mail" className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl focus:border-accent transition-all" />
                  </div>
                  <Button className="h-16 px-8 rounded-2xl bg-accent text-black font-black uppercase italic hover:bg-accent/80 active:scale-95 text-sm">REJOINDRE</Button>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-8">
                <h4 className="font-black uppercase italic text-xs tracking-widest opacity-60">Navigation</h4>
                <ul className="space-y-4 text-muted-foreground font-medium text-sm">
                  <li><Link href="#shop" className="hover:text-accent transition-colors">Catalogue Pro</Link></li>
                  <li><Link href="/login" className="hover:text-accent transition-colors">Espace Client</Link></li>
                  <li><Link href="#" className="hover:text-accent transition-colors">Politique GCV</Link></li>
                  <li><Link href="#" className="hover:text-accent transition-colors">SAV & Garantie</Link></li>
                </ul>
              </div>
              
              <div className="space-y-8">
                <h4 className="font-black uppercase italic text-xs tracking-widest opacity-60">Suivez-nous</h4>
                <div className="flex flex-wrap gap-3 w-fit">
                  {[
                    { icon: Instagram, label: "Instagram", color: "hover:bg-pink-600" },
                    { icon: Facebook, label: "Facebook", color: "hover:bg-blue-600" },
                    { icon: Twitter, label: "Twitter", color: "hover:bg-sky-500" },
                    { icon: Linkedin, label: "Linkedin", color: "hover:bg-blue-800" }
                  ].map((soc, i) => (
                    <div key={i} className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center transition-all cursor-pointer border border-white/10 ${soc.color} group`}>
                      <soc.icon size={18} className="group-hover:scale-110 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <h4 className="font-black uppercase italic text-xs tracking-widest opacity-60">Contact</h4>
              <ul className="space-y-6 text-muted-foreground font-medium text-sm">
                <li className="flex items-start gap-4">
                  <span className="text-accent">📍</span> 
                  <span className="leading-relaxed opacity-80">Immeuble Bahati, <br />Boulevard de la Libération, Bunia</span>
                </li>
                <li className="flex items-center gap-4">
                  <span className="text-accent">📞</span> 
                  <span className="font-black text-white">+243 823 038 945</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/20">
            <div className="flex items-center gap-4">
                <Lock size={10} />
                <span>© {new Date().getFullYear()} DKS SHOPMANAGER. EXCELLENCE & INNOVATION TECHNOLOGIQUE.</span>
            </div>
            <div className="flex gap-10">
              <Link href="#" className="hover:text-white transition-colors">Conditions de Vente</Link>
              <Link href="#" className="hover:text-white transition-colors">Mentions Légales</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
