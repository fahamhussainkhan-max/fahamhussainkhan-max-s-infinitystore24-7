import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Zap, ShoppingBag, Ruler, Tag } from 'lucide-react';
import bundledHeroImg from '../assets/images/ccct_sist_campus_hero_1790791913273.jpg';
import { HERO_CAMPUS_ILLUSTRATION_BASE64 } from './heroAssetBase64';

// Multi-tier fallback sources: high-availability CDN + local bundle + base64 data URL
const HERO_IMAGE_SOURCES = [
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80',
  bundledHeroImg,
  HERO_CAMPUS_ILLUSTRATION_BASE64,
  '/assets/hero-banner.png',
  '/assets/hero-banner.jpg',
];

export const HeroScene3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setMousePos] = useState({ x: 0, y: 0 });
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isImgError, setIsImgError] = useState(false);

  const handleImageError = () => {
    if (currentImgIndex < HERO_IMAGE_SOURCES.length - 1) {
      setCurrentImgIndex((prev) => prev + 1);
    } else {
      setIsImgError(true);
    }
  };

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
      className="relative w-full max-w-full h-[290px] xs:h-[330px] sm:h-[390px] md:h-[480px] lg:h-[540px] flex items-center justify-center select-none perspective-[1200px] overflow-hidden"
    >
      {/* Ambient background glow orbs */}
      <div className="absolute w-56 md:w-72 h-56 md:h-72 rounded-full bg-[#0A84FF]/10 blur-3xl pointer-events-none -top-4 -left-4" />
      <div className="absolute w-52 md:w-64 h-52 md:h-64 rounded-full bg-[#FFD60A]/15 blur-3xl pointer-events-none -bottom-8 right-0" />
      <div className="hidden md:block absolute w-56 h-56 rounded-full bg-[#FF3B30]/10 blur-3xl pointer-events-none top-1/2 left-1/3" />

      {/* Main 3D tilt stage */}
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full max-w-[480px] h-full flex flex-col items-center justify-center scale-[0.80] xs:scale-[0.88] sm:scale-95 md:scale-100 origin-center"
      >
        {/* Soft Realistic Cast Ground Shadow */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.35, 0.45, 0.35],
          }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-6 w-64 sm:w-72 h-12 sm:h-14 bg-black/25 rounded-[100%] blur-xl pointer-events-none -z-10"
        />

        {/* 0. HIGH-RESOLUTION CCCT & SIST CAMPUS GRAPHIC BACKDROP WITH HIGH CONTRAST SCRIM */}
        <motion.div
          animate={{
            y: [-6, 6, -6],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-x-2 sm:inset-x-0 -top-2 bottom-6 rounded-3xl overflow-hidden border border-white/60 shadow-xl bg-[#111111] backdrop-blur-xs z-0"
          style={{
            transform: 'translateZ(-50px)',
          }}
        >
          {!isImgError ? (
            <img
              src={HERO_IMAGE_SOURCES[currentImgIndex]}
              alt="CCCT & SIST Campus Student Life and Express Delivery"
              onError={handleImageError}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-80 md:opacity-90 hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0A84FF]/25 via-[#111111]/90 to-[#1a1a1a] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#30D158_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0A84FF] to-[#30D158] flex items-center justify-center mb-2.5 shadow-lg shadow-blue-500/30">
                <Zap className="w-7 h-7 text-white fill-white" />
              </div>
              <h4 className="text-white font-black text-base sm:text-lg font-display tracking-tight drop-shadow-md">
                CCCT & SIST Campus Express
              </h4>
              <p className="text-white/80 text-[11px] max-w-xs mt-1 font-semibold drop-shadow">
                Hyperlocal Delivery to Chisopani & SIST Hostels in 45 mins - 1 hr
              </p>
            </div>
          )}

          {/* High-Contrast OLED/LCD Scrim Gradient Overlay for Crisp Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/25 pointer-events-none" />
          
          <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-bold text-white drop-shadow-md">
            <span className="flex items-center gap-1.5 drop-shadow">
              <span className="w-2 h-2 rounded-full bg-[#30D158] animate-ping" />
              <span className="text-white font-extrabold">CCCT & SIST Express Delivery</span>
            </span>
            <span className="bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/30 text-[10px] text-white font-bold shadow-xs">
              Chisopani Campus
            </span>
          </div>
        </motion.div>

        {/* CARD 3: PRIORITY RUN (SLEEK DARK CARD - CORE OF 3D STACK) */}
        <motion.div
          animate={{
            y: [-10, 8, -10],
            rotateZ: [-1.5, 1.5, -1.5],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative z-20 w-44 h-56 xs:w-48 xs:h-60 sm:w-56 sm:h-68 md:w-60 md:h-72 rounded-3xl bg-gradient-to-br from-[#111111] via-[#1a1a1a] to-[#252525] p-3.5 xs:p-4 sm:p-5 shadow-2xl border border-white/20 flex flex-col justify-between overflow-hidden"
          style={{
            boxShadow: '0 28px 60px -15px rgba(0,0,0,0.65), 0 0 40px rgba(10, 132, 255, 0.25)',
          }}
        >
          {/* Glossy specular highlight */}
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          {/* Bag handle strap */}
          <div className="absolute -top-6 sm:-top-7 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-12 sm:h-14 border-[5px] sm:border-[6px] border-[#333333] rounded-t-full shadow-inner bg-transparent" />

          {/* Top badge inside card */}
          <div className="flex items-center justify-between z-10">
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/15 backdrop-blur-md text-[10px] sm:text-[11px] font-bold text-white tracking-wide flex items-center gap-1.5 border border-white/20">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#30D158] animate-ping" />
              PRIORITY RUN
            </span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-[#FF3B30] to-[#FFD60A] flex items-center justify-center text-white shadow-md">
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white" />
            </div>
          </div>

          {/* Infinity Bag Branding */}
          <div className="my-auto text-center z-10 py-1 sm:py-2">
            <div className="inline-flex items-center justify-center p-2 sm:p-3 mb-1.5 sm:mb-2 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
              <svg viewBox="0 0 100 50" className="w-12 h-6 sm:w-16 sm:h-8 drop-shadow-md">
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
            <div className="text-white font-extrabold text-sm xs:text-base sm:text-xl tracking-tight font-display drop-shadow">
              INFINITY STORE
            </div>
            <div className="text-white/80 text-[9.5px] xs:text-[10.5px] sm:text-xs font-semibold tracking-wide mt-0.5">
              CAMPUS 45 MIN - 1 HR EXPRESS
            </div>
          </div>

          {/* Card 3: 45 mins - 1 hr Campus Delivery - Room & Gate */}
          <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[9px] xs:text-[10px] sm:text-[10.5px] text-white/95 z-10">
            <span className="font-bold truncate pr-1">45 mins - 1 hr Campus Delivery</span>
            <span className="text-[#30D158] font-black shrink-0">● Active</span>
          </div>
        </motion.div>

        {/* MOBILE CLEAN ALIGNED BADGES FLEX GRID (< md) - ZERO SCREEN CLUTTER */}
        <div className="flex md:hidden items-center justify-center gap-1.5 flex-wrap pt-3 z-30 max-w-[340px] px-2">
          <span className="px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-[9.5px] font-black text-white border border-white/20 flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-ping" />
            PRIORITY RUN
          </span>
          <span className="px-2.5 py-1 rounded-full bg-blue-600/90 backdrop-blur-md text-[9.5px] font-black text-white border border-blue-400/40 flex items-center gap-1 shadow-sm">
            <Zap className="w-3 h-3 fill-yellow-300 text-yellow-300" />
            45 MINS EXPRESS
          </span>
          <span className="px-2.5 py-1 rounded-full bg-amber-400/95 backdrop-blur-md text-[9.5px] font-black text-neutral-950 border border-amber-300 flex items-center gap-1 shadow-sm">
            <Tag className="w-3 h-3 text-neutral-950" />
            CHEAPEST ON CAMPUS
          </span>
        </div>

        {/* DESKTOP-ONLY 3D FLOATING SECONDARY ELEMENTS (RETAINED INTACT FOR >= md) */}
        {/* 1. FLOATING CARDBOARD BOX WITH CAMPUS TAPE */}
        <motion.div
          animate={{
            y: [12, -8, 12],
            rotateZ: [4, 8, 4],
            rotateX: [6, 12, 6],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          className="hidden md:block absolute -bottom-2 -left-6 sm:-left-10 z-30 w-36 h-32 sm:w-44 sm:h-36 rounded-2xl bg-gradient-to-br from-[#d4a373] to-[#b07d4f] shadow-xl border border-[#c49261] p-3 text-[#583e26] overflow-hidden"
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
            BLOCK A/B/C • HOSTEL
          </div>
        </motion.div>

        {/* 2. CARD 2: EXISTING ENERGY DRINK (DESKTOP) */}
        <motion.div
          animate={{
            y: [-14, 10, -14],
            rotateZ: [-12, -6, -12],
          }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
          className="hidden md:flex absolute top-4 -right-4 sm:-right-8 z-25 w-24 h-40 sm:w-28 sm:h-44 rounded-3xl bg-gradient-to-b from-[#0A84FF] via-[#0052cc] to-[#002b80] p-2.5 shadow-2xl border-t border-cyan-300 text-white flex-col justify-between overflow-hidden"
          style={{
            boxShadow: '0 20px 42px -8px rgba(10, 132, 255, 0.55), 0 0 25px rgba(0, 212, 255, 0.35)',
          }}
        >
          {/* Condensation light effect */}
          <div className="absolute top-0 right-0 w-8 h-full bg-white/20 blur-sm pointer-events-none" />
          <div className="w-8 h-3 rounded-full bg-slate-200/90 mx-auto shadow-inner border border-slate-300" />
          
          <div className="my-auto text-center font-display space-y-0.5">
            <div className="inline-block px-1.5 py-0.5 rounded-full bg-cyan-400/20 border border-cyan-300/40 text-[7.5px] font-black tracking-widest text-cyan-200 uppercase">
              EXAM FUEL
            </div>
            <div className="text-xs font-black tracking-tight leading-tight text-white drop-shadow">
              ENERGY
            </div>
            <div className="text-[10px] text-yellow-300 font-bold">250ml Chilled</div>
          </div>

          {/* Enhanced Cool Blue / Neon Gradient Tag */}
          <div className="w-full text-center text-[8px] sm:text-[8.5px] font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-white rounded-lg py-1 shadow-sm border border-cyan-300/40 uppercase tracking-tighter leading-tight">
            Late Night Exam Fuel - Ice Cold
          </div>
        </motion.div>

        {/* 3. CARD 1: LAB COATS & DRAFTERS / ASSIGNMENT KITS (DESKTOP) */}
        <motion.div
          animate={{
            y: [8, -12, 8],
            rotateZ: [14, 18, 14],
          }}
          transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
          className="hidden md:flex absolute -top-4 -left-8 sm:-left-12 z-15 w-36 h-44 sm:w-40 sm:h-48 rounded-2xl bg-gradient-to-br from-[#10B981] via-[#059669] to-[#047857] p-3.5 shadow-2xl border-l-[6px] border-emerald-950 text-white flex-col justify-between"
          style={{
            boxShadow: '0 18px 40px -10px rgba(16, 185, 129, 0.45)',
          }}
        >
          <div className="flex justify-between items-start">
            <span className="text-[9px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/30 text-white shadow-2xs">
              Must Have
            </span>
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <Ruler className="w-3 h-3 text-white" />
            </div>
          </div>

          <div>
            <div className="text-xs sm:text-sm font-extrabold text-white leading-tight font-display">
              Lab Coats & Drafters
            </div>
            <div className="text-[10px] text-emerald-100 font-semibold mt-0.5">
              Assignment Kits
            </div>
          </div>

          {/* Tag: Essential for CCCT & SIST Practical Labs */}
          <div className="pt-2 border-t border-white/20 flex flex-col gap-0.5">
            <span className="text-[8.5px] sm:text-[9px] font-bold text-white/95 leading-tight">
              Essential for CCCT & SIST Practical Labs
            </span>
            <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden mt-1">
              <div className="w-4/5 h-full bg-[#FFD60A] rounded-full" />
            </div>
          </div>

          {/* Floating mini drafting tool vector */}
          <div className="absolute -right-3 top-8 w-5 h-20 bg-gradient-to-b from-[#111111] via-[#0A84FF] to-[#111111] rounded-full shadow-lg border border-white/30 -rotate-45 flex flex-col justify-between items-center py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <div className="w-1 h-2 bg-white/70 rounded-full" />
          </div>
        </motion.div>

        {/* 4. FLOATING OVER-EAR HEADPHONES (DESKTOP) */}
        <motion.div
          animate={{
            y: [-12, 10, -12],
            rotateZ: [-18, -12, -18],
          }}
          transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="hidden md:block absolute -bottom-6 -right-6 sm:-right-10 z-30 w-28 h-28 sm:w-32 sm:h-32 pointer-events-none"
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

        {/* 5. SCULPTED 3D GLOWING INFINITY SYMBOL (DESKTOP) */}
        <motion.div
          animate={{
            y: [-15, 12, -15],
            rotateZ: [0, 360],
          }}
          transition={{
            y: { duration: 4.8, repeat: Infinity, ease: 'easeInOut' },
            rotateZ: { duration: 32, repeat: Infinity, ease: 'linear' },
          }}
          className="hidden md:block absolute -top-8 right-16 sm:right-24 z-35 pointer-events-none"
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

        {/* 6. COLOURFUL GLOSSY SPHERES (DESKTOP) */}
        {/* Yellow Sphere */}
        <motion.div
          animate={{
            y: [-8, 8, -8],
            x: [4, -4, 4],
          }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          className="hidden md:block absolute top-10 left-12 w-8 h-8 rounded-full bg-gradient-to-tr from-[#FFD60A] to-[#fff399] shadow-lg border border-white/50 z-25"
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
          className="hidden md:block absolute bottom-16 right-24 w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF3B30] to-[#ff8f88] shadow-lg border border-white/40 z-35"
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
          className="hidden md:block absolute -top-3 left-1/3 w-6 h-6 rounded-full bg-gradient-to-tr from-[#0A84FF] to-[#80bdff] shadow-md border border-white/40 z-10"
        />

        {/* Green Sphere */}
        <motion.div
          animate={{
            y: [8, -8, 8],
          }}
          transition={{ duration: 4.7, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}
          className="hidden md:block absolute bottom-4 left-32 w-6 h-6 rounded-full bg-gradient-to-tr from-[#30D158] to-[#8ef3a7] shadow-md border border-white/40 z-35"
        />

        {/* 7. FLOATING LIGHTNING BOLT (DESKTOP) */}
        <motion.div
          animate={{
            y: [-10, 6, -10],
            rotateZ: [-8, 8, -8],
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
          className="hidden md:block absolute top-1/4 -right-2 z-40 p-2 rounded-2xl bg-[#FFD60A] text-[#111111] shadow-xl border-2 border-white"
        >
          <Zap className="w-5 h-5 fill-[#111111]" />
        </motion.div>

        {/* 8. LOCATION PIN WITH RADAR PULSE (DESKTOP) */}
        <motion.div
          animate={{
            y: [6, -6, 6],
          }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
          className="hidden md:flex absolute bottom-20 -left-4 z-40 items-center gap-1.5 px-3 py-1.5 rounded-full bg-white shadow-xl border border-emerald-100 text-xs font-bold text-[#111111]"
        >
          <div className="relative flex items-center justify-center w-3.5 h-3.5">
            <span className="absolute w-full h-full rounded-full bg-[#30D158] animate-ping opacity-75" />
            <span className="relative w-2 h-2 rounded-full bg-[#30D158]" />
          </div>
          <span>CCCT & SIST Gate</span>
        </motion.div>
      </motion.div>
    </div>
  );
};
