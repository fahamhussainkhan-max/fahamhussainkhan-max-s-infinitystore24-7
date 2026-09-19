import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Filter } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SearchSection } from './components/SearchSection';
import { DeliveryStatusCard } from './components/DeliveryStatusCard';
import { CategoryGrid } from './components/CategoryGrid';
import { CampusFavourites } from './components/CampusFavourites';
import { LateNightCravings } from './components/LateNightCravings';
import { HostelEssentials } from './components/HostelEssentials';
import { CollegeMode } from './components/CollegeMode';
import { FlashDeals } from './components/FlashDeals';
import { InfinityBrandElement } from './components/InfinityBrandElement';
import { FloatingCart } from './components/FloatingCart';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { ProductCard } from './components/ProductCard';
import { PRODUCTS, CAMPUS_ZONES, COLLEGE_COMBOS } from './data/mockData';
import { Product, CartItem, CampusZone } from './types';

export default function App() {
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
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Delivery zone state
  const [selectedZone, setSelectedZone] = useState<CampusZone>(CAMPUS_ZONES[0]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('infinity_wishlist');
      return saved ? JSON.parse(saved) : ['prod-maggi-masala', 'prod-redbull'];
    } catch {
      return ['prod-maggi-masala', 'prod-redbull'];
    }
  });

  // Combo added feedback tracking
  const [addedCombos, setAddedCombos] = useState<Record<string, boolean>>({});

  // Micro-toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('infinity_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // Save wishlist to local storage
  useEffect(() => {
    try {
      localStorage.setItem('infinity_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  // Cart helper map for O(1) quantity lookups
  const cartQuantities = cartItems.reduce<Record<string, number>>((acc, item) => {
    acc[item.product.id] = item.quantity;
    return acc;
  }, {});

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartPrice = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2400);
  };

  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
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

  const handleToggleWishlist = (productId: string) => {
    setWishlist((prev) => {
      const isAlready = prev.includes(productId);
      if (isAlready) {
        showToast('Removed from saved items');
        return prev.filter((id) => id !== productId);
      }
      showToast('Saved to your campus wishlist ❤️');
      return [...prev, productId];
    });
  };

  const handleAddComboToCart = (comboId: string) => {
    const combo = COLLEGE_COMBOS.find((c) => c.id === comboId);
    if (!combo) return;

    combo.items.forEach((prodId) => {
      const p = PRODUCTS.find((prod) => prod.id === prodId);
      if (p) {
        handleAddToCart(p);
      }
    });

    setAddedCombos((prev) => ({ ...prev, [comboId]: true }));
    showToast(`Added ${combo.title} bundle to cart! ✓`);

    setTimeout(() => {
      setAddedCombos((prev) => ({ ...prev, [comboId]: false }));
    }, 2000);
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

  // Filtered products if user is searching or has clicked a specific category
  const isFiltering = Boolean(searchQuery.trim() || selectedCategory);
  const filteredProducts = PRODUCTS.filter((p) => {
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = query
      ? p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.tags?.some((t) => t.toLowerCase().includes(query))
      : true;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#111111] flex flex-col font-sans selection:bg-[#0A84FF] selection:text-white">
      {/* 1. Header / Navbar with Infinity Store Branding */}
      <Navbar
        selectedZone={selectedZone}
        onOpenZoneSelector={() => {
          const el = document.getElementById('search-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        cartCount={totalCartCount}
        cartTotal={totalCartPrice}
        onOpenCart={() => setIsCartOpen(true)}
        wishlistCount={wishlist.length}
        onScrollToSearch={scrollToSearch}
        onScrollToFavourites={scrollToFavourites}
      />

      {/* 2. Hero: "COLLEGE DELIVERY" EXPERIENCE with 3D scene */}
      <HeroSection
        onShopNow={scrollToFavourites}
        onExploreCategories={scrollToCategories}
      />

      {/* 3. "WHAT DO YOU NEED?" SEARCH EXPERIENCE */}
      <SearchSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectProduct={(p) => {
          handleAddToCart(p);
          showToast(`Added ${p.name.slice(0, 20)}... ✓`);
        }}
        products={PRODUCTS}
      />

      {/* 4. DELIVERY STATUS CARD */}
      <DeliveryStatusCard
        selectedZone={selectedZone}
        onSelectZone={setSelectedZone}
      />

      {/* 5. CATEGORIES GRID (12 Campus Aisles with 3D Tilt) */}
      <CategoryGrid
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Targeted Search / Category Filter View if active */}
      {isFiltering && (
        <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200 shadow-sm mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#0A84FF]" />
              <span className="text-sm font-bold text-gray-900">
                Filtered: {selectedCategory ? selectedCategory.replace('-', ' ') : 'All Aisles'}
                {searchQuery && ` matching "${searchQuery}"`} ({filteredProducts.length} items)
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery('');
              }}
              className="text-xs font-bold text-gray-500 hover:text-black flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-gray-200">
              <p className="text-sm font-bold text-gray-500">No campus items matched your filter.</p>
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery('');
                }}
                className="mt-3 px-4 py-2 bg-[#111111] text-white text-xs font-bold rounded-xl"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  quantityInCart={cartQuantities[prod.id] || 0}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onToastMessage={showToast}
                  isWishlisted={wishlist.includes(prod.id)}
                  onToggleWishlist={handleToggleWishlist}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 12. FLASH DEALS (Limited Campus Inventory with Countdown) */}
      <FlashDeals
        products={PRODUCTS}
        onAddToCart={handleAddToCart}
        cartQuantities={cartQuantities}
        onToastMessage={showToast}
      />

      {/* 6. "CAMPUS FAVOURITES" */}
      <CampusFavourites
        products={PRODUCTS}
        cartQuantities={cartQuantities}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
        onToastMessage={showToast}
        wishlist={wishlist}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* 11. "COLLEGE MODE: ON" (3D composition & emergency kits) */}
      <CollegeMode
        onAddComboToCart={handleAddComboToCart}
        addedCombos={addedCombos}
      />

      {/* 9. "LATE NIGHT CRAVINGS" (Dark Midnight Campus Theme) */}
      <LateNightCravings
        products={PRODUCTS}
        cartQuantities={cartQuantities}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
        onToastMessage={showToast}
        wishlist={wishlist}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* 10. "HOSTEL ESSENTIALS" */}
      <HostelEssentials
        products={PRODUCTS}
        cartQuantities={cartQuantities}
        onAddToCart={handleAddToCart}
        onUpdateQuantity={handleUpdateQuantity}
        onToastMessage={showToast}
        wishlist={wishlist}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* 13. 3D INFINITY BRAND ELEMENT */}
      <InfinityBrandElement />

      {/* 8. FLOATING CART (Desktop bottom-right pill & Mobile sticky bottom) */}
      <FloatingCart
        cartItems={cartItems}
        onOpenCart={() => setIsCartOpen(true)}
        lastUpdated={lastCartUpdate}
      />

      {/* Cart Slide-Over Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        selectedZone={selectedZone}
      />

      {/* Footer */}
      <Footer />

      {/* Micro Non-Intrusive Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#111111]/95 backdrop-blur-md text-white text-xs font-bold shadow-2xl border border-white/15 flex items-center gap-2 pointer-events-none"
          >
            <Check className="w-4 h-4 text-[#30D158]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
