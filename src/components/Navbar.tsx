import React from 'react';
import { ShoppingBag, MapPin, Heart, Search, Sparkles, ChevronDown, User, Grid } from 'lucide-react';
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
  onOpenCustomerOrders: () => void;
  onScrollToCategories?: () => void;
  onOpenWishlist?: () => void;
  onOpenProfile?: () => void;
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
  onOpenCustomerOrders,
  onScrollToCategories,
  onOpenWishlist,
  onOpenProfile,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAFAF7]/95 backdrop-blur-xl border-b border-gray-200/80 transition-all select-none">
      {/* Floating Quick-Delivery pill badge at the top with soft neon pulse glow */}
      <div className="w-full bg-[#111111] py-1.5 px-3 sm:px-4 flex items-center justify-center border-b border-white/10">
        <div className="inline-flex items-center gap-2 px-3.5 py-0.5 rounded-full bg-[#1c1c1e] text-xs font-bold text-white border border-[#30D158]/60 shadow-[0_0_18px_rgba(48,209,88,0.4),0_0_6px_rgba(10,132,255,0.3)] animate-pulse">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30D158] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#30D158]" />
          </span>
          <span className="text-[#FFD60A] font-black tracking-wide">⚡ Campus Express:</span>
          <span className="text-gray-100 font-semibold">Delivered in 10-15 mins</span>
          <span className="hidden sm:inline text-[11px] text-gray-400 border-l border-white/20 pl-2">Hostel & Fatak Rush</span>
        </div>
      </div>

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
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs hover:border-gray-400 transition-all text-left cursor-pointer"
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

        {/* Right Customer Action Icons: Categories, Search, Wishlist, Profile/Orders, Cart */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Categories / Aisles */}
          <a
            href="#categories-section"
            onClick={(e) => {
              if (onScrollToCategories) {
                e.preventDefault();
                onScrollToCategories();
              }
            }}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-600 hover:text-black hover:bg-gray-100/80 transition-colors text-xs font-bold"
            title="Browse Categories"
          >
            <Grid className="w-4 h-4 text-gray-500" />
            <span>Categories</span>
          </a>

          {/* Search Trigger */}
          <button
            type="button"
            onClick={onScrollToSearch}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-gray-600 hover:text-black hover:bg-gray-100/80 transition-colors text-xs font-bold cursor-pointer"
            title="Search catalog"
          >
            <Search className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">Search</span>
          </button>

          {/* Quick Favourites / Top Picks */}
          <button
            type="button"
            onClick={onScrollToFavourites}
            className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-gray-600 hover:text-black hover:bg-gray-100/80 transition-colors text-xs font-bold cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#FFD60A]" />
            <span>Top Picks</span>
          </button>

          {/* Wishlist button */}
          <div className="relative">
            <button
              type="button"
              onClick={onOpenWishlist || onScrollToFavourites}
              className="p-2 sm:p-2.5 rounded-xl text-gray-600 hover:text-[#FF3B30] hover:bg-red-50 transition-colors cursor-pointer"
              title="Saved wishlist items"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FF3B30] text-white text-[9px] font-black flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>
          </div>

          {/* Customer Profile & Orders Button */}
          <button
            type="button"
            onClick={onOpenProfile || onOpenCustomerOrders}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-800 border border-gray-200/90 shadow-2xs transition-all text-xs font-bold cursor-pointer"
            title="View My Orders & Profile"
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A84FF]" />
            <span className="hidden sm:inline">Orders & Profile</span>
          </button>

          {/* Cart / Bag Trigger */}
          <button
            type="button"
            onClick={onOpenCart}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-[#111111] hover:bg-[#0A84FF] text-white shadow-md active:scale-95 transition-all text-xs sm:text-sm font-bold cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#FF3B30] text-white text-[9px] font-black flex items-center justify-center border border-[#111111]">
                  {cartCount}
                </span>
              )}
            </div>
            <span>
              {cartCount > 0 ? `₹${cartTotal}` : 'Bag'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
