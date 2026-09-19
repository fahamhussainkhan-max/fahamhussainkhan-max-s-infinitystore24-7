import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, X, ArrowRight, TrendingUp } from 'lucide-react';
import { Product } from '../types';

interface SearchSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectProduct?: (product: Product) => void;
  products: Product[];
}

const SUGGESTIONS = [
  'Maggi',
  'Cold Drink',
  'Chips',
  'Notebook',
  'Pen',
  'Energy Drink',
  'Shampoo',
  'Biscuits',
];

export const SearchSection: React.FC<SearchSectionProps> = ({
  searchQuery,
  onSearchChange,
  onSelectProduct,
  products,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered live results
  const matchingProducts = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  return (
    <section id="search-section" className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#111111] font-display">
          What are you looking for?
        </h2>
        <p className="text-sm sm:text-base text-gray-500 mt-1 max-w-md mx-auto">
          Delivered in minutes to your dorm, library desk, or faculty room
        </p>
      </div>

      {/* Interactive Search Bar Box */}
      <div ref={searchContainerRef} className="relative max-w-2xl mx-auto">
        <motion.div
          animate={{
            scale: isFocused ? 1.02 : 1,
            boxShadow: isFocused
              ? '0 20px 40px -10px rgba(10, 132, 255, 0.2), 0 0 0 3px rgba(255, 59, 48, 0.4)'
              : '0 8px 24px -6px rgba(0, 0, 0, 0.08)',
          }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`relative rounded-3xl bg-white transition-all duration-300 ${
            isFocused
              ? 'border-2 border-transparent bg-gradient-to-r from-[#FF3B30] via-[#FFD60A] to-[#0A84FF] p-[2px]'
              : 'border border-gray-200/90'
          }`}
        >
          <div className="flex items-center bg-white rounded-[22px] px-4 sm:px-5 py-3.5 sm:py-4">
            {/* Animated Search Icon */}
            <motion.div
              animate={{
                rotate: isFocused ? [0, -15, 15, 0] : 0,
                scale: isFocused ? 1.15 : 1,
                color: isFocused ? '#0A84FF' : '#6B7280',
              }}
              transition={{ duration: 0.4 }}
              className="mr-3 flex items-center justify-center"
            >
              <Search className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder="Search snacks, drinks, stationery, essentials..."
              className="w-full text-sm sm:text-base font-medium text-[#111111] placeholder:text-gray-400 focus:outline-none bg-transparent"
            />

            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors mr-2"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 px-2 py-1 bg-gray-100 rounded-lg">
              Instant Run
            </span>
          </div>
        </motion.div>

        {/* Dynamic Suggestions & Live Search Results Dropdown */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 overflow-hidden"
            >
              {/* Quick suggestions tags */}
              <div className="mb-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#FFD60A]" />
                  <span>Popular Campus Searches</span>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        onSearchChange(sug);
                        setIsFocused(false);
                      }}
                      className="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-gray-100/90 text-gray-700 hover:bg-[#111111] hover:text-white transition-all duration-200 active:scale-95 flex items-center gap-1.5 shadow-sm"
                    >
                      <TrendingUp className="w-3 h-3 text-[#30D158]" />
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Matching Live Products */}
              {searchQuery.trim() && matchingProducts.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Quick Results ({matchingProducts.length})
                  </div>
                  <div className="space-y-1.5">
                    {matchingProducts.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => {
                          if (onSelectProduct) onSelectProduct(prod);
                          setIsFocused(false);
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-100"
                          />
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#0A84FF] transition-colors line-clamp-1">
                              {prod.name}
                            </div>
                            <div className="text-[11px] text-gray-500 font-medium">
                              ₹{prod.price} • {prod.unit}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#0A84FF] group-hover:translate-x-1 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
