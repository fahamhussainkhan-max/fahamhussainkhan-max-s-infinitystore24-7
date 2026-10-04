import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  MapPin,
  ChevronDown,
  Search,
  X,
  Heart,
  User,
  Sparkles,
  Grid,
  Menu,
  Printer,
  Compass,
  MoreHorizontal,
} from 'lucide-react';
import { CampusZone } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  selectedZone: CampusZone;
  onOpenZoneSelector: () => void;
  cartCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  wishlistCount: number;
  onScrollToSearch?: () => void;
  onScrollToFavourites: () => void;
  onOpenCustomerOrders: () => void;
  onScrollToCategories?: () => void;
  onOpenWishlist?: () => void;
  onOpenProfile?: () => void;
  onGoHome?: () => void;
  onOpenPrint?: () => void;
  activeTab?: 'home' | 'wishlist' | 'profile';
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  products?: any[];
  onSelectProduct?: (productId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedZone,
  onOpenZoneSelector,
  cartCount,
  cartTotal,
  onOpenCart,
  wishlistCount,
  onScrollToFavourites,
  onOpenCustomerOrders,
  onScrollToCategories,
  onOpenWishlist,
  onOpenProfile,
  onGoHome,
  onOpenPrint,
  activeTab = 'home',
  searchQuery = '',
  onSearchChange,
  products = [],
  onSelectProduct,
}) => {
  const { user: authUser } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const [isDesktopMoreOpen, setIsDesktopMoreOpen] = useState(false);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const desktopMoreRef = useRef<HTMLDivElement>(null);

  // Close desktop more menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (desktopMoreRef.current && !desktopMoreRef.current.contains(e.target as Node)) {
        setIsDesktopMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Quick matching products for instant detached search dropdown
  const matchingProducts = searchQuery.trim()
    ? (products || [])
        .filter((p: any) => {
          const q = searchQuery.toLowerCase();
          return (
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.category && p.category.toLowerCase().includes(q)) ||
            (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q)))
          );
        })
        .slice(0, 5)
    : [];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut '/' or 'Ctrl+K' / 'Cmd+K' to focus the integrated search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isInputActive =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT';

      // Press '/' to focus search if not in an input
      if (
        (e.key === '/' && !isInputActive) ||
        ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K'))
      ) {
        e.preventDefault();
        desktopSearchInputRef.current?.focus();
        desktopSearchInputRef.current?.select();
      }

      // Press Escape to reset / blur search and dismiss dropdowns
      if (e.key === 'Escape') {
        setIsSearchFocused(false);
        setIsMobileSearchFocused(false);
        setIsMobileMenuOpen(false);
        if (
          document.activeElement === desktopSearchInputRef.current ||
          document.activeElement === mobileSearchInputRef.current
        ) {
          onSearchChange?.('');
          desktopSearchInputRef.current?.blur();
          mobileSearchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSearchChange]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header
      id="main-top-navbar"
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
        boxShadow: isScrolled ? '0 4px 20px -2px rgba(0, 0, 0, 0.08)' : 'none',
      }}
      className="sticky top-0 z-50 w-full max-w-full border-b border-gray-200/80 pointer-events-auto select-none overflow-visible"
    >
      {/* Top Quick-Delivery pill banner (Fixed Height h-7.5 to prevent vertical layout shifts) */}
      <div className="w-full bg-[#111111] px-2.5 sm:px-4 h-7.5 sm:h-8 flex items-center justify-center border-b border-white/10 overflow-hidden">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-0.5 rounded-full bg-[#1c1c1e] text-[10px] sm:text-xs font-bold text-white border border-[#30D158]/60 shadow-[0_0_18px_rgba(48,209,88,0.4),0_0_6px_rgba(10,132,255,0.3)] animate-pulse max-w-full">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30D158] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#30D158]" />
          </span>
          <span className="text-[#FFD60A] font-black tracking-wide flex-shrink-0">⚡ Special Offer:</span>
          <span className="text-gray-100 font-semibold truncate hidden md:inline">Flat 50% OFF on Delivery Charges — Now at ₹15!</span>
          <span className="text-gray-100 font-semibold truncate md:hidden">Flat 50% OFF Delivery — Now ₹15!</span>
          <span className="ml-1 sm:ml-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#FF3B30] to-[#FF9500] text-white text-[9.5px] sm:text-[10.5px] font-black tracking-wide uppercase shadow-xs border border-white/20 whitespace-nowrap flex-shrink-0">
            50% OFF
          </span>
        </div>
      </div>

      {/* Main navigation row (Locked Height h-16 sm:h-18 with zero jitter) */}
      <div className="max-w-6xl mx-auto px-2.5 xs:px-3 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4 relative">
        {/* Left Side: Brand Logo, EDC Slot & Campus Location Picker */}
        <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3 min-w-0 flex-shrink-0">
          {/* Brand Logo */}
          <a
            href="#"
            id="nav-logo-link"
            onClick={(e) => {
              if (onGoHome) {
                e.preventDefault();
                onGoHome();
                setIsMobileMenuOpen(false);
              }
            }}
            className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer transition-transform duration-200 ease-out hover:scale-105 active:scale-95 pointer-events-auto flex-shrink-0"
          >
            {/* Custom Multi-Color Infinity Symbol */}
            <div
              className={`rounded-xl sm:rounded-2xl bg-[#111111] p-1 sm:p-1.5 flex items-center justify-center shadow-md group-hover:scale-105 transition-all duration-300 flex-shrink-0 ${
                isScrolled ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-8 h-8 sm:w-11 sm:h-11'
              }`}
            >
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

            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-base xs:text-lg sm:text-xl tracking-tight text-[#111111] font-display flex items-center leading-none">
                Infinity<span className="text-[#0A84FF]">Store</span>
              </span>
              <span className="text-[8.5px] sm:text-[9.5px] text-gray-500 font-bold tracking-wide hidden xs:block truncate max-w-[190px] sm:max-w-none">
                Official 45-Min Campus Quick-Commerce
              </span>
            </div>
          </a>

          {/* Location Picker Pill (Opens clean full modal, zero detached panels) */}
          <button
            type="button"
            id="nav-location-picker"
            onClick={() => {
              onOpenZoneSelector();
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-white border border-gray-200/90 shadow-2xs hover:border-gray-400 transition-all duration-200 ease-out hover:scale-105 active:scale-95 text-left cursor-pointer pointer-events-auto min-h-[36px] sm:min-h-0 flex-shrink-0"
            title="Click to select CCCT, SIST, or Hostel delivery spot"
          >
            <MapPin className="w-3.5 h-3.5 text-[#30D158] flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[10px] text-gray-400 font-medium leading-none hidden md:block">
                {selectedZone.isOutsideDelivery ? 'Outside Campus' : (selectedZone.estMinutes || '30 - 45 mins')}
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-gray-900 leading-tight flex items-center gap-0.5">
                <span className="truncate max-w-[65px] xs:max-w-[90px] sm:max-w-[120px]">{selectedZone.name}</span>
                <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          </button>
        </div>

        {/* Center: Integrated Real-Time Search Bar (Desktop & Tablet) */}
        <div className="flex-1 max-w-md mx-2 hidden sm:block relative">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={desktopSearchInputRef}
              type="text"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onChange={(e) => {
                const val = e.target.value;
                onSearchChange?.(val);
                setIsSearchFocused(true);
                if (val.trim() && activeTab !== 'home' && onGoHome) {
                  onGoHome();
                }
              }}
              placeholder="Search Maggi, Red Bull, notes, stationery..."
              className="w-full pl-9 pr-12 py-2 sm:py-2.5 rounded-2xl bg-gray-100/90 hover:bg-gray-100 focus:bg-white text-xs sm:text-sm font-medium text-gray-900 border border-transparent focus:border-[#0A84FF] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 transition-colors shadow-inner"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange?.('');
                    setIsSearchFocused(false);
                    desktopSearchInputRef.current?.focus();
                  }}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition cursor-pointer"
                  title="Clear search (Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-gray-400 bg-white border border-gray-200 rounded shadow-2xs pointer-events-none">
                  /
                </kbd>
              )}
            </div>

            {/* Completely Detached Autocomplete Search Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div
                style={{ position: 'absolute', top: '100%', left: 0, width: '100%' }}
                className="mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200/90 overflow-hidden z-60 text-left pointer-events-auto"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="px-3.5 py-2 bg-gray-50/90 border-b border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-500">
                  <span>Instant Campus Matches ({matchingProducts.length})</span>
                  <span className="text-[10px] text-gray-400">Esc to close</span>
                </div>
                {matchingProducts.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto p-1.5 divide-y divide-gray-50">
                    {matchingProducts.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (onSelectProduct) onSelectProduct(p.id);
                          if (onGoHome && activeTab !== 'home') onGoHome();
                          setIsSearchFocused(false);
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-blue-50/80 cursor-pointer transition-colors group"
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-9 h-9 rounded-lg object-cover shrink-0 border border-gray-200"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate group-hover:text-[#0A84FF]">
                            {p.name}
                          </p>
                          <p className="text-[10px] text-gray-400 capitalize">
                            {p.category} • ₹{p.price}
                          </p>
                        </div>
                        <span className="text-[10px] font-extrabold text-[#0A84FF] bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
                          ₹{p.price}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 text-center text-xs text-gray-500">
                    No instant matches for "{searchQuery}". Press Enter to view full results.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Desktop Categories / Aisles */}
          {onScrollToCategories && (
            <a
              href="#categories-section"
              id="nav-categories-btn"
              onClick={(e) => {
                e.preventDefault();
                onScrollToCategories();
              }}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-600 hover:text-black hover:bg-gray-100/80 transition-all duration-200 ease-out hover:scale-105 active:scale-95 text-xs font-bold pointer-events-auto cursor-pointer"
              title="Browse Categories"
            >
              <Grid className="w-4 h-4 text-gray-500" />
              <span>Aisles</span>
            </a>
          )}

          {/* Desktop Quick Favourites / Top Picks */}
          <button
            type="button"
            id="nav-toppicks-btn"
            onClick={onScrollToFavourites}
            className="hidden lg:flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-gray-600 hover:text-black hover:bg-gray-100/80 transition-all duration-200 ease-out hover:scale-105 active:scale-95 text-xs font-bold cursor-pointer pointer-events-auto"
          >
            <Sparkles className="w-4 h-4 text-[#FFD60A]" />
            <span>Top Picks</span>
          </button>

          {/* Instant Campus Print & Xerox Button (Desktop) */}
          {onOpenPrint && (
            <button
              type="button"
              id="nav-print-btn"
              onClick={onOpenPrint}
              className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 text-emerald-800 border border-emerald-300/60 transition-all duration-200 ease-out hover:scale-105 active:scale-95 text-xs font-black cursor-pointer pointer-events-auto shadow-2xs"
              title="Campus Xerox & Printout Desk"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              <span>Printout</span>
              <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 rounded-md">
                ₹10
              </span>
            </button>
          )}

          {/* Wishlist Button */}
          <div className="relative hidden xs:block">
            <button
              type="button"
              id="nav-wishlist-btn"
              onClick={onOpenWishlist || onScrollToFavourites}
              className={`p-2 sm:p-2.5 rounded-xl transition-all duration-200 ease-out hover:scale-105 active:scale-95 cursor-pointer pointer-events-auto min-h-[38px] min-w-[38px] flex items-center justify-center ${
                activeTab === 'wishlist'
                  ? 'text-[#FF3B30] bg-red-50 ring-2 ring-[#FF3B30]/30 shadow-xs'
                  : 'text-gray-600 hover:text-[#FF3B30] hover:bg-red-50'
              }`}
              title="Saved wishlist items"
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'wishlist' ? 'fill-[#FF3B30]' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#FF3B30] text-white text-[9px] font-black flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(255,59,48,0.7)]">
                  {wishlistCount}
                </span>
              )}
            </button>
          </div>

          {/* Customer Profile & Orders Button (Desktop) */}
          <button
            type="button"
            id="nav-profile-btn"
            onClick={onOpenProfile || onOpenCustomerOrders}
            className={`hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border transition-all duration-200 ease-out hover:scale-105 active:scale-95 text-xs font-bold cursor-pointer pointer-events-auto ${
              activeTab === 'profile'
                ? 'bg-blue-50 text-[#0A84FF] border-[#0A84FF]/40 ring-2 ring-[#0A84FF]/20 shadow-xs'
                : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-200/90 shadow-2xs'
            }`}
            title="View My Orders & Profile"
          >
            {authUser?.avatar ? (
              <img src={authUser.avatar} alt={authUser.name} className="w-4 h-4 rounded-full border border-blue-400 shrink-0" />
            ) : (
              <User className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A84FF] ${activeTab === 'profile' ? 'stroke-[2.5]' : ''}`} />
            )}
            <span className="hidden lg:inline">{authUser?.name ? authUser.name.split(' ')[0] : 'Orders & Profile'}</span>
          </button>

          {/* Cart / Bag Trigger */}
          <button
            type="button"
            id="nav-cart-btn"
            onClick={onOpenCart}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#111111] hover:bg-[#0A84FF] text-white shadow-md transition-all duration-200 ease-out hover:scale-105 active:scale-95 text-xs sm:text-sm font-bold cursor-pointer pointer-events-auto min-h-[38px] sm:min-h-[44px]"
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#FF3B30] text-white text-[9px] font-black flex items-center justify-center border border-[#111111] animate-pulse shadow-[0_0_10px_rgba(255,59,48,0.8)]">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="font-extrabold">
              {cartCount > 0 ? `₹${cartTotal}` : 'Bag'}
            </span>
          </button>

          {/* Desktop Three Dots (...) More Options Menu Button */}
          <div className="relative hidden md:flex items-center flex-shrink-0" ref={desktopMoreRef}>
            <button
              type="button"
              id="desktop-three-dots-btn"
              onClick={() => setIsDesktopMoreOpen((prev) => !prev)}
              className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all duration-200 ease-out hover:scale-105 active:scale-95 cursor-pointer pointer-events-auto border ${
                isDesktopMoreOpen
                  ? 'bg-gray-200 text-black border-gray-300 ring-2 ring-black/10 shadow-xs'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200/90 shadow-2xs'
              }`}
              title="More Campus Options (...)"
              aria-label="More options"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-800" />
            </button>

            <AnimatePresence>
              {isDesktopMoreOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 8 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/90 py-2 z-50 overflow-hidden"
                >
                  <div className="px-3.5 py-1.5 border-b border-gray-100 text-[10.5px] font-black uppercase tracking-wider text-gray-400">
                    Campus Quick Actions
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenZoneSelector();
                      setIsDesktopMoreOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-gray-800 hover:bg-gray-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-[#30D158]" />
                    <span>Select Campus Delivery Spot</span>
                  </button>

                  {onOpenPrint && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenPrint();
                        setIsDesktopMoreOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-emerald-800 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-emerald-600" />
                      <span>Campus Xerox & Printout</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      onScrollToFavourites();
                      setIsDesktopMoreOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-gray-800 hover:bg-gray-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#FFD60A]" />
                    <span>Campus Top Picks</span>
                  </button>

                  {onScrollToCategories && (
                    <button
                      type="button"
                      onClick={() => {
                        onScrollToCategories();
                        setIsDesktopMoreOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-bold text-gray-800 hover:bg-gray-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Grid className="w-4 h-4 text-[#0A84FF]" />
                      <span>Browse All Aisles</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenWishlist) onOpenWishlist();
                      else onScrollToFavourites();
                      setIsDesktopMoreOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-gray-800 hover:bg-gray-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <Heart className="w-4 h-4 text-[#FF3B30]" />
                    <span>Saved Wishlist ({wishlistCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenProfile) onOpenProfile();
                      else onOpenCustomerOrders();
                      setIsDesktopMoreOpen(false);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-gray-800 hover:bg-gray-100 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-gray-100 mt-1 pt-2"
                  >
                    <User className="w-4 h-4 text-[#0A84FF]" />
                    <span>Orders & Student Profile</span>
                  </button>

                  <a
                    href="/admin.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsDesktopMoreOpen(false)}
                    className="w-full px-3.5 py-2 text-left text-xs font-bold text-gray-600 hover:bg-gray-100 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-gray-100 mt-1 pt-2"
                  >
                    <Compass className="w-4 h-4 text-gray-500" />
                    <span>Admin Operations Portal</span>
                  </a>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Collapsible / Hamburger Menu Toggle Button */}
          <button
            type="button"
            id="mobile-hamburger-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors cursor-pointer pointer-events-auto min-h-[38px] min-w-[38px]"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-gray-900" />
            ) : (
              <Menu className="w-5 h-5 text-gray-900" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Integrated Search Row (Visible on small screens < 640px) */}
      <div className="sm:hidden px-3 pb-2.5 pt-0 relative">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={mobileSearchInputRef}
            type="text"
            value={searchQuery}
            onFocus={() => setIsMobileSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsMobileSearchFocused(false), 200)}
            onChange={(e) => {
              const val = e.target.value;
              onSearchChange?.(val);
              setIsMobileSearchFocused(true);
              if (val.trim() && activeTab !== 'home' && onGoHome) {
                onGoHome();
              }
            }}
            placeholder="Search Maggi, Red Bull, stationery..."
            className="w-full pl-9 pr-9 py-2 rounded-xl bg-gray-100 text-xs font-medium text-gray-900 border border-gray-200 focus:bg-white focus:outline-none focus:border-[#0A84FF] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                onSearchChange?.('');
                setIsMobileSearchFocused(false);
              }}
              className="p-1 text-gray-400 hover:text-gray-700 absolute right-2.5 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Completely Detached Mobile Search Autocomplete Dropdown */}
          {isMobileSearchFocused && searchQuery.trim().length > 0 && (
            <div
              style={{ position: 'absolute', top: '100%', left: 0, width: '100%' }}
              className="mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-200/90 overflow-hidden z-60 text-left pointer-events-auto"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-[10px] font-bold text-gray-500">
                <span>Instant Matches ({matchingProducts.length})</span>
                <span className="text-[9px] text-gray-400">Esc to close</span>
              </div>
              {matchingProducts.length > 0 ? (
                <div className="max-h-56 overflow-y-auto p-1 divide-y divide-gray-50">
                  {matchingProducts.map((p: any) => (
                    <div
                      key={`mob-match-${p.id}`}
                      onClick={() => {
                        if (onSelectProduct) onSelectProduct(p.id);
                        if (onGoHome && activeTab !== 'home') onGoHome();
                        setIsMobileSearchFocused(false);
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl hover:bg-blue-50/80 cursor-pointer transition-colors group"
                    >
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-8 h-8 rounded-lg object-cover shrink-0 border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate group-hover:text-[#0A84FF]">
                          {p.name}
                        </p>
                        <p className="text-[10px] text-gray-400 capitalize">₹{p.price}</p>
                      </div>
                      <span className="text-[10px] font-extrabold text-[#0A84FF] bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
                        ₹{p.price}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-xs text-gray-500">
                  No instant matches for "{searchQuery}".
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            key="navbar-mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="md:hidden w-full bg-white/98 backdrop-blur-xl border-t border-gray-200 shadow-2xl overflow-hidden px-4 py-4 space-y-3"
          >
            {/* Quick Campus Location Selector Card */}
            <div
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenZoneSelector();
              }}
              className="p-3 bg-[#FAFAF7] hover:bg-gray-100 border border-gray-200 rounded-2xl flex items-center justify-between cursor-pointer transition-colors active:scale-98"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#30D158]/15 text-[#30D158] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                    Campus Delivery Spot
                  </div>
                  <div className="text-xs font-bold text-gray-900 truncate">
                    {selectedZone.name}
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-[#0A84FF] flex-shrink-0 bg-blue-50 px-2.5 py-1 rounded-lg">
                Change Spot
              </span>
            </div>

            {/* Menu Links Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {/* Categories */}
              {onScrollToCategories && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onScrollToCategories();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-800 hover:text-[#0A84FF] transition-all min-h-[44px] cursor-pointer text-left"
                >
                  <Grid className="w-4 h-4 text-[#0A84FF] flex-shrink-0" />
                  <span>Aisles & Categories</span>
                </button>
              )}

              {/* Campus Xerox & Printout */}
              {onOpenPrint && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenPrint();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-800 border border-emerald-300/60 transition-all min-h-[44px] cursor-pointer text-left"
                >
                  <Printer className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Printout (₹10)</span>
                </button>
              )}

              {/* Saved Wishlist */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onOpenWishlist) onOpenWishlist();
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-800 hover:text-[#FF3B30] transition-all min-h-[44px] cursor-pointer text-left"
              >
                <Heart className="w-4 h-4 text-[#FF3B30] flex-shrink-0" />
                <span>Wishlist ({wishlistCount})</span>
              </button>

              {/* Customer Profile & Orders */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onOpenProfile) onOpenProfile();
                  else onOpenCustomerOrders();
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-800 hover:text-[#0A84FF] transition-all min-h-[44px] cursor-pointer text-left"
              >
                <User className="w-4 h-4 text-[#0A84FF] flex-shrink-0" />
                <span>{authUser ? `${authUser.name.split(' ')[0]}'s Profile` : 'Orders & Profile'}</span>
              </button>
            </div>

            {/* Official EDC CCCT Integration Banner in Mobile Menu */}
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex items-center gap-2.5">
              {/* <!-- EDC_LOGO_PLACEHOLDER: Replace src with EDC logo asset --> */}
              <div className="w-8 h-8 rounded-xl border border-dashed border-amber-500/70 bg-white/90 flex flex-col items-center justify-center text-center shrink-0">
                <span className="text-[9px] font-black tracking-tighter text-amber-800 leading-none">EDC</span>
                <span className="text-[6.5px] font-bold text-amber-600 tracking-tighter leading-none scale-90">CCCT</span>
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-amber-900">
                  Official Campus Entrepreneurship Initiative
                </div>
                <div className="text-[9.5px] text-amber-800/90 leading-tight">
                  Authorized by Entrepreneurship Development Cell (EDC), CCCT Chisopani
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
