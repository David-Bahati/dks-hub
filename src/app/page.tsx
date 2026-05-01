
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
  TrendingUp,
  Cpu
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function LandingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchPublishedProducts() {
      try {
        const q = query(collection(db, "products"), where("isPublished", "==", true));
        const snapshot = await getDocs(q);
        const productsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsList);
      } catch (error) {
        console.error("Erreur lors du chargement des produits:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPublishedProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
        {/* Abstract Background elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>

        <div className="container px-4 text-center">
          <Badge className="mb-6 bg-white/5 text-accent border-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
            <Sparkles className="w-3 h-3 mr-2" />
            L'Élite du Hardware en Ituri
          </Badge>
          
          <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.9] mb-8">
            VOTRE SETUP <br />
            <span className="premium-gradient-text">SANS LIMITES</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            Distributeur officiel de matériel informatique haute performance à Bunia. 
            <span className="text-foreground font-bold"> Payez en Pi, Mobile Money ou Cash.</span>
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Button size="lg" className="h-16 px-10 rounded-2xl bg-primary text-white font-black uppercase italic text-lg shadow-[0_0_30px_-5px_hsl(var(--primary))] hover:shadow-[0_0_40px_-5px_hsl(var(--primary))] transition-all group" asChild>
              <Link href="#shop">
                Explorer le Stock
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl border-white/10 bg-white/5 backdrop-blur-md font-black uppercase italic text-lg hover:bg-white/10" asChild>
              <Link href="/login">Espace Client Pro</Link>
            </Button>
          </div>

          {/* Payment Trust Bar */}
          <div className="mt-20 flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             <div className="flex items-center gap-2">
                <span className="text-2xl font-black italic">π</span>
                <span className="text-sm font-bold uppercase tracking-tighter">Pi Network</span>
             </div>
             <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                <span className="text-sm font-bold uppercase tracking-tighter">Mobile Money</span>
             </div>
             <div className="flex items-center gap-2">
                <Cpu className="w-6 h-6" />
                <span className="text-sm font-bold uppercase tracking-tighter">Hardware Pro</span>
             </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3 uppercase italic">Garantie Qualité</h3>
            <p className="text-muted-foreground text-sm">Tous nos composants sont testés et certifiés originaux pour une performance optimale.</p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Truck className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-3 uppercase italic">Livraison Rapide</h3>
            <p className="text-muted-foreground text-sm">Service de livraison express à travers toute la ville de Bunia et ses environs.</p>
          </div>
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Headset className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-3 uppercase italic">Support Expert</h3>
            <p className="text-muted-foreground text-sm">Une équipe de techniciens passionnés pour vous conseiller sur votre prochain setup.</p>
          </div>
        </div>
      </section>

      {/* Shop Section */}
      <section id="shop" className="container mx-auto px-4 py-32">
        <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4">
              Derniers <span className="text-accent">Arrivages</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Équipez-vous avec le meilleur de la technologie mondiale, disponible localement.
            </p>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Rechercher un composant..." 
              className="w-full h-16 pl-12 pr-6 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-accent transition-all text-lg font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-[450px] rounded-[2.5rem] bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.length > 0 ? filteredProducts.map((product) => (
              <Card key={product.id} className="glossy-card rounded-[2.5rem] overflow-hidden group border-none flex flex-col h-full">
                <div className="aspect-[4/5] relative overflow-hidden">
                  <Image 
                    src={product.imageUrl || 'https://picsum.photos/seed/placeholder/600/800'} 
                    alt={product.name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-60" />
                  <div className="absolute top-6 left-6">
                    <Badge className="bg-black/60 backdrop-blur-md border-none uppercase text-[10px] font-black px-3 py-1">
                      {product.category}
                    </Badge>
                  </div>
                  {product.stockQuantity < 3 && (
                    <div className="absolute top-6 right-6">
                      <Badge variant="destructive" className="uppercase text-[10px] font-black px-3 py-1">
                        Stock Limité
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-8 flex flex-col flex-1">
                  <h3 className="text-2xl font-black uppercase italic mb-3 line-clamp-1 group-hover:text-accent transition-colors">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-8 flex-1">
                    {product.description || "Matériel informatique de pointe pour professionnels et gamers exigeants."}
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-3xl font-black text-white">${product.sellingPrice.toFixed(2)}</span>
                        <span className="text-accent font-black text-[10px] uppercase tracking-wider">
                           ≈ {(product.sellingPrice / PI_CONVERSION_RATE).toFixed(4)} π (Pi Network)
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full h-14 rounded-2xl bg-white/5 hover:bg-primary hover:text-white border border-white/10 hover:border-primary font-black uppercase italic transition-all gap-3"
                      onClick={() => addToCart(product)}
                    >
                      <ShoppingCart size={20} />
                      Ajouter au panier
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full py-20 text-center">
                 <p className="text-xl text-muted-foreground italic">Aucun produit ne correspond à votre recherche.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-card/20 py-24">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
                  <span className="text-white font-black italic text-xl">DKS</span>
               </div>
               <span className="text-3xl font-black uppercase italic tracking-tighter">Double King <span className="text-accent">Shop</span></span>
            </div>
            <p className="text-muted-foreground text-lg max-w-md leading-relaxed mb-8">
              L'excellence informatique au cœur de l'Ituri. Nous fournissons le matériel qui propulse votre vision.
            </p>
            <div className="flex gap-4">
              {/* Social icons placeholders */}
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary transition-colors cursor-pointer border border-white/5">
                <span className="font-bold">f</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary transition-colors cursor-pointer border border-white/5">
                <span className="font-bold">in</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary transition-colors cursor-pointer border border-white/5">
                <span className="font-bold">x</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-black uppercase italic mb-8 tracking-wider">Navigation</h4>
            <ul className="space-y-4 text-muted-foreground font-medium">
              <li><Link href="#shop" className="hover:text-accent transition-colors">Catalogue</Link></li>
              <li><Link href="/login" className="hover:text-accent transition-colors">Espace Pro</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors">À Propos</Link></li>
              <li><Link href="#" className="hover:text-accent transition-colors">Support</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-black uppercase italic mb-8 tracking-wider">Contact</h4>
            <ul className="space-y-4 text-muted-foreground font-medium">
              <li className="flex items-start gap-3">
                <span className="text-accent">📍</span> 
                <span>Boulevard de la Libération, <br />Immeuble Bahati, Bunia</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-accent">📞</span> 
                <span>+243 823 038 945</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-accent">📧</span> 
                <span>contact@dksshop.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="container mx-auto px-4 mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/40">
          <span>© {new Date().getFullYear()} DKS ShopManager. Excellence & Innovation.</span>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-white transition-colors">Mentions Légales</Link>
            <Link href="#" className="hover:text-white transition-colors">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
