
"use client";

import { useState, useMemo, useRef } from 'react';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { db } from '@/lib/firebase';
import { collection, doc, serverTimestamp, setDoc, addDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { Product } from '@/lib/types';
import { PlusCircle, Edit, Trash2, Eye, EyeOff, Loader2, ArrowLeft, Sparkles, Image as ImageIcon, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useMemoFirebase } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from 'next/link';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";

const productSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  category: z.string().min(1, "Veuillez choisir une catégorie"),
  purchasePrice: z.coerce.number().min(0, "Le prix d'achat ne peut pas être négatif"),
  sellingPrice: z.coerce.number().min(0, "Le prix de vente ne peut pas être négatif"),
  stockQuantity: z.coerce.number().int().min(0, "Le stock doit être un nombre entier"),
  description: z.string().min(10, "La description doit être plus détaillée"),
  isPublished: z.boolean().default(true),
  imageUrl: z.string().optional(),
}).refine((data) => data.sellingPrice >= data.purchasePrice, {
  message: "Le prix de vente doit être supérieur ou égal au prix d'achat",
  path: ["sellingPrice"],
});

function ProductsPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const productsQuery = useMemoFirebase(() => collection(db, "products"), []);
  const { data: products, isLoading } = useCollection<Product>(productsQuery);

  const categoriesQuery = useMemoFirebase(() => collection(db, "categories"), []);
  const { data: categories } = useCollection(categoriesQuery);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "",
      purchasePrice: 0,
      sellingPrice: 0,
      stockQuantity: 0,
      description: "",
      isPublished: true,
      imageUrl: "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        // Limite à 800Ko pour éviter de saturer le document Firestore (limite 1Mo)
        if (file.size > 800 * 1024) {
            toast({ title: "Fichier trop lourd", description: "L'image ne doit pas dépasser 800Ko pour la base de données.", variant: "destructive" });
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            form.setValue("imageUrl", reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const openSheet = (product: Product | null = null) => {
    setEditingProduct(product);
    if (product) {
      form.reset({
        name: product.name,
        category: product.category,
        purchasePrice: product.purchasePrice || 0,
        sellingPrice: product.sellingPrice,
        stockQuantity: product.stockQuantity,
        description: product.description,
        isPublished: product.isPublished,
        imageUrl: product.imageUrl,
      });
    } else {
      form.reset({
        name: "",
        category: "",
        purchasePrice: 0,
        sellingPrice: 0,
        stockQuantity: 0,
        description: "",
        isPublished: true,
        imageUrl: "",
      });
    }
    setIsSheetOpen(true);
  };

  const handleAiGenerateDesc = async () => {
    const productName = form.getValues("name");
    const category = form.getValues("category");
    if (!productName) {
        toast({ title: "Nom requis", description: "Entrez un nom de produit pour l'IA.", variant: "destructive" });
        return;
    }
    setIsGeneratingDesc(true);
    try {
        const desc = await generateProductDescription({ productName, category });
        form.setValue("description", desc);
    } catch (error) {
        toast({ title: "Erreur IA", variant: "destructive" });
    } finally {
        setIsGeneratingDesc(false);
    }
  };

  async function onSubmit(values: z.infer<typeof productSchema>) {
    const productData = {
      ...values,
      price: values.sellingPrice, // Compatibilité panier
      imageUrl: values.imageUrl || `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/600/400`,
      updatedAt: serverTimestamp()
    };

    if (editingProduct) {
      const docRef = doc(db, "products", editingProduct.id);
      setDoc(docRef, productData, { merge: true })
        .then(() => {
          toast({ title: "Produit mis à jour", description: "Les changements ont été enregistrés." });
          setIsSheetOpen(false);
        })
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: productData
          }));
        });
    } else {
      const colRef = collection(db, "products");
      const fullData = {
        ...productData,
        createdAt: serverTimestamp()
      };
      addDoc(colRef, fullData)
        .then(() => {
          toast({ title: "Produit créé", description: "L'article est ajouté au stock." });
          setIsSheetOpen(false);
        })
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: colRef.path,
            operation: 'create',
            requestResourceData: fullData
          }));
        });
    }
  }

  const handleDelete = (id: string) => {
    if(window.confirm("Supprimer définitivement cet article ?")){
        const docRef = doc(db, "products", id);
        deleteDoc(docRef)
            .then(() => {
                toast({ title: "Produit supprimé", variant: "destructive" });
            })
            .catch(async (error) => {
                errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: docRef.path,
                    operation: 'delete'
                }));
            });
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
          <Button onClick={() => openSheet()} className="bg-primary hover:bg-primary/90 gap-2 font-black uppercase italic rounded-xl h-12 px-6 shadow-xl">
            <PlusCircle size={20} /> Ajouter un Produit
          </Button>
        </div>

        <div className="glossy-card border-none rounded-[2.5rem] overflow-hidden shadow-2xl">
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
                        <button onClick={() => openSheet(product)} className="p-2 hover:text-accent transition-colors"><Edit size={16}/></button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 hover:text-destructive transition-colors"><Trash2 size={16}/></button>
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

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="space-y-6">
                  {/* CHAMP D'IMPORTATION PHOTO */}
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Photo du Produit</FormLabel>
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-video rounded-3xl border-2 border-dashed border-white/5 hover:border-accent/40 bg-background/50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group relative"
                        >
                          {field.value ? (
                            <>
                              <img src={field.value} className="w-full h-full object-cover" alt="Preview" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Upload className="text-white" />
                              </div>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="h-10 w-10 text-muted-foreground mb-2 group-hover:text-accent transition-colors" />
                              <span className="text-[10px] text-muted-foreground group-hover:text-accent font-black uppercase tracking-widest">Cliquer pour importer</span>
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
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Nom du produit</FormLabel>
                            <FormControl>
                              <Input {...field} className="h-12 bg-background/50 border-white/5 rounded-xl focus:border-accent font-bold" />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Catégorie</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 bg-background/50 border-white/5 rounded-xl">
                                      <SelectValue placeholder="Choisir" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-card border-white/10">
                                    {categories?.map((cat: any) => (
                                        <SelectItem key={cat.id} value={cat.name} className="font-bold uppercase text-xs">{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="purchasePrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Prix Achat ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} className="h-12 bg-background/50 border-white/5 rounded-xl" />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sellingPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Prix Vente ($)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} className="h-12 bg-background/50 border-white/5 rounded-xl text-accent font-black" />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="stockQuantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Quantité Stock</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} className="h-12 bg-background/50 border-white/5 rounded-xl" />
                            </FormControl>
                            <FormMessage className="text-[10px]" />
                          </FormItem>
                        )}
                      />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center mb-2">
                          <FormLabel className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Description Technique</FormLabel>
                          <Button type="button" size="sm" variant="ghost" onClick={handleAiGenerateDesc} disabled={isGeneratingDesc} className="h-8 bg-accent/10 text-accent hover:bg-accent hover:text-black rounded-lg text-[9px] font-black uppercase italic gap-2">
                              {isGeneratingDesc ? <Loader2 className="animate-spin h-3 w-3" /> : <Sparkles className="h-3 w-3" />} Rédiger par IA
                          </Button>
                        </div>
                        <FormControl>
                          <Textarea {...field} className="min-h-[150px] bg-background/50 border-white/5 rounded-2xl focus:border-accent text-sm italic" />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between space-y-0">
                        <div className="space-y-1">
                            <FormLabel className="font-bold text-sm uppercase italic">Publication publique</FormLabel>
                            <p className="text-[10px] text-muted-foreground uppercase font-black opacity-40 tracking-widest">Visible en boutique</p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-accent" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
              </div>

              <SheetFooter className="pt-6 border-t border-white/5">
                  <Button type="submit" disabled={form.formState.isSubmitting} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/10 text-lg">
                      {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : editingProduct ? 'Appliquer les modifications' : 'Enregistrer dans le Stock'}
                  </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default withAuth(ProductsPage);
