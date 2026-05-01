
"use client";

import { ShoppingCart, Menu, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function ShopNavbar() {
    return (
        <header className="bg-transparent text-white sticky top-0 z-50 py-4">
            <div className="container mx-auto px-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-xl font-bold">DOUBLE KING</span>
                    <span className="text-xl font-light">SHOP</span>
                </Link>
                
                <div className="flex items-center gap-4">
                    <Link href="/cart">
                        <Button variant="ghost" size="icon">
                            <ShoppingCart />
                        </Button>
                    </Link>
                    <Link href="/login">
                        <Button variant="ghost" size="icon">
                            <User />
                        </Button>
                    </Link>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu />
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Menu</SheetTitle>
                            </SheetHeader>
                            <div className="grid gap-4 py-4">
                                <Link href="/shop" className="text-lg">Shop</Link>
                                <Link href="/cart" className="text-lg">Cart</Link>
                                <Link href="/login" className="text-lg">Login</Link>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
