
"use client";

import { LogOut, LayoutDashboard, ShoppingCart, Users, Home, Trash2, User, Sparkles, ArrowRight, Loader2, Plus, Minus, Bell, Check } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PI_CONVERSION_RATE } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/Logo';
import { useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, doc, updateDoc } from 'firebase/firestore';

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

    // Requête simplifiée pour éviter les erreurs de permission pendant les tests
    const notificationsQuery = useMemoFirebase(() => {
        if (!user?.uid) return null;
        
        // En mode test, on récupère simplement les notifications de l'utilisateur
        return query(
            collection(db, "notifications"),
            where("userId", "==", user.uid),
            where("isRead", "==", false),
            orderBy("createdAt", "desc"),
            limit(5)
        );
    }, [user?.uid]);

    const { data: notifications } = useCollection(notificationsQuery);
    const unreadCount = notifications?.length || 0;

    const markAsRead = async (id: string) => {
        try {
            await updateDoc(doc(db, "notifications", id), { isRead: true });
        } catch (error) {
            console.error(error);
        }
    };

    const navItems = [
        { label: 'Dashboard', href: '/dashboard', show: isStaff, icon: LayoutDashboard },
        { label: 'Caisse', href: '/pos', show: role === 'admin' || role === 'cashier' || role === 'caissier', icon: ShoppingCart },
        { label: 'Équipe', href: '/dashboard/users', show: role === 'admin', icon: Users },
        { label: 'Mon Hub', href: '/dashboard', show: !isStaff && !!user, icon: User },
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
                    {user && (
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative h-10 w-10 text-muted-foreground hover:text-accent transition-colors">
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <Badge className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-white flex items-center justify-center text-[9px] font-black p-0 border border-background animate-pulse">
                                            {unreadCount}
                                        </Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="bg-card/95 backdrop-blur-3xl border-white/10 w-full sm:max-w-md flex flex-col p-0">
                                <SheetHeader className="p-8 pt-12 pb-0">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <Badge className="bg-accent/10 text-accent border-none w-fit mb-2 font-black text-[9px] uppercase tracking-widest">
                                                Système Alertes
                                            </Badge>
                                            <SheetTitle className="text-xl font-black uppercase italic tracking-tighter">Notifications</SheetTitle>
                                        </div>
                                        <Link href="/dashboard/notifications" className="text-[10px] font-black uppercase italic text-accent hover:underline mb-1">
                                            Voir tout
                                        </Link>
                                    </div>
                                </SheetHeader>
                                
                                <div className="flex-1 overflow-y-auto mt-6 space-y-3 px-8 custom-scrollbar">
                                    {notifications && notifications.length > 0 ? (
                                        notifications.map(notif => (
                                            <div key={notif.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1 hover:bg-white/10 transition-all relative group">
                                                <div className="flex justify-between items-start gap-3">
                                                    <h4 className="font-bold text-xs uppercase italic">{notif.title}</h4>
                                                    <button onClick={() => markAsRead(notif.id)} className="h-6 w-6 rounded-lg bg-accent/10 text-accent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Check size={12} />
                                                    </button>
                                                </div>
                                                <p className="text-[11px] text-muted-foreground leading-relaxed">{notif.message}</p>
                                                <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest pt-1">
                                                    {notif.createdAt?.toDate ? notif.createdAt.toDate().toLocaleTimeString() : 'Maintenant'}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-20 opacity-20 flex flex-col items-center gap-4">
                                            <Bell size={80} strokeWidth={1} />
                                            <p className="font-black uppercase italic text-xs tracking-widest">Aucune alerte</p>
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    )}

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
                                <SheetHeader className="p-8 pt-12 pb-0">
                                    <Badge className="bg-accent/10 text-accent border-none w-fit mb-2 font-black text-[9px] uppercase tracking-widest">
                                        <Sparkles className="w-3 h-3 mr-2" /> Panier Premium
                                    </Badge>
                                    <SheetTitle className="text-xl font-black uppercase italic tracking-tighter">Votre Sélection</SheetTitle>
                                </SheetHeader>
                                
                                <div className="flex-1 overflow-y-auto mt-6 space-y-4 px-8 custom-scrollbar">
                                    {cartItems.length === 0 ? (
                                        <div className="text-center py-20 opacity-20 flex flex-col items-center gap-4">
                                            <ShoppingCart size={80} strokeWidth={1} />
                                            <p className="font-black uppercase italic text-xs tracking-widest">Panier vide</p>
                                        </div>
                                    ) : (
                                        cartItems.map(item => (
                                            <div key={item.id} className="flex flex-col gap-3 bg-white/5 p-5 rounded-[2rem] border border-white/5 hover:border-accent/10 transition-all group">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 pr-2">
                                                        <p className="font-black uppercase italic text-[11px] line-clamp-1 text-white/90">{item.name}</p>
                                                        <p className="text-[10px] text-accent font-black mt-1">${(item.price || 0).toFixed(2)}</p>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 h-7 w-7 -mr-2 transition-all duration-300" 
                                                        onClick={() => removeFromCart(item.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex items-center gap-3 bg-black/40 rounded-xl p-1 border border-white/5">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-7 w-7 rounded-lg hover:bg-white/5 text-muted-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            disabled={item.quantity <= 1}
                                                        >
                                                            <Minus size={12} />
                                                        </Button>
                                                        <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-7 w-7 rounded-lg hover:bg-white/5 text-muted-foreground"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        >
                                                            <Plus size={12} />
                                                        </Button>
                                                    </div>
                                                    <p className="text-[10px] font-black text-white/40 uppercase italic tracking-tighter">
                                                        Total: <span className="text-white">${((item.price || 0) * item.quantity).toFixed(2)}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-8 bg-black/40 border-t border-white/5 space-y-6">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-end">
                                            <span className="text-muted-foreground font-black uppercase text-[9px] tracking-widest">Total</span>
                                            <div className="text-right">
                                                <p className="text-4xl font-black text-white tracking-tighter">${totalPrice.toFixed(2)}</p>
                                                <p className="text-accent font-black text-[9px] uppercase tracking-widest mt-0.5">≈ {(totalPrice / PI_CONVERSION_RATE).toFixed(4)} π</p>
                                            </div>
                                        </div>
                                        <p className="text-[9px] text-muted-foreground/30 font-bold uppercase tracking-widest text-right">Hors frais de livraison</p>
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

                    {authLoading ? (
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
