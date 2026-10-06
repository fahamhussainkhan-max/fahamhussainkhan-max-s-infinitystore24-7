import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Check,
  X,
  Search,
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
import { CampusFavourites } from './components/CampusFavourites';
import { ProductRequestBox } from './components/ProductRequestBox';
import { ProductCard } from './components/ProductCard';
import { CartDrawer } from './components/CartDrawer';
import { FloatingCart } from './components/FloatingCart';
import { CustomerOrdersModal } from './components/CustomerOrdersModal';
import { CategoryPills } from './components/CategoryPills';
import { Footer } from './components/Footer';
import { WishlistView } from './components/WishlistView';
import { OrdersProfileView } from './components/OrdersProfileView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { StudentEntrepreneurshipBanner } from './components/StudentEntrepreneurshipBanner';
import { CampusLocationModal } from './components/CampusLocationModal';
import { CampusPrintModal } from './components/CampusPrintModal';
import { CampusPrintWidget } from './components/CampusPrintWidget';
import { CAMPUS_ZONES, CATEGORIES, PRODUCTS, sortCategoriesInStorefrontOrder } from './data/mockData';
import { Product, Category, CartItem, CampusZone } from './types';
import { fetchProducts, supabase, mapStorefrontCategory } from './lib/supabase';
import { detectNearestCampusZone, isInsideDeliveryZone } from './utils/geolocation';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WhatsAppLoginModal } from './components/WhatsAppLoginModal';

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

  return (
    <AuthProvider>
      <CustomerStorefront />
    </AuthProvider>
  );
}

function CustomerStorefront() {
  const { user, isLoginModalOpen, closeLoginModal, isLoading } = useAuth();

  // Helper to ensure product IDs are always unique and clean
  const deduplicateProducts = (list: Product[]): Product[] => {
    const seen = new Set<string>();
    return list.filter((p, idx) => {
      const id = p.id || `item-${idx}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  // 1. LIVE PRODUCTS: State for live Supabase products with graceful instant fallback
  const [products, setProductsState] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('infinity_cached_products');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return deduplicateProducts(parsed.map((item, idx) => mapStorefrontProduct(item, idx)));
        }
      }
    } catch {}
    return deduplicateProducts(PRODUCTS);
  });
  const productsList = products; // Alias for seamless backward compatibility across all child components

  // 2. LIVE CATEGORIES: State for live Supabase categories with graceful instant fallback to CATEGORIES
  const [categories, setCategoriesState] = useState<Category[]>(() => {
    try {
      const cached = localStorage.getItem('infinity_cached_categories');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sortCategoriesInStorefrontOrder(
            parsed.map((item, idx) => mapStorefrontCategory(item, idx))
          );
        }
      }
    } catch {}
    return sortCategoriesInStorefrontOrder(CATEGORIES);
  });

  // Calculate live item counts per category dynamically from current active products
  const categoriesWithLiveCounts = useMemo(() => {
    const sorted = sortCategoriesInStorefrontOrder(categories);
    return sorted.map((cat) => {
      const count = products.filter((p) => {
        const pCat = (p.category || '').toLowerCase().trim();
        const cId = cat.id.toLowerCase().trim();
        const cSlug = (cat.slug || '').toLowerCase().trim();
        const cName = (cat.name || '').toLowerCase().trim();
        return pCat === cId || (cSlug && pCat === cSlug) || pCat === cName;
      }).length;
      return {
        ...cat,
        itemCount: count > 0 ? count : (cat.itemCount || 0),
      };
    });
  }, [categories, products]);

  // Transform raw Supabase rows so all UI properties (image, category, price, discount, stock, etc.) are populated
  function mapStorefrontProduct(item: any, fallbackIndex: number = 0): Product {
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

    const safeId = item?.id ? String(item.id) : (item?.slug ? String(item.slug) : `product-${fallbackIndex}`);

    return {
      ...item,
      id: safeId,
      name: item.name || item.title || 'Campus Item',
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
    const mapped = rawOrMapped.map((item, idx) => mapStorefrontProduct(item, idx));
    setProductsState(deduplicateProducts(mapped));
  };

  // 1. LIVE CATALOG: fetchStorefrontProducts directly from Supabase
  async function fetchStorefrontProducts() {
    try {
      let { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Storefront products fetch notice, trying without is_active filter:', error.message || error);
        const fallback = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });
        if (!fallback.error && Array.isArray(fallback.data) && fallback.data.length > 0) {
          data = fallback.data;
          error = null;
        }
      }

      if (!error && Array.isArray(data) && data.length > 0) {
        setProducts(data);
        try {
          localStorage.setItem('infinity_cached_products', JSON.stringify(data));
        } catch {}
      } else if (!data || data.length === 0) {
        // Fallback to cached or mock products only if Supabase returns nothing
        setProductsState((prev) => (prev && prev.length > 0 ? prev : PRODUCTS));
      }
    } catch (err: any) {
      console.warn('Network issue fetching storefront products, using offline catalog cache:', err?.message || err);
      setProductsState((prev) => (prev && prev.length > 0 ? prev : PRODUCTS));
    }
  }

  // 2. LIVE CATEGORIES: fetchStorefrontCategories directly from Supabase
  async function fetchStorefrontCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*');

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = sortCategoriesInStorefrontOrder(
          data.map((item, idx) => mapStorefrontCategory(item, idx))
        );
        setCategoriesState(mapped);
        try {
          localStorage.setItem('infinity_cached_categories', JSON.stringify(data));
        } catch {}
      } else if (error) {
        console.warn('Storefront categories fetch notice, keeping active catalog:', error.message || error);
      }
    } catch (err: any) {
      console.warn('Network issue fetching storefront categories, using fallback:', err?.message || err);
    }
  }

  // 3. INSTANT REALTIME UPDATES: Subscribe to 'products' and 'categories' table changes
  useEffect(() => {
    // Initial fetch on mount
    fetchStorefrontCategories();
    fetchStorefrontProducts();

    // Realtime listener for 'products' table (INSERT, UPDATE, DELETE)
    const productsChannel = supabase
      .channel('public:products:storefront-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'products' },
        (payload: any) => {
          if (payload?.new) {
            const mapped = mapStorefrontProduct(payload.new);
            if (mapped.isActive !== false) {
              setProductsState((prev) => {
                const filtered = prev.filter((p) => p.id !== mapped.id);
                return [mapped, ...filtered];
              });
            }
          }
          fetchStorefrontProducts();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'products' },
        (payload: any) => {
          if (payload?.new) {
            const mapped = mapStorefrontProduct(payload.new);
            setProductsState((prev) => {
              if (mapped.isActive === false) {
                return prev.filter((p) => p.id !== mapped.id);
              }
              const exists = prev.some((p) => p.id === mapped.id);
              if (exists) {
                return prev.map((p) => (p.id === mapped.id ? mapped : p));
              }
              return [mapped, ...prev];
            });
          }
          fetchStorefrontProducts();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'products' },
        (payload: any) => {
          if (payload?.old?.id) {
            const delId = String(payload.old.id);
            setProductsState((prev) => prev.filter((p) => p.id !== delId));
          }
          fetchStorefrontProducts();
        }
      )
      .subscribe();

    // Realtime listener for 'categories' table (INSERT, UPDATE, DELETE)
    const categoriesChannel = supabase
      .channel('public:categories:storefront-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'categories' },
        (payload: any) => {
          if (payload?.new) {
            const mapped = mapStorefrontCategory(payload.new);
            setCategoriesState((prev) => {
              const filtered = prev.filter((c) => c.id !== mapped.id);
              return [...filtered, mapped];
            });
          }
          fetchStorefrontCategories();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'categories' },
        (payload: any) => {
          if (payload?.new) {
            const mapped = mapStorefrontCategory(payload.new);
            setCategoriesState((prev) =>
              prev.map((c) => (c.id === mapped.id || c.slug === mapped.id ? mapped : c))
            );
          }
          fetchStorefrontCategories();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'categories' },
        (payload: any) => {
          if (payload?.old?.id) {
            const delId = String(payload.old.id).toLowerCase();
            setCategoriesState((prev) =>
              prev.filter((c) => c.id.toLowerCase() !== delId && (c.slug || '').toLowerCase() !== delId)
            );
          }
          fetchStorefrontCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, []);

  // 3. FETCH LIVE STORE STATUS & INSTANT REALTIME UPDATES
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await supabase
          .from('store_settings')
          .select('*')
          .eq('id', 'primary')
          .single();
        if (data && typeof data.is_open === 'boolean') {
          setIsStoreOpen(data.is_open);
        }
      } catch (err: any) {
        console.warn('Notice fetching store settings:', err?.message || err);
      }
    };

    fetchStatus();

    const channel = supabase
      .channel('public:store_settings:storefront')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings' },
        (payload: any) => {
          if (payload.new && typeof payload.new.is_open === 'boolean') {
            setIsStoreOpen(payload.new.is_open);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Campus delivery zone state
  const [selectedZone, setSelectedZone] = useState<CampusZone>(() => {
    try {
      const saved = localStorage.getItem('infinity_campus_zone');
      if (saved) return JSON.parse(saved);
    } catch {}
    return CAMPUS_ZONES[0];
  });
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isOutsideBoundary, setIsOutsideBoundary] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCustomerOrdersOpen, setIsCustomerOrdersOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterFeedActive, setIsFilterFeedActive] = useState(false);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);

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

  // Universal Modal Escape (Esc key) & Desktop/Mobile Back Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCartOpen) {
          setIsCartOpen(false);
        } else if (isZoneModalOpen) {
          setIsZoneModalOpen(false);
        } else if (isPrintModalOpen) {
          setIsPrintModalOpen(false);
        } else if (isCustomerOrdersOpen) {
          setIsCustomerOrdersOpen(false);
        } else if (searchQuery) {
          setSearchQuery('');
        } else if (selectedCategory) {
          setSelectedCategory(null);
        } else if (currentTab !== 'home') {
          setCurrentTab('home');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, isZoneModalOpen, isPrintModalOpen, isCustomerOrdersOpen, searchQuery, selectedCategory, currentTab]);

  // Support native hardware / browser back button to dismiss modals/drawers instead of closing page
  useEffect(() => {
    const hasAnyOverlay = isCartOpen || isZoneModalOpen || isPrintModalOpen || isCustomerOrdersOpen || currentTab !== 'home';

    if (hasAnyOverlay) {
      window.history.pushState({ infinityOverlay: true }, '');
    }

    const handlePopState = () => {
      if (isCartOpen) {
        setIsCartOpen(false);
      } else if (isZoneModalOpen) {
        setIsZoneModalOpen(false);
      } else if (isPrintModalOpen) {
        setIsPrintModalOpen(false);
      } else if (isCustomerOrdersOpen) {
        setIsCustomerOrdersOpen(false);
      } else if (currentTab !== 'home') {
        setCurrentTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isCartOpen, isZoneModalOpen, isPrintModalOpen, isCustomerOrdersOpen, currentTab]);

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

  // Synchronize cart items with live product stock updates from Realtime
  useEffect(() => {
    setCartItems((prev) => {
      let changed = false;
      const updated = prev.map((item) => {
        const live = products.find((p) => p.id === item.product.id);
        if (!live) return item;
        const liveStock = typeof live.stock === 'number'
          ? live.stock
          : (typeof live.stockCount === 'number' ? live.stockCount : 999);
        
        let newQty = item.quantity;
        if (liveStock > 0 && newQty > liveStock) {
          newQty = liveStock;
          changed = true;
        }
        if (item.product !== live || newQty !== item.quantity) {
          changed = true;
          return { ...item, product: live, quantity: newQty };
        }
        return item;
      });
      return changed ? updated : prev;
    });
  }, [products]);

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
    const availableStock = typeof product.stock === 'number'
      ? product.stock
      : (typeof product.stockCount === 'number' ? product.stockCount : 10);
    if (product.inStock === false || availableStock <= 0) {
      triggerToast(`⚠️ "${product.name}" is currently out of stock.`);
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const initialQty = product.minQuantity && product.minQuantity > 1 ? product.minQuantity : 1;
      if (existing) {
        if (existing.quantity >= availableStock) {
          triggerToast(`⚠️ Maximum available stock (${availableStock}) reached.`);
          return prev;
        }
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
    const targetItem = cartItems.find((i) => i.product.id === productId);
    if (quantity > current && targetItem?.product) {
      const p = targetItem.product;
      const availableStock = typeof p.stock === 'number'
        ? p.stock
        : (typeof p.stockCount === 'number' ? p.stockCount : 999);
      if (p.inStock === false || availableStock <= 0) {
        triggerToast(`⚠️ "${p.name}" is currently out of stock.`);
        return;
      }
      if (quantity > availableStock) {
        triggerToast(`⚠️ Maximum available stock (${availableStock}) reached.`);
        return;
      }
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
      triggerToast(exists ? 'Removed from wishlist' : 'Added to wishlist ❤️');
      return updated;
    });
  };

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
      localStorage.setItem('infinity_wishlist', JSON.stringify([]));
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

  const handleSelectAndHighlightProduct = (productId: string) => {
    setHighlightedProductId(productId);
    setTimeout(() => {
      setHighlightedProductId(null);
    }, 3000);
  };

  // Real-time dynamic search filtering across multiple fields
  const isSearchActive = Boolean(searchQuery.trim());
  const searchResultsRef = useRef<HTMLElement>(null);

  const searchResults = useMemo(() => {
    if (!isSearchActive) return [];
    const rawQ = searchQuery.toLowerCase().trim();
    const tokens = rawQ.split(/\s+/).filter(Boolean);

    return productsList.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const unit = (item.unit || '').toLowerCase();
      const tags = (item.tags || []).map((t) => t.toLowerCase()).join(' ');

      // 1. Case-insensitive substring matching on name, category, description, tags, unit
      if (
        name.includes(rawQ) ||
        cat.includes(rawQ) ||
        desc.includes(rawQ) ||
        tags.includes(rawQ) ||
        unit.includes(rawQ)
      ) {
        return true;
      }

      // 2. Token-based matching: each typed word matches somewhere in the product attributes
      const combined = `${name} ${cat} ${desc} ${tags} ${unit}`;
      if (tokens.every((token) => combined.includes(token))) {
        return true;
      }

      // 3. Category synonyms & keywords (beverages, snacks, stationery, etc.)
      const isBeverage =
        rawQ.includes('drink') ||
        rawQ.includes('beverage') ||
        rawQ.includes('soda') ||
        rawQ.includes('cold') ||
        rawQ.includes('juice') ||
        rawQ.includes('chai') ||
        rawQ.includes('coffee') ||
        rawQ.includes('tea') ||
        rawQ.includes('red bull') ||
        rawQ.includes('sting');
      if (
        isBeverage &&
        (cat.includes('beverage') || cat.includes('drink') || tags.includes('chilled') || tags.includes('drinks'))
      ) {
        return true;
      }

      const isSnack =
        rawQ.includes('snack') ||
        rawQ.includes('munch') ||
        rawQ.includes('biscuit') ||
        rawQ.includes('chips') ||
        rawQ.includes('noodle') ||
        rawQ.includes('maggi') ||
        rawQ.includes('food');
      if (
        isSnack &&
        (cat.includes('snack') || cat.includes('instant') || tags.includes('instant') || tags.includes('munchies'))
      ) {
        return true;
      }

      const isStationery =
        rawQ.includes('stationery') ||
        rawQ.includes('stationary') ||
        rawQ.includes('study') ||
        rawQ.includes('book') ||
        rawQ.includes('notebook') ||
        rawQ.includes('exam') ||
        rawQ.includes('pen') ||
        rawQ.includes('pencil') ||
        rawQ.includes('drafter') ||
        rawQ.includes('lab') ||
        rawQ.includes('assignment');
      const isTech =
        rawQ.includes('tech') ||
        rawQ.includes('electronic') ||
        rawQ.includes('cable') ||
        rawQ.includes('charger') ||
        rawQ.includes('adapter') ||
        rawQ.includes('calculator') ||
        rawQ.includes('usb') ||
        rawQ.includes('gadget');
      if (isTech && (cat.includes('electronic') || tags.includes('tech') || tags.includes('electronics'))) {
        return true;
      }

      return false;
    });
  }, [productsList, isSearchActive, searchQuery]);

  // Seamless handler when user types in the search bar from anywhere
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      if (currentTab !== 'home') {
        setCurrentTab('home');
      }
      // Auto-scroll smoothly to the catalog section when typing starts if user is at the top
      setTimeout(() => {
        const catalogEl =
          document.getElementById('product-catalog-section') ||
          document.getElementById('campus-favourites') ||
          searchResultsRef.current;
        if (catalogEl && window.scrollY < 200) {
          catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
    }
  };

  const displayedProducts = useMemo(() => {
    if (isSearchActive) {
      return searchResults;
    }
    return productsList;
  }, [isSearchActive, searchResults, productsList]);

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
      categoriesWithLiveCounts.find((c) => {
        if (!selectedCategory) return false;
        if (c.id === selectedCategory || c.name === selectedCategory || c.slug === selectedCategory) return true;
        const cNorm = c.id.toLowerCase().replace(/['\s_-]/g, '');
        const selNorm = selectedCategory.toLowerCase().replace(/['\s_-]/g, '');
        return cNorm === selNorm;
      }) ||
      CATEGORIES.find((c) => {
        if (!selectedCategory) return false;
        if (c.id === selectedCategory || c.name === selectedCategory || c.slug === selectedCategory) return true;
        const cNorm = c.id.toLowerCase().replace(/['\s_-]/g, '');
        const selNorm = selectedCategory.toLowerCase().replace(/['\s_-]/g, '');
        return cNorm === selNorm;
      }),
    [selectedCategory, categoriesWithLiveCounts]
  );

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#FAFAF7] text-[#111111] font-sans antialiased selection:bg-[#0A84FF]/20 selection:text-[#0A84FF] pb-16 sm:pb-0">
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
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        products={productsList}
        onSelectProduct={(productId: string) => {
          setHighlightedProductId(productId);
          scrollToFavourites();
        }}
      />

      {/* Floating Outside Boundary Lockout Banner */}
      <AnimatePresence>
        {isOutsideBoundary && (
          <motion.div
            key="outside-boundary-banner"
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
                    We currently deliver exclusively within CCCT & SIST campus hostels and labs (Delivery within 30 - 45 mins). Coming Soon to your location!
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
          {/* Active Real-Time Search Results Section - Top Priority When Searching */}
          {isSearchActive ? (
            <section
              id="product-catalog-section"
              ref={searchResultsRef}
              className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 scroll-mt-20 animate-fade-in"
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0A84FF] animate-ping" />
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-display">
                      Search Results for "{searchQuery}"
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {searchResults.length} {searchResults.length === 1 ? 'product' : 'products'} found in stock
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-1.5 rounded-full font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Search</span>
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-gray-100 shadow-sm space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center">
                    <Search className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                      No products found for "{searchQuery}" - try searching for Maggi, Pen, or Notebooks
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                      Check your spelling or explore the complete campus catalog below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-3 px-6 py-2.5 rounded-xl bg-[#111111] hover:bg-[#0A84FF] text-white text-xs font-bold transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    View All Products
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-5">
                  {searchResults.map((p, idx) => (
                    <ProductCard
                      key={p.id ? `${p.id}-${idx}` : `search-prod-${idx}`}
                      product={p}
                      quantityInCart={cartQuantities[p.id] || 0}
                      onAddToCart={handleAddToCart}
                      onUpdateQuantity={handleUpdateQuantity}
                      onToastMessage={triggerToast}
                      isWishlisted={wishlist.includes(p.id)}
                      onToggleWishlist={handleToggleWishlist}
                      isHighlighted={highlightedProductId === p.id}
                      isStoreOpen={isStoreOpen}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : (
            <>
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
                onOpenZoneSelector={() => setIsZoneModalOpen(true)}
              />

              {/* 3.5. Compact 1-Line Teasers: Student Entrepreneurship & Campus Print Desk */}
              <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 my-2 sm:my-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <StudentEntrepreneurshipBanner onToastMessage={triggerToast} />
                  <CampusPrintWidget onOpenPrintModal={() => setIsPrintModalOpen(true)} />
                </div>
              </div>

              {/* 4. Smooth Animated Category Pill Filters */}
              <CategoryPills
                categories={categoriesWithLiveCounts}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />

              {/* 5. Category Products / Default Aisles */}
              {selectedCategory ? (
                <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
                  <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                  <span className="text-2xl">{activeCategoryObj?.emoji || '🛍️'}</span>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                      {activeCategoryObj?.name || selectedCategory}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Showing {categoryProducts.length} in-stock campus items
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-full transition cursor-pointer"
                >
                  Show All Aisles
                </button>
              </div>

              {categoryProducts.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-gray-100 shadow-sm">
                  <p className="text-sm font-bold text-gray-700">No products found in this aisle.</p>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="mt-3 text-xs bg-[#111111] text-white px-4 py-2 rounded-full font-bold"
                  >
                    View All Categories
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-5">
                  {categoryProducts.map((p, idx) => (
                    <ProductCard
                      key={p.id ? `${p.id}-${idx}` : `cat-prod-${idx}`}
                      product={p}
                      quantityInCart={cartQuantities[p.id] || 0}
                      onAddToCart={handleAddToCart}
                      onUpdateQuantity={handleUpdateQuantity}
                      onToastMessage={triggerToast}
                      isWishlisted={wishlist.includes(p.id)}
                      onToggleWishlist={handleToggleWishlist}
                      isHighlighted={highlightedProductId === p.id}
                      isStoreOpen={isStoreOpen}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : (
            <>
              <CategoryGrid
                categories={categoriesWithLiveCounts}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />

              {/* 6. Campus Favourites Section */}
              <CampusFavourites
                products={displayedProducts}
                cartQuantities={cartQuantities}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={handleUpdateQuantity}
                onToastMessage={triggerToast}
                wishlist={wishlist}
                onToggleWishlist={handleToggleWishlist}
                highlightedProductId={highlightedProductId}
                isStoreOpen={isStoreOpen}
              />

              {/* 7. Product Request Box */}
              <ProductRequestBox onToastMessage={triggerToast} />
            </>
          )}
        </>
      )}
    </>
  )}

  {/* Footer (Available across all views with Privacy Policy & Terms of Service) */}
  <Footer
    onOpenCustomerOrders={() => {
      setCurrentTab('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }}
  />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        selectedZone={selectedZone}
        isOutsideBoundary={isOutsideBoundary}
        onOpenZoneSelector={() => {
          setIsCartOpen(false);
          setIsZoneModalOpen(true);
        }}
        isStoreOpen={isStoreOpen}
        onOpenCustomerOrders={() => {
          setIsCartOpen(false);
          setCurrentTab('profile');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Mobile Sticky Bottom Navigation (Zero layout shift, responsive quick navigation) */}
      <MobileBottomNav
        activeTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setHighlightedProductId(null);
          setSelectedCategory(null);
        }}
        onScrollToCategories={scrollToCategories}
        wishlistCount={wishlist.length}
      />

      {/* Floating Cart Pill (Desktop bottom-right & Mobile sticky strip above bottom nav) */}
      <FloatingCart
        cartItems={cartItems}
        onOpenCart={() => setIsCartOpen(true)}
        lastUpdated={lastCartUpdate}
      />

      {/* Campus Location Modal */}
      <CampusLocationModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        selectedZone={selectedZone}
        onSelectZone={handleSelectZone}
        allZones={CAMPUS_ZONES}
        isOutsideBoundary={isOutsideBoundary}
      />

      {/* Campus Print Modal */}
      <CampusPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onToastMessage={triggerToast}
      />

      {/* Customer Orders Modal */}
      <CustomerOrdersModal
        isOpen={isCustomerOrdersOpen}
        onClose={() => setIsCustomerOrdersOpen(false)}
        onOpenStoreCatalog={() => {
          setIsCustomerOrdersOpen(false);
          setCurrentTab('home');
        }}
      />

      {/* WhatsApp Student Login & Verification Modal */}
      <WhatsAppLoginModal
        isOpen={isLoginModalOpen}
        onClose={closeLoginModal}
      />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="floating-toast-notification"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white px-5 py-3 rounded-full shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-white/10 select-none whitespace-nowrap"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
