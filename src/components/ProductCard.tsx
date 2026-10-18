import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, Heart, Check } from 'lucide-react';
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
  isStoreOpen?: boolean;
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
  isStoreOpen = true,
}) => {
  const [justAdded, setJustAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Live stock calculations
  const availableStock = typeof product.stock === 'number'
    ? product.stock
    : (typeof product.stockCount === 'number' ? product.stockCount : 10);
  const isOutOfStock = availableStock <= 0 || product.inStock === false;
  const isMaxStockReached = quantityInCart >= availableStock;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isStoreOpen) {
      if (onToastMessage) {
        onToastMessage('⚠️ Store is currently closed for orders.');
      }
      return;
    }
    if (isOutOfStock) {
      if (onToastMessage) {
        onToastMessage(`⚠️ "${product.name}" is currently out of stock.`);
      }
      return;
    }
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    } catch {}
    if (product.minQuantity && product.minQuantity > 1 && quantityInCart === 0) {
      onUpdateQuantity(product.id, Math.min(product.minQuantity, availableStock));
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
    if (!isStoreOpen) {
      if (onToastMessage) {
        onToastMessage('⚠️ Store is currently closed for orders.');
      }
      return;
    }
    if (isOutOfStock) {
      if (onToastMessage) {
        onToastMessage(`⚠️ "${product.name}" is currently out of stock.`);
      }
      return;
    }
    if (isMaxStockReached) {
      if (onToastMessage) {
        onToastMessage(`⚠️ Only ${availableStock} in stock.`);
      }
      return;
    }
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(12);
      }
    } catch {}
    onUpdateQuantity(product.id, quantityInCart + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    } catch {}
    if (product.minQuantity && product.minQuantity > 1 && quantityInCart <= product.minQuantity) {
      onUpdateQuantity(product.id, 0);
    } else {
      onUpdateQuantity(product.id, Math.max(0, quantityInCart - 1));
    }
  };

  // Lightweight GPU-accelerated 3D tilt for desktop & touch micro-motion
  const [tiltStyle, setTiltStyle] = useState<{ transform: string; transition: string }>({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)',
    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Subtle, modern tilt angle (max 4.5deg) - energetic yet clean
    const rotateX = -((y - centerY) / centerY) * 4.5;
    const rotateY = ((x - centerX) / centerX) * 4.5;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(0)`,
      transition: 'transform 0.08s ease-out',
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)',
      transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
    });
  };

  const isDark = variant === 'dark';

  return (
    <div className="h-full relative select-none" style={{ perspective: '1000px' }}>
      <div
        id={`product-card-${product.id}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: tiltStyle.transform,
          transition: tiltStyle.transition,
          willChange: 'transform',
        }}
        className={`relative group rounded-2xl p-3 flex flex-col justify-between overflow-hidden h-full touch-manipulation transform-gpu hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 ease-out ${
          isHighlighted
            ? 'ring-2 ring-emerald-500 shadow-lg'
            : ''
        } ${
          isDark
            ? 'bg-neutral-900 border border-neutral-900/60 hover:border-emerald-500/80 shadow-[0_0_15px_rgba(0,0,0,0.4)] hover:shadow-[0_0_22px_rgba(16,185,129,0.25)]'
            : 'bg-white border border-neutral-900/40 hover:border-emerald-500/80 shadow-[0_0_15px_rgba(0,0,0,0.08)] hover:shadow-[0_0_20px_rgba(16,185,129,0.22)]'
        }`}
      >
        {/* Deep Inner "Stage" Frame (Contrast & Visual Polish) */}
        <div className={`relative w-full aspect-square rounded-2xl p-4 flex items-center justify-center overflow-hidden border transition-colors ${
          isDark
            ? 'bg-neutral-800/70 border-neutral-700/50'
            : 'bg-neutral-100/90 border-neutral-200/50'
        }`}>
          {/* Discount / Status Badges (Top-Left of frame) */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start pointer-events-none">
            {isOutOfStock ? (
              <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                Out of Stock
              </span>
            ) : product.discount ? (
              <span className="bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                {product.discount}
              </span>
            ) : null}
            {!isOutOfStock && product.minQuantity && product.minQuantity > 1 && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                Min {product.minQuantity}
              </span>
            )}
          </div>

          {/* Wishlist Heart Button (Top-Right of frame) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onToggleWishlist) onToggleWishlist(product.id);
            }}
            className={`absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full shadow-sm hover:scale-110 active:scale-90 transition-transform duration-150 touch-manipulation cursor-pointer ${
              isWishlisted
                ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800'
                : isDark
                ? 'text-neutral-400 hover:text-white bg-neutral-900/80 backdrop-blur-sm border border-neutral-700'
                : 'text-neutral-400 hover:text-rose-500 bg-white/90 backdrop-blur-sm border border-neutral-200/60'
            }`}
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`w-3.5 h-3.5 transition-transform ${
                isWishlisted ? 'fill-rose-500 text-rose-500 scale-110' : ''
              }`}
            />
          </button>

          {/* Image Placeholder Skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-neutral-200/50 dark:bg-neutral-800/50 rounded-xl animate-pulse" />
          )}

          {/* Product Image with micro-float on hover */}
          <img
            src={product.image}
            alt={product.name}
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-contain drop-shadow-md group-hover:scale-105 group-hover:-translate-y-0.5 transition-transform duration-300 ease-out transform-gpu ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } ${isOutOfStock ? 'grayscale opacity-40' : ''}`}
            loading="lazy"
          />

          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-neutral-900 text-white shadow-sm">
                Sold Out
              </span>
            </div>
          )}

          {/* Added Feedback Pop-up */}
          <AnimatePresence>
            {justAdded && (
              <motion.div
                key="just-added-badge"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="pointer-events-none absolute inset-0 m-auto w-28 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center gap-1.5 text-xs font-bold shadow-lg z-20"
              >
                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                <span>Added</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Product Information & Hierarchy */}
        <div className="mt-2.5 flex-1 flex flex-col justify-between">
          <div>
            {/* Category / Subtitle - sharp, tiny dark-grey uppercase */}
            <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-0.5 truncate">
              {product.category.replace('-', ' ')}
            </div>

            {/* Product Title - bold deep green / almost black */}
            <h3
              className={`text-sm font-extrabold line-clamp-2 leading-tight min-h-[2.5rem] transition-colors ${
                isDark
                  ? 'text-neutral-100 group-hover:text-emerald-400'
                  : 'text-neutral-800 group-hover:text-emerald-700'
              }`}
              title={product.name}
            >
              {product.name}
            </h3>

            {/* Pack Size / Quantity */}
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">
              {product.unit}
            </div>

            {/* Prominent Stock Status Indicator */}
            <div className="mb-1">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 text-rose-600 font-semibold text-xs mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                  Out of Stock
                </span>
              ) : availableStock && availableStock <= 3 ? (
                <span className="inline-flex items-center gap-1.5 text-amber-600 font-semibold text-xs mt-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                  {availableStock === 1 ? 'Only 1 left' : `Only ${availableStock} left`}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium text-xs mt-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] inline-block animate-pulse" />
                  In Stock
                </span>
              )}
            </div>
          </div>

          {/* Price & Action Button Row (Bottom Alignment) */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100/80 dark:border-neutral-800">
            {/* Pricing */}
            <div className="flex items-baseline">
              <span className={`text-base font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                ₹{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs text-neutral-400 line-through font-normal ml-1.5">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>

            {/* Action / "Add" / "Closed" Button */}
            <div>
              {quantityInCart === 0 ? (
                <button
                  type="button"
                  disabled={!isStoreOpen || isOutOfStock}
                  onClick={handleAdd}
                  className={`touch-manipulation cursor-pointer flex items-center justify-center gap-1 text-xs px-3.5 py-1.5 rounded-xl transition-all ${
                    !isStoreOpen || isOutOfStock
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 font-medium cursor-not-allowed border border-neutral-200/60 dark:border-neutral-700'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm hover:shadow active:scale-95'
                  }`}
                >
                  {!isOutOfStock && isStoreOpen && <Plus className="w-3.5 h-3.5 stroke-[2.5]" />}
                  <span>
                    {!isStoreOpen
                      ? 'Closed'
                      : isOutOfStock
                      ? 'Out of Stock'
                      : product.minQuantity && product.minQuantity > 1
                      ? `Add (${product.minQuantity}+)`
                      : 'Add'}
                  </span>
                </button>
              ) : (
                <div className="flex items-center rounded-xl bg-emerald-600 text-white p-0.5 shadow-sm border border-emerald-500/40 touch-manipulation">
                  <button
                    type="button"
                    onClick={handleDecrement}
                    className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center hover:bg-emerald-700 active:scale-90 transition-transform duration-150 rounded-lg text-white cursor-pointer touch-manipulation"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3 stroke-[2.5]" />
                  </button>
                  <span className="px-2 text-xs sm:text-sm font-extrabold min-w-[18px] text-center select-none text-white">
                    {quantityInCart}
                  </span>
                  <button
                    type="button"
                    disabled={isMaxStockReached}
                    onClick={handleIncrement}
                    className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg transition-transform active:scale-90 duration-150 touch-manipulation ${
                      isMaxStockReached
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-emerald-700 cursor-pointer text-white'
                    }`}
                    aria-label="Increase quantity"
                    title={isMaxStockReached ? `Max stock (${availableStock}) reached` : 'Increase'}
                  >
                    <Plus className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
