
export type UserRole = 'ADMIN' | 'SELLER' | 'CASHIER' | 'VISITOR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type Category = 'keyboard' | 'mouse' | 'screen' | 'headset' | 'other';

export interface Product {
  id: string;
  name: string;
  category: Category;
  purchasePrice: number;
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

export interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  paymentMode: PaymentMode;
  saleDate: string;
  sellerId: string;
}

export interface Order {
  id: string;
  customerName: string;
  items: SaleItem[];
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  orderDate: string;
}

export const PI_CONVERSION_RATE = 314.159;
