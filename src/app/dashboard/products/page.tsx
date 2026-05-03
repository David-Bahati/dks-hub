
"use client";

import { useState } from 'react';
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
import { PlusCircle, Edit, Trash2, Eye, EyeOff, Loader2, ArrowLeft, Sparkles, Image as ImageIcon } from 'lucide-react';
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
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingProduct(null);
    setAiDescription("");
    setImageUrl("");
    setIsModalOpen(false);
  };

  const handleAiGenerateDesc = async () => {
    const nameInput = document.getElementById('prod-name') as HTMLInputElement;
    const categoryInput = document.getElementById('prod-category') as any;
    const productName = nameInput?.value;
    const category = categoryInput?.innerText || "";

    if (!productName) {
        toast({ title: "Nom requis", description: "Entrez un nom de produit pour générer la description.", variant: "destructive" });
        return;
    }
    setIsGeneratingDesc(true);
    try {
        const desc = await generateProductDescription({ productName, category });
        setAiDescription(desc);
        toast({ title: "IA: Description prête !" });
    } catch (error) {
        toast({ title: "Erreur IA", description: "Impossible de générer le texte.", variant: "destructive" });
    } finally {
        setIsGeneratingDesc(false);
    }
  };

  const handleAiGenerateImage = async () => {
    const nameInput = document.getElementById('prod-name') as HTMLInputElement;
    const categoryInput = document.getElementById('prod-category') as any;
    const productName = nameInput?.value;
    const category = categoryInput?.innerText || "";

    if (!productName) {
        toast({ title: "Nom requis", description: "Entrez un nom de produit pour générer l'image.", variant: "destructive" });
        return;
    }
    setIsGeneratingImg(true);
    try {
        const url = await generateProductImage({ productName, category });
        setImageUrl(url);
        toast({ title: "IA: Photo générée !", description: "Une image de studio a été créée." });
    } catch (error) {
        toast({ title: "Erreur IA Image", description: "Vérifiez vos quotas d'IA ou réessayez.", variant: "destructive" });
    } finally {
        setIsGeneratingImg(false);
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const sellingPrice = parseFloat(formData.get('sellingPrice') as string);
    const purchasePrice = parseFloat(formData.get('purchasePrice') as string || "0");
    const stockQuantity = parseInt(formData.get('stockQuantity') as string);

    if (isNaN(sellingPrice) || isNaN(purchasePrice) || isNaN(stockQuantity)) {
        toast({ 
            title: "Données invalides", 
            description: "Veuillez vérifier les prix et quantités.", 
            variant: "destructive" 
        });
        return;
    }

    const productData = {
      name: formData.get('name') as string,
      description: aiDescription,
      category: formData.get('category') as string,
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
      setDoc(docRef, productData, { merge: true })
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: productData
          }));
        });
      toast({ title: "Produit mis à jour" });
    } else {
      const colRef = collection(db, "products");
      addDoc(colRef, {
        ...productData,
        createdAt: serverTimestamp()
      }).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: productData
        }));
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
                <p className="text-muted-foreground">Pilotez votre inventaire hardware en temps réel.</p>
             </div>
          </div>
          <Button onClick={() => openModal()} className="bg-primary hover:bg-primary/90 gap-2 neon-glow font-black uppercase italic rounded-2xl h-12 px-6">
            <PlusCircle size={20} /> Ajouter un Produit
          </Button>
        </div>

        <div className="glossy-card border-none rounded-[2rem] overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="uppercase font-black text-[10px] tracking-widest">Aperçu</TableHead>
                <TableHead className="uppercase font-black text-[10px] tracking-widest">Produit</TableHead>
                <TableHead className="uppercase font-black text-[10px] tracking-widest">Catégorie</TableHead>
                <TableHead className="uppercase font-black text-[10px] tracking-widest text-right">Prix Vente</TableHead>
                <TableHead className="uppercase font-black text-[10px] tracking-widest text-center">Stock</TableHead>
                <TableHead className="uppercase font-black text-[10px] tracking-widest text-center">Statut</TableHead>
                <TableHead className="text-right uppercase font-black text-[10px] tracking-widest">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-20"><Loader2 className="animate-spin mx-auto opacity-50" /></TableCell></TableRow>
              ) : products && products.length > 0 ? products.map((product) => (
                <TableRow key={product.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell>
                    <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden border border-white/5 relative">
                        <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold">{product.name}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1 italic max-w-[200px]">{product.description}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-white/5 uppercase text-[10px] font-bold border-none">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-black text-accent">${(product.sellingPrice || product.price || 0).toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={product.stockQuantity < 5 ? "bg-destructive/20 text-destructive border-none" : "bg-white/5 text-white border-none"}>
                        {product.stockQuantity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {product.isPublished ? <Eye size={16} className="mx-auto text-green-400" /> : <EyeOff size={16} className="mx-auto text-muted-foreground opacity-50" />}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openModal(product)} className="h-8 w-8 hover:bg-white/10"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={7} className="text-center py-20 opacity-30 italic">Aucun produit trouvé.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="glossy-card border-none rounded-[2.5rem] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                {editingProduct ? 'Modifier le Produit' : 'Nouveau Produit Hardware'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nom commercial</Label>
                    <Input id="prod-name" name="name" defaultValue={editingProduct?.name} className="h-12 bg-background/50 border-white/10 rounded-xl" required />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Catégorie technique</Label>
                    <Select name="category" defaultValue={editingProduct?.category}>
                        <SelectTrigger id="prod-category" className="h-12 bg-background/50 border-white/10 rounded-xl">
                            <SelectValue placeholder="Choisir une catégorie" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-white/10">
                            {categories?.map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.name} className="uppercase font-bold text-xs">
                                  {cat.icon} {cat.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Prix d'Achat ($)</Label>
                        <Input name="purchasePrice" type="number" step="0.01" defaultValue={editingProduct?.purchasePrice || 0} className="h-12 bg-background/50 border-white/10 rounded-xl" required />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Prix de Vente ($)</Label>
                        <Input name="sellingPrice" type="number" step="0.01" defaultValue={editingProduct?.sellingPrice || editingProduct?.price} className="h-12 bg-background/50 border-white/10 rounded-xl" required />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Stock Initial</Label>
                    <Input name="stockQuantity" type="number" defaultValue={editingProduct?.stockQuantity} className="h-12 bg-background/50 border-white/10 rounded-xl" required />
                </div>

                <div className="space-y-2 relative">
                    <div className="flex justify-between items-end mb-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Description technique</Label>
                        <Button 
                            type="button" 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2 text-[8px] font-black uppercase italic gap-1.5 border border-accent/20 bg-accent/5 text-accent hover:bg-accent hover:text-black transition-all"
                            disabled={isGeneratingDesc}
                            onClick={handleAiGenerateDesc}
                        >
                            {isGeneratingDesc ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                            Générer texte
                        </Button>
                    </div>
                    <Textarea 
                      name="description" 
                      value={aiDescription} 
                      onChange={(e) => setAiDescription(e.target.value)}
                      className="min-h-[120px] bg-background/50 border-white/10 rounded-xl resize-none text-xs leading-relaxed" 
                      required 
                    />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex justify-between items-end mb-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Visuel du produit</Label>
                        <Button 
                            type="button" 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2 text-[8px] font-black uppercase italic gap-1.5 border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all"
                            disabled={isGeneratingImg}
                            onClick={handleAiGenerateImage}
                        >
                            {isGeneratingImg ? <Loader2 size={10} className="animate-spin" /> : <ImageIcon size={10} />}
                            Générer photo IA
                        </Button>
                    </div>
                    
                    <div className="aspect-video rounded-2xl bg-white/5 border-2 border-dashed border-white/10 overflow-hidden relative group">
                        {imageUrl ? (
                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-40">
                                <ImageIcon size={40} className="mb-2" />
                                <span className="text-[10px] font-bold uppercase">Aucun visuel</span>
                            </div>
                        )}
                        {isGeneratingImg && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                                <Loader2 className="animate-spin text-primary h-8 w-8" />
                                <p className="text-[10px] font-black uppercase italic tracking-widest animate-pulse">L'IA crée la photo...</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-3">
                        <Label className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1 block">Lien de l'image (ou base64)</Label>
                        <Input 
                            name="imageUrl" 
                            value={imageUrl} 
                            onChange={(e) => setImageUrl(e.target.value)} 
                            placeholder="URL de l'image" 
                            className="h-10 bg-background/50 border-white/10 rounded-xl text-[10px]" 
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold uppercase italic">Visibilité publique</span>
                        <span className="text-[9px] text-muted-foreground">Publier l'article sur la boutique</span>
                    </div>
                    <Switch 
                      checked={isPublished} 
                      onCheckedChange={setIsPublished} 
                    />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-3 pt-6 border-t border-white/5">
              <Button type="button" variant="ghost" onClick={closeModal} className="rounded-xl font-bold uppercase text-[10px]">Annuler</Button>
              <Button type="submit" className="bg-accent text-accent-foreground font-black uppercase italic rounded-xl px-10 h-12 shadow-xl shadow-accent/10">
                Enregistrer le produit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(ProductsPage);
