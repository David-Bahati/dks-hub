
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
  referralCode?: string;
  referralCount?: number;
  points?: number;
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

export type HardwareAsset = {
    id: string;
    userId: string;
    brand: string;
    model: string;
    serialNumber?: string;
    specs?: string;
    status: 'excellent' | 'good' | 'warning' | 'repair_needed';
    lastMaintenance: any;
    createdAt: any;
};

export type ServiceBooking = {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceTitle: string;
  category: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: any;
  location: string;
  technicianId?: string;
  technicianName?: string;
  notes?: string;
  createdAt: any;
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

export type PaymentMode = "CASH" | "MOBILE_MONEY" | "PI_NETWORK";
