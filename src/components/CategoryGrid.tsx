import React, { useRef, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutGrid,
  SlidersHorizontal,
} from 'lucide-react';
import { CATEGORIES, sortCategoriesInStorefrontOrder, CATEGORY_DEFAULT_IMAGES } from '../data/mockData';
import { Category } from '../types';

interface CategoryGridProps {
  categories?: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

/**
 * Resolves a crisp, uncorrupted image URL for a category.
 * Replaces any stale sprite banner references with dedicated category photography.
 */
function getCategoryImageUrl(cat: Category): string {
  if (cat.image && !cat.image.includes('categories-banner.png') && !cat.image.startsWith('/categories-banner')) {
    return cat.image;
  }
  const id = (cat.id || '').toLowerCase().trim();
  const slug = (cat.slug || '').toLowerCase().trim();

  if (id.includes('stationery') || slug.includes('stationery') || id.includes('study')) {
    return CATEGORY_DEFAULT_IMAGES.stationery;
  }
  if (id.includes('drink') || slug.includes('drink') || id.includes('beverage')) {
    return CATEGORY_DEFAULT_IMAGES.drinks;
  }
  if (id.includes('electronic') || id.includes('tech') || id.includes('essential')) {
    return CATEGORY_DEFAULT_IMAGES.electronics;
  }
  if (id.includes('snack') || slug.includes('snack') || id.includes('munch')) {
    return CATEGORY_DEFAULT_IMAGES.snacks;
  }
  if (id.includes('women') || slug.includes('women') || id.includes('hygiene')) {
    return CATEGORY_DEFAULT_IMAGES['womens-care'];
  }

  return (
    CATEGORY_DEFAULT_IMAGES[id] ||
    CATEGORY_DEFAULT_IMAGES[slug] ||
    CATEGORY_DEFAULT_IMAGES.stationery
  );
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'carousel'>('grid');

  // Explicitly sort categories into the strict 1-5 sequence:
  // 1. Stationery & Study Supplies
  // 2. Drinks & Beverages
  // 3. Daily Essentials & Tech
  // 4. Snacks & Munchies
  // 5. Women's Care
  const sortedCategories = useMemo(() => {
    const base = categories && categories.length > 0 ? categories : CATEGORIES;
    return sortCategoriesInStorefrontOrder(base);
  }, [categories]);

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
            Pick a category to instantly explore verified in-stock campus supplies
          </p>
        </div>

        {/* Action Controls: Show All, View Switcher & Carousel Arrows */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {selectedCategory && (
            <button
              onClick={() => onSelectCategory(null)}
              className="text-xs font-bold text-gray-600 hover:text-black px-3.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors min-h-[34px] flex items-center cursor-pointer"
            >
              Show All Aisles
            </button>
          )}

          {/* View mode toggle (Grid vs Carousel) */}
          <div className="flex items-center p-0.5 rounded-full bg-gray-100 border border-gray-200/90 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-950 shadow-2xs font-extrabold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              aria-label="Grid layout"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[11px]">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('carousel')}
              className={`px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'carousel'
                  ? 'bg-white text-gray-950 shadow-2xs font-extrabold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              aria-label="Carousel scroll layout"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-[11px]">Scroll</span>
            </button>
          </div>

          {viewMode === 'carousel' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scroll('left')}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 shadow-2xs text-gray-700 transition-all flex items-center justify-center cursor-pointer"
                aria-label="Scroll categories left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 shadow-2xs text-gray-700 transition-all flex items-center justify-center cursor-pointer"
                aria-label="Scroll categories right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Categories Presentation: Responsive Grid OR Snap Carousel */}
      <div
        ref={scrollRef}
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 items-stretch'
            : 'flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-3 pt-1 snap-x snap-mandatory select-none overscroll-x-contain touch-pan-x'
        }
      >
        {sortedCategories.map((cat, idx) => {
          const isSelected =
            selectedCategory === cat.id ||
            selectedCategory === cat.slug ||
            selectedCategory === cat.name;

          const imgUrl = getCategoryImageUrl(cat);
          const isFifthCard = idx === 4;

          return (
            <motion.div
              key={`cat-card-${cat.id}-${idx}`}
              onClick={() => onSelectCategory(isSelected ? null : cat.id)}
              whileHover={{ y: -4, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`group cursor-pointer rounded-2xl sm:rounded-3xl p-3 sm:p-4 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-full min-h-[230px] sm:min-h-[250px] ${
                viewMode === 'carousel'
                  ? 'flex-shrink-0 w-[165px] xs:w-[195px] sm:w-auto snap-start'
                  : isFifthCard
                  ? 'col-span-2 sm:col-span-1'
                  : 'col-span-1'
              } ${
                cat.bgGradient || 'from-blue-500/10 via-cyan-500/10 to-sky-500/10 border-blue-200/80'
              } ${
                isSelected
                  ? 'ring-2 ring-black shadow-xl scale-[1.01] bg-white'
                  : 'shadow-xs hover:shadow-lg bg-white/95 backdrop-blur-xs'
              }`}
            >
              {/* Decorative subtle ambient gradient wash */}
              <div
                className="absolute inset-0 opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none"
                style={{
                  background: `radial-gradient(circle at top right, ${cat.accentColor || '#0A84FF'}, transparent 70%)`,
                }}
              />

              {/* Special adaptive layout for 5th card on 2-col mobile screens to fill grid symmetrically */}
              {isFifthCard && viewMode === 'grid' ? (
                <div className="flex sm:flex-col justify-between h-full w-full gap-3 sm:gap-0">
                  {/* Left Column on mobile / Top content on desktop */}
                  <div className="flex flex-col justify-between flex-1">
                    {/* Top Row: Emoji & Item Count badge */}
                    <div className="flex items-center justify-between z-10 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xl sm:text-2xl filter drop-shadow-2xs group-hover:scale-110 transition-transform">
                          {cat.emoji || '🌸'}
                        </span>
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 fill-rose-500/20 shrink-0" />
                      </div>
                      <span className="text-[10px] xs:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-white/90 text-gray-700 shadow-2xs border border-black/5 whitespace-nowrap">
                        {cat.itemCount}+ items
                      </span>
                    </div>

                    {/* Mobile teaser description */}
                    <div className="hidden xs:block sm:hidden text-[11px] text-gray-500 font-medium line-clamp-2 my-1">
                      {cat.description || 'Intimate hygiene, gentle skincare & comfort'}
                    </div>

                    {/* Desktop hidden placeholder for image slot */}
                    <div className="hidden sm:block relative w-full aspect-[4/3] my-2 sm:my-2.5 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xs bg-gray-100 border border-black/5 group-hover:shadow-md transition-shadow">
                      <img
                        src={imgUrl}
                        alt={cat.name}
                        loading="lazy"
                        className="w-full h-full object-cover rounded-xl sm:rounded-2xl transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl sm:rounded-2xl pointer-events-none" />
                    </div>

                    {/* Bottom Title & Action Button */}
                    <div className="z-10 mt-auto flex items-center justify-between pt-1">
                      <h3 className="text-xs xs:text-sm font-extrabold text-gray-900 leading-snug group-hover:text-[#0A84FF] transition-colors line-clamp-2">
                        {cat.name}
                      </h3>
                      <div className="w-6 h-6 rounded-full bg-white/90 shadow-2xs flex items-center justify-center text-gray-700 group-hover:bg-[#111111] group-hover:text-white transition-all transform group-hover:translate-x-0.5 ml-2 shrink-0">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Right image banner on mobile screen */}
                  <div className="block sm:hidden w-28 xs:w-36 aspect-[4/3] rounded-xl overflow-hidden shadow-2xs bg-gray-100 border border-black/5 shrink-0 my-auto">
                    <img
                      src={imgUrl}
                      alt={cat.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>
                </div>
              ) : (
                /* Standard Uniform Card Layout (Cards 1-4 and all cards in carousel / desktop) */
                <div className="flex flex-col justify-between h-full w-full">
                  {/* Top row: Emoji & Item Count badge */}
                  <div className="flex items-center justify-between z-10 mb-1.5 h-7">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl sm:text-2xl filter drop-shadow-2xs group-hover:scale-110 transition-transform">
                        {cat.emoji || '📦'}
                      </span>
                      {cat.id === 'womens-care' && (
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 fill-rose-500/20 shrink-0" />
                      )}
                    </div>
                    <span className="text-[10px] xs:text-[11px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-white/90 text-gray-700 shadow-2xs border border-black/5 whitespace-nowrap">
                      {cat.itemCount}+ items
                    </span>
                  </div>

                  {/* Category Image: Explicit aspect-[4/3], object-cover, clean rounded corners */}
                  <div className="relative w-full aspect-[4/3] my-2 sm:my-2.5 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xs bg-gray-100 border border-black/5 group-hover:shadow-md transition-shadow">
                    <img
                      src={imgUrl}
                      alt={cat.name}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fallback =
                          CATEGORY_DEFAULT_IMAGES[cat.id] ||
                          CATEGORY_DEFAULT_IMAGES['stationery'];
                        if (target.src !== fallback) {
                          target.src = fallback;
                        }
                      }}
                      className="w-full h-full object-cover rounded-xl sm:rounded-2xl transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-xl sm:rounded-2xl pointer-events-none" />
                  </div>

                  {/* Title & Action Arrow Row */}
                  <div className="z-10 mt-auto flex items-center justify-between min-h-[36px] pt-1">
                    <h3 className="text-xs xs:text-sm font-extrabold text-gray-900 leading-snug group-hover:text-[#0A84FF] transition-colors line-clamp-2 pr-1">
                      {cat.name}
                    </h3>
                    <div className="w-6 h-6 rounded-full bg-white/90 shadow-2xs flex items-center justify-center text-gray-700 group-hover:bg-[#111111] group-hover:text-white transition-all transform group-hover:translate-x-0.5 shrink-0">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryGrid;
