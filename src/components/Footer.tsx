import React from 'react';
import { Heart, Shield, Clock, Phone, MapPin, Package, Code, UserCheck, Mail, Headphones } from 'lucide-react';

interface FooterProps {
  onOpenCustomerOrders?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenCustomerOrders }) => {
  return (
    <footer className="w-full bg-[#111111] text-white border-t border-gray-800 pt-12 sm:pt-16 pb-24 sm:pb-12 mt-16 select-none">
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
                  <div className="font-semibold text-gray-200">Authorized Store Operator: <span className="text-white font-bold">fahamhussainkhan@gmail.com</span></div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-400">
                <MapPin className="w-3.5 h-3.5 text-[#FF3B30] shrink-0" />
                <span>Campus Edge Hub • Gate 2 Barrier Plaza Complex</span>
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
      </div>
    </footer>
  );
};
