import React, { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Building,
  MapPin,
  Save,
  CheckCircle2,
  Clock,
  Bike,
  CookingPot,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  MessageCircle,
} from 'lucide-react';
import { AdminOrder, CampusZone } from '../types';
import { fetchOrders, supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { OrderDispatchTracker } from './OrderDispatchTracker';
import { OrderTrackingTimeline } from './OrderTrackingTimeline';

interface OrdersProfileViewProps {
  onExploreCatalog: () => void;
  onToastMessage: (msg: string) => void;
  allZones: CampusZone[];
  onSelectZone: (zone: CampusZone) => void;
}

export const OrdersProfileView: React.FC<OrdersProfileViewProps> = ({
  onExploreCatalog,
  onToastMessage,
  allZones,
  onSelectZone,
}) => {
  const { user: authUser, isAuthenticated, openLoginModal, signOut } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'orders'>('profile');
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<AdminOrder | null>(null);

  // Profile state (persisted in localStorage and Supabase profiles table)
  const [profile, setProfile] = useState(() => {
    try {
      const savedPhone = localStorage.getItem('infinity_user_phone') || '';
      const savedName = localStorage.getItem('infinity_user_name') || '';
      const savedRoom = localStorage.getItem('infinity_user_room') || '';
      const saved = localStorage.getItem('infinity_student_profile');
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        fullName: savedName || authUser?.name || parsed.fullName || '',
        phone: savedPhone || authUser?.phone || parsed.phone || '',
        email: authUser?.email || parsed.email || '',
        hostel: parsed.hostel || 'CCCT — Academic Complex & Admin',
        roomNo: savedRoom || parsed.roomNo || '',
        notes: parsed.notes || '',
      };
    } catch {}
    return {
      fullName: authUser?.name || '',
      phone: authUser?.phone || '',
      email: authUser?.email || '',
      hostel: 'CCCT — Academic Complex & Admin',
      roomNo: '',
      notes: '',
    };
  });

  // When user logs in via WhatsApp verification, automatically fetch & sync profile from Supabase
  useEffect(() => {
    if (authUser) {
      setProfile((prev) => {
        const updated = {
          ...prev,
          fullName: authUser.name || prev.fullName,
          email: authUser.email || prev.email,
        };
        try {
          localStorage.setItem('infinity_student_profile', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Query Supabase profiles table for existing saved address/phone
      const fetchSupabaseProfile = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .or(`id.eq.${authUser.id},email.eq.${authUser.email}`)
            .maybeSingle();

          if (data && !error) {
            setProfile((prev) => {
              const parts = (data.hostel_block || '').split(' - ');
              const savedHostel = parts[0] || prev.hostel;
              const savedRoom = parts.slice(1).join(' - ') || prev.roomNo;
              const merged = {
                fullName: data.full_name || authUser.name || prev.fullName,
                email: data.email || authUser.email || prev.email,
                phone: data.phone || prev.phone,
                hostel: savedHostel || prev.hostel,
                roomNo: savedRoom || prev.roomNo,
                notes: data.notes || prev.notes,
              };
              try {
                localStorage.setItem('infinity_student_profile', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        } catch (err) {
          console.warn('Supabase profile fetch notice:', err);
        }
      };

      fetchSupabaseProfile();
    }
  }, [authUser]);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Load orders
  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (e) {
      console.warn('Orders fetch error:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();

    // Listen to live order updates via Supabase Realtime
    const channel = supabase
      .channel('public:orders:profile-tracker')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          loadOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    onToastMessage('Logged out from campus session');
  };

  // Helper to persist profile both to localStorage and Supabase profiles table
  const saveProfileToSupabaseAndLocal = async (userId: string, updatedProfile: typeof profile) => {
    try {
      localStorage.setItem('infinity_student_profile', JSON.stringify(updatedProfile));
    } catch {}

    try {
      await supabase.from('profiles').upsert(
        [
          {
            id: userId,
            full_name: updatedProfile.fullName,
            phone: updatedProfile.phone,
            email: updatedProfile.email || `${updatedProfile.fullName.toLowerCase().replace(/\s+/g, '.')}@campus.edu`,
            role: 'student',
            hostel_block: `${updatedProfile.hostel} - ${updatedProfile.roomNo}`,
            created_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'id' }
      );
    } catch (e) {
      console.warn('Supabase profiles sync note:', e);
    }
  };

  // Update profile fields with automatic local persistence
  const updateField = (key: keyof typeof profile, val: string) => {
    setProfile((prev) => {
      const updated = { ...prev, [key]: val };
      try {
        localStorage.setItem('infinity_student_profile', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = profile.phone.replace(/\D/g, '');
    try {
      if (profile.fullName) localStorage.setItem('infinity_user_name', profile.fullName.trim());
      if (cleanPhone) localStorage.setItem('infinity_user_phone', cleanPhone);
      if (profile.roomNo) localStorage.setItem('infinity_user_room', profile.roomNo.trim());
      if (cleanPhone.length === 10 && profile.fullName.trim()) {
        localStorage.setItem('infinity_user_verified', 'true');
      }
    } catch {}

    const userId = authUser?.id || (cleanPhone ? `student-${cleanPhone}` : 'usr-student-local');
    await saveProfileToSupabaseAndLocal(userId, profile);
    setSaveSuccess(true);
    onToastMessage('Delivery address saved! Pre-filled for 1-click checkout.');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Order status badge helper
  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> Delivered
        </span>
      );
    }
    if (s.includes('dispatch') || s.includes('out')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 animate-pulse">
          <Bike className="w-3 h-3" /> Runner Dispatched
        </span>
      );
    }
    if (s.includes('prep') || s.includes('pack')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
          <CookingPot className="w-3 h-3" /> Packing Supplies
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
        <Clock className="w-3 h-3" /> Confirmed / Rush Queue
      </span>
    );
  };

  if (selectedOrderForTracking) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-8 animate-fade-in">
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setSelectedOrderForTracking(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-200/90 text-xs font-bold text-gray-800 shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
            <span>← Back to Orders List</span>
          </button>
        </div>
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <OrderTrackingTimeline
            order={selectedOrderForTracking}
            onBack={() => setSelectedOrderForTracking(null)}
            onStatusUpdate={(updated) => {
              setOrders((prev) =>
                prev.map((o) => (o.id === updated.id ? updated : o))
              );
              setSelectedOrderForTracking(updated);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 animate-fade-in">
      {/* Universal Top-Left Back Navigation */}
      <div className="flex items-center justify-between mb-4 pb-2">
        <button
          type="button"
          onClick={onExploreCatalog}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-200/90 text-xs font-bold text-gray-800 shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-gray-700" />
          <span>← Back to Store</span>
        </button>
        <span className="text-xs text-gray-500 font-semibold hidden sm:inline">
          CCCT & SIST Campus Account
        </span>
      </div>

      {/* Top Title & Navigation Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 font-display">
              Orders & Student Profile
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage your saved delivery address, authenticated campus session, and live orders.
          </p>
        </div>

        {/* Subtabs Pill Switcher */}
        <div className="inline-flex p-1 rounded-2xl bg-gray-100 border border-gray-200/80">
          <button
            type="button"
            onClick={() => setActiveSubTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'profile'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Profile & Room Details
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'orders'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <span>Live Orders</span>
            {orders.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#0A84FF] text-white text-[9px] font-black flex items-center justify-center">
                {orders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeSubTab === 'profile' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Auth Status & Perks */}
          <div className="md:col-span-1 space-y-4">
            {/* Authenticated User Status Card */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  CAMPUS VERIFICATION STATUS
                </span>
                {profile.phone && (localStorage.getItem('infinity_user_verified') === 'true' || authUser?.isVerified) ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" /> Verified Student
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    First-Time User
                  </span>
                )}
              </div>

              {profile.phone && (localStorage.getItem('infinity_user_verified') === 'true' || authUser?.isVerified) ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm border border-emerald-200 shrink-0">
                      {(profile.fullName || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{profile.fullName || 'Campus Student'}</h3>
                      <p className="text-xs text-gray-500 truncate">+91 {profile.phone}</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-800">
                    <div className="flex items-center gap-1 font-bold text-emerald-900 mb-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>1-Click COD Checkout Active</span>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      {profile.hostel} • {profile.roomNo || 'Room set'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2 rounded-xl text-xs font-bold text-neutral-600 hover:text-red-600 hover:bg-red-50 border border-neutral-200 hover:border-red-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Reset Saved Details</span>
                  </button>
                </div>
              ) : (
                /* First-Time User Explanation & WhatsApp Login CTA */
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Verify once via WhatsApp to activate your student session. Your name, WhatsApp number, and hostel room are saved permanently for instant <strong>1-click checkout</strong>.
                  </p>

                  <button
                    type="button"
                    onClick={openLoginModal}
                    className="w-full py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-black rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4 fill-white text-white" />
                    <span>Login & Verify via WhatsApp</span>
                  </button>

                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-900 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-[10.5px]">100% password-free • Instant student verification</span>
                  </div>
                </div>
              )}
            </div>

            {/* Campus Express Delivery Info Card */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FFD60A]" /> CAMPUS EXPRESS
              </span>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Saved details sync automatically to your WhatsApp profile and campus database. Room and floor details are pre-filled directly at checkout.
              </p>
              <div className="pt-2 border-t border-gray-100 flex items-center gap-2 text-[11px] text-emerald-700 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Delivery within 30 - 45 mins</span>
              </div>
            </div>
          </div>

          {/* Right Column: User Details Form (Auto-saved to localStorage and Supabase) */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Hostel & Room Address Profile
                  </h2>
                  <p className="text-xs text-gray-500">
                    Retained permanently so you never have to re-enter details at checkout.
                  </p>
                </div>
                {saveSuccess && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        value={profile.fullName}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        required
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#0A84FF] bg-[#FAFAF7]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                      Phone Number (For Runner Call) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        maxLength={10}
                        value={profile.phone}
                        onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, ''))}
                        placeholder="10-digit mobile number"
                        required
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#0A84FF] bg-[#FAFAF7]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                      Hostel Wing / Campus Area <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                      <select
                        value={profile.hostel}
                        onChange={(e) => {
                          updateField('hostel', e.target.value);
                          const matchedZone = allZones.find((z) => z.name === e.target.value);
                          if (matchedZone) onSelectZone(matchedZone);
                        }}
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#0A84FF] bg-[#FAFAF7] cursor-pointer"
                      >
                        <optgroup label="── CCCT ──" className="font-bold text-gray-900 bg-gray-50">
                          {allZones
                            .filter((z) => z.campusGroup === 'CCCT' || z.campusGroup === 'CCCT Campus' || z.id.startsWith('ccct'))
                            .map((zone, idx) => (
                              <option key={`ccct-${zone.id}-${idx}`} value={zone.name}>
                                {zone.name}
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="── SIST ──" className="font-bold text-gray-900 bg-gray-50">
                          {allZones
                            .filter((z) => z.campusGroup === 'SIST' || z.campusGroup === 'SIST Campus' || z.id.startsWith('sist') || z.id.startsWith('ccst'))
                            .map((zone, idx) => (
                              <option key={`sist-${zone.id}-${idx}`} value={zone.name}>
                                {zone.name}
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="── Hostels / Custom PGs ──" className="font-bold text-gray-900 bg-gray-50">
                          {allZones
                            .filter(
                              (z) =>
                                !(
                                  z.campusGroup === 'CCCT' ||
                                  z.campusGroup === 'CCCT Campus' ||
                                  z.id.startsWith('ccct') ||
                                  z.campusGroup === 'SIST' ||
                                  z.campusGroup === 'SIST Campus' ||
                                  z.id.startsWith('sist') ||
                                  z.id.startsWith('ccst')
                                )
                            )
                            .map((zone, idx) => (
                              <option key={`pg-${zone.id}-${idx}`} value={zone.name}>
                                {zone.name}
                              </option>
                            ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                      Room & Floor # <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        value={profile.roomNo}
                        onChange={(e) => updateField('roomNo', e.target.value)}
                        placeholder="e.g. Room 304, Block B, 3rd Floor"
                        required
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#0A84FF] bg-[#FAFAF7]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Delivery Instructions / Runner Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={profile.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="e.g. Call before reaching gate, or leave at room door"
                    className="w-full p-3 text-xs font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#0A84FF] bg-[#FAFAF7]"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[11px] text-gray-500">
                    💾 Automatically synchronized with Supabase profiles & 1-tap checkout
                  </span>

                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-[#111111] hover:bg-[#0A84FF] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Details</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Orders Tab: Live Tracking & Past Orders */
        <div className="space-y-4">
          {/* Sticky Back to Store Bar */}
          <div className="sticky top-20 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-gray-200/90 shadow-sm flex items-center justify-between">
            <button
              type="button"
              onClick={onExploreCatalog}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Store</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">
                Orders ({orders.length})
              </span>
              <button
                type="button"
                onClick={loadOrders}
                className="text-xs font-bold text-[#0A84FF] hover:bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                title="Refresh Orders"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Refresh</span>
              </button>
            </div>
          </div>

          {loadingOrders ? (
            <div className="py-16 text-center text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0A84FF]" />
              <p className="text-xs font-semibold mt-2">Loading campus orders...</p>
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order, orderIdx) => (
                <div
                  key={order.id ? `${order.id}-${orderIdx}` : `order-${orderIdx}`}
                  className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs hover:border-gray-300 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-gray-900">
                          {order.order_number || order.id}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(order.created_at).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-gray-900">
                        ₹{order.total_amount}
                      </span>
                      <p className="text-[10px] text-gray-400 font-semibold">
                        {order.payment_method || 'COD'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-gray-600 bg-[#FAFAF7] p-3 rounded-2xl">
                    <MapPin className="w-3.5 h-3.5 text-[#30D158] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-gray-900">
                        {order.delivery_zone || 'Campus Zone'}
                      </span>
                      {order.room_details && (
                        <span className="text-gray-500"> • {order.room_details}</span>
                      )}
                    </div>
                  </div>

                  {/* Interactive 4-step Progress Tracker */}
                  <OrderDispatchTracker
                    orderId={order.order_number || order.id}
                    status={order.status}
                    deliveryZone={order.delivery_zone}
                    roomDetails={order.room_details}
                    totalAmount={order.total_amount}
                    onTrackLive={() => setSelectedOrderForTracking(order)}
                    showContactActions={true}
                  />

                  {/* Items snapshot */}
                  <div className="space-y-1 pt-1 border-t border-gray-100">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Ordered Items ({order.items?.length || 0}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {order.items &&
                        order.items.map((it, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-100 text-xs font-medium text-gray-700"
                          >
                            {it.quantity}x {it.name}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 shadow-2xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <Bike className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No Orders Yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Hungry or need stationery? Explore our campus categories and get items delivered to your room in minutes.
              </p>
              <button
                type="button"
                onClick={onExploreCatalog}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-[#0A84FF] text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Browse Campus Catalog
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
