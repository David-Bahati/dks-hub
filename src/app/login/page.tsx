
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Lock, ArrowRight, Home, Mail, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { initializeFirebase } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const { auth, firestore } = initializeFirebase();

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
      toast({ title: 'Connexion réussie', description: 'Ravi de vous revoir !' });
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

  const setupTestAccounts = async () => {
    setIsSettingUp(true);
    const testUsers = [
      { email: 'admin@dks.com', password: 'admin123', name: 'Admin DKS', role: 'Admin' },
      { email: 'vendeur@dks.com', password: 'vendeur123', name: 'Vendeur DKS', role: 'Seller' },
      { email: 'caissier@dks.com', password: 'caissier123', name: 'Caissier DKS', role: 'Cashier' },
    ];

    try {
      await signOut(auth);

      for (const testUser of testUsers) {
        let uid;
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, testUser.email, testUser.password);
          uid = userCredential.user.uid;
        } catch (e: any) {
          if (e.code === 'auth/email-already-in-use') {
            const userCredential = await signInWithEmailAndPassword(auth, testUser.email, testUser.password);
            uid = userCredential.user.uid;
          } else {
            throw e;
          }
        }

        if (uid) {
          await setDoc(doc(firestore, 'users', uid), {
            id: uid,
            email: testUser.email,
            firstName: testUser.name.split(' ')[0],
            lastName: testUser.name.split(' ')[1] || 'DKS',
            displayName: testUser.name,
            name: testUser.name,
            role: testUser.role,
            updatedAt: serverTimestamp(),
          }, { merge: true });

          await signOut(auth);
        }
      }
      
      toast({
        title: "Configuration terminée",
        description: "Les permissions Admin, Vendeur et Caissier ont été injectées avec succès.",
      });
    } catch (error: any) {
      console.error("Setup error:", error);
      toast({
        title: "Erreur lors de la réinitialisation",
        description: error.message || "Vérifiez votre connexion.",
        variant: "destructive",
      });
    } finally {
      setIsSettingUp(false);
    }
  };

  const setTestAccount = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative p-4 overflow-hidden">
      {/* Background Decorative Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[140px] -z-10 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[140px] -z-10 animate-pulse delay-1000" />

      <Link href="/" className="absolute top-8 left-8">
        <Button variant="ghost" className="h-12 w-12 rounded-2xl border border-white/5 hover:border-accent/30 hover:bg-accent/10 hover:text-accent transition-all backdrop-blur-xl bg-white/5">
          <Home size={20} />
        </Button>
      </Link>
      
      <div className="w-full max-w-sm space-y-12">
        <div className="text-center">
          <Logo size="lg" className="justify-center mb-10 transition-transform hover:scale-105 duration-500" />
          <Badge className="mb-6 bg-white/5 text-accent border-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
            <Sparkles className="w-3 h-3 mr-2" />
            Accès Sécurisé Premium
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter uppercase italic leading-none">Connexion</h1>
          <p className="text-muted-foreground mt-4 text-sm font-light uppercase tracking-widest opacity-60">Gérez votre univers technologique</p>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
          {/* Subtle light effect in corner */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all duration-700" />
          
          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            <div className="space-y-4">
              <div className="relative group/input">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-accent transition-colors" size={18} />
                <Input 
                  type="email" 
                  placeholder="Adresse email" 
                  className="h-14 pl-14 rounded-2xl bg-background/50 border-white/5 focus:border-accent focus:ring-4 focus:ring-accent/5 text-sm transition-all duration-300" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  disabled={isLoading} 
                />
              </div>
              <div className="relative group/input">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-accent transition-colors" size={18} />
                <Input 
                  type="password" 
                  placeholder="Mot de passe" 
                  className="h-14 pl-14 rounded-2xl bg-background/50 border-white/5 focus:border-accent focus:ring-4 focus:ring-accent/5 text-sm transition-all duration-300" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  disabled={isLoading} 
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-16 bg-accent text-accent-foreground font-black rounded-2xl neon-glow gap-3 uppercase italic text-lg shadow-xl hover:shadow-accent/30 hover:scale-[1.02] active:scale-95 transition-all duration-500 mt-4" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : "Se connecter"}
              {!isLoading && <ArrowRight size={20}/>}
            </Button>
          </form>
        </div>

        <div className="space-y-10">
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-40">
                Pas encore membre ?{" "}
                <Link href="/register" className="text-accent hover:underline ml-2 opacity-100">
                  Créer un compte
                </Link>
              </p>
            </div>

            <div className="pt-10 border-t border-white/5 flex flex-col items-center gap-6">
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] opacity-30">Accès rapide Staff</p>
                <div className="flex flex-wrap justify-center gap-3">
                    {['admin', 'vendeur', 'caissier'].map((role) => (
                        <Button 
                            key={role}
                            variant="ghost" 
                            className="text-[9px] h-9 px-4 border border-white/5 rounded-xl uppercase font-black tracking-widest hover:bg-white/5 hover:border-white/20 transition-all" 
                            onClick={() => setTestAccount(`${role}@dks.com`, `${role}123`)}
                        >
                            {role}
                        </Button>
                    ))}
                </div>
                
                <Button 
                    variant="ghost" 
                    className="text-[9px] h-8 gap-2 opacity-20 hover:opacity-100 transition-opacity uppercase font-black tracking-widest" 
                    onClick={setupTestAccounts}
                    disabled={isSettingUp}
                >
                    {isSettingUp ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                    Réinitialiser les permissions Firebase
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
