
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';

interface ProductCardProps {
    product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
    const { addToCart } = useCart();

    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group">
            <div className="aspect-w-16 aspect-h-9 bg-gray-900 overflow-hidden">
                <Image 
                    src={product.image || '/placeholder.png'} 
                    alt={product.name} 
                    width={400}
                    height={225}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
            </div>
            <div className="p-4">
                <h3 className="font-bold text-lg text-white truncate">{product.name}</h3>
                <div className="flex justify-between items-center mt-4">
                    <p className="font-black text-xl text-white">{product.price.toLocaleString()} <span className="text-xs text-gray-400">CDF</span></p>
                    <Button onClick={() => addToCart(product)} className="bg-primary hover:bg-primary/80">Ajouter</Button>
                </div>
            </div>
        </div>
    );
}
