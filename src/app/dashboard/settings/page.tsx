
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PI_CONVERSION_RATE } from "@/lib/types";
import { Settings, Save, Globe, Bell, Shield, Wallet } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-headline uppercase tracking-tighter">Paramètres Système</h1>
          <p className="text-muted-foreground">Configurez les options globales de votre boutique.</p>
        </div>

        <div className="space-y-6">
          <Card className="glossy-card border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="text-accent" /> Configuration Crypto & Paiement
              </CardTitle>
              <CardDescription>Ajustez le taux de change et les méthodes de paiement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Taux Pi Network (1 π = X USD)</Label>
                  <Input defaultValue={PI_CONVERSION_RATE} type="number" step="0.0001" className="bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label>Devise Principale</Label>
                  <Input defaultValue="USD ($)" disabled className="bg-background/50" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="space-y-0.5">
                  <Label className="text-base">Accepter les paiements Pi</Label>
                  <p className="text-xs text-muted-foreground">Activer le QR Code Pi Browser au POS.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="glossy-card border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="text-accent" /> Boutique Publique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du Magasin</Label>
                <Input defaultValue="dks ShopManager" className="bg-background/50" />
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="space-y-0.5">
                  <Label className="text-base">Mode Maintenance</Label>
                  <p className="text-xs text-muted-foreground">Rendre la boutique invisible aux visiteurs.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" className="border-white/10">Annuler</Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 font-bold neon-glow">
              <Save size={18} /> Sauvegarder les modifications
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
