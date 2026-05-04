
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
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetFooter 
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';

function CategoriesPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const categoriesQuery = useMemoFirebase(() => collection(db, "categories"), []);
  const { data: categories, isLoading } = useCollection(categoriesQuery);

  const handleOpenSheet = (category: any = null) => {
    setEditingCategory(category);
    setIsSheetOpen(true);
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
      setIsSheetOpen(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Erreur", description: "Impossible d'enregistrer.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Supprimer cette catégorie ?")) {
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
                <p className="text-muted-foreground text-xs uppercase font-black opacity-40">Organisation du Stock Hardware</p>
             </div>
          </div>
          
          <Button onClick={() => handleOpenSheet()} className="bg-primary hover:bg-primary/90 gap-2 font-black uppercase italic rounded-xl h-12 px-6 shadow-xl">
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
                <Card key={cat.id} className="glossy-card border-none hover:border-accent/50 transition-all rounded-[2.5rem] group">
                <CardHeader className="flex flex-row items-center justify-between p-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">{cat.icon || "📦"}</div>
                        <div>
                            <CardTitle className="text-xl font-black italic uppercase tracking-tight">{cat.name}</CardTitle>
                            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.2em] mt-1">Slug: {cat.slug}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10" onClick={() => handleOpenSheet(cat)}>
                        <Edit2 size={16}/>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(cat.id)}>
                        <Trash2 size={16}/>
                    </Button>
                </CardContent>
                </Card>
            )) : (
                <div className="col-span-full py-32 text-center bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                    <p className="text-muted-foreground italic font-light uppercase text-xs tracking-widest">Aucune catégorie définie.</p>
                </div>
            )}
            </div>
        )}
      </main>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
            <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">
                    {editingCategory ? 'Modifier' : 'Créer'} une Catégorie
                </SheetTitle>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Architecture de Boutique</p>
            </SheetHeader>
            <form onSubmit={handleSaveCategory} className="flex-1 p-8 space-y-8 overflow-y-auto">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Nom de la famille</Label>
                        <Input 
                          name="name" 
                          defaultValue={editingCategory?.name}
                          placeholder="Ex: Processeurs" 
                          required 
                          className="h-14 bg-background/50 border-white/5 rounded-2xl focus:border-accent text-lg font-bold" 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Icône représentative (Emoji)</Label>
                        <Input 
                          name="icon" 
                          defaultValue={editingCategory?.icon}
                          placeholder="Ex: 💻" 
                          className="h-14 bg-background/50 border-white/5 rounded-2xl text-2xl text-center focus:border-accent" 
                        />
                        <p className="text-[9px] text-muted-foreground italic mt-2">Utilisez les emojis standard de votre clavier pour illustrer la catégorie.</p>
                    </div>
                </div>
                <div className="pt-8">
                    <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/10">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : editingCategory ? "Appliquer les changements" : "Valider la création"}
                    </Button>
                </div>
            </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default withAuth(CategoriesPage);
