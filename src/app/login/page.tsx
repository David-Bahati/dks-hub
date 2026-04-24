
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, Loader2, Info } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulation d'authentification
    await new Promise(resolve => setTimeout(resolve, 1500));

    let user = null;
    if (email === "admin@dks.com" && password === "admin123") {
      user = { id: "1", name: "Admin dks", email: "admin@dks.com", role: "ADMIN" };
    } else if (email === "vendeur@dks.com" && password === "vendeur123") {
      user = { id: "2", name: "Vendeur Pierre", email: "vendeur@dks.com", role: "SELLER" };
    } else if (email === "caissier@dks.com" && password === "caissier123") {
      user = { id: "3", name: "Caissier Julia", email: "caissier@dks.com", role: "CASHIER" };
    }

    if (user) {
      localStorage.setItem("dks_user", JSON.stringify(user));
      toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${user.name} !`,
      });
      router.push("/dashboard");
    } else {
      toast({
        variant: "destructive",
        title: "Erreur d'authentification",
        description: "Email ou mot de passe incorrect.",
      });
    }
    setIsLoading(false);
  };

  const fillCredentials = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent rounded-full blur-[150px]" />
      </div>

      <Card className="w-full max-w-md glossy-card border-none">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center neon-glow">
              <span className="text-white font-bold text-2xl">DKS</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-black uppercase tracking-tighter">Espace Professionnel</CardTitle>
          <CardDescription>Connectez-vous pour gérer votre boutique.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@dks.com" 
                  className="pl-10 bg-background/50 border-white/10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10 bg-background/50 border-white/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-accent text-accent-foreground font-bold h-12 neon-glow mt-2"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Se connecter"}
            </Button>
          </form>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-wider">
              <Info size={14} /> Comptes de Test
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => fillCredentials("admin@dks.com", "admin123")}
                className="text-left p-2 rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-[10px]"
              >
                <span className="font-bold block text-foreground">ADMINISTRATEUR</span>
                admin@dks.com / admin123
              </button>
              <button 
                onClick={() => fillCredentials("vendeur@dks.com", "vendeur123")}
                className="text-left p-2 rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-[10px]"
              >
                <span className="font-bold block text-foreground">VENDEUR</span>
                vendeur@dks.com / vendeur123
              </button>
              <button 
                onClick={() => fillCredentials("caissier@dks.com", "caissier123")}
                className="text-left p-2 rounded bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-[10px]"
              >
                <span className="font-bold block text-foreground">CAISSIER</span>
                caissier@dks.com / caissier123
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
