
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2, ArrowLeft, Loader2, Info, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import Link from 'next/link';
import { useCollection, useMemoFirebase } from '@/firebase';
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function NotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const notificationsQuery = useMemoFirebase(() => {
    if (!user?.uid) return null;
    
    // Check role to fetch appropriate notifications
    const role = user.role?.toLowerCase();
    const isStaff = role === 'admin' || role === 'seller' || role === 'cashier';
    
    if (isStaff) {
        return query(
            collection(db, "notifications"),
            where("userId", "in", [user.uid, 'staff']),
            orderBy("createdAt", "desc")
        );
    }
    
    return query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
  }, [user?.uid, user?.role]);

  const { data: notifications, isLoading } = useCollection(notificationsQuery);

  const markAllAsRead = async () => {
    if (!notifications) return;
    const unread = notifications.filter(n => !n.isRead);
    try {
      await Promise.all(unread.map(n => updateDoc(doc(db, "notifications", n.id), { isRead: true })));
      toast({ title: "Notifications lues", description: "Toutes vos notifications sont marquées comme lues." });
    } catch (error) {
      console.error(error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
      toast({ title: "Notification supprimée" });
    } catch (error) {
      console.error(error);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-green-400" size={18} />;
      case 'warning': return <AlertTriangle className="text-orange-400" size={18} />;
      case 'error': return <AlertCircle className="text-destructive" size={18} />;
      default: return <Info className="text-accent" size={18} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
          <div className="flex items-start gap-4">
             <Link href="/dashboard">
                <Button variant="outline" className="h-12 w-12 rounded-2xl border-white/10 hover:bg-accent/10 hover:text-accent p-0 transition-all">
                    <ArrowLeft size={20} />
                </Button>
             </Link>
             <div>
                <h1 className="text-3xl font-bold font-headline uppercase tracking-tighter italic">Centre d'<span className="text-accent">Alertes</span></h1>
                <p className="text-muted-foreground">Suivez l'activité de votre compte en temps réel.</p>
             </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={markAllAsRead}
            className="border-white/10 rounded-xl font-bold uppercase italic text-[10px] gap-2 h-11"
          >
            <Check size={14} /> Tout marquer comme lu
          </Button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin h-10 w-10 text-accent" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            notifications.map((notif) => (
              <Card 
                key={notif.id} 
                className={cn(
                  "glossy-card border-none rounded-2xl overflow-hidden transition-all",
                  !notif.isRead ? "bg-white/5 border-l-4 border-l-accent" : "opacity-60"
                )}
              >
                <CardContent className="p-6 flex items-start gap-5">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                    !notif.isRead ? "bg-accent/10" : "bg-white/5"
                  )}>
                    {getNotifIcon(notif.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                        <h3 className={cn("font-black uppercase italic text-sm", !notif.isRead ? "text-white" : "text-muted-foreground")}>
                            {notif.title}
                        </h3>
                        <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">
                            {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleString() : 'Récemment'}
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">{notif.message}</p>
                    {notif.link && (
                        <Link href={notif.link} className="inline-block text-[10px] font-black uppercase italic text-accent hover:underline mt-2">
                            Voir le détail <ArrowRight size={10} className="inline ml-1" />
                        </Link>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteNotification(notif.id)}
                    className="h-8 w-8 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={14} />
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="py-32 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 space-y-4">
                <Bell size={64} className="mx-auto text-muted-foreground opacity-20" />
                <p className="text-muted-foreground italic font-light uppercase text-xs tracking-widest">Votre historique est vide</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default withAuth(NotificationsPage);
