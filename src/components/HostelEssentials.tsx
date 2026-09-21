import React from 'react';
import { Cpu, Sparkles } from 'lucide-react';
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
  // Filter active tech, cables, adapters, and study essentials
  const techAndStudyItems = products.filter(
    (p) =>
      p.category === 'electronics' ||
      p.category === 'stationery' ||
      p.tags?.includes('Tech') ||
      p.tags?.includes('Cable')
  );

  return (
    <section id="hostel-essentials" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-800 text-xs font-black uppercase tracking-wider mb-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#0A84FF]" />
            <span>Electronics, Cables & Study Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#111111] font-display tracking-tight">
            ⚡ Tech & Study Restock
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Fast charging braided cables, earphones, OTG adapters, pens & registers dispatched to your block.
          </p>
        </div>

        <div className="text-xs font-bold text-gray-400">
          Delivered in 10-15 mins with 0 delivery delays
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
        {techAndStudyItems.slice(0, 8).map((prod) => (
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
