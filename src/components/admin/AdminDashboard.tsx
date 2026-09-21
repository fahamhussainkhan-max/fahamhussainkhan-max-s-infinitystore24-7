import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Truck,
  Activity,
  Zap,
  Radio,
} from 'lucide-react';
import { fetchDashboardMetrics, seedSupabaseDemoData } from '../../lib/supabase';
import { AdminOrder, OrderStatus } from '../../types';

interface AdminDashboardProps {
  onNavigateToOrders: () => void;
  onNavigateToProducts: () => void;
  onNavigateToInventory: () => void;
  onNavigateToLiveOrders?: () => void;
  realtimeEventCount: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToOrders,
  onNavigateToProducts,
  onNavigateToInventory,
  onNavigateToLiveOrders,
  realtimeEventCount,
}) => {
  const [metrics, setMetrics] = useState({
    ordersCount: 0,
    totalRevenue: 0,
    activeOrdersCount: 0,
    productsCount: 0,
    lowStockCount: 0,
    profilesCount: 0,
    recentOrders: [] as AdminOrder[],
    isLiveSupabase: false,
  });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchDashboardMetrics();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [realtimeEventCount]);

  const handleSeedData = async () => {
    setSeeding(true);
    setSeedMessage(null);
    const res = await seedSupabaseDemoData();
    setSeedMessage(res.message);
    await loadData();
    setSeeding(false);
    setTimeout(() => setSeedMessage(null), 4000);
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

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-display tracking-tight">
              Campus Operations Hub
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Synced
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Aggregated telemetry from Supabase tables: <code className="text-gray-800 font-semibold">orders</code>, <code className="text-gray-800 font-semibold">products</code>, <code className="text-gray-800 font-semibold">profiles</code>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleSeedData}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111111] hover:bg-[#0A84FF] text-white text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-[#FFD60A]" />
            {seeding ? 'Seeding...' : 'Seed Supabase Data'}
          </button>
        </div>
      </div>

      {seedMessage && (
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center justify-between">
          <span>{seedMessage}</span>
          <button onClick={() => setSeedMessage(null)} className="text-blue-500 hover:text-blue-800 font-bold">×</button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 font-display">
            ₹{metrics.totalRevenue.toLocaleString()}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-emerald-600">
            <ArrowUpRight className="w-3 h-3" />
            <span>Realtime order sums</span>
          </div>
        </div>

        {/* Active Campus Orders */}
        <div
          onClick={onNavigateToOrders}
          className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 font-display">
            {metrics.activeOrdersCount}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-blue-600">
            <span>Pending & Dispatch</span>
          </div>
        </div>

        {/* Total Products */}
        <div
          onClick={onNavigateToProducts}
          className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs hover:border-gray-400 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Catalog SKUs</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 font-display">
            {metrics.productsCount}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-purple-600">
            <span>In 'products' table</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={onNavigateToInventory}
          className={`p-4 rounded-2xl border transition-all cursor-pointer group ${
            metrics.lowStockCount > 0
              ? 'bg-amber-50/50 border-amber-300 shadow-2xs hover:border-amber-400'
              : 'bg-white border-gray-200/90 shadow-2xs hover:border-gray-400'
          }`}
        >
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 font-display">
            {metrics.lowStockCount}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-amber-700">
            <span>≤ low_stock_threshold</span>
          </div>
        </div>

        {/* Campus Profiles / Students */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Campus Profiles</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 font-display">
            {metrics.profilesCount}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-indigo-600">
            <span>Hostel students active</span>
          </div>
        </div>
      </div>

      {/* Visual Aggregation & Status Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Workflow Stages */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#0A84FF]" />
              Campus Fulfillment Pipeline
            </h2>
            <div className="flex items-center gap-3">
              {onNavigateToLiveOrders && (
                <button
                  onClick={onNavigateToLiveOrders}
                  className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100"
                >
                  <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                  Live Kitchen →
                </button>
              )}
              <button
                onClick={onNavigateToOrders}
                className="text-xs font-bold text-[#0A84FF] hover:underline"
              >
                View All Orders →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {[
              { label: 'Pending', color: 'bg-amber-500', count: metrics.recentOrders.filter(o => o.status === 'Pending').length },
              { label: 'Confirmed', color: 'bg-blue-500', count: metrics.recentOrders.filter(o => o.status === 'Confirmed').length },
              { label: 'Preparing', color: 'bg-purple-500', count: metrics.recentOrders.filter(o => o.status === 'Preparing').length },
              { label: 'Ready', color: 'bg-indigo-500', count: metrics.recentOrders.filter(o => o.status === 'Ready').length },
              { label: 'In Transit', color: 'bg-sky-500', count: metrics.recentOrders.filter(o => o.status === 'Out for Delivery').length },
              { label: 'Delivered', color: 'bg-emerald-500', count: metrics.recentOrders.filter(o => o.status === 'Delivered').length },
            ].map((stage) => (
              <div
                key={stage.label}
                className="p-3 rounded-xl bg-gray-50 border border-gray-200/60 text-center"
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className={`w-2 h-2 rounded-full ${stage.color}`}></span>
                  <span className="text-[11px] font-semibold text-gray-600 truncate">{stage.label}</span>
                </div>
                <div className="text-lg font-black text-gray-900 font-display">
                  {stage.count}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Hourly Performance Bar Chart */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="text-xs font-bold text-gray-700 mb-3 flex items-center justify-between">
              <span>Campus Delivery Volume by Zone</span>
              <span className="text-[11px] text-gray-400 font-normal">Fastest: North Block (8m)</span>
            </div>
            <div className="space-y-2">
              {[
                { zone: 'Boys Hostel Block B & C', pct: 44, amount: '₹1,840' },
                { zone: 'Girls Hostel Block A & D', pct: 32, amount: '₹1,220' },
                { zone: 'Central Library & Reading Hall', pct: 16, amount: '₹680' },
                { zone: 'Engineering Tech Labs', pct: 8, amount: '₹340' },
              ].map((item) => (
                <div key={item.zone} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span className="truncate">{item.zone}</span>
                    <span className="text-gray-900 font-bold">{item.amount}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0A84FF]"
                      style={{ width: `${item.pct}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Realtime Telemetry Feed */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              Live Supabase Stream
            </h2>
            <span className="text-[10px] font-bold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
              Websocket Open
            </span>
          </div>

          <p className="text-xs text-gray-500 mb-4">
            Subscribed to <code className="text-gray-800 font-bold">public:orders</code> postgres changes. When any student places or updates an order, it flashes instantly below without refresh.
          </p>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-1">
            {metrics.recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                No orders registered yet. Click "Seed Supabase Data" to load sample campus records.
              </div>
            ) : (
              metrics.recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 text-xs hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between font-bold text-gray-900 mb-1">
                    <span className="font-mono text-[11px] text-[#0A84FF]">
                      {order.order_number || order.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-gray-600 font-medium">
                    {order.delivery_address?.fullName || order.customer_name} •{' '}
                    <span className="text-gray-400">
                      {order.delivery_address?.area || order.delivery_zone}
                      {order.delivery_address?.roomNo ? ` (${order.delivery_address.roomNo})` : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1.5 pt-1.5 border-t border-gray-200/50 font-semibold">
                    <span>{order.items.length} item(s)</span>
                    <span className="text-gray-900 font-bold">₹{order.total_amount}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
