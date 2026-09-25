import React from 'react';
import { motion } from 'motion/react';
import { Zap, ArrowRight, Sparkles } from 'lucide-react';
import { HeroScene3D } from './HeroScene3D';

interface HeroSectionProps {
  onShopNow: () => void;
  onExploreCategories: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onShopNow,
  onExploreCategories,
}) => {
  return (
    <section className="relative w-full max-w-full overflow-hidden pt-3 sm:pt-8 pb-6 sm:pb-12 bg-[#FAFAF7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-6 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6 text-left">
            {/* Small Badge */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white shadow-sm border border-gray-200/90 text-xs font-black tracking-wider text-[#111111]"
            >
              <Zap className="w-3.5 h-3.5 fill-[#FF3B30] text-[#FF3B30]" />
              <span>⚡ CAMPUS DELIVERY</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black text-[#111111] font-display tracking-tight leading-[1.08]"
            >
              Everything you need.<br />
              <span className="text-[#0A84FF]">Right when you</span>{' '}
              <span className="text-[#FF3B30]">need it.</span>
            </motion.h1>

            {/* Supporting Text */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-sm sm:text-lg text-gray-600 font-medium max-w-lg leading-relaxed"
            >
              Snacks, drinks, stationery, essentials and more — delivered around your campus.
            </motion.p>

            {/* Action Buttons - Stack vertically on mobile, row on tablet/desktop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 w-full sm:w-auto"
            >
              <button
                type="button"
                onClick={onShopNow}
                className="cursor-pointer pointer-events-auto flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl bg-[#111111] hover:bg-[#0A84FF] text-white font-extrabold text-sm sm:text-base shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95 group w-full sm:w-auto min-h-[48px]"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={onExploreCategories}
                className="cursor-pointer pointer-events-auto flex items-center justify-center px-6 sm:px-7 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-gray-100/80 text-[#111111] font-extrabold text-sm sm:text-base border border-gray-200 shadow-sm transition-all duration-200 active:scale-95 w-full sm:w-auto min-h-[48px]"
              >
                Explore Categories
              </button>
            </motion.div>

            {/* Delivery Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm font-semibold text-gray-600"
            >
              <div className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#30D158] animate-ping" />
                <span className="font-bold">● Delivering near you</span>
              </div>
              <span className="hidden sm:inline text-gray-300">•</span>
              <div className="text-gray-500 font-medium">
                Fast delivery around campus (Avg. 10-15 mins)
              </div>
            </motion.div>
          </div>

          {/* Right 3D Scene */}
          <div className="lg:col-span-6 flex items-center justify-center w-full max-w-full overflow-hidden">
            <HeroScene3D />
          </div>
        </div>
      </div>
    </section>
  );
};
