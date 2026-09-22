import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
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
  isHighlighted?: boolean;
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
  isHighlighted = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // 3D Tilt interaction using Spring physics
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 260, damping: 22 });
  const mouseYSpring = useSpring(y, { stiffness: 260, damping: 22 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['9deg', '-9deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-9deg', '9deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.minQuantity && product.minQuantity > 1 && quantityInCart === 0) {
      onUpdateQuantity(product.id, product.minQuantity);
    } else {
      onAddToCart(product);
    }
    setJustAdded(true);
    if (onToastMessage) {
      onToastMessage(`Added ${product.name.slice(0, 22)}... to cart ✓`);
    }
    setTimeout(() => setJustAdded(false), 1400);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdateQuantity(product.id, quantityInCart + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.minQuantity && product.minQuantity > 1 && quantityInCart <= product.minQuantity) {
      onUpdateQuantity(product.id, 0);
    } else {
      onUpdateQuantity(product.id, Math.max(0, quantityInCart - 1));
    }
  };

  const isDark = variant === 'dark';

  return (
    <div
      style={{
        perspective: '800px',
      }}
      className="h-full relative"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.2s ease-out',
          willChange: 'transform',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        whileHover={{ y: -6, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 380, damping: 24 }}
        id={`product-card-${product.id}`}
        className={`relative group rounded-3xl p-3.5 sm:p-4 transition-all duration-300 flex flex-col justify-between overflow-hidden h-full touch-manipulation ${
          isHighlighted
            ? 'ring-4 ring-[#0A84FF] shadow-[0_0_35px_rgba(10,132,255,0.45)] scale-[1.03] animate-pulse z-30'
            : ''
        } ${
          isDark
            ? 'bg-[#1a1a1a] border border-white/10 hover:border-purple-500/50 hover:shadow-[0_20px_40px_-10px_rgba(191,90,242,0.35)]'
            : 'bg-white border border-gray-200/90 hover:border-blue-400/60 hover:shadow-[0_20px_40px_-10px_rgba(10,132,255,0.18)]'
        }`}
      >
        {/* Dynamic ambient 3D specular sheen - positioned at z-0 behind interactive layers */}
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl z-0"
          style={{
            background: isDark
              ? 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.1), transparent 70%)'
              : 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.6), transparent 70%)',
          }}
        />

        {/* Top badges & Wishlist row */}
        <div className="relative z-20 pointer-events-auto flex items-center justify-between mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
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
            {product.minQuantity && product.minQuantity > 1 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-blue-50 text-[#0A84FF] border border-blue-200">
                Min. {product.minQuantity} sheets
              </span>
            )}
            {product.isLateNight && isDark && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-purple-500/20 text-purple-300 border border-purple-500/30">
                🌙 Night Pick
              </span>
            )}
          </div>

          {/* Wishlist Heart Button */}
          <motion.button
            type="button"
            style={{ pointerEvents: 'auto' }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onToggleWishlist) onToggleWishlist(product.id);
            }}
            className={`relative z-20 pointer-events-auto cursor-pointer p-1.5 rounded-full transition-all duration-200 ${
              isWishlisted
                ? 'text-[#FF3B30] bg-red-50'
                : isDark
                ? 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'
                : 'text-gray-400 hover:text-[#FF3B30] bg-gray-50 hover:bg-red-50'
            }`}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                isWishlisted ? 'fill-[#FF3B30] scale-110' : ''
              }`}
            />
          </motion.button>
        </div>

        {/* Product Image with smooth hover scale and skeleton shimmer placeholder */}
        <div className="relative z-10 w-full aspect-square my-2 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center p-2.5">
          {/* Skeleton shimmer placeholder */}
          {!imageLoaded && (
            <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-2xl flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gray-300/50 animate-pulse" />
            </div>
          )}

          <img
            src={product.image}
            alt={product.name}
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-contain mix-blend-multiply transition-all duration-500 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
          />

          {/* Micro "Added to cart" feedback pop-up badge with spring animation - non-blocking */}
          <AnimatePresence>
            {justAdded && (
              <motion.div
                initial={{ scale: 0.4, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -15 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                className="pointer-events-none absolute inset-0 m-auto w-36 h-10 rounded-full bg-[#111111]/95 backdrop-blur-md text-white flex items-center justify-center gap-1.5 text-xs font-black shadow-2xl border border-white/20 z-30"
              >
                <Check className="w-4 h-4 text-[#30D158] stroke-[3]" />
                <span>Added to Bag!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Product Details */}
        <div className="relative z-10 mt-1 flex-1 flex flex-col justify-between">
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
          <div className="relative z-20 pt-2 border-t border-gray-100/80 flex items-center justify-between pointer-events-auto">
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

            {/* Transformative Quick Add Button / Quantity Selector with Spring Animations */}
            <div className="relative z-20 pointer-events-auto">
              {quantityInCart === 0 ? (
                <motion.button
                  type="button"
                  onClick={handleAdd}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  style={{ pointerEvents: 'auto' }}
                  className={`relative z-20 pointer-events-auto cursor-pointer flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-extrabold shadow-sm active:scale-95 ${
                    isDark
                      ? 'bg-white text-black hover:bg-gray-200'
                      : 'bg-[#111111] hover:bg-[#0A84FF] text-white shadow-[0_4px_12px_rgba(0,0,0,0.12)]'
                  }`}
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{product.minQuantity && product.minQuantity > 1 ? `Add (Min ${product.minQuantity})` : 'Add'}</span>
                </motion.button>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{ pointerEvents: 'auto' }}
                  className="relative z-20 pointer-events-auto flex items-center rounded-xl bg-[#0A84FF] text-white p-0.5 shadow-md"
                >
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.82 }}
                    onClick={handleDecrement}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{ pointerEvents: 'auto' }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors cursor-pointer pointer-events-auto"
                    aria-label="Decrease count"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </motion.button>
                  <span className="px-2 text-xs font-black min-w-[20px] text-center select-none pointer-events-none">
                    {quantityInCart}
                  </span>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.82 }}
                    onClick={handleIncrement}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{ pointerEvents: 'auto' }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors cursor-pointer pointer-events-auto"
                    aria-label="Increase count"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
