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
}) => {
  const { user: authUser } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

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

      // Press Escape to reset / blur search
      if (e.key === 'Escape') {
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
        backgroundColor: isScrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.92)',
        boxShadow: isScrolled ? '0 4px 20px -2px rgba(0, 0, 0, 0.08)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      className="sticky top-0 z-50 w-full max-w-full border-b border-gray-200/80 pointer-events-auto select-none overflow-x-hidden"
    >
      {/* Top Quick-Delivery pill banner */}
      <div
        className={`w-full bg-[#111111] px-2.5 sm:px-4 flex items-center justify-center border-b border-white/10 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${
          isScrolled ? 'py-1' : 'py-1.5'
        }`}
      >
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-0.5 rounded-full bg-[#1c1c1e] text-[10px] sm:text-xs font-bold text-white border border-[#30D158]/60 shadow-[0_0_18px_rgba(48,209,88,0.4),0_0_6px_rgba(10,132,255,0.3)] animate-pulse max-w-full">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30D158] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#30D158]" />
          </span>
          <span className="text-[#FFD60A] font-black tracking-wide flex-shrink-0">⚡ Express:</span>
          <span className="text-gray-100 font-semibold truncate">Delivery within 30 - 45 mins (CCCT, SIST, Hostels & PGs)</span>
        </div>
      </div>

      {/* Main navigation row */}
      <div
        className={`max-w-6xl mx-auto px-2.5 xs:px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isScrolled ? 'h-14 sm:h-16 py-1 sm:py-2' : 'h-16 sm:h-20 py-2 sm:py-3.5'
        }`}
      >
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
              <span className="text-[9px] sm:text-[10px] text-gray-400 font-semibold tracking-wide hidden xs:block">
                "Need it? Get it."
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
        <div className="flex-1 max-w-md mx-2 hidden sm:block">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={desktopSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                onSearchChange?.(val);
                if (val.trim() && activeTab !== 'home' && onGoHome) {
                  onGoHome();
                }
              }}
              placeholder="Search Maggi, Red Bull, notes, stationery..."
              className="w-full pl-9 pr-12 py-2 sm:py-2.5 rounded-2xl bg-gray-100/90 hover:bg-gray-100 focus:bg-white text-xs sm:text-sm font-medium text-gray-900 border border-transparent focus:border-[#0A84FF] focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 transition-all shadow-inner"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange?.('');
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
      <div className="sm:hidden px-3 pb-2.5 pt-0">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={mobileSearchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              onSearchChange?.(val);
              if (val.trim() && activeTab !== 'home' && onGoHome) {
                onGoHome();
              }
            }}
            placeholder="Search Maggi, Red Bull, stationery..."
            className="w-full pl-9 pr-9 py-2 rounded-xl bg-gray-100 text-xs font-medium text-gray-900 border border-gray-200 focus:bg-white focus:outline-none focus:border-[#0A84FF]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              className="p-1 text-gray-400 hover:text-gray-700 absolute right-2.5 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
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
                <span>{authUser ? 'My Profile' : 'Student Sign In'}</span>
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
