import React from 'react';
import { motion } from 'motion/react';
import { Zap, ArrowRight } from 'lucide-react';
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
    <section className="relative w-full max-w-full overflow-hidden pt-3 sm:pt-8 pb-5 sm:pb-12 bg-[#FAFAF7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 lg:gap-6 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-6 space-y-3.5 sm:space-y-6 text-left">
            <div className="flex flex-col items-start gap-1.5 sm:gap-2">
              {/* EDC Authorization Sub-Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-50/90 border border-amber-300/80 shadow-2xs text-amber-900 text-xs font-semibold max-w-full"
              >
                {/* <!-- EDC_LOGO_PLACEHOLDER: Replace src with EDC logo asset --> */}
                <div
                  id="hero-edc-logo-container"
                  className="relative w-5 h-5 sm:w-6 sm:h-6 rounded-md border border-dashed border-amber-500/70 bg-white flex items-center justify-center p-0.5 shadow-2xs flex-shrink-0"
                  title="EDC Logo Slot"
                >
                  <div className="w-full h-full rounded bg-amber-100/80 border border-amber-200 flex flex-col items-center justify-center text-center">
                    <span className="text-[7px] sm:text-[7.5px] font-black tracking-tighter text-amber-800 leading-none">
                      EDC
                    </span>
                  </div>
                </div>
                <span className="text-[10.5px] xs:text-[11px] sm:text-xs font-bold text-amber-950 truncate max-w-[260px] xs:max-w-none">
                  Authorized by Entrepreneurship Development Cell (EDC) • Verified Student Initiative
                </span>
              </motion.div>

              {/* Official Motto Campus Badge */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white shadow-sm border border-gray-200/90 text-[11px] sm:text-xs font-black tracking-wider text-[#111111]"
              >
                <Zap className="w-3.5 h-3.5 fill-[#FF3B30] text-[#FF3B30]" />
                <span>⚡ OFFICIAL 45-MIN CAMPUS QUICK-COMMERCE FOR CCCT & SIST</span>
              </motion.div>

              {/* Highlighted Promotional Badge: 50% OFF on Delivery Charges */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 }}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white shadow-md shadow-red-500/25 border border-white/30 text-xs sm:text-sm font-black tracking-wide"
              >
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-90" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-300" />
                </span>
                <span className="text-yellow-200 font-black uppercase text-[11px] sm:text-xs tracking-wider">
                  🔥 Special Offer:
                </span>
                <span className="font-extrabold text-white text-xs sm:text-sm">
                  Flat 50% OFF on Delivery Charges — Now at ₹15!
                </span>
              </motion.div>
            </div>

            {/* Main Headline specifically for CCCT & SIST */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-black text-[#111111] font-display tracking-tight leading-[1.12] sm:leading-[1.08]"
            >
              Everything you need.<br />
              <span className="text-[#0A84FF]">Right when you need it</span>{' '}
              <span className="text-[#FF3B30]">for CCCT & SIST.</span>
            </motion.h1>

            {/* Supporting Text */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xs xs:text-sm sm:text-base lg:text-lg text-gray-600 font-medium max-w-lg leading-relaxed"
            >
              Snacks, chilled drinks, stationery, and hostel essentials — delivered directly to your room or campus spot in minutes.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 sm:gap-3 pt-0.5 sm:pt-1 w-full xs:w-auto"
            >
              <button
                type="button"
                onClick={onShopNow}
                className="cursor-pointer pointer-events-auto flex items-center justify-center gap-2 px-5 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-[#111111] hover:bg-[#0A84FF] text-white font-extrabold text-xs xs:text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 group w-full xs:w-auto min-h-[44px] sm:min-h-[48px]"
              >
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={onExploreCategories}
                className="cursor-pointer pointer-events-auto flex items-center justify-center px-5 sm:px-7 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white hover:bg-gray-100/80 text-[#111111] font-extrabold text-xs xs:text-sm sm:text-base border border-gray-200 shadow-sm transition-all duration-200 active:scale-95 w-full xs:w-auto min-h-[44px] sm:min-h-[48px]"
              >
                Explore Categories
              </button>
            </motion.div>

            {/* Delivery Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-1 sm:pt-2 flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm font-semibold text-gray-600"
            >
              <div className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-[#30D158] animate-ping" />
                <span className="font-bold">● CCCT & SIST Active</span>
              </div>
              <span className="hidden sm:inline text-gray-300">•</span>
              <div className="text-gray-700 font-semibold">
                Delivery within 30 - 45 mins
              </div>
            </motion.div>
          </div>

          {/* Right 3D Scene with Responsive Scaling Wrapper for Mobile */}
          <div className="lg:col-span-6 flex items-center justify-center w-full max-w-full overflow-hidden mt-1 lg:mt-0">
            {/* Scaling wrapper for mobile to fit cleanly within smaller screens without card overlap */}
            <div className="w-full flex items-center justify-center overflow-hidden py-1">
              <div className="w-full max-w-[350px] xs:max-w-[420px] sm:max-w-[480px] md:max-w-none flex items-center justify-center">
                <div className="w-full transform scale-[0.85] xs:scale-[0.90] sm:scale-95 md:scale-100 origin-center transition-transform duration-300">
                  <HeroScene3D />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { HERO_CAMPUS_ILLUSTRATION_BASE64 } from './heroAssetBase64';
export const Hero = HeroSection;
export default HeroSection;
