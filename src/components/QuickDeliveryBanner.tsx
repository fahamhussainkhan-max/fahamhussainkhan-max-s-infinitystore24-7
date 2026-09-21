import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bike, Zap, X, Clock, ChevronRight } from 'lucide-react';
import { CampusZone } from '../types';

interface QuickDeliveryBannerProps {
  selectedZone: CampusZone;
  onOpenZoneSelector: () => void;
}

export const QuickDeliveryBanner: React.FC<QuickDeliveryBannerProps> = ({
  selectedZone,
  onOpenZoneSelector,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Campus Quick-Delivery Status"
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="fixed bottom-5 left-4 sm:left-6 z-30 max-w-[calc(100vw-2rem)] sm:max-w-sm"
      >
        <div className="relative rounded-2xl bg-[#111111]/95 text-white p-3.5 sm:p-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] border border-white/15 backdrop-blur-xl flex items-center gap-3 group">
          {/* Animated pulsing delivery beacon */}
          <div className="relative flex-shrink-0">
            <motion.div
              animate={{ rotate: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0A84FF] to-[#30D158] flex items-center justify-center text-white shadow-lg"
            >
              <Bike className="w-5 h-5" />
            </motion.div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30D158] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#30D158] border-2 border-[#111111]" />
            </span>
          </div>

          {/* Text Content */}
          <div
            onClick={onOpenZoneSelector}
            className="flex-1 cursor-pointer pr-1"
          >
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#30D158]">
              <Zap className="w-3 h-3 fill-[#30D158]" />
              <span>Campus Quick-Delivery Live</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-white flex items-center gap-1 mt-0.5">
              <span>10-15 Min Rush to</span>
              <span className="text-[#FFD60A] underline underline-offset-2 decoration-[#FFD60A]/60">
                {selectedZone.name}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
              <Clock className="w-3 h-3 text-gray-500" />
              <span>Two-wheeler sprint active • 0 delay</span>
            </div>
          </div>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Dismiss quick delivery banner"
            aria-label="Dismiss quick delivery banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
