
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Lock, ArrowRight, Home, Loader2, Sparkles, Gift } from 'lucide-react';
import { initializeFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, query, collection, where, getDocs, updateDoc, increment, addDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/Logo';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const { auth, firestore } = initializeFirebase();

  // Capture automatique du parrain via l'URL
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir tous les champs pour continuer.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Mot de passe trop court',
        description: 'Le mot de passe doit contenir au moins 6 caractères.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Création du compte Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: name });

      // 2. Logique de Parrainage
      let referrerId = null;
      let referrerName = null;

      if (referralCode.trim()) {
        const q = query(collection(firestore, 'users'), where('referralCode', '==', referralCode.trim().toUpperCase()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const referrerDoc = querySnapshot.docs[0];
          referrerId = referrerDoc.id;
          referrerName = referrerDoc.data().name || referrerDoc.data().displayName;

          await updateDoc(doc(firestore, 'users', referrerId), {
            referralCount: increment(1),
            points: increment(100), 
            updatedAt: serverTimestamp()
          });

          await addDoc(collection(firestore, 'notifications'), {
            userId: referrerId,
            title: "Nouveau Parrainage !",
            message: `${name} a rejoint le Hub grâce à vous. Votre bonus est actif.`,
            type: 'success',
            isRead: false,
            createdAt: serverTimestamp(),
            link: '/dashboard/referrals'
          });
        }
      }

      // 3. Création du document utilisateur 
      const myReferralCode = `DKS-${name.substring(0, 3).toUpperCase()}-${firebaseUser.uid.substring(0, 4).toUpperCase()}`;

      await setDoc(doc(firestore, 'users', firebaseUser.uid), {
        id: firebaseUser.uid,
        email: email,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || 'Client',
        displayName: name,
        name: name,
        role: 'customer',
        referralCode: myReferralCode,
        referredBy: referrerId,
        referralCount: 0,
        tokenBalance: 0,
        points: 0,
        pointsConverted: 0,
        loyaltyLevel: 'Bronze',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Bienvenue chez DKS !',
        description: referrerName 
          ? `Compte créé. Merci à ${referrerName} de vous avoir parrainé !` 
          : 'Votre compte a été créé avec succès.',
      });

      const redirect = searchParams.get('redirect');
      if (redirect) {
        router.push(redirect);
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error(error);
      let message = "Une erreur est survenue lors de l'inscription.";
      if (error.code === 'auth/email-already-in-use') {
        message = "Cette adresse email est déjà utilisée.";
      }
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative p-4 overflow-hidden">
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
            Nouveau Membre Premium
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter uppercase italic leading-none">Inscription</h1>
          <p className="text-muted-foreground mt-4 text-sm font-light uppercase tracking-widest opacity-60">Rejoignez l'élite technologique</p>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-all duration-700" />
          
          <form onSubmit={handleRegister} className="space-y-5 relative z-10">
            <div className="space-y-4">
              <div className="relative group/input">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-accent transition-colors" size={18} />
                <Input
                  type="text"
                  placeholder="Nom complet"
                  className="h-14 pl-14 rounded-2xl bg-background/50 border-white/5 focus:border-accent focus:ring-4 focus:ring-accent/5 text-sm transition-all duration-300"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="relative group/input">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-accent transition-colors" size={18} />
                <Input
                  type="email"
                  placeholder="Adresse e-mail"
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
                  placeholder="Mot de passe (6+ caractères)"
                  className="h-14 pl-14 rounded-2xl bg-background/50 border-white/5 focus:border-accent focus:ring-4 focus:ring-accent/5 text-sm transition-all duration-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="pt-2">
                <div className="relative group/input">
                  <Gift className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-accent transition-colors" size={18} />
                  <Input
                    type="text"
                    placeholder="Code de parrainage"
                    className="h-14 pl-14 rounded-2xl bg-white/5 border-white/10 border-dashed focus:border-accent text-xs font-black uppercase tracking-widest transition-all"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <p className="text-[9px] text-muted-foreground mt-2 ml-2 uppercase font-bold opacity-40">Obtenez des remises immédiates avec un code.</p>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-16 bg-accent text-accent-foreground font-black rounded-2xl neon-glow gap-3 uppercase italic text-lg shadow-xl hover:shadow-accent/30 hover:scale-[1.02] active:scale-95 transition-all duration-500 mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Créer mon Profil Élite
                  <ArrowRight size={20}/>
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-40">
            Déjà inscrit ?{" "}
            <Link href={searchParams.get('redirect') ? `/login?redirect=${searchParams.get('redirect')}` : "/login"} className="text-accent hover:underline ml-2 opacity-100">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

