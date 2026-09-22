import React from 'react';
import { motion } from 'motion/react';
import { Compass, Heart, ShoppingBag, User } from 'lucide-react';

export type NavigationTab = 'home' | 'wishlist' | 'cart' | 'profile';

interface BottomNavBarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  cartCount: number;
  cartTotal: number;
  wishlistCount: number;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
  cartCount,
  cartTotal,
  wishlistCount,
}) => {
  const tabs = [
    {
      id: 'home' as NavigationTab,
      label: 'Explore',
      sublabel: 'Home Feed',
      icon: Compass,
    },
    {
      id: 'wishlist' as NavigationTab,
      label: 'Wishlist',
      sublabel: 'Saved Items',
      icon: Heart,
      badge: wishlistCount > 0 ? wishlistCount : null,
      badgeColor: 'bg-[#FF3B30]',
    },
    {
      id: 'cart' as NavigationTab,
      label: 'Cart & Bag',
      sublabel: cartCount > 0 ? `₹${cartTotal}` : 'Empty',
      icon: ShoppingBag,
      badge: cartCount > 0 ? cartCount : null,
      badgeColor: 'bg-[#0A84FF]',
    },
    {
      id: 'profile' as NavigationTab,
      label: 'Orders & Profile',
      sublabel: 'Live Track',
      icon: User,
    },
  ];

  return (
    <nav
      aria-label="Campus navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] select-none"
    >
      <div className="max-w-lg mx-auto px-3 py-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[70px] min-h-[48px] rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[#0A84FF] font-black'
                  : 'text-gray-500 hover:text-gray-900 font-semibold'
              }`}
            >
              {/* Active top subtle indicator glow */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-1.5 w-8 h-1 rounded-full bg-[#0A84FF] shadow-[0_0_8px_rgba(10,132,255,0.8)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge !== null && tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full ${tab.badgeColor} text-white text-[9px] font-black flex items-center justify-center shadow-xs border-2 border-white`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] mt-1 leading-none tracking-tight">
                {tab.label}
              </span>
              <span className="text-[9px] text-gray-400 mt-0.5 leading-none hidden sm:inline">
                {tab.sublabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
