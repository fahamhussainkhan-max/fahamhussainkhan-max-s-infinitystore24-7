import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { CartItem } from '../types';

interface FloatingCartProps {
  cartItems: CartItem[];
  onOpenCart: () => void;
  lastUpdated: number; // for trigger bounce animation
}

export const FloatingCart: React.FC<FloatingCartProps> = ({
  cartItems,
  onOpenCart,
  lastUpdated,
}) => {
  const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  if (totalCount === 0) return null;

  return (
    <AnimatePresence>
      {totalCount > 0 && (
        <div className="select-none pointer-events-auto">
          {/* DESKTOP: Bottom-Right Floating Pill */}
          <motion.div
            key={`desktop-cart-${lastUpdated}`}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{
              scale: [1, 1.06, 1],
              opacity: 1,
              y: 0,
            }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: 'backOut' }}
            className="hidden sm:block fixed bottom-6 right-6 z-40"
          >
            <button
              type="button"
              onClick={onOpenCart}
              className="flex items-center gap-4 bg-[#111111] hover:bg-black text-white pl-4 pr-5 py-3.5 rounded-full shadow-[0_16px_35px_-6px_rgba(0,0,0,0.45)] border border-white/15 transition-all duration-200 active:scale-95 group"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF3B30] to-[#FFD60A] text-white flex items-center justify-center shadow-md">
                  <ShoppingBag className="w-5 h-5 fill-white/20 stroke-[2.2]" />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0A84FF] text-white text-[10px] font-black flex items-center justify-center border-2 border-[#111111]">
                  {totalCount}
                </span>
              </div>

              <div className="text-left font-display">
                <div className="text-xs font-semibold text-gray-300">
                  {totalCount} {totalCount === 1 ? 'item' : 'items'} • ₹{totalPrice}
                </div>
                <div className="text-sm font-black text-white flex items-center gap-1 group-hover:text-[#FFD60A] transition-colors">
                  <span>View Cart</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </button>
          </motion.div>

          {/* MOBILE: Sticky Bottom Cart Bar */}
          <motion.div
            key={`mobile-cart-${lastUpdated}`}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="sm:hidden fixed bottom-0 inset-x-0 z-40 p-3 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-2xl"
          >
            <button
              type="button"
              onClick={onOpenCart}
              className="w-full flex items-center justify-between bg-[#111111] active:bg-black text-white px-5 py-3.5 rounded-2xl shadow-lg active:scale-98 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF3B30] to-[#FFD60A] text-white flex items-center justify-center text-xs font-black">
                  {totalCount}
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-300 font-medium leading-none">
                    {totalCount} {totalCount === 1 ? 'item' : 'items'} in bag
                  </div>
                  <div className="text-base font-black text-white leading-tight">
                    ₹{totalPrice}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-black text-[#FFD60A]">
                <span>View Cart</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
