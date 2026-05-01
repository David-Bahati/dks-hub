
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Lock, ArrowRight, Home, Loader2, Sparkles } from 'lucide-react';
import { initializeFirebase } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const { auth, firestore } = initializeFirebase();

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
      // 1. Création du compte Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Mise à jour du profil (displayName)
      await updateProfile(firebaseUser, { displayName: name });

      // 3. Création du document utilisateur dans Firestore
      await setDoc(doc(firestore, 'users', firebaseUser.uid), {
        id: firebaseUser.uid,
        email: email,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || 'Client',
        displayName: name,
        role: 'customer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Bienvenue chez DKS !',
        description: 'Votre compte a été créé avec succès. Bon shopping !',
      });

      // Redirection vers le dashboard pour voir le Hub Client
      router.push('/dashboard');
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
      {/* Effets de fond décoratifs */}
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
              <span className="text-white font-black text-3xl italic uppercase">dks</span>
            </div>
          <Badge className="mb-4 bg-white/5 text-accent border-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="w-3 h-3 mr-2" />
            Nouveau Membre Premium
          </Badge>
          <h1 className="text-4xl font-black font-headline tracking-tighter uppercase italic">Créer un Compte</h1>
          <p className="text-muted-foreground mt-2 text-sm">Rejoignez l'élite du hardware en Ituri.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              type="text"
              placeholder="Nom complet"
              className="h-14 pl-14 rounded-2xl bg-card/60 border-white/10 focus:border-accent text-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              placeholder="Mot de passe (6+ caractères)"
              className="h-14 pl-14 rounded-2xl bg-card/60 border-white/10 focus:border-accent text-base"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-16 bg-accent text-accent-foreground font-black rounded-2xl neon-glow gap-3 uppercase italic text-lg shadow-lg hover:shadow-accent/20 transition-all"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                S'inscrire
                <ArrowRight size={20}/>
              </>
            )}
          </Button>
        </form>

        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="text-accent hover:underline ml-1">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
