import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  FileText,
  History,
  X,
  Send,
  Radio,
  MessageCircle,
  TrendingUp,
  Wallet,
  CreditCard,
} from 'lucide-react';
import {
  fetchOrders,
  updateOrderStatus,
  fetchOrderStatusHistory,
  subscribeToOrders,
} from '../../lib/supabase';
import { AdminOrder, OrderStatus, OrderStatusHistory } from '../../types';
import { playOrderAlertChime } from '../../utils/audioAlert';

interface OrderManagementProps {
  realtimeEventCount?: number;
  onOpenLiveKitchen?: () => void;
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
  realtimeEventCount = 0,
  onOpenLiveKitchen,
}) => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Pagination State for Instant Admin Rendering
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  // Status History Modal
  const [selectedOrderForHistory, setSelectedOrderForHistory] = useState<AdminOrder | null>(null);
  const [historyLogs, setHistoryLogs] = useState<OrderStatusHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Status Transition Custom Note Modal
  const [transitionTarget, setTransitionTarget] = useState<{
    orderId: string;
    newStatus: OrderStatus;
  } | null>(null);
  const [transitionNotes, setTransitionNotes] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();

    // Supabase Realtime subscription: handles INSERT and UPDATE events
    const unsubscribe = subscribeToOrders(
      (newOrder: AdminOrder) => {
        // Prepend new order and play chime
        setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
        playOrderAlertChime();
      },
      (updatedOrder: AdminOrder) => {
        // Immediately update local state so card status badge changes without requiring page refresh
        setOrders((prev) =>
          prev.map((o) =>
            o.id === updatedOrder.id ? { ...o, ...updatedOrder, status: updatedOrder.status } : o
          )
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, [realtimeEventCount]);

  const handleQuickAdvance = async (order: AdminOrder, nextStatus: OrderStatus) => {
    setUpdatingId(order.id);
    // Optimistically update card badge immediately
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o))
    );
    try {
      const updated = await updateOrderStatus(
        order.id,
        nextStatus,
        `Quick transition to ${nextStatus} by Campus Admin`
      );
      if (!updated) {
        // Revert on error
        await loadOrders();
      }
    } catch (e) {
      console.error(e);
      await loadOrders();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmTransitionWithNote = async () => {
    if (!transitionTarget) return;
    const { orderId, newStatus } = transitionTarget;
    setUpdatingId(orderId);
    // Optimistically update card badge immediately
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    try {
      const updated = await updateOrderStatus(
        orderId,
        newStatus,
        transitionNotes.trim() || `Status updated to ${newStatus}`
      );
      setTransitionTarget(null);
      setTransitionNotes('');
      if (!updated) {
        await loadOrders();
      }
    } catch (e) {
      console.error(e);
      await loadOrders();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOpenHistory = async (order: AdminOrder) => {
    setSelectedOrderForHistory(order);
    setLoadingHistory(true);
    try {
      const history = await fetchOrderStatusHistory(order.id);
      setHistoryLogs(history);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'Pending':
        return 'Confirmed';
      case 'Confirmed':
        return 'Preparing';
      case 'Preparing':
        return 'Ready';
      case 'Ready':
        return 'Out for Delivery';
      case 'Out for Delivery':
        return 'Delivered';
      default:
        return null;
    }
  };

  const getNextStatusLabel = (next: OrderStatus): string => {
    switch (next) {
      case 'Confirmed':
        return 'Confirm Order';
      case 'Preparing':
        return 'Start Packing';
      case 'Ready':
        return 'Mark Ready';
      case 'Out for Delivery':
        return 'Dispatch Runner';
      case 'Delivered':
        return 'Mark Delivered';
      default:
        return next;
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Preparing':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Ready':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Out for Delivery':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Reset pagination on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Memoize financial & operational metrics (zero lagging or freeze on state updates)
  const metrics = useMemo(() => {
    const deliveredOrders = orders.filter(
      (o) => o.status === 'Delivered' || (o.status as string)?.toLowerCase() === 'delivered'
    );

    const totalRevenue = deliveredOrders.reduce(
      (sum, o) => sum + (Number(o.total_amount) || 0),
      0
    );

    const cashRevenue = deliveredOrders
      .filter((o) => {
        const pm = (o.payment_method || 'COD').toUpperCase();
        return pm === 'COD' || pm.includes('CASH');
      })
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const onlineRevenue = deliveredOrders
      .filter((o) => {
        const pm = (o.payment_method || '').toUpperCase();
        return pm !== '' && pm !== 'COD' && !pm.includes('CASH');
      })
      .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(
      (o) => o.status === 'Pending' || (o.status as string)?.toLowerCase() === 'pending'
    ).length;
    const outForDeliveryOrders = orders.filter(
      (o) => o.status === 'Out for Delivery' || (o.status as string)?.toLowerCase() === 'out for delivery'
    ).length;
    const deliveredCount = deliveredOrders.length;

    return {
      totalRevenue,
      cashRevenue,
      onlineRevenue,
      totalOrders,
      pendingOrders,
      outForDeliveryOrders,
      deliveredCount,
    };
  }, [orders]);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.order_number && o.order_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.delivery_zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.room_details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.delivery_address?.fullName && o.delivery_address.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.delivery_address?.phone && o.delivery_address.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.delivery_address?.area && o.delivery_address.area.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.delivery_address?.roomNo && o.delivery_address.roomNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.delivery_address?.notes && o.delivery_address.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ? true : o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage, ITEMS_PER_PAGE]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-display tracking-tight">
              Order Fulfillment Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              'orders' & 'order_status_history'
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Realtime order pipeline: <span className="font-semibold text-gray-700">Pending ➔ Confirmed ➔ Preparing ➔ Ready ➔ Out for Delivery ➔ Delivered</span>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onOpenLiveKitchen && (
            <button
              type="button"
              onClick={onOpenLiveKitchen}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors border border-red-200"
            >
              <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />
              Live Kitchen Feed
            </button>
          )}
          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Orders
          </button>
        </div>
      </div>

      {/* Financial & Operations Analytics - Obsidian Dark Glowing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Revenue */}
        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.08)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Total Revenue
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
            ₹{metrics.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-gray-400 mt-1 flex items-center justify-between">
            <span>Completed & Delivered</span>
            <span className="text-emerald-400 font-bold">{metrics.deliveredCount} orders</span>
          </div>
        </div>

        {/* Cash / COD Total */}
        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Cash Revenue (COD)
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
            ₹{metrics.cashRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-gray-400 mt-1 flex items-center justify-between">
            <span>Doorstep Cash / COD</span>
            <span className="text-amber-400 font-bold">
              {metrics.totalRevenue > 0
                ? `${Math.round((metrics.cashRevenue / metrics.totalRevenue) * 100)}%`
                : '100%'}
            </span>
          </div>
        </div>

        {/* Online / Digital Revenue */}
        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.08)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Online / Digital
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
            ₹{metrics.onlineRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-gray-400 mt-1 flex items-center justify-between">
            <span>Prepaid / UPI Orders</span>
            <span className="text-blue-400 font-bold">
              {metrics.totalRevenue > 0
                ? `${Math.round((metrics.onlineRevenue / metrics.totalRevenue) * 100)}%`
                : '0%'}
            </span>
          </div>
        </div>

        {/* Dispatch Summary */}
        <div className="p-4 rounded-2xl bg-[#0B0F19] border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.08)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              Dispatch Summary
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-1 text-xs">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
              <span className="text-gray-400 text-[10px] font-bold">Total Orders</span>
              <span className="text-white font-black">{metrics.totalOrders}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <span className="text-amber-400 text-[10px] font-bold">Pending</span>
              <span className="text-amber-300 font-black">{metrics.pendingOrders}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-between">
              <span className="text-sky-400 text-[10px] font-bold">Out for Del.</span>
              <span className="text-sky-300 font-black">{metrics.outForDeliveryOrders}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <span className="text-emerald-400 text-[10px] font-bold">Delivered</span>
              <span className="text-emerald-300 font-black">{metrics.deliveredCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, student name, hostel room..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:bg-white"
          />
        </div>

        <div className="w-full md:w-auto flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
          >
            <option value="all">All Order Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready">Ready</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Grid / Cards */}
      <div className="space-y-3.5">
        {paginatedOrders.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 text-gray-400 text-xs">
            No campus orders found matching your criteria.
          </div>
        ) : (
          paginatedOrders.map((order, idx) => {
            const next = getNextStatus(order.status);
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id ? `${order.id}-${idx}` : `admin-ord-${idx}`}
                className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs hover:border-gray-300 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  {/* Order header info */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs font-black text-white bg-[#111111] px-2.5 py-1 rounded-lg">
                      {order.order_number || order.id}
                    </span>
                    <span
                      className={`px-3 py-0.5 rounded-full border text-xs font-bold ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Actions & Next Status Progression */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Runner Status Switching: [Received] -> [Dispatched] -> [Delivered] */}
                    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleQuickAdvance(order, 'Confirmed')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                          order.status === 'Confirmed' || order.status === 'Pending'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'hover:bg-white text-gray-700 hover:text-blue-700'
                        }`}
                        title="Mark as Received"
                      >
                        Received
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleQuickAdvance(order, 'Out for Delivery')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                          order.status === 'Out for Delivery'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'hover:bg-white text-gray-700 hover:text-amber-700'
                        }`}
                        title="Mark as Dispatched (Runner on way)"
                      >
                        Dispatched
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleQuickAdvance(order, 'Delivered')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                          order.status === 'Delivered'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'hover:bg-white text-gray-700 hover:text-emerald-700'
                        }`}
                        title="Mark as Delivered"
                      >
                        Delivered
                      </button>
                    </div>

                    {/* View Status Audit History */}
                    <button
                      type="button"
                      onClick={() => handleOpenHistory(order)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                      title="View audit trail in order_status_history"
                    >
                      <History className="w-3.5 h-3.5" />
                      History
                    </button>

                    {/* Quick advance button */}
                    {next && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleQuickAdvance(order, next)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0A84FF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                      >
                        <span>{getNextStatusLabel(next)}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Custom Status Transition dropdown */}
                    <select
                      value={order.status}
                      onChange={(e) => {
                        const val = e.target.value as OrderStatus;
                        if (val !== order.status) {
                          setTransitionTarget({ orderId: order.id, newStatus: val });
                          setTransitionNotes('');
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Ready">Ready</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Body Details: Customer & Delivery & Items */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
                  {/* order.delivery_address direct JSON object format me milta hai */}
                  <div>
                    <p className="font-bold text-gray-900">{order.delivery_address?.fullName || order.customer_name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        <span>WhatsApp: {order.customer_phone || order.delivery_address?.phone || 'Verified'}</span>
                      </span>
                    </div>
                    {(order.customer_phone || order.delivery_address?.phone) && (
                      <a
                        href={`https://wa.me/91${String(order.customer_phone || order.delivery_address?.phone || '').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold hover:underline mt-1"
                      >
                        Chat on WhatsApp →
                      </a>
                    )}
                    <p className="text-neutral-700 mt-1">
                      📍 {order.delivery_address?.area || order.delivery_zone}, {order.delivery_address?.roomNo || order.room_details}
                    </p>
                    {order.delivery_address?.notes && (
                      <p className="text-xs text-neutral-500 mt-1 italic">Note: "{order.delivery_address?.notes}"</p>
                    )}
                  </div>

                  {/* Items list with resilient metadata fallback */}
                  <div className="md:col-span-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      {(() => {
                        const displayItems =
                          order.items && order.items.length > 0
                            ? order.items
                            : (order as any).metadata?.items || (order as any).items_summary || [];
                        return (
                          <>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                              Order Items ({displayItems.length})
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {displayItems.map((item: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200/80 text-[11px] font-medium text-gray-800"
                                >
                                  <span className="font-bold text-[#0A84FF]">{item.quantity}x</span>
                                  <span>{item.name || item.title}</span>
                                  <span className="text-gray-400 font-mono">₹{(item.price || item.unit_price || 0) * (item.quantity || 1)}</span>
                                </span>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
                      <span className="text-[11px] text-gray-500 font-medium">
                        Payment: <strong className="text-gray-800">{order.payment_method || 'COD'}</strong>
                      </span>
                      <div className="text-sm font-black text-gray-900 font-display">
                        Total: ₹{order.total_amount}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls - Lightweight, fast pagination */}
      {filteredOrders.length > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-500 font-medium">
            Showing <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
            <span className="font-bold text-gray-900">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}
            </span>{' '}
            of <span className="font-bold text-gray-900">{filteredOrders.length}</span> orders
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  totalPages > 7 &&
                  page !== 1 &&
                  page !== totalPages &&
                  Math.abs(page - currentPage) > 1
                ) {
                  if (page === 2 || page === totalPages - 1) {
                    return (
                      <span key={page} className="px-1 text-xs text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                      currentPage === page
                        ? 'bg-[#0A84FF] text-white shadow-xs'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Audit History Drawer / Modal */}
      {selectedOrderForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-gray-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-black text-gray-900 font-display text-base">
                  Audit History: {selectedOrderForHistory.order_number || selectedOrderForHistory.id}
                </h3>
                <p className="text-[11px] text-gray-500">
                  Targeting Supabase <code className="text-gray-800 font-bold">'order_status_history'</code> table
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForHistory(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* order.delivery_address direct JSON object format me milta hai */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs">
              <p className="font-bold text-neutral-900">{selectedOrderForHistory.delivery_address?.fullName || selectedOrderForHistory.customer_name}</p>
              <p className="text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp: {selectedOrderForHistory.delivery_address?.phone || selectedOrderForHistory.customer_phone || 'Verified'}</span>
              </p>
              <p className="text-neutral-700 mt-1">
                📍 {selectedOrderForHistory.delivery_address?.area || selectedOrderForHistory.delivery_zone}, {selectedOrderForHistory.delivery_address?.roomNo || selectedOrderForHistory.room_details}
              </p>
              {selectedOrderForHistory.delivery_address?.notes && (
                <p className="text-xs text-neutral-500 mt-1 italic">Note: "{selectedOrderForHistory.delivery_address?.notes}"</p>
              )}
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {loadingHistory ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  Loading status timeline...
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No status transitions logged for this order yet.
                </div>
              ) : (
                historyLogs.map((h, i) => (
                  <div key={h.id || i} className="flex items-start gap-3 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0A84FF] mt-1.5 shrink-0"></div>
                    <div className="flex-1 p-3 rounded-xl bg-gray-50 border border-gray-200/70">
                      <div className="flex items-center justify-between font-bold text-gray-900 mb-0.5">
                        <span className="font-semibold text-gray-800">{h.status}</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          {new Date(h.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-gray-600 text-[11px]">{h.notes || 'Status changed'}</div>
                      <div className="text-[10px] text-gray-400 mt-1">By: {h.created_by || 'Admin / Staff'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrderForHistory(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transition Note Modal */}
      {transitionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-gray-200 shadow-2xl space-y-4">
            <h3 className="font-black text-gray-900 font-display text-base">
              Update Order Status to "{transitionTarget.newStatus}"
            </h3>
            <p className="text-xs text-gray-500">
              Provide an optional note to record into the <code className="text-gray-800 font-bold">'order_status_history'</code> table.
            </p>

            <textarea
              rows={3}
              value={transitionNotes}
              onChange={(e) => setTransitionNotes(e.target.value)}
              placeholder="e.g. Handed to hostel runner, or payment confirmed via UPI"
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransitionTarget(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTransitionWithNote}
                className="px-4 py-2 rounded-xl bg-[#0A84FF] hover:bg-blue-600 text-white text-xs font-bold"
              >
                Confirm Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
