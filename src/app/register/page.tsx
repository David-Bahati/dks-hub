
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Lock, ArrowRight, Home } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // --- Simulation d'inscription ---
    setTimeout(() => {
      if (username && email && password) {
        const newUser = {
          id: `user_${new Date().getTime()}`,
          username: username,
          email: email,
        };

        // Sauvegarde et connexion automatique de l'utilisateur
        localStorage.setItem('dks_user', JSON.stringify(newUser));

        toast({
          title: 'Inscription réussie',
          description: 'Votre compte a été créé avec succès.',
        });

        // Redirection vers le tableau de bord
        router.push('/dashboard');

      } else {
        toast({
          title: 'Formulaire incomplet',
          description: 'Veuillez remplir tous les champs.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative p-4">
      <Link href="/" className="absolute top-6 left-6">
        <Button variant="outline" className="h-12 w-12 rounded-2xl p-0 border-white/10 hover:bg-accent/10 hover:text-accent transition-all">
          <Home size={20} />
        </Button>
      </Link>

      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
           <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center neon-glow mx-auto mb-6">
              <span className="text-white font-black text-3xl italic uppercase">dks</span>
            </div>
          <h1 className="text-4xl font-black font-headline tracking-tighter uppercase italic">Créer un Compte</h1>
          <p className="text-muted-foreground mt-2">Rejoignez notre communauté de passionnés.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="relative">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="text"
              placeholder="Nom d'utilisateur"
              className="h-14 pl-14 rounded-2xl bg-card/60 border-white/10 focus:border-accent text-base"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="email"
              placeholder="Adresse e-mail"
              className="h-14 pl-14 rounded-2xl bg-card/60 border-white/10 focus:border-accent text-base"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="password"
              placeholder="Mot de passe"
              className="h-14 pl-14 rounded-2xl bg-card/60 border-white/10 focus:border-accent text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-14 bg-accent text-accent-foreground font-black rounded-2xl neon-glow gap-3 uppercase italic text-lg"
            disabled={isLoading}
          >
            {isLoading ? "Création en cours..." : "S'inscrire"}
            {!isLoading && <ArrowRight size={20}/>}
          </Button>
        </form>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="font-bold text-accent hover:underline">
              Connectez-vous
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
