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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
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
import { PlusCircle, Edit, Trash2, Eye, EyeOff, Loader2, ArrowLeft, Sparkles, Image as ImageIcon, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import Link from 'next/link';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { generateProductImage } from '@/ai/flows/generate-product-image';

function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  
  const nameRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const productsQuery = useMemoFirebase(() => collection(db, "products"), []);
  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const categoriesQuery = useMemoFirebase(() => collection(db, "categories"), []);
  const { data: categories } = useCollection(categoriesQuery);

  const openModal = (product: Product | null = null) => {
    setEditingProduct(product);
    setIsPublished(product ? product.isPublished : true);
    setAiDescription(product ? product.description : "");
    setImageUrl(product ? product.imageUrl : "");
    setSelectedCategory(product ? product.category : "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingProduct(null);
    setAiDescription("");
    setImageUrl("");
    setSelectedCategory("");
    setIsModalOpen(false);
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

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
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

    if (editingProduct) {
      const docRef = doc(db, "products", editingProduct.id);
      setDoc(docRef, productData, { merge: true });
      toast({ title: "Produit mis à jour" });
    } else {
      const colRef = collection(db, "products");
      addDoc(colRef, {
        ...productData,
        createdAt: serverTimestamp()
      });
      toast({ title: "Produit créé" });
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if(window.confirm("Supprimer cet article ?")){
        const docRef = doc(db, "products", id);
        deleteDoc(docRef);
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
             </div>
          </div>
          <Button onClick={() => openModal()} className="bg-primary hover:bg-primary/90 gap-2 font-black uppercase italic rounded-2xl h-12 px-6">
            <PlusCircle size={20} /> Ajouter un Produit
          </Button>
        </div>

        <div className="glossy-card border-none rounded-[2rem] overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5">
                <TableHead>Aperçu</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Prix Vente</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin mx-auto opacity-50" /></TableCell></TableRow>
              ) : products && products.length > 0 ? products.map((product) => (
                <TableRow key={product.id} className="border-white/5 hover:bg-white/5">
                  <TableCell>
                    <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden border border-white/5">
                        <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold">{product.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-white/5 uppercase text-[10px] font-bold">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-accent">${product.sellingPrice?.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={product.stockQuantity < 5 ? "bg-destructive/20 text-destructive border-none" : "bg-white/5"}>{product.stockQuantity}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {product.isPublished ? <Eye size={16} className="mx-auto text-green-400" /> : <EyeOff size={16} className="mx-auto opacity-50" />}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openModal(product)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={7} className="text-center py-20 opacity-30 italic">Aucun produit.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-card border-white/10 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic">{editingProduct ? 'Modifier' : 'Nouveau'} Produit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase opacity-60">Nom</Label>
                    <Input ref={nameRef} name="name" defaultValue={editingProduct?.name} required />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase opacity-60">Catégorie</Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                        <SelectContent>
                            {categories?.map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
                <Input name="purchasePrice" type="number" placeholder="Achat" defaultValue={editingProduct?.purchasePrice} required />
                <Input name="sellingPrice" type="number" placeholder="Vente" defaultValue={editingProduct?.sellingPrice} required />
                <Input name="stockQuantity" type="number" placeholder="Stock" defaultValue={editingProduct?.stockQuantity} required />
            </div>
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-bold uppercase opacity-60">Description</Label>
                    <Button type="button" size="sm" variant="ghost" onClick={handleAiGenerateDesc} disabled={isGeneratingDesc}>
                        {isGeneratingDesc ? <Loader2 className="animate-spin h-3 w-3" /> : <Sparkles className="h-3 w-3 mr-2" />} IA
                    </Button>
                </div>
                <Textarea value={aiDescription} onChange={(e) => setAiDescription(e.target.value)} className="min-h-[100px]" required />
            </div>
            <DialogFooter>
                <Button type="submit" className="w-full h-12 bg-accent text-black font-black uppercase italic">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(ProductsPage);
