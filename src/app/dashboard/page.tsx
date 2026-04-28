
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User as UserIcon, Home, LogOut, Package, Settings, ArrowRight } from 'lucide-react';
import { User as UserType } from '@/lib/types';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const savedUser = localStorage.getItem('dks_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else {
      // Si aucun utilisateur n'est connecté, on le redirige vers la page de connexion
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('dks_user');
    toast({ description: "Vous avez été déconnecté." });
    router.push('/');
  };

  if (!currentUser) {
    // Affiche un écran de chargement ou un squelette pendant la vérification
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
            <p className='text-muted-foreground'>Chargement de votre espace...</p>
        </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
        {/* Header du Dashboard */}
        <header className="border-b border-white/5 bg-background/40 backdrop-blur-2xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center neon-glow group-hover:scale-110 transition-transform">
                        <span className="text-white font-black text-xl italic uppercase">dks</span>
                    </div>
                    <span className="text-2xl font-black tracking-tighter uppercase italic">
                        Mon <span className="text-accent">Dashboard</span>
                    </span>
                </Link>
                <div className='flex items-center gap-4'>
                    <span className='text-sm font-bold hidden sm:inline'>Bonjour, {currentUser.username} !</span>
                    <Button 
                        variant="outline"
                        onClick={handleLogout}
                        className="h-12 border-white/10 hover:bg-destructive/20 hover:text-destructive rounded-2xl gap-2 font-black uppercase italic text-xs"
                    >
                        <LogOut size={16} />
                        Déconnexion
                    </Button>
                </div>
            </div>
        </header>

        {/* Contenu Principal */}
        <main className="max-w-7xl mx-auto px-4 py-16">
            <div className="text-center mb-16">
                <UserIcon className='w-24 h-24 mx-auto mb-6 text-muted-foreground p-5 bg-card/60 rounded-full border border-white/10' />
                <h1 className="text-5xl font-black tracking-tighter uppercase italic">Bienvenue, <span className='premium-gradient-text'>{currentUser.username}</span></h1>
                <p className="text-muted-foreground mt-3 text-lg">Voici le centre de contrôle de votre activité sur DKS ShopManager.</p>
            </div>

            {/* Grille de navigation du dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Link href="/dashboard/orders" className="w-full">
                    <div className="glossy-card rounded-[2.5rem] p-8 border-none flex flex-col items-center text-center h-full">
                        <Package size={40} className='text-accent mb-4'/>
                        <h3 className='text-xl font-black uppercase italic mb-2'>Mes Commandes</h3>
                        <p className='text-xs text-muted-foreground mb-6 flex-1'>Consultez l'historique de vos achats et suivez vos livraisons.</p>
                        <Button className='w-full h-12 bg-white/5 border-white/10 rounded-2xl font-bold italic uppercase hover:bg-white/10'>Voir mes commandes</Button>
                    </div>
                </Link>
                <Link href="/dashboard/settings" className="w-full">
                    <div className="glossy-card rounded-[2.5rem] p-8 border-none flex flex-col items-center text-center h-full">
                        <Settings size={40} className='text-accent mb-4'/>
                        <h3 className='text-xl font-black uppercase italic mb-2'>Paramètres du Compte</h3>
                        <p className='text-xs text-muted-foreground mb-6 flex-1'>Mettez à jour vos informations personnelles et de sécurité.</p>
                        <Button className='w-full h-12 bg-white/5 border-white/10 rounded-2xl font-bold italic uppercase hover:bg-white/10'>Gérer mon compte</Button>
                    </div>
                </Link>
                 <div className="glossy-card rounded-[2.5rem] p-8 border-none flex flex-col items-center text-center bg-accent/10 border border-accent/20 h-full">
                    <Home size={40} className='text-accent mb-4'/>
                    <h3 className='text-xl font-black uppercase italic mb-2'>Retour à la Boutique</h3>
                    <p className='text-xs text-muted-foreground mb-6 flex-1'>Continuez votre shopping et découvrez nos nouveautés.</p>
                    <Link href="/" className='w-full mt-auto'>
                        <Button className='w-full h-12 bg-accent text-accent-foreground rounded-2xl font-black italic uppercase gap-2'>
                            Aller à la boutique <ArrowRight size={16}/>
                        </Button>
                    </Link>
                </div>
            </div>
        </main>
    </div>
  );
}
