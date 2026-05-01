
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/auth/withAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Edit, Trash2, ArrowLeft } from "lucide-react";
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
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { User } from '@/lib/types';
import Link from 'next/link';

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'Admin':
      return "bg-red-500/10 text-red-400 border-none";
    case 'Manager':
      return "bg-blue-500/10 text-blue-400 border-none";
    case 'Member':
    default:
      return "bg-gray-500/10 text-gray-400 border-none";
  }
};

function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [role, setRole] = useState("Member");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData: User[] = [];
      snapshot.forEach(doc => {
        usersData.push({ id: doc.id, ...doc.data() } as User);
      });
      setUsers(usersData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openModal = (user: User | null = null) => {
    setEditingUser(user);
    setRole(user ? user.role : "Member");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingUser(null);
    setIsModalOpen(false);
  };

  const handleSave = async (formData: FormData) => {
    const userData = {
      displayName: formData.get('displayName') as string,
      email: formData.get('email') as string,
      role: role
    };

    if (editingUser) {
      const userRef = doc(db, "users", editingUser.id);
      await updateDoc(userRef, userData);
    } else {
      await addDoc(collection(db, "users"), userData);
    }
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      const userRef = doc(db, "users", id);
      await deleteDoc(userRef);
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
                <h1 className="text-3xl font-bold font-headline uppercase tracking-tighter italic">Équipe & <span className="text-accent">Utilisateurs</span></h1>
                <p className="text-muted-foreground">Gérez les accès et les comptes de votre personnel.</p>
             </div>
          </div>
          <Button onClick={() => openModal()} className="bg-primary hover:bg-primary/90 gap-2 neon-glow font-bold h-12 px-6 rounded-xl uppercase italic">
            <UserPlus size={18} /> Ajouter un Membre
          </Button>
        </div>

        <Card className="glossy-card border-none rounded-[2rem]">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase italic">Liste des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              {isLoading ? (
                <p className="text-center text-muted-foreground">Chargement...</p>
              ) : users.length > 0 ? (
                users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                    <div>
                      <p className="font-bold">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge className={getRoleBadge(user.role)}>{user.role}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => openModal(user)} className="h-10 w-10 hover:bg-white/10"><Edit size={16}/></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)} className="h-10 w-10 text-destructive hover:bg-destructive/10"><Trash2 size={16}/></Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-10 italic">Aucun utilisateur trouvé.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

       <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="glossy-card border-none rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic">{editingUser ? 'Modifier un Membre' : 'Inviter un Nouveau Membre'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(new FormData(e.currentTarget)); }}>
            <div className="grid gap-6 py-4">
               <div className="space-y-2">
                <Label htmlFor="displayName" className="text-[10px] font-black uppercase tracking-widest opacity-60">Nom complet</Label>
                <Input id="displayName" name="displayName" defaultValue={editingUser?.displayName} required className="h-12 bg-background/50 border-white/10 rounded-xl" />
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
                        <SelectItem value="Admin" className="font-bold">Admin</SelectItem>
                        <SelectItem value="Manager" className="font-bold">Manager</SelectItem>
                        <SelectItem value="Member" className="font-bold">Member</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={closeModal} className="font-bold uppercase text-[10px]">Annuler</Button>
              <Button type="submit" className="bg-accent text-accent-foreground font-black uppercase italic rounded-xl px-8 h-12">Sauvegarder</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(UsersPage);
