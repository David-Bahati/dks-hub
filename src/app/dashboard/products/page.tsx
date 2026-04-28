
"use client";

import { useState, useEffect } from 'react';
import withAuth from '@/components/auth/withAuth'; // Import the HOC
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
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
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Product } from '@/lib/types';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData: Product[] = [];
      snapshot.forEach(doc => {
        productsData.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(productsData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openModal = (product: Product | null = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const handleSave = async (formData: FormData) => {
    const productData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      sellingPrice: parseFloat(formData.get('sellingPrice') as string),
      stockQuantity: parseInt(formData.get('stockQuantity') as string),
      imageUrl: editingProduct ? editingProduct.imageUrl : '/placeholder.png',
      isPublished: true,
    };

    if (editingProduct) {
      const productRef = doc(db, "products", editingProduct.id);
      await updateDoc(productRef, productData);
    } else {
      await addDoc(collection(db, "products"), productData);
    }
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if(window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")){
        const productRef = doc(db, "products", id);
        await deleteDoc(productRef);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline uppercase tracking-tighter">Gestion des Produits</h1>
            <p className="text-muted-foreground">Catalogue de produits en temps réel depuis Firestore.</p>
          </div>
          <Button onClick={() => openModal()} className="bg-primary hover:bg-primary/90 gap-2 neon-glow font-bold">
            <PlusCircle size={18} /> Ajouter un Produit
          </Button>
        </div>

        <div className="glossy-card border-none rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Prix de Vente</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center">Chargement des produits...</TableCell></TableRow>
              ) : products.length > 0 ? products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium flex items-center gap-4">
                    <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="rounded-lg object-cover" />
                    {product.name}
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>${product.sellingPrice.toFixed(2)}</TableCell>
                  <TableCell>{product.stockQuantity}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openModal(product)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="text-center">Aucun produit trouvé.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="glossy-card border-none">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Modifier le Produit' : 'Ajouter un Nouveau Produit'}</DialogTitle>
            <DialogDescription>
              Les changements seront sauvegardés dans Firestore.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(new FormData(e.currentTarget)); }} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nom</Label>
                <Input id="name" name="name" defaultValue={editingProduct?.name} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="description" className="text-right">Description</Label>
                 <Textarea id="description" name="description" defaultValue={editingProduct?.description} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Catégorie</Label>
                <Input id="category" name="category" defaultValue={editingProduct?.category} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sellingPrice" className="text-right">Prix</Label>
                <Input id="sellingPrice" name="sellingPrice" type="number" step="0.01" defaultValue={editingProduct?.sellingPrice} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stockQuantity" className="text-right">Stock</Label>
                <Input id="stockQuantity" name="stockQuantity" type="number" defaultValue={editingProduct?.stockQuantity} className="col-span-3" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>Annuler</Button>
              <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(ProductsPage);
