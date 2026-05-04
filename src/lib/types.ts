
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
  lastMiningAt?: any;
  miningPower?: number;
  completedMissionsToday?: string[];
};

export type TokenTransaction = {
  id: string;
  userId: string;
  userName?: string;
  type: 'mint' | 'burn' | 'transfer' | 'mining';
  pointsAmount?: number;
  tokenAmount: number;
  piTxId?: string;
  senderId?: string;
  senderName?: string;
  recipientId?: string;
  recipientName?: string;
  memo?: string;
  createdAt: any;
  direction?: 'sent' | 'received';
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

export type DailyMission = {
    id: string;
    title: string;
    description: string;
    rewardPoints: number;
    icon: string;
    targetRole?: 'staff' | 'customer' | 'all';
};
