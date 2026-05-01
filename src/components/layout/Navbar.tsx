"use client";

import { LogOut, LayoutDashboard, ShoppingCart, Users, Package, Home, Trash2, User, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
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
        <header className="border-b border-white/5 bg-background/60 backdrop-blur-3xl sticky top-0 z-[60] h-20 transition-all">
            <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                <Link href="/" className="hover:opacity-80 transition-opacity">
                    <Logo showText={true} className="hidden sm:flex" size="md" />
                    <Logo showText={false} className="sm:hidden" size="md" />
                </Link>
                
                <nav className="hidden lg:flex items-center gap-1">
                    {navItems.filter(i => i.show).map((item) => (
                        <Link key={item.href} href={item.href}>
                           <div className={`px-4 py-2 text-[10px] font-black uppercase italic tracking-widest rounded-xl transition-all flex items-center gap-2 ${pathname === item.href ? 'text-accent' : 'text-muted-foreground hover:text-white'}`}>
                             <item.icon size={14} className={pathname === item.href ? 'text-accent' : ''} />
                             {item.label}
                           </div>
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    {!isStaff && (
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative h-10 w-10 text-muted-foreground hover:text-accent transition-colors">
                                    <ShoppingCart size={20} />
                                    {cartCount > 0 && (
                                        <Badge className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-accent text-accent-foreground flex items-center justify-center text-[9px] font-black p-0 border border-background">
                                            {cartCount}
                                        </Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                                <SheetHeader className="p-8 pb-0">
                                    <Badge className="bg-accent/10 text-accent border-none w-fit mb-2 font-black text-[9px] uppercase tracking-widest">
                                        <Sparkles className="w-3 h-3 mr-2" /> Panier Premium
                                    </Badge>
                                    <SheetTitle className="text-3xl font-black uppercase italic tracking-tighter">Votre Sélection</SheetTitle>
                                </SheetHeader>
                                
                                <div className="flex-1 overflow-y-auto mt-6 space-y-3 px-8 custom-scrollbar">
                                    {cartItems.length === 0 ? (
                                        <div className="text-center py-20 opacity-20 flex flex-col items-center gap-4">
                                            <ShoppingCart size={80} strokeWidth={1} />
                                            <p className="font-black uppercase italic text-xs tracking-widest">Panier vide</p>
                                        </div>
                                    ) : (
                                        cartItems.map(item => (
                                            <div key={item.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-accent/20 transition-all">
                                                <div className="flex-1">
                                                    <p className="font-black uppercase italic text-xs line-clamp-1">{item.name}</p>
                                                    <p className="text-[9px] text-muted-foreground font-black uppercase mt-0.5">
                                                        <span className="text-white">${(item.price || 0).toFixed(2)}</span> x {item.quantity}
                                                    </p>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="text-muted-foreground hover:text-destructive h-8 w-8 ml-2" 
                                                    onClick={() => removeFromCart(item.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-8 bg-black/40 border-t border-white/5 space-y-6">
                                    <div className="flex justify-between items-end">
                                        <span className="text-muted-foreground font-black uppercase text-[9px] tracking-widest">Total</span>
                                        <div className="text-right">
                                            <p className="text-4xl font-black text-white tracking-tighter">${totalPrice.toFixed(2)}</p>
                                            <p className="text-accent font-black text-[9px] uppercase tracking-widest mt-0.5">≈ {(totalPrice / PI_CONVERSION_RATE).toFixed(4)} π</p>
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        className="w-full h-14 bg-accent text-accent-foreground font-black uppercase italic text-lg rounded-xl neon-glow disabled:opacity-20" 
                                        asChild
                                        disabled={cartItems.length === 0}
                                    >
                                        {cartItems.length > 0 ? (
                                            <Link href="/checkout">Commander <ArrowRight className="ml-2 h-5 w-5" /></Link>
                                        ) : (
                                            <span>SÉLECTION VIDE</span>
                                        )}
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    )}

                    {isLoading ? (
                        <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />
                    ) : user ? (
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="font-black italic uppercase text-[10px] leading-tight">{user.name}</p>
                                <p className="text-[8px] text-accent font-black uppercase tracking-widest">{user.role}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-10 w-10 text-muted-foreground hover:text-destructive transition-all">
                                <LogOut size={18} />
                            </Button>
                        </div>
                    ) : (
                        <Button asChild className="font-black uppercase italic rounded-xl h-10 bg-primary px-6 text-[10px] tracking-widest">
                            <Link href="/login">Accès Pro</Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
