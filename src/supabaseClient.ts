/**
 * Centralized Supabase Client instance
 * Configured for Infinity Store Admin Panel and Campus Operations
 */
export {
  supabase,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  isSupabaseConfigured,
  fetchDashboardMetrics,
  fetchProducts,
  fetchStorefrontProducts,
  fetchCategories,
  fetchStorefrontCategories,
  mapStorefrontCategory,
  mapStorefrontProduct,
  subscribeToCategoriesRealtime,
  subscribeToProductsRealtime,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  fetchOrders,
  updateOrderStatus,
  fetchOrderStatusHistory,
  subscribeToOrders,
  adjustInventoryStock,
  fetchInventoryTransactions,
  fetchProfiles,
  seedSupabaseDemoData,
  recordCampusOrder,
  handleQuickOrder,
  placeFastOrder,
} from './lib/supabase';
