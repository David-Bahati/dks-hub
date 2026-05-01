
"use client";

import { LogOut, LayoutDashboard, ShoppingCart, Settings, Users, Package, Bell, Loader2, PanelLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PI_CONVERSION_RATE } from '@/lib/constants';

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

    const isAdmin = user?.role === 'admin';
    const isSeller = user?.role === 'seller';
    const isCashier = user?.role === 'cashier';
    const isStaff = isAdmin || isSeller || isCashier;

    const navItems = [
        { label: 'Dashboard', href: '/dashboard', show: isStaff, icon: LayoutDashboard },
        { label: 'Stock', href: '/dashboard/products', show: isAdmin || isSeller, icon: Package },
        { label: 'Caisse', href: '/pos', show: isAdmin || isCashier, icon: ShoppingCart },
        { label: 'Utilisateurs', href: '/dashboard/users', show: isAdmin, icon: Users },
        { label: 'Boutique', href: '/', show: true, icon: Home },
    ];

    return (
        <header className="border-b border-white/5 bg-background/40 backdrop-blur-2xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center neon-glow group-hover:scale-110 transition-transform">
                        <span className="text-white font-black text-xl italic uppercase">dks</span>
                    </div>
                    <span className="text-2xl font-black tracking-tighter uppercase italic hidden sm:block">
                        Shop<span className="text-accent">Manager</span>
                    </span>
                </Link>
                
                <nav className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1">
                    {navItems.filter(i => i.show).map((item) => (
                        <Link key={item.href} href={item.href}>
                           <p className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${pathname === item.href ? 'bg-accent text-accent-foreground' : 'hover:bg-white/10'}`}>{item.label}</p>
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    {/* Cart Drawer for Customers */}
                    {!isStaff && (
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative rounded-full h-12 w-12 bg-white/5 border border-white/10">
                                    <ShoppingCart size={20} />
                                    {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-[10px] font-black">{cartCount}</span>}
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="bg-card border-white/10 w-full sm:max-w-md flex flex-col">
                                <SheetHeader>
                                    <SheetTitle className="text-2xl font-black uppercase italic">Votre Panier</SheetTitle>
                                </SheetHeader>
                                <div className="flex-1 overflow-y-auto mt-8 space-y-4">
                                    {cartItems.length === 0 ? (
                                        <div className="text-center py-20 opacity-30">
                                            <ShoppingCart size={64} className="mx-auto mb-4" />
                                            <p>Votre panier est vide.</p>
                                        </div>
                                    ) : (
                                        cartItems.map(item => (
                                            <div key={item.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <div>
                                                    <p className="font-bold">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} x {item.quantity}</p>
                                                </div>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeFromCart(item.id)}>
                                                    <LogOut size={16} />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="border-t border-white/10 pt-6 space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-muted-foreground font-bold uppercase text-xs">Total à payer</span>
                                        <div className="text-right">
                                            <p className="text-3xl font-black">${totalPrice.toFixed(2)}</p>
                                            <p className="text-accent font-bold text-sm">≈ {(totalPrice / PI_CONVERSION_RATE).toFixed(4)} π</p>
                                        </div>
                                    </div>
                                    <Button className="w-full h-14 bg-accent text-accent-foreground font-black uppercase italic text-lg rounded-2xl neon-glow" asChild>
                                        <Link href="/checkout">Finaliser la commande</Link>
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    )}

                    {isLoading ? (
                        <Loader2 className="animate-spin" />
                    ) : user ? (
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="font-bold text-sm">{user.name}</p>
                                <p className="text-[10px] text-accent font-bold uppercase">{user.role}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-10 w-10 rounded-full hover:bg-destructive/10 hover:text-destructive">
                                <LogOut size={18} />
                            </Button>
                        </div>
                    ) : (
                        <Button asChild className="font-bold rounded-xl h-12 bg-primary px-6">
                            <Link href="/login">Espace Pro</Link>
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
