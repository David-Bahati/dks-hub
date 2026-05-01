
export type AppUser = {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'seller' | 'cashier' | 'customer';
  createdAt?: any;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  sellingPrice: number;
  stockQuantity: number;
  imageUrl: string;
  isPublished: boolean;
  price: number; // For cart compatibility
  image?: string; // For cart compatibility
};

export type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  customer: string;
  userId?: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled' | 'Terminé' | 'En attente' | 'Annulée';
  createdAt: any;
  date?: any;
};

export type Sale = {
  id: string;
  userId: string;
  items: { productId: string; quantity: number; price: number }[];
  totalAmount: number;
  status: 'Payé' | 'En attente' | 'Annulée';
  createdAt: any;
};

export type PaymentMode = "CASH" | "MOBILE_MONEY" | "PI_NETWORK";

export type Category = 'keyboard' | 'mouse' | 'screen' | 'headset' | 'other';
