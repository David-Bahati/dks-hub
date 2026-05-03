
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
  MessageSquare,
  Zap,
  Lock,
  LayoutGrid,
  GraduationCap,
  Globe,
  Rocket,
  Wrench
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/Logo';
import { useCollection, useMemoFirebase } from '@/firebase';
import { cn } from '@/lib/utils';

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
        const configSnap = await getDoc(doc(db, "system", "config"));
        if (configSnap.exists()) {
          setExchangeRate(configSnap.data().exchangeRate || 2500);
        }
        const q = query(collection(db, "products"), where("isPublished", "==", true), firestoreLimit(24));
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
      <section className="relative min-h-[95vh] flex items-center justify-center pt-20 overflow-hidden px-4 text-center">
        <div className="container max-w-6xl mx-auto">
          <Badge className="mb-8 bg-white/5 text-accent border-white/10 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
            <Sparkles className="w-3 h-3 mr-2" />
            L'Élite Technologique de l'Ituri
          </Badge>
          
          <h1 className="text-6xl md:text-9xl font-black uppercase italic tracking-tighter leading-[0.85] mb-8">
            PLUS QU'UNE BOUTIQUE <br />
            <span className="premium-gradient-text">UN HUB DE SERVICES</span>
          </h1>
          
          <div className="space-y-4 mb-14">
            <p className="text-xl md:text-2xl text-white font-bold uppercase italic tracking-tight">
              Hardware Premium • Formations IA • Infrastructure Réseau • SAV local.
            </p>
            <div className="flex justify-center gap-6">
                <Button size="lg" className="h-20 px-12 rounded-2xl bg-primary text-white font-black uppercase italic text-lg shadow-xl hover:scale-105 transition-all" asChild>
                    <Link href="#shop">Explorer le Stock</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-20 px-12 rounded-2xl border-white/10 bg-white/5 font-black uppercase italic text-lg hover:bg-white/10" asChild>
                    <Link href="/services">Nos Pôles Services</Link>
                </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Showcase Section */}
      <section className="py-32 bg-white/[0.02] border-y border-white/5">
        <div className="container max-w-7xl mx-auto px-6">
            <div className="text-center mb-20">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">NOS PÔLES D'EXCELLENCE</h2>
                <p className="text-muted-foreground font-light text-lg">Nous accompagnons votre développement numérique à Bunia.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { title: "FORMATION IA", icon: <GraduationCap />, desc: "Maîtrisez ChatGPT & Gemini.", color: "text-primary" },
                    { title: "INFRA RÉSEAU", icon: <Globe />, desc: "Wi-Fi & Réseaux d'entreprise.", color: "text-accent" },
                    { title: "DIGITALISATION", icon: <Rocket />, desc: "Déploiement Web & Logiciels.", color: "text-orange-400" },
                    { title: "UPGRADE PC", icon: <Cpu />, desc: "SSD, RAM & Optimisation.", color: "text-purple-400" }
                ].map((s, i) => (
                    <Card key={i} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 hover:bg-white/10 transition-all text-center group">
                        <div className={cn("w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform", s.color)}>
                            {s.icon}
                        </div>
                        <h4 className="font-black uppercase italic text-sm mb-2">{s.title}</h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{s.desc}</p>
                    </Card>
                ))}
            </div>
            <div className="mt-16 text-center">
                <Link href="/services">
                    <Button variant="link" className="text-accent font-black uppercase italic tracking-widest gap-2">
                        Découvrir tout le catalogue de services <ArrowRight size={16} />
                    </Button>
                </Link>
            </div>
        </div>
      </section>

      {/* Shop Section */}
      <section id="shop" className="container max-w-7xl mx-auto px-6 py-32">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
          <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
            DERNIERS <br /><span className="text-accent">ARRIVAGES</span>
          </h2>
          <div className="w-full max-w-xl">
            <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                type="text" 
                placeholder="Chercher un composant..." 
                className="w-full h-20 pl-16 pr-8 bg-white/5 border border-white/10 rounded-3xl focus:border-accent transition-all text-lg font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="glossy-card rounded-[2.5rem] overflow-hidden group border-none flex flex-col h-full hover:scale-[1.02] transition-transform">
                <div className="aspect-[4/5] relative overflow-hidden bg-black">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="object-cover w-full h-full opacity-90 group-hover:opacity-100"
                  />
                  <Badge className="absolute top-6 left-6 bg-black/60 border-none uppercase text-[9px] font-black px-4 py-1.5">{product.category}</Badge>
                </div>
                <CardContent className="p-8 space-y-6">
                  <h3 className="text-xl font-black uppercase italic line-clamp-1">{product.name}</h3>
                  <div className="flex flex-col border-t border-white/5 pt-6">
                    <span className="text-3xl font-black text-white">${product.sellingPrice.toFixed(2)}</span>
                    <Button className="w-full h-14 rounded-xl bg-white/5 hover:bg-primary hover:text-white mt-6 font-black uppercase italic transition-all" onClick={() => addToCart(product)}>
                      Ajouter au panier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </section>

      {/* Footer Professional */}
      <footer className="bg-card/40 border-t border-white/5 pt-32 pb-24">
        <div className="container max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-20 mb-32">
            <div className="lg:col-span-2 space-y-10">
              <Logo showText={true} size="lg" />
              <p className="text-muted-foreground text-lg font-light leading-relaxed max-w-md">
                L'excellence informatique et le service local au cœur de Bunia. Nous transformons votre matériel en outil de performance.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-8">
                <h4 className="font-black uppercase italic text-xs tracking-widest opacity-60">Services</h4>
                <ul className="space-y-4 text-muted-foreground font-medium text-sm">
                  <li><Link href="/services" className="hover:text-accent">Formations IA</Link></li>
                  <li><Link href="/services" className="hover:text-accent">Réseaux Wi-Fi</Link></li>
                  <li><Link href="/services" className="hover:text-accent">Maintenance Pro</Link></li>
                </ul>
              </div>
              <div className="space-y-8">
                <h4 className="font-black uppercase italic text-xs tracking-widest opacity-60">Boutique</h4>
                <ul className="space-y-4 text-muted-foreground font-medium text-sm">
                  <li><Link href="#shop" className="hover:text-accent">Catalogue Hardware</Link></li>
                  <li><Link href="/dashboard/support" className="hover:text-accent">SAV & Garantie</Link></li>
                  <li><Link href="/login" className="hover:text-accent">Mon Compte</Link></li>
                </ul>
              </div>
            </div>

            <div className="space-y-8">
              <h4 className="font-black uppercase italic text-xs tracking-widest opacity-60">Contact</h4>
              <ul className="space-y-6 text-muted-foreground font-medium text-sm">
                <li className="flex items-start gap-4">
                  <span className="text-accent">📍</span> 
                  <span className="leading-relaxed opacity-80">Immeuble Bahati, Bunia</span>
                </li>
                <li className="flex items-center gap-4">
                  <span className="text-accent">📞</span> 
                  <span className="font-black text-white">+243 823 038 945</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
