
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const MOCK_ORDERS = [
  { id: "ORD-7291", customer: "Jean Dupont", date: "2024-03-10", total: 450.00, status: "En cours" },
  { id: "ORD-8822", customer: "Marie Curie", date: "2024-03-09", total: 120.50, status: "Terminé" },
  { id: "ORD-1092", customer: "Alan Turing", date: "2024-03-08", total: 899.99, status: "Annulé" },
];

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline uppercase tracking-tighter">Gestion des Commandes</h1>
          <p className="text-muted-foreground">Suivi et traitement des commandes clients.</p>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input placeholder="Rechercher une commande..." className="pl-10 bg-card/50 border-white/10" />
          </div>
          <Button variant="outline" className="border-white/10"><Filter size={18} /></Button>
        </div>

        <Card className="glossy-card border-none">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="text-accent" /> Liste des Commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead>ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_ORDERS.map((order) => (
                  <TableRow key={order.id} className="border-white/5">
                    <TableCell className="font-mono text-accent">#{order.id}</TableCell>
                    <TableCell className="font-bold">{order.customer}</TableCell>
                    <TableCell className="text-xs">{order.date}</TableCell>
                    <TableCell className="font-bold">${order.total.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === "Terminé" ? "secondary" : order.status === "Annulé" ? "destructive" : "default"}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Détails</Button>
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
