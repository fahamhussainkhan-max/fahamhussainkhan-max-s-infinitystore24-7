import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap, Clock, Sparkles, Plus, Check } from 'lucide-react';
import { Product } from '../types';

interface FlashDealsProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  cartQuantities: Record<string, number>;
  onToastMessage: (msg: string) => void;
}

export const FlashDeals: React.FC<FlashDealsProps> = ({
  products,
  onAddToCart,
  cartQuantities,
  onToastMessage,
}) => {
  // Live ticking countdown timer (starts at 02h 45m 18s)
  const [secondsLeft, setSecondsLeft] = useState(9918);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 10800));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsLeft / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  const flashDealItems = products.filter((p) => p.isFlashDeal);

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] text-xs font-black uppercase tracking-wider mb-1.5">
            <Zap className="w-3.5 h-3.5 fill-[#FF3B30]" />
            <span>Limited Campus Inventory</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#111111] font-display tracking-tight">
            ⚡ Flash Deals
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Unbeatable student discounts refreshed every 3 hours.
          </p>
        </div>

        {/* Live Tasteful Countdown Display */}
        <div className="flex items-center gap-2 bg-[#111111] text-white px-4 py-2 rounded-2xl shadow-md border border-gray-800">
          <Clock className="w-4 h-4 text-[#FFD60A]" />
          <span className="text-xs font-bold text-gray-300">Ends in:</span>
          <div className="flex items-center gap-1 font-mono text-sm sm:text-base font-black text-[#FFD60A]">
            <span className="px-1.5 py-0.5 rounded bg-white/10">{pad(hours)}h</span>
            <span>:</span>
            <span className="px-1.5 py-0.5 rounded bg-white/10">{pad(minutes)}m</span>
            <span>:</span>
            <span className="px-1.5 py-0.5 rounded bg-white/10">{pad(seconds)}s</span>
          </div>
        </div>
      </div>

      {/* Colourful Deal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {flashDealItems.map((prod, idx) => {
          const qty = cartQuantities[prod.id] || 0;
          const claimedPercent = prod.claimedPercent || 80;

          // Distinct subtle border & accent per deal card
          const cardAccents = [
            { bg: 'from-amber-50 to-orange-50/40', border: 'border-amber-200', tagBg: 'bg-amber-500' },
            { bg: 'from-blue-50 to-indigo-50/40', border: 'border-blue-200', tagBg: 'bg-[#0A84FF]' },
            { bg: 'from-rose-50 to-red-50/40', border: 'border-rose-200', tagBg: 'bg-[#FF3B30]' },
          ];
          const accent = cardAccents[idx % cardAccents.length];

          return (
            <motion.div
              key={prod.id}
              whileHover={{ y: -4 }}
              className={`rounded-3xl bg-gradient-to-b ${accent.bg} border ${accent.border} p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between`}
            >
              {/* Top Badge: Discount & Remaining */}
              <div className="flex items-center justify-between mb-3">
                <span className={`${accent.tagBg} text-white text-xs font-black px-2.5 py-1 rounded-xl shadow-xs uppercase tracking-wider`}>
                  {prod.discount || 'SPECIAL'}
                </span>
                <span className="text-[11px] font-bold text-gray-500">
                  {prod.stockCount} left only
                </span>
              </div>

              {/* Product Image */}
              <div className="relative w-full h-40 rounded-2xl bg-white p-3 shadow-inner flex items-center justify-center my-2 overflow-hidden">
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 hover:scale-108"
                />
              </div>

              {/* Details */}
              <div className="my-2">
                <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                  {prod.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                  {prod.description}
                </p>

                {/* Progress bar of claimed items */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1">
                    <span>Claimed</span>
                    <span className="text-gray-900">{claimedPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FF9F0A] to-[#FF3B30] transition-all duration-1000"
                      style={{ width: `${claimedPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Price & Quick Add */}
              <div className="pt-3 mt-1 border-t border-gray-200/70 flex items-center justify-between">
                <div>
                  <div className="text-lg font-black text-gray-900">
                    ₹{prod.price}
                  </div>
                  {prod.originalPrice && (
                    <div className="text-xs text-gray-400 line-through">
                      ₹{prod.originalPrice}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onAddToCart(prod);
                    onToastMessage(`Grabbed flash deal: ${prod.name.slice(0, 18)}... ✓`);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] hover:bg-[#0A84FF] text-white text-xs font-black transition-all active:scale-95 shadow-md"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>{qty > 0 ? `Added (${qty})` : 'Claim Deal'}</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
