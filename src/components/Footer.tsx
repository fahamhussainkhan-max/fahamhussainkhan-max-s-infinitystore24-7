import React from 'react';
import { Zap, Heart, Shield, Clock, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#111111] text-white border-t border-gray-800 pt-12 sm:pt-16 pb-24 sm:pb-12 mt-16 select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-gray-800/80">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-white/10 p-1.5 flex items-center justify-center">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                  <defs>
                    <linearGradient id="footerInfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF3B30" />
                      <stop offset="33%" stopColor="#FFD60A" />
                      <stop offset="66%" stopColor="#0A84FF" />
                      <stop offset="100%" stopColor="#30D158" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 30,25 C 15,25 15,40 30,40 C 45,40 55,10 70,10 C 85,10 85,25 70,25 C 55,25 45,40 30,40"
                    fill="none"
                    stroke="url(#footerInfGrad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="text-xl font-black font-display tracking-tight text-white">
                Infinity Store
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-400 max-w-sm leading-relaxed">
              Hyperlocal quick-commerce engineered exclusively for college students, faculty, and surrounding hostels. Packed at the campus edge, delivered in 10-15 minutes.
            </p>

            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-[#30D158] animate-ping" />
              <span>Campus Hub Operating 24/7 (Exam Timings Active)</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="md:col-span-3 space-y-2 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Campus Aisles
            </h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#campus-favourites" className="hover:text-white transition-colors">🔥 Campus Favourites</a></li>
              <li><a href="#categories-section" className="hover:text-white transition-colors">🍜 Instant Food & Snacks</a></li>
              <li><a href="#hostel-essentials" className="hover:text-white transition-colors">🏠 Hostel Toiletries & Laundry</a></li>
              <li><a href="#categories-section" className="hover:text-white transition-colors">📚 Exam Stationery & Calculators</a></li>
              <li><a href="#search-section" className="hover:text-white transition-colors">⚡ Flash Deals & Combos</a></li>
            </ul>
          </div>

          {/* Col 3: Student Runner Network & Campus Support */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              Campus Dispatch & Runners
            </h4>
            <p className="text-xs text-gray-400">
              Deliveries are handled by verified students on electric cycles. Interested in flexible runner shifts between classes?
            </p>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1">
              <div className="flex items-center gap-2 text-gray-300">
                <Phone className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>Campus WhatsApp Desk: +91 (Campus Ext. 402)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-3.5 h-3.5 text-[#FF3B30]" />
                <span>Hub Location: Gate 2 Student Plaza Complex</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
          <div>
            © {new Date().getFullYear()} Infinity Store Inc. Hyperlocal Quick Commerce.
          </div>
          <div className="flex items-center gap-1">
            <span>Crafted for college life with</span>
            <Heart className="w-3.5 h-3.5 text-[#FF3B30] fill-[#FF3B30]" />
            <span>and zero delays</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
