import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ArrowRight, Store, X, Rocket } from 'lucide-react';

interface StudentEntrepreneurshipBannerProps {
  onToastMessage?: (msg: string) => void;
}

export const StudentEntrepreneurshipBanner: React.FC<StudentEntrepreneurshipBannerProps> = ({
  onToastMessage,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [campus, setCampus] = useState<'CCCT' | 'SIST'>('CCCT');
  const [category, setCategory] = useState('Homemade Treats & Snacks');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || phone.trim().length < 10) {
      if (onToastMessage) {
        onToastMessage('Please enter your name and a valid 10-digit mobile number.');
      }
      return;
    }

    const waitlistEntry = {
      name: name.trim(),
      phone: phone.trim(),
      campus,
      category,
      joinedAt: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem('infinity_seller_waitlist') || '[]');
      existing.push(waitlistEntry);
      localStorage.setItem('infinity_seller_waitlist', JSON.stringify(existing));
    } catch {}

    setIsSubmitted(true);
    if (onToastMessage) {
      onToastMessage('🎉 Welcome to the Student Seller Waitlist!');
    }
  };

  return (
    <>
      {/* Compact 1-Line Modern Card */}
      <div
        id="student-entrepreneurship-card"
        onClick={() => setIsModalOpen(true)}
        className="w-full bg-white border border-gray-200/90 hover:border-purple-300 rounded-2xl p-3 sm:p-3.5 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group pointer-events-auto"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors truncate">
                Student Entrepreneurship Hub
              </h4>
            </div>
            <p className="text-[11px] text-gray-500 truncate">
              Sell your handmade crafts, snacks & notes on campus.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="bg-purple-100 text-purple-700 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap group-hover:bg-purple-200 transition-colors">
            Coming Soon
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all hidden sm:block" />
        </div>
      </div>

      {/* Detail & Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-base">Student Entrepreneurship</h3>
                  <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                    Launching Soon • CCCT & SIST
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Turn your skills into campus income. We are opening InfinityStore to verified CCCT & SIST student creators, bakers, thrift curators, and notes authors with zero listing fees.
            </p>

            {isSubmitted ? (
              <div className="text-center py-5 space-y-2 bg-purple-50 rounded-2xl p-4">
                <CheckCircle2 className="w-8 h-8 text-purple-600 mx-auto" />
                <h4 className="font-bold text-sm text-purple-950">You're on the early list!</h4>
                <p className="text-xs text-purple-800">
                  Thank you, <strong>{name}</strong>. We will notify you on WhatsApp as soon as seller onboarding goes live.
                </p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mt-2 text-xs bg-purple-600 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Rohit Sharma"
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-600 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Campus</label>
                    <select
                      value={campus}
                      onChange={(e) => setCampus(e.target.value as 'CCCT' | 'SIST')}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-600"
                    >
                      <option value="CCCT">CCCT Campus</option>
                      <option value="SIST">SIST Campus</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">What will you sell?</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-purple-600"
                    >
                      <option value="Homemade Treats & Snacks">Snacks & Baking</option>
                      <option value="Handmade Crafts & Gifts">Crafts & Gifts</option>
                      <option value="Curated Notes & Stationery">Notes & Study Kits</option>
                      <option value="Tech Accessories & Thrift">Tech & Thrift</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Join Student Seller Waitlist</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
