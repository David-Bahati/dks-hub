
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Lock, ArrowRight, Home, Mail, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { initializeFirebase } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      toast({ title: 'Connexion réussie', description: 'Ravi de vous revoir !' });
      
      // On redirige tout le monde vers le dashboard qui gère l'affichage par rôle
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
      { email: 'admin@dks.com', password: 'admin123', name: 'Admin DKS', role: 'admin' },
      { email: 'vendeur@dks.com', password: 'vendeur123', name: 'Vendeur DKS', role: 'seller' },
      { email: 'caissier@dks.com', password: 'caissier123', name: 'Caissier DKS', role: 'cashier' },
    ];

    try {
      for (const user of testUsers) {
        let uid;
        try {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
            uid = userCredential.user.uid;
          } catch (e: any) {
            if (e.code === 'auth/email-already-in-use') {
              const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
              uid = userCredential.user.uid;
            } else {
              throw e;
            }
          }

          if (uid) {
            await setDoc(doc(firestore, 'users', uid), {
              id: uid,
              email: user.email,
              firstName: user.name.split(' ')[0],
              lastName: user.name.split(' ')[1] || 'DKS',
              displayName: user.name,
              role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            }, { merge: true });

            const roleCollection = user.role === 'admin' ? 'admins' : 'sellers';
            if (user.role !== 'customer') {
               await setDoc(doc(firestore, roleCollection, uid), { 
                 id: uid, 
                 role: user.role,
                 updatedAt: serverTimestamp() 
               }, { merge: true });
            }
          }
        } catch (innerError: any) {
          console.error(`Error setting up ${user.email}:`, innerError);
        }
      }
      
      toast({
        title: "Configuration terminée",
        description: "Les permissions ont été injectées. Vous pouvez maintenant vous connecter.",
      });
    } catch (error: any) {
      console.error("Setup error:", error);
      toast({
        title: "Erreur critique",
        description: error.message || "Une erreur est survenue lors de l'initialisation.",
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
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] -z-10" />

      <Link href="/" className="absolute top-6 left-6">
        <Button variant="outline" className="h-12 w-12 rounded-2xl p-0 border-white/10 hover:bg-accent/10 hover:text-accent transition-all backdrop-blur-xl bg-white/5">
          <Home size={20} />
        </Button>
      </Link>
      
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-3xl bg-primary flex items-center justify-center neon-glow mx-auto mb-6">
            <span className="text-white font-black text-3xl italic uppercase">DKS</span>
          </div>
          <Badge className="mb-4 bg-white/5 text-accent border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="w-3 h-3 mr-2" />
            Accès Sécurisé
          </Badge>
          <h1 className="text-4xl font-black font-headline tracking-tighter uppercase italic">Connexion</h1>
          <p className="text-muted-foreground mt-2 text-sm">Gérez vos achats ou votre espace pro.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input 
              type="email" 
              placeholder="Adresse email" 
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
          <Button type="submit" className="w-full h-16 bg-accent text-accent-foreground font-black rounded-2xl neon-glow gap-3 uppercase italic text-lg shadow-lg hover:shadow-accent/20 transition-all" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : "Se connecter"}
            {!isLoading && <ArrowRight size={20}/>}
          </Button>
        </form>

        <div className="mt-8 space-y-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                Pas encore de compte ?{" "}
                <Link href="/register" className="text-accent hover:underline ml-1">
                  Créer un compte
                </Link>
              </p>
            </div>

            <div className="pt-8 border-t border-white/5">
                <div className="flex flex-col gap-2 mb-4">
                    <p className="text-[10px] text-center text-muted-foreground uppercase font-black tracking-widest">Accès rapide (Staff) :</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        <Button variant="ghost" className="text-[9px] h-7 px-2 border border-white/5 uppercase font-bold" onClick={() => setTestAccount('admin@dks.com', 'admin123')}>Admin</Button>
                        <Button variant="ghost" className="text-[9px] h-7 px-2 border border-white/5 uppercase font-bold" onClick={() => setTestAccount('vendeur@dks.com', 'vendeur123')}>Vendeur</Button>
                        <Button variant="ghost" className="text-[9px] h-7 px-2 border border-white/5 uppercase font-bold" onClick={() => setTestAccount('caissier@dks.com', 'caissier123')}>Caissier</Button>
                    </div>
                </div>
                
                <Button 
                    variant="outline" 
                    className="w-full text-[9px] h-8 gap-2 border-dashed border-white/10 bg-white/5 uppercase font-black tracking-tighter" 
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
