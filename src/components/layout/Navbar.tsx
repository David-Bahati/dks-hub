"use client";

import { LogOut, LayoutDashboard, ShoppingCart, Users, Package, Home, Trash2, User, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PI_CONVERSION_RATE } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/Logo';

export function Navbar() {
    const { user, isLoading } = useAuth();
    const { cartItems, cartCount, totalPrice, removeFromCart } = useCart();
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

    const isAdmin = user?.role === 'Admin';
    const isSeller = user?.role === 'Seller';
    const isCashier = user?.role === 'Cashier';
    const isStaff = isAdmin || isSeller || isCashier;

    const navItems = [
        { label: 'Dashboard', href: '/dashboard', show: isStaff, icon: LayoutDashboard },
        { label: 'Caisse', href: '/pos', show: isAdmin || isCashier, icon: ShoppingCart },
        { label: 'Utilisateurs', href: '/dashboard/users', show: isAdmin, icon: Users },
        { label: 'Mon Hub', href: '/dashboard', show: !isStaff && !!user, icon: User },
        { label: 'Catalogue', href: '#shop', show: pathname === '/', icon: Package },
        { label: 'Boutique', href: '/', show: pathname !== '/', icon: Home },
    ];

    return (
        <header className="border-b border-white/5 bg-background/60 backdrop-blur-3xl sticky top-0 z-[60] h-24">
            <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                <Link href="/">
                    <Logo showText={true} className="hidden sm:flex" size="md" />
                    <Logo showText={false} className="sm:hidden" size="md" />
                </Link>
                
                <nav className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5 backdrop-blur-md">
                    {navItems.filter(i => i.show).map((item) => (
                        <Link key={item.href} href={item.href}>
                           <div className={`px-5 py-2.5 text-[11px] font-black uppercase italic tracking-widest rounded-xl transition-all flex items-center gap-2 ${pathname === item.href ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/20' : 'hover:bg-white/10 hover:text-accent'}`}>
                             <item.icon size={14} />
                             {item.label}
                           </div>
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-6">
                    {!isStaff && (
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative rounded-[1.25rem] h-14 w-14 bg-white/5 border border-white/10 hover:border-accent hover:bg-accent/5 transition-all group active:scale-90">
                                    <ShoppingCart size={22} className="group-hover:text-accent transition-colors" />
                                    {cartCount > 0 && (
                                        <Badge className="absolute -top-1 -right-1 min-w-[22px] h-[22px] rounded-full bg-accent text-accent-foreground flex items-center justify-center text-[10px] font-black border-2 border-background p-0">
                                            {cartCount}
                                        </Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col rounded-l-[3.5rem] p-0 overflow-hidden">
                                <SheetHeader className="p-10 pb-0">
                                    <Badge className="bg-accent/10 text-accent border-none w-fit mb-4 font-black text-[9px] uppercase tracking-widest">
                                        <Sparkles className="w-3 h-3 mr-2" /> Panier Premium
                                    </Badge>
                                    <SheetTitle className="text-4xl font-black uppercase italic tracking-tighter">VOTRE <span className="text-accent">SÉLECTION</span></SheetTitle>
                                </SheetHeader>
                                
                                <div className="flex-1 overflow-y-auto mt-8 space-y-4 px-10 pr-6 custom-scrollbar">
                                    {cartItems.length === 0 ? (
                                        <div className="text-center py-20 opacity-20 flex flex-col items-center gap-6">
                                            <ShoppingCart size={120} strokeWidth={1} />
                                            <p className="font-black uppercase italic text-sm tracking-widest">Panier vide pour le moment</p>
                                        </div>
                                    ) : (
                                        cartItems.map(item => (
                                            <div key={item.id} className="flex justify-between items-center bg-white/5 p-6 rounded-[2rem] border border-white/5 hover:border-accent/20 transition-all group">
                                                <div className="flex-1">
                                                    <p className="font-black uppercase italic text-sm group-hover:text-accent transition-colors line-clamp-1">{item.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-black uppercase mt-1">
                                                        <span className="text-white">${(item.price || 0).toFixed(2)}</span> x {item.quantity}
                                                    </p>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl h-12 w-12 ml-4" 
                                                    onClick={() => removeFromCart(item.id)}
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-10 bg-black/40 border-t border-white/5 space-y-8">
                                    <div className="flex justify-between items-end">
                                        <span className="text-muted-foreground font-black uppercase text-[10px] tracking-widest">Estimation Total</span>
                                        <div className="text-right">
                                            <p className="text-5xl font-black text-white tracking-tighter">${totalPrice.toFixed(2)}</p>
                                            <p className="text-accent font-black text-[10px] uppercase tracking-widest mt-1">≈ {(totalPrice / PI_CONVERSION_RATE).toFixed(6)} π</p>
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        className="w-full h-20 bg-accent text-accent-foreground font-black uppercase italic text-xl rounded-[1.5rem] neon-glow shadow-xl active:scale-95 disabled:opacity-20" 
                                        asChild
                                        disabled={cartItems.length === 0}
                                    >
                                        {cartItems.length > 0 ? (
                                            <Link href="/checkout">Valider ma commande <ArrowRight className="ml-3" /></Link>
                                        ) : (
                                            <span>SÉLECTION VIDE</span>
                                        )}
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    )}

                    {isLoading ? (
                        <Loader2 className="animate-spin h-6 w-6 opacity-50" />
                    ) : user ? (
                        <div className="flex items-center gap-4 bg-white/5 pl-5 pr-1.5 py-1.5 rounded-[1.5rem] border border-white/10 backdrop-blur-md">
                            <div className="text-right hidden sm:block">
                                <p className="font-black italic uppercase text-[11px] leading-tight tracking-tighter">{user.name}</p>
                                <p className="text-[9px] text-accent font-black uppercase tracking-widest mt-0.5">{user.role}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-12 w-12 rounded-2xl hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90">
                                <LogOut size={20} />
                            </Button>
                        </div>
                    ) : (
                        <Button asChild className="font-black uppercase italic rounded-2xl h-14 bg-primary px-8 neon-glow shadow-lg active:scale-95 text-xs">
                            <Link href="/login">Accès Pro</Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
