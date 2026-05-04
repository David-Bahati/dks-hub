
"use client";

import { useState, useRef } from 'react';
import withAuth from '@/components/auth/withAuth';
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow, 
} from "@/components/ui/table";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { db } from '@/lib/firebase';
import { collection, doc, serverTimestamp, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { Product } from '@/lib/types';
import { PlusCircle, Edit, Trash2, Eye, EyeOff, Loader2, ArrowLeft, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useMemoFirebase } from '@/firebase';
import Link from 'next/link';
import { generateProductDescription } from '@/ai/flows/generate-product-description';

function ProductsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  
  const nameRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const productsQuery = useMemoFirebase(() => collection(db, "products"), []);
  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const categoriesQuery = useMemoFirebase(() => collection(db, "categories"), []);
  const { data: categories } = useCollection(categoriesQuery);

  const openSheet = (product: Product | null = null) => {
    setEditingProduct(product);
    setIsPublished(product ? product.isPublished : true);
    setAiDescription(product ? product.description : "");
    setImageUrl(product ? product.imageUrl : "");
    setSelectedCategory(product ? product.category : "");
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    setEditingProduct(null);
    setAiDescription("");
    setImageUrl("");
    setSelectedCategory("");
    setIsSheetOpen(false);
  };

  const handleAiGenerateDesc = async () => {
    const productName = nameRef.current?.value;
    if (!productName) {
        toast({ title: "Nom requis", description: "Entrez un nom de produit.", variant: "destructive" });
        return;
    }
    setIsGeneratingDesc(true);
    try {
        const desc = await generateProductDescription({ productName, category: selectedCategory });
        setAiDescription(desc);
    } catch (error) {
        toast({ title: "Erreur IA", variant: "destructive" });
    } finally {
        setIsGeneratingDesc(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const sellingPrice = parseFloat(formData.get('sellingPrice') as string);
    const purchasePrice = parseFloat(formData.get('purchasePrice') as string || "0");
    const stockQuantity = parseInt(formData.get('stockQuantity') as string);

    const productData = {
      name: formData.get('name') as string,
      description: aiDescription,
      category: selectedCategory,
      sellingPrice,
      price: sellingPrice,
      purchasePrice,
      stockQuantity,
      imageUrl: imageUrl || `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/600/400`,
      isPublished: isPublished,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingProduct) {
        const docRef = doc(db, "products", editingProduct.id);
        await setDoc(docRef, productData, { merge: true });
        toast({ title: "Produit mis à jour" });
      } else {
        const colRef = collection(db, "products");
        await addDoc(colRef, {
          ...productData,
          createdAt: serverTimestamp()
        });
        toast({ title: "Produit créé" });
      }
      closeSheet();
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if(window.confirm("Supprimer cet article ?")){
        const docRef = doc(db, "products", id);
        await deleteDoc(docRef);
        toast({ title: "Produit supprimé", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-12 gap-4">
          <div className="flex items-start gap-4">
             <Link href="/dashboard">
                <Button variant="outline" className="h-12 w-12 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0 transition-all">
                    <ArrowLeft size={20} />
                </Button>
             </Link>
             <div>
                <h1 className="text-3xl font-bold font-headline uppercase tracking-tighter italic">Gestion du <span className="text-accent">Stock</span></h1>
                <p className="text-muted-foreground text-xs uppercase font-bold opacity-40">Inventaire Hardware Premium</p>
             </div>
          </div>
          <Button onClick={() => openSheet()} className="bg-primary hover:bg-primary/90 gap-2 font-black uppercase italic rounded-2xl h-12 px-6 shadow-xl">
            <PlusCircle size={20} /> Ajouter un Produit
          </Button>
        </div>

        <div className="glossy-card border-none rounded-[2rem] overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="uppercase font-black text-[10px]">Aperçu</TableHead>
                <TableHead className="uppercase font-black text-[10px]">Produit</TableHead>
                <TableHead className="uppercase font-black text-[10px]">Catégorie</TableHead>
                <TableHead className="text-right uppercase font-black text-[10px]">Prix Vente</TableHead>
                <TableHead className="text-center uppercase font-black text-[10px]">Stock</TableHead>
                <TableHead className="text-center uppercase font-black text-[10px]">Statut</TableHead>
                <TableHead className="text-right uppercase font-black text-[10px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin mx-auto text-accent opacity-50" /></TableCell></TableRow>
              ) : products && products.length > 0 ? products.map((product) => (
                <TableRow key={product.id} className="border-white/5 hover:bg-white/5 group transition-colors">
                  <TableCell>
                    <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden border border-white/5">
                        <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-sm">{product.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-white/5 uppercase text-[9px] font-bold text-white/60">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-accent">${product.sellingPrice?.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={product.stockQuantity < 5 ? "bg-destructive/20 text-destructive border-none font-black" : "bg-white/5 border-none font-black"}>{product.stockQuantity}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {product.isPublished ? <Eye size={16} className="mx-auto text-green-400" /> : <EyeOff size={16} className="mx-auto opacity-30" />}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => openSheet(product)} className="h-8 w-8 hover:bg-accent/20"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="h-8 w-8 text-destructive hover:bg-destructive/20"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={7} className="text-center py-20 opacity-30 italic">Aucun produit dans le catalogue.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-xl flex flex-col p-0">
          <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
            <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">
                {editingProduct ? 'Modifier' : 'Nouveau'} Article Hardware
            </SheetTitle>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Catalogue Elite DKS</p>
          </SheetHeader>

          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Nom du produit</Label>
                        <Input ref={nameRef} name="name" defaultValue={editingProduct?.name} required className="h-12 bg-background/50 border-white/5 rounded-xl focus:border-accent" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Catégorie</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="h-12 bg-background/50 border-white/5 rounded-xl">
                                <SelectValue placeholder="Choisir" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-white/10">
                                {categories?.map((cat: any) => (
                                    <SelectItem key={cat.id} value={cat.name} className="font-bold uppercase text-xs">{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Prix Achat ($)</Label>
                        <Input name="purchasePrice" type="number" step="0.01" defaultValue={editingProduct?.purchasePrice} required className="h-12 bg-background/50 border-white/5 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Prix Vente ($)</Label>
                        <Input name="sellingPrice" type="number" step="0.01" defaultValue={editingProduct?.sellingPrice} required className="h-12 bg-background/50 border-white/5 rounded-xl text-accent font-black" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Quantité Stock</Label>
                        <Input name="stockQuantity" type="number" defaultValue={editingProduct?.stockQuantity} required className="h-12 bg-background/50 border-white/5 rounded-xl" />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center mb-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Description Technique</Label>
                        <Button type="button" size="sm" variant="ghost" onClick={handleAiGenerateDesc} disabled={isGeneratingDesc} className="h-8 bg-accent/10 text-accent hover:bg-accent hover:text-black rounded-lg text-[9px] font-black uppercase italic gap-2">
                            {isGeneratingDesc ? <Loader2 className="animate-spin h-3 w-3" /> : <Sparkles className="h-3 w-3" />} Rédiger par IA
                        </Button>
                    </div>
                    <Textarea 
                        value={aiDescription} 
                        onChange={(e) => setAiDescription(e.target.value)} 
                        className="min-h-[150px] bg-background/50 border-white/5 rounded-2xl focus:border-accent text-sm leading-relaxed" 
                        placeholder="Spécifications, performances, avantages..."
                        required 
                    />
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="font-bold text-sm uppercase italic">Publication publique</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black opacity-40 tracking-widest">Rendre l'article visible en boutique</p>
                    </div>
                    <Switch checked={isPublished} onCheckedChange={setIsPublished} className="data-[state=checked]:bg-accent" />
                </div>
            </div>

            <SheetFooter className="pt-6 border-t border-white/5">
                <Button type="submit" className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/10 text-lg">
                    {editingProduct ? 'Appliquer les modifications' : 'Enregistrer dans le Stock'}
                </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default withAuth(ProductsPage);
