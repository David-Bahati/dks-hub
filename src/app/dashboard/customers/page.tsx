
"use client";

import { useState, useEffect } from 'react';
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Mail, Phone, Loader2, UserPlus, ArrowLeft } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import withAuth from '@/components/auth/withAuth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On récupère les utilisateurs qui ont le rôle 'customer'
    const q = query(collection(db, "users"), where("role", "==", "customer"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const custs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(custs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching customers:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

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
                <p className="text-muted-foreground">Gérez vos relations clients et l'historique de fidélité.</p>
             </div>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 font-bold rounded-xl h-12 px-6 uppercase italic">
             <UserPlus size={18} /> Nouveau Client
          </Button>
        </div>

        <Card className="glossy-card border-none rounded-[2rem]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 font-black italic uppercase">
              <Users className="text-accent" /> Annuaire Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin h-10 w-10 text-accent" />
                </div>
            ) : customers.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="uppercase font-black text-[10px] tracking-widest">Client</TableHead>
                    <TableHead className="uppercase font-black text-[10px] tracking-widest">Contact</TableHead>
                    <TableHead className="uppercase font-black text-[10px] tracking-widest text-right">Inscrit le</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customers.map((customer) => (
                    <TableRow key={customer.id} className="border-white/5 hover:bg-white/5 transition-colors">
                        <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-white/10 bg-primary/20">
                            <AvatarFallback className="text-accent font-black">
                                {(customer.firstName || customer.displayName || "C").substring(0, 1)}
                            </AvatarFallback>
                            </Avatar>
                            <div>
                                <span className="font-bold block">{customer.displayName || `${customer.firstName} ${customer.lastName}`}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">ID: #{customer.id.substring(0, 6)}</span>
                            </div>
                        </div>
                        </TableCell>
                        <TableCell>
                        <div className="flex flex-col text-xs text-muted-foreground gap-1">
                            <span className="flex items-center gap-2"><Mail size={12} className="text-accent"/> {customer.email}</span>
                            {customer.phoneNumber && <span className="flex items-center gap-2"><Phone size={12} className="text-accent"/> {customer.phoneNumber}</span>}
                        </div>
                        </TableCell>
                        <TableCell className="text-right font-black text-accent text-[10px] uppercase">
                            {customer.createdAt?.toDate ? customer.createdAt.toDate().toLocaleDateString() : "Récemment"}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <div className="text-center py-20 opacity-30 italic">
                    <Users size={48} className="mx-auto mb-4" />
                    <p>Aucun client enregistré pour le moment.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default withAuth(CustomersPage);
