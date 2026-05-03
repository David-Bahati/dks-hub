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
  Layout
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
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden px-4 text-center">
        <div className="container max-w-6xl mx-auto">
          <Badge className="mb-8 bg-white/5 text-accent border-white/10 px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
            <Sparkles className="w-3 h-3 mr-2" />
            L'Élite Technologique de l'Ituri
          </Badge>
          
          <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85] mb-8">
            HUB <span className="premium-gradient-text">CENTRAL</span> <br />
            & BOUTIQUE
          </h1>
          
          <div className="space-y-4 mb-14">
            <p className="text-xl md:text-2xl text-white font-bold uppercase italic tracking-tight opacity-70">
              Hardware Premium, Services Réseaux & Formations IA à Bunia.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
                <Button size="lg" className="h-20 px-12 rounded-2xl bg-primary text-white font-black uppercase italic text-lg shadow-xl" asChild>
                    <Link href="#shop">Voir le Stock</Link>
                </Button>
                <Button size="lg" variant="outline" className="h-20 px-12 rounded-2xl border-white/10 hover:bg-white/5 font-black uppercase italic text-lg" asChild>
                    <Link href="/services">Explorer les Services</Link>
                </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CORE SERVICES QUICK ACCESS */}
      <section className="container max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
                { icon: <Cpu />, title: "Upgrade & Custom PC", link: "/services" },
                { icon: <Globe />, title: "Infrastructure Réseau", link: "/services" },
                { icon: <GraduationCap />, title: "Coaching & Formations", link: "/services" }
            ].map((s, i) => (
                <Link key={i} href={s.link}>
                    <Card className="glossy-card border-none rounded-[2.5rem] p-10 group cursor-pointer">
                        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                            {s.icon}
                        </div>
                        <h3 className="text-2xl font-black uppercase italic">{s.title}</h3>
                        <p className="text-muted-foreground text-sm mt-4">Solutions professionnelles certifiées Double King Shop.</p>
                    </Card>
                </Link>
            ))}
        </div>
      </section>

      {/* RECENT PROJECTS (PORTFOLIO TEASER) */}
      <section className="bg-white/[0.02] py-32 border-y border-white/5">
        <div className="container max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-end mb-16">
                <div>
                    <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">NOTRE <span className="text-accent">SAVOIR-FAIRE</span></h2>
                    <p className="text-muted-foreground mt-4">Projets d'exception réalisés à Bunia.</p>
                </div>
                <Link href="/portfolio">
                    <Button variant="ghost" className="font-black uppercase italic gap-2 text-accent">Tous nos projets <Layout size={16} /></Button>
                </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Card className="overflow-hidden rounded-[3rem] border-none aspect-video relative group">
                    <img src="https://picsum.photos/seed/build1/800/600" className="object-cover w-full h-full group-hover:scale-105 transition-all duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent p-12 flex flex-col justify-end">
                        <Badge className="w-fit mb-4 bg-accent text-black">Infrastructure</Badge>
                        <h3 className="text-3xl font-black uppercase italic">Déploiement Wi-Fi Business</h3>
                    </div>
                </Card>
                <Card className="overflow-hidden rounded-[3rem] border-none aspect-video relative group">
                    <img src="https://picsum.photos/seed/build2/800/600" className="object-cover w-full h-full group-hover:scale-105 transition-all duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent p-12 flex flex-col justify-end">
                        <Badge className="w-fit mb-4 bg-primary text-white">Custom PC</Badge>
                        <h3 className="text-3xl font-black uppercase italic">Setup Gaming 8K Pro</h3>
                    </div>
                </Card>
            </div>
        </div>
      </section>

      <section id="shop" className="container max-w-7xl mx-auto px-6 py-32">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
          <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
            STOCK <span className="text-accent">HARDWARE</span>
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
              <Card key={product.id} className="glossy-card rounded-[2.5rem] overflow-hidden group border-none flex flex-col h-full">
                <div className="aspect-[4/5] relative overflow-hidden bg-black">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="object-cover w-full h-full opacity-90 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <CardContent className="p-8 space-y-6">
                  <h3 className="text-xl font-black uppercase italic line-clamp-1">{product.name}</h3>
                  <div className="flex flex-col border-t border-white/5 pt-6">
                    <span className="text-3xl font-black text-white">${(product.sellingPrice || 0).toFixed(2)}</span>
                    <Button className="w-full h-14 rounded-xl bg-white/5 hover:bg-primary hover:text-white mt-6 font-black uppercase italic transition-all" onClick={() => addToCart(product)}>
                      Ajouter au panier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </section>

      <footer className="bg-card/40 border-t border-white/5 py-24 text-center">
        <div className="container max-w-7xl mx-auto px-6">
          <Logo showText={true} size="md" className="justify-center mb-8" />
          <p className="text-muted-foreground">© 2024 DKS ShopManager. L'Excellence Technologique au Coeur de l'Ituri.</p>
        </div>
      </footer>
    </div>
  );
}
