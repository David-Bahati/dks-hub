
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Tags, Edit2, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';

function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "categories"), (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(cats);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

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
          <Button className="bg-primary hover:bg-primary/90 gap-2 neon-glow font-black uppercase italic rounded-xl h-12 px-6">
            <Plus size={18} /> Nouvelle Catégorie
          </Button>
        </div>

        {loading ? (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin h-10 w-10 text-primary" />
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.length > 0 ? categories.map((cat) => (
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
                    <p className="text-sm text-muted-foreground italic uppercase text-[10px] font-bold">ID: #{cat.id.substring(0, 6)}</p>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10"><Edit2 size={14}/></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 size={14}/></Button>
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
    </div>
  );
}

export default withAuth(CategoriesPage);
