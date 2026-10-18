import React, { useRef, useMemo } from 'react';
import { CATEGORIES, sortCategoriesInStorefrontOrder } from '../data/mockData';
import { Category } from '../types';
import { Heart } from 'lucide-react';

interface CategoryPillsProps {
  categories?: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCategories = useMemo(() => {
    const base = categories && categories.length > 0 ? categories : CATEGORIES;
    return sortCategoriesInStorefrontOrder(base);
  }, [categories]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-3">
      <div
        ref={containerRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 select-none overscroll-x-contain touch-pan-x"
      >
        {/* 'All Aisles' Pill */}
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={`relative px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide shrink-0 transition-transform active:scale-95 duration-150 touch-manipulation cursor-pointer flex items-center gap-1.5 select-none ${
            selectedCategory === null
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'bg-white text-neutral-700 hover:text-black border border-neutral-200 shadow-2xs hover:border-neutral-300'
          }`}
        >
          <span>All Items</span>
        </button>

        {/* Categories Pills */}
        {displayCategories.map((cat, idx) => {
          const isSelected =
            selectedCategory === cat.id ||
            selectedCategory === cat.slug ||
            selectedCategory === cat.name;

          return (
            <button
              key={`cat-pill-${cat.id}-${idx}`}
              type="button"
              onClick={() => onSelectCategory(isSelected ? null : cat.id)}
              className={`relative px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide shrink-0 transition-transform active:scale-95 duration-150 touch-manipulation cursor-pointer flex items-center gap-1.5 select-none ${
                isSelected
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-white text-neutral-700 hover:text-black border border-neutral-200 shadow-2xs hover:border-neutral-300'
              }`}
            >
              {cat.id === 'womens-care' ? (
                <Heart
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isSelected ? 'text-white fill-white' : 'text-rose-500 fill-rose-500/20'
                  }`}
                />
              ) : (
                <span className="text-xs">{cat.emoji}</span>
              )}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
