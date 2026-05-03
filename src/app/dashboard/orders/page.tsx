
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  ArrowLeft, 
  Loader2, 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle,
  Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Simplified query to avoid composite index requirements
  const ordersQuery = useMemoFirebase(() => {
    if (authLoading || !user?.uid) return null;
    
    const role = user.role?.toLowerCase();
    const isStaff = role === 'admin' || role === 'seller' || role === 'cashier';
    const baseRef = collection(db, "orders");
    
    if (isStaff) {
      return query(baseRef);
    }
    
    return query(
      baseRef, 
      where("userId", "==", user.uid)
    );
  }, [user?.uid, user?.role, authLoading]);

  const { data: rawOrders, isLoading: collectionLoading, error } = useCollection(ordersQuery);

  // Client-side sorting for better reliability
  const orders = rawOrders ? [...rawOrders].sort((a, b) => {
    const dateA = a.createdAt?.toDate?.() || new Date(0);
    const dateB = b.createdAt?.toDate?.() || new Date(0);
    return dateB - dateA;
  }) : null;

  const updateOrderStatus = async (orderId: string, newStatus: string, userId: string) => {
    setUpdatingId(orderId);
    try {
        await updateDoc(doc(db, "orders", orderId), {
            status: newStatus,
            updatedAt: serverTimestamp()
        });

        await addDoc(collection(db, "notifications"), {
            userId: userId,
            title: "Statut Commande Mis à Jour",
            message: `Votre commande #${orderId.substring(0, 8)} est passée au statut : ${newStatus.toUpperCase()}.`,
            type: 'info',
            isRead: false,
            createdAt: serverTimestamp(),
            link: '/dashboard/orders'
        });

        toast({
            title: "Statut mis à jour",
            description: `La commande est désormais : ${newStatus}`,
        });
    } catch (err) {
        console.error(err);
        toast({ title: "Erreur", description: "Impossible de modifier le statut.", variant: "destructive" });
    } finally {
        setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'completed':
      case 'payé':
      case 'terminé':
      case 'payée':
        return <Badge className="bg-green-500/10 text-green-400 border-none uppercase text-[10px] font-black px-3 py-1 flex items-center gap-1"><CheckCircle size={12} /> Confirmé</Badge>;
      case 'pending_payment':
      case 'en attente':
        return <Badge className="bg-orange-500/10 text-orange-400 border-none uppercase text-[10px] font-black px-3 py-1 flex items-center gap-1"><Clock size={12} /> Attente Cash</Badge>;
      case 'cancelled':
      case 'annulé':
        return <Badge className="bg-destructive/10 text-destructive border-none uppercase text-[10px] font-black px-3 py-1 flex items-center gap-1"><XCircle size={12} /> Annulé</Badge>;
      default:
        return <Badge className="bg-blue-500/10 text-blue-400 border-none uppercase text-[10px] font-black px-3 py-1 flex items-center gap-1"><Clock size={12} /> En cours</Badge>;
    }
  };

  const isLoading = authLoading || collectionLoading;
  const isStaff = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'seller' || user?.role?.toLowerCase() === 'cashier';

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
        <header className="border-b border-white/5 bg-background/40 backdrop-blur-2xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                <h1 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                    <ShoppingBag className="text-accent"/> {isStaff ? 'Gestion des' : 'Mes'} <span className="text-accent">Commandes</span>
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
            ) : error ? (
                <div className="text-center py-20 bg-destructive/10 rounded-[2rem] border border-destructive/20 max-w-2xl mx-auto">
                     <XCircle className="mx-auto mb-4 text-destructive" size={48} />
                     <h2 className="text-xl font-black uppercase italic">Erreur d'accès</h2>
                     <p className="text-muted-foreground mt-2 text-sm px-8">Vérifiez vos permissions Firestore.</p>
                </div>
            ) : orders && orders.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {orders.map((order: any) => (
                        <Card key={order.id} className="glossy-card border-none rounded-[2rem] overflow-hidden">
                            <div className="p-8">
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

                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Mode: {order.paymentMethod?.replace('_', ' ')}</p>
                                            <p className="text-2xl font-black text-accent">${(order.total || 0).toFixed(2)}</p>
                                        </div>

                                        {isStaff && order.status !== 'payée' && order.status !== 'terminé' && (
                                            <div className="flex gap-2">
                                                <Button 
                                                    size="sm" 
                                                    className="bg-green-500 hover:bg-green-600 text-white rounded-xl h-12 px-4 gap-2 font-black uppercase text-[9px]"
                                                    onClick={() => updateOrderStatus(order.id, 'payée', order.userId)}
                                                    disabled={updatingId === order.id}
                                                >
                                                    {updatingId === order.id ? <Loader2 className="animate-spin h-3 w-3" /> : <Check size={14} />}
                                                    Confirmer Paiement
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center py-20 bg-card/60 rounded-[2.5rem] border border-white/10">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Package size={48} className="text-primary opacity-50" />
                    </div>
                    <h2 className="text-4xl font-black uppercase italic mb-4">Aucune Commande</h2>
                    <p className="text-muted-foreground max-w-md">Le registre est actuellement vide.</p>
                </div>
            )}
        </main>
    </div>
  );
}
