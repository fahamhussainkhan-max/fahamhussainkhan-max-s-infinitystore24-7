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
    <section className="w-full bg-[#111111] text-white py-12 sm:py-16 my-8 relative overflow-hidden">
      {/* Glowing 3D ambient orbs (Blue, Purple, Pink, Yellow) */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-[#0A84FF]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#BF5AF2]/15 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-[#FF375F]/10 blur-[90px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-[#FFD60A]/10 blur-[100px] pointer-events-none" />

      {/* Subtle floating 3D stars & moon particles */}
      <motion.div
        animate={{
          y: [-8, 8, -8],
          rotate: [0, 10, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-12 right-16 hidden lg:flex items-center gap-2 p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-yellow-300 shadow-2xl"
      >
        <Moon className="w-6 h-6 fill-yellow-300" />
        <span className="text-xs font-bold text-white tracking-wide">
          Active Hours: 10 PM – 5 AM
        </span>
      </motion.div>

      {/* Subtle background twinkles */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-16 left-1/4 w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
        <div className="absolute top-32 right-1/3 w-1 h-1 rounded-full bg-purple-300 animate-ping" />
        <div className="absolute bottom-20 left-1/5 w-1.5 h-1.5 rounded-full bg-yellow-200 animate-pulse" />
        <div className="absolute top-48 left-12 w-2 h-2 rounded-full bg-pink-300/60" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Moon className="w-3.5 h-3.5 fill-purple-300" />
              <span>Hostel Midnight Dispatch</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white font-display tracking-tight">
              🌙 Late Night Cravings
            </h2>

            <p className="text-sm sm:text-base text-gray-400 mt-1 max-w-xl font-medium">
              Because assignments don't finish themselves. Instant noodles, hot coffee, chilled energy drinks & crunchy snacks delivered right outside your room.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-gray-300">
            <Clock className="w-4 h-4 text-[#FFD60A]" />
            <span>Hot & Cold Delivery Under 15m</span>
          </div>
        </div>

        {/* Product Cards Grid with dark variant */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {lateNightItems.map((prod) => (
            <ProductCard
              key={prod.id}
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
