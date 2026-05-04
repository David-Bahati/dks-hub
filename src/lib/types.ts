
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
  tokenBalance?: number;
  pointsConverted?: number;
  piWalletAddress?: string;
};

export type TokenTransaction = {
  id: string;
  userId: string;
  userName?: string;
  type: 'mint' | 'burn' | 'transfer';
  pointsAmount?: number;
  tokenAmount: number;
  piTxId?: string;
  senderId?: string;
  senderName?: string;
  recipientId?: string;
  recipientName?: string;
  memo?: string;
  createdAt: any;
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

export type Consumable = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minThreshold: number;
  unitCost: number; // For stock valuation
  updatedAt: any;
};

export type LabTool = {
  id: string;
  name: string;
  serialNumber?: string;
  status: 'excellent' | 'good' | 'warning' | 'service_needed';
  usageCount: number;
  usageThreshold: number;
  lastMaintenance: any;
  updatedAt: any;
};

export type TechnicianLog = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  type: 'info' | 'technical' | 'incident' | 'handover';
  createdAt: any;
};

export type ConsumptionLog = {
  id: string;
  consumableId: string;
  consumableName: string;
  quantity: number;
  type: 'usage' | 'restock';
  userId: string;
  createdAt: any;
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
  source?: string;
  sourceId?: string;
  piValue?: number;
};

export type Quote = {
    id: string;
    userId: string;
    customerName: string;
    customerEmail?: string;
    businessName?: string;
    items: OrderItem[];
    total: number;
    status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
    expiryDate: any;
    auditId?: string; // Link to an audit if needed
    notes?: string;
    createdAt: any;
    updatedAt: any;
};

export type Subscription = {
  id: string;
  userId: string;
  customerName: string;
  serviceTitle: string;
  planType: 'monthly' | 'quarterly' | 'yearly';
  amount: number;
  status: 'active' | 'past_due' | 'cancelled' | 'pending';
  nextBillingDate: any;
  startDate: any;
  notes?: string;
  createdAt: any;
  updatedAt: any;
};

export type UsedPart = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  createdAt: any;
};

export type SupportTicket = {
  id: string;
  userId: string;
  customerName: string;
  productName: string;
  issueDescription: string;
  status: 'pending' | 'diagnosing' | 'repairing' | 'ready' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  imageUrl?: string;
  subscriptionId?: string; // Lien optionnel vers un contrat
  subscriptionTitle?: string;
  technicianId?: string; // Track who handled it
  technicianName?: string;
  createdAt: any;
  updatedAt: any;
};

export type SupportMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  imageUrl?: string;
  createdAt: any;
};

export type RemoteSupportSession = {
  id: string;
  userId: string;
  customerName: string;
  software: 'anydesk' | 'teamviewer';
  remoteId: string;
  issueDescription: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
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

export type MaintenanceLog = {
  id: string;
  type: 'repair' | 'upgrade' | 'checkup' | 'cleaning';
  description: string;
  technicianName: string;
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
  hasReview?: boolean;
};

export type TechnicalAudit = {
  id: string;
  userId: string;
  businessName: string;
  contactPerson: string;
  phone: string;
  location: string;
  needs: string[];
  description: string;
  status: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  scheduledDate?: any;
  reportUrl?: string;
  createdAt: any;
  updatedAt: any;
};

export type AcademyReview = {
  id: string;
  bookingId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  serviceId: string;
  serviceTitle: string;
  rating: number;
  comment: string;
  createdAt: any;
};

export type Sale = {
  id: string;
  userId: string;
  items: { productId: string; quantity: number; price: number }[];
  totalAmount: number;
  totalCDF?: number;
  status: string;
  paymentMode?: string;
  createdAt: any;
  customerName?: string;
};

export type PaymentMode = "CASH" | "MOBILE_MONEY" | "PI_NETWORK";
