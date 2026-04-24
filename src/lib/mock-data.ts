
import { Product, Sale, Category } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Logitech G Pro X',
    category: 'keyboard',
    purchasePrice: 120,
    sellingPrice: 159.99,
    stockQuantity: 15,
    imageUrl: 'https://picsum.photos/seed/keyboard1/600/400'
  },
  {
    id: 'p2',
    name: 'Razer DeathAdder V3',
    category: 'mouse',
    purchasePrice: 45,
    sellingPrice: 69.99,
    stockQuantity: 24,
    imageUrl: 'https://picsum.photos/seed/mouse1/600/400'
  },
  {
    id: 'p3',
    name: 'Samsung Odyssey G7',
    category: 'screen',
    purchasePrice: 450,
    sellingPrice: 599.99,
    stockQuantity: 8,
    imageUrl: 'https://picsum.photos/seed/screen1/600/400'
  },
  {
    id: 'p4',
    name: 'SteelSeries Apex 7',
    category: 'keyboard',
    purchasePrice: 130,
    sellingPrice: 179.99,
    stockQuantity: 3,
    imageUrl: 'https://picsum.photos/seed/keyboard2/600/400'
  }
];

export const MOCK_SALES: Sale[] = [
  {
    id: 's1',
    items: [{ productId: 'p1', productName: 'Logitech G Pro X', quantity: 1, price: 159.99 }],
    totalAmount: 159.99,
    paymentMode: 'MOBILE_MONEY',
    saleDate: new Date(Date.now() - 86400000).toISOString(),
    sellerId: 'user1'
  },
  {
    id: 's2',
    items: [{ productId: 'p2', productName: 'Razer DeathAdder V3', quantity: 2, price: 69.99 }],
    totalAmount: 139.98,
    paymentMode: 'PI_NETWORK',
    saleDate: new Date(Date.now() - 43200000).toISOString(),
    sellerId: 'user2'
  }
];
