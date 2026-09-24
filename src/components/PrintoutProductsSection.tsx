import React, { useState } from 'react';
import { Printer, MessageCircle, FileText, Sparkles, CheckCircle2 } from 'lucide-react';

export const PrintoutProductsSection: React.FC = () => {
  const [bwPages, setBwPages] = useState<number>(1);
  const [colorPages, setColorPages] = useState<number>(1);

  const adminPhone = "919332727610"; // Dispatch Desk WhatsApp Number

  const handleWhatsAppPrint = (type: 'Black & White' | 'Color', pages: number, rate: number) => {
    const totalAmount = pages * rate;
    const message = 
      `*NEW PRINT ORDER REQUEST*\n` +
      `--------------------------------\n` +
      `• Type: ${type} Printout\n` +
      `• Rate: ₹${rate}/page\n` +
      `• Total Pages: ${pages}\n` +
      `• Total Cost: ₹${totalAmount}\n` +
      `--------------------------------\n` +
      `Please print this attached file. Let me know once ready!`;

    const url = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
    try {
      const opened = window.open(url, '_blank');
      if (!opened) {
        window.location.href = url;
      }
    } catch {
      window.location.href = url;
    }
  };

  return (
    <section id="printout-section" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2 mb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs font-black tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Campus Xerox & Printout Desk</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 font-display tracking-tight">
            Instant Document Printing
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Select page count & send your file directly on WhatsApp to Dispatch (+91 93327 27610)
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>No Cart Required • Direct WhatsApp Dispatch</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {/* 1. Black & White Printout Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700 transition-all">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-slate-800 rounded-xl text-slate-200">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Black & White Printout</h3>
                <p className="text-xs text-slate-400">Standard single-page B&W document printing</p>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 my-2">
              ₹10 <span className="text-xs text-slate-400 font-normal">/ page</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3 bg-slate-800/60 p-2 rounded-xl">
              <span className="text-xs text-slate-300 font-medium">Pages to Print:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBwPages(prev => Math.max(1, prev - 1))}
                  className="w-7 h-7 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold text-sm flex items-center justify-center transition cursor-pointer"
                  aria-label="Decrease B&W pages"
                >
                  -
                </button>
                <span className="text-white font-bold text-sm px-1 min-w-[20px] text-center">{bwPages}</span>
                <button
                  type="button"
                  onClick={() => setBwPages(prev => prev + 1)}
                  className="w-7 h-7 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold text-sm flex items-center justify-center transition cursor-pointer"
                  aria-label="Increase B&W pages"
                >
                  +
                </button>
              </div>
            </div>

            {/* Direct WhatsApp File Action - No Add to Cart */}
            <button
              type="button"
              onClick={() => handleWhatsAppPrint('Black & White', bwPages, 10)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Send File on WhatsApp (₹{bwPages * 10})</span>
            </button>
          </div>
        </div>

        {/* 2. Color Printout Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-lg hover:border-slate-700 transition-all">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Color Printout</h3>
                <p className="text-xs text-slate-400">High-quality vivid color page printing</p>
              </div>
            </div>
            <div className="text-2xl font-extrabold text-amber-400 my-2">
              ₹20 <span className="text-xs text-slate-400 font-normal">/ page</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3 bg-slate-800/60 p-2 rounded-xl">
              <span className="text-xs text-slate-300 font-medium">Pages to Print:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setColorPages(prev => Math.max(1, prev - 1))}
                  className="w-7 h-7 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold text-sm flex items-center justify-center transition cursor-pointer"
                  aria-label="Decrease color pages"
                >
                  -
                </button>
                <span className="text-white font-bold text-sm px-1 min-w-[20px] text-center">{colorPages}</span>
                <button
                  type="button"
                  onClick={() => setColorPages(prev => prev + 1)}
                  className="w-7 h-7 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold text-sm flex items-center justify-center transition cursor-pointer"
                  aria-label="Increase color pages"
                >
                  +
                </button>
              </div>
            </div>

            {/* Direct WhatsApp File Action - No Add to Cart */}
            <button
              type="button"
              onClick={() => handleWhatsAppPrint('Color', colorPages, 20)}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-md"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Send File on WhatsApp (₹{colorPages * 20})</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
