import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gamepad2,
  Trophy,
  Ticket,
  BellRing,
  Sparkles,
  CheckCircle2,
  Users,
  Flame,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CampusPlayHubBannerProps {
  onToastMessage?: (msg: string) => void;
}

export const CampusPlayHubBanner: React.FC<CampusPlayHubBannerProps> = ({
  onToastMessage,
}) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isNotified, setIsNotified] = useState(() => {
    try {
      return Boolean(localStorage.getItem('infinity_playhub_notified'));
    } catch {
      return false;
    }
  });
  const [activeTeaser, setActiveTeaser] = useState<number>(0);

  const teasers = [
    {
      id: 0,
      icon: Gamepad2,
      tag: 'TOURNAMENTS',
      title: 'Hostel E-Sports League',
      desc: 'Inter-hostel BGMI, FIFA & Valorant LAN brackets with free midnight pizzas for the champions.',
      badge: 'Season 1 Soon',
      gradient: 'from-[#0A84FF]/10 to-blue-500/5',
      accentColor: 'text-[#0A84FF]',
    },
    {
      id: 1,
      icon: Trophy,
      tag: 'MIDNIGHT TRIVIA',
      title: 'Midnight Quiz Bowl',
      desc: '11:45 PM rapid 10-question flash quizzes. Compete against rival wings to win free snacks & energy drinks.',
      badge: 'Every Weekend',
      gradient: 'from-[#FFD60A]/10 to-amber-500/5',
      accentColor: 'text-[#FF9F0A]',
    },
    {
      id: 2,
      icon: Ticket,
      tag: 'CAMPUS LIFE',
      title: 'Fest Passes & Fast Track',
      desc: 'Instant student-exclusive ticket drops for college concerts, comedy nights, and club socials.',
      badge: 'Early Access',
      gradient: 'from-[#30D158]/10 to-emerald-500/5',
      accentColor: 'text-[#30D158]',
    },
  ];

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      if (onToastMessage) onToastMessage('Please enter your hostel room or student ID');
      return;
    }

    try {
      localStorage.setItem('infinity_playhub_notified', emailOrPhone.trim());
    } catch {}

    setIsNotified(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#0A84FF', '#FFD60A', '#30D158'],
    });

    if (onToastMessage) {
      onToastMessage("You're on the early VIP access list for Play Hub! 🎮");
    }
  };

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="relative rounded-3xl bg-gradient-to-br from-[#1c1c1e] via-[#111111] to-[#0a0a0c] text-white p-6 sm:p-8 md:p-10 overflow-hidden shadow-2xl border border-white/10">
        {/* Ambient atmospheric glows */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#0A84FF]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#FF3B30]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          {/* Header Tag */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold uppercase tracking-wider text-[#FFD60A]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Future Expansion • Play Hub</span>
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>Coming Soon to Campus</span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-display tracking-tight text-white">
              Campus Games & Events / Play Hub
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-gray-300 leading-relaxed">
              We're building more than fast delivery. Soon you can challenge other hostel blocks in LAN tournaments, play midnight trivia for free munchies, and grab instant fest passes right from Infinity Store.
            </p>
          </div>

          {/* Interactive Teaser Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-6">
            {teasers.map((t, index) => {
              const Icon = t.icon;
              const isSelected = activeTeaser === index;
              return (
                <div
                  key={t.id}
                  onClick={() => setActiveTeaser(index)}
                  className={`p-4 sm:p-5 rounded-2xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-white/10 border-white/30 shadow-lg scale-[1.01]'
                      : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/10 uppercase tracking-wider">
                      {t.badge}
                    </span>
                  </div>

                  <span className={`text-[10px] font-black uppercase tracking-wider ${t.accentColor}`}>
                    {t.tag}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                    {t.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    {t.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* VIP Notification Signup Form */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-[#FFD60A]" />
                Get VIP invite to the launch bracket
              </h4>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Be the first to enter your hostel wing in the Season 1 Tournament.
              </p>
            </div>

            {isNotified ? (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>You're on the early access priority list!</span>
              </div>
            ) : (
              <form
                onSubmit={handleNotifySubmit}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto"
              >
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="Hostel & Room # or Phone"
                  className="px-3.5 py-2.5 sm:py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 text-xs font-semibold focus:outline-none focus:border-[#0A84FF] w-full sm:w-60 min-h-[44px]"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 sm:py-3 rounded-xl bg-[#0A84FF] hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 w-full sm:w-auto min-h-[44px]"
                >
                  <span>Notify Me</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
