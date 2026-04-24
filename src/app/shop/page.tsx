
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
import { Search, ShoppingCart, Info } from "lucide-react";
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
      <div className="relative h-[300px] w-full flex items-center justify-center overflow-hidden">
        <img 
          src="https://picsum.photos/seed/shop/1200/600" 
          alt="Shop Hero" 
          className="absolute inset-0 w-full h-full object-cover opacity-30" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-black font-headline mb-4 tracking-tighter">
            UPGRADE YOUR <span className="text-accent neon-glow">SETUP</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Premium gaming peripherals and hardware at the most competitive prices in the market.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input 
              placeholder="Search keyboards, mice, screens..." 
              className="pl-10 h-12 bg-card/50 border-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-accent/10 border-white/10">All Products</Badge>
            <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-white/5 border-white/10">Keyboards</Badge>
            <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-white/5 border-white/10">Mice</Badge>
            <Badge variant="outline" className="px-4 py-2 cursor-pointer hover:bg-white/5 border-white/10">Screens</Badge>
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
                  <Badge variant="destructive" className="absolute top-4 right-4">Limited Stock</Badge>
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
                <p className="text-muted-foreground text-sm line-clamp-2">High performance hardware designed for professionals and gaming enthusiasts.</p>
              </CardContent>
              <CardFooter className="pt-0 flex items-center justify-between">
                <span className="text-2xl font-black text-white">${product.sellingPrice.toFixed(2)}</span>
                <Button className="bg-primary hover:bg-primary/90 neon-glow">Add to Cart</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
      
      <footer className="bg-card border-t border-white/5 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-muted-foreground mb-4">© 2024 dks ShopManager. All rights reserved.</p>
          <div className="flex justify-center gap-6">
            <span className="text-xs text-muted-foreground hover:text-accent cursor-pointer">Privacy Policy</span>
            <span className="text-xs text-muted-foreground hover:text-accent cursor-pointer">Terms of Service</span>
            <span className="text-xs text-muted-foreground hover:text-accent cursor-pointer">Contact Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
