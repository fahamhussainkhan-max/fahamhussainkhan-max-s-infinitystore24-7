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
import { QuickDeliveryBanner } from './components/QuickDeliveryBanner';
import { Footer } from './components/Footer';
import { CAMPUS_ZONES, CATEGORIES, PRODUCTS } from './data/mockData';
import { Product, CartItem, CampusZone } from './types';
import { fetchProducts, supabase } from './lib/supabase';

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

  return <CustomerStorefront />;
}

function CustomerStorefront() {
  // Catalog products (seeded from mockData, synced with Supabase catalog)
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);

  // Sync with live Supabase products where is_active = true
  useEffect(() => {
    let isMounted = true;
    const loadLiveProducts = async () => {
      try {
        // 3. Load items dynamically from 'products' where is_active = true
        const remote = await fetchProducts(true);
        if (remote && remote.length > 0 && isMounted) {
          const CORE_CATEGORIES = ['stationery', 'drinks', 'snacks'];
          const validRemote = remote.filter((rp) => {
            const cat = (rp.category || '').toLowerCase().trim();
            return CORE_CATEGORIES.includes(cat) || cat === 'food' || cat === 'beverages' || cat === 'study';
          });

          const merged = [...PRODUCTS];
          validRemote.forEach((rp) => {
            let cat = (rp.category || 'snacks').toLowerCase().trim();
            if (cat === 'beverages' || cat === 'drink') cat = 'drinks';
            if (cat === 'food' || cat === 'munchies') cat = 'snacks';
            if (cat === 'study' || cat === 'pens') cat = 'stationery';
            if (!CORE_CATEGORIES.includes(cat)) cat = 'snacks';

            const existingIdx = merged.findIndex((p) => String(p.id) === String(rp.id));
            const stock = rp.stock_count ?? rp.stock_quantity ?? 0;
            const item: Product = {
              id: String(rp.id),
              name: rp.name || rp.title || 'Product',
              category: cat,
              price: rp.price,
              originalPrice: rp.original_price,
              rating: 4.8,
              reviewsCount: 118,
              image: rp.image || rp.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
              inStock: rp.in_stock && stock > 0,
              isActive: rp.is_active !== undefined ? rp.is_active : true,
              stockCount: stock,
              isPopular: rp.is_popular,
              isLateNight: rp.is_late_night,
              isFlashDeal: rp.is_flash_deal,
              unit: rp.unit || '1 pc',
              description: rp.description || '',
              tags: [cat],
            };
            if (existingIdx >= 0) {
              merged[existingIdx] = { ...merged[existingIdx], ...item };
            } else {
              merged.push(item);
            }
          });
          setProductsList(merged);
        }
      } catch (err) {
        console.warn('Live products sync using defaults:', err);
      }
    };

    loadLiveProducts();

    // Realtime Postgres changes subscription for live product inventory
    const channel = supabase
      .channel('public:products:live-store')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          loadLiveProducts();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Campus Zone state
  const [selectedZone, setSelectedZone] = useState<CampusZone>(() => {
    try {
      const saved = localStorage.getItem('infinity_campus_zone');
      return saved ? JSON.parse(saved) : CAMPUS_ZONES[0];
    } catch {
      return CAMPUS_ZONES[0];
    }
  });

  const handleSelectZone = (zone: CampusZone) => {
    setSelectedZone(zone);
    try {
      localStorage.setItem('infinity_campus_zone', JSON.stringify(zone));
    } catch {}
    setIsZoneModalOpen(false);
    triggerToast(`Delivery location set to ${zone.name}`);
  };

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

  // Active Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

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
    const el = document.getElementById('search-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToCategories = () => {
    const el = document.getElementById('categories-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToFavourites = () => {
    const el = document.getElementById('campus-favourites');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Filtered products when category is selected
  const categoryProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return productsList.filter((p) => p.category === selectedCategory);
  }, [productsList, selectedCategory]);

  const activeCategoryObj = useMemo(
    () => CATEGORIES.find((c) => c.id === selectedCategory),
    [selectedCategory]
  );

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#111111] font-sans antialiased selection:bg-[#0A84FF]/20 selection:text-[#0A84FF] pb-28 sm:pb-16">
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
        onOpenCustomerOrders={() => setIsCustomerOrdersOpen(true)}
        onScrollToCategories={scrollToCategories}
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
              />
            ))}
          </div>
        </section>
      )}

      {/* 6. Flash Deals Countdown Carousel */}
      <FlashDeals
        products={productsList}
        onAddToCart={handleAddToCart}
        cartQuantities={cartQuantities}
        onToastMessage={triggerToast}
        onUpdateQuantity={handleUpdateQuantity}
      />

      {/* 7. Campus Favourites (High demand student essentials) */}
      <CampusFavourites
        products={productsList}
        cartQuantities={cartQuantities}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
        onToastMessage={triggerToast}
        wishlist={wishlist}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* 8. Live Search Section */}
      <SearchSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        products={productsList}
        onSelectProduct={(p) => {
          handleAddToCart(p);
          triggerToast(`Added ${p.name} to cart!`);
        }}
      />

      {/* 9. Interactive "Request a Product" Campus Box */}
      <ProductRequestBox onToastMessage={triggerToast} />

      {/* 10. Customer Footer */}
      <Footer onOpenCustomerOrders={() => setIsCustomerOrdersOpen(true)} />

      {/* 11.5 Floating Quick-Delivery Banner with Pulse Animation */}
      <QuickDeliveryBanner
        selectedZone={selectedZone}
        onOpenZoneSelector={() => setIsZoneModalOpen(true)}
      />

      {/* 12. Floating Action Cart Pill */}
      <FloatingCart
        cartItems={cartItems}
        onOpenCart={() => setIsCartOpen(true)}
        lastUpdated={lastCartUpdate}
      />

      {/* 13. Slide-over Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        selectedZone={selectedZone}
      />

      {/* 14. Customer Live Orders Tracking Modal */}
      <CustomerOrdersModal
        isOpen={isCustomerOrdersOpen}
        onClose={() => setIsCustomerOrdersOpen(false)}
        onOpenStoreCatalog={() => {
          setIsCustomerOrdersOpen(false);
          scrollToCategories();
        }}
      />

      {/* 15. Campus Delivery Zone Selector Modal */}
      <AnimatePresence>
        {isZoneModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-sm">Select Campus Location</h3>
                    <p className="text-[11px] text-gray-500">Pick your hostel or campus building</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsZoneModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {CAMPUS_ZONES.map((zone) => {
                  const isSelected = zone.id === selectedZone.id;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => handleSelectZone(zone)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#0A84FF] bg-blue-50/60 shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                          <span>{zone.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#0A84FF]" />}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{zone.block}</div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          ⚡ {zone.estMinutes}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 16. Lightweight Global Toast Message */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#111111] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl border border-white/20 flex items-center gap-2 pointer-events-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFD60A]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
