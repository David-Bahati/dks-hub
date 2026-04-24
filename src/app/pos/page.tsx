
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useState } from "react";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { Product, PaymentMode } from "@/lib/types";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  Search,
  CheckCircle2,
  Banknote,
  Smartphone,
  Coins
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CartItem extends Product {
  quantity: number;
}

export default function POS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const { toast } = useToast();

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    toast({
      title: "Transaction Successful!",
      description: `Sale processed via ${paymentMode.replace('_', ' ')}. Total: $${total.toFixed(2)}`,
    });
    setCart([]);
  };

  const filteredProducts = MOCK_PRODUCTS.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-10 h-12 bg-card/50 border-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto max-h-[calc(100vh-250px)] pb-10">
            {filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className="glossy-card cursor-pointer hover:border-accent/50 transition-all group border-none"
                onClick={() => addToCart(product)}
              >
                <div className="aspect-square relative overflow-hidden rounded-t-lg">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-accent">
                    {product.stockQuantity} in stock
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                  <p className="text-accent font-bold mt-1">${product.sellingPrice.toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart / Checkout Area */}
        <div className="flex flex-col gap-4">
          <Card className="glossy-card border-none flex-1 flex flex-col">
            <CardHeader className="border-b border-white/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart size={20} className="text-accent" />
                  Current Order
                </CardTitle>
                <span className="text-xs text-muted-foreground">{cart.length} items</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30 p-10 text-center">
                  <ShoppingCart size={48} className="mb-4" />
                  <p>Cart is empty. Select products to begin.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {cart.map(item => (
                    <div key={item.id} className="p-4 flex items-center justify-between group">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">${item.sellingPrice.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1">
                          <button onClick={() => updateQuantity(item.id, -1)} className="hover:text-accent"><Minus size={14}/></button>
                          <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="hover:text-accent"><Plus size={14}/></button>
                        </div>
                        <p className="text-sm font-bold w-16 text-right">${(item.sellingPrice * item.quantity).toFixed(2)}</p>
                        <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col border-t border-white/5 p-4 gap-4 bg-black/20">
              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-xl">
                  <span>Total</span>
                  <span className="text-accent">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-3 gap-2">
                <Button 
                  variant={paymentMode === "CASH" ? "default" : "outline"} 
                  className={cn("flex-col h-16 gap-1 border-white/10", paymentMode === "CASH" && "bg-primary")}
                  onClick={() => setPaymentMode("CASH")}
                >
                  <Banknote size={18} />
                  <span className="text-[10px]">Cash</span>
                </Button>
                <Button 
                  variant={paymentMode === "MOBILE_MONEY" ? "default" : "outline"} 
                  className={cn("flex-col h-16 gap-1 border-white/10", paymentMode === "MOBILE_MONEY" && "bg-primary")}
                  onClick={() => setPaymentMode("MOBILE_MONEY")}
                >
                  <Smartphone size={18} />
                  <span className="text-[10px]">Mobile</span>
                </Button>
                <Button 
                  variant={paymentMode === "PI_NETWORK" ? "default" : "outline"} 
                  className={cn("flex-col h-16 gap-1 border-white/10", paymentMode === "PI_NETWORK" && "bg-primary")}
                  onClick={() => setPaymentMode("PI_NETWORK")}
                >
                  <Coins size={18} />
                  <span className="text-[10px]">Pi Net</span>
                </Button>
              </div>

              <Button 
                className="w-full h-14 bg-accent text-accent-foreground hover:bg-accent/90 text-lg font-bold gap-2"
                disabled={cart.length === 0}
                onClick={handleCheckout}
              >
                <CheckCircle2 />
                Complete Order
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
