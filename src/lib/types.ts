
export type AppUser = {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'seller' | 'cashier' | 'customer' | 'Admin' | 'Seller' | 'Cashier';
  createdAt?: any;
  photoURL?: string;
  phoneNumber?: string;
  whatsapp?: string;
  address?: string;
  loyaltyLevel?: 'Bronze' | 'Silver' | 'Gold';
  language?: 'fr' | 'en';
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
  purchasePrice?: number;
};

export type OrderItem = {
  id?: string;
  productId?: string;
  name: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  customerName: string;
  customerEmail?: string;
  userId?: string;
  items: OrderItem[];
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: any;
  updatedAt: any;
};

export type SupportTicket = {
  id: string;
  userId: string;
  customerName: string;
  productName: string;
  issueDescription: string;
  status: 'pending' | 'diagnosing' | 'repairing' | 'ready' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: any;
  updatedAt: any;
};

export type Sale = {
  id: string;
  userId: string;
  items: { productId: string; quantity: number; price: number }[];
  totalAmount: number;
  status: string;
  paymentMode?: string;
  createdAt: any;
};

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: any;
  link?: string;
};

export type PaymentMode = "CASH" | "MOBILE_MONEY" | "PI_NETWORK";

export type Category = 'keyboard' | 'mouse' | 'screen' | 'headset' | 'other';
