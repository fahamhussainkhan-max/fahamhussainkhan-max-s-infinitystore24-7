import React from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight, Sparkles, Plus } from 'lucide-react';
import { Product } from '../types';

interface WishlistViewProps {
  wishlistIds: string[];
  products: Product[];
  cartQuantities: Record<string, number>;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onClearWishlist: () => void;
  onMoveAllToCart: () => void;
  onExploreCatalog: () => void;
  onToastMessage: (msg: string) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  wishlistIds,
  products,
  cartQuantities,
  onAddToCart,
  onToggleWishlist,
  onClearWishlist,
  onMoveAllToCart,
  onExploreCatalog,
  onToastMessage,
}) => {
  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));

  const handleMoveToCart = (product: Product) => {
    onAddToCart(product);
    onToastMessage(`Moved ${product.name} to your campus bag! 🛍️`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-red-50 text-[#FF3B30] flex items-center justify-center">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-display">
              Saved Wishlist
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Persisted campus favourites. Keep tabs on exam supplies, midnight cravings & flash deals.
          </p>
        </div>

        {wishlistedProducts.length > 0 && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClearWishlist}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>

            <button
              type="button"
              onClick={onMoveAllToCart}
              className="px-4 py-2.5 rounded-2xl bg-[#111111] hover:bg-[#0A84FF] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Move All to Bag ({wishlistedProducts.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Main List / Grid */}
      {wishlistedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {wishlistedProducts.map((product) => {
            const inCart = (cartQuantities[product.id] || 0) > 0;
            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl p-4 border border-gray-200 shadow-2xs hover:border-gray-300 transition-all flex items-center gap-3.5 justify-between group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-16 h-16 rounded-2xl bg-[#FAFAF7] p-1.5 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {product.category}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-[#0A84FF] transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs mt-0.5">
                      <span className="font-black text-gray-900">₹{product.price}</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-gray-400 line-through text-[11px]">
                          ₹{product.originalPrice}
                        </span>
                      )}
                      <span className="text-gray-400 text-[11px]">• {product.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveToCart(product)}
                    className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-[#111111] hover:bg-[#0A84FF] text-white text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    title="1-click move to cart"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{inCart ? 'Add Another' : 'Move to Bag'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleWishlist(product.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Remove from saved wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-gray-200/90 shadow-2xs max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-red-50 text-[#FF3B30] flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-display">
            Your Wishlist is Empty
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
            Save items for late-night exams or quick re-orders with 1 tap. Tap the heart on any campus snack or study essential to add it here.
          </p>

          <button
            type="button"
            onClick={onExploreCatalog}
            className="mt-6 px-6 py-3 rounded-2xl bg-[#111111] hover:bg-[#0A84FF] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#FFD60A]" />
            <span>Explore Campus Aisles</span>
          </button>
        </div>
      )}
    </div>
  );
};
