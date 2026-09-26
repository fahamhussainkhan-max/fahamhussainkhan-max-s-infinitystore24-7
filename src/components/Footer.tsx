import React from 'react';
import { Heart, Shield, Clock, Phone, MapPin, Package, Code, UserCheck, Mail, Headphones } from 'lucide-react';

interface FooterProps {
  onOpenCustomerOrders?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenCustomerOrders }) => {
  return (
    <footer className="w-full bg-[#111111] text-white border-t border-gray-800 py-12 sm:py-16 mt-16 select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-gray-800/80">
          {/* Col 1: Brand Info & Operational Status */}
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

            <div className="flex flex-col gap-1.5 text-xs font-semibold text-emerald-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#30D158] animate-ping" />
                <span>Campus Hub Operating Hours: 24/7 (Priority Delivery Active During Exam Cycles)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400 font-normal">
                <Headphones className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>Student Support Helpline: Available via in-app dispatch</span>
              </div>
            </div>
          </div>

          {/* Col 2: Active Campus Aisles */}
          <div className="md:col-span-3 space-y-2 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Active Campus Aisles
            </h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#categories-section" className="hover:text-white transition-colors">📚 Stationery & Study Supplies</a></li>
              <li><a href="#categories-section" className="hover:text-white transition-colors">🥤 Drinks & Beverages</a></li>
              <li><a href="#categories-section" className="hover:text-white transition-colors">🍫 Snacks & Munchies</a></li>
              <li><a href="#categories-section" className="hover:text-white transition-colors">🔌 Electronics & Gadgets</a></li>
              <li><a href="#categories-section" className="hover:text-white transition-colors">🌸 Women's Care & Hygiene</a></li>
              <li><a href="#campus-favourites" className="hover:text-white transition-colors">🔥 Top Campus Favourites</a></li>
              {onOpenCustomerOrders && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenCustomerOrders}
                    className="text-[#0A84FF] hover:text-white transition-colors flex items-center gap-1.5 font-bold cursor-pointer mt-1"
                  >
                    <Package className="w-3.5 h-3.5" /> Track My Live Orders & Status
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Official Authorship & Operator Profile */}
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
              System Architecture & Store Operator
            </h4>
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-xs space-y-2.5">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#0A84FF]/20 text-[#0A84FF] flex items-center justify-center shrink-0 mt-0.5">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Engineering Lead</div>
                  <div className="font-black text-white text-sm">Architected & Developed by: Faham Hussain Khan</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2 border-t border-white/5">
                <div className="w-7 h-7 rounded-lg bg-[#30D158]/20 text-[#30D158] flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Store Operations</div>
                  <div className="font-semibold text-gray-200">Authorized Store Operator: <span className="text-white font-bold">infinitys486@gmail.com</span></div>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1 text-[11px] text-gray-400">
                <MapPin className="w-3.5 h-3.5 text-[#FF3B30] shrink-0 mt-0.5" />
                <span>Mokaju Boys Hostel, CCCT, Chisopani, P.O. Nandugaon, South Sikkim – 737126, Sikkim, India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright & legal disclaimers */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400 gap-3">
          <div className="text-center md:text-left space-y-1">
            <div className="font-bold text-gray-300">
              © 2026 Infinity Store Inc. Hyperlocal Campus Quick-Commerce.
            </div>
            <div className="text-[11px] text-gray-500">
              Campus Hub Operating Hours: 24/7 (Priority Delivery Active During Exam Cycles). Student Support Helpline: Available via in-app dispatch.
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-[11px]">
            <span>Crafted for college life</span>
            <Heart className="w-3.5 h-3.5 text-[#FF3B30] fill-[#FF3B30]" />
            <span>by Faham Hussain Khan</span>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="pt-6 mt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-center gap-3">
          <span className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
            Follow Infinity Store
          </span>
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/infinitystorehq"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-gradient-to-tr hover:from-amber-500/20 hover:via-rose-500/20 hover:to-purple-500/20 border border-white/10 hover:border-pink-500/40 text-gray-400 hover:text-pink-400 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 group shadow-2xs"
            >
              <svg
                className="w-5 h-5 transition-transform duration-200 group-hover:scale-110"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>

            <a
              href="https://www.youtube.com/@InfinityStore-m6t"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="w-10 h-10 rounded-xl bg-white/[0.05] hover:bg-red-500/10 border border-white/10 hover:border-red-500/40 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 group shadow-2xs"
            >
              <svg
                className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 fill-current"
                viewBox="0 0 24 24"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
