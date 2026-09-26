import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';
import { Category } from '../types';

interface CategoryGridProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section id="categories-section" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-6 gap-3">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#0A84FF]">
            Browse by Aisle
          </span>
          <h2 className="text-xl xs:text-2xl sm:text-3xl font-black text-[#111111] font-display tracking-tight mt-0.5">
            Campus Essentials Categories
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Pick a category to instantly explore in-stock supplies
          </p>
        </div>

        {/* Carousel controls for mobile / overflow */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {selectedCategory && (
            <button
              onClick={() => onSelectCategory(null)}
              className="text-xs font-bold text-gray-600 hover:text-black px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors min-h-[36px] flex items-center cursor-pointer"
            >
              Show All
            </button>
          )}
          <button
            onClick={() => scroll('left')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 shadow-sm text-gray-700 transition-all flex items-center justify-center cursor-pointer"
            aria-label="Scroll categories left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 shadow-sm text-gray-700 transition-all flex items-center justify-center cursor-pointer"
            aria-label="Scroll categories right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid on desktop & smooth horizontal touch scrolling on mobile */}
      <div
        ref={scrollRef}
        className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-3 pt-1 snap-x snap-mandatory select-none overscroll-x-contain touch-pan-x"
      >
        {CATEGORIES.map((cat) => {
          const isSelected =
            selectedCategory === cat.id ||
            selectedCategory === cat.slug ||
            selectedCategory === cat.name;

          return (
            <motion.div
              key={cat.id}
              onClick={() => onSelectCategory(isSelected ? null : cat.id)}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`group flex-shrink-0 w-36 xs:w-44 sm:w-auto snap-start cursor-pointer rounded-2xl sm:rounded-3xl p-3 sm:p-4 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                cat.bgGradient
              } ${
                isSelected
                  ? 'ring-2 ring-black shadow-xl scale-[1.02] bg-white'
                  : 'shadow-sm hover:shadow-xl bg-white/90 backdrop-blur-sm'
              }`}
            >
              {/* Decorative subtle gradient wash */}
              <div
                className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none"
                style={{
                  background: `radial-gradient(circle at top right, ${cat.accentColor}, transparent 70%)`,
                }}
              />

              {/* Top row: Emoji & Item Count badge */}
              <div className="flex items-center justify-between z-10 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl sm:text-2xl filter drop-shadow-sm group-hover:scale-110 transition-transform">
                    {cat.emoji}
                  </span>
                  {cat.id === 'womens-care' && (
                    <Heart className="w-4 h-4 text-pink-500 fill-pink-500/30 shrink-0" />
                  )}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-gray-700 shadow-xs border border-black/5">
                  {cat.itemCount}+ items
                </span>
              </div>

              {/* Category Image with hover scale */}
              <div className="relative w-full h-20 xs:h-24 sm:h-28 my-1.5 rounded-xl sm:rounded-2xl overflow-hidden shadow-inner bg-gray-100">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Title & Arrow */}
              <div className="z-10 mt-1 flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 leading-snug group-hover:text-[#0A84FF] transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                </div>
                <div className="w-6 h-6 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-700 group-hover:bg-[#111111] group-hover:text-white transition-all transform group-hover:translate-x-0.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Women's Care Discreet & Express Campus Delivery Banner */}
      <div className="mt-4 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-rose-500/10 border border-pink-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-md shrink-0">
            <Heart className="w-5 h-5 fill-white/30" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-gray-900">
                Women's Care & Intimate Hygiene Aisle
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 border border-pink-200">
                100% Discreet Packaging
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-gray-600 mt-0.5">
              Sanitary pads, intimate cleansing wash & emergency wellness supplies delivered directly to Girls Hostel & Campus Drop Spots in 10-15 mins.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelectCategory('womens-care')}
          className="self-stretch sm:self-auto px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <span>Explore Women's Care</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};
