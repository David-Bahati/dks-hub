
import { AppUser, Order, Product } from './types';
import { Timestamp } from 'firebase/firestore';

// Mock Users
export const MOCK_USERS: AppUser[] = [
  {
    uid: 'user1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: Timestamp.now()
  },
  {
    uid: 'user2',
    email: 'customer@example.com',
    name: 'John Doe',
    role: 'customer',
    createdAt: Timestamp.now()
  }
];

// Mock Products
export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Logitech G Pro X',
    description: 'Clavier mécanique haute performance.',
    category: 'keyboard',
    sellingPrice: 159.99,
    stockQuantity: 15,
    imageUrl: 'https://picsum.photos/seed/keyboard1/600/400',
    isPublished: true
  },
  {
    id: 'p2',
    name: 'Razer DeathAdder V3',
    description: 'Souris gaming ultra-légère.',
    category: 'mouse',
    sellingPrice: 69.99,
    stockQuantity: 24,
    imageUrl: 'https://picsum.photos/seed/mouse1/600/400',
    isPublished: true
  }
];

// Mock Orders
export const MOCK_ORDERS: Omit<Order, 'id'>[] = [
  {
    customer: 'John Doe',
    items: [{ productId: 'p2', productName: 'Razer DeathAdder V3', quantity: 2, price: 69.99 }],
    total: 139.98,
    status: 'Terminé',
    date: Timestamp.fromDate(new Date(Date.now() - 43200000)) // ~12 hours ago
  },
  {
    customer: 'Admin User',
    items: [
      { productId: 'p1', productName: 'Logitech G Pro X', quantity: 1, price: 159.99 },
      { productId: 'p2', productName: 'Razer DeathAdder V3', quantity: 1, price: 69.99 }
    ],
    total: 229.98,
    status: 'En attente',
    date: Timestamp.fromDate(new Date(Date.now() - 86400000)) // ~24 hours ago
  }
];
