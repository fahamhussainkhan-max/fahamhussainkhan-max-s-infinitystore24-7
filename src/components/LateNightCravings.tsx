import React from 'react';
import { motion } from 'motion/react';
import { Moon, Sparkles, Clock, Zap } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { Product } from '../types';

interface LateNightCravingsProps {
  products: Product[];
  cartQuantities: Record<string, number>;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onToastMessage: (msg: string) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
}

export const LateNightCravings: React.FC<LateNightCravingsProps> = ({
  products,
  cartQuantities,
  onAddToCart,
  onUpdateQuantity,
  onToastMessage,
  wishlist,
  onToggleWishlist,
}) => {
  const lateNightItems = products.filter((p) => p.isLateNight);

  return (
    <section className="w-full bg-[#121214] border-y border-neutral-800 text-white py-10 sm:py-14 my-6 sm:my-8 relative overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Night Dispatch • 8:00 PM – 5:59 AM</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-display tracking-tight">
              Late Night Essentials
            </h2>

            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl font-normal leading-relaxed">
              Instant noodles, hot coffee, chilled beverages and quick bites delivered right to your hostel block through the night.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-800/80 border border-neutral-700 text-xs font-medium text-neutral-300 self-start sm:self-auto">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>⚡ Delivery at ₹15 (50% Launch Offer • Free on ₹500+)</span>
          </div>
        </div>

        {/* Product Cards Grid with dark variant */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {lateNightItems.map((prod, idx) => (
            <ProductCard
              key={prod.id ? `${prod.id}-${idx}` : `craving-prod-${idx}`}
              product={prod}
              quantityInCart={cartQuantities[prod.id] || 0}
              onAddToCart={onAddToCart}
              onUpdateQuantity={onUpdateQuantity}
              onToastMessage={onToastMessage}
              isWishlisted={wishlist.includes(prod.id)}
              onToggleWishlist={onToggleWishlist}
              variant="dark"
            />
          ))}
        </div>
      </div>
    </section>
  );
};
