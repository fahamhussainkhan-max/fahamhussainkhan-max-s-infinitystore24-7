import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  ArrowRight,
  Sparkles,
  MapPin,
  ChevronDown,
  Navigation,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { Product, CampusZone } from '../types';

interface TopGlobalSearchBarProps {
  products: Product[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectAndHighlightProduct: (productId: string) => void;
  isFilterFeedActive: boolean;
  onToggleFilterFeed: () => void;
  selectedZone: CampusZone;
  onOpenZoneSelector: () => void;
  allZones: CampusZone[];
  onSelectZone: (zone: CampusZone) => void;
}

export const TopGlobalSearchBar: React.FC<TopGlobalSearchBarProps> = ({
  products,
  searchQuery,
  onSearchChange,
  onSelectAndHighlightProduct,
  isFilterFeedActive,
  onToggleFilterFeed,
  selectedZone,
  onOpenZoneSelector,
  allZones,
  onSelectZone,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close suggestions and zone dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
        setIsZoneDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (press '/' or 'Meta+K' to focus search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) &&
        document.activeElement !== inputRef.current
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live matching products
  const matchingProducts = searchQuery.trim()
    ? products.filter((p) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
        );
      })
    : [];

  const handleItemClick = (productId: string) => {
    onSelectAndHighlightProduct(productId);
    setIsFocused(false);
  };

  const handleClear = () => {
    onSearchChange('');
    inputRef.current?.focus();
  };

  const quickPillSearches = ['Maggie', 'Red Bull', 'Register', 'Chips', 'Coffee'];

  return (
    <div
      ref={containerRef}
      className="sticky top-0 z-40 w-full max-w-full bg-[#FAFAF7]/95 backdrop-blur-md border-b border-gray-200/80 shadow-xs transition-all select-none overflow-x-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Main Search Bar Input */}
          <div className="relative flex-1">
            <div
              className={`relative flex items-center bg-white rounded-2xl border transition-all duration-200 shadow-2xs ${
                isFocused
                  ? 'border-[#0A84FF] ring-3 ring-[#0A84FF]/20 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="pl-3.5 pr-2 text-gray-400 flex items-center pointer-events-none">
                <Search className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isFocused ? 'text-[#0A84FF]' : 'text-gray-400'}`} />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                placeholder="Search stationery, snacks, drinks, late night cravings..."
                className="w-full py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none pr-10"
              />

              <div className="absolute right-2 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {!isFocused && !searchQuery && (
                  <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 text-[10px] font-mono text-gray-500 font-bold border border-gray-200">
                    /
                  </span>
                )}
              </div>
            </div>

            {/* Live Search Suggestions Dropdown */}
            <AnimatePresence>
              {isFocused && searchQuery.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200/90 overflow-hidden z-50 max-h-[380px] flex flex-col"
                >
                  {/* Dropdown Header with match count and filter mode toggle */}
                  <div className="p-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-700">
                      {matchingProducts.length}{' '}
                      {matchingProducts.length === 1 ? 'item matches' : 'items match'} "{searchQuery}"
                    </span>

                    <button
                      type="button"
                      onClick={onToggleFilterFeed}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        isFilterFeedActive
                          ? 'bg-[#0A84FF] text-white shadow-xs'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>{isFilterFeedActive ? 'Filtering Feed Active' : 'Filter Whole Feed'}</span>
                    </button>
                  </div>

                  {/* Products List */}
                  <div className="overflow-y-auto flex-1 divide-y divide-gray-50 p-1">
                    {matchingProducts.length > 0 ? (
                      matchingProducts.slice(0, 8).map((product) => (
                        <div
                          key={product.id}
                          onClick={() => handleItemClick(product.id)}
                          className="flex items-center justify-between gap-3 p-2.5 hover:bg-blue-50/60 rounded-xl transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 object-contain rounded-lg bg-gray-50 p-1 border border-gray-200/60 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate group-hover:text-[#0A84FF] transition-colors">
                                {product.name}
                              </h4>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                                <span className="uppercase font-semibold tracking-wider text-gray-400">
                                  {product.category}
                                </span>
                                <span>•</span>
                                <span>{product.unit}</span>
                                {product.isPopular && (
                                  <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded">
                                    ★ Popular
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="text-xs sm:text-sm font-black text-gray-900">
                              ₹{product.price}
                            </span>
                            <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-[#0A84FF] opacity-0 group-hover:opacity-100 transition-opacity">
                              <span>Jump</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-gray-500 text-xs">
                        <p className="font-semibold text-gray-700">No matching campus items found.</p>
                        <p className="mt-1 text-[11px]">
                          Try searching for drinks, instant snacks, or stationery.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Dropdown footer tip */}
                  <div className="p-2 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 flex items-center justify-between px-3">
                    <span>💡 Tap any item to smooth-scroll & pulse directly to its card</span>
                    <span className="font-semibold text-[#0A84FF]">10-Min Fast Delivery</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 1-Tap Campus Location / Hostel Selector Dropdown (Req 2) */}
          <div className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsZoneDropdownOpen((prev) => !prev)}
              className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3.5 py-2 sm:py-2.5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs hover:border-gray-400 transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-[#30D158] flex-shrink-0" />
                <div className="truncate">
                  <div className="text-[10px] text-gray-400 font-medium leading-none">
                    Delivering in {selectedZone.estMinutes}
                  </div>
                  <div className="text-xs font-bold text-gray-900 leading-tight truncate">
                    {selectedZone.name}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pl-2 border-l border-gray-100">
                <span className="text-[11px] font-bold text-[#0A84FF]">
                  ₹{selectedZone.deliveryFee} fee
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                    isZoneDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            {/* Quick 1-Tap Location Dropdown Menu */}
            <AnimatePresence>
              {isZoneDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 top-full mt-2 w-[calc(100vw-32px)] max-w-xs sm:w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 p-2 z-50 space-y-1"
                >
                  <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-gray-100 text-[11px] text-gray-500 font-bold">
                    <span>1-TAP HOSTEL SELECTOR</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsZoneDropdownOpen(false);
                        onOpenZoneSelector();
                      }}
                      className="text-[#0A84FF] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Navigation className="w-3 h-3" />
                      Auto-Detect GPS
                    </button>
                  </div>

                  {allZones.map((zone) => {
                    const isSelected = zone.id === selectedZone.id;
                    return (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => {
                          onSelectZone(zone);
                          setIsZoneDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 text-[#0A84FF] font-bold'
                            : 'hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold truncate">{zone.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{zone.block}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-right flex-shrink-0">
                          <div>
                            <span className="text-xs font-black text-gray-900 block">
                              ₹{zone.deliveryFee}
                            </span>
                            <span className="text-[9px] text-gray-400">{zone.estMinutes}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#0A84FF]" />}
                        </div>
                      </button>
                    );
                  })}

                  <div className="p-2 bg-emerald-50/80 rounded-xl text-[10px] font-bold text-emerald-800 text-center">
                    ✨ Free delivery on all orders above ₹150
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quick Search Tags Strip */}
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar text-xs">
          <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1 flex-shrink-0">
            <Sparkles className="w-3 h-3 text-[#FFD60A]" /> Quick:
          </span>
          {quickPillSearches.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => {
                onSearchChange(pill);
                inputRef.current?.focus();
              }}
              className="px-2.5 py-0.5 rounded-full bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              {pill}
            </button>
          ))}
          {isFilterFeedActive && (
            <button
              type="button"
              onClick={onToggleFilterFeed}
              className="ml-auto px-2 py-0.5 rounded-full bg-[#0A84FF] text-white text-[10px] font-bold whitespace-nowrap flex items-center gap-1 cursor-pointer"
            >
              <span>Feed Filter Active</span>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
