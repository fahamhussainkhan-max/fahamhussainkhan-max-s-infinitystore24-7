import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';
import { Category } from '../types';

interface CategoryGridProps {
  categories?: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const displayCategories = categories && categories.length > 0 ? categories : CATEGORIES;

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
        {displayCategories.map((cat, idx) => {
          const isSelected =
            selectedCategory === cat.id ||
            selectedCategory === cat.slug ||
            selectedCategory === cat.name;

          const hasCustomImage = Boolean(cat.image && !cat.image.includes('categories-banner.png'));

          return (
            <motion.div
              key={`cat-grid-${cat.id}-${idx}`}
              onClick={() => onSelectCategory(isSelected ? null : cat.id)}
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`group flex-shrink-0 w-36 xs:w-44 sm:w-auto snap-start cursor-pointer rounded-2xl sm:rounded-3xl p-3 sm:p-4 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                cat.bgGradient || 'from-blue-500/10 via-cyan-500/10 to-sky-500/10 border-blue-200/80'
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
                  background: `radial-gradient(circle at top right, ${cat.accentColor || '#0A84FF'}, transparent 70%)`,
                }}
              />

              {/* Top row: Emoji & Item Count badge */}
              <div className="flex items-center justify-between z-10 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl sm:text-2xl filter drop-shadow-sm group-hover:scale-110 transition-transform">
                    {cat.emoji || '📦'}
                  </span>
                  {cat.id === 'womens-care' && (
                    <Sparkles className="w-4 h-4 text-rose-500 fill-rose-500/20 shrink-0" />
                  )}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 text-gray-700 shadow-xs border border-black/5">
                  {cat.itemCount}+ items
                </span>
              </div>

              {/* Category Banner Tile: aspect-[4/3], rounded-2xl, subtle hover scale */}
              <div className="relative w-full aspect-[4/3] my-2 rounded-2xl overflow-hidden shadow-sm bg-gray-100 border border-black/5 group/sprite">
                <div
                  className="w-full h-full rounded-2xl transition-transform duration-500 ease-out group-hover:scale-105"
                  style={{
                    backgroundImage: hasCustomImage ? `url('${cat.image}')` : "url('/categories-banner.png')",
                    backgroundPosition: hasCustomImage
                      ? (cat.spritePosition || 'center')
                      : (cat.spritePosition ||
                        (cat.id === 'stationery'
                          ? '0% 0%'
                          : cat.id === 'drinks'
                          ? '50% 0%'
                          : cat.id === 'snacks'
                          ? '100% 0%'
                          : cat.id === 'electronics'
                          ? '0% 100%'
                          : '100% 100%')),
                    backgroundSize: hasCustomImage
                      ? (cat.spriteSize || 'cover')
                      : (cat.spriteSize ||
                        (cat.id === 'electronics' || cat.id === 'womens-care'
                          ? '220% 200%'
                          : '300% 200%')),
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
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
    </section>
  );
};
