
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Mail, Phone, Loader2, UserPlus, ArrowLeft } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "in", ["customer", "Customer"]));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const custs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(custs);
      setLoading(false);
    }, (error: any) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'users',
        operation: 'list'
      }));
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleSaveCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const customerData = {
      displayName: formData.get('name') as string,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phoneNumber: formData.get('phone') as string,
      whatsapp: formData.get('phone') as string,
      role: 'customer',
      loyaltyLevel: 'Bronze',
      points: 0,
      updatedAt: serverTimestamp()
    };

    const colRef = collection(db, "users");
    addDoc(colRef, {
      ...customerData,
      createdAt: serverTimestamp()
    })
    .then(() => {
      toast({ title: "Client ajouté", description: "Le nouveau client a été enregistré dans le Hub." });
      setIsSheetOpen(false);
    })
    .catch(async (error) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: customerData
      }));
    })
    .finally(() => setIsSubmitting(false));
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
                <h1 className="text-3xl font-bold font-headline uppercase tracking-tighter italic">Base <span className="text-accent">Clients</span></h1>
                <p className="text-muted-foreground text-xs uppercase font-black opacity-40">Répertoire des membres DKS Elite</p>
             </div>
          </div>
          <Button onClick={() => setIsSheetOpen(true)} className="bg-accent text-black hover:bg-accent/90 gap-2 font-black rounded-xl h-12 px-6 uppercase italic shadow-xl shadow-accent/20">
             <UserPlus size={18} /> Nouveau Client
          </Button>
        </div>

        <Card className="glossy-card border-none rounded-[2rem] overflow-hidden shadow-2xl">
          <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
            <CardTitle className="text-lg flex items-center gap-3 font-black italic uppercase">
              <Users className="text-accent" /> Annuaire Clients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin h-10 w-10 text-accent" />
                </div>
            ) : customers.length > 0 ? (
                <Table>
                <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="uppercase font-black text-[10px] tracking-widest h-14">Identité</TableHead>
                    <TableHead className="uppercase font-black text-[10px] tracking-widest h-14">Coordonnées</TableHead>
                    <TableHead className="uppercase font-black text-[10px] tracking-widest text-right h-14">Date Inscription</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customers.map((customer) => (
                    <TableRow key={customer.id} className="border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell className="p-5">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-accent/20 bg-primary/20">
                            <AvatarFallback className="text-accent font-black text-lg italic">
                                {(customer.displayName || customer.firstName || "C").substring(0, 1)}
                            </AvatarFallback>
                            </Avatar>
                            <div>
                                <span className="font-bold text-sm block">{customer.displayName || `${customer.firstName} ${customer.lastName}`}</span>
                                <Badge variant="outline" className="text-[8px] font-black uppercase text-accent border-accent/20 h-4 px-1.5 mt-1">
                                    {customer.loyaltyLevel || 'Bronze'} Member
                                </Badge>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell className="p-5">
                        <div className="flex flex-col text-xs text-muted-foreground gap-1.5">
                            <span className="flex items-center gap-2"><Mail size={12} className="text-accent/60"/> {customer.email}</span>
                            {(customer.phoneNumber || customer.whatsapp) && <span className="flex items-center gap-2"><Phone size={12} className="text-accent/60"/> {customer.phoneNumber || customer.whatsapp}</span>}
                        </div>
                        </TableCell>
                        <TableCell className="text-right p-5">
                            <p className="font-black text-white/40 text-[9px] uppercase tracking-tighter">
                                {customer.createdAt?.toDate ? customer.createdAt.toDate().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : "Récemment"}
                            </p>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <div className="text-center py-32 opacity-20 italic space-y-4">
                    <Users size={64} className="mx-auto" strokeWidth={1} />
                    <p className="text-xs uppercase font-black tracking-widest">Aucun client enregistré.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
            <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter text-accent">Enregistrement Client</SheetTitle>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Identification Hub Technologique</p>
          </SheetHeader>
          
          <form onSubmit={handleSaveCustomer} className="flex-1 p-8 space-y-8 overflow-y-auto">
            <div className="space-y-6">
               <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Nom complet & Prénom</Label>
                <Input id="name" name="name" required className="h-14 bg-background/50 border-white/5 rounded-2xl focus:border-accent text-lg font-bold" placeholder="Ex: John Bahati" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Adresse e-mail officielle</Label>
                <Input id="email" name="email" type="email" required className="h-14 bg-background/50 border-white/5 rounded-2xl focus:border-accent" placeholder="contact@exemple.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest opacity-60 ml-1">Numéro WhatsApp / Mobile</Label>
                <Input id="phone" name="phone" className="h-14 bg-background/50 border-white/5 rounded-2xl focus:border-accent" placeholder="+243 823 000 000" />
                <p className="text-[8px] text-muted-foreground uppercase font-black italic mt-2 opacity-40">Nécessaire pour les alertes de maintenance hardware.</p>
              </div>
            </div>

            <div className="pt-8">
              <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20">
                {isSubmitting ? <Loader2 className="animate-spin" /> : "Créer le profil DKS Elite"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default withAuth(CustomersPage);
