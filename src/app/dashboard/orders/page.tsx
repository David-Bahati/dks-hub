
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, ArrowLeft, Loader2, ShoppingBag, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrdersPage() {
  const { user } = useAuth();

  const ordersQuery = useMemoFirebase(() => {
    if (!user) return null;
    // Si l'utilisateur est admin ou vendeur, il voit tout. Sinon, seulement ses commandes.
    const isStaff = user.role === 'Admin' || user.role === 'Seller';
    const baseRef = collection(db, "orders");
    
    if (isStaff) {
      return query(baseRef, orderBy("createdAt", "desc"));
    }
    return query(baseRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"));
  }, [user]);

  const { data: orders, isLoading } = useCollection(ordersQuery);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'Payé':
        return <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[10px] font-black px-3 py-1 flex items-center gap-1"><CheckCircle size={12} /> Confirmé</Badge>;
      case 'pending_payment':
        return <Badge className="bg-orange-500/10 text-orange-400 border-none uppercase text-[10px] font-black px-3 py-1 flex items-center gap-1"><Clock size={12} /> Attente Cash</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-400 border-none uppercase text-[10px] font-black px-3 py-1 flex items-center gap-1"><XCircle size={12} /> Annulé</Badge>;
      default:
        return <Badge className="bg-blue-500/10 text-blue-400 border-none uppercase text-[10px] font-black px-3 py-1 flex items-center gap-1"><Clock size={12} /> En cours</Badge>;
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
        <header className="border-b border-white/5 bg-background/40 backdrop-blur-2xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                <h1 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                    <ShoppingBag className="text-accent"/> Gestion des <span className="text-accent">Commandes</span>
                </h1>
                <Link href="/dashboard">
                    <Button variant="outline" className="h-12 border-white/10 hover:bg-accent/10 hover:text-accent rounded-2xl gap-2 font-black uppercase italic text-xs">
                        <ArrowLeft size={16} />
                        Retour
                    </Button>
                </Link>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-16">
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin h-12 w-12 text-accent" />
                </div>
            ) : orders && orders.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {orders.map((order: any) => (
                        <Card key={order.id} className="glossy-card border-none rounded-[2rem] overflow-hidden">
                            <CardContent className="p-8">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black uppercase text-muted-foreground">Commande #{order.id.substring(0, 8)}</span>
                                            {getStatusBadge(order.status)}
                                        </div>
                                        <h3 className="text-xl font-black uppercase italic">{order.customerName || 'Client DKS'}</h3>
                                        <p className="text-xs text-muted-foreground">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : 'Date inconnue'}</p>
                                    </div>
                                    
                                    <div className="flex-1 max-w-md">
                                        <div className="flex flex-wrap gap-2">
                                            {order.items?.map((item: any, idx: number) => (
                                                <Badge key={idx} variant="secondary" className="bg-white/5 border-none text-[10px] font-bold">
                                                    {item.quantity}x {item.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Mode: {order.paymentMethod?.replace('_', ' ')}</p>
                                        <p className="text-2xl font-black text-accent">${(order.total || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center py-20 bg-card/60 rounded-[2.5rem] border border-white/10">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Package size={48} className="text-primary opacity-50" />
                    </div>
                    <h2 className="text-4xl font-black uppercase italic mb-4">Aucune Commande</h2>
                    <p className="text-muted-foreground max-w-md">
                        Le registre est actuellement vide. Les commandes de vos clients apparaîtront ici dès qu'elles seront validées.
                    </p>
                </div>
            )}
        </main>
    </div>
  );
}
