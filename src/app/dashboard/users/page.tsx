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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
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
    case 'admin':
      return "bg-red-500/10 text-red-400 border-none";
    case 'seller':
    case 'manager':
      return "bg-blue-500/10 text-blue-400 border-none";
    case 'cashier':
      return "bg-green-500/10 text-green-400 border-none";
    default:
      return "bg-gray-500/10 text-gray-400 border-none";
  }
};

function UsersPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
        // Ne montrer que le staff (pas les clients) dans cet annuaire
        const userRole = data.role?.toLowerCase();
        if (userRole && userRole !== 'customer') {
          usersData.push({ id: doc.id, ...data });
        }
      });
      setUsers(usersData);
      setIsLoading(false);
    }, (error: any) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'users',
        operation: 'list'
      }));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser, router]);

  const openModal = (user: any | null = null) => {
    setEditingUser(user);
    setRole(user ? user.role : "Seller");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
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
        .then(() => {
          toast({ title: "Membre mis à jour" });
          closeModal();
        })
        .catch(async (error) => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: userData
          }));
        })
        .finally(() => setIsSubmitting(false));
    } else {
      const colRef = collection(db, "users");
      addDoc(colRef, {
        ...userData,
        createdAt: serverTimestamp()
      })
      .then(() => {
        toast({ title: "Nouveau membre ajouté" });
        closeModal();
      })
      .catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: userData
        }));
      })
      .finally(() => setIsSubmitting(false));
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Supprimer ce membre du personnel ?")) {
      const userRef = doc(db, "users", id);
      deleteDoc(userRef).catch(async (error) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'delete'
        }));
      });
      toast({ title: "Membre supprimé", variant: "destructive" });
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
                <p className="text-muted-foreground">Gérez les accès et les comptes de votre personnel.</p>
             </div>
          </div>
          <Button onClick={() => openModal()} className="bg-primary hover:bg-primary/90 gap-2 neon-glow font-bold h-12 px-6 rounded-xl uppercase italic">
            <UserPlus size={18} /> Ajouter un Membre
          </Button>
        </div>

        <Card className="glossy-card border-none rounded-[2rem]">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase italic flex items-center gap-2">
                <Shield className="text-accent" size={20} /> Liste du Personnel
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="animate-spin text-accent" />
                </div>
              ) : users.length > 0 ? (
                users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                    <div>
                      <p className="font-bold">{user.displayName || user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge className={getRoleBadge(user.role)}>{user.role}</Badge>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openModal(user)} className="h-10 w-10 hover:bg-white/10"><Edit size={16}/></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} className="h-10 w-10 text-destructive hover:bg-destructive/10"><Trash2 size={16}/></Button>
                        </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-10 italic">Aucun membre du personnel enregistré.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

       <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="glossy-card border-none rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic">{editingUser ? 'Modifier un Membre' : 'Ajouter un Nouveau Membre'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-6 py-4">
               <div className="space-y-2">
                <Label htmlFor="displayName" className="text-[10px] font-black uppercase tracking-widest opacity-60">Nom complet</Label>
                <Input id="displayName" name="displayName" defaultValue={editingUser?.displayName || editingUser?.name} required className="h-12 bg-background/50 border-white/10 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest opacity-60">Adresse e-mail</Label>
                <Input id="email" name="email" type="email" defaultValue={editingUser?.email} required className="h-12 bg-background/50 border-white/10 rounded-xl" />
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Rôle</Label>
                 <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-12 bg-background/50 border-white/10 rounded-xl">
                        <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                        <SelectItem value="Admin" className="font-bold">Administrateur</SelectItem>
                        <SelectItem value="Seller" className="font-bold">Vendeur</SelectItem>
                        <SelectItem value="Cashier" className="font-bold">Caissier</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={closeModal} className="font-bold uppercase text-[10px]">Annuler</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-accent text-accent-foreground font-black uppercase italic rounded-xl px-8 h-12">
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Sauvegarder"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(UsersPage);
