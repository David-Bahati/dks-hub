
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useState } from "react";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Info, Coins, Smartphone, Banknote } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function PublicShop() {
  const [search, setSearch] = useState("");

  const filteredProducts = MOCK_PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative h-[400px] w-full flex items-center justify-center overflow-hidden">
        <img 
          src="https://picsum.photos/seed/shop/1200/600" 
          alt="Shop Hero" 
          className="absolute inset-0 w-full h-full object-cover opacity-30" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="relative z-10 text-center px-4">
          <Badge className="mb-6 bg-accent/20 text-accent border-accent/30 px-4 py-1">Paiements Pi Network Acceptés</Badge>
          <h1 className="text-5xl md:text-7xl font-black font-headline mb-4 tracking-tighter">
            UPGRADE YOUR <span className="text-accent neon-glow">SETUP</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Matériel informatique premium et accessoires gaming aux meilleurs prix du marché.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input 
              placeholder="Claviers, souris, écrans..." 
              className="pl-10 h-12 bg-card/50 border-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <span>Accepté :</span>
            <div className="flex items-center gap-1"><Coins size={14} className="text-accent"/> Pi Network</div>
            <div className="flex items-center gap-1"><Smartphone size={14} className="text-accent"/> Mobile Money</div>
            <div className="flex items-center gap-1"><Banknote size={14} className="text-accent"/> Cash</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <Card key={product.id} className="glossy-card border-none flex flex-col group h-full">
              <div className="aspect-[4/3] relative overflow-hidden rounded-t-xl bg-muted">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                {product.stockQuantity < 5 && (
                  <Badge variant="destructive" className="absolute top-4 right-4">Stock Limité</Badge>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                   <Button variant="secondary" size="icon" className="rounded-full"><Info size={20}/></Button>
                   <Button className="rounded-full bg-accent text-accent-foreground"><ShoppingCart size={20}/></Button>
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge className="bg-primary/20 text-accent border-none mb-2 uppercase text-[10px] font-bold">
                    {product.category}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-accent transition-colors">{product.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground text-sm line-clamp-2">Hardware haute performance conçu pour les professionnels et les passionnés.</p>
              </CardContent>
              <CardFooter className="pt-0 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white">${product.sellingPrice.toFixed(2)}</span>
                  <span className="text-[10px] text-muted-foreground">ou équivalent Pi</span>
                </div>
                <Button className="bg-primary hover:bg-primary/90 neon-glow">Acheter</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
      
      <footer className="bg-card border-t border-white/5 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-8 mb-8">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                <Coins className="text-accent" />
              </div>
              <span className="text-xs font-bold">Pi Network</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                <Smartphone className="text-accent" />
              </div>
              <span className="text-xs font-bold">Mobile Money</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                <Banknote className="text-accent" />
              </div>
              <span className="text-xs font-bold">Espèces / Cash</span>
            </div>
          </div>
          <p className="text-muted-foreground mb-4">© 2024 dks ShopManager. Solution de paiement multi-devises intégrée.</p>
        </div>
      </footer>
    </div>
  );
}
