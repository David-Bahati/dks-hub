
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useState, useRef } from "react";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { Product, Category } from "@/lib/types";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Package,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Upload
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'keyboard', label: 'Claviers' },
  { value: 'mouse', label: 'Souris' },
  { value: 'screen', label: 'Écrans' },
  { value: 'headset', label: 'Casques' },
  { value: 'other', label: 'Autres' },
];

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black font-headline tracking-tighter uppercase italic">
              Gestion du <span className="premium-gradient-text">Stock</span>
            </h1>
            <p className="text-muted-foreground mt-1">Gérez votre inventaire et publiez vos articles premium.</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 h-12 px-8 font-bold gap-3 rounded-2xl neon-glow">
                <Plus size={20} />
                Ajouter un Produit
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-white/10 text-foreground sm:max-w-2xl overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Nouveau Produit Hardware</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Nom de l'article</Label>
                    <Input className="bg-background/50 border-white/10" placeholder="Ex: RTX 5090 Founders Edition" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Catégorie</Label>
                    <Select>
                      <SelectTrigger className="bg-background/50 border-white/10">
                        <SelectValue placeholder="Choisir une catégorie" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10">
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Prix Achat ($)</Label>
                      <Input type="number" className="bg-background/50 border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Prix Vente ($)</Label>
                      <Input type="number" className="bg-background/50 border-white/10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Description du produit</Label>
                    <Textarea className="bg-background/50 border-white/10 min-h-[100px]" placeholder="Détails techniques, performances..." />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Image du Produit</Label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-accent/50 bg-background/50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group relative"
                    >
                      {previewImage ? (
                        <>
                          <img src={previewImage} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Upload className="text-white" />
                          </div>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-10 w-10 text-muted-foreground mb-2 group-hover:text-accent transition-colors" />
                          <span className="text-xs text-muted-foreground group-hover:text-accent">Cliquez pour choisir</span>
                        </>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex flex-col gap-1">
                      <Label className="font-bold text-sm">Publier immédiatement</Label>
                      <span className="text-[10px] text-muted-foreground">Rendre visible par les clients</span>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-3">
                <Button variant="ghost" className="hover:bg-white/5 rounded-xl">Annuler</Button>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/80 font-bold px-8 rounded-xl shadow-lg">Enregistrer l'article</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-md mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Rechercher un produit..." 
            className="h-12 pl-12 bg-card/40 border-white/10 focus:border-accent rounded-2xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="glossy-card rounded-3xl overflow-hidden border-none shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="w-[100px] text-xs font-bold uppercase tracking-wider">Aperçu</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Produit</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Prix & Marge</TableHead>
                <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Quantité</TableHead>
                <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Statut</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="border-white/5 hover:bg-white/5 group transition-colors">
                  <TableCell>
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted/50 border border-white/10">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-base">{product.name}</div>
                    <Badge variant="secondary" className="bg-primary/20 text-accent border-none text-[10px] uppercase h-5 mt-1">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-lg font-black text-white">${product.sellingPrice.toFixed(2)}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">Marge: +${(product.sellingPrice - product.purchasePrice).toFixed(2)}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={cn(
                      "inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold text-sm",
                      product.stockQuantity < 5 ? "bg-destructive/20 text-destructive border border-destructive/20" : "bg-white/5 text-foreground border border-white/10"
                    )}>
                      {product.stockQuantity}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {product.isPublished ? (
                      <Badge className="bg-green-500/10 text-green-400 border-none px-3 py-1 flex items-center gap-1 mx-auto w-fit">
                        <Eye size={12} /> Publié
                      </Badge>
                    ) : (
                      <Badge className="bg-white/5 text-muted-foreground border-none px-3 py-1 flex items-center gap-1 mx-auto w-fit">
                        <EyeOff size={12} /> Brouillon
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-3">
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-accent/20 hover:text-accent">
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-destructive/20 text-destructive">
                        <Trash2 size={16} />
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
