
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import withAuth from "@/components/auth/withAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Edit, Trash2, ArrowLeft, Shield, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '@/lib/types';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

const getRoleBadge = (role: string) => {
  const r = role?.toLowerCase();
  switch (r) {
    case 'admin': return "bg-red-500/10 text-red-400 border-none px-2";
    case 'seller': return "bg-blue-500/10 text-blue-400 border-none px-2";
    case 'cashier': return "bg-green-500/10 text-green-400 border-none px-2";
    default: return "bg-gray-500/10 text-gray-400 border-none px-2";
  }
};

function UsersPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [role, setRole] = useState("Seller");

  useEffect(() => {
    if (currentUser && currentUser.role?.toLowerCase() !== 'admin') {
      router.replace('/dashboard');
      return;
    }

    const q = collection(db, "users");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.role?.toLowerCase() !== 'customer') {
          usersData.push({ id: doc.id, ...data });
        }
      });
      setUsers(usersData);
      setIsLoading(false);
    }, (error: any) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'users', operation: 'list' }));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser, router]);

  const openSheet = (user: any | null = null) => {
    setEditingUser(user);
    setRole(user ? user.role : "Seller");
    setIsSheetOpen(true);
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const userData = {
      displayName: formData.get('displayName') as string,
      name: formData.get('displayName') as string,
      email: formData.get('email') as string,
      role: role,
      updatedAt: serverTimestamp()
    };

    if (editingUser) {
      const userRef = doc(db, "users", editingUser.id);
      updateDoc(userRef, userData)
        .then(() => { toast({ title: "Membre mis à jour" }); setIsSheetOpen(false); })
        .catch(async (error) => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: userData })); })
        .finally(() => setIsSubmitting(false));
    } else {
      const colRef = collection(db, "users");
      addDoc(colRef, { ...userData, createdAt: serverTimestamp() })
        .then(() => { toast({ title: "Nouveau membre ajouté" }); setIsSheetOpen(false); })
        .catch(async (error) => { errorEmitter.emit('permission-error', new FirestorePermissionError({ path: colRef.path, operation: 'create', requestResourceData: userData })); })
        .finally(() => setIsSubmitting(false));
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
                <h1 className="text-3xl font-bold font-headline uppercase tracking-tighter italic">Équipe & <span className="text-accent">Staff</span></h1>
                <p className="text-muted-foreground text-xs uppercase font-black opacity-40">Gestion des privilèges administratifs</p>
             </div>
          </div>
          <Button onClick={() => openSheet()} className="bg-primary hover:bg-primary/90 gap-2 font-black uppercase italic h-12 px-6 rounded-2xl shadow-xl">
            <UserPlus size={18} /> Ajouter un Membre
          </Button>
        </div>

        <Card className="glossy-card border-none rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="text-lg font-black uppercase italic flex items-center gap-3">
                <Shield className="text-accent" size={22} /> Liste du Personnel
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-white/5">
              {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-accent" /></div>
              ) : users.length > 0 ? (
                users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-accent">{user.name?.substring(0, 1)}</div>
                        <div>
                            <p className="font-bold text-sm">{user.displayName || user.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <Badge className={cn("uppercase text-[9px] font-black h-5", getRoleBadge(user.role))}>{user.role}</Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => openSheet(user)} className="h-8 w-8 hover:bg-white/10"><Edit size={16}/></Button>
                            <Button variant="ghost" size="icon" onClick={() => { if(window.confirm("Supprimer ?")) deleteDoc(doc(db, "users", user.id)); }} className="h-8 w-8 text-destructive hover:bg-destructive/10"><Trash2 size={16}/></Button>
                        </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-20 italic uppercase font-black text-[10px] tracking-widest">Aucun personnel enregistré.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="p-8 bg-primary/10 border-b border-white/5">
            <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">
                {editingUser ? 'Modifier' : 'Ajouter'} un Membre Staff
            </SheetTitle>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Architecture de Contrôle Hub</p>
          </SheetHeader>
          <form onSubmit={handleSave} className="flex-1 p-8 space-y-8 overflow-y-auto">
            <div className="space-y-6">
               <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Nom complet</Label>
                <Input name="displayName" defaultValue={editingUser?.displayName || editingUser?.name} required className="h-14 bg-background/50 border-white/5 rounded-2xl font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Email Professionnel</Label>
                <Input name="email" type="email" defaultValue={editingUser?.email} required className="h-14 bg-background/50 border-white/5 rounded-2xl" />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Rôle & Permissions</Label>
                 <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-14 bg-background/50 border-white/5 rounded-2xl">
                        <SelectValue placeholder="Choisir un rôle" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                        <SelectItem value="Admin" className="font-black uppercase text-[10px] text-red-400">Administrateur (Tout accès)</SelectItem>
                        <SelectItem value="Seller" className="font-black uppercase text-[10px] text-blue-400">Vendeur (Stock & Ventes)</SelectItem>
                        <SelectItem value="Cashier" className="font-black uppercase text-[10px] text-green-400">Caissier (Caisse & Reçus)</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
            </div>
            <div className="pt-8">
              <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-primary text-white font-black uppercase italic rounded-2xl shadow-xl shadow-primary/20">
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Appliquer les privilèges"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default withAuth(UsersPage);
