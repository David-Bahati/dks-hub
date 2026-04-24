
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Tags, Edit2, Trash2 } from "lucide-react";

const CATEGORIES = [
  { name: "Claviers", count: 24, icon: "⌨️" },
  { name: "Souris", count: 18, icon: "🖱️" },
  { name: "Écrans", count: 12, icon: "🖥️" },
  { name: "Casques", count: 9, icon: "🎧" },
  { name: "Composants", count: 35, icon: "🔌" },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline uppercase tracking-tighter">Catégories</h1>
            <p className="text-muted-foreground">Organisez vos produits par types.</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 gap-2 neon-glow">
            <Plus size={18} /> Nouvelle Catégorie
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => (
            <Card key={cat.name} className="glossy-card border-none hover:border-accent/50 transition-all">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <CardTitle className="text-xl font-bold">{cat.name}</CardTitle>
                </div>
                <Tags className="text-accent h-5 w-5 opacity-50" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">{cat.count} produits</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit2 size={14}/></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 size={14}/></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
