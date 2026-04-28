
"use client";

import { useState } from 'react';
import { LogOut, LayoutDashboard, ShoppingCart, Settings, Users, Package, Bell, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from '@/context/AuthContext'; // Import the useAuth hook
import { auth } from '@/lib/firebase'; // Import auth for signout
import { signOut } from 'firebase/auth'; // Import the signOut function

const NAV_ITEMS = [
    { label: 'Aperçu', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Produits', href: '/dashboard/products', icon: Package },
    { label: 'Commandes', href: '/dashboard/orders', icon: ShoppingCart },
    { label: 'Utilisateurs', href: '/dashboard/users', icon: Users },
    { label: 'Paramètres', href: '/dashboard/settings', icon: Settings },
];

const MOCK_NOTIFICATIONS = [
    { id: 1, title: "Nouvelle Commande #A4B2", description: "RTX 4090 - Quantité: 1", time: "2 min ago" },
    { id: 2, title: "Stock Faible", description: "Clavier Mécanique Pro - 3 restants", time: "1 hour ago" },
    { id: 3, title: "Nouvel Utilisateur", description: "Jean Dupont vient de s'inscrire.", time: "3 hours ago" },
];

export function Navbar() {
    const { user, isLoading } = useAuth(); // Use the auth context
    const [hasUnread, setHasUnread] = useState(true);
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut(auth); // Sign out from Firebase
            router.push('/login'); // Redirect to login page
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    return (
        <header className="border-b border-white/5 bg-background/40 backdrop-blur-2xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center neon-glow group-hover:scale-110 transition-transform">
                        <span className="text-white font-black text-xl italic uppercase">dks</span>
                    </div>
                    <span className="text-2xl font-black tracking-tighter uppercase italic">
                        Shop<span className="text-accent">Manager</span>
                    </span>
                </Link>
                
                {user && (
                    <nav className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                        {NAV_ITEMS.map((item) => (
                            <Link key={item.href} href={item.href}>
                               <p className="px-4 py-2 text-sm font-bold rounded-xl hover:bg-white/10 transition-colors">{item.label}</p>
                            </Link>
                        ))}
                    </nav>
                )}

                <div className="flex items-center gap-4">
                    {isLoading ? (
                        <Loader2 className="animate-spin" />
                    ) : user ? (
                        <>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative rounded-full h-10 w-10" onClick={() => setHasUnread(false)}>
                                        <Bell size={18} />
                                        {hasUnread && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent neon-glow-sm" />}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 glossy-card border-none mt-2">
                                    <div className="grid gap-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium leading-none">Notifications</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Les dernières activités de votre boutique.
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            {MOCK_NOTIFICATIONS.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-white/5"
                                                >
                                                    <div className='p-2 bg-accent/10 rounded-full'>
                                                        <Bell className="h-4 w-4 text-accent" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium leading-none">{notification.title}</p>
                                                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                                                        <p className='text-xs text-muted-foreground/50 mt-1'>{notification.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="font-bold text-sm">{user.name}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={handleLogout} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10">
                                    <LogOut size={18} />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <Button asChild className="font-bold">
                            <Link href="/login">Espace Pro</Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
