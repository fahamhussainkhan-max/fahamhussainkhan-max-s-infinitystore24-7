import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Boxes,
  ArrowLeft,
  Radio,
  Database,
  ShieldCheck,
  Bell,
  CheckCircle2,
  ExternalLink,
  Menu,
  X,
  LogOut,
  User,
  Volume2,
  VolumeX,
  Flame,
  CookingPot,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Crown,
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { ProductManagement } from './ProductManagement';
import { OrderManagement } from './OrderManagement';
import { InventoryManagement } from './InventoryManagement';
import LiveOrdersManager from './LiveOrdersManager';
import { AdminLogin } from './AdminLogin';
import { subscribeToOrders, SUPABASE_URL, supabase } from '../../lib/supabase';
import { AdminOrder } from '../../types';
import { playOrderAlertChime } from '../../utils/audioAlert';

interface AdminPanelProps {
  onBackToStore?: () => void;
}

export type AdminTab = 'live-orders' | 'orders' | 'inventory' | 'products' | 'dashboard';

interface StaffUser {
  email: string;
  role: string;
  name: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = () => {
  // Authentication State with persistent storage
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(() => {
    try {
      const saved = localStorage.getItem('infinity_staff_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email?.toLowerCase() === 'fahamhussainkhan@gmail.com') {
          parsed.role = 'super_admin';
          parsed.name = 'Faham';
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Helper to query user_roles table or apply super_admin rules
  const resolveStaffRole = async (userId: string, email: string): Promise<{ role: string; name: string }> => {
    let role = '';
    try {
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleRow?.role) {
        role = roleRow.role;
      }
    } catch (e) {
      console.warn('user_roles query note:', e);
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!role) {
      if (cleanEmail === 'fahamhussainkhan@gmail.com') {
        role = 'super_admin';
      } else if (cleanEmail.includes('admin')) {
        role = 'admin';
      } else {
        role = 'staff';
      }
    }

    const name = cleanEmail === 'fahamhussainkhan@gmail.com'
      ? 'Faham'
      : cleanEmail.includes('admin')
      ? 'Store Admin'
      : 'Dispatch Staff';

    return { role, name };
  };

  // Restore session from Supabase client local storage & sync with public.user_roles
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          const email = data.session.user.email || '';
          const resolved = await resolveStaffRole(data.session.user.id, email);
          const userObj = {
            email,
            role: resolved.role,
            name: resolved.name,
          };
          setCurrentUser(userObj);
          localStorage.setItem('infinity_staff_session', JSON.stringify(userObj));
        } else {
          // Check if persistent session exists in localStorage
          const saved = localStorage.getItem('infinity_staff_session');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.email?.toLowerCase() === 'fahamhussainkhan@gmail.com') {
              parsed.role = 'super_admin';
              parsed.name = 'Faham (Super Admin)';
            }
            setCurrentUser(parsed);
          }
        }
      } catch (e) {
        console.error('Session sync error:', e);
      }
    };
    restoreSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const email = session.user.email || '';
        const resolved = await resolveStaffRole(session.user.id, email);
        const userObj = {
          email,
          role: resolved.role,
          name: resolved.name,
        };
        setCurrentUser(userObj);
        localStorage.setItem('infinity_staff_session', JSON.stringify(userObj));
      } else if (event === 'SIGNED_OUT') {
        if (!localStorage.getItem('infinity_staff_session')) {
          setCurrentUser(null);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const resolveTabFromUrl = (): AdminTab => {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    if (hash === '#orders' || path.includes('/orders')) {
      return 'orders';
    }
    if (hash === '#products' || path.includes('/products')) {
      return 'products';
    }
    if (hash === '#inventory' || path.includes('/inventory')) {
      return 'inventory';
    }
    if (hash === '#analytics' || hash === '#dashboard' || path.includes('/analytics')) {
      return 'dashboard';
    }
    // Default to Live Kitchen & Dispatch
    return 'live-orders';
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(resolveTabFromUrl);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [realtimeEventCount, setRealtimeEventCount] = useState<number>(0);
  const [realtimeToast, setRealtimeToast] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [togglingStore, setTogglingStore] = useState(false);

  // Sync store_settings live in Admin
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await supabase
          .from('store_settings')
          .select('*')
          .eq('id', 'primary')
          .single();
        if (data && typeof data.is_open === 'boolean') {
          setIsStoreOpen(data.is_open);
        }
      } catch (err: any) {
        console.warn('Notice fetching store settings in Admin:', err?.message || err);
      }
    };

    fetchStatus();

    const channel = supabase
      .channel('public:store_settings:admin-header')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings' },
        (payload: any) => {
          if (payload.new && typeof payload.new.is_open === 'boolean') {
            setIsStoreOpen(payload.new.is_open);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleToggleStoreStatus = async () => {
    setTogglingStore(true);
    const newStatus = !isStoreOpen;
    try {
      const { error } = await supabase
        .from('store_settings')
        .update({ is_open: newStatus, updated_at: new Date().toISOString() })
        .eq('id', 'primary');
      if (error) throw error;
      setIsStoreOpen(newStatus);
      setRealtimeToast(`Store is now ${newStatus ? 'OPEN (Accepting orders)' : 'CLOSED (Orders paused)'}`);
    } catch (err: any) {
      console.error('Failed to toggle store status:', err);
      alert('Error updating store status: ' + err.message);
    } finally {
      setTogglingStore(false);
    }
  };

  // Sync hash with active tab
  useEffect(() => {
    const handleUrlChange = () => {
      setActiveTab(resolveTabFromUrl());
    };
    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    const hashMapping: Record<AdminTab, string> = {
      'live-orders': '#kitchen',
      orders: '#orders',
      inventory: '#inventory',
      products: '#products',
      dashboard: '#analytics',
    };
    const targetHash = hashMapping[tab] || '#kitchen';
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  };

  // Supabase Realtime channel subscription on the 'orders' table
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToOrders(
      (newOrder: AdminOrder) => {
        setRealtimeEventCount((prev) => prev + 1);
        setRealtimeToast(`⚡ New order received: ${newOrder.order_number || newOrder.id} (₹${newOrder.total_amount})`);
        if (soundEnabled) {
          playOrderAlertChime();
        }
        setTimeout(() => setRealtimeToast(null), 5000);
      },
      (updatedOrder: AdminOrder) => {
        setRealtimeEventCount((prev) => prev + 1);
        setRealtimeToast(`⚡ Order status: ${updatedOrder.order_number || updatedOrder.id} ➔ ${updatedOrder.status}`);
        setTimeout(() => setRealtimeToast(null), 4000);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser, soundEnabled]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Handled
    }
    localStorage.removeItem('infinity_staff_session');
    setCurrentUser(null);
  };

  // If staff is not signed in, show secure login screen strictly
  if (!currentUser) {
    return (
      <AdminLogin
        onSuccess={(user) => setCurrentUser(user)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1523] flex font-sans text-gray-900 select-none">
      {/* Realtime Toast Notification */}
      {realtimeToast && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-[#0A84FF] text-white text-xs font-bold shadow-2xl flex items-center gap-3 border border-white/20 animate-fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
          <span>{realtimeToast}</span>
          <button
            type="button"
            onClick={() => setRealtimeToast(null)}
            className="ml-2 text-white/80 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* MOBILE DRAWER BACKDROP */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ============================================================
          DARK SIDEBAR: Professional, High-Contrast Ops Navigation
          ============================================================ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0E1523] border-r border-[#1C2638] text-gray-300 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding */}
        <div>
          <div className="p-6 border-b border-[#1C2638] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0A84FF] to-[#0055D4] text-white flex items-center justify-center font-black shadow-lg shadow-[#0A84FF]/25">
                ∞
              </div>
              <div>
                <div className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                  <span>Infinity Ops</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#0A84FF]/20 text-[#0A84FF] font-bold">
                    PRO
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 font-medium">Campus Quick Dispatch</div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Logged-in Staff Badge */}
          <div className="mx-4 my-4 p-3 rounded-2xl bg-[#141E30] border border-[#21304A] flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className={`w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                  currentUser.role === 'super_admin'
                    ? 'bg-gradient-to-tr from-amber-400 to-amber-500 text-amber-950 font-black shadow-md shadow-amber-500/20'
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                }`}
              >
                {currentUser.role === 'super_admin' ? (
                  <Crown className="w-4 h-4 text-amber-950" />
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                <div className="text-[10px] font-medium flex items-center gap-1">
                  {currentUser.role === 'super_admin' ? (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Super Admin
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="capitalize">{currentUser.role} Active</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              title="Sign Out of Operations"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 space-y-1 mt-2">
            <button
              type="button"
              onClick={() => switchTab('live-orders')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'live-orders'
                  ? 'bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/25'
                  : 'text-gray-400 hover:text-white hover:bg-[#141E30]'
              }`}
            >
              <div className="flex items-center gap-3">
                <CookingPot className={`w-4 h-4 ${activeTab === 'live-orders' ? 'text-white' : 'text-amber-400'}`} />
                <span>Live Kitchen & Dispatch</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  activeTab === 'live-orders'
                    ? 'bg-white text-[#0A84FF]'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                }`}
              >
                LIVE
              </span>
            </button>

            <button
              type="button"
              onClick={() => switchTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/25'
                  : 'text-gray-400 hover:text-white hover:bg-[#141E30]'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4" />
                <span>Orders & History</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            </button>

            <button
              type="button"
              onClick={() => switchTab('inventory')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/25'
                  : 'text-gray-400 hover:text-white hover:bg-[#141E30]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Boxes className={`w-4 h-4 ${activeTab === 'inventory' ? 'text-white' : 'text-blue-400'}`} />
                <span>Inventory & Alerts</span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-[#1E293B] text-gray-300 px-2 py-0.5 rounded-full">
                Ledger
              </span>
            </button>

            <button
              type="button"
              onClick={() => switchTab('products')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/25'
                  : 'text-gray-400 hover:text-white hover:bg-[#141E30]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className={`w-4 h-4 ${activeTab === 'products' ? 'text-white' : 'text-purple-400'}`} />
                <span>Product Catalog (CRUD)</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            </button>

            <button
              type="button"
              onClick={() => switchTab('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/25'
                  : 'text-gray-400 hover:text-white hover:bg-[#141E30]'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4" />
                <span>Analytics & Overview</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-[#1C2638] space-y-3">
          {/* Audio Chime & Mute Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={playOrderAlertChime}
              className="py-2 px-2.5 rounded-xl bg-[#141E30] hover:bg-[#1C2B45] text-gray-300 hover:text-white text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border border-[#21304A] cursor-pointer"
              title="Test Web Audio Chime"
            >
              <Bell className="w-3.5 h-3.5 text-[#0A84FF]" />
              <span>Test Bell</span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`py-2 px-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                  : 'bg-red-950/40 text-red-400 border-red-800/60'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Audio ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Muted</span>
                </>
              )}
            </button>
          </div>

          {/* Realtime Supabase Indicator */}
          <div className="text-[10px] text-gray-500 flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Realtime Channel Active</span>
            </div>
            {realtimeEventCount > 0 && (
              <span className="font-mono text-gray-400 font-bold">{realtimeEventCount} events</span>
            )}
          </div>
        </div>
      </aside>

      {/* ============================================================
          LIGHT WORKSPACE: Clean, High-Contrast Content Area
          ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-72 bg-[#F8FAFC]">
        {/* Top App Bar for Mobile & Operations with Logout */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/90 h-16 px-4 sm:px-8 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Infinity Store Operations Console
              </div>
              <h2 className="text-base font-black text-gray-900 capitalize font-display">
                {activeTab === 'live-orders'
                  ? 'Live Kitchen & Dispatch Feed'
                  : activeTab === 'orders'
                  ? 'All Customer Orders'
                  : activeTab === 'inventory'
                  ? 'Stock Inventory & Transactions Ledger'
                  : activeTab === 'products'
                  ? 'Product Catalog Management'
                  : 'Performance Analytics'}
              </h2>
            </div>
          </div>

          {/* Top Navigation Bar Controls: Online Status, Staff Info & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Store Status Switcher for Instant Storefront Control */}
            <button
              type="button"
              disabled={togglingStore}
              onClick={handleToggleStoreStatus}
              title="Click to toggle store open / closed status for customers"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition shadow-xs cursor-pointer ${
                isStoreOpen
                  ? 'bg-emerald-500/10 text-emerald-800 border-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-800 border-rose-300 hover:bg-rose-500/20'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-emerald-600 animate-pulse' : 'bg-rose-600'}`} />
              <span>{togglingStore ? 'Updating...' : isStoreOpen ? 'Store: OPEN' : 'Store: CLOSED'}</span>
            </button>

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Live Terminal</span>
            </div>

            {/* Staff Pill */}
            <div
              className={`hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-bold ${
                currentUser.role === 'super_admin'
                  ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-2xs'
                  : 'bg-gray-100 border-gray-200 text-gray-700'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full text-[11px] flex items-center justify-center font-black ${
                  currentUser.role === 'super_admin'
                    ? 'bg-gradient-to-tr from-amber-400 to-amber-500 text-amber-950 shadow-xs'
                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                }`}
              >
                {currentUser.role === 'super_admin' ? (
                  <Crown className="w-3.5 h-3.5 text-amber-950" />
                ) : (
                  currentUser.name.charAt(0).toUpperCase()
                )}
              </span>
              <span className="truncate max-w-[120px]">
                {currentUser.role === 'super_admin' ? 'Super Admin' : currentUser.name}
              </span>
            </div>

            {/* Top Navigation Logout Button */}
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-gray-700 text-xs font-bold transition-all border border-gray-200 cursor-pointer shadow-2xs"
              title="Sign Out of Operations Console"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'live-orders' && <LiveOrdersManager />}
          {activeTab === 'orders' && <OrderManagement />}
          {activeTab === 'inventory' && <InventoryManagement />}
          {activeTab === 'products' && <ProductManagement />}
          {activeTab === 'dashboard' && (
            <AdminDashboard
              onNavigateToOrders={() => switchTab('orders')}
              onNavigateToProducts={() => switchTab('products')}
              onNavigateToInventory={() => switchTab('inventory')}
              onNavigateToLiveOrders={() => switchTab('live-orders')}
              realtimeEventCount={realtimeEventCount}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
