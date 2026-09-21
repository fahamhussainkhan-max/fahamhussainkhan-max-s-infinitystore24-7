import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
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
      const offset = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <section id="categories-section" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[#0A84FF]">
            Browse by Aisle
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#111111] font-display tracking-tight mt-0.5">
            Campus Essentials Categories
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Pick a category to instantly explore in-stock supplies
          </p>
        </div>

        {/* Carousel controls for mobile / overflow */}
        <div className="flex items-center gap-2">
          {selectedCategory && (
            <button
              onClick={() => onSelectCategory(null)}
              className="text-xs font-bold text-gray-500 hover:text-black px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Show All
            </button>
          )}
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 shadow-sm text-gray-700 transition-all"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 shadow-sm text-gray-700 transition-all"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid on desktop & horizontal scrollable on mobile */}
      <div
        ref={scrollRef}
        className="flex lg:grid lg:grid-cols-3 gap-3.5 sm:gap-5 overflow-x-auto no-scrollbar pb-4 pt-1 snap-x select-none"
      >
        {CATEGORIES.map((cat, idx) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <motion.div
              key={cat.id}
              onClick={() => onSelectCategory(isSelected ? null : cat.id)}
              whileHover={{ y: -6, rotateX: 4, rotateY: -3, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`group flex-shrink-0 w-44 sm:w-48 lg:w-auto snap-start cursor-pointer rounded-3xl p-3.5 sm:p-4 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                cat.bgGradient
              } ${
                isSelected
                  ? 'ring-2 ring-black shadow-xl scale-[1.03] bg-white'
                  : 'shadow-sm hover:shadow-xl bg-white/90 backdrop-blur-sm'
              }`}
              style={{
                perspective: '800px',
              }}
            >
              {/* Decorative subtle gradient wash */}
              <div
                className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity"
                style={{
                  background: `radial-gradient(circle at top right, ${cat.accentColor}, transparent 70%)`,
                }}
              />

              {/* Top row: Emoji & Item Count badge */}
              <div className="flex items-center justify-between z-10 mb-2">
                <span className="text-2xl filter drop-shadow-sm group-hover:scale-110 transition-transform">
                  {cat.emoji}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-gray-700 shadow-xs border border-black/5">
                  {cat.itemCount}+ items
                </span>
              </div>

              {/* Category Image with hover scale */}
              <div className="relative w-full h-24 sm:h-28 my-2 rounded-2xl overflow-hidden shadow-inner bg-gray-100">
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
                  <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 leading-snug group-hover:text-[#0A84FF] transition-colors">
                    {cat.name}
                  </h3>
                </div>
                <div className="w-6 h-6 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-gray-700 group-hover:bg-[#111111] group-hover:text-white transition-all transform group-hover:translate-x-1">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
