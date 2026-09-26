import React, { useState, useEffect } from 'react';
import {
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
  RefreshCw,
  Search,
  CheckCircle2,
  X,
  History,
  TrendingUp,
} from 'lucide-react';
import {
  fetchProducts,
  adjustInventoryStock,
  fetchInventoryTransactions,
  createProduct,
} from '../../lib/supabase';
import { AdminProduct, InventoryTransaction } from '../../types';

export const InventoryManagement: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'stock' | 'transactions'>('stock');

  // Adjust stock modal
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(20);
  const [adjustmentReason, setAdjustmentReason] = useState<
    'Restock' | 'Sale' | 'Damaged' | 'Audit Adjustment'
  >('Restock');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Add Product modal state
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'instant-food',
    price: 30,
    stock_count: 50,
    low_stock_threshold: 10,
    unit: '1 pack',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    description: '',
  });

  const loadInventory = async () => {
    setLoading(true);
    try {
      const [prods, txs] = await Promise.all([
        fetchProducts(),
        fetchInventoryTransactions(),
      ]);
      setProducts(prods);
      setTransactions(txs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleOpenAdjustModal = (product: AdminProduct) => {
    setSelectedProduct(product);
    setAdjustmentAmount(20);
    setAdjustmentReason('Restock');
    setAdjustmentNotes('');
  };

  const handleQuickRestock = async (product: AdminProduct, amount: number) => {
    try {
      await adjustInventoryStock(
        product.id,
        amount,
        'Restock',
        `Quick restock of +${amount} units via admin inventory`
      );
      setNotice(`Restocked +${amount} units for ${product.name}`);
      setTimeout(() => setNotice(null), 3500);
      await loadInventory();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setSubmitting(true);
    try {
      const finalAmount =
        adjustmentReason === 'Damaged'
          ? -Math.abs(adjustmentAmount)
          : adjustmentAmount;

      await adjustInventoryStock(
        selectedProduct.id,
        finalAmount,
        adjustmentReason,
        adjustmentNotes || `${adjustmentReason} adjustment`
      );

      setNotice(
        `Recorded ${finalAmount > 0 ? `+${finalAmount}` : finalAmount} units in 'inventory_transactions'.`
      );
      setTimeout(() => setNotice(null), 3500);

      setSelectedProduct(null);
      await loadInventory();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim()) return;

    setIsAddingProduct(true);
    try {
      await createProduct({
        name: newProduct.name.trim(),
        title: newProduct.name.trim(),
        category: newProduct.category,
        price: Number(newProduct.price),
        stock_count: Number(newProduct.stock_count),
        stock_quantity: Number(newProduct.stock_count),
        low_stock_threshold: Number(newProduct.low_stock_threshold),
        unit: newProduct.unit,
        image: newProduct.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
        image_url: newProduct.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
        description: newProduct.description,
        in_stock: Number(newProduct.stock_count) > 0,
      });

      setNotice(`Product "${newProduct.name}" added to catalog with ${newProduct.stock_count} units!`);
      setTimeout(() => setNotice(null), 4000);

      setIsAddProductModalOpen(false);
      setNewProduct({
        name: '',
        category: 'instant-food',
        price: 30,
        stock_count: 50,
        low_stock_threshold: 10,
        unit: '1 pack',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
        description: '',
      });

      await loadInventory();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingProduct(false);
    }
  };

  // Low stock products
  const lowStockItems = products.filter((p) => {
    const stock = p.stock_count ?? 0;
    const threshold = p.low_stock_threshold ?? 10;
    return stock <= threshold;
  });

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Notice */}
      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-display tracking-tight">
              Campus Stock & Inventory Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              'inventory_transactions' & 'low_stock_threshold'
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Automated alerts when stock drops below thresholds and real-time ledger tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsAddProductModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white text-xs font-bold transition-all shadow-md shadow-[#0A84FF]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>

          <button
            type="button"
            onClick={loadInventory}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Stock</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alert Center Banner */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300 shadow-2xs">
          <div className="flex items-center gap-2 font-bold text-amber-900 text-sm mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Active Low Stock Warnings ({lowStockItems.length} SKUs below threshold)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-white border border-amber-200 shadow-2xs flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-9 h-9 rounded-lg object-cover bg-gray-100 shrink-0"
                  />
                  <div className="overflow-hidden">
                    <div className="font-bold text-xs text-gray-900 truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-amber-700 font-semibold">
                      {item.stock_count} left (threshold: {item.low_stock_threshold})
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickRestock(item, 25)}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shrink-0 transition-colors shadow-2xs"
                >
                  +25 Stock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('stock')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'stock'
              ? 'border-[#0A84FF] text-[#0A84FF]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Stock Level Monitor ({products.length} SKUs)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'transactions'
              ? 'border-[#0A84FF] text-[#0A84FF]'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Inventory Transactions Ledger ({transactions.length})
        </button>
      </div>

      {activeTab === 'stock' ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="p-3.5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product inventory by name or category..."
              className="w-full text-xs text-gray-900 bg-transparent focus:outline-none"
            />
          </div>

          {/* Products Stock Table */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200/80 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Item & SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Alert Threshold</th>
                    <th className="py-3 px-4">Health</th>
                    <th className="py-3 px-4 text-right">Quick Restock / Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {filteredProducts.map((prod) => {
                    const stock = prod.stock_count ?? 0;
                    const threshold = prod.low_stock_threshold ?? 10;
                    const isLow = stock > 0 && stock <= threshold;
                    const isOut = stock === 0;

                    return (
                      <tr
                        key={prod.id}
                        className={`transition-colors ${
                          isOut
                            ? 'bg-red-50/70 hover:bg-red-50 border-l-4 border-l-red-500'
                            : isLow
                            ? 'bg-amber-50/60 hover:bg-amber-50 border-l-4 border-l-amber-500'
                            : 'hover:bg-gray-50/80'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-9 h-9 rounded-lg object-cover bg-gray-100 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-gray-900">{prod.name}</div>
                              <div className="text-[10px] text-blue-600 font-mono font-bold bg-blue-50 px-1.5 py-0.5 rounded w-fit mt-0.5">
                                SKU: {prod.sku || `INF-${prod.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}`}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 capitalize text-gray-600 font-medium">
                          {prod.category.replace('-', ' ')}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`font-mono font-black text-sm ${isOut ? 'text-red-700' : isLow ? 'text-amber-800' : 'text-gray-900'}`}>
                            {stock}
                          </span>
                          <span className="text-gray-400 text-[10px] ml-1">{prod.unit}</span>
                        </td>

                        <td className="py-3 px-4 font-mono text-gray-500">
                          ≤ {threshold} units
                        </td>

                        <td className="py-3 px-4">
                          {isOut ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-300 flex items-center gap-1 w-fit">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 w-fit animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              Low Stock Alert
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Healthy
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenAdjustModal(prod)}
                              className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-[#0A84FF] text-white font-bold text-[11px] transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
                              title="Open stock adjustment modal"
                            >
                              <span>Adjust Stock</span>
                              <span className="text-gray-300 font-mono text-[10px]">(+/-)</span>
                            </button>
                            <div className="flex items-center gap-1 border-l border-gray-200 pl-1.5 ml-0.5">
                              <button
                                type="button"
                                onClick={() => handleQuickRestock(prod, -1)}
                                disabled={stock <= 0}
                                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-700 font-black text-xs transition-colors disabled:opacity-30 cursor-pointer flex items-center justify-center border border-gray-200"
                                title="Decrease 1 unit"
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickRestock(prod, 1)}
                                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 font-black text-xs transition-colors cursor-pointer flex items-center justify-center border border-gray-200"
                                title="Increase 1 unit"
                              >
                                +1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickRestock(prod, 5)}
                                className="px-2 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] transition-colors cursor-pointer flex items-center justify-center border border-gray-200"
                                title="Restock +5 units"
                              >
                                +5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickRestock(prod, 25)}
                                className="px-2 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] transition-colors cursor-pointer flex items-center justify-center border border-gray-200"
                                title="Restock +25 units"
                              >
                                +25
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Inventory Transactions Ledger Table */
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">
                Audit Trail: 'inventory_transactions' Table
              </h2>
              <p className="text-[11px] text-gray-400">
                Every stock addition, sale deduction, or damage adjustment logged to Supabase.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200/80 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product ID / Name</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Stock Change</th>
                  <th className="py-3 px-4">Balance</th>
                  <th className="py-3 px-4">Audit Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No inventory transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isPositive = tx.change_amount > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                          {tx.id}
                        </td>

                        <td className="py-3 px-4 text-gray-500 text-[11px]">
                          {new Date(tx.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">
                            {tx.product_name || tx.product_id}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">{tx.product_id}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.reason === 'Restock'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : tx.reason === 'Sale'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {tx.reason}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`font-mono font-black text-xs flex items-center gap-0.5 ${
                              isPositive ? 'text-emerald-600' : 'text-red-600'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                            {isPositive ? `+${tx.change_amount}` : tx.change_amount}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-gray-700">
                          {tx.previous_stock ?? '—'} ➔{' '}
                          <strong className="text-gray-900">{tx.new_stock ?? '—'}</strong>
                        </td>

                        <td className="py-3 px-4 text-gray-500 text-[11px] max-w-[200px] truncate">
                          {tx.notes || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-gray-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-black text-gray-900 font-display text-base">
                  Adjust Stock: {selectedProduct.name}
                </h3>
                <p className="text-[11px] text-gray-500">
                  Writes to <code className="text-gray-800 font-bold">'products'</code> & <code className="text-gray-800 font-bold">'inventory_transactions'</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">Adjustment Reason</label>
                <select
                  value={adjustmentReason}
                  onChange={(e) =>
                    setAdjustmentReason(
                      e.target.value as 'Restock' | 'Sale' | 'Damaged' | 'Audit Adjustment'
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                >
                  <option value="Restock">Restock (Add inventory from vendor)</option>
                  <option value="Audit Adjustment">Audit Adjustment (Count reconciliation)</option>
                  <option value="Damaged">Damaged / Waste (Write-off reduction)</option>
                  <option value="Sale">Sale (Direct counter transaction)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Quantity ({adjustmentReason === 'Damaged' ? 'Units to Deduct' : 'Units to Add'})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Current stock: {selectedProduct.stock_count} units. After change:{' '}
                  <strong>
                    {adjustmentReason === 'Damaged'
                      ? Math.max(0, (selectedProduct.stock_count ?? 0) - adjustmentAmount)
                      : (selectedProduct.stock_count ?? 0) + adjustmentAmount}{' '}
                    units
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Audit Ledger Notes</label>
                <textarea
                  rows={2}
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder="e.g. Vendor delivery invoice #4021 or damaged seal"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#111111] hover:bg-[#0A84FF] text-white font-bold transition-colors disabled:opacity-50 shadow-md cursor-pointer"
                >
                  {submitting ? 'Recording...' : 'Commit Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          ADD PRODUCT MODAL (Image URL, Title, Price, Category, Stock)
          ============================================================ */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Add New Product</h3>
                  <p className="text-xs text-gray-500">Add SKU to campus inventory catalog</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewProduct} className="space-y-4 text-xs">
              {/* Image Preview & URL */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">Product Image URL *</label>
                <div className="flex items-center gap-3">
                  <img
                    src={newProduct.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'}
                    alt="Preview"
                    className="w-14 h-14 rounded-xl object-cover bg-gray-100 border border-gray-200 shrink-0"
                  />
                  <input
                    type="url"
                    required
                    value={newProduct.image}
                    onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                  />
                </div>
              </div>

              {/* Title / Name */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">Product Title / Name *</label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Maggi 2-Minute Noodles Masala"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Price (₹ INR) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Category *</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                  >
                    <option value="instant-food">Instant Food & Noodles</option>
                    <option value="beverages">Beverages & Drinks</option>
                    <option value="snacks">Snacks & Munchies</option>
                    <option value="dairy">Dairy & Bakery</option>
                    <option value="stationery">Campus Stationery</option>
                    <option value="womens-care">Women's Care</option>
                    <option value="personal-care">Personal Care</option>
                  </select>
                </div>
              </div>

              {/* Stock Count & Threshold */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Initial Stock Count *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newProduct.stock_count}
                    onChange={(e) => setNewProduct({ ...newProduct, stock_count: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Low Stock Alert Threshold *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newProduct.low_stock_threshold}
                    onChange={(e) => setNewProduct({ ...newProduct, low_stock_threshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                  />
                </div>
              </div>

              {/* Unit & Description */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Unit / Packaging</label>
                  <input
                    type="text"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    placeholder="e.g. 70g pack, 250ml can"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Description</label>
                  <input
                    type="text"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Brief description"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingProduct}
                  className="px-5 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0070E0] text-white font-bold transition-colors disabled:opacity-50 shadow-md shadow-[#0A84FF]/25 cursor-pointer"
                >
                  {isAddingProduct ? 'Creating Product...' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
