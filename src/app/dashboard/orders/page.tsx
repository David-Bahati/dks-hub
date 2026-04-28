
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, ArrowLeft } from 'lucide-react';

export default function OrdersPage() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
        {/* Header simple */}
        <header className="border-b border-white/5 bg-background/40 backdrop-blur-2xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                <h1 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                    <Package className="text-accent"/> Mes <span className="text-accent">Commandes</span>
                </h1>
                <Link href="/dashboard">
                    <Button variant="outline" className="h-12 border-white/10 hover:bg-accent/10 hover:text-accent rounded-2xl gap-2 font-black uppercase italic text-xs">
                        <ArrowLeft size={16} />
                        Retour
                    </Button>
                </Link>
            </div>
        </header>

        {/* Contenu de la page */}
        <main className="max-w-7xl mx-auto px-4 py-16">
            <div className="flex flex-col items-center justify-center text-center py-20 bg-card/60 rounded-[2.5rem] border border-white/10">
                 <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Package size={48} className="text-primary opacity-50" />
                </div>
                <h2 className="text-4xl font-black uppercase italic mb-4">Bientôt Disponible</h2>
                <p className="text-muted-foreground max-w-md">
                    Cette section est en cours de construction. Vous pourrez bientôt y consulter l'historique complet de vos commandes, suivre vos livraisons et télécharger vos factures.
                </p>
            </div>
        </main>
    </div>
  );
}
