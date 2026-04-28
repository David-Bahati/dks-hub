
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Mail, Phone, ShoppingBag } from "lucide-react";

const CUSTOMERS = [
  { name: "Jean Dupont", email: "jean.dupont@email.com", phone: "06 12 34 56 78", orders: 5, totalSpent: 1250.00 },
  { name: "Marie Curie", email: "marie.curie@lab.fr", phone: "01 44 55 66 77", orders: 12, totalSpent: 4500.50 },
  { name: "Alan Turing", email: "alan@enigma.uk", phone: "+44 77 88 99 00", orders: 2, totalSpent: 899.99 },
];

export default function CustomersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline uppercase tracking-tighter">Base Clients</h1>
          <p className="text-muted-foreground">Gérez vos relations clients et l&apos;historique de fidélité.</p>
        </div>

        <Card className="glossy-card border-none">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="text-accent" /> Annuaire Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">Commandes</TableHead>
                  <TableHead className="text-right">Total Dépensé</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CUSTOMERS.map((customer) => (
                  <TableRow key={customer.email} className="border-white/5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-white/10">
                          <AvatarFallback className="bg-primary/20 text-accent">{customer.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-bold">{customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail size={12}/> {customer.email}</span>
                        <span className="flex items-center gap-1"><Phone size={12}/> {customer.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 font-bold">
                        <ShoppingBag size={14} className="text-accent" /> {customer.orders}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-black text-accent">
                      ${customer.totalSpent.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
