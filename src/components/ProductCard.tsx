import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Star, Heart, Check, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  quantityInCart: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onToastMessage?: (msg: string) => void;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
  variant?: 'light' | 'dark';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantityInCart,
  onAddToCart,
  onUpdateQuantity,
  onToastMessage,
  isWishlisted = false,
  onToggleWishlist,
  variant = 'light',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setJustAdded(true);
    if (onToastMessage) {
      onToastMessage(`Added ${product.name.slice(0, 22)}... to cart ✓`);
    }
    setTimeout(() => setJustAdded(false), 1400);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity(product.id, quantityInCart + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity(product.id, Math.max(0, quantityInCart - 1));
  };

  const isDark = variant === 'dark';

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`relative group rounded-3xl p-3.5 sm:p-4 transition-all duration-300 flex flex-col justify-between overflow-hidden select-none ${
        isDark
          ? 'bg-[#1a1a1a] border border-white/10 hover:border-purple-500/50 hover:shadow-[0_16px_35px_-8px_rgba(191,90,242,0.3)]'
          : 'bg-white border border-gray-200/90 hover:border-gray-300 hover:shadow-[0_16px_35px_-8px_rgba(0,0,0,0.12)]'
      }`}
    >
      {/* Top badges & Wishlist row */}
      <div className="relative z-10 flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {product.isPopular && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#FF3B30] to-[#FF9F0A] text-white shadow-xs">
              <Sparkles className="w-2.5 h-2.5" />
              Popular
            </span>
          )}
          {product.discount && !product.isPopular && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-[#30D158]/15 text-[#248a3d] border border-[#30D158]/30">
              {product.discount}
            </span>
          )}
          {product.isLateNight && isDark && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-purple-500/20 text-purple-300 border border-purple-500/30">
              🌙 Night Pick
            </span>
          )}
        </div>

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleWishlist) onToggleWishlist(product.id);
          }}
          className={`p-1.5 rounded-full transition-all duration-200 ${
            isWishlisted
              ? 'text-[#FF3B30] bg-red-50'
              : isDark
              ? 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'
              : 'text-gray-400 hover:text-[#FF3B30] bg-gray-50 hover:bg-red-50'
          }`}
          title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={`w-4 h-4 transition-transform ${
              isWishlisted ? 'fill-[#FF3B30] scale-110' : ''
            }`}
          />
        </button>
      </div>

      {/* Product Image with smooth hover scale */}
      <div className="relative w-full aspect-square my-2 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center p-2">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-108"
          loading="lazy"
        />

        {/* Micro "Added to cart" feedback badge */}
        <AnimatePresence>
          {justAdded && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -10 }}
              className="absolute inset-0 m-auto w-32 h-10 rounded-full bg-[#111111]/90 backdrop-blur-md text-white flex items-center justify-center gap-1.5 text-xs font-bold shadow-xl border border-white/20"
            >
              <Check className="w-3.5 h-3.5 text-[#30D158]" />
              <span>Added ✓</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Details */}
      <div className="z-10 mt-1 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Unit label */}
          <div className="flex items-center justify-between text-[11px] font-medium text-gray-400 mb-1">
            <span className="capitalize">{product.category.replace('-', ' ')}</span>
            <span>{product.unit}</span>
          </div>

          {/* Name */}
          <h3
            className={`text-xs sm:text-sm font-bold line-clamp-2 leading-snug mb-1.5 transition-colors ${
              isDark ? 'text-white group-hover:text-[#0A84FF]' : 'text-gray-900 group-hover:text-[#0A84FF]'
            }`}
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Rating & Availability */}
          <div className="flex items-center gap-2 text-[11px] font-semibold mb-3">
            <div className="flex items-center gap-0.5 text-amber-500">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating}</span>
              <span className="text-gray-400 font-normal">({product.reviewsCount})</span>
            </div>
            <span className="text-gray-300">•</span>
            <span className="text-[#30D158] font-bold">
              {product.stockCount ? `${product.stockCount} in stock` : 'In Stock'}
            </span>
          </div>
        </div>

        {/* Pricing and Quick Add System */}
        <div className="pt-2 border-t border-gray-100/80 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-base sm:text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                ₹{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-gray-400 line-through font-medium">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
          </div>

          {/* Transformative Quick Add Button / Quantity Selector */}
          <div>
            {quantityInCart === 0 ? (
              <motion.button
                type="button"
                onClick={handleAdd}
                whileTap={{ scale: 0.9 }}
                className={`relative flex items-center justify-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 shadow-sm active:scale-95 ${
                  isDark
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-[#111111] hover:bg-[#0A84FF] text-white'
                }`}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden sm:inline">Add</span>
              </motion.button>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center rounded-xl bg-[#0A84FF] text-white p-0.5 shadow-md"
              >
                <button
                  type="button"
                  onClick={handleDecrement}
                  className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors active:scale-90"
                  aria-label="Decrease count"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <span className="px-2 text-xs font-black min-w-[20px] text-center">
                  {quantityInCart}
                </span>
                <button
                  type="button"
                  onClick={handleIncrement}
                  className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors active:scale-90"
                  aria-label="Increase count"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
