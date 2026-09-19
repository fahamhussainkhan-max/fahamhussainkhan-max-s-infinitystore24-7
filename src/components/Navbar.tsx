import React from 'react';
import { ShoppingBag, MapPin, Heart, Search, Sparkles, ChevronDown, Zap } from 'lucide-react';
import { CampusZone } from '../types';

interface NavbarProps {
  selectedZone: CampusZone;
  onOpenZoneSelector: () => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  wishlistCount: number;
  onScrollToSearch: () => void;
  onScrollToFavourites: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedZone,
  onOpenZoneSelector,
  cartCount,
  cartTotal,
  onOpenCart,
  wishlistCount,
  onScrollToSearch,
  onScrollToFavourites,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAFAF7]/90 backdrop-blur-xl border-b border-gray-200/80 transition-all select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2 group">
            {/* Custom Multi-Color Infinity Symbol */}
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-[#111111] p-1.5 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <svg viewBox="0 0 100 50" className="w-full h-full">
                <defs>
                  <linearGradient id="navInfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF3B30" />
                    <stop offset="33%" stopColor="#FFD60A" />
                    <stop offset="66%" stopColor="#0A84FF" />
                    <stop offset="100%" stopColor="#30D158" />
                  </linearGradient>
                </defs>
                <path
                  d="M 30,25 C 15,25 15,40 30,40 C 45,40 55,10 70,10 C 85,10 85,25 70,25 C 55,25 45,40 30,40"
                  fill="none"
                  stroke="url(#navInfGrad)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="flex flex-col">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-[#111111] font-display flex items-center gap-1 leading-none">
                Infinity<span className="text-[#0A84FF]">Store</span>
              </span>
              <span className="text-[10px] text-gray-400 font-semibold tracking-wide">
                "Need it? Get it."
              </span>
            </div>
          </a>

          {/* Location Picker Pill (Desktop) */}
          <button
            type="button"
            onClick={onOpenZoneSelector}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs hover:border-gray-400 transition-all text-left"
          >
            <MapPin className="w-3.5 h-3.5 text-[#30D158]" />
            <div>
              <div className="text-[10px] text-gray-400 font-medium leading-none">
                Delivering in {selectedZone.estMinutes}
              </div>
              <div className="text-xs font-bold text-gray-900 leading-tight flex items-center gap-1">
                <span className="truncate max-w-[130px]">{selectedZone.name}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </div>
            </div>
          </button>
        </div>

        {/* Right Action Icons: Search, Wishlist, Cart */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Trigger */}
          <button
            type="button"
            onClick={onScrollToSearch}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-600 hover:text-black hover:bg-gray-100/80 transition-colors text-xs font-bold"
            title="Search catalog"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>

          {/* Quick Favourites Anchor */}
          <button
            type="button"
            onClick={onScrollToFavourites}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-600 hover:text-black hover:bg-gray-100/80 transition-colors text-xs font-bold"
          >
            <Sparkles className="w-4 h-4 text-[#FFD60A]" />
            <span>Top Picks</span>
          </button>

          {/* Wishlist button */}
          <div className="relative">
            <button
              type="button"
              onClick={onScrollToFavourites}
              className="p-2.5 rounded-xl text-gray-600 hover:text-[#FF3B30] hover:bg-red-50 transition-colors"
              title="Saved items"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FF3B30] text-white text-[9px] font-black flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>
          </div>

          {/* Cart Trigger */}
          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-[#111111] hover:bg-[#0A84FF] text-white shadow-md active:scale-95 transition-all text-xs sm:text-sm font-bold"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#FF3B30] text-white text-[9px] font-black flex items-center justify-center border border-[#111111]">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">
              {cartCount > 0 ? `₹${cartTotal}` : 'Bag'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
