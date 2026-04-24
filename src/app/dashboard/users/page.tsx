
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, ShieldCheck, Mail, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STAFF = [
  { name: "Admin dks", email: "admin@dks.com", role: "ADMIN", status: "Actif" },
  { name: "Vendeur Pierre", email: "pierre@dks.com", role: "SELLER", status: "Actif" },
  { name: "Caisse Julia", email: "julia@dks.com", role: "CASHIER", status: "Hors-ligne" },
];

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold font-headline uppercase tracking-tighter">Équipe & Utilisateurs</h1>
            <p className="text-muted-foreground">Gérez les accès et les comptes de votre personnel.</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 gap-2 neon-glow font-bold">
            <UserPlus size={18} /> Ajouter un Membre
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STAFF.map((member) => (
            <Card key={member.email} className="glossy-card border-none">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <ShieldCheck className="text-accent h-6 w-6" />
                  </div>
                  <Badge variant={member.status === "Actif" ? "secondary" : "outline"} className={member.status === "Actif" ? "bg-green-500/10 text-green-400 border-none" : ""}>
                    {member.status}
                  </Badge>
                </div>
                <CardTitle className="mt-4 text-xl font-bold">{member.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="flex items-center gap-2"><Mail size={14}/> {member.email}</p>
                  <p className="flex items-center gap-2 font-bold text-accent"><Lock size={14}/> Rôle: {member.role}</p>
                </div>
                <div className="flex gap-2 pt-4 border-t border-white/5">
                  <Button variant="outline" size="sm" className="flex-1 text-xs border-white/10">Modifier Accès</Button>
                  <Button variant="ghost" size="sm" className="text-xs text-destructive hover:bg-destructive/10">Réinitialiser</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
