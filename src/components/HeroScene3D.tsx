import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Zap, MapPin, Sparkles, ShoppingBag } from 'lucide-react';

export const HeroScene3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Spring physics for smooth parallax
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 100, damping: 20 });
  const springY = useSpring(y, { stiffness: 100, damping: 20 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [12, -12]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-14, 14]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = (e.clientX - rect.left) / rect.width - 0.5;
    const clientY = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(clientX);
    y.set(clientY);
    setMousePos({ x: clientX, y: clientY });
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-full h-[360px] xs:h-[400px] sm:h-[480px] lg:h-[540px] flex items-center justify-center select-none perspective-[1200px] overflow-hidden"
    >
      {/* Ambient background glow orbs */}
      <div className="absolute w-72 h-72 rounded-full bg-[#0A84FF]/10 blur-3xl pointer-events-none -top-4 -left-4" />
      <div className="absolute w-64 h-64 rounded-full bg-[#FFD60A]/15 blur-3xl pointer-events-none -bottom-8 right-0" />
      <div className="absolute w-56 h-56 rounded-full bg-[#FF3B30]/10 blur-3xl pointer-events-none top-1/2 left-1/3" />

      {/* Main 3D tilt stage */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full max-w-[480px] h-full flex items-center justify-center scale-[0.82] xs:scale-[0.9] sm:scale-100 origin-center"
      >
        {/* Soft Realistic Cast Ground Shadow */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.35, 0.45, 0.35],
          }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-6 w-72 h-14 bg-black/20 rounded-[100%] blur-xl pointer-events-none -z-10"
        />

        {/* 1. CENTRAL FLOATING DELIVERY BAG */}
        <motion.div
          animate={{
            y: [-10, 8, -10],
            rotateZ: [-1.5, 1.5, -1.5],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-20 w-52 h-64 sm:w-60 sm:h-72 rounded-3xl bg-gradient-to-br from-[#111111] via-[#1a1a1a] to-[#252525] p-5 shadow-2xl border border-white/15 flex flex-col justify-between overflow-hidden"
          style={{
            boxShadow: '0 28px 60px -15px rgba(0,0,0,0.45), 0 0 40px rgba(10, 132, 255, 0.15)',
          }}
        >
          {/* Glossy specular highlight */}
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          {/* Bag handle strap */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 w-24 h-14 border-[6px] border-[#333333] rounded-t-full shadow-inner bg-transparent" />

          {/* Top badge */}
          <div className="flex items-center justify-between z-10">
            <span className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-white tracking-wide flex items-center gap-1.5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#30D158] animate-ping" />
              PRIORITY RUN
            </span>
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF3B30] to-[#FFD60A] flex items-center justify-center text-white shadow-md">
              <Zap className="w-3.5 h-3.5 fill-white" />
            </div>
          </div>

          {/* Infinity Bag Branding */}
          <div className="my-auto text-center z-10 py-2">
            <div className="inline-flex items-center justify-center p-3 mb-2 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
              <svg viewBox="0 0 100 50" className="w-16 h-8 drop-shadow-md">
                <defs>
                  <linearGradient id="infGradBag" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF3B30" />
                    <stop offset="33%" stopColor="#FFD60A" />
                    <stop offset="66%" stopColor="#0A84FF" />
                    <stop offset="100%" stopColor="#30D158" />
                  </linearGradient>
                </defs>
                <path
                  d="M 30,25 C 15,25 15,40 30,40 C 45,40 55,10 70,10 C 85,10 85,25 70,25 C 55,25 45,40 30,40"
                  fill="none"
                  stroke="url(#infGradBag)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="text-white font-extrabold text-lg sm:text-xl tracking-tight font-display">
              INFINITY STORE
            </div>
            <div className="text-white/60 text-xs font-medium tracking-wide">
              CAMPUS 10-MIN EXPRESS
            </div>
          </div>

          {/* Bottom tag */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/70 z-10">
            <span>Room & Hostel Drop</span>
            <span className="text-[#30D158] font-bold">● Active</span>
          </div>
        </motion.div>

        {/* 2. FLOATING CARDBOARD BOX WITH CAMPUS TAPE */}
        <motion.div
          animate={{
            y: [12, -8, 12],
            rotateZ: [4, 8, 4],
            rotateX: [6, 12, 6],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          className="absolute -bottom-2 -left-6 sm:-left-10 z-30 w-36 h-32 sm:w-44 sm:h-36 rounded-2xl bg-gradient-to-br from-[#d4a373] to-[#b07d4f] shadow-xl border border-[#c49261] p-3 text-[#583e26] overflow-hidden"
          style={{
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
          }}
        >
          {/* Cardboard tape */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-7 bg-[#fefae0]/85 border-y border-[#cca574] -rotate-3 flex items-center justify-center shadow-sm">
            <span className="text-[9px] font-black tracking-widest text-[#7f4f24] uppercase">
              ⚡ CAMPUS EXPEDITE ⚡
            </span>
          </div>
          <div className="flex justify-between items-start">
            <div className="text-[10px] font-black tracking-wider bg-black/10 px-1.5 py-0.5 rounded">
              FRAGILE
            </div>
            <div className="w-5 h-5 rounded-full bg-white/40 flex items-center justify-center">
              <ShoppingBag className="w-3 h-3 text-[#583e26]" />
            </div>
          </div>
          <div className="absolute bottom-2 left-3 text-[10px] font-bold text-[#442c16]">
            BLOCK A/B/C
          </div>
        </motion.div>

        {/* 3. FLOATING CHILLED SODA CAN */}
        <motion.div
          animate={{
            y: [-14, 10, -14],
            rotateZ: [-12, -6, -12],
          }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          className="absolute top-4 -right-4 sm:-right-8 z-25 w-20 h-36 sm:w-24 sm:h-40 rounded-3xl bg-gradient-to-b from-[#0A84FF] via-[#0060df] to-[#003c99] p-2.5 shadow-xl border-t border-white/50 text-white flex flex-col justify-between overflow-hidden"
          style={{
            boxShadow: '0 18px 36px -8px rgba(10, 132, 255, 0.45)',
          }}
        >
          {/* Condensation light effect */}
          <div className="absolute top-0 right-0 w-8 h-full bg-white/20 blur-sm pointer-events-none" />
          <div className="w-8 h-3 rounded-full bg-slate-200/80 mx-auto shadow-inner border border-slate-300" />
          <div className="my-auto text-center font-display">
            <div className="text-[9px] font-bold tracking-widest text-sky-200 uppercase">ICE COLD</div>
            <div className="text-xs font-black tracking-tight leading-tight">ENERGY</div>
            <div className="text-[10px] text-yellow-300 font-bold">250ml</div>
          </div>
          <div className="w-full text-center text-[9px] font-bold bg-white/20 rounded py-0.5">
            CHILLED
          </div>
        </motion.div>

        {/* 4. FLOATING NOTEBOOK & PILOT PEN */}
        <motion.div
          animate={{
            y: [8, -12, 8],
            rotateZ: [14, 18, 14],
          }}
          transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
          className="absolute -top-4 -left-8 sm:-left-12 z-15 w-32 h-40 sm:w-36 sm:h-44 rounded-2xl bg-gradient-to-br from-[#30D158] to-[#1eb843] p-3 shadow-xl border-l-[6px] border-emerald-900 text-white flex flex-col justify-between"
          style={{
            boxShadow: '0 16px 36px -10px rgba(48, 209, 88, 0.35)',
          }}
        >
          <div className="flex justify-between items-start">
            <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[8px] font-bold">
              A4
            </div>
            <div className="text-[9px] font-bold bg-black/20 px-1.5 py-0.5 rounded">
              300 PGS
            </div>
          </div>
          <div className="text-xs font-bold text-white/90">
            Lecture Notes & Formulas
          </div>
          <div className="flex items-center gap-1.5 pt-2 border-t border-white/20">
            <div className="w-full h-1 bg-white/40 rounded-full" />
            <div className="w-3/4 h-1 bg-white/30 rounded-full" />
          </div>

          {/* Floating pen resting on notebook */}
          <div className="absolute -right-4 top-8 w-4 h-24 bg-gradient-to-b from-[#111111] via-[#0A84FF] to-[#111111] rounded-full shadow-lg border border-white/20 -rotate-45 flex flex-col justify-between items-center py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <div className="w-1 h-3 bg-white/50 rounded-full" />
          </div>
        </motion.div>

        {/* 5. FLOATING OVER-EAR HEADPHONES */}
        <motion.div
          animate={{
            y: [-12, 10, -12],
            rotateZ: [-18, -12, -18],
          }}
          transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute -bottom-6 -right-6 sm:-right-10 z-30 w-28 h-28 sm:w-32 sm:h-32 pointer-events-none"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Headphone headband */}
            <div className="w-24 h-24 border-[7px] border-[#111111] rounded-t-full shadow-lg" />
            {/* Left cup */}
            <div className="absolute bottom-2 left-1 w-8 h-10 rounded-2xl bg-gradient-to-tr from-[#FF3B30] to-[#ff6961] shadow-md border border-white/30 flex items-center justify-center text-[8px] font-bold text-white">
              BASS
            </div>
            {/* Right cup */}
            <div className="absolute bottom-2 right-1 w-8 h-10 rounded-2xl bg-gradient-to-tr from-[#FF3B30] to-[#ff6961] shadow-md border border-white/30 flex items-center justify-center text-[8px] font-bold text-white">
              STUDY
            </div>
          </div>
        </motion.div>

        {/* 6. SCULPTED 3D GLOWING INFINITY SYMBOL */}
        <motion.div
          animate={{
            y: [-15, 12, -15],
            rotateZ: [0, 360],
          }}
          transition={{
            y: { duration: 4.8, repeat: Infinity, ease: 'easeInOut' },
            rotateZ: { duration: 32, repeat: Infinity, ease: 'linear' },
          }}
          className="absolute -top-8 right-16 sm:right-24 z-35 pointer-events-none"
        >
          <div className="p-3 rounded-full bg-white/70 backdrop-blur-md shadow-2xl border border-white/60">
            <svg viewBox="0 0 80 40" className="w-14 h-7 filter drop-shadow">
              <defs>
                <linearGradient id="glowInfHero" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF3B30" />
                  <stop offset="33%" stopColor="#FFD60A" />
                  <stop offset="66%" stopColor="#0A84FF" />
                  <stop offset="100%" stopColor="#30D158" />
                </linearGradient>
              </defs>
              <path
                d="M 24,20 C 12,20 12,32 24,32 C 36,32 44,8 56,8 C 68,8 68,20 56,20 C 44,20 36,32 24,32"
                fill="none"
                stroke="url(#glowInfHero)"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </motion.div>

        {/* 7. COLOURFUL GLOSSY SPHERES (BRAND PALETTE) */}
        {/* Yellow Sphere */}
        <motion.div
          animate={{
            y: [-8, 8, -8],
            x: [4, -4, 4],
          }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-10 left-12 w-8 h-8 rounded-full bg-gradient-to-tr from-[#FFD60A] to-[#fff399] shadow-lg border border-white/50 z-25"
          style={{
            boxShadow: '0 8px 18px rgba(255, 214, 10, 0.45)',
          }}
        />

        {/* Red Sphere */}
        <motion.div
          animate={{
            y: [10, -10, 10],
            x: [-6, 6, -6],
          }}
          transition={{ duration: 4.9, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
          className="absolute bottom-16 right-24 w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF3B30] to-[#ff8f88] shadow-lg border border-white/40 z-35"
          style={{
            boxShadow: '0 8px 20px rgba(255, 59, 48, 0.45)',
          }}
        />

        {/* Blue Sphere */}
        <motion.div
          animate={{
            y: [-6, 9, -6],
          }}
          transition={{ duration: 5.1, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -top-3 left-1/3 w-6 h-6 rounded-full bg-gradient-to-tr from-[#0A84FF] to-[#80bdff] shadow-md border border-white/40 z-10"
        />

        {/* Green Sphere */}
        <motion.div
          animate={{
            y: [8, -8, 8],
          }}
          transition={{ duration: 4.7, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
          className="absolute bottom-4 left-32 w-6 h-6 rounded-full bg-gradient-to-tr from-[#30D158] to-[#8ef3a7] shadow-md border border-white/40 z-35"
        />

        {/* 8. FLOATING LIGHTNING BOLT */}
        <motion.div
          animate={{
            y: [-10, 6, -10],
            rotateZ: [-8, 8, -8],
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 -right-2 z-40 p-2 rounded-2xl bg-[#FFD60A] text-[#111111] shadow-xl border-2 border-white"
        >
          <Zap className="w-5 h-5 fill-[#111111]" />
        </motion.div>

        {/* 9. LOCATION PIN WITH RADAR PULSE */}
        <motion.div
          animate={{
            y: [6, -6, 6],
          }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          className="absolute bottom-20 -left-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-xl border border-emerald-100 text-xs font-bold text-[#111111]"
        >
          <div className="relative flex items-center justify-center w-3.5 h-3.5">
            <span className="absolute w-full h-full rounded-full bg-[#30D158] animate-ping opacity-75" />
            <span className="relative w-2 h-2 rounded-full bg-[#30D158]" />
          </div>
          <span>Near Campus Gate</span>
        </motion.div>
      </motion.div>
    </div>
  );
};
