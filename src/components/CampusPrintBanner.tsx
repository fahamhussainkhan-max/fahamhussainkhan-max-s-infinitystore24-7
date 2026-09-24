import React from 'react';
import { motion } from 'motion/react';
import { Printer, Zap, ArrowRight, FileText, CheckCircle2, MessageCircle } from 'lucide-react';

interface CampusPrintBannerProps {
  onOpenPrintModal: () => void;
}

export const CampusPrintBanner: React.FC<CampusPrintBannerProps> = ({
  onOpenPrintModal,
}) => {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4">
      <div className="relative rounded-3xl bg-gradient-to-r from-neutral-900 via-neutral-800 to-zinc-900 text-white p-5 sm:p-6 md:p-8 overflow-hidden shadow-xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group">
        {/* Glow Effects */}
        <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-[#0A84FF]/25 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-[#30D158]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-[#0A84FF] to-[#30D158] flex items-center justify-center text-white shadow-lg flex-shrink-0 group-hover:scale-105 transition-transform">
            <Printer className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded-full text-[#FFD60A] border border-white/10 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-[#FFD60A]" /> Campus Xerox & Printout Desk
              </span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 10-Min Fast Turnaround
              </span>
            </div>

            <h3 className="text-lg sm:text-2xl font-black font-display text-white tracking-tight">
              Need urgent assignments, lab reports or slides printed?
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
              B&W at <strong>₹10/page</strong> • High-res Color at <strong>₹20/page</strong>. Just send your PDF on WhatsApp and collect or get it runner-delivered!
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="relative z-10 flex-shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={onOpenPrintModal}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#25D366] to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white font-black text-xs sm:text-sm shadow-xl hover:shadow-2xl transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Order Print via WhatsApp</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
