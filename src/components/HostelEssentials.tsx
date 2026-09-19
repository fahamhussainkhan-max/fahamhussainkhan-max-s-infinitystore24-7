import React from 'react';
import { Home, Sparkles } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { Product } from '../types';

interface HostelEssentialsProps {
  products: Product[];
  cartQuantities: Record<string, number>;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onToastMessage: (msg: string) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
}

export const HostelEssentials: React.FC<HostelEssentialsProps> = ({
  products,
  cartQuantities,
  onAddToCart,
  onUpdateQuantity,
  onToastMessage,
  wishlist,
  onToggleWishlist,
}) => {
  // Products that belong to hostel essentials, personal care, electronics or daily supplies
  const hostelItems = products.filter(
    (p) =>
      p.category === 'hostel-essentials' ||
      p.category === 'personal-care' ||
      p.category === 'essentials' ||
      p.tags?.includes('Hostel')
  );

  return (
    <section id="hostel-essentials" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-800 text-xs font-black uppercase tracking-wider mb-1.5">
            <Home className="w-3.5 h-3.5 text-[#30D158]" />
            <span>Room & Hygiene Restock</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#111111] font-display tracking-tight">
            🏠 Hostel Essentials
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Toiletries, detergent, chargers, notebooks & emergency medical care without leaving your block.
          </p>
        </div>

        <div className="text-xs font-bold text-gray-400">
          Heavy items delivered to your block entrance
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
        {hostelItems.slice(0, 8).map((prod) => (
          <ProductCard
            key={prod.id}
            product={prod}
            quantityInCart={cartQuantities[prod.id] || 0}
            onAddToCart={onAddToCart}
            onUpdateQuantity={onUpdateQuantity}
            onToastMessage={onToastMessage}
            isWishlisted={wishlist.includes(prod.id)}
            onToggleWishlist={onToggleWishlist}
            variant="light"
          />
        ))}
      </div>
    </section>
  );
};
