
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
  stakedBalance?: number;
  stakingStartedAt?: any;
  lastMiningAt?: any;
  lastActivityAt?: any;
  miningPower?: number;
  completedMissionsToday?: string[];
  lastBlockRarity?: 'common' | 'rare' | 'legendary';
  walletPin?: string;
  isWalletLocked?: boolean;
  dailySpendingLimit?: number;
  todaySpent?: number;
  beneficiaryId?: string;
  beneficiaryName?: string;
  heritageThresholdDays?: number;
};

export type TokenTransaction = {
  id: string;
  userId: string;
  userName?: string;
  type: 'mint' | 'burn' | 'transfer' | 'mining' | 'staking' | 'unstaking' | 'exchange' | 'heritage';
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
  rarity?: 'common' | 'rare' | 'legendary';
};

export type GovernanceProposal = {
  id: string;
  title: string;
  description: string;
  category: 'hardware' | 'academy' | 'hub' | 'other';
  options: string[];
  status: 'active' | 'closed' | 'executed';
  createdBy: string;
  endsAt: any;
  createdAt: any;
};

export type Vote = {
  id: string;
  proposalId: string;
  userId: string;
  optionIndex: number;
  weight: number;
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

export type DailyMission = {
    id: string;
    title: string;
    description: string;
    rewardPoints: number;
    icon: string;
    targetRole?: 'staff' | 'customer' | 'all';
};

export type SupportMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  imageUrl?: string | null;
  createdAt: any;
};

export type UsedPart = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  createdAt: any;
};
