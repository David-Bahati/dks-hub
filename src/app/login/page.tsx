
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Lock, ArrowRight, Home, Mail, Loader2, ShieldCheck, Sparkles, Github } from 'lucide-react';
import { initializeFirebase } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null);
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

  const handleSocialLogin = async (providerName: 'google' | 'github') => {
    setIsSocialLoading(providerName);
    const provider = providerName === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Vérifier si l'utilisateur existe dans Firestore, sinon le créer
      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'Utilisateur',
          name: firebaseUser.displayName || 'Utilisateur',
          firstName: firebaseUser.displayName?.split(' ')[0] || 'Utilisateur',
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || 'Client',
          role: 'customer',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      toast({ 
        title: 'Connexion réussie', 
        description: `Bienvenue, ${firebaseUser.displayName || 'cher client'} !` 
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Erreur',
        description: "Impossible de se connecter avec ce service.",
        variant: 'destructive',
      });
    } finally {
      setIsSocialLoading(null);
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
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all duration-700" />
          
          <div className="space-y-6 relative z-10">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-3">
                <div className="relative group/input">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-accent transition-colors" size={18} />
                  <Input 
                    type="email" 
                    placeholder="Adresse email" 
                    className="h-14 pl-14 rounded-2xl bg-background/50 border-white/5 focus:border-accent focus:ring-4 focus:ring-accent/5 text-sm transition-all duration-300" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    disabled={isLoading || !!isSocialLoading} 
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
                    disabled={isLoading || !!isSocialLoading} 
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-16 bg-accent text-accent-foreground font-black rounded-2xl neon-glow gap-3 uppercase italic text-lg shadow-xl hover:shadow-accent/30 hover:scale-[1.02] active:scale-95 transition-all duration-500 mt-2" disabled={isLoading || !!isSocialLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Se connecter"}
                {!isLoading && <ArrowRight size={20}/>}
              </Button>
            </form>

            <div className="relative flex items-center gap-4">
              <div className="flex-1 h-px bg-white/5"></div>
              <span className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-[0.2em]">ou continuer avec</span>
              <div className="flex-1 h-px bg-white/5"></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all gap-3 font-bold text-xs uppercase italic"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading || !!isSocialLoading}
              >
                {isSocialLoading === 'google' ? <Loader2 className="animate-spin h-4 w-4" /> : (
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Google
              </Button>
              <Button 
                variant="outline" 
                className="h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all gap-3 font-bold text-xs uppercase italic"
                onClick={() => handleSocialLogin('github')}
                disabled={isLoading || !!isSocialLoading}
              >
                {isSocialLoading === 'github' ? <Loader2 className="animate-spin h-4 w-4" /> : <Github size={20} />}
                GitHub
              </Button>
            </div>
          </div>
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
