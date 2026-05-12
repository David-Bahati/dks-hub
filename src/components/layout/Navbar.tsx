
"use client";

import { LogOut, LayoutDashboard, ShoppingCart, Home, Trash2, User, Sparkles, Loader2, GraduationCap, Wrench, Laptop, Layout, Bell, Award, Wallet, Coins, ArrowRight, Minus, Plus, ShoppingBag, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/Logo';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
    const { user, isLoading: authLoading } = useAuth();
    const { cartItems, cartCount, totalPrice, removeFromCart, updateQuantity } = useCart();
    const router = useRouter();
    const pathname = usePathname();

    // Fetch unread notifications for badge
    const notificationsQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return query(collection(db, "notifications"), where("userId", "==", user.uid), where("isRead", "==", false));
    }, [user?.uid]);
    const { data: unreadNotifs } = useCollection(notificationsQuery);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    const role = user?.role?.toLowerCase();
    const isStaff = role === 'admin' || role === 'seller' || role === 'cashier';

    const navItems = [
        { label: 'Boutique', href: '/', show: true, icon: Home },
        { label: 'Academy', href: '/services', show: true, icon: GraduationCap },
        { label: 'Certifiés', href: '/graduates', show: true, icon: Award },
        { label: 'Portfolio', href: '/portfolio', show: true, icon: Layout },
        { label: 'Dashboard', href: '/dashboard', show: isStaff, icon: LayoutDashboard },
        { label: 'Mon Hub', href: '/dashboard', show: !isStaff && !!user, icon: User },
    ];

    return (
        <header className="border-b border-white/5 bg-background/60 backdrop-blur-3xl sticky top-0 z-[60] h-20">
            <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
                <Link href="/">
                    <Logo showText={true} size="md" />
                </Link>
                
                <nav className="hidden lg:flex items-center gap-8">
                    {navItems.filter(i => i.show).map((item) => (
                        <Link key={item.href} href={item.href}>
                           <div className={`text-[10px] font-black uppercase italic tracking-widest flex items-center gap-2 transition-all hover:text-accent ${pathname === item.href ? 'text-accent border-b-2 border-accent pb-1' : 'text-muted-foreground'}`}>
                             <item.icon size={14} />
                             {item.label}
                           </div>
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-4">
                    {/* NOTIFICATIONS BADGE */}
                    {user && (
                        <Link href="/dashboard/notifications">
                            <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-2xl hover:bg-white/5 transition-all text-muted-foreground hover:text-accent">
                                <Bell size={20} />
                                {unreadNotifs && unreadNotifs.length > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                                )}
                            </Button>
                        </Link>
                    )}

                    {/* UNIVERSAL DKST WALLET BADGE */}
                    {user && (
                        <Link href="/dashboard/wallet">
                            <Badge className="bg-accent/20 text-accent border-accent/20 h-10 px-4 rounded-xl gap-2 font-black italic cursor-pointer hover:bg-accent/30 transition-all hidden sm:flex">
                                <Coins size={16} /> {user?.tokenBalance?.toFixed(2) || 0} DKST
                            </Badge>
                        </Link>
                    )}

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-2xl hover:bg-white/5 transition-all">
                                <ShoppingCart size={22} />
                                {cartCount > 0 && (
                                    <Badge className="absolute -top-1 -right-1 h-5 min-w-5 p-0 flex items-center justify-center bg-accent text-black text-[10px] font-black rounded-full animate-pulse">{cartCount}</Badge>
                                )}
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                            <SheetHeader className="p-8 bg-accent/10 border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-accent text-black flex items-center justify-center shadow-lg shadow-accent/20">
                                        <ShoppingCart size={24} />
                                    </div>
                                    <div>
                                        <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter">Panier <span className="text-accent">Elite</span></SheetTitle>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Ma sélection Hardware</p>
                                    </div>
                                </div>
                            </SheetHeader>
                            
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                                {cartItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full opacity-20 text-center space-y-4">
                                        <ShoppingBag size={64} />
                                        <p className="font-black uppercase italic text-sm">Le panier attend votre excellence...</p>
                                    </div>
                                ) : (
                                    cartItems.map(item => (
                                        <div key={item.id} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group transition-all hover:bg-white/[0.08]">
                                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/40 border border-white/5 shrink-0">
                                                <img src={item.imageUrl || item.image || 'https://picsum.photos/seed/dks/400/300'} className="w-full h-full object-cover" alt={item.name} />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <p className="font-bold text-xs uppercase italic truncate">{item.name}</p>
                                                <p className="text-[10px] font-black text-accent">${(item.price || item.sellingPrice || 0).toFixed(2)}</p>
                                                <div className="flex items-center gap-3 pt-2">
                                                    <div className="flex items-center gap-2 bg-black/40 px-2 py-0.5 rounded-lg border border-white/5">
                                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-white/40 hover:text-accent"><Minus size={12}/></button>
                                                        <span className="text-[10px] font-black w-4 text-center">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-white/40 hover:text-accent"><Plus size={12}/></button>
                                                    </div>
                                                    <button onClick={() => removeFromCart(item.id)} className="text-destructive/40 hover:text-destructive transition-colors"><Trash2 size={12}/></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {cartItems.length > 0 && (
                                <SheetFooter className="p-8 bg-black/40 border-t border-white/5 flex flex-col gap-6">
                                    <div className="w-full flex justify-between items-end">
                                        <span className="text-xs font-black uppercase text-muted-foreground">Total à régler</span>
                                        <span className="text-3xl font-black text-accent italic tracking-tighter">${totalPrice.toFixed(2)}</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3 w-full">
                                        <Link href="/cart" className="w-full">
                                            <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 font-black uppercase italic text-[10px] tracking-widest hover:bg-white/5">Voir le Panier Complet</Button>
                                        </Link>
                                        <Link href="/checkout" className="w-full">
                                            <Button className="w-full h-16 bg-accent text-black font-black uppercase italic rounded-2xl shadow-xl shadow-accent/20 gap-3">
                                                Paiement Élite <ArrowRight size={18} />
                                            </Button>
                                        </Link>
                                    </div>
                                </SheetFooter>
                            )}
                        </SheetContent>
                    </Sheet>

                    {authLoading ? <Loader2 className="animate-spin h-5 w-5 text-accent" /> : user ? (
                        <div className="flex items-center gap-3">
                             <Link href="/dashboard/settings" className="relative group">
                                <Avatar className="h-11 w-11 border-2 border-white/5 group-hover:border-accent transition-all cursor-pointer shadow-lg">
                                    <AvatarImage src={user.photoURL} className="object-cover" />
                                    <AvatarFallback className="bg-accent/20 text-accent font-black italic text-sm">{user.name?.substring(0, 1)}</AvatarFallback>
                                </Avatar>
                                {user.kycStatus === 'verified' && (
                                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 z-10">
                                        <div className="bg-green-500 text-white rounded-full p-0.5 shadow-lg">
                                            <CheckCircle2 size={10} strokeWidth={4} />
                                        </div>
                                    </div>
                                )}
                             </Link>
                             <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground hover:text-destructive h-11 w-11 p-0 rounded-2xl bg-white/5 hover:bg-destructive/10 transition-all">
                                <LogOut size={20} />
                             </Button>
                        </div>
                    ) : (
                        <Button asChild className="bg-primary px-6 text-[10px] font-black uppercase italic rounded-xl h-11 shadow-lg shadow-primary/20"><Link href="/login">Connexion</Link></Button>
                    )}
                </div>
            </div>
        </header>
    );
}
