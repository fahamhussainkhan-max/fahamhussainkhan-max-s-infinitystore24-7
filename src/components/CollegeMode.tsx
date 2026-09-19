import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Sparkles, Plus, Check, Zap, Backpack, Coffee, BookOpen, Headphones } from 'lucide-react';
import { COLLEGE_COMBOS } from '../data/mockData';
import { Product } from '../types';

interface CollegeModeProps {
  onAddComboToCart: (comboId: string) => void;
  addedCombos: Record<string, boolean>;
}

export const CollegeMode: React.FC<CollegeModeProps> = ({
  onAddComboToCart,
  addedCombos,
}) => {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="relative rounded-[32px] bg-gradient-to-br from-[#0A84FF]/10 via-[#FAFAF7] to-[#FFD60A]/10 border border-blue-200/60 p-6 sm:p-10 shadow-xl overflow-hidden">
        {/* Glow circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left: Headline & College Mode 3D composition */}
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0A84FF] text-white text-xs font-black uppercase tracking-wider shadow-sm">
              <GraduationCap className="w-4 h-4" />
              <span>🎓 College Mode: ON</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#111111] font-display leading-[1.1] tracking-tight">
              Forgot your pen?<br />
              Need a snack?<br />
              Out of toothpaste?<br />
              <span className="text-[#0A84FF]">We've got you.</span>
            </h2>

            <p className="text-sm sm:text-base text-gray-600 font-medium max-w-md">
              Engineered specifically for student emergencies. Packed in ultra-fast bundles so you never miss a lecture, test, or hostel curfew.
            </p>

            {/* 3D College Objects Floating Micro-Scene */}
            <div className="relative w-full h-44 sm:h-52 rounded-2xl bg-white/60 backdrop-blur-md border border-white/80 shadow-inner flex items-center justify-center overflow-hidden my-4">
              <div className="absolute text-[11px] font-bold text-gray-400 top-2 left-3 uppercase tracking-wider">
                Campus Emergency Float
              </div>

              {/* 1. Backpack */}
              <motion.div
                animate={{ y: [-6, 6, -6], rotateZ: [-3, 3, -3] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-8 w-14 h-16 rounded-2xl bg-[#111111] text-white flex flex-col items-center justify-center shadow-lg border border-white/20"
              >
                <Backpack className="w-7 h-7 text-[#FFD60A]" />
                <span className="text-[8px] font-bold mt-1">BAG</span>
              </motion.div>

              {/* 2. Notebook */}
              <motion.div
                animate={{ y: [6, -8, 6], rotateZ: [6, 12, 6] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                className="absolute left-24 sm:left-28 w-14 h-18 rounded-xl bg-gradient-to-br from-[#30D158] to-emerald-700 text-white flex flex-col items-center justify-center shadow-md p-1"
              >
                <BookOpen className="w-6 h-6 text-white" />
                <span className="text-[7px] font-bold">NOTES</span>
              </motion.div>

              {/* 3. Pen */}
              <motion.div
                animate={{ y: [-10, 6, -10], rotateZ: [-35, -25, -35] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute top-6 left-44 w-3.5 h-16 rounded-full bg-gradient-to-b from-blue-600 via-sky-400 to-black shadow-md border border-white/30"
              />

              {/* 4. Headphones */}
              <motion.div
                animate={{ y: [8, -6, 8], rotateZ: [10, -4, 10] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                className="absolute right-24 sm:right-32 w-14 h-14 rounded-full bg-white shadow-xl border border-gray-100 flex items-center justify-center text-[#FF3B30]"
              >
                <Headphones className="w-7 h-7" />
              </motion.div>

              {/* 5. Coffee Cup */}
              <motion.div
                animate={{ y: [-5, 7, -5], rotateZ: [-6, 4, -6] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute right-8 w-12 h-14 rounded-xl bg-gradient-to-b from-[#AC8E68] to-[#6f4e37] text-white flex flex-col items-center justify-center shadow-lg"
              >
                <Coffee className="w-6 h-6 text-yellow-100" />
                <span className="text-[7px] font-bold">HOT</span>
              </motion.div>
            </div>
          </div>

          {/* Right: Quick Curated Emergency Kits */}
          <div className="lg:col-span-6 space-y-3.5">
            <div className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2">
              Instant 1-Click Campus Emergency Kits
            </div>

            {COLLEGE_COMBOS.map((combo) => {
              const isAdded = addedCombos[combo.id];

              return (
                <div
                  key={combo.id}
                  className="group relative rounded-2xl bg-white p-4 sm:p-5 border border-gray-200/90 hover:border-[#0A84FF] shadow-sm hover:shadow-lg transition-all duration-300 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={combo.image}
                      alt={combo.title}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                    />
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-50 text-[#0A84FF]">
                        {combo.tag}
                      </span>
                      <h3 className="text-sm sm:text-base font-extrabold text-gray-900 mt-1 leading-snug">
                        {combo.title}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {combo.itemsSummary}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-sm sm:text-base font-black text-gray-900">
                          ₹{combo.price}
                        </span>
                        <span className="text-xs text-gray-400 line-through">
                          ₹{combo.originalPrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1-click Add Kit Button */}
                  <button
                    type="button"
                    onClick={() => onAddComboToCart(combo.id)}
                    className={`flex-shrink-0 flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-95 ${
                      isAdded
                        ? 'bg-[#30D158] text-white'
                        : 'bg-[#111111] hover:bg-[#0A84FF] text-white'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Added ✓</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Add Kit</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
