import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Package,
  Clock,
  MapPin,
  CheckCircle2,
  CookingPot,
  Bike,
  Search,
  User,
  Phone,
  Building,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { fetchOrders } from '../lib/supabase';
import { AdminOrder } from '../types';

interface CustomerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStoreCatalog?: () => void;
}

export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({
  isOpen,
  onClose,
  onOpenStoreCatalog,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('infinity_customer_profile');
      return saved
        ? JSON.parse(saved)
        : {
            fullName: 'Aarav Sharma',
            phone: '+91 98765 43210',
            hostel: 'Boys Hostel — Block B',
            roomNo: 'Room 304, 3rd Floor',
            notes: 'Leave at reception if in lecture',
          };
    } catch {
      return {
        fullName: 'Aarav Sharma',
        phone: '+91 98765 43210',
        hostel: 'Boys Hostel — Block B',
        roomNo: 'Room 304, 3rd Floor',
        notes: '',
      };
    }
  });
  const [savedProfileSuccess, setSavedProfileSuccess] = useState(false);

  const fetchCustomerOrders = async () => {
    setLoading(true);
    try {
      const allOrders = await fetchOrders();
      setOrders(allOrders);
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCustomerOrders();
    }
  }, [isOpen]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('infinity_customer_profile', JSON.stringify(profile));
      setSavedProfileSuccess(true);
      setTimeout(() => setSavedProfileSuccess(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  // Filter orders by search query (order ID, item name, or phone)
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesId = (o.order_number || o.id).toLowerCase().includes(q);
    const matchesName = (o.customer_name || '').toLowerCase().includes(q);
    const matchesPhone = (o.customer_phone || '').toLowerCase().includes(q);
    const matchesItem = o.items.some((it) => it.name.toLowerCase().includes(q));
    return matchesId || matchesName || matchesPhone || matchesItem;
  });

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'Pending':
        return 1;
      case 'Preparing':
        return 2;
      case 'Out for Delivery':
        return 3;
      case 'Delivered':
        return 4;
      default:
        return 1;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between bg-[#FAFAF7]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#111111] text-white flex items-center justify-center shadow-md">
                  <User className="w-5 h-5 text-[#0A84FF]" />
                </div>
                <div>
                  <h2 className="font-extrabold text-lg sm:text-xl text-gray-900 font-display flex items-center gap-2">
                    My Account & Orders
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Track live deliveries and manage your campus address
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-gray-200/70 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center px-6 pt-3 border-b border-gray-100 gap-4 bg-white">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
                  activeTab === 'orders' ? 'text-[#0A84FF]' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Orders & Tracking</span>
                {orders.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-extrabold">
                    {orders.length}
                  </span>
                )}
                {activeTab === 'orders' && (
                  <motion.div
                    layoutId="customerModalTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A84FF] rounded-full"
                  />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
                  activeTab === 'profile' ? 'text-[#0A84FF]' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Student Profile</span>
                {activeTab === 'profile' && (
                  <motion.div
                    layoutId="customerModalTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0A84FF] rounded-full"
                  />
                )}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  {/* Search Bar & Refresh */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by order ID or item..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 focus:border-[#0A84FF]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={fetchCustomerOrders}
                      disabled={loading}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                      title="Refresh live orders"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Orders List */}
                  {loading ? (
                    <div className="py-12 text-center text-gray-400 text-xs flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#0A84FF]" />
                      <span>Checking campus dispatch status...</span>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="py-12 text-center bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <h4 className="font-bold text-sm text-gray-800 mb-1">No Orders Found</h4>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                        You haven't placed an order yet or no orders match your search query.
                      </p>
                      {onOpenStoreCatalog && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onOpenStoreCatalog();
                          }}
                          className="px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-[#0A84FF] transition-colors cursor-pointer shadow-sm"
                        >
                          Browse Catalog & Order
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {filteredOrders.map((order) => {
                        const step = getStatusStep(order.status);
                        return (
                          <div
                            key={order.id}
                            className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:border-gray-300 transition-all"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-gray-900 font-mono">
                                    {order.order_number || order.id}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                      order.status === 'Delivered'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : order.status === 'Out for Delivery'
                                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                                        : order.status === 'Preparing'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}
                                  >
                                    {order.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {new Date(order.created_at).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                    {' • '}
                                    {new Date(order.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="font-extrabold text-sm text-gray-900">
                                  ₹{order.total_amount}
                                </div>
                                <div className="text-[10px] text-gray-400 font-medium">
                                  {order.payment_method}
                                </div>
                              </div>
                            </div>

                            {/* 4-Step Visual Progress Bar */}
                            <div className="py-3">
                              <div className="grid grid-cols-4 gap-1 relative">
                                <div className="flex flex-col items-center text-center">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                                      step >= 1
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-700">
                                    Placed
                                  </span>
                                </div>

                                <div className="flex flex-col items-center text-center">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                                      step >= 2
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                                  >
                                    <CookingPot className="w-4 h-4" />
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-700">
                                    Preparing
                                  </span>
                                </div>

                                <div className="flex flex-col items-center text-center">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                                      step >= 3
                                        ? 'bg-[#0A84FF] text-white animate-bounce'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                                  >
                                    <Bike className="w-4 h-4" />
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-700">
                                    On Route
                                  </span>
                                </div>

                                <div className="flex flex-col items-center text-center">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all ${
                                      step >= 4
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-700">
                                    Delivered
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Items & Delivery Address */}
                            <div className="pt-2 text-xs text-gray-600 space-y-1.5 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                              <div className="flex items-start gap-1.5 text-gray-700">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                <span>
                                  {order.delivery_zone} • {order.room_details}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {order.items.map((it, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded-md bg-white border border-gray-200/80 text-[11px] font-medium text-gray-800"
                                  >
                                    {it.quantity}x {it.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-blue-900">
                        Campus Delivery Profile
                      </h4>
                      <p className="text-[11px] text-blue-700">
                        Saved details automatically fill your hostel checkout for 10-minute delivery.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 focus:border-[#0A84FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Phone Number (for Delivery Delivery Agent)
                    </label>
                    <input
                      type="tel"
                      required
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 focus:border-[#0A84FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Hostel / Campus Building
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.hostel}
                      onChange={(e) => setProfile({ ...profile, hostel: e.target.value })}
                      placeholder="e.g. Boys Hostel — Block B"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 focus:border-[#0A84FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Room No. & Floor
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.roomNo}
                      onChange={(e) => setProfile({ ...profile, roomNo: e.target.value })}
                      placeholder="e.g. Room 304, 3rd Floor"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 focus:border-[#0A84FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Delivery Instruction Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={profile.notes}
                      onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
                      placeholder="e.g. Call once outside security gate or leave at reception"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 focus:border-[#0A84FF]"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-[#0A84FF] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      Save Profile
                    </button>

                    {savedProfileSuccess && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-pulse">
                        <CheckCircle2 className="w-4 h-4" /> Profile Updated!
                      </span>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-[#FAFAF7] flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Bike className="w-4 h-4 text-[#30D158]" />
                Average hostel delivery: <strong>10–15 mins</strong>
              </span>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CustomerOrdersModal;
