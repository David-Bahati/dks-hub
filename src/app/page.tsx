
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useCart } from '@/context/CartContext';
import { PI_CONVERSION_RATE } from '@/lib/constants';
import { Search, ShoppingCart, Sparkles, Monitor, Keyboard, Mouse, Cpu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

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
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="https://picsum.photos/seed/dks-hero/1920/1080" 
            alt="Hero Background" 
            fill 
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        </div>

        <div className="container relative z-10 text-center px-4">
          <Badge className="mb-6 bg-primary/20 text-accent border-primary/30 px-6 py-2 text-sm animate-pulse">
            VOTRE PARTENAIRE HARDWARE EN ITURI
          </Badge>
          <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter mb-6">
            DOUBLE KING <span className="premium-gradient-text">SHOP</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 font-medium">
            L'excellence informatique accessible. Payez en Pi Network, Mobile Money ou Cash.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="h-16 px-10 rounded-2xl bg-accent text-accent-foreground font-black uppercase italic text-lg neon-glow" asChild>
              <Link href="#shop">Découvrir le Stock</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl border-white/10 font-black uppercase italic text-lg" asChild>
              <Link href="/login">Espace Professionnel</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Shop Section */}
      <section id="shop" className="container mx-auto px-4 py-24">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black uppercase italic mb-2">Catalogue <span className="text-accent">Premium</span></h2>
            <p className="text-muted-foreground">Sélection de matériel informatique de haute performance.</p>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Chercher un composant..." 
              className="w-full h-14 pl-12 pr-6 bg-card/50 border border-white/10 rounded-2xl focus:outline-none focus:border-accent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-80 rounded-[2rem] bg-card/40 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <div key={product.id} className="glossy-card rounded-[2.5rem] overflow-hidden group border-none">
                <div className="aspect-square relative overflow-hidden">
                  <Image 
                    src={product.imageUrl || 'https://picsum.photos/seed/placeholder/400/400'} 
                    alt={product.name} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-black/60 backdrop-blur-md border-none uppercase text-[10px] font-bold">
                      {product.category}
                    </Badge>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                    {product.description || "Équipement informatique professionnel haute performance."}
                  </p>
                  <div className="flex flex-col gap-1 mb-6">
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-black text-white">${product.sellingPrice.toFixed(2)}</span>
                    </div>
                    <div className="text-accent font-bold text-xs uppercase">
                      ≈ {(product.sellingPrice / PI_CONVERSION_RATE).toFixed(4)} π (Pi Network)
                    </div>
                  </div>
                  <Button 
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/80 font-bold gap-2"
                    onClick={() => addToCart(product)}
                  >
                    <ShoppingCart size={18} />
                    Ajouter au panier
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-card/20 py-20">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <span className="text-white font-black italic">DKS</span>
               </div>
               <span className="text-2xl font-black uppercase italic tracking-tighter">Double King <span className="text-accent">Shop</span></span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Le leader de la distribution informatique en Ituri. Qualité, garantie et innovation au service de votre productivité.
            </p>
          </div>
          <div>
            <h4 className="font-bold uppercase italic mb-6">Modes de Paiement</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Sparkles size={16} className="text-accent"/> Pi Network (Mainnet)</p>
              <p className="flex items-center gap-2"><Sparkles size={16} className="text-accent"/> Mobile Money (Airtel/Orange/M-Pesa)</p>
              <p className="flex items-center gap-2"><Sparkles size={16} className="text-accent"/> Espèces (USD/CDF)</p>
            </div>
          </div>
          <div>
            <h4 className="font-bold uppercase italic mb-6">Contact & Support</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>📍 Boulevard de la Libération, Bunia</p>
              <p>📞 +243 823 038 945</p>
              <p>📧 contact@dksshop.com</p>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-20 pt-8 border-t border-white/5 text-center text-xs text-muted-foreground/50">
          © {new Date().getFullYear()} DKS ShopManager. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}
