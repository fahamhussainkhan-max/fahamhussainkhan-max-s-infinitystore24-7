import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Sparkles, ShieldCheck, Zap, ArrowUpRight } from 'lucide-react';

export const InfinityBrandElement: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Parallax physics
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 120, damping: 25 });
  const springY = useSpring(y, { stiffness: 120, damping: 25 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-18, 18]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="relative rounded-[36px] bg-[#111111] text-white p-8 sm:p-12 lg:p-16 overflow-hidden shadow-2xl border border-gray-800"
        style={{ perspective: '1000px' }}
      >
        {/* Soft background light spots */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#FF3B30]/15 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-[#0A84FF]/15 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 left-1/3 w-80 h-80 rounded-full bg-[#30D158]/15 blur-[100px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          {/* Left Textual Brand Statement */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-black tracking-widest uppercase text-white">
              <span className="w-2 h-2 rounded-full bg-[#30D158] animate-pulse" />
              THE INFINITY PROMISE
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight leading-[1.1]">
              "Need it? Get it."<br />
              <span className="bg-gradient-to-r from-[#FF3B30] via-[#FFD60A] to-[#30D158] bg-clip-text text-transparent">
                Infinite convenience
              </span>{' '}
              on your campus.
            </h2>

            <p className="text-sm sm:text-base text-gray-300 font-medium max-w-lg leading-relaxed">
              We started Infinity Store because students shouldn't spend 40 minutes trekking to the campus gate in the rain for a pen or a midnight pack of noodles. Everything in stock, priced right, delivered fast.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-3">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="text-xl sm:text-2xl font-black text-[#FFD60A]">10 Min</div>
                <div className="text-[10px] sm:text-xs text-gray-400 font-medium">Avg Delivery</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="text-xl sm:text-2xl font-black text-[#0A84FF]">100%</div>
                <div className="text-[10px] sm:text-xs text-gray-400 font-medium">Campus Stored</div>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="text-xl sm:text-2xl font-black text-[#30D158]">₹0 Fee</div>
                <div className="text-[10px] sm:text-xs text-gray-400 font-medium">Orders &gt; ₹99</div>
              </div>
            </div>
          </div>

          {/* Right 3D Sculptural Infinity Sculpture */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <motion.div
              style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
              }}
              className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center cursor-pointer"
            >
              {/* Outer dynamic light ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border border-dashed border-white/20"
              />

              {/* Glowing 3D backdrop plate */}
              <div className="absolute w-52 h-52 rounded-3xl bg-gradient-to-tr from-white/5 to-white/10 backdrop-blur-xl border border-white/10 shadow-2xl flex items-center justify-center" />

              {/* 3D Custom Sculpted Infinity Loop with Brand Colors */}
              <motion.div
                animate={{
                  scale: isHovered ? 1.08 : 1,
                  y: [-6, 6, -6],
                }}
                transition={{
                  scale: { duration: 0.3 },
                  y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                }}
                className="relative z-20 w-48 h-28 filter drop-shadow-[0_20px_35px_rgba(10,132,255,0.4)]"
              >
                <svg viewBox="0 0 160 80" className="w-full h-full">
                  <defs>
                    <linearGradient id="infBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF3B30" />
                      <stop offset="28%" stopColor="#FFD60A" />
                      <stop offset="65%" stopColor="#0A84FF" />
                      <stop offset="100%" stopColor="#30D158" />
                    </linearGradient>
                    <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  
                  {/* Underlay glow path */}
                  <path
                    d="M 45,40 C 20,40 20,65 45,65 C 70,65 90,15 115,15 C 140,15 140,40 115,40 C 90,40 70,65 45,65 C 20,65 20,40 45,40 Z"
                    fill="none"
                    stroke="url(#infBrandGrad)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glowFilter)"
                    opacity="0.8"
                  />

                  {/* Sharp core ribbon */}
                  <path
                    d="M 45,40 C 20,40 20,65 45,65 C 70,65 90,15 115,15 C 140,15 140,40 115,40 C 90,40 70,65 45,65 C 20,65 20,40 45,40 Z"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="18 12"
                    className="opacity-90"
                  />
                </svg>
              </motion.div>

              {/* Floating micro orbit badges */}
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 pointer-events-none"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-7 h-7 rounded-full bg-[#FF3B30] shadow-lg flex items-center justify-center text-white text-[10px] font-black border-2 border-white">
                  ⚡
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-7 h-7 rounded-full bg-[#30D158] shadow-lg flex items-center justify-center text-white text-[10px] font-black border-2 border-white">
                  ✓
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
