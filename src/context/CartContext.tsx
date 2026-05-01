"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

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

  useEffect(() => {
    if (user) {
      const cartRef = doc(db, 'carts', user.uid);
      const unsubscribe = onSnapshot(cartRef, (doc) => {
        if (doc.exists()) {
          setCartItems(doc.data().items || []);
        } else {
          const localCart = localStorage.getItem('cart');
          if (localCart) {
            const parsedLocalCart = JSON.parse(localCart);
            setCartItems(parsedLocalCart);
            setDoc(cartRef, { items: parsedLocalCart });
          }
        }
      });
      return () => unsubscribe();
    } else {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const cartRef = doc(db, 'carts', user.uid);
      setDoc(cartRef, { items: cartItems });
    } else {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      // Assurer la compatibilité des champs de prix
      const normalizedProduct = {
        ...product,
        price: product.price || product.sellingPrice || 0,
        imageUrl: product.imageUrl || product.image || '/placeholder.png'
      };

      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...normalizedProduct, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCartItems(prevItems =>
        prevItems.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
    if (user) {
        const cartRef = doc(db, 'carts', user.uid);
        setDoc(cartRef, { items: [] });
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

  const { toast } = useToast();

  const addToCartWithToast = (product: Product) => {
    context.addToCart(product);
    toast({
      title: "Produit ajouté",
      description: `"${product.name}" a été ajouté à votre panier.`,
    });
  };

  const removeFromCartWithToast = (productId: string) => {
    const item = context.cartItems.find(i => i.id === productId);
    if (item) {
        context.removeFromCart(productId);
        toast({
            title: "Produit retiré",
            description: `"${item.name}" a été retiré de votre panier.`,
            variant: "destructive"
        });
    }
  };

  return { ...context, addToCart: addToCartWithToast, removeFromCart: removeFromCartWithToast };
};