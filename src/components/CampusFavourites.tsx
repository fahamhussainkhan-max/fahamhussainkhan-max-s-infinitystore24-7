import React from 'react';
import { Sparkles, Flame, ArrowRight } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { Product } from '../types';

interface CampusFavouritesProps {
  products: Product[];
  cartQuantities: Record<string, number>;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onToastMessage: (msg: string) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  highlightedProductId?: string | null;
  isStoreOpen?: boolean;
}

export const CampusFavourites: React.FC<CampusFavouritesProps> = ({
  products,
  cartQuantities,
  onAddToCart,
  onUpdateQuantity,
  onToastMessage,
  wishlist,
  onToggleWishlist,
  highlightedProductId,
  isStoreOpen = true,
}) => {
  const popularProducts = products.filter((p) => p.isPopular);

  return (
    <section id="campus-favourites" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-black uppercase tracking-wider mb-1.5">
            <Flame className="w-3.5 h-3.5 text-[#FF3B30] fill-[#FF3B30]" />
            <span>High Demand On Campus</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#111111] font-display tracking-tight">
            🔥 Campus Favourites
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Things students keep coming back for — restocked 3x daily.
          </p>
        </div>

        <div className="text-xs font-bold text-gray-400">
          Showing top {popularProducts.length} campus hits
        </div>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
        {popularProducts.map((prod) => (
          <ProductCard
            key={prod.id}
            product={prod}
            quantityInCart={cartQuantities[prod.id] || 0}
            onAddToCart={onAddToCart}
            onUpdateQuantity={onUpdateQuantity}
            onToastMessage={onToastMessage}
            isWishlisted={wishlist.includes(prod.id)}
            onToggleWishlist={onToggleWishlist}
            isHighlighted={highlightedProductId === prod.id}
            variant="light"
            isStoreOpen={isStoreOpen}
          />
        ))}
      </div>
    </section>
  );
};
