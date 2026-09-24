import React, { useState } from 'react';
import { 
  Printer, 
  MessageCircle, 
  FileText, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  X 
} from 'lucide-react';

export const CampusPrintWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [bwPages, setBwPages] = useState<number>(1);
  const [colorPages, setColorPages] = useState<number>(1);

  const printWhatsAppNumber = '919332727610';

  const handleWhatsAppRedirect = (type: 'Black & White' | 'Color', pages: number, rate: number) => {
    const total = pages * rate;
    const message = 
      `*NEW PRINT ORDER REQUEST*\n` +
      `--------------------------------\n` +
      `• Type: ${type} Printout\n` +
      `• Rate: ₹${rate}/page\n` +
      `• Pages/Copies: ${pages}\n` +
      `• Total Amount: ₹${total}\n` +
      `--------------------------------\n` +
      `Please print the attached document. Let me know once ready!`;

    const url = `https://wa.me/${printWhatsAppNumber}?text=${encodeURIComponent(message)}`;
    try {
      const opened = window.open(url, '_blank');
      if (!opened) {
        window.location.href = url;
      }
    } catch {
      window.location.href = url;
    }
  };

  if (!isOpen) return null;

  return (
    <div id="printout-section" className="w-full px-3 sm:px-4 pt-3 pb-6 max-w-5xl mx-auto">
      <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-6 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 shadow-[0_15px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        
        {/* Dismiss Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800/90 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/60 flex items-center justify-center transition active:scale-90 z-10 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-5 sm:mb-6 pr-6 pl-2 sm:px-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5 animate-pulse" /> Campus Xerox & Printout Desk
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
            Instant Document Printing
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1 max-w-md">
            Select page count and send your file directly on WhatsApp for hostel delivery.
          </p>
        </div>

        {/* Responsive 3D Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          
          {/* 1. Black & White Printout Card */}
          <div className="group relative rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/60 shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_28px_rgba(16,185,129,0.2)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-300 px-2.5 py-0.5 rounded-full font-medium">
                  Standard 75 GSM
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                Black & White Printout
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Assignments, lecture notes, and study material
              </p>

              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">₹10</span>
                <span className="text-[11px] text-slate-400 font-normal">/ page</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/50 space-y-3">
              <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-300 font-medium">Pages:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBwPages(prev => Math.max(1, prev - 1))}
                    className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-xs active:scale-90 transition border border-slate-700 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-white px-2">{bwPages}</span>
                  <button
                    type="button"
                    onClick={() => setBwPages(prev => prev + 1)}
                    className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-xs active:scale-90 transition border border-slate-700 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleWhatsAppRedirect('Black & White', bwPages, 10)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 active:scale-[0.98] transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send File on WhatsApp (₹{bwPages * 10})</span>
              </button>
            </div>
          </div>

          {/* 2. Color Printout Card */}
          <div className="group relative rounded-xl sm:rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/60 shadow-[0_8px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.2)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Glossy HD
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                Color Printout
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Project covers, diagrams, posters, and charts
              </p>

              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">₹20</span>
                <span className="text-[11px] text-slate-400 font-normal">/ page</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/50 space-y-3">
              <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-300 font-medium">Pages:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setColorPages(prev => Math.max(1, prev - 1))}
                    className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-xs active:scale-90 transition border border-slate-700 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-white px-2">{colorPages}</span>
                  <button
                    type="button"
                    onClick={() => setColorPages(prev => prev + 1)}
                    className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center font-bold text-xs active:scale-90 transition border border-slate-700 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleWhatsAppRedirect('Color', colorPages, 20)}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/60 active:scale-[0.98] transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send File on WhatsApp (₹{colorPages * 20})</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-slate-500 text-[10px] sm:text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Confidential Prints • Delivered in 15 Minutes</span>
        </div>

      </div>
    </div>
  );
};

export default CampusPrintWidget;
