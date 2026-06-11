import React, { useState, useEffect } from 'react';
import { Sparkles, Flame, Clock, ArrowRight, Star, Heart, RefreshCw, Truck, ShieldCheck, Award, Headphones, Send } from 'lucide-react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import HeroSlider from '../components/HeroSlider';
import ProductCard from '../components/ProductCard';
import { Product, Category, SubCategory } from '../types';

interface HomeViewProps {
  products: Product[];
  categories: Category[];
  subcategories: SubCategory[];
  activeCategory: string;
  setActiveCategory: (slug: string) => void;
  activeSubCategory: string;
  setActiveSubCategory: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onAddToCart: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  wishlistIds: string[];
  onSelectProduct: (id: string) => void;
  onBrowseListing?: (initialTag?: string) => void;
  onCompare?: (id: string) => void;
  compareIds?: string[];
}

const ProductSkeleton = () => (
  <div className="glass-card rounded-2xl overflow-hidden h-full flex flex-col animate-pulse">
    <div className="relative pt-[100%] bg-gray-200 dark:bg-gray-800" />
    <div className="p-3 sm:p-4 flex flex-col flex-1 divide-y divide-gray-100 dark:divide-gray-700/50">
      <div className="pb-2 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
        <div className="flex gap-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        </div>
      </div>
      <div className="pt-2 sm:pt-3 flex flex-col gap-2 border-t border-gray-50 mt-auto">
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="h-8 sm:h-9 bg-gray-200 dark:bg-gray-800 rounded-lg sm:rounded-xl w-10 sm:w-12" />
          <div className="h-8 sm:h-9 bg-gray-200 dark:bg-gray-800 rounded-lg sm:rounded-xl flex-[2]" />
        </div>
      </div>
    </div>
  </div>
);

export default function HomeView({
  products,
  categories,
  subcategories,
  activeCategory,
  setActiveCategory,
  activeSubCategory,
  setActiveSubCategory,
  searchQuery,
  setSearchQuery,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  wishlistIds,
  onSelectProduct,
  onBrowseListing,
  onCompare,
  compareIds = [],
}: HomeViewProps) {
  // Countdown states for flash sale
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 28, seconds: 53 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 23, minutes: 59, seconds: 59 }; // reset
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Section data states
  const [flashSaleItems, setFlashSaleItems] = useState<Product[]>([]);
  const [featuredItems, setFeaturedItems] = useState<Product[]>([]);
  const [bestSellerItems, setBestSellerItems] = useState<Product[]>([]);
  const [newArrivalItems, setNewArrivalItems] = useState<Product[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);

  // Fetch sections efficiently with index limits and local cache
  useEffect(() => {
    let isMounted = true;
    
    const fetchSections = async () => {
      // Product Data Caching (Session storage)
      const cachedFlash = sessionStorage.getItem('zm_home_flash');
      const cachedFeatured = sessionStorage.getItem('zm_home_featured');
      const cachedBest = sessionStorage.getItem('zm_home_bestseller');
      const cachedNew = sessionStorage.getItem('zm_home_new');

      if (cachedFlash && cachedFeatured && cachedBest && cachedNew) {
        if (isMounted) {
          setFlashSaleItems(JSON.parse(cachedFlash));
          setFeaturedItems(JSON.parse(cachedFeatured));
          setBestSellerItems(JSON.parse(cachedBest));
          setNewArrivalItems(JSON.parse(cachedNew));
          setLoadingSections(false);
        }
        return;
      }

      setLoadingSections(true);
      try {
        const qBase = collection(db, 'products');

        // Query limits per section
        // Note for indexes: Since 'salePrice > 0' needs index formatting that may not exist natively,
        // we fallback safely. The other 3 single-field inequality indices automatically exist in Firestore.
        const [flashSnap, featSnap, bestSnap, newSnap] = await Promise.all([
          getDocs(query(qBase, where('status', '==', 'active'), where('salePrice', '!=', null), limit(8))).catch(() => null),
          getDocs(query(qBase, where('status', '==', 'active'), where('isFeatured', '==', true), limit(8))).catch(() => null),
          getDocs(query(qBase, where('status', '==', 'active'), where('isBestSeller', '==', true), limit(8))).catch(() => null),
          getDocs(query(qBase, where('status', '==', 'active'), where('isNewArrival', '==', true), limit(8))).catch(() => null),
        ]);

        const mapSnap = (snap: any) => snap ? snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Product)) : [];
        let flash = mapSnap(flashSnap);
        let feat = mapSnap(featSnap);
        let best = mapSnap(bestSnap);
        let arrival = mapSnap(newSnap);

        // Fallback filtering if index errors blocked fetches
        if (!feat.length && !best.length) {
           const activeProducts = products.filter(p => p.status !== 'archived');
           flash = activeProducts.filter(p => !!p.salePrice).slice(0, 8);
           feat = activeProducts.filter(p => p.isFeatured).slice(0, 8);
           best = activeProducts.filter(p => p.isBestSeller).slice(0, 8);
           arrival = activeProducts.filter(p => p.isNewArrival).slice(0, 8);
        }

        if (isMounted) {
          setFlashSaleItems(flash);
          setFeaturedItems(feat);
          setBestSellerItems(best);
          setNewArrivalItems(arrival);
          setLoadingSections(false);
          
          sessionStorage.setItem('zm_home_flash', JSON.stringify(flash));
          sessionStorage.setItem('zm_home_featured', JSON.stringify(feat));
          sessionStorage.setItem('zm_home_bestseller', JSON.stringify(best));
          sessionStorage.setItem('zm_home_new', JSON.stringify(arrival));
        }
      } catch (err) {
        setLoadingSections(false);
      }
    };

    fetchSections();
    return () => { isMounted = false; };
  }, [products]);

  // Filtering products for global search fallback
  const activeProducts = products.filter(p => p.status !== 'archived');
  const filteredProducts = activeProducts.filter((p) => {
    const categoryMatch = activeCategory === 'all' || p.category === activeCategory;
    const searchMatch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(8);

  // Reset infinite scroll on filter change
  useEffect(() => {
    setVisibleCount(8);
  }, [activeCategory, searchQuery]);

  // Observer for intersection
  useEffect(() => {
    if (activeCategory === 'all' && !searchQuery.trim()) return;

    const target = document.querySelector('#infinite-scroll-trigger');
    if (!target) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => prev + 8);
      }
    }, { rootMargin: '200px' });

    observer.observe(target);
    return () => observer.disconnect();
  }, [activeCategory, searchQuery, filteredProducts.length]);

  return (
    <div className="space-y-16 pb-16 font-sans">
      
      {/* Banner slideshow if NOT searching or specific filtering */}
      {activeCategory === 'all' && !searchQuery.trim() && (
        <section className="animate-fadeIn">
          <HeroSlider onCategorySelect={(slug) => {
            setActiveCategory(slug);
            if (onBrowseListing) onBrowseListing();
          }} />

          {/* Thin Feature Bar below Hero */}
          <div className="bg-white rounded-3xl mt-12 py-6 px-4 sm:py-8 sm:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 border border-gray-100 shadow-sm">
             {[
               { icon: <Truck className="w-8 h-8 text-brand-green" />, label: 'Free Delivery', sub: 'On orders over $99' },
               { icon: <ShieldCheck className="w-8 h-8 text-brand-green" />, label: 'Secure Payment', sub: '100% secure payment' },
               { icon: <RefreshCw className="w-8 h-8 text-brand-green" />, label: 'Money Back Guarantee', sub: '30 days money back' },
               { icon: <Headphones className="w-8 h-8 text-brand-green" />, label: '24/7 Support', sub: 'Dedicated support' }
             ].map((f, i) => (
               <div key={i} className="flex items-center gap-4 group">
                  <div className="p-3 bg-brand-green/5 rounded-2xl group-hover:scale-110 transition-transform flex-shrink-0">
                    {f.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-gray-900">{f.label}</span>
                    <span className="text-xs text-gray-400 font-medium">{f.sub}</span>
                  </div>
                  {i < 3 && <div className="hidden lg:block h-12 w-px bg-gray-100 ml-auto" />}
               </div>
             ))}
          </div>
        </section>
      )}

      {/* Categories Showcase section */}
      {activeCategory === 'all' && !searchQuery.trim() && (
        <section className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Shop by Categories</h2>
            <button
              onClick={() => {
                setActiveCategory('all');
                if (onBrowseListing) onBrowseListing('all');
              }}
              className="text-xs font-black text-brand-green hover:underline flex items-center gap-1 cursor-pointer uppercase tracking-wider"
            >
              <span>View All Categories →</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat, idx) => {
              const bgColors = ['bg-[#ecfdf5]', 'bg-[#fff1f2]', 'bg-[#fffbeb]', 'bg-[#eff6ff]'];
              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.slug);
                    if (onBrowseListing) onBrowseListing();
                  }}
                  className={`group relative h-32 sm:h-40 rounded-[1.25rem] sm:rounded-[1.5rem] overflow-hidden ${bgColors[idx % bgColors.length]} p-4 sm:p-6 flex flex-col justify-between hover:scale-[1.02] transition-all cursor-pointer`}
                >
                  <div className="z-10">
                    <h3 className="font-black text-sm sm:text-lg text-gray-900 leading-tight mb-2">
                       {cat.name}
                    </h3>
                    <button className="flex items-center gap-1.5 text-brand-green text-[10px] sm:text-xs font-black group-hover:gap-2.5 transition-all">
                      <span className="hidden sm:inline">Explore Now</span>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-brand-green flex items-center justify-center">
                        <ArrowRight className="w-2 sm:w-2.5 h-2 sm:h-2.5" />
                      </div>
                    </button>
                  </div>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute bottom-0 right-0 h-[70%] sm:h-[85%] object-contain group-hover:scale-105 duration-500 transition-transform"
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Catalog View (If searching or filtering displays list, otherwise standard segments) */}
      {(activeCategory !== 'all' || searchQuery.trim()) ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {searchQuery.trim() ? `Search results for "${searchQuery}"` : categories.find((c) => c.slug === activeCategory)?.name}
              </h2>
              <p className="text-[12px] text-gray-400 font-bold mt-1 uppercase tracking-wider">Found {filteredProducts.length} verified products</p>
            </div>

            {(activeCategory !== 'all' || searchQuery.trim()) && (
              <button
                onClick={() => {
                  setActiveCategory('all');
                  setSearchQuery('');
                }}
                className="text-xs font-black text-brand-green hover:underline flex items-center gap-2 cursor-pointer border-2 border-brand-green/20 px-4 py-2 rounded-xl"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-150 dark:border-gray-800">
              <span className="text-4xl text-gray-400">🔍</span>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mt-3">No matching items found.</p>
              <p className="text-xs text-gray-400 mt-1">Try rewriting your searching keywords or choose another department category.</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {filteredProducts.slice(0, visibleCount).map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={onAddToCart}
                    onBuyNow={onBuyNow}
                    onToggleWishlist={onToggleWishlist}
                    isWishlisted={wishlistIds.includes(p.id)}
                    onSelect={onSelectProduct}
                    onCompare={onCompare}
                    isComparing={compareIds.includes(p.id)}
                  />
                ))}
              </div>
              {visibleCount < filteredProducts.length && (
                <div id="infinite-scroll-trigger" className="h-8 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-green"></div>
                </div>
              )}
            </div>
          )}
        </section>
      ) : (
        /* Default Homepage Sections */
        <>
          {/* Flash Sale Section */}
          <section className="bg-white border border-gray-100 px-4 py-8 sm:px-8 sm:py-10 rounded-[2rem] sm:rounded-[2.5rem] space-y-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
                <div className="flex items-center gap-3">
                  <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 fill-orange-500" />
                  <div className="flex flex-col">
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight">Flash Sale</h2>
                    <p className="text-[10px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-widest leading-none">Hurry up! Limited time</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="hidden sm:block text-[11px] font-black uppercase text-gray-400 mr-2">Ends in:</span>
                  {[
                    { val: timeLeft.hours, label: 'Hrs' },
                    { val: timeLeft.minutes, label: 'Mins' },
                    { val: timeLeft.seconds, label: 'Secs' }
                  ].map((unit, i) => (
                    <React.Fragment key={i}>
                      <div className="flex flex-col items-center">
                        <div className="bg-brand-green text-white font-black text-base sm:text-xl w-10 h-8 sm:w-12 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl">
                          {String(unit.val).padStart(2, '0')}
                        </div>
                        <span className="text-[8px] sm:text-[9px] font-bold uppercase text-gray-400 mt-1">{unit.label}</span>
                      </div>
                      {i < 2 && <span className="font-black text-brand-green mt-1 sm:mb-4">:</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveCategory('all');
                  if (onBrowseListing) onBrowseListing('sale');
                }}
                className="text-[10px] sm:text-xs font-black text-brand-green hover:underline flex items-center gap-1 cursor-pointer uppercase tracking-widest border-2 border-brand-green/10 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl hover:bg-brand-green/5 transition-all w-max"
              >
                View All Deals →
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
              {loadingSections ? (
                Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
              ) : flashSaleItems.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={onAddToCart}
                  onBuyNow={onBuyNow}
                  onToggleWishlist={onToggleWishlist}
                  isWishlisted={wishlistIds.includes(p.id)}
                  onSelect={onSelectProduct}
                  onCompare={onCompare}
                  isComparing={compareIds.includes(p.id)}
                />
              ))}
            </div>
          </section>

          {/* Featured items */}
          {(loadingSections || featuredItems.length > 0) && (
            <section className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-brand-green" />
                  <span>Featured Pickups</span>
                </h2>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    if (onBrowseListing) onBrowseListing('featured');
                  }}
                  className="text-[10px] sm:text-xs font-black text-brand-green hover:underline cursor-pointer uppercase tracking-wider"
                >
                  See All →
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                {loadingSections ? (
                  Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
                ) : featuredItems.slice(0, 8).map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={onAddToCart}
                    onBuyNow={onBuyNow}
                    onToggleWishlist={onToggleWishlist}
                    isWishlisted={wishlistIds.includes(p.id)}
                    onSelect={onSelectProduct}
                    onCompare={onCompare}
                    isComparing={compareIds.includes(p.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Best selling */}
          {(loadingSections || bestSellerItems.length > 0) && (
            <section className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Best Selling Products
                </h2>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    if (onBrowseListing) onBrowseListing('bestseller');
                  }}
                  className="text-xs font-bold text-indigo-655 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  See All Best Sellers →
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {loadingSections ? (
                  Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
                ) : bestSellerItems.slice(0, 8).map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={onAddToCart}
                    onBuyNow={onBuyNow}
                    onToggleWishlist={onToggleWishlist}
                    isWishlisted={wishlistIds.includes(p.id)}
                    onSelect={onSelectProduct}
                    onCompare={onCompare}
                    isComparing={compareIds.includes(p.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* New Arrivals */}
          {(loadingSections || newArrivalItems.length > 0) && (
            <section className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  New Arrivals
                </h2>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    if (onBrowseListing) onBrowseListing('new');
                  }}
                  className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  See All New Arrivals →
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {loadingSections ? (
                  Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
                ) : newArrivalItems.slice(0, 8).map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onAddToCart={onAddToCart}
                    onBuyNow={onBuyNow}
                    onToggleWishlist={onToggleWishlist}
                    isWishlisted={wishlistIds.includes(p.id)}
                    onSelect={onSelectProduct}
                    onCompare={onCompare}
                    isComparing={compareIds.includes(p.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* why Choose AFD HOUSE Section (Section 8) */}
          <section className="space-y-10 pt-10">
            <div className="text-center max-w-xl mx-auto space-y-4">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                Why Choose Us
              </h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">We prioritize premium service, absolute quality compliance, and total consumer safety.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {[
                {
                  icon: <Truck className="w-7 h-7 text-brand-green" />,
                  title: "Fast Delivery",
                  description: "Countrywide home delivery with cash on delivery."
                },
                {
                  icon: <ShieldCheck className="w-7 h-7 text-brand-green" />,
                  title: "Secure Payment",
                  description: "100% encrypted, risk-free checkout system."
                },
                {
                  icon: <Award className="w-7 h-7 text-brand-green" />,
                  title: "Quality Products",
                  description: "Carefully curated clothes and premium electronics."
                },
                {
                  icon: <Headphones className="w-7 h-7 text-brand-green" />,
                  title: "24/7 Support",
                  description: "Access dedicated customer agents at any hour."
                }
              ].map((card, idx) => (
                <div
                  key={idx}
                  className="p-6 sm:p-10 bg-white border border-gray-100 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center space-y-4 sm:space-y-6"
                >
                  <div className="p-3 sm:p-4 bg-emerald-50 rounded-2xl border border-brand-green/20">
                    {card.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-base sm:text-lg text-gray-900 tracking-tight">
                      {card.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-gray-500 font-medium leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Customer Reviews Section (Section 9) */}
          <section className="space-y-6 pt-6 animate-fadeIn">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-gray-905 dark:text-white mt-1 tracking-tight uppercase">
                Customer Reviews
              </h2>
              <p className="text-xs text-gray-550">Read absolute statements of satisfaction from verified shoppers.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
              {[
                {
                  quote: "AFD HOUSE changed my clothing style completely! The Classic Men's charcoal suit fitted me as if it were bespoke standard tailor made. Superfast Dhaka home delivery.",
                  author: "Tasnim Chowdhury",
                  title: "Sarker Apparel Group",
                  stars: 5,
                  pfp: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
                },
                {
                  quote: "Incredible headphones noise cancelling! Standard comparable sound fidelity to international brands worth double the price. Outstanding customer care response times.",
                  author: "Adnan Al Hasan",
                  title: "Software Engineer, Brain Station",
                  stars: 5,
                  pfp: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150"
                },
                {
                  quote: "Soft cotton pajamas indeed! My daughters keep jumping around in them. Water barrier jackets were very supportive during early pre-season monsoon rains. Full marks!",
                  author: "Maria Islam",
                  title: "Concerned Mother",
                  stars: 5,
                  pfp: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
                }
              ].map((testi, i) => (
                <div
                  key={i}
                  className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl space-y-4 flex flex-col justify-between relative shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-450 italic leading-relaxed">
                    "{testi.quote}"
                  </p>
                  
                  <div className="flex items-center gap-3 border-t border-gray-150 dark:border-slate-800/20 pt-4">
                    <img
                      src={testi.pfp}
                      alt={testi.author}
                      className="w-10 h-10 object-cover rounded-full border-2 border-indigo-400"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-805 dark:text-gray-200">{testi.author}</p>
                      <p className="text-[10px] text-gray-400">{testi.title}</p>
                      <div className="flex text-amber-400 mt-1">
                        {[...Array(testi.stars)].map((_, s) => (
                          <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Newsletter Section (Section 10) */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-indigo-700 via-indigo-650 to-orange-500 p-8 sm:p-12 text-white shadow-2xl animate-fadeIn font-sans">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent)]" />
            
            <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6">
              <span className="bg-white/20 border border-white/25 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-[#facc15]">
                Unlock ৳500 Coupon Code
              </span>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-none">
                Subscribe to Our Newsletter
              </h2>
              <p className="text-xs sm:text-sm text-indigo-100 max-w-lg mx-auto">
                Sign up today to get exclusive discounts, new arrival announcements, and an instant <strong className="text-yellow-300">৳500 off voucher</strong> straight to your inbox.
              </p>

              <NewsletterInlineForm />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function NewsletterInlineForm() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <form onSubmit={handleSubscribe} className="space-y-3 font-sans">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto">
        <input
          type="email"
          placeholder="Enter your personal email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full text-sm px-4 py-3 rounded-xl focus:outline-none bg-white text-gray-901 border border-transparent shadow-sm placeholder-gray-400 focus:ring-2 focus:ring-amber-300 transition-all font-medium"
          required
        />
        <button
          type="submit"
          className="w-full sm:w-auto bg-gray-900 hover:bg-black text-yellow-300 font-extrabold text-xs tracking-wider uppercase px-6 py-3.5 rounded-xl shadow-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Subscribe Now</span>
        </button>
      </div>
      {subscribed && (
        <div className="animate-fadeIn mt-2 inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl">
          <span>✔ Coupon applied successfully! Check email.</span>
        </div>
      )}
    </form>
  );
}
