import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, MapPin, Clock, ShieldCheck, ChevronDown, Check } from 'lucide-react';
import { CAMPUS_ZONES } from '../data/mockData';
import { CampusZone } from '../types';

interface DeliveryStatusCardProps {
  selectedZone: CampusZone;
  onSelectZone: (zone: CampusZone) => void;
}

export const DeliveryStatusCard: React.FC<DeliveryStatusCardProps> = ({
  selectedZone,
  onSelectZone,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-white via-[#FAFAF7] to-white border border-gray-200/90 shadow-lg p-5 sm:p-6 lg:p-7">
        {/* Subtle decorative glowing corner */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#30D158]/10 via-[#0A84FF]/5 to-transparent rounded-bl-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left info column */}
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-black tracking-wide uppercase">
              <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>⚡ FAST CAMPUS DELIVERY</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-[#111111] font-display tracking-tight">
              Your essentials are closer than you think.
            </h3>

            <p className="text-sm text-gray-600 font-medium">
              Available around your college & nearby area. Delivered straight to your hostel gate, floor, or study quad.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-gray-500">
              <div className="flex items-center gap-1.5 text-gray-700">
                <Clock className="w-4 h-4 text-[#0A84FF]" />
                <span>Avg. Arrival: <strong className="text-black">{selectedZone.estMinutes}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-700">
                <ShieldCheck className="w-4 h-4 text-[#30D158]" />
                <span>Verified Student Runners</span>
              </div>
            </div>
          </div>

          {/* Right zone selector & live status beacon */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3">
            {/* Live Availability Badge with Pulsing Green Pin */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 text-xs font-bold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30D158] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#30D158]" />
              </span>
              <span>Hub Online & Dispatching</span>
            </div>

            {/* Campus location dropdown button */}
            <div className="relative w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full sm:w-auto flex items-center justify-between gap-3 px-4 py-2.5 bg-[#111111] hover:bg-black text-white rounded-2xl shadow-md transition-all active:scale-95 text-xs sm:text-sm font-bold"
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{
                      scale: [1, 1.25, 1],
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="p-1 rounded-full bg-[#30D158]/20 text-[#30D158]"
                  >
                    <MapPin className="w-4 h-4" />
                  </motion.div>
                  <div className="text-left">
                    <div className="text-[10px] text-gray-400 font-medium leading-none">Delivering to</div>
                    <div className="font-bold text-white leading-tight">{selectedZone.name}</div>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Zone Dropdown Menu */}
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 overflow-hidden"
                >
                  <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Select Your Campus Wing / Block
                  </div>
                  <div className="space-y-1">
                    {CAMPUS_ZONES.map((zone) => (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => {
                          onSelectZone(zone);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors text-xs sm:text-sm font-semibold ${
                          selectedZone.id === zone.id
                            ? 'bg-gray-100 text-black font-bold'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-[#0A84FF]" />
                          <div>
                            <div>{zone.name}</div>
                            <div className="text-[10px] text-gray-400 font-normal">{zone.block} • {zone.estMinutes}</div>
                          </div>
                        </div>
                        {selectedZone.id === zone.id && (
                          <Check className="w-4 h-4 text-[#30D158]" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
