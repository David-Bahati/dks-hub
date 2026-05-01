
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePageFinal from './page';
import { getDocs, collection } from 'firebase/firestore';
import { Product } from '@/lib/types';
import '@testing-library/jest-dom';

// Mocking Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  db: jest.fn(), // Mock the db export from '@/lib/firebase' if needed
}));

// Mocking next/link
jest.mock('next/link', () => {
    return ({children, href}: {children: React.ReactNode, href: string}) => {
        return <a href={href}>{children}</a>
    }
});

// Mocking ShopNavbar
jest.mock('@/components/layout/ShopNavbar', () => ({
    ShopNavbar: () => <div data-testid="shop-navbar">ShopNavbar</div>
}));


describe('HomePageFinal', () => {
  const mockProducts: Product[] = [
    { id: '1', name: 'Laptop', description: 'A powerful laptop', price: 1200, stock: 10, image: 'url1' },
    { id: '2', name: 'Keyboard', description: 'A mechanical keyboard', price: 75, stock: 25, image: 'url2' },
  ];

  beforeEach(() => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: mockProducts.map(product => ({
        id: product.id,
        data: () => ({ name: product.name, description: product.description, price: product.price, stock: product.stock, image: product.image }),
      })),
    });
    (collection as jest.Mock).mockReturnValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the hero section correctly', () => {
    render(<HomePageFinal />);
    expect(screen.getByText(/Qualité Informatique/i)).toBeInTheDocument();
    expect(screen.getByText(/au cœur de l'Ituri./i)).toBeInTheDocument();
    expect(screen.getByText(/Découvrir le Stock/i)).toBeInTheDocument();
  });

  it('fetches and displays products', async () => {
    render(<HomePageFinal />);

    await waitFor(() => {
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      expect(screen.getByText('Keyboard')).toBeInTheDocument();
    });
  });

  it('filters products based on search term', async () => {
    render(<HomePageFinal />);

    await waitFor(() => {
        expect(screen.getByText('Laptop')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Chercher un accessoire.../i);
    fireEvent.change(searchInput, { target: { value: 'Laptop' } });

    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.queryByText('Keyboard')).not.toBeInTheDocument();
  });

  it('renders the footer', () => {
    render(<HomePageFinal />);
    expect(screen.getByText(/DKS ShopManager. Tous droits réservés./i)).toBeInTheDocument();
  });
});
