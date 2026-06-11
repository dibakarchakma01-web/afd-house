import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SlidersHorizontal, 
  ChevronDown, 
  Star, 
  Search, 
  X, 
  RefreshCw, 
  Filter, 
  AlertCircle,
  LayoutGrid,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Heart,
  Tag,
  ArrowRightLeft
} from 'lucide-react';
import { Product, Category, SubCategory, Brand } from '../types';
import ProductCard from '../components/ProductCard';

interface ProductListingViewProps {
  products: Product[];
  categories: Category[];
  subcategories: SubCategory[];
  brands: Brand[];
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
  onBackToHome: () => void;
  initialTag?: string;
  onCompare?: (id: string) => void;
  compareIds?: string[];
}

export default function ProductListingView({
  products,
  categories,
  subcategories,
  brands,
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
  onBackToHome,
  initialTag,
  onCompare,
  compareIds = [],
}: ProductListingViewProps) {
  // Navigation & Displays States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filters local states
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<string>('all'); // 'all' | 'under-1000' | '1000-3000' | '3000-5000' | 'over-5000' | 'custom'
  const [customMinPrice, setCustomMinPrice] = useState<string>('');
  const [customMaxPrice, setCustomMaxPrice] = useState<string>('');
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>(initialTag || 'all'); // 'all' | 'sale' | 'featured' | 'new' | 'bestseller'
  const [sortBy, setSortBy] = useState<string>('featured'); // 'featured' | 'price-asc' | 'price-desc' | 'rating-desc' | 'newest' | 'bestseller'

  // Mobile filters sidebar toggle
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync external searchQuery with local state when it updates
  React.useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Sync external initialTag when it updates
  React.useEffect(() => {
    if (initialTag) {
      setSelectedTag(initialTag);
    }
  }, [initialTag]);

  // Reset page when search or filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery, selectedBrand, priceRange, customMinPrice, customMaxPrice, selectedRating, showInStockOnly, selectedTag, sortBy]);

  // Handle Search Input Change
  const handleSearchKeyPress = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
  };

  // Predefined price ranges criteria resolver
  const resolvePriceFilter = (p: Product) => {
    const finalPrice = p.salePrice || p.price;
    if (priceRange === 'all') return true;
    if (priceRange === 'under-1000') return finalPrice < 1000;
    if (priceRange === '1000-3000') return finalPrice >= 1000 && finalPrice <= 3000;
    if (priceRange === '3000-5000') return finalPrice >= 3000 && finalPrice <= 5000;
    if (priceRange === 'over-5000') return finalPrice > 5000;
    if (priceRange === 'custom') {
      const min = customMinPrice ? parseFloat(customMinPrice) : 0;
      const max = customMaxPrice ? parseFloat(customMaxPrice) : Infinity;
      return finalPrice >= min && finalPrice <= max;
    }
    return true;
  };

  // Perform multi-criteria item filtering
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Basic status check
      if (p.status === 'archived') return false;
      // Category match check
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory;

      // Subcategory match check
      const matchesSubCategory = activeSubCategory === 'all' || p.subcategory === activeSubCategory;

      // Brand selection check
      const matchesBrand = selectedBrand === 'all' || p.brand?.toLowerCase() === selectedBrand.toLowerCase();

      // Local keyword match check
      const queryStr = searchQuery.trim().toLowerCase();
      const matchesSearch = !queryStr || 
        p.name.toLowerCase().includes(queryStr) || 
        p.description.toLowerCase().includes(queryStr) ||
        (p.brand && p.brand.toLowerCase().includes(queryStr)) ||
        (p.sku && p.sku.toLowerCase().includes(queryStr)) ||
        p.category.toLowerCase().includes(queryStr);

      // Price criteria check
      const matchesPrice = resolvePriceFilter(p);

      // Star ratings criteria check
      const matchesRating = selectedRating === null || p.rating >= selectedRating;

      // Inventory check
      const matchesStock = !showInStockOnly || p.stock > 0;

      // Special visual tag checks
      let matchesTag = true;
      if (selectedTag === 'sale') matchesTag = !!p.salePrice;
      if (selectedTag === 'featured') matchesTag = !!p.isFeatured;
      if (selectedTag === 'new') matchesTag = !!p.isNewArrival;
      if (selectedTag === 'bestseller') matchesTag = !!p.isBestSeller;

      return matchesCategory && matchesSubCategory && matchesBrand && matchesSearch && matchesPrice && matchesRating && matchesStock && matchesTag;
    });
  }, [products, activeCategory, activeSubCategory, selectedBrand, searchQuery, priceRange, customMinPrice, customMaxPrice, selectedRating, showInStockOnly, selectedTag]);

  // Order sorting criteria implementation
  const sortedProducts = useMemo(() => {
    const items = [...filteredProducts];
    if (sortBy === 'price-asc') {
      items.sort((a, b) => {
        const pA = a.salePrice || a.price;
        const pB = b.salePrice || b.price;
        return pA - pB;
      });
    } else if (sortBy === 'price-desc') {
      items.sort((a, b) => {
        const pA = a.salePrice || a.price;
        const pB = b.salePrice || b.price;
        return pB - pA;
      });
    } else if (sortBy === 'rating-desc') {
      items.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'bestseller') {
      items.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
    }
    return items;
  }, [filteredProducts, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(start, start + itemsPerPage);
  }, [sortedProducts, currentPage]);

  // Quick reset for all filters parameters
  const handleClearAllFilters = () => {
    setActiveCategory('all');
    setActiveSubCategory('all');
    setSelectedBrand('all');
    setSearchQuery('');
    setLocalSearch('');
    setSelectedRating(null);
    setPriceRange('all');
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setShowInStockOnly(false);
    setSelectedTag('all');
    setSortBy('featured');
    setCurrentPage(1);
  };

  // Determine current category label for heading
  const currentCategoryLabel = useMemo(() => {
    if (activeCategory === 'all') return 'All Collections';
    const found = categories.find((c) => c.slug === activeCategory);
    return found ? found.name : activeCategory;
  }, [activeCategory, categories]);

  return (
    <div className="space-y-6 pt-2 font-sans pb-12 animate-fadeIn">
      
      {/* Top Banner & Navigation Helper Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
            <button onClick={onBackToHome} className="hover:text-indigo-600 cursor-pointer font-bold">AFD HOUSE</button>
            <span>/</span>
            <button 
              onClick={() => {
                setActiveSubCategory('all');
              }}
              className="hover:text-indigo-600 capitalize cursor-pointer font-bold"
            >
              {currentCategoryLabel}
            </button>
            {activeSubCategory !== 'all' && (
              <>
                <span>/</span>
                <span className="text-gray-900 dark:text-gray-200 capitalize font-bold">
                  {subcategories.find(sc => sc.slug === activeSubCategory)?.name || activeSubCategory}
                </span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
            {currentCategoryLabel} Catalog
          </h1>
          <p className="text-xs text-gray-550 mt-1">
            Showing <strong className="text-indigo-600 dark:text-indigo-400">{sortedProducts.length}</strong> authenticated products matching filters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Layout buttons */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-gray-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold' 
                  : 'text-gray-400 dark:text-gray-450 hover:text-gray-600'
              }`}
              title="Display Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold' 
                  : 'text-gray-400 dark:text-gray-450 hover:text-gray-600'
              }`}
              title="Display List"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onBackToHome}
            className="text-xs font-bold text-gray-600 dark:text-gray-200 bg-gray-100 dark:bg-slate-800 hover:bg-gray-250 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl transition duration-150 cursor-pointer"
          >
            ← Back to Home
          </button>
          
          {/* Mobile Filter Trigger Button */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-1.5 text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2.5 rounded-xl transition-all shadow-md cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Advanced Control Row: Applied Badges & Sort Menu */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-150 dark:border-slate-850">
        
        {/* Sorting Dropdown Selection */}
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 animate-fadeIn">
          <span className="font-semibold text-gray-400 uppercase tracking-wider text-[10px]">Sort By:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-slate-50 dark:bg-slate-800 border border-gray-205 dark:border-slate-700 rounded-xl px-3 py-2 pr-8 font-bold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-xs"
            >
              <option value="featured">Most Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Top Rated</option>
              <option value="newest">Newest Arrivals</option>
              <option value="bestseller">Best Selling</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Current Active Filter badging status */}
        <div className="flex flex-wrap items-center gap-2">
          {activeCategory !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-605 dark:text-indigo-400 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
              Department: {currentCategoryLabel}
              <button onClick={() => setActiveCategory('all')} className="hover:text-red-500 cursor-pointer" title="Remove Category Filter">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedBrand !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-605 dark:text-indigo-400 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
              Brand: {selectedBrand}
              <button onClick={() => setSelectedBrand('all')} className="hover:text-red-500 cursor-pointer" title="Remove Brand Filter">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {searchQuery.trim() !== '' && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-605 dark:text-indigo-400 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
              Keyword: "{searchQuery}"
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setLocalSearch('');
                }} 
                className="hover:text-red-500 cursor-pointer" 
                title="Clear Search Keyword"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {priceRange !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-605 dark:text-indigo-400 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
              Price: {priceRange === 'custom' ? `৳${customMinPrice || 0}-৳${customMaxPrice || 'Max'}` : priceRange.replace('-', ' ')}
              <button onClick={() => setPriceRange('all')} className="hover:text-red-500 cursor-pointer" title="Clear Price Filter">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedRating !== null && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-605 dark:text-indigo-400 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
              Rating: {selectedRating}+ Stars
              <button onClick={() => setSelectedRating(null)} className="hover:text-red-500 cursor-pointer" title="Clear Rating Filter">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedTag !== 'all' && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-605 dark:text-indigo-400 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
              Tag: {selectedTag}
              <button onClick={() => setSelectedTag('all')} className="hover:text-red-500 cursor-pointer" title="Clear Tag Filter">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {showInStockOnly && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-605 dark:text-indigo-400 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
              In Stock Only
              <button onClick={() => setShowInStockOnly(false)} className="hover:text-red-500 cursor-pointer" title="Clear Availability Filter">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {(activeCategory !== 'all' || selectedBrand !== 'all' || searchQuery.trim() !== '' || priceRange !== 'all' || selectedRating !== null || selectedTag !== 'all' || showInStockOnly) && (
            <button
              onClick={handleClearAllFilters}
              className="text-xs font-bold text-orange-550 dark:text-orange-400 hover:underline flex items-center gap-1 pl-2"
              title="Reset All Parameters"
            >
              <RefreshCw className="w-3 h-3 animate-spin duration-1000" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* DESKTOP SIDEBAR FILTERS SYSTEM (Left Grid Column) */}
        <div className="hidden lg:block space-y-6 bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-gray-150 dark:border-slate-800 self-start sticky" style={{ top: '110px' }}>
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white tracking-tight uppercase flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-indigo-650" />
              <span>Refine Catalog</span>
            </h3>
            <button
              onClick={handleClearAllFilters}
              className="text-[10px] font-bold text-gray-400 hover:text-indigo-600 cursor-pointer uppercase tracking-wider"
              title="Reset all filters"
            >
              Clear All
            </button>
          </div>

          {/* Search Input inline box */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-gray-900 dark:text-gray-150 uppercase tracking-wider">Search Keywords</h4>
            <form onSubmit={handleSearchKeyPress} className="relative">
              <input
                type="text"
                placeholder="Type keywords..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-gray-905 dark:text-gray-150 border border-gray-205 dark:border-slate-700 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-indigo-600" title="Submit Search Query">
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Categories Sidebar links list */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-gray-900 dark:text-gray-150 uppercase tracking-wider">Department</h4>
            <div className="flex flex-col gap-1.5 text-xs">
              <button
                onClick={() => setActiveCategory('all')}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                  activeCategory === 'all' 
                    ? 'bg-indigo-600 text-white font-bold' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span>All Departments</span>
                <span className="text-[10px] opacity-75">{products.length}</span>
              </button>
              {categories.map((cat) => {
                const totalItemCount = products.filter((p) => p.category === cat.slug).length;
                const isSelected = activeCategory === cat.slug;
                const subcats = subcategories.filter(sc => sc.categoryId === cat.slug);
                return (
                  <div key={cat.id} className="flex flex-col gap-1 text-xs">
                    <button
                      onClick={() => {
                        setActiveCategory(cat.slug);
                        setActiveSubCategory('all');
                      }}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-600 text-white font-bold' 
                          : 'text-gray-650 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="capitalize">{cat.name}</span>
                      <span className="text-[10px] opacity-75">{totalItemCount}</span>
                    </button>

                    {/* Indented Subcategories when Category is selected */}
                    {isSelected && subcats.length > 0 && (
                      <div className="pl-3.5 pr-1 py-1 space-y-1 bg-slate-50/50 dark:bg-slate-800/20 rounded-lg flex flex-col border border-gray-100/50 dark:border-slate-800/50 mt-0.5 sm:mt-1">
                        <button
                          onClick={() => setActiveSubCategory('all')}
                          className={`text-left py-1 px-1.5 rounded text-[11px] font-bold ${
                            activeSubCategory === 'all' 
                              ? 'text-indigo-600 font-extrabold' 
                              : 'text-gray-500 hover:text-indigo-600 dark:text-gray-450'
                          }`}
                        >
                          All in {cat.name}
                        </button>
                        {subcats.map(sub => {
                          const subItemCount = products.filter(p => p.category === cat.slug && p.subcategory === sub.slug).length;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => setActiveSubCategory(sub.slug)}
                              className={`text-left py-1 px-1.5 rounded text-[11px] flex justify-between items-center ${
                                activeSubCategory === sub.slug 
                                  ? 'text-indigo-600 font-extrabold bg-indigo-50/10 hover:text-indigo-650' 
                                  : 'text-gray-500 hover:text-indigo-600 dark:text-gray-450'
                              }`}
                            >
                              <span className="truncate">{sub.name}</span>
                              <span className="text-[9px] opacity-60">({subItemCount})</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* BRANDS SIDEBAR SELECTOR (LIVE CLOUD) */}
          <div className="space-y-2 border-t border-gray-100 dark:border-slate-800/50 pt-4">
            <h4 className="font-bold text-xs text-gray-900 dark:text-gray-150 uppercase tracking-wider">Brand Name</h4>
            <div className="flex flex-col gap-1.5 text-xs max-h-48 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedBrand('all')}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                  selectedBrand === 'all' 
                    ? 'bg-indigo-605 dark:bg-indigo-600 text-white font-bold' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span>All Brands</span>
                <span className="text-[10px] opacity-75">{products.length}</span>
              </button>
              {brands.map((b) => {
                const brandItemCount = products.filter((p) => p.brand?.toLowerCase() === b.name.toLowerCase()).length;
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBrand(b.name)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      selectedBrand.toLowerCase() === b.name.toLowerCase()
                        ? 'bg-indigo-605 dark:bg-indigo-600 text-white font-bold' 
                        : 'text-gray-650 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <span>{b.name}</span>
                    <span className="text-[10px] opacity-75">{brandItemCount}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing slider range picker */}
          <div className="space-y-2 border-t border-gray-100 dark:border-slate-800/50 pt-4">
            <h4 className="font-bold text-xs text-gray-900 dark:text-gray-105 uppercase tracking-wider">Price Options</h4>
            <div className="flex flex-col gap-1.5 text-xs text-gray-650 dark:text-gray-400">
              {[
                { label: 'Any Price', val: 'all' },
                { label: 'Under ৳1,000', val: 'under-1000' },
                { label: '৳1,000 - ৳3,000', val: '1000-3000' },
                { label: '৳3,000 - ৳5,000', val: '3000-5000' },
                { label: 'Over ৳5,000', val: 'over-5000' },
                { label: 'Custom Range', val: 'custom' },
              ].map((opt) => (
                <label key={opt.val} className="flex items-center gap-2 cursor-pointer py-0.5">
                  <input
                    type="radio"
                    name="priceRangeGroup"
                    checked={priceRange === opt.val}
                    onChange={() => setPriceRange(opt.val)}
                    className="accent-indigo-600 text-xs cursor-pointer"
                  />
                  <span className={priceRange === opt.val ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'hover:text-gray-800 dark:hover:text-gray-200 text-gray-500'}>{opt.label}</span>
                </label>
              ))}

              {/* Custom Numeric Price range input blocks */}
              {priceRange === 'custom' && (
                <div className="grid grid-cols-2 gap-2 pt-2 animate-fadeIn">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Min Price</span>
                    <input
                      type="number"
                      placeholder="৳ Min"
                      value={customMinPrice}
                      onChange={(e) => setCustomMinPrice(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-905 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase">Max Price</span>
                    <input
                      type="number"
                      placeholder="৳ Max"
                      value={customMaxPrice}
                      onChange={(e) => setCustomMaxPrice(e.target.value)}
                      className="w-full text-xs px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-905 focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product special badge / tags tags selection */}
          <div className="space-y-2 border-t border-gray-100 dark:border-slate-800/50 pt-4">
            <h4 className="font-bold text-xs text-gray-900 dark:text-gray-150 uppercase tracking-wider">Product Tags</h4>
            <div className="flex flex-col gap-1.5 text-xs text-gray-650 dark:text-gray-400">
              {[
                { label: 'All Products', val: 'all' },
                { label: '🏷️ On Discount Sale', val: 'sale' },
                { label: '⭐ Featured Picks', val: 'featured' },
                { label: '🆕 New Arrival', val: 'new' },
                { label: '🔥 Best Selling Items', val: 'bestseller' },
              ].map((tag) => (
                <label key={tag.val} className="flex items-center gap-2 cursor-pointer py-0.5">
                  <input
                    type="radio"
                    name="tagFilterGroup"
                    checked={selectedTag === tag.val}
                    onChange={() => setSelectedTag(tag.val)}
                    className="accent-indigo-600 text-xs cursor-pointer"
                  />
                  <span className={selectedTag === tag.val ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'hover:text-gray-800 dark:hover:text-gray-200 text-gray-500'}>{tag.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Verified Customer Reviews criteria stars */}
          <div className="space-y-2 border-t border-gray-100 dark:border-slate-800/50 pt-4">
            <h4 className="font-bold text-xs text-gray-900 dark:text-gray-150 uppercase tracking-wider">Customer Reviews</h4>
            <div className="flex flex-col gap-1.5 text-xs">
              <button
                onClick={() => setSelectedRating(null)}
                className={`text-left py-0.5 transition-colors cursor-pointer text-gray-505 dark:text-gray-400 ${selectedRating === null ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'hover:text-gray-900 dark:hover:text-gray-200'}`}
              >
                All Ratings
              </button>
              {[4, 3, 2].map((stars) => {
                const totalMatching = products.filter((p) => p.rating >= stars).length;
                return (
                  <button
                    key={stars}
                    onClick={() => setSelectedRating(stars)}
                    className={`flex items-center gap-1 py-0.5 text-left transition-colors cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-900 ${
                      selectedRating === stars ? 'font-bold text-indigo-600 dark:text-indigo-400' : ''
                    }`}
                    title={`${stars} Stars & Up filter option`}
                  >
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} className={`w-3 h-3 ${s < stars ? 'fill-amber-400 text-amber-400' : 'text-gray-150 dark:text-gray-750'}`} />
                      ))}
                    </div>
                    <span>& Up ({totalMatching})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Availability checkbox parameter */}
          <div className="space-y-2 border-t border-gray-100 dark:border-slate-800/50 pt-4">
            <h4 className="font-bold text-xs text-gray-900 dark:text-gray-105 uppercase tracking-wider">Availability</h4>
            <label className="flex items-center gap-2 text-xs text-gray-650 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showInStockOnly}
                onChange={(e) => setShowInStockOnly(e.target.checked)}
                className="rounded accent-indigo-600 text-xs cursor-pointer"
              />
              <span className={showInStockOnly ? 'font-bold text-indigo-605 dark:text-indigo-400' : 'text-gray-500'}>In Stock Only</span>
            </label>
          </div>
        </div>

        {/* PRODUCTS DIRECTORY CONTENT ROW (Right 3 Columns grid) */}
        <div className="lg:col-span-3 space-y-6">
          
          {sortedProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 bg-gray-50 dark:bg-slate-900/50 rounded-3xl border border-gray-150 dark:border-slate-800 p-8"
            >
              <div className="bg-orange-100 dark:bg-orange-950/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-200 dark:border-orange-900/30 animate-pulse">
                <AlertCircle className="w-8 h-8 text-orange-555" />
              </div>
              <h3 className="font-extrabold text-lg text-gray-900 dark:text-white tracking-tight">No Matching Catalog Items</h3>
              <p className="text-gray-450 text-xs max-w-sm mx-auto mt-2 leading-relaxed">
                We couldn't locate any products matching your specific combination of filters. Try clearing some refine parameters or browsing another department category.
              </p>
              <button
                onClick={handleClearAllFilters}
                className="mt-6 bg-indigo-605 hover:bg-indigo-705 text-white text-xs font-bold px-6 py-2.8 rounded-xl shadow-lg shadow-indigo-650/25 transition-all duration-150 cursor-pointer"
              >
                Clear All Filters
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              
              {/* Dynamic products list grid switcher */}
              {viewMode === 'grid' ? (
                <motion.div 
                  layout
                  className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-fadeIn"
                >
                  <AnimatePresence mode="popLayout">
                    {paginatedProducts.map((p) => (
                      <motion.div
                        layout
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ProductCard
                          product={p}
                          onAddToCart={onAddToCart}
                          onBuyNow={onBuyNow}
                          onToggleWishlist={onToggleWishlist}
                          isWishlisted={wishlistIds.includes(p.id)}
                          onSelect={onSelectProduct}
                          onCompare={onCompare}
                          isComparing={compareIds.includes(p.id)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                /* Sleek Custom Horizontal LIST Row cards */
                <div className="flex flex-col gap-4 animate-fadeIn">
                  {paginatedProducts.map((p) => {
                    const isDiscounted = !!p.salePrice && p.salePrice < p.price;
                    const discountPct = isDiscounted ? Math.round(((p.price - p.salePrice!) / p.price) * 100) : 0;
                    const isWishlisted = wishlistIds.includes(p.id);
                    return (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => onSelectProduct(p.id)}
                        className="group flex flex-col md:flex-row bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-850 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer p-4 select-none relative gap-5"
                      >
                        {/* Thumbnail on left */}
                        <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden relative shrink-0 bg-gray-50 dark:bg-gray-800/40">
                          <img
                            referrerPolicy="no-referrer"
                            src={p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-103 duration-300 transition-transform"
                          />
                          
                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {isDiscounted && (
                              <span className="bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
                                Save {discountPct}%
                              </span>
                            )}
                            {p.isBestSeller && (
                              <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
                                Best Seller
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Mid Meta specifications detail */}
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            {/* Stars ratings */}
                            <div className="flex items-center gap-1 text-[11px] text-amber-500 mb-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-bold">{p.rating}</span>
                              <span className="text-gray-450">({p.reviewsCount} Buyer Reviews)</span>
                              {p.sku && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded ml-3 font-mono text-[9px] text-gray-500 tracking-tight">SKU: {p.sku}</span>}
                              {p.brand && <span className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 px-1.5 py-0.5 rounded ml-1 font-bold text-[9px] uppercase tracking-wider">Brand: {p.brand}</span>}
                            </div>

                            <h3 className="text-md sm:text-lg font-bold text-gray-850 dark:text-white group-hover:text-indigo-650 transition">
                              {p.name}
                            </h3>
                            
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                              {p.description}
                            </p>

                            {p.tags && p.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {p.tags.map((tag) => (
                                  <span key={tag} className="inline-flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800 text-gray-400 text-[9px] font-semibold px-2 py-0.5 rounded-md border border-gray-150 dark:border-slate-700/60 font-mono">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between border-t border-gray-50 dark:border-slate-800 pt-3 mt-4">
                            {/* Stock and Price details */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">৳{p.salePrice || p.price}</span>
                                {isDiscounted && <span className="text-xs text-gray-400 line-through">৳{p.price}</span>}
                              </div>
                              {p.stock <= 0 ? (
                                <span className="text-xs text-rose-500 font-semibold uppercase tracking-wider font-sans">SOLD OUT</span>
                              ) : p.stock <= 10 ? (
                                <span className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900/35 font-bold font-sans">Only {p.stock} Unit Left!</span>
                              ) : (
                                <span className="text-xs text-teal-600 dark:text-teal-400 font-medium font-sans">Active In Stock ({p.stock})</span>
                              )}
                            </div>

                            {/* CTAs */}
                            <div className="flex items-center gap-2">
                              {/* Compare */}
                              {onCompare && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCompare(p.id);
                                  }}
                                  className={`p-2 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-850 hover:scale-105 duration-150 ${compareIds.includes(p.id) ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/50' : 'text-gray-400 dark:text-gray-300'}`}
                                  title="Compare item"
                                >
                                  <ArrowRightLeft className={`w-4 h-4 ${compareIds.includes(p.id) ? 'stroke-[3]' : ''}`} />
                                </button>
                              )}

                              {/* Wishlist */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleWishlist(p);
                                }}
                                className={`p-2 rounded-xl border border-gray-200 dark:border-slate-750 bg-white dark:bg-slate-850 hover:scale-105 duration-150 ${isWishlisted ? 'text-rose-500' : 'text-gray-400 dark:text-gray-300'}`}
                                title="Wishlist save item"
                              >
                                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                              </button>

                              {/* Cart button */}
                              <button
                                disabled={p.stock <= 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToCart(p);
                                }}
                                className="flex items-center gap-1.5 text-xs bg-indigo-650 hover:bg-indigo-705 disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:text-gray-400 text-white px-4 py-2.5 rounded-xl font-bold font-mono transition shadow-md cursor-pointer"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>Add To Cart</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* PAGINATION CONTROLS (6 items per page standard) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-6 border-t border-gray-100 dark:border-slate-850 select-none">
                  {/* Prev Button */}
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((c) => Math.max(c - 1, 1))}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-750 text-gray-500 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-zinc-50 dark:hover:bg-slate-800/60 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Numbers List */}
                  <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto sm:overflow-visible no-scrollbar max-w-[200px] sm:max-w-none">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => {
                      // Simple logic to show current, first, last and 1 neighboring page on mobile
                      const isVisible = 
                        totalPages <= 5 || 
                        pNum === 1 || 
                        pNum === totalPages || 
                        Math.abs(pNum - currentPage) <= 1;

                      if (!isVisible) {
                        if (pNum === 2 || pNum === totalPages - 1) {
                           return <span key={pNum} className="text-gray-400">...</span>;
                        }
                        return null;
                      }

                      return (
                        <button
                          key={pNum}
                          onClick={() => setCurrentPage(pNum)}
                          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition flex items-center justify-center shrink-0 cursor-pointer ${
                            currentPage === pNum
                              ? 'bg-indigo-605 dark:bg-indigo-600 text-white shadow-md shadow-indigo-650/15'
                              : 'border border-gray-200 dark:border-slate-750 text-gray-600 dark:text-gray-350 bg-white dark:bg-slate-900 hover:bg-zinc-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          {pNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((c) => Math.min(c + 1, totalPages))}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-750 text-gray-500 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-zinc-50 dark:hover:bg-slate-800/60 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE DRAWER FILTER DRAWER/MODAL PANELS */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            {/* Backdrop slide click overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFiltersOpen(false)}
              className="fixed inset-0 bg-black z-50 lg:hidden"
            />

            {/* Mobile Drawer Slide-out container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white dark:bg-slate-950 shadow-2xl z-55 flex flex-col lg:hidden border-l border-gray-150 dark:border-slate-800"
            >
              {/* Drawer Title Block */}
              <div className="flex items-center justify-between p-4 border-b border-gray-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4.5 h-4.5 text-indigo-600" />
                  <span className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">Refine Options</span>
                </div>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-650 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-transparent dark:border-slate-700 cursor-pointer"
                  title="Close Drawers filter"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer main scrollable filters forms content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* Search In-drawer */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-xs text-gray-900 dark:text-gray-150 uppercase tracking-widest">Search Keywords</h5>
                  <form onSubmit={(e) => { e.preventDefault(); setSearchQuery(localSearch); setMobileFiltersOpen(false); }} className="relative">
                    <input
                      type="text"
                      placeholder="Search inside results..."
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-gray-905 border-0 focus:outline-none"
                    />
                    <button type="submit" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 focus:outline-none" title="Submit Drawer Search">
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-xs text-gray-900 dark:text-gray-150 uppercase tracking-widest">Department</h5>
                  <div className="grid grid-cols-1 gap-1">
                    <button
                      onClick={() => { setActiveCategory('all'); setMobileFiltersOpen(false); }}
                      className={`text-xs px-3 py-2 rounded-lg text-left transition-all ${
                        activeCategory === 'all' ? 'bg-indigo-650 text-white font-bold' : 'bg-slate-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      All Departments ({products.length})
                    </button>
                    {categories.map((cat) => {
                      const count = products.filter((p) => p.category === cat.slug).length;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => { setActiveCategory(cat.slug); setMobileFiltersOpen(false); }}
                          className={`text-xs px-3 py-2 rounded-lg text-left transition-all capitalize ${
                            activeCategory === cat.slug ? 'bg-indigo-650 text-white font-bold' : 'bg-slate-50 dark:bg-slate-800 text-gray-650 dark:text-gray-400'
                          }`}
                        >
                          {cat.name} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Brands mobile */}
                <div className="space-y-2">
                  <h5 className="font-extrabold text-xs text-gray-900 dark:text-gray-150 uppercase tracking-widest">Brands</h5>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => { setSelectedBrand('all'); setMobileFiltersOpen(false); }}
                      className={`text-[11px] px-2 py-1.8 rounded-lg text-left transition-all ${
                        selectedBrand === 'all' ? 'bg-indigo-650 text-white font-bold' : 'bg-zinc-100 dark:bg-slate-800 text-gray-650 dark:text-gray-400'
                      }`}
                    >
                      All Brands
                    </button>
                    {brands.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => { setSelectedBrand(b.name); setMobileFiltersOpen(false); }}
                        className={`text-[11px] px-2 py-1.8 rounded-lg text-left transition-all capitalize ${
                          selectedBrand.toLowerCase() === b.name.toLowerCase() ? 'bg-indigo-650 text-white font-bold' : 'bg-zinc-100 dark:bg-slate-800 text-gray-650 dark:text-gray-400'
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range selector */}
                <div className="space-y-2 border-t border-gray-100 dark:border-slate-800 pt-4">
                  <h5 className="font-extrabold text-xs text-gray-900 dark:text-gray-150 uppercase tracking-widest">Price Options</h5>
                  <div className="space-y-1.5 flex flex-col">
                    {[
                      { label: 'Any Price', val: 'all' },
                      { label: 'Under ৳1,000', val: 'under-1000' },
                      { label: '৳1,000 - ৳3,000', val: '1000-3000' },
                      { label: '৳3,000 - ৳5,000', val: '3000-5000' },
                      { label: 'Over ৳5,000', val: 'over-5000' },
                      { label: 'Custom pricing Range', val: 'custom' },
                    ].map((opt) => (
                      <label key={opt.val} className="flex items-center gap-2 cursor-pointer text-xs font-medium py-1">
                        <input
                          type="radio"
                          name="mobilePriceGroup"
                          checked={priceRange === opt.val}
                          onChange={() => setPriceRange(opt.val)}
                          className="accent-indigo-600"
                        />
                        <span className={priceRange === opt.val ? 'font-bold text-indigo-650 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}>{opt.label}</span>
                      </label>
                    ))}

                    {priceRange === 'custom' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <input
                          type="number"
                          placeholder="৳ Min"
                          value={customMinPrice}
                          onChange={(e) => setCustomMinPrice(e.target.value)}
                          className="text-xs px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-gray-205 dark:border-slate-700 focus:outline-none"
                        />
                        <input
                          type="number"
                          placeholder="৳ Max"
                          value={customMaxPrice}
                          onChange={(e) => setCustomMaxPrice(e.target.value)}
                          className="text-xs px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-gray-205 dark:border-slate-700 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Tags */}
                <div className="space-y-2 border-t border-gray-100 dark:border-slate-800 pt-4">
                  <h5 className="font-extrabold text-xs text-gray-900 dark:text-gray-150 uppercase tracking-widest">Product Tags</h5>
                  <div className="space-y-1.5 flex flex-col">
                    {[
                      { label: 'All Products', val: 'all' },
                      { label: '🏷️ On Discount Sale', val: 'sale' },
                      { label: '⭐ Featured Picks', val: 'featured' },
                      { label: '🆕 New Arrival', val: 'new' },
                      { label: '🔥 Best Selling Items', val: 'bestseller' },
                    ].map((tag) => (
                      <label key={tag.val} className="flex items-center gap-2 cursor-pointer text-xs font-medium py-1">
                        <input
                          type="radio"
                          name="mobileTagGroup"
                          checked={selectedTag === tag.val}
                          onChange={() => setSelectedTag(tag.val)}
                          className="accent-indigo-600"
                        />
                        <span className={selectedTag === tag.val ? 'font-bold text-indigo-600' : 'text-gray-500/70 dark:text-gray-400'}>{tag.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Customer reviews stars */}
                <div className="space-y-2 border-t border-gray-100 dark:border-slate-800 pt-4">
                  <h5 className="font-extrabold text-xs text-gray-900 dark:text-gray-150 uppercase tracking-widest">Customer Reviews</h5>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedRating(null)}
                      className={`text-xs text-left py-1 ${selectedRating === null ? 'font-bold text-indigo-605' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      All Ratings
                    </button>
                    {[4, 3, 2].map((stars) => (
                      <button
                        key={stars}
                        onClick={() => setSelectedRating(stars)}
                        className={`flex items-center gap-1.5 text-xs text-left text-gray-500 ${selectedRating === stars ? 'font-bold text-indigo-605' : ''}`}
                      >
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s < stars ? 'fill-amber-400 text-amber-400' : 'text-gray-150'}`} />
                          ))}
                        </div>
                        <span>& Up</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Availability status */}
                <div className="space-y-2 border-t border-gray-100 dark:border-slate-800 pt-4">
                  <h5 className="font-extrabold text-xs text-gray-900 dark:text-gray-150 uppercase tracking-widest">Availability</h5>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={showInStockOnly}
                      onChange={(e) => setShowInStockOnly(e.target.checked)}
                      className="rounded accent-indigo-600"
                    />
                    <span className={showInStockOnly ? 'font-bold text-indigo-605' : 'text-gray-505 dark:text-gray-400'}>Show In Stock Only</span>
                  </label>
                </div>
              </div>

              {/* Drawer footer reset and apply button sets */}
              <div className="p-4 border-t border-gray-150 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900 grid grid-cols-2 gap-3 pb-8">
                <button
                  onClick={() => { handleClearAllFilters(); setMobileFiltersOpen(false); }}
                  className="w-full text-xs font-bold border border-gray-300 text-gray-600 dark:border-slate-700 dark:text-gray-300 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Clear Filters
                </button>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full text-xs font-bold bg-indigo-605 hover:bg-indigo-705 text-white py-3 rounded-xl shadow-md transition cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
