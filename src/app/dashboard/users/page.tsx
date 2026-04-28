
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/auth/withAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { User } from '@/lib/types';

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline uppercase tracking-tighter">Équipe & Utilisateurs</h1>
            <p className="text-muted-foreground">Gérez les accès et les comptes de votre personnel.</p>
          </div>
          <Button onClick={() => openModal()} className="bg-primary hover:bg-primary/90 gap-2 neon-glow font-bold">
            <UserPlus size={18} /> Ajouter un Membre
          </Button>
        </div>

        <Card className="glossy-card border-none">
          <CardHeader>
            <CardTitle>Liste des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              {isLoading ? (
                <p className="text-center text-muted-foreground">Chargement...</p>
              ) : users.length > 0 ? (
                users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-semibold">{user.displayName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge className={getRoleBadge(user.role)}>{user.role}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => openModal(user)}><Edit size={16}/></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}><Trash2 size={16} className="text-destructive"/></Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">Aucun utilisateur trouvé.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

       <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="glossy-card border-none">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Modifier un Membre' : 'Inviter un Nouveau Membre'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(new FormData(e.currentTarget)); }}>
            <div className="grid gap-4 py-4">
               <div className="space-y-2">
                <Label htmlFor="displayName">Nom complet</Label>
                <Input id="displayName" name="displayName" defaultValue={editingUser?.displayName} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input id="email" name="email" type="email" defaultValue={editingUser?.email} required />
              </div>
              <div className="space-y-2">
                 <Label>Rôle</Label>
                 <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Member">Member</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>Annuler</Button>
              <Button type="submit">Sauvegarder</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(UsersPage);
