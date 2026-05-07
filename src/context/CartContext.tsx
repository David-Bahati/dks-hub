
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, getDoc, updateDoc } from 'firebase/firestore';

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // 1. Initial Load and Sync Logic
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    if (user) {
      const cartRef = doc(db, 'carts', user.uid);
      
      // On connection, we first check if there's a local cart to merge
      const syncLocalToCloud = async () => {
        const localCartStr = localStorage.getItem('cart_dks');
        if (localCartStr) {
          try {
            const localItems: CartItem[] = JSON.parse(localCartStr);
            if (localItems.length > 0) {
              const cloudSnap = await getDoc(cartRef);
              let finalItems = localItems;
              
              if (cloudSnap.exists()) {
                const cloudItems: CartItem[] = cloudSnap.data().items || [];
                // Simple merge logic: combine and unique by ID
                const merged = [...cloudItems];
                localItems.forEach(lItem => {
                  const existing = merged.find(m => m.id === lItem.id);
                  if (existing) {
                    existing.quantity += lItem.quantity;
                  } else {
                    merged.push(lItem);
                  }
                });
                finalItems = merged;
              }
              
              await setDoc(cartRef, { 
                items: finalItems, 
                updatedAt: new Date().toISOString() 
              }, { merge: true });
              
              // Clear local storage after successful merge
              localStorage.removeItem('cart_dks');
            }
          } catch (e) {
            console.error("Error merging carts", e);
          }
        }
      };

      syncLocalToCloud().then(() => {
        unsubscribe = onSnapshot(cartRef, (docSnap) => {
          if (docSnap.exists()) {
            setCartItems(docSnap.data().items || []);
          }
        });
      });

    } else {
      // Not logged in: use local storage
      const savedCart = localStorage.getItem('cart_dks');
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (e) {
          console.error("Error parsing local cart", e);
        }
      }
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // 2. Persist changes
  const persistCart = async (items: CartItem[]) => {
    if (user) {
      const cartRef = doc(db, 'carts', user.uid);
      setDoc(cartRef, { items, updatedAt: new Date().toISOString() }, { merge: true });
    } else {
      localStorage.setItem('cart_dks', JSON.stringify(items));
    }
  };

  const addToCart = (product: Product) => {
    const normalizedProduct = {
      ...product,
      price: product.sellingPrice || product.price || 0,
      imageUrl: product.imageUrl || product.image || 'https://picsum.photos/seed/dks/400/300'
    };

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      let newItems;
      
      if (existingItem) {
        if (product.stockQuantity && existingItem.quantity >= product.stockQuantity) {
          toast({ 
            title: "Stock Limité", 
            description: `Nous n'avons que ${product.stockQuantity} unités de "${product.name}" en stock.`,
            variant: "destructive"
          });
          return prevItems;
        }

        newItems = prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        newItems = [...prevItems, { ...normalizedProduct, quantity: 1 }];
      }

      persistCart(newItems);
      toast({
        title: "Panier mis à jour",
        description: `"${product.name}" ajouté au panier.`,
      });
      return newItems;
    });
  };

  const removeFromCart = (productId: string) => {
    const item = cartItems.find(i => i.id === productId);
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== productId);
      persistCart(newItems);
      return newItems;
    });

    if (item) {
      toast({
        title: "Article retiré",
        description: `"${item.name}" a été supprimé du panier.`,
        variant: "destructive"
      });
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCartItems(prevItems => {
      let newItems;
      if (quantity <= 0) {
        newItems = prevItems.filter(item => item.id !== productId);
      } else {
        newItems = prevItems.map(item =>
          item.id === productId ? { ...item, quantity } : item
        );
      }
      persistCart(newItems);
      return newItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    if (user) {
      const cartRef = doc(db, 'carts', user.uid);
      setDoc(cartRef, { items: [], updatedAt: new Date().toISOString() });
    } else {
      localStorage.removeItem('cart_dks');
    }
  };

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const totalPrice = cartItems.reduce((total, item) => total + (item.price || item.sellingPrice || 0) * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
