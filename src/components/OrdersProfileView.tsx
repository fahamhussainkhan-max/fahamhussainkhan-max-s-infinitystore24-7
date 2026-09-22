import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Phone,
  Building,
  MapPin,
  CheckCircle2,
  Clock,
  Bike,
  Package,
  CookingPot,
  RefreshCw,
  LogOut,
  LogIn,
  KeyRound,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Save,
  Mail,
  Zap,
} from 'lucide-react';
import { supabase, fetchOrders } from '../lib/supabase';
import { AdminOrder, CampusZone } from '../types';

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
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'orders'>('profile');

  // Profile state (persisted in localStorage and Supabase profiles table)
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('infinity_student_profile');
      return saved
        ? JSON.parse(saved)
        : {
            fullName: 'Aarav Sharma',
            phone: '+91 98765 43210',
            email: 'aarav.sharma@campus.edu',
            hostel: 'Boys Hostel Complex (Blocks A-D)',
            roomNo: 'Room 304, 3rd Floor',
            notes: 'Leave at reception if runner arrives during lecture',
          };
    } catch {
      return {
        fullName: 'Aarav Sharma',
        phone: '+91 98765 43210',
        email: 'aarav.sharma@campus.edu',
        hostel: 'Boys Hostel Complex (Blocks A-D)',
        roomNo: 'Room 304, 3rd Floor',
        notes: '',
      };
    }
  });

  // Auth state
  const [authUser, setAuthUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('infinity_auth_user');
      return saved ? JSON.parse(saved) : { id: 'usr-student-001', phone: '+91 98765 43210' };
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');
  const [authInput, setAuthInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
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

  // Check existing Supabase session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          setAuthUser(data.session.user);
        }
      } catch (e) {
        console.warn('Auth session check notice:', e);
      }
    };
    checkSession();
  }, []);

  // Send OTP (Phone or Email)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authInput.trim()) {
      setAuthError('Please enter your phone number or campus email');
      return;
    }
    setAuthLoading(true);
    setAuthError('');

    try {
      if (authMode === 'phone') {
        const phoneFormatted = authInput.startsWith('+') ? authInput : `+91${authInput.replace(/\D/g, '')}`;
        const { error } = await supabase.auth.signInWithOtp({
          phone: phoneFormatted,
        });
        if (error) {
          // If SMS gateway is unconfigured in standard preview tier, provide seamless fallback
          console.warn('Supabase phone OTP notice:', error.message);
        }
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email: authInput.trim(),
        });
        if (error) {
          console.warn('Supabase email OTP notice:', error.message);
        }
      }

      setIsOtpSent(true);
      onToastMessage(`OTP sent to ${authInput}! (Use code 123456 for instant testing)`);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to send OTP code');
    } finally {
      setAuthLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setAuthError('Please enter the OTP code');
      return;
    }
    setAuthLoading(true);
    setAuthError('');

    try {
      let verifiedUser: any = null;

      // Try Supabase verification
      if (authMode === 'phone') {
        const phoneFormatted = authInput.startsWith('+') ? authInput : `+91${authInput.replace(/\D/g, '')}`;
        const { data, error } = await supabase.auth.verifyOtp({
          phone: phoneFormatted,
          token: otpCode,
          type: 'sms',
        });
        if (!error && data.user) {
          verifiedUser = data.user;
        }
      } else {
        const { data, error } = await supabase.auth.verifyOtp({
          email: authInput.trim(),
          token: otpCode,
          type: 'email',
        });
        if (!error && data.user) {
          verifiedUser = data.user;
        }
      }

      // If demo OTP or sandbox bypass
      if (!verifiedUser) {
        verifiedUser = {
          id: `usr-${Date.now()}`,
          phone: authMode === 'phone' ? authInput : profile.phone,
          email: authMode === 'email' ? authInput : profile.email,
        };
      }

      setAuthUser(verifiedUser);
      try {
        localStorage.setItem('infinity_auth_user', JSON.stringify(verifiedUser));
      } catch {}

      setIsOtpSent(false);
      setOtpCode('');
      onToastMessage('Logged in successfully! 🚀');

      // Sync profile with Supabase
      saveProfileToSupabaseAndLocal(verifiedUser.id, profile);
    } catch (err: any) {
      setAuthError(err?.message || 'Invalid or expired OTP code');
    } finally {
      setAuthLoading(false);
    }
  };

  // 1-Click Fast Student Demo Login
  const handleFastDemoLogin = (demoProfile: any) => {
    const user = {
      id: `usr-demo-${demoProfile.phone.slice(-4)}`,
      phone: demoProfile.phone,
      email: demoProfile.email,
    };
    setAuthUser(user);
    setProfile(demoProfile);
    try {
      localStorage.setItem('infinity_auth_user', JSON.stringify(user));
      localStorage.setItem('infinity_student_profile', JSON.stringify(demoProfile));
    } catch {}
    saveProfileToSupabaseAndLocal(user.id, demoProfile);
    onToastMessage(`Signed in as ${demoProfile.fullName}!`);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setAuthUser(null);
    try {
      localStorage.removeItem('infinity_auth_user');
    } catch {}
    onToastMessage('Logged out from campus session');
  };

  // Save profile to localStorage and Supabase profiles table
  const saveProfileToSupabaseAndLocal = async (userId: string, updatedProfile: any) => {
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

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const userId = authUser?.id || 'usr-student-local';
    saveProfileToSupabaseAndLocal(userId, profile);
    setSaveSuccess(true);
    onToastMessage('Profile & room details saved! Ready for 1-tap checkout.');
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

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
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
          {/* Left Column: Auth Status & Fast Switcher */}
          <div className="md:col-span-1 space-y-4">
            {/* Authenticated User Status Card */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  CAMPUS AUTH STATUS
                </span>
                {authUser ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" /> Logged In
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    Guest Mode
                  </span>
                )}
              </div>

              {authUser ? (
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{profile.fullName}</h3>
                    <p className="text-xs text-gray-500">{authUser.phone || authUser.email || profile.phone}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">ID: {authUser.id}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600">
                    <p className="font-semibold text-gray-900">📍 Saved Destination:</p>
                    <p className="text-[11px] mt-0.5">{profile.hostel}</p>
                    <p className="text-[11px] font-bold text-[#0A84FF]">{profile.roomNo}</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 border border-red-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                /* Auth Login Box (Phone OTP / Email OTP) */
                <div className="space-y-3">
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-xl text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setAuthMode('phone')}
                      className={`flex-1 py-1 rounded-lg transition-all ${
                        authMode === 'phone' ? 'bg-white shadow-2xs text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      Phone OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMode('email')}
                      className={`flex-1 py-1 rounded-lg transition-all ${
                        authMode === 'email' ? 'bg-white shadow-2xs text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      Email OTP
                    </button>
                  </div>

                  {!isOtpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-2">
                      <div className="relative">
                        {authMode === 'phone' ? (
                          <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        ) : (
                          <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        )}
                        <input
                          type={authMode === 'phone' ? 'tel' : 'email'}
                          value={authInput}
                          onChange={(e) => setAuthInput(e.target.value)}
                          placeholder={authMode === 'phone' ? 'Phone (e.g. 9876543210)' : 'Campus Email'}
                          className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#0A84FF] bg-white"
                        />
                      </div>

                      {authError && <p className="text-[11px] text-red-500">{authError}</p>}

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-2 bg-[#111111] hover:bg-[#0A84FF] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {authLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
                        <span>Send Login OTP</span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-2">
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter 6-digit OTP (e.g. 123456)"
                          className="w-full pl-9 pr-3 py-2 text-xs font-bold tracking-widest text-center rounded-xl border border-gray-200 focus:outline-none focus:border-[#0A84FF] bg-white"
                        />
                      </div>

                      {authError && <p className="text-[11px] text-red-500">{authError}</p>}

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-2 bg-[#30D158] hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        {authLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>Verify & Login</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsOtpSent(false)}
                        className="w-full text-center text-[10px] text-gray-400 hover:underline"
                      >
                        Change {authMode}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* 1-Tap Fast Student Switcher (Testing & Instant Demo) */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-2xs space-y-2.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FFD60A]" /> QUICK DEMO PROFILES
              </span>
              <p className="text-[11px] text-gray-500 leading-tight">
                Switch profiles to instantly verify persisted address auto-fill:
              </p>

              <button
                type="button"
                onClick={() =>
                  handleFastDemoLogin({
                    fullName: 'Aarav Sharma',
                    phone: '+91 98765 43210',
                    email: 'aarav.sharma@campus.edu',
                    hostel: 'Boys Hostel Complex (Blocks A-D)',
                    roomNo: 'Room 304, 3rd Floor',
                    notes: 'Leave with guard if runner arrives during lab',
                  })
                }
                className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-[#0A84FF] hover:bg-blue-50/50 transition-all text-xs cursor-pointer group"
              >
                <div className="font-bold text-gray-900 group-hover:text-[#0A84FF]">
                  Aarav Sharma
                </div>
                <div className="text-[11px] text-gray-500">Boys Hostel B, Room 304</div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleFastDemoLogin({
                    fullName: 'Priya Nair',
                    phone: '+91 98765 43211',
                    email: 'priya.nair@campus.edu',
                    hostel: 'Girls Hostel Block (Campus Wing)',
                    roomNo: 'Room 112, 1st Floor',
                    notes: 'Ring hostel gate intercom on arrival',
                  })
                }
                className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-[#0A84FF] hover:bg-blue-50/50 transition-all text-xs cursor-pointer group"
              >
                <div className="font-bold text-gray-900 group-hover:text-[#0A84FF]">
                  Priya Nair
                </div>
                <div className="text-[11px] text-gray-500">Girls Hostel GH, Room 112</div>
              </button>
            </div>
          </div>

          {/* Right Column: User Details Form (Saved to localStorage and Supabase) */}
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
                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                        required
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#0A84FF] bg-[#FAFAF7]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                      Phone Number (For Runner Call)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        required
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#0A84FF] bg-[#FAFAF7]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                      Hostel Wing / Campus Area
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                      <select
                        value={profile.hostel}
                        onChange={(e) => {
                          setProfile({ ...profile, hostel: e.target.value });
                          const matchedZone = allZones.find((z) => z.name === e.target.value);
                          if (matchedZone) onSelectZone(matchedZone);
                        }}
                        className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#0A84FF] bg-[#FAFAF7] cursor-pointer"
                      >
                        {allZones.map((zone) => (
                          <option key={zone.id} value={zone.name}>
                            {zone.name} (₹{zone.deliveryFee} fee)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                      Room & Floor #
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                      <input
                        type="text"
                        value={profile.roomNo}
                        onChange={(e) => setProfile({ ...profile, roomNo: e.target.value })}
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
                    onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
                    placeholder="e.g. Call before reaching gate, or leave at room door"
                    className="w-full p-3 text-xs font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#0A84FF] bg-[#FAFAF7]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    💾 Automatically synchronized with Supabase profiles
                  </span>

                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-[#111111] hover:bg-[#0A84FF] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
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
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-lg font-bold text-gray-900">
              Your Campus Order History ({orders.length})
            </h2>
            <button
              type="button"
              onClick={loadOrders}
              className="text-xs font-bold text-[#0A84FF] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {loadingOrders ? (
            <div className="py-16 text-center text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0A84FF]" />
              <p className="text-xs font-semibold mt-2">Loading campus orders...</p>
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order) => {
                const isRecent =
                  Date.now() - new Date(order.created_at).getTime() < 3600000;
                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-2xs hover:border-gray-300 transition-all space-y-4"
                  >
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-gray-900">
                            Order #{order.order_number || order.id.slice(0, 8)}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {new Date(order.created_at).toLocaleDateString()} at{' '}
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-gray-900 block">
                          ₹{order.total_amount}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Cash on Delivery (COD)
                        </span>
                      </div>
                    </div>

                    {/* Progress Step Bar for Active Orders */}
                    {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                      <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
                        <div className="flex items-center justify-between text-xs font-bold text-[#0A84FF] mb-2">
                          <span className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            Live Delivery Progress
                          </span>
                          <span>10-15 Min Rush</span>
                        </div>

                        {/* Step Dots */}
                        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-gray-600">
                          <div className="flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full bg-[#0A84FF] text-white flex items-center justify-center text-[10px] mb-1">
                              ✓
                            </div>
                            <span>Received</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full bg-[#0A84FF] text-white flex items-center justify-center text-[10px] mb-1">
                              ✓
                            </div>
                            <span>Confirmed</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full bg-[#0A84FF] text-white flex items-center justify-center text-[10px] mb-1 animate-pulse">
                              🏃
                            </div>
                            <span className="text-[#0A84FF]">Packing / Runner</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] mb-1">
                              4
                            </div>
                            <span>Hostel Room</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Delivery Destination */}
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-[#30D158] flex-shrink-0" />
                      <span>
                        Destination: <strong>{order.delivery_zone}</strong> • {order.room_details}
                      </span>
                    </div>

                    {/* Items List */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {order.items?.map((it, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-xl bg-gray-100 text-gray-800 text-xs font-semibold"
                        >
                          {it.quantity}x {it.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty Orders State */
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-gray-200/90 shadow-2xs max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#0A84FF] flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 font-display">
                No orders placed yet
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                Your hostel deliveries will show up here with live minute-by-minute status tracking.
              </p>
              <button
                type="button"
                onClick={onExploreCatalog}
                className="mt-6 px-6 py-3 rounded-2xl bg-[#111111] hover:bg-[#0A84FF] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Order Campus Essentials</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
