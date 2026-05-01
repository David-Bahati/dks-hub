
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

// Define the shape of a cart item (product + quantity)
export interface CartItem extends Product {
  quantity: number;
}

// Define the shape of the cart context
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  totalPrice: number;
}

// Create the context with a default value
const CartContext = createContext<CartContextType | undefined>(undefined);

// Create the context provider
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user } = useAuth(); // Get the current user

  // Effect for fetching and updating cart from Firestore
  useEffect(() => {
    if (user) {
      const cartRef = doc(db, 'carts', user.uid);

      const unsubscribe = onSnapshot(cartRef, (doc) => {
        if (doc.exists()) {
          setCartItems(doc.data().items || []);
        } else {
          // If no cart exists in Firestore, check local storage
          const localCart = localStorage.getItem('cart');
          if (localCart) {
            const parsedLocalCart = JSON.parse(localCart);
            setCartItems(parsedLocalCart);
            // And sync it to Firestore
            setDoc(cartRef, { items: parsedLocalCart });
          }
        }
      });

      return () => unsubscribe();
    } else {
      // For guest users, use local storage
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    }
  }, [user]);

  // Effect for saving the cart
  useEffect(() => {
    if (user) {
      // For logged-in users, save to Firestore
      if (cartItems.length > 0) {
        const cartRef = doc(db, 'carts', user.uid);
        setDoc(cartRef, { items: cartItems });
      }
    } else {
      // For guest users, save to local storage
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  // Add a product to the cart
  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  // Remove a product from the cart
  const removeFromCart = (productId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  // Update the quantity of a product
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

  // Clear the entire cart
  const clearCart = () => {
    setCartItems([]);
    if (user) {
        const cartRef = doc(db, 'carts', user.uid);
        setDoc(cartRef, { items: [] });
    }
  };

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
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
