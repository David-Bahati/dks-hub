
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Lock, ArrowRight, Home, Mail, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Champs requis',
        description: "Veuillez entrer votre email et votre mot de passe.",
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Connexion réussie', description: 'Bienvenue dans votre espace professionnel.' });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Erreur de connexion',
        description: 'Email ou mot de passe incorrect.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const setTestAccount = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
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
            <span className="text-white font-black text-3xl italic uppercase">DKS</span>
          </div>
          <h1 className="text-4xl font-black font-headline tracking-tighter uppercase italic">Espace Pro</h1>
          <p className="text-muted-foreground mt-2">Gérez votre boutique et vos ventes.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input 
              type="email" 
              placeholder="Email professionnel" 
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
          <Button type="submit" className="w-full h-14 bg-accent text-accent-foreground font-black rounded-2xl neon-glow gap-3 uppercase italic text-lg" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : "Se connecter"}
            {!isLoading && <ArrowRight size={20}/>}
          </Button>
        </form>

        <div className="mt-8 space-y-2">
            <p className="text-xs text-center text-muted-foreground uppercase font-bold mb-4">Comptes de test rapides :</p>
            <div className="grid grid-cols-1 gap-2">
                <Button variant="ghost" className="text-[10px] h-8 border border-white/5" onClick={() => setTestAccount('admin@dks.com', 'admin123')}>Admin: admin@dks.com</Button>
                <Button variant="ghost" className="text-[10px] h-8 border border-white/5" onClick={() => setTestAccount('vendeur@dks.com', 'vendeur123')}>Vendeur: vendeur@dks.com</Button>
                <Button variant="ghost" className="text-[10px] h-8 border border-white/5" onClick={() => setTestAccount('caissier@dks.com', 'caissier123')}>Caissier: caissier@dks.com</Button>
            </div>
        </div>
      </div>
    </div>
  );
}
