
"use client";

import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';
import { Search } from 'lucide-react';

interface ProductListProps {
    products: Product[];
}

export function ProductList({ products }: ProductListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = products.filter(product =>
            product.name.toLowerCase().includes(lowercasedFilter)
        );
        setFilteredProducts(filtered);
    }, [searchTerm, products]);

    return (
        <div className="max-w-4xl mx-auto mt-12">
            <div className="relative mb-8">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                <input
                    type="text"
                    placeholder="Chercher un accessoire..."
                    className="w-full h-16 pl-16 pr-6 bg-[#1A1D22] border border-white/10 text-white rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))
                ) : (
                    <div className="col-span-full text-center py-12">
                        <p className="text-xl text-gray-500">{searchTerm ? 'Aucun produit ne correspond à votre recherche.' : 'Chargement des produits...'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
