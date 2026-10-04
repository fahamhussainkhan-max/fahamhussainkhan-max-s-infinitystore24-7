import React from 'react';
import { Home, Grid, Heart, User, Package } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'home' | 'wishlist' | 'profile';
  onSelectTab: (tab: 'home' | 'wishlist' | 'profile') => void;
  onScrollToCategories?: () => void;
  wishlistCount: number;
  recentOrdersCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onScrollToCategories,
  wishlistCount,
  recentOrdersCount = 0,
}) => {
  return (
    <nav
      id="mobile-bottom-navigation"
      aria-label="Mobile Bottom Navigation"
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] select-none pb-[env(safe-area-inset-bottom,0px)] pointer-events-auto"
    >
      <div className="h-14 px-2 flex items-center justify-around">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => {
            onSelectTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-[#0A84FF]' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-0.5 ${activeTab === 'home' ? 'font-black' : 'font-semibold'}`}>
            Home
          </span>
        </button>

        {/* 2. Aisles & Categories */}
        <button
          type="button"
          onClick={() => {
            if (activeTab !== 'home') {
              onSelectTab('home');
            }
            if (onScrollToCategories) {
              setTimeout(onScrollToCategories, 80);
            }
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 transition-colors text-gray-500 hover:text-gray-800 cursor-pointer"
        >
          <Grid className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 font-semibold">
            Aisles
          </span>
        </button>

        {/* 3. Wishlist */}
        <button
          type="button"
          onClick={() => {
            onSelectTab('wishlist');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors relative cursor-pointer ${
            activeTab === 'wishlist' ? 'text-[#FF3B30]' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="relative">
            <Heart className={`w-5 h-5 ${activeTab === 'wishlist' ? 'stroke-[2.5] fill-[#FF3B30]' : 'stroke-[1.8]'}`} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#FF3B30] text-white text-[9px] font-black flex items-center justify-center border border-white">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-0.5 ${activeTab === 'wishlist' ? 'font-black' : 'font-semibold'}`}>
            Wishlist
          </span>
        </button>

        {/* 4. Orders / Profile */}
        <button
          type="button"
          onClick={() => {
            onSelectTab('profile');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors relative cursor-pointer ${
            activeTab === 'profile' ? 'text-[#0A84FF]' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <div className="relative">
            <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            {recentOrdersCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#30D158] text-white text-[9px] font-black flex items-center justify-center border border-white">
                {recentOrdersCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] mt-0.5 ${activeTab === 'profile' ? 'font-black' : 'font-semibold'}`}>
            Profile
          </span>
        </button>
      </div>
    </nav>
  );
};
