import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { CATEGORIES } from '../data/mockData';
import { Sparkles } from 'lucide-react';

interface CategoryPillsProps {
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-3">
      <div
        ref={containerRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-1 select-none overscroll-x-contain touch-pan-x"
      >
        {/* 'All Aisles' Pill */}
        <motion.button
          type="button"
          onClick={() => onSelectCategory(null)}
          whileHover={{ y: -2, scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 450, damping: 22 }}
          className={`relative px-4 py-2 rounded-full text-xs font-black tracking-wide shrink-0 transition-all duration-300 flex items-center gap-1.5 ${
            selectedCategory === null
              ? 'text-white shadow-[0_4px_18px_rgba(17,17,17,0.35)]'
              : 'bg-white text-gray-700 hover:text-black border border-gray-200/90 shadow-xs hover:border-gray-300'
          }`}
        >
          {selectedCategory === null && (
            <motion.div
              layoutId="activeCategoryPillGlow"
              className="absolute inset-0 rounded-full bg-gradient-to-r from-[#111111] via-[#222222] to-[#111111] -z-10 shadow-[0_0_20px_rgba(0,0,0,0.25)]"
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            />
          )}
          <Sparkles className={`w-3.5 h-3.5 ${selectedCategory === null ? 'text-[#FFD60A]' : 'text-gray-400'}`} />
          <span>All Aisles</span>
        </motion.button>

        {/* Categories Pills */}
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <motion.button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(isSelected ? null : cat.id)}
              whileHover={{ y: -2, scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 450, damping: 22 }}
              className={`relative px-4 py-2 rounded-full text-xs font-black tracking-wide shrink-0 transition-all duration-300 flex items-center gap-1.5 ${
                isSelected
                  ? 'text-white shadow-[0_4px_22px_rgba(10,132,255,0.45)]'
                  : 'bg-white text-gray-700 hover:text-black border border-gray-200/90 shadow-xs hover:border-gray-300'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeCategoryPillGlow"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-[#0A84FF] to-[#0060df] -z-10 shadow-[0_0_22px_rgba(10,132,255,0.6)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                />
              )}
              <span className="text-sm">{cat.emoji}</span>
              <span>{cat.name}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
