import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Check,
  X,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Zap,
  Navigation,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { DeliveryStatusCard } from './components/DeliveryStatusCard';
import { CategoryGrid } from './components/CategoryGrid';
import { FlashDeals } from './components/FlashDeals';
import { CampusFavourites } from './components/CampusFavourites';
import { SearchSection } from './components/SearchSection';
import { ProductRequestBox } from './components/ProductRequestBox';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { FloatingCart } from './components/FloatingCart';
import { CustomerOrdersModal } from './components/CustomerOrdersModal';
import { CategoryPills } from './components/CategoryPills';
import { Footer } from './components/Footer';
import { TopGlobalSearchBar } from './components/TopGlobalSearchBar';
import { WishlistView } from './components/WishlistView';
import { OrdersProfileView } from './components/OrdersProfileView';
import { CampusPlayHubBanner } from './components/CampusPlayHubBanner';
import { CampusLocationModal } from './components/CampusLocationModal';
import { CampusPrintModal } from './components/CampusPrintModal';
import { CampusPrintBanner } from './components/CampusPrintBanner';
import { CampusPrintWidget } from './components/CampusPrintWidget';
import { CAMPUS_ZONES, CATEGORIES, PRODUCTS } from './data/mockData';
import { Product, CartItem, CampusZone } from './types';
import { fetchProducts, supabase } from './lib/supabase';
import { detectNearestCampusZone, isInsideDeliveryZone } from './utils/geolocation';

export type NavigationTab = 'home' | 'wishlist' | 'profile';

/**
 * Infinity Store - Customer Web Application
 * Clean consumer storefront. The Admin Operations Console is on a separate dedicated URL (/admin.html).
 */
export default function App() {
  // Ensure the customer storefront clears any stale #admin hash from the browser address bar
  useEffect(() => {
    if (window.location.hash.includes('admin')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Content Protection & Anti-Copy Lock
  useEffect(() => {
    // 1. Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Intercept inspect shortcut keys: F12, Ctrl+U, Ctrl+Shift+I/J/C, Ctrl+S
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // F12 (Developer tools)
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U / Cmd+U (View source)
      if (modKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+S / Cmd+S (Save page)
      if (modKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools Inspect)
      if (modKey && e.shiftKey && ['i', 'I', 'j', 'J', 'c', 'C'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 3. Prevent dragging images across storefront
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'IMG') {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('dragstart', handleDragStart);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return <CustomerStorefront />;
}

function CustomerStorefront() {
  // 1. LIVE CATALOG: State for live Supabase products with graceful instant fallback
  const [products, setProductsState] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('infinity_cached_products');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(mapStorefrontProduct);
        }
      }
    } catch {}
    return PRODUCTS;
  });
  const productsList = products; // Alias for seamless backward compatibility across all child components

  // Transform raw Supabase rows so all UI properties (image, category, price, discount, stock, etc.) are populated
  function mapStorefrontProduct(item: any): Product {
    const rawCat = (item.category || '').toLowerCase().trim();
    let category = item.category || rawCat;
    if (rawCat === 'beverages' || rawCat === 'drink' || rawCat === 'drinks') category = 'drinks';
    else if (rawCat === 'food' || rawCat === 'munchies' || rawCat === 'snacks') category = 'snacks';
    else if (rawCat === 'study' || rawCat === 'pens' || rawCat === 'stationery') category = 'stationery';
    else if (rawCat === 'tech' || rawCat === 'gadgets' || rawCat === 'electronics') category = 'electronics';
    else if (
      rawCat === 'womens-care' ||
      rawCat === "women's care" ||
      rawCat === 'womenscare' ||
      rawCat === 'women' ||
      rawCat.includes('women') ||
      rawCat === 'sanitary'
    ) {
      category = 'womens-care';
    }
    if (!category) category = 'snacks';

    const stock = Number(item.stock ?? item.stock_quantity ?? item.stock_count ?? 10);
    const price = Number(item.price || 0);
    const originalPrice = item.original_price
      ? Number(item.original_price)
      : item.originalPrice
      ? Number(item.originalPrice)
      : undefined;
    const discount =
      originalPrice && originalPrice > price
        ? `${Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF`
        : undefined;
    const image =
      item.image_url ||
      item.image ||
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';

    return {
      ...item,
      id: String(item.id),
      name: item.name || 'Campus Item',
      category,
      price,
      originalPrice,
      discount,
      rating: item.rating || 4.8,
      reviewsCount: item.reviewsCount || 118,
      image,
      image_url: image,
      inStock: item.in_stock !== undefined ? Boolean(item.in_stock && stock > 0) : stock > 0,
      isActive: item.is_active !== undefined ? item.is_active : true,
      stockCount: stock,
      stock: stock,
      isPopular: item.is_popular !== undefined ? item.is_popular : true,
      isLateNight: Boolean(item.is_late_night),
      isFlashDeal: Boolean(discount) || Boolean(item.is_flash_deal),
      unit: item.unit || '1 pc',
      description: item.description || '',
      tags: item.tags || [category],
    };
  }

  const setProducts = (rawOrMapped: any[]) => {
    if (!Array.isArray(rawOrMapped)) return;
    setProductsState(rawOrMapped.map(mapStorefrontProduct));
  };

  // 1. LIVE CATALOG: fetchStorefrontProducts directly from Supabase
  async function fetchStorefrontProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Storefront products fetch notice, keeping active catalog:', error.message || error);
        setProductsState((prev) => (prev && prev.length > 0 ? prev : PRODUCTS));
        return;
      }

      if (data && data.length > 0) {
        setProducts(data);
        try {
          localStorage.setItem('infinity_cached_products', JSON.stringify(data));
        } catch {}
      } else {
        setProductsState((prev) => (prev && prev.length > 0 ? prev : PRODUCTS));
      }
    } catch (err: any) {
      console.warn('Network issue fetching storefront products, using offline catalog cache:', err?.message || err);
      setProductsState((prev) => (prev && prev.length > 0 ? prev : PRODUCTS));
    }
  }

  // 2. INSTANT REALTIME UPDATES: Subscribe to 'products' table changes
  useEffect(() => {
    fetchStorefrontProducts();

    const channel = supabase
      .channel('public:products:storefront-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          fetchStorefrontProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. FETCH LIVE STORE STATUS & INSTANT REALTIME UPDATES
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  useEffect(() => {
    async function fetchStoreStatus() {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .eq('id', 'primary')
          .single();
        if (data && typeof data.is_open === 'boolean') {
          setIsStoreOpen(data.is_open);
        }
      } catch (err: any) {
        console.warn('Notice fetching store status:', err?.message || err);
      }
    }

    fetchStoreStatus();

    const channel = supabase
      .channel('public:store_settings:live-storefront')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings' },
        (payload: any) => {
          if (payload.new && typeof payload.new.is_open === 'boolean') {
            setIsStoreOpen(payload.new.is_open);
          } else {
            fetchStoreStatus();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Campus Zone & Delivery Boundary Geofence state
  const [selectedZone, setSelectedZone] = useState<CampusZone>(() => {
    try {
      const saved = localStorage.getItem('infinity_campus_zone');
      return saved ? JSON.parse(saved) : CAMPUS_ZONES[0];
    } catch {
      return CAMPUS_ZONES[0];
    }
  });

  const [isOutsideBoundary, setIsOutsideBoundary] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const handleSelectZone = (zone: CampusZone) => {
    setSelectedZone(zone);
    try {
      localStorage.setItem('infinity_campus_zone', JSON.stringify(zone));
    } catch {}

    if (zone.isOutsideDelivery) {
      setIsOutsideBoundary(true);
      triggerToast('🚀 Coming Soon to Your Area! We deliver exclusively inside campus.');
    } else {
      setIsOutsideBoundary(false);
      triggerToast(`⚡ Express delivery set to: ${zone.name}`);
    }
    setIsZoneModalOpen(false);
  };

  const handleAutoDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const result = await detectNearestCampusZone(CAMPUS_ZONES);
      setSelectedZone(result.zone);
      try {
        localStorage.setItem('infinity_campus_zone', JSON.stringify(result.zone));
      } catch {}
      if (!result.isInsideGeofence) {
        setIsOutsideBoundary(true);
        triggerToast('📍 Outside Campus Delivery Boundary - Catalog Only Mode');
      } else {
        setIsOutsideBoundary(false);
        triggerToast(result.message);
      }
      setIsZoneModalOpen(false);
    } catch (err: any) {
      triggerToast(err.message || 'Could not auto-detect location');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // On initial load: request navigator.geolocation.getCurrentPosition to check boundary
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          const inside = isInsideDeliveryZone(longitude, latitude);
          if (!inside) {
            setIsOutsideBoundary(true);
          } else {
            setIsOutsideBoundary(false);
          }
        },
        (error) => {
          console.warn('Geolocation check status:', error.message);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }
  }, []);

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('infinity_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [lastCartUpdate, setLastCartUpdate] = useState<number>(Date.now());

  useEffect(() => {
    try {
      localStorage.setItem('infinity_cart', JSON.stringify(cartItems));
    } catch {}
  }, [cartItems]);

  const cartQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    cartItems.forEach((item) => {
      map[item.product.id] = item.quantity;
    });
    return map;
  }, [cartItems]);

  const cartTotalCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const cartTotalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );

  const handleAddToCart = (product: Product) => {
    if (!isStoreOpen) {
      triggerToast('⚠️ Store is currently closed for orders.');
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const initialQty = product.minQuantity && product.minQuantity > 1 ? product.minQuantity : 1;
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: initialQty }];
    });
    setLastCartUpdate(Date.now());
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const current = cartItems.find((i) => i.product.id === productId)?.quantity || 0;
    if (quantity > current && !isStoreOpen) {
      triggerToast('⚠️ Store is currently closed for orders.');
      return;
    }
    setCartItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
    setLastCartUpdate(Date.now());
  };

  const handleClearCart = () => {
    setCartItems([]);
    setLastCartUpdate(Date.now());
  };

  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('infinity_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const updated = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem('infinity_wishlist', JSON.stringify(updated));
      } catch {}
      triggerToast(exists ? 'Removed from saved wishlist' : 'Saved to campus wishlist ❤️');
      return updated;
    });
  };

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isCustomerOrdersOpen, setIsCustomerOrdersOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Active Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Active Navigation Tab
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');

  // Search Query & Feed Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterFeedActive, setIsFilterFeedActive] = useState(false);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);

  // Jump to product and highlight with pulse
  const handleSelectAndHighlightProduct = (productId: string) => {
    setCurrentTab('home');
    setHighlightedProductId(productId);
    setTimeout(() => {
      const el = document.getElementById(`product-card-${productId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
    setTimeout(() => {
      setHighlightedProductId((prev) => (prev === productId ? null : prev));
    }, 3500);
  };

  // Wishlist actions
  const handleMoveAllWishlistToCart = () => {
    if (!isStoreOpen) {
      triggerToast('⚠️ Store is currently closed for orders.');
      return;
    }
    const itemsToAdd = productsList.filter((p) => wishlist.includes(p.id));
    if (itemsToAdd.length === 0) return;
    setCartItems((prev) => {
      const updated = [...prev];
      itemsToAdd.forEach((prod) => {
        const idx = updated.findIndex((it) => it.product.id === prod.id);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        } else {
          updated.push({ product: prod, quantity: prod.minQuantity || 1 });
        }
      });
      return updated;
    });
    setLastCartUpdate(Date.now());
    triggerToast(`Added ${itemsToAdd.length} wishlist items to bag! 🛍️`);
  };

  const handleClearWishlist = () => {
    setWishlist([]);
    try {
      localStorage.removeItem('infinity_wishlist');
    } catch {}
    triggerToast('Wishlist cleared');
  };

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const triggerToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Scroll helpers
  const scrollToSearch = () => {
    setCurrentTab('home');
    const el = document.getElementById('search-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToCategories = () => {
    setCurrentTab('home');
    const el = document.getElementById('categories-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFavourites = () => {
    setCurrentTab('home');
    const el = document.getElementById('campus-favourites');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Filtered products when search filter or category is active
  const displayedProducts = useMemo(() => {
    if (!isFilterFeedActive || !searchQuery.trim()) {
      return productsList;
    }
    const q = searchQuery.toLowerCase().trim();
    return productsList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [productsList, isFilterFeedActive, searchQuery]);

  // Filtered products when category is selected
  const categoryProducts = useMemo(() => {
    if (!selectedCategory) return [];
    const selNorm = selectedCategory.toLowerCase().replace(/['\s_-]/g, '');
    return displayedProducts.filter((p) => {
      if (p.category === selectedCategory) return true;
      const catNorm = (p.category || '').toLowerCase().replace(/['\s_-]/g, '');
      if (catNorm === selNorm) return true;
      if (
        (selNorm === 'womenscare' || selNorm === 'women') &&
        (catNorm === 'womenscare' || catNorm.includes('women') || catNorm === 'personalcare' || catNorm === 'sanitary')
      ) {
        return true;
      }
      return false;
    });
  }, [displayedProducts, selectedCategory]);

  const activeCategoryObj = useMemo(
    () =>
      CATEGORIES.find((c) => {
        if (!selectedCategory) return false;
        if (c.id === selectedCategory || c.name === selectedCategory || c.slug === selectedCategory) return true;
        const cNorm = c.id.toLowerCase().replace(/['\s_-]/g, '');
        const selNorm = selectedCategory.toLowerCase().replace(/['\s_-]/g, '');
        return cNorm === selNorm;
      }),
    [selectedCategory]
  );

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#FAFAF7] text-[#111111] font-sans antialiased selection:bg-[#0A84FF]/20 selection:text-[#0A84FF]">
      {/* 0. Prominent Store Closed Top Alert Banner */}
      {!isStoreOpen && (
        <div
          id="store-closed-top-banner"
          className="sticky top-0 z-50 w-full bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-black text-xs sm:text-sm py-3 px-4 shadow-xl border-b border-red-800/40 flex items-center justify-center gap-2 text-center select-none"
        >
          <span className="text-base sm:text-lg">⚠️</span>
          <span>Store is Currently Closed — We are not accepting new orders right now. Check back soon!</span>
        </div>
      )}

      {/* 1. Header & Navigation */}
      <Navbar
        selectedZone={selectedZone}
        onOpenZoneSelector={() => setIsZoneModalOpen(true)}
        cartCount={cartTotalCount}
        cartTotal={cartTotalPrice}
        onOpenCart={() => setIsCartOpen(true)}
        wishlistCount={wishlist.length}
        onScrollToSearch={scrollToSearch}
        onScrollToFavourites={scrollToFavourites}
        onOpenCustomerOrders={() => {
          setCurrentTab('profile');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onScrollToCategories={scrollToCategories}
        onOpenWishlist={() => {
          setCurrentTab('wishlist');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenProfile={() => {
          setCurrentTab('profile');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onGoHome={() => {
          setCurrentTab('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenPrint={() => setIsPrintModalOpen(true)}
        activeTab={currentTab}
      />

      {/* Floating Outside Boundary Lockout Banner */}
      <AnimatePresence>
        {isOutsideBoundary && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="sticky top-[60px] sm:top-[68px] z-40 max-w-5xl mx-auto px-4 pt-2 pb-1"
          >
            <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-2xl p-3.5 sm:p-4 shadow-xl border border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 text-white shadow-inner">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-extrabold flex items-center gap-2">
                    <span>📍 Outside Campus Delivery Boundary</span>
                    <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Catalog Only
                    </span>
                  </div>
                  <p className="text-white/95 text-xs mt-0.5 max-w-2xl leading-relaxed">
                    We currently deliver exclusively within campus hostels and labs (10-15 min express). Coming Soon to your location!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsZoneModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer whitespace-nowrap min-h-[44px] flex items-center justify-center"
                >
                  Deliver to Campus Hostel / Lab
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Tab Views Switcher */}
      {currentTab === 'wishlist' ? (
        <WishlistView
          isStoreOpen={isStoreOpen}
          wishlistIds={wishlist}
          products={productsList}
          cartQuantities={cartQuantities}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          onClearWishlist={handleClearWishlist}
          onMoveAllToCart={handleMoveAllWishlistToCart}
          onExploreCatalog={() => {
            setCurrentTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onToastMessage={triggerToast}
        />
      ) : currentTab === 'profile' ? (
        <OrdersProfileView
          allZones={CAMPUS_ZONES}
          onSelectZone={handleSelectZone}
          onExploreCatalog={() => {
            setCurrentTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onToastMessage={triggerToast}
        />
      ) : (
        /* Home Feed View */
        <>
          {/* Top Sticky Global Search Bar with Live Feed Highlighting */}
          <TopGlobalSearchBar
            products={productsList}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectAndHighlightProduct={handleSelectAndHighlightProduct}
            isFilterFeedActive={isFilterFeedActive}
            onToggleFilterFeed={() => setIsFilterFeedActive((prev) => !prev)}
            selectedZone={selectedZone}
            onOpenZoneSelector={() => setIsZoneModalOpen(true)}
            allZones={CAMPUS_ZONES}
            onSelectZone={handleSelectZone}
          />

          {/* 2. Hero Section */}
          <HeroSection
            onShopNow={scrollToFavourites}
            onExploreCategories={scrollToCategories}
          />

          {/* 3. Delivery Speed & Zone Status Card */}
          <DeliveryStatusCard
            selectedZone={selectedZone}
            onSelectZone={handleSelectZone}
            onToastMessage={triggerToast}
          />

          {/* 4. Smooth Animated Category Pill Filters */}
          <CategoryPills
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* 5. Interactive Categories Aisle Selector */}
          <CategoryGrid
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* If a category is selected, display its product catalog */}
          {selectedCategory && activeCategoryObj && (
            <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{activeCategoryObj.emoji}</span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 font-display">
                      {activeCategoryObj.name}
                    </h3>
                    <p className="text-xs text-gray-500">{activeCategoryObj.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs font-bold text-[#0A84FF] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>View All Campus Aisles</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {categoryProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    quantityInCart={cartQuantities[prod.id] || 0}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onToastMessage={triggerToast}
                    isWishlisted={wishlist.includes(prod.id)}
                    onToggleWishlist={handleToggleWishlist}
                    isHighlighted={highlightedProductId === prod.id}
                    isStoreOpen={isStoreOpen}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 6. Flash Deals Countdown Carousel */}
          <FlashDeals
            isStoreOpen={isStoreOpen}
            products={displayedProducts}
            onAddToCart={handleAddToCart}
            cartQuantities={cartQuantities}
            onToastMessage={triggerToast}
            onUpdateQuantity={handleUpdateQuantity}
          />

          {/* 7. Campus Favourites (High demand student essentials) */}
          <CampusFavourites
            isStoreOpen={isStoreOpen}
            products={displayedProducts}
            cartQuantities={cartQuantities}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            onToastMessage={triggerToast}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            highlightedProductId={highlightedProductId}
          />

          {/* 8. Live Search Section */}
          <SearchSection
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            products={productsList}
            onSelectProduct={(p) => {
              if (!isStoreOpen) {
                triggerToast('⚠️ Store is currently closed for orders.');
                return;
              }
              handleAddToCart(p);
              triggerToast(`Added ${p.name} to cart!`);
            }}
          />

          {/* 9. Interactive "Request a Product" Campus Box */}
          <ProductRequestBox onToastMessage={triggerToast} />

          {/* 9.5 Campus Printout Widget (B&W ₹10 & Color ₹20 Direct WhatsApp) */}
          <CampusPrintWidget />

          {/* Modular Expansion: Campus Play Hub & Games Banner */}
          <CampusPlayHubBanner onToastMessage={triggerToast} />
        </>
      )}

      {/* 10. Customer Footer */}
      <Footer
        onOpenCustomerOrders={() => {
          setCurrentTab('profile');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* 12. Floating Action Cart Pill */}
      <FloatingCart
        cartItems={cartItems}
        onOpenCart={() => setIsCartOpen(true)}
        lastUpdated={lastCartUpdate}
      />

      {/* 13. Slide-over Cart Drawer */}
      <CartDrawer
        isStoreOpen={isStoreOpen}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        selectedZone={selectedZone}
        isOutsideBoundary={isOutsideBoundary}
        onOpenZoneSelector={() => setIsZoneModalOpen(true)}
      />

      {/* 14. Customer Live Orders Tracking Modal */}
      <CustomerOrdersModal
        isOpen={isCustomerOrdersOpen}
        onClose={() => setIsCustomerOrdersOpen(false)}
        onOpenStoreCatalog={() => {
          setIsCustomerOrdersOpen(false);
          setCurrentTab('home');
          scrollToCategories();
        }}
      />

      {/* 15. Campus Delivery Zone Selector Modal (1-Tap Campus Location Picker) */}
      <CampusLocationModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        selectedZone={selectedZone}
        onSelectZone={handleSelectZone}
        allZones={CAMPUS_ZONES}
        isOutsideBoundary={isOutsideBoundary}
      />

      {/* 16. Campus Print & Xerox Station Modal */}
      <CampusPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onToastMessage={triggerToast}
      />

      {/* 16. Lightweight Global Toast Message */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl border border-white/20 flex items-center gap-2 pointer-events-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFD60A]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
