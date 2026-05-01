
"use client";

import { useState } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Tags, Edit2, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';

function CategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const categoriesQuery = useMemoFirebase(() => collection(db, "categories"), []);
  const { data: categories, isLoading } = useCollection(categoriesQuery);

  const handleOpenModal = (category: any = null) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const icon = formData.get('icon') as string || "📦";

    const categoryData = {
      name,
      icon,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      updatedAt: serverTimestamp()
    };

    try {
      if (editingCategory) {
        await updateDoc(doc(db, "categories", editingCategory.id), categoryData);
        toast({ title: "Catégorie mise à jour", description: `La catégorie ${name} a été modifiée.` });
      } else {
        await addDoc(collection(db, "categories"), {
          ...categoryData,
          createdAt: serverTimestamp()
        });
        toast({ title: "Catégorie créée", description: `La catégorie ${name} est prête.` });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur", description: "Impossible d'enregistrer la catégorie.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer cette catégorie ? Cela n'affectera pas les produits existants mais ils perdront leur lien visuel.")) {
      try {
        await deleteDoc(doc(db, "categories", id));
        toast({ title: "Catégorie supprimée" });
      } catch (error) {
        toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
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
                <h1 className="text-3xl font-bold font-headline uppercase tracking-tighter italic">Gestion des <span className="text-accent">Catégories</span></h1>
                <p className="text-muted-foreground">Organisez vos produits informatiques par familles.</p>
             </div>
          </div>
          
          <Button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary/90 gap-2 neon-glow font-black uppercase italic rounded-xl h-12 px-6">
              <Plus size={18} /> Nouvelle Catégorie
          </Button>
        </div>

        {isLoading ? (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin h-10 w-10 text-primary" />
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories && categories.length > 0 ? categories.map((cat: any) => (
                <Card key={cat.id} className="glossy-card border-none hover:border-accent/50 transition-all rounded-[2rem]">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon || "📦"}</span>
                    <CardTitle className="text-xl font-bold italic uppercase">{cat.name}</CardTitle>
                    </div>
                    <Tags className="text-accent h-5 w-5 opacity-50" />
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground italic uppercase text-[10px] font-bold">Slug: {cat.slug}</p>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => handleOpenModal(cat)}>
                            <Edit2 size={14}/>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(cat.id)}>
                            <Trash2 size={14}/>
                        </Button>
                    </div>
                    </div>
                </CardContent>
                </Card>
            )) : (
                <div className="col-span-full py-20 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                    <p className="text-muted-foreground italic">Aucune catégorie trouvée. Créez-en une pour commencer.</p>
                </div>
            )}
            </div>
        )}
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="glossy-card border-none rounded-[2rem]">
            <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase italic">
                    {editingCategory ? 'Modifier la Catégorie' : 'Créer une Catégorie'}
                </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveCategory} className="space-y-6 py-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nom de la catégorie</Label>
                    <Input 
                      name="name" 
                      defaultValue={editingCategory?.name}
                      placeholder="Ex: Processeurs" 
                      required 
                      className="h-12 bg-background/50 border-white/10 rounded-xl" 
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Emoji / Icône</Label>
                    <Input 
                      name="icon" 
                      defaultValue={editingCategory?.icon}
                      placeholder="Ex: 💻" 
                      className="h-12 bg-background/50 border-white/10 rounded-xl" 
                    />
                </div>
                <DialogFooter className="gap-2">
                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="font-bold uppercase text-[10px]">Annuler</Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-accent text-accent-foreground font-black uppercase italic rounded-xl px-8 h-12">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : editingCategory ? "Mettre à jour" : "Créer"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(CategoriesPage);
