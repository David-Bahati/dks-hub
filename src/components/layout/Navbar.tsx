"use client";

import { LogOut, LayoutDashboard, ShoppingCart, Users, Home, Trash2, User, Sparkles, ArrowRight, Loader2, Plus, Minus } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/Logo';

export function Navbar() {
    const { user, isLoading: authLoading } = useAuth();
    const { cartItems, cartCount, totalPrice, removeFromCart, updateQuantity } = useCart();
    const router = useRouter();
    const pathname = usePathname();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    const role = user?.role?.toLowerCase();
    const isStaff = role === 'admin' || role === 'seller' || role === 'cashier' || role === 'vendeur' || role === 'caissier';

    const navItems = [
        { label: 'Dashboard', href: '/dashboard', show: isStaff, icon: LayoutDashboard },
        { label: 'Mon Compte', href: '/dashboard', show: !isStaff && !!user, icon: User },
        { label: 'Boutique', href: '/', show: pathname !== '/', icon: Home },
    ];

    return (
        <header className="border-b border-white/5 bg-background/60 backdrop-blur-3xl sticky top-0 z-[60] h-20">
            <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                <Link href="/">
                    <Logo showText={true} size="md" />
                </Link>
                
                <nav className="hidden lg:flex items-center gap-6">
                    {navItems.filter(i => i.show).map((item) => (
                        <Link key={item.href} href={item.href}>
                           <div className={`text-[10px] font-black uppercase italic tracking-widest flex items-center gap-2 ${pathname === item.href ? 'text-accent' : 'text-muted-foreground'}`}>
                             <item.icon size={14} />
                             {item.label}
                           </div>
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative">
                                <ShoppingCart size={20} />
                                {cartCount > 0 && (
                                    <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center bg-accent text-black text-[8px]">{cartCount}</Badge>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="bg-card border-white/10">
                            <SheetHeader><SheetTitle className="uppercase font-black italic">Panier</SheetTitle></SheetHeader>
                            <div className="mt-8 space-y-4">
                                {cartItems.length === 0 ? <p className="text-center opacity-30 italic">Votre panier est vide</p> : (
                                    cartItems.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                                            <div className="flex-1"><p className="font-bold text-xs">{item.name}</p><p className="text-[10px] text-accent">${item.price?.toFixed(2)}</p></div>
                                            <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}><Trash2 size={14}/></Button>
                                        </div>
                                    ))
                                )}
                            </div>
                            {cartItems.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-white/5">
                                    <div className="flex justify-between text-lg font-black mb-4"><span>TOTAL</span><span>${totalPrice.toFixed(2)}</span></div>
                                    <Button className="w-full h-14 bg-accent text-black font-black uppercase italic" asChild><Link href="/checkout">Commander</Link></Button>
                                </div>
                            )}
                        </SheetContent>
                    </Sheet>

                    {authLoading ? <Loader2 className="animate-spin h-5 w-5" /> : user ? (
                        <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground"><LogOut size={18} /></Button>
                    ) : (
                        <Button asChild className="bg-primary px-6 text-[10px] font-black uppercase italic rounded-xl h-10"><Link href="/login">Connexion</Link></Button>
                    )}
                </div>
            </div>
        </header>
    );
}
