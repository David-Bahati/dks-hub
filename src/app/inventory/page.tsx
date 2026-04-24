
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useState } from "react";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { Product } from "@/lib/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Filter,
  Package,
  ArrowUpDown,
  Eye,
  EyeOff
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline">Inventaire Produits</h1>
            <p className="text-muted-foreground">Gérez votre stock et publiez sur la boutique.</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 gap-2 neon-glow">
                <Plus size={18} />
                Nouveau Produit
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 text-foreground">
              <DialogHeader>
                <DialogTitle>Enregistrer un Produit</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right text-xs">Nom</Label>
                  <Input id="name" className="col-span-3 bg-background" placeholder="Ex: RTX 4090" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="img" className="text-right text-xs">Lien Image</Label>
                  <Input id="img" className="col-span-3 bg-background" placeholder="https://..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cost" className="text-xs">Prix Achat ($)</Label>
                    <Input id="cost" type="number" className="bg-background" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="price" className="text-xs">Prix Vente ($)</Label>
                    <Input id="price" type="number" className="bg-background" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex flex-col gap-1">
                    <Label className="font-bold">Publier immédiatement</Label>
                    <span className="text-[10px] text-muted-foreground">Rendre visible sur la boutique client</span>
                  </div>
                  <Switch id="published" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" className="border-white/10 text-xs">Annuler</Button>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/80 font-bold">Enregistrer & Publier</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Rechercher..." 
              className="pl-10 bg-card/50 border-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="glossy-card rounded-xl overflow-hidden border-none">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10">
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Prix</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="border-white/5 hover:bg-white/5">
                  <TableCell>
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-sm">{product.name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{product.category}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-bold text-accent">${product.sellingPrice.toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground">Achat: ${product.purchasePrice.toFixed(2)}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={product.stockQuantity < 5 ? "destructive" : "secondary"} className="text-[10px]">
                      {product.stockQuantity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {product.isPublished ? (
                      <Badge className="bg-green-500/20 text-green-400 border-none flex items-center gap-1 mx-auto w-fit">
                        <Eye size={12} /> Publié
                      </Badge>
                    ) : (
                      <Badge className="bg-white/5 text-muted-foreground border-none flex items-center gap-1 mx-auto w-fit">
                        <EyeOff size={12} /> Brouillon
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/20">
                        <Edit2 size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/20 text-destructive">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
