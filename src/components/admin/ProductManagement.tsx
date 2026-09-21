import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  X,
  Package,
  Filter,
  RefreshCw,
} from 'lucide-react';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from '../../lib/supabase';
import { AdminProduct } from '../../types';

export const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    category: 'instant-food',
    price: 20,
    original_price: 25,
    stock_count: 50,
    low_stock_threshold: 12,
    unit: '1 pack',
    description: '',
    image: '',
    is_popular: false,
    is_late_night: false,
    is_flash_deal: false,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'instant-food',
      price: 30,
      original_price: 35,
      stock_count: 50,
      low_stock_threshold: 12,
      unit: '1 pack',
      description: '',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
      is_popular: false,
      is_late_night: false,
      is_flash_deal: false,
    });
    setImageFile(null);
    setImagePreview('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: AdminProduct) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      category: prod.category,
      price: prod.price,
      original_price: prod.original_price || prod.price,
      stock_count: prod.stock_count,
      low_stock_threshold: prod.low_stock_threshold || 10,
      unit: prod.unit,
      description: prod.description || '',
      image: prod.image,
      is_popular: Boolean(prod.is_popular),
      is_late_night: Boolean(prod.is_late_night),
      is_flash_deal: Boolean(prod.is_flash_deal),
    });
    setImageFile(null);
    setImagePreview(prod.image);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotice('error', 'Please provide a product title');
      return;
    }

    setSubmitting(true);
    let finalImageUrl = formData.image;

    try {
      // If user uploaded a new image file, upload to 'product-images' bucket
      if (imageFile) {
        setUploadingImage(true);
        try {
          finalImageUrl = await uploadProductImage(imageFile);
        } catch (uploadErr) {
          console.warn('Storage upload note:', uploadErr);
        } finally {
          setUploadingImage(false);
        }
      }

      if (editingProduct) {
        // Update in Supabase
        await updateProduct(editingProduct.id, {
          name: formData.name,
          category: formData.category,
          price: Number(formData.price),
          original_price: Number(formData.original_price),
          stock_count: Number(formData.stock_count),
          low_stock_threshold: Number(formData.low_stock_threshold),
          unit: formData.unit,
          description: formData.description,
          image: finalImageUrl,
          in_stock: Number(formData.stock_count) > 0,
          is_popular: formData.is_popular,
          is_late_night: formData.is_late_night,
          is_flash_deal: formData.is_flash_deal,
        });
        showNotice('success', `Updated "${formData.name}" in products table.`);
      } else {
        // Insert new into Supabase
        await createProduct({
          name: formData.name,
          category: formData.category,
          price: Number(formData.price),
          original_price: Number(formData.original_price),
          stock_count: Number(formData.stock_count),
          low_stock_threshold: Number(formData.low_stock_threshold),
          unit: formData.unit,
          description: formData.description,
          image: finalImageUrl,
          in_stock: Number(formData.stock_count) > 0,
          is_popular: formData.is_popular,
          is_late_night: formData.is_late_night,
          is_flash_deal: formData.is_flash_deal,
        });
        showNotice('success', `Created new SKU "${formData.name}" in products table.`);
      }

      setIsModalOpen(false);
      await loadCatalog();
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteProduct(id);
      showNotice('success', `Deleted "${name}" from products table.`);
      setDeleteConfirmId(null);
      await loadCatalog();
    } catch (err: any) {
      showNotice('error', err?.message || 'Failed to delete product');
    }
  };

  // Filtered product items
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' ? true : p.category === categoryFilter;

    let matchesStock = true;
    if (stockFilter === 'in_stock') {
      matchesStock = (p.stock_count ?? 0) > (p.low_stock_threshold ?? 10);
    } else if (stockFilter === 'low_stock') {
      matchesStock =
        (p.stock_count ?? 0) > 0 &&
        (p.stock_count ?? 0) <= (p.low_stock_threshold ?? 10);
    } else if (stockFilter === 'out_of_stock') {
      matchesStock = (p.stock_count ?? 0) === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="space-y-6">
      {/* Action Notice */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between shadow-sm ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header controls & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 font-display tracking-tight">
              Product Catalog Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              'products' table
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Complete CRUD operations & image uploads targeting the <code className="text-gray-800 font-bold">'product-images'</code> storage bucket.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadCatalog}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111111] hover:bg-[#0A84FF] text-white text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, brand or category..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A84FF] focus:bg-white transition-all"
          />
        </div>

        {/* Category selector */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
          >
            <option value="all">All Categories</option>
            <option value="instant-food">Instant Food</option>
            <option value="drinks">Drinks & Beverages</option>
            <option value="snacks">Snacks & Munchies</option>
            <option value="stationery">Stationery & Study</option>
            <option value="personal-care">Personal Care</option>
            <option value="hostel-essentials">Hostel Essentials</option>
          </select>
        </div>

        {/* Stock Filter */}
        <div className="w-full md:w-auto">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
          >
            <option value="all">All Stock Levels</option>
            <option value="in_stock">Healthy Stock</option>
            <option value="low_stock">Low Stock (≤ threshold)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200/80 text-gray-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Item & SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Threshold</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    No products matched your criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const stock = prod.stock_count ?? 0;
                  const threshold = prod.low_stock_threshold ?? 10;
                  const isLow = stock > 0 && stock <= threshold;
                  const isOut = stock === 0;

                  return (
                    <tr key={prod.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-10 h-10 rounded-xl object-cover bg-gray-100 border border-gray-200/70"
                          />
                          <div>
                            <div className="font-bold text-gray-900 leading-tight">
                              {prod.name}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                              {prod.id} • {prod.unit}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-semibold text-[11px] capitalize">
                          {prod.category.replace('-', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">₹{prod.price}</div>
                        {prod.original_price && prod.original_price > prod.price && (
                          <div className="text-[10px] text-gray-400 line-through">
                            ₹{prod.original_price}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold font-mono text-gray-900">{stock}</span>
                        <span className="text-gray-400 text-[10px] ml-1">units</span>
                      </td>

                      <td className="py-3 px-4 text-gray-500 font-mono">
                        {threshold}
                      </td>

                      <td className="py-3 px-4">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            Low ({stock})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            In Stock
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-black transition-colors"
                            title="Edit product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {deleteConfirmId === prod.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDelete(prod.id, prod.name)}
                                className="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-700"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(prod.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white rounded-3xl p-6 border border-gray-200 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900 font-display">
                {editingProduct ? 'Edit Product SKU' : 'Create New Product'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Product Name */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kurkure Masala Munch (90g)"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                  >
                    <option value="instant-food">Instant Food</option>
                    <option value="drinks">Drinks & Beverages</option>
                    <option value="snacks">Snacks & Munchies</option>
                    <option value="stationery">Stationery & Study</option>
                    <option value="personal-care">Personal Care</option>
                    <option value="hostel-essentials">Hostel Essentials</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Unit / Pack Size</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g. 1 pack, 250ml"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                  />
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">MRP / Orig (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.original_price}
                    onChange={(e) =>
                      setFormData({ ...formData, original_price: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_count}
                    onChange={(e) =>
                      setFormData({ ...formData, stock_count: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Low Alert Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.low_stock_threshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        low_stock_threshold: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description for student storefront..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0A84FF]"
                />
              </div>

              {/* Supabase Storage Bucket Image Upload */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  Product Image (Supabase <code className="text-[#0A84FF]">'product-images'</code> bucket)
                </label>
                <div className="flex items-center gap-3">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-gray-200 bg-gray-50"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {imageFile ? 'Change File' : 'Upload to Supabase Bucket'}
                    </button>
                    <p className="text-[10px] text-gray-400">
                      {imageFile ? imageFile.name : 'PNG, JPG, or WEBP up to 5MB'}
                    </p>
                  </div>
                </div>

                {/* Direct Image URL input fallback */}
                <div className="mt-2">
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => {
                      setFormData({ ...formData, image: e.target.value });
                      setImagePreview(e.target.value);
                    }}
                    placeholder="Or paste direct image URL (https://...)"
                    className="w-full px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-[11px] text-gray-700"
                  />
                </div>
              </div>

              {/* Catalog Promotion Flags */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_popular}
                    onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                    className="rounded text-[#0A84FF]"
                  />
                  Campus Favorite
                </label>

                <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_late_night}
                    onChange={(e) => setFormData({ ...formData, is_late_night: e.target.checked })}
                    className="rounded text-[#0A84FF]"
                  />
                  Late Night Craving
                </label>

                <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_flash_deal}
                    onChange={(e) => setFormData({ ...formData, is_flash_deal: e.target.checked })}
                    className="rounded text-[#0A84FF]"
                  />
                  Flash Deal
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-5 py-2 rounded-xl bg-[#111111] hover:bg-[#0A84FF] text-white font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-md"
                >
                  {submitting ? 'Saving to Supabase...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
