import React, { useEffect, useState, useRef } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  CheckCircle2,
  RefreshCw,
  Search,
  CookingPot,
  Bike,
  PackageCheck,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { playOrderAlertChime } from '../utils/audioAlert';

export type LiveOrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface LiveOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_zone: string;
  room_details: string;
  items: Array<{
    id?: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total_amount: number;
  status: LiveOrderStatus;
  payment_method: string;
  created_at: string;
  notes?: string;
}

export const LiveOrdersManager: React.FC = () => {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [lastAlertTime, setLastAlertTime] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Audio element fallback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Trigger sound chime
  const playAlert = () => {
    if (!soundEnabled) return;
    playOrderAlertChime();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    setLastAlertTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  // 1. Fetch initial orders
  const fetchActiveOrders = async () => {
    setLoading(true);
    try {
      // First try Supabase table
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data && data.length > 0) {
        const mapped: LiveOrder[] = data.map((o: any) => ({
          id: o.id,
          order_number: o.order_number || o.id,
          customer_name: o.customer_name || o.delivery_address?.fullName || 'Campus Student',
          customer_phone: o.customer_phone || o.delivery_address?.phone || '',
          delivery_zone: o.delivery_zone || o.delivery_address?.area || 'Campus Hostels',
          room_details: o.room_details || o.delivery_address?.roomNo || 'Room 101',
          items: Array.isArray(o.items)
            ? o.items.map((it: any) => ({
                id: it.id,
                name: it.name || it.product_name_snapshot || 'Campus Snack',
                quantity: it.quantity || 1,
                price: it.price || it.subtotal || 0,
              }))
            : [],
          total_amount: Number(o.total_amount || o.total || 0),
          status: normalizeStatus(o.status),
          payment_method: o.payment_method || 'Cash on Delivery',
          created_at: o.created_at || new Date().toISOString(),
          notes: o.notes || o.delivery_address?.notes,
        }));
        setOrders(mapped);
      } else {
        // Fallback to cached store orders
        const { fetchOrders } = await import('../lib/supabase');
        const fallbackOrders = await fetchOrders();
        setOrders(
          fallbackOrders.map((o: any) => ({
            id: o.id,
            order_number: o.order_number || o.id,
            customer_name: o.customer_name || o.delivery_address?.fullName || 'Campus Student',
            customer_phone: o.customer_phone || o.delivery_address?.phone || '9876543210',
            delivery_zone: o.delivery_zone || o.delivery_address?.area || 'Campus Hostels',
            room_details: o.room_details || o.delivery_address?.roomNo || 'Room 304',
            items: o.items || [
              { name: 'Maggi 2-Minute Noodles Masala', quantity: 2, price: 28 },
              { name: 'Amul Taaza Homogenised Milk', quantity: 1, price: 34 },
            ],
            total_amount: o.total_amount || 62,
            status: normalizeStatus(o.status),
            payment_method: o.payment_method || 'UPI / QR at Doorstep',
            created_at: o.created_at || new Date().toISOString(),
            notes: o.delivery_address?.notes,
          }))
        );
      }
    } catch (err) {
      console.warn('Orders fetch note:', err);
    } finally {
      setLoading(false);
    }
  };

  const normalizeStatus = (raw: string): LiveOrderStatus => {
    const s = String(raw || '').toLowerCase().trim();
    if (s === 'confirmed') return 'Confirmed';
    if (s === 'preparing') return 'Preparing';
    if (s === 'ready') return 'Ready';
    if (s === 'out for delivery' || s === 'out_for_delivery') return 'Out for Delivery';
    if (s === 'delivered') return 'Delivered';
    if (s === 'cancelled') return 'Cancelled';
    return 'Pending';
  };

  useEffect(() => {
    fetchActiveOrders();

    // 2. Listen for incoming orders in Realtime via Supabase channel (INSERT and UPDATE)
    const channel = supabase
      .channel('kitchen-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload: any) => {
          const newRow = payload.new;
          if (!newRow || !newRow.id) return;
          const mappedOrder: LiveOrder = {
            id: newRow.id,
            order_number: newRow.order_number || newRow.id,
            customer_name: newRow.customer_name || newRow.delivery_address?.fullName || 'Campus Student',
            customer_phone: newRow.customer_phone || newRow.delivery_address?.phone || '',
            delivery_zone: newRow.delivery_zone || newRow.delivery_address?.area || 'Campus Hostels',
            room_details: newRow.room_details || newRow.delivery_address?.roomNo || '',
            items: Array.isArray(newRow.items) ? newRow.items : [],
            total_amount: Number(newRow.total_amount || newRow.total || 0),
            status: normalizeStatus(newRow.status),
            payment_method: newRow.payment_method || 'Cash on Delivery',
            created_at: newRow.created_at || new Date().toISOString(),
            notes: newRow.notes || newRow.delivery_address?.notes,
          };

          // On INSERT events, prepend the new order and trigger the audio alert
          setOrders((prev) => [mappedOrder, ...prev.filter((o) => o.id !== mappedOrder.id)]);
          playAlert();
          setActionNotice(`🔔 New Order #${mappedOrder.order_number} received!`);
          setTimeout(() => setActionNotice(null), 5000);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload: any) => {
          const updated = payload.new;
          if (!updated || !updated.id) return;
          const normalized = normalizeStatus(updated.status);

          // On UPDATE events, immediately update the local state so the card status badge changes without requiring a page refresh
          setOrders((prev) =>
            prev.map((o) =>
              o.id === updated.id
                ? {
                    ...o,
                    status: normalized,
                    delivery_zone: updated.delivery_zone || o.delivery_zone,
                    room_details: updated.room_details || o.room_details,
                    customer_name: updated.customer_name || o.customer_name,
                    customer_phone: updated.customer_phone || o.customer_phone,
                    total_amount: Number(updated.total_amount || updated.total || o.total_amount),
                    items: Array.isArray(updated.items) ? updated.items : o.items,
                  }
                : o
            )
          );
          setActionNotice(`⚡ Order status updated to "${normalized}"`);
          setTimeout(() => setActionNotice(null), 3000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled]);

  // 3. Status Advancement Handler using standard Supabase update call & exact error alert
  const handleAdvanceStatus = async (orderId: string, nextStatus: LiveOrderStatus) => {
    const prevOrders = [...orders];

    // Optimistic UI update so card status badge changes immediately
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: nextStatus } : ord))
    );

    const { error } = await supabase
      .from('orders')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      alert(error.message);
      console.error('Failed to update order status:', error);
      // Revert optimistic update
      setOrders(prevOrders);
      return;
    }

    // Also log to order_status_history
    try {
      await supabase.from('order_status_history').insert([
        {
          id: `hist-${Date.now()}`,
          order_id: orderId,
          status: nextStatus,
          notes: `Advanced to ${nextStatus} by dispatch operator`,
          created_by: 'Kitchen Operator',
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.warn('Status history note:', e);
    }

    // Keep local fallback store in sync
    try {
      const saved = localStorage.getItem('infinity_admin_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        const updated = parsed.map((o: any) =>
          o.id === orderId ? { ...o, status: nextStatus, updated_at: new Date().toISOString() } : o
        );
        localStorage.setItem('infinity_admin_orders', JSON.stringify(updated));
      }
    } catch {
      // Handled
    }

    setActionNotice(`Order #${orderId.slice(0, 8)} updated to "${nextStatus}"`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  // Helper for delivery area badges
  const getDeliveryZoneBadge = (zone: string) => {
    const z = (zone || '').toLowerCase();
    if (z.includes('fatak')) {
      return {
        label: 'Fatak Outer Gate',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        dot: 'bg-purple-600',
      };
    }
    if (z.includes('hostel') || z.includes('boys') || z.includes('girls')) {
      return {
        label: zone || 'Campus Hostels',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        dot: 'bg-blue-600',
      };
    }
    if (z.includes('faculty') || z.includes('quarter') || z.includes('staff')) {
      return {
        label: zone || 'Faculty Quarters',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-600',
      };
    }
    if (z.includes('upper') || z.includes('pg')) {
      return {
        label: zone || 'Upper PG Hostels',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        dot: 'bg-orange-600',
      };
    }
    return {
      label: zone || 'Campus Zone',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      dot: 'bg-gray-600',
    };
  };

  // Status Badge UI
  const getStatusBadge = (status: LiveOrderStatus) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            Pending
          </span>
        );
      case 'Confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Confirmed
          </span>
        );
      case 'Preparing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
            <CookingPot className="w-3.5 h-3.5 text-amber-700 animate-spin" />
            Preparing
          </span>
        );
      case 'Ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
            <PackageCheck className="w-3.5 h-3.5 text-indigo-600" />
            Ready
          </span>
        );
      case 'Out for Delivery':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300">
            <Bike className="w-3.5 h-3.5 text-sky-600" />
            Out for Delivery
          </span>
        );
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            Delivered
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  // Card border highlighting based on status
  const getCardBorder = (status: LiveOrderStatus) => {
    switch (status) {
      case 'Pending':
        return 'border-red-400 ring-2 ring-red-100/80 shadow-md shadow-red-500/10';
      case 'Confirmed':
        return 'border-blue-400 ring-1 ring-blue-200/80 shadow-sm';
      case 'Preparing':
        return 'border-amber-300 ring-1 ring-amber-200/80 shadow-sm';
      case 'Ready':
        return 'border-indigo-400 ring-1 ring-indigo-200/80 shadow-sm';
      case 'Out for Delivery':
        return 'border-sky-400 ring-1 ring-sky-200/80 shadow-sm';
      case 'Delivered':
        return 'border-emerald-200 opacity-85';
      case 'Cancelled':
        return 'border-red-200 opacity-60';
      default:
        return 'border-gray-200';
    }
  };

  // Filters
  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      !searchQuery.trim() ||
      ord.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customer_phone.includes(searchQuery) ||
      ord.room_details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.items.some((it) => it.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || ord.status === statusFilter;
    const matchesZone =
      zoneFilter === 'all' || ord.delivery_zone.toLowerCase().includes(zoneFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesZone;
  });

  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const preparingCount = orders.filter((o) => o.status === 'Preparing').length;
  const outCount = orders.filter((o) => o.status === 'Out for Delivery').length;
  const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;

  return (
    <div className="space-y-6">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
        preload="auto"
      />

      {/* Action Notice Bar */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-[#0A84FF] text-white text-xs font-bold flex items-center justify-between shadow-lg shadow-[#0A84FF]/20 animate-fade-in">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-white/80 hover:text-white text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-display flex items-center gap-2">
              <span>Live Kitchen & Dispatch</span>
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
              Realtime Sync
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Incoming orders stream directly to this terminal. Audio alerts ring automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Audio Chime Test Button */}
          <button
            type="button"
            onClick={playAlert}
            className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs border border-gray-200/80"
            title="Play Audio Chime Test"
          >
            <Bell className="w-4 h-4 text-[#0A84FF]" />
            <span>Test Order Chime</span>
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              soundEnabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
            title={soundEnabled ? 'Mute incoming audio chime' : 'Enable audio chime'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span>Sound ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-red-600" />
                <span>Sound MUTED</span>
              </>
            )}
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={fetchActiveOrders}
            disabled={loading}
            className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0A84FF]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Tabs Bar (Pending, Preparing, Out for Delivery, Delivered) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Pending' ? 'all' : 'Pending')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Pending'
              ? 'bg-red-500 text-white border-red-600 shadow-md shadow-red-500/20'
              : 'bg-white hover:bg-red-50/40 border-gray-200 text-gray-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase ${statusFilter === 'Pending' ? 'text-red-100' : 'text-red-600'}`}>
              Pending Orders
            </span>
            <span className={`w-2.5 h-2.5 rounded-full ${statusFilter === 'Pending' ? 'bg-white' : 'bg-red-500'} ${pendingCount > 0 ? 'animate-ping' : ''}`} />
          </div>
          <div className="text-2xl font-black">{pendingCount}</div>
          <div className={`text-[11px] font-medium mt-0.5 ${statusFilter === 'Pending' ? 'text-red-100' : 'text-gray-400'}`}>
            Requires acceptance
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Preparing' ? 'all' : 'Preparing')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Preparing'
              ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20'
              : 'bg-white hover:bg-amber-50/40 border-gray-200 text-gray-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase ${statusFilter === 'Preparing' ? 'text-amber-100' : 'text-amber-700'}`}>
              In Kitchen
            </span>
            <CookingPot className={`w-4 h-4 ${statusFilter === 'Preparing' ? 'text-white' : 'text-amber-600'}`} />
          </div>
          <div className="text-2xl font-black">{preparingCount}</div>
          <div className={`text-[11px] font-medium mt-0.5 ${statusFilter === 'Preparing' ? 'text-amber-100' : 'text-gray-400'}`}>
            Packing in progress
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Out for Delivery' ? 'all' : 'Out for Delivery')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Out for Delivery'
              ? 'bg-[#0A84FF] text-white border-blue-600 shadow-md shadow-[#0A84FF]/20'
              : 'bg-white hover:bg-blue-50/40 border-gray-200 text-gray-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase ${statusFilter === 'Out for Delivery' ? 'text-blue-100' : 'text-blue-700'}`}>
              On Route
            </span>
            <Bike className={`w-4 h-4 ${statusFilter === 'Out for Delivery' ? 'text-white' : 'text-[#0A84FF]'}`} />
          </div>
          <div className="text-2xl font-black">{outCount}</div>
          <div className={`text-[11px] font-medium mt-0.5 ${statusFilter === 'Out for Delivery' ? 'text-blue-100' : 'text-gray-400'}`}>
            Campus riders dispatched
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'Delivered' ? 'all' : 'Delivered')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'Delivered'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-500/20'
              : 'bg-white hover:bg-emerald-50/40 border-gray-200 text-gray-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-bold uppercase ${statusFilter === 'Delivered' ? 'text-emerald-100' : 'text-emerald-700'}`}>
              Completed
            </span>
            <CheckCircle2 className={`w-4 h-4 ${statusFilter === 'Delivered' ? 'text-white' : 'text-emerald-600'}`} />
          </div>
          <div className="text-2xl font-black">{deliveredCount}</div>
          <div className={`text-[11px] font-medium mt-0.5 ${statusFilter === 'Delivered' ? 'text-emerald-100' : 'text-gray-400'}`}>
            Delivered to student
          </div>
        </button>
      </div>

      {/* Search & Area Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order #, student, room, or items..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]/20 focus:border-[#0A84FF]"
          />
        </div>

        {/* Campus Zone Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setZoneFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
              zoneFilter === 'all'
                ? 'bg-[#111111] text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            All Areas
          </button>
          <button
            type="button"
            onClick={() => setZoneFilter('Fatak')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
              zoneFilter === 'Fatak'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
            }`}
          >
            Fatak Gate
          </button>
          <button
            type="button"
            onClick={() => setZoneFilter('Hostel')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
              zoneFilter === 'Hostel'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
            }`}
          >
            Campus Hostels
          </button>
          <button
            type="button"
            onClick={() => setZoneFilter('Faculty')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
              zoneFilter === 'Faculty'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
          >
            Faculty Quarters
          </button>
          <button
            type="button"
            onClick={() => setZoneFilter('Upper PG')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
              zoneFilter === 'Upper PG'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200'
            }`}
          >
            Upper PG
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-gray-200">
          <RefreshCw className="w-8 h-8 animate-spin text-[#0A84FF]" />
          <p className="text-sm font-bold text-gray-700">Connecting to live dispatch stream...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-200 p-8">
          <PackageCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No Orders in this View</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Try switching filter tabs or clearing the search query. New student orders placed on the storefront appear instantly.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOrders.map((order) => {
            const zoneInfo = getDeliveryZoneBadge(order.delivery_zone);
            const cleanPhone = String(order.customer_phone || '').replace(/[^0-9]/g, '');

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl p-5 border transition-all flex flex-col justify-between ${getCardBorder(
                  order.status
                )}`}
              >
                <div>
                  {/* Card Header: Order # & Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
                    <div>
                      <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        ORDER ID
                      </div>
                      <div className="text-base font-black text-gray-900 font-mono tracking-tight">
                        {order.order_number || order.id}
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    {getStatusBadge(order.status)}
                  </div>

                  {/* Customer, Phone & Delivery Location */}
                  <div className="bg-gray-50/80 p-3.5 rounded-2xl border border-gray-100 mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-sm text-gray-900">
                        {order.customer_name}
                      </div>
                      <span className="text-[11px] font-bold text-gray-500">
                        {order.customer_phone || 'No phone'}
                      </span>
                    </div>

                    {/* Delivery Area Pill */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${zoneInfo.color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${zoneInfo.dot}`} />
                        {zoneInfo.label}
                      </span>
                      <span className="text-xs font-bold text-gray-700 bg-white px-2 py-0.5 rounded-lg border border-gray-200">
                        📍 {order.room_details}
                      </span>
                    </div>

                    {order.notes && (
                      <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200/70 italic">
                        <strong>Student Note:</strong> "{order.notes}"
                      </div>
                    )}

                    {/* Direct Call & WhatsApp Buttons */}
                    {cleanPhone && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href={`tel:${cleanPhone}`}
                          className="py-2 px-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5 text-blue-600" />
                          <span>Call Student</span>
                        </a>

                        <a
                          href={`https://wa.me/91${cleanPhone}?text=Hi%20${encodeURIComponent(
                            order.customer_name
                          )},%20your%20Infinity%20Store%20order%20%23${order.order_number}%20is%20ready%20for%20delivery!`}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp Student</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="mb-4">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Items to pack ({order.items.length})
                    </div>
                    <ul className="space-y-1.5 text-xs max-h-40 overflow-y-auto pr-1">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <li
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 border border-gray-100"
                          >
                            <span className="font-bold text-gray-800">
                              <span className="text-[#0A84FF] mr-1.5 font-black">
                                {item.quantity}x
                              </span>
                              {item.name}
                            </span>
                            <span className="font-bold text-gray-600">
                              ₹{item.price * item.quantity}
                            </span>
                          </li>
                        ))
                      ) : (
                        <li className="text-xs text-gray-400 italic">Hostel Quick Pack</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Card Footer: Amount, Payment & Status Advancement Actions */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Payment</div>
                      <div className="text-xs font-bold text-gray-700">
                        {order.payment_method}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Total</div>
                      <div className="text-lg font-black text-gray-900">
                        ₹{order.total_amount}
                      </div>
                    </div>
                  </div>

                  {/* Status Advancement Buttons */}
                  <div className="space-y-1.5">
                    {order.status === 'Pending' && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(order.id, 'Preparing')}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CookingPot className="w-4 h-4" />
                        <span>Accept & Cook</span>
                      </button>
                    )}

                    {order.status === 'Confirmed' && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(order.id, 'Preparing')}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CookingPot className="w-4 h-4" />
                        <span>Start Kitchen Preparing</span>
                      </button>
                    )}

                    {order.status === 'Preparing' && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(order.id, 'Out for Delivery')}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white font-black text-xs transition-all shadow-md shadow-[#0A84FF]/20 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Bike className="w-4 h-4" />
                        <span>Send Out for Delivery</span>
                      </button>
                    )}

                    {order.status === 'Ready' && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(order.id, 'Out for Delivery')}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white font-black text-xs transition-all shadow-md shadow-[#0A84FF]/20 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Bike className="w-4 h-4" />
                        <span>Send Out for Delivery</span>
                      </button>
                    )}

                    {order.status === 'Out for Delivery' && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(order.id, 'Delivered')}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Delivered</span>
                      </button>
                    )}

                    {order.status === 'Delivered' && (
                      <div className="w-full py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Fulfillment Completed</span>
                      </div>
                    )}

                    {order.status === 'Cancelled' && (
                      <div className="w-full py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold text-xs text-center flex items-center justify-center gap-1">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span>Order Cancelled</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiveOrdersManager;
