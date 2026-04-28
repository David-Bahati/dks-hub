
import { Timestamp } from "firebase/firestore";

// The complete user object, combining Auth and Firestore data
export interface AppUser {
  uid: string;                 // From Firebase Auth
  email: string | null;          // From Firebase Auth
  name: string;                 // From Firestore
  role: 'admin' | 'customer';    // From Firestore
  createdAt: Timestamp;        // From Firestore
}

export type Category = 'keyboard' | 'mouse' | 'screen' | 'headset' | 'other';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: Category;
  // purchasePrice: number; // Let's simplify for now
  sellingPrice: number;
  stockQuantity: number;
  imageUrl: string;
  isPublished: boolean;
}

export type PaymentMode = 'PI_NETWORK' | 'MOBILE_MONEY' | 'CASH';

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customer: string;
  items: SaleItem[];
  total: number;
  status: 'En attente' | 'Terminé' | 'Annulé';
  date: Timestamp; // Dates from Firestore are Timestamps
}

export const PI_CONVERSION_RATE = 314.159;
