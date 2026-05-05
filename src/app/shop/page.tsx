
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useState, useEffect } from "react";
import { getProducts } from "@/lib/data";
import { Product } from "@/lib/types";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Info, Coins, Smartphone, Banknote, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function PublicShop() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les produits.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [toast]);

  const handleOrder = (name: string) => {
    toast({
      title: "Commande Initialisée",
      description: `Veuillez vous rendre à la caisse pour régler votre ${name}.`,
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Mini Hero Shop */}
      <div className="relative h-[250px] w-full flex items-center justify-center overflow-hidden border-b border-white/10">
        <img 
          src="https://picsum.photos/seed/shop/1200/600" 
          alt="Shop Hero" 
          className="absolute inset-0 w-full h-full object-cover opacity-20" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-5xl font-black font-headline mb-2 tracking-tighter uppercase">
            Catalogue <span className="text-accent">Hardware</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Sélectionnez vos composants et passez commande instantanément.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input 
              placeholder="Rechercher (ex: Clavier, Razer...)" 
              className="pl-10 h-12 bg-card/50 border-white/10 focus:border-accent"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground bg-white/5 px-4 py-2 rounded-full border border-white/10 overflow-x-auto max-w-full">
            <span className="whitespace-nowrap">Modes acceptés :</span>
            <div className="flex items-center gap-1 whitespace-nowrap"><Coins size={14} className="text-accent"/> Crypto (Pi, DKST)</div>
            <div className="flex items-center gap-1 whitespace-nowrap"><Smartphone size={14} className="text-accent"/> Mobile Money</div>
            <div className="flex items-center gap-1 whitespace-nowrap"><Banknote size={14} className="text-accent"/> Cash</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Chargement des produits...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
            {filteredProducts.map(product => (
              <Card key={product.id} className="glossy-card border-none flex flex-col group h-full">
                <div className="aspect-[4/3] relative overflow-hidden rounded-t-xl bg-muted">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  {product.stockQuantity < 5 && (
                    <Badge variant="destructive" className="absolute top-4 right-4">Derniers articles</Badge>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                     <Button variant="secondary" size="icon" className="rounded-full border-none"><Info size={20}/></Button>
                     <Button 
                      className="rounded-full bg-accent text-accent-foreground border-none"
                      onClick={() => handleOrder(product.name)}
                    >
                      <ShoppingCart size={20}/>
                    </Button>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge className="bg-primary/20 text-accent border-none mb-2 uppercase text-[10px] font-bold">
                      {product.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground italic">{product.stockQuantity} dispos</span>
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-accent transition-colors truncate">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    Performance brute et design premium pour votre setup de demain.
                  </p>
                </CardContent>
                <CardFooter className="pt-0 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-white">${product.sellingPrice.toFixed(2)}</span>
                    <span className="text-[10px] text-accent font-bold uppercase tracking-tighter">Paiement Crypto Dispo</span>
                  </div>
                  <Button 
                    className="bg-primary hover:bg-primary/90 neon-glow"
                    onClick={() => handleOrder(product.name)}
                  >
                    Commander
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <footer className="bg-card border-t border-white/5 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-muted-foreground mb-4 font-bold">© 2024 dks ShopManager. Expérience Premium & Crypto-Intégrée.</p>
        </div>
      </footer>
    </div>
  );
}
