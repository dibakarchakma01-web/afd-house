import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ShoppingCart, Heart, User, Sun, Moon, LogOut, ShieldAlert, ChevronDown, Menu, X, Tag, Flame, Headphones, Truck, Mic, Globe } from 'lucide-react';
import { Product, Category, SubCategory } from '../types';
import { Logo } from './Logo';

interface NavbarProps {
  currentView: string;
  setView: (view: string) => void;
  setSelectedProductId: (id: string | null) => void;
  cartCount: number;
  wishlistCount: number;
  user: any;
  isAdminUser: boolean;
  onLogout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  products: Product[];
  categories: Category[];
  subcategories: SubCategory[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  activeSubCategory: string;
  setActiveSubCategory: (sub: string) => void;
  setSearchQuery: (query: string) => void;
}

export default function Navbar({
  currentView,
  setView,
  setSelectedProductId,
  cartCount,
  wishlistCount,
  user,
  isAdminUser,
  onLogout,
  theme,
  toggleTheme,
  products,
  categories,
  subcategories,
  activeCategory,
  setActiveCategory,
  activeSubCategory,
  setActiveSubCategory,
  setSearchQuery,
}: NavbarProps) {
  const [localSearch, setLocalSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  // Voice Search States
  const [isRecording, setIsRecording] = useState(false);
  const [speechLang, setSpeechLang] = useState<'en-US' | 'bn-BD'>('en-US');
  const [speechSupported, setSpeechSupported] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check speech recognition support
    if (typeof window !== 'undefined' && (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window))) {
      setSpeechSupported(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setLocalSearch(transcript);
        setShowSuggestions(true);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, []);

  const toggleLanguage = () => {
    setSpeechLang(prev => prev === 'en-US' ? 'bn-BD' : 'en-US');
  };

  const handleVoiceSearch = () => {
    if (!speechSupported || !recognitionRef.current) return;
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.lang = speechLang;
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  // Filter recommendations based on search text input
  const suggestions = localSearch.trim()
    ? products
        .filter((p) => {
          const matchesName = p.name.toLowerCase().includes(localSearch.toLowerCase());
          const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
          return matchesName && matchesCategory;
        })
        .slice(0, 5)
    : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
    setView('listing');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (productId: string) => {
    setSelectedProductId(productId);
    setView('detail');
    setShowSuggestions(false);
    setLocalSearch('');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-8">
          
          {/* Hamburger Menu & Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-gray-600 hover:text-brand-green transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
                setView('home');
              }}
              className="flex items-center gap-3"
            >
              <Logo size="md" />
              <div className="flex flex-col items-start leading-tight">
                <span className="font-sans font-black text-xl sm:text-2xl tracking-tighter text-black">
                  AFD <span className="text-brand-green">HOUSE</span>
                </span>
                <span className="hidden sm:block text-[10px] text-gray-700 font-bold uppercase tracking-wider">Shop More, Pay Less</span>
              </div>
            </button>
          </div>

          {/* Integrated Search Bar with Dropdown */}
          <div ref={searchRef} className="hidden md:flex flex-1 relative max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="flex w-full items-center border-2 border-brand-green rounded-xl overflow-hidden shadow-sm">
              <input
                type="text"
                placeholder="Search over 10,000+ products, brands..."
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="flex-1 px-4 py-2 text-gray-900 text-sm focus:outline-none"
              />
              <div className="h-6 w-px bg-gray-200 mx-1" />
              {speechSupported && (
                <div className="flex items-center gap-1 px-1">
                  <button
                    type="button"
                    onClick={toggleLanguage}
                    className="p-1.5 text-gray-500 hover:text-brand-green flex items-center gap-1 rounded-md hover:bg-brand-green/10 transition-colors"
                    title={`Toggle Voice Language (Current: ${speechLang === 'en-US' ? 'English' : 'Bengali'})`}
                  >
                    <Globe className="w-4 h-4" />
                    <span className="text-[10px] font-bold">{speechLang === 'en-US' ? 'EN' : 'BN'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    className={`p-1.5 rounded-full transition-colors ${isRecording ? 'bg-red-100 text-red-500 animate-pulse' : 'text-gray-500 hover:text-brand-green hover:bg-brand-green/10'}`}
                    title={isRecording ? "Stop Recording" : "Voice Search"}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="h-6 w-px bg-gray-200 mx-1" />
              <select 
                className="bg-transparent text-xs font-bold text-black px-2 py-2 focus:outline-none cursor-pointer border-none max-w-[120px]"
                value={activeCategory}
                onChange={(e) => setActiveCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-brand-green hover:bg-brand-green-dark text-white px-6 py-2 transition-all duration-200 flex items-center gap-2 font-bold shadow-sm"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>

            {/* Recommendations Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-gray-100">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSuggestionClick(p.id)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 text-left transition-colors"
                  >
                    <img
                      referrerPolicy="no-referrer"
                      src={p.images[0]}
                      alt={p.name}
                      className="w-10 h-10 object-cover rounded-md border border-gray-100"
                    />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{p.category.replace(/-/g, ' ')}</p>
                    </div>
                    <span className="text-sm font-bold text-brand-green">৳{p.salePrice || p.price}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action Icons Panel */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Wishlist */}
            <button
              onClick={() => setView('wishlist')}
              className="flex flex-col items-center gap-0.5 text-black font-extrabold hover:text-brand-green transition-colors"
            >
              <div className="relative">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-green text-white text-[9px] sm:text-[10px] font-bold w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-[11px] font-bold">Wishlist</span>
            </button>

            {/* Cart */}
            <button
              onClick={() => setView('cart')}
              className="flex flex-col items-center gap-0.5 text-black font-extrabold hover:text-brand-green transition-colors"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-green text-white text-[9px] sm:text-[10px] font-bold w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:block text-[11px] font-bold">Cart</span>
            </button>

            {/* Account - Displays only for authenticated administrators */}
            {isAdminUser && (
              <div className="relative group">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 group text-black dark:text-white font-extrabold hover:text-brand-green transition-colors"
                >
                  <div className="p-2 border border-gray-255 rounded-full group-hover:border-brand-green transition-colors bg-brand-green/10 text-brand-green">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div className="hidden lg:flex flex-col items-start leading-tight">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">ADMINISTRATOR</span>
                    <div className="flex items-center gap-0.5">
                      <span className="text-[11px] font-black uppercase">Admin Panel</span>
                      <ChevronDown className="w-3 h-3" />
                    </div>
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 rounded-xl bg-white border border-gray-100 shadow-2xl z-50 overflow-hidden divide-y divide-gray-50">
                    <div className="px-4 py-3 bg-gray-50/50">
                      <p className="text-xs text-gray-400">Signed In As</p>
                      <p className="text-sm font-bold text-gray-900 truncate">Store Owner</p>
                    </div>
                    <div className="py-1">
                      <button onClick={() => { setView('admin'); setUserDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-brand-green hover:bg-gray-50 flex items-center gap-2 font-black">
                        <ShieldAlert className="w-4 h-4" /> Admin Dashboard
                      </button>
                    </div>
                    <div className="py-1">
                      <button onClick={() => { onLogout(); setUserDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Nav Sub Bar */}
      <div 
        className="hidden md:block border-t border-gray-100 relative"
        onMouseLeave={() => setMegaMenuOpen(false)}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-8 h-10">
          <div 
            className="h-full relative select-none"
            onMouseEnter={() => {
              setMegaMenuOpen(true);
              if (categories.length > 0 && !hoveredCategory) {
                setHoveredCategory(categories[0].slug);
              }
            }}
          >
            <button className="h-full bg-brand-green text-white px-5 flex items-center gap-3 text-xs font-black uppercase tracking-tight hover:bg-brand-green-dark transition-colors shrink-0">
               <Menu className="w-4 h-4" />
               <span>All Categories</span>
               <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Mega Menu Overlay */}
          {megaMenuOpen && (
            <div 
              className="absolute left-4 top-10 w-[850px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl rounded-b-2xl z-50 flex overflow-hidden text-sm"
              style={{ minHeight: '360px' }}
              onMouseEnter={() => setMegaMenuOpen(true)}
            >
              {/* Left Side: Categories List */}
              <div className="w-1/3 bg-slate-50 dark:bg-slate-950 border-r border-gray-100 dark:border-slate-800 py-3 shrink-0 flex flex-col overflow-y-auto">
                {categories.map((cat, idx) => {
                  const isHovered = hoveredCategory === cat.slug || (!hoveredCategory && idx === 0);
                  return (
                    <button
                      key={cat.id}
                      onMouseEnter={() => setHoveredCategory(cat.slug)}
                      onClick={() => {
                        setActiveCategory(cat.slug);
                        setActiveSubCategory('all');
                        setView('listing');
                        setMegaMenuOpen(false);
                      }}
                      className={`w-full text-left px-5 py-3 flex items-center justify-between font-black transition-colors ${
                        isHovered 
                          ? 'bg-white dark:bg-slate-900 text-brand-green border-l-4 border-brand-green pl-4' 
                          : 'text-gray-700 dark:text-gray-300 hover:bg-slate-100/50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="text-gray-400 text-xs">➔</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Side: Subcategories Grid */}
              <div className="flex-1 p-6 bg-white dark:bg-slate-900 overflow-y-auto flex flex-col justify-between">
                <div>
                  {(() => {
                    const currentCategorySlug = hoveredCategory || categories[0]?.slug || '';
                    const activeCatObj = categories.find(c => c.slug === currentCategorySlug);
                    const subcats = subcategories.filter(sc => sc.categoryId === currentCategorySlug);
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                          <h4 className="font-extrabold text-base text-gray-900 dark:text-white capitalize">
                            {activeCatObj ? activeCatObj.name : 'Category'} Collections
                          </h4>
                          <button
                            onClick={() => {
                              if (activeCatObj) {
                                setActiveCategory(activeCatObj.slug);
                                setActiveSubCategory('all');
                                setView('listing');
                                setMegaMenuOpen(false);
                              }
                            }}
                            className="text-xs text-brand-green hover:underline font-bold"
                          >
                            View All Products →
                          </button>
                        </div>

                        {subcats.length === 0 ? (
                          <div className="py-12 text-center text-xs text-gray-400">
                            No subcategories found. Manage them in the Admin Panel!
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            {subcats.map((sub) => (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  if (activeCatObj) {
                                    setActiveCategory(activeCatObj.slug);
                                    setActiveSubCategory(sub.slug);
                                    setView('listing');
                                    setMegaMenuOpen(false);
                                  }
                                }}
                                className="text-left py-2 px-3 rounded-lg border border-gray-100 dark:border-slate-800 hover:border-brand-green/40 hover:bg-brand-green/5 dark:hover:bg-brand-green/5 transition-all flex items-center justify-between font-bold text-gray-800 dark:text-gray-200 group text-xs"
                              >
                                <span>{sub.name}</span>
                                <span className="text-gray-300 group-hover:text-brand-green transition-colors text-[10px]">➔</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Promotional banner or footer */}
                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-slate-850 flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <span>Authentic Bangladeshi E-Commerce</span>
                  <span className="text-brand-green font-black">AFD HOUSE Premium selection</span>
                </div>
              </div>
            </div>
          )}

          <nav className="flex items-center gap-6 h-full font-black text-[11.5px] uppercase tracking-wide text-black dark:text-white pb-0.5">
             {[
               { view: 'home', label: 'Home' },
               { slug: 'mens-fashion', label: "Men's Fashion" },
               { slug: 'womens-fashion', label: "Women's Fashion" },
               { slug: 'kids-zone', label: 'Kids Zone' },
               { slug: 'electronics-gadgets', label: 'Electronics & Gadgets' },
               { view: 'contact', label: 'Contact' }
             ].map((link, idx) => {
               const isActive = link.view ? currentView === link.view : activeCategory === link.slug;
               return (
                 <button
                   key={idx}
                   onClick={() => {
                     if (link.slug) {
                       setActiveCategory(link.slug);
                       setActiveSubCategory('all');
                       setView('listing');
                     } else if (link.view === 'contact') {
                        document.querySelector('footer')?.scrollIntoView({ behavior: 'smooth' });
                     } else {
                       setView(link.view!);
                       setActiveCategory('all');
                       setActiveSubCategory('all');
                     }
                   }}
                   className={`h-full flex items-center border-b-2 transition-all px-1 ${isActive ? 'text-brand-green border-brand-green' : 'border-transparent hover:text-brand-green'}`}
                 >
                   {link.label}
                 </button>
               )
             })}
          </nav>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Sidebar drawer content */}
          <div className="absolute top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col animate-slideInLeft">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-brand-green">
              <div className="flex items-center gap-2.5">
                <Logo size="sm" className="border-white/20" />
                <span className="font-sans font-black text-xl tracking-tighter text-white">
                  AFD HOUSE
                </span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-white hover:rotate-90 transition-transform duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Mobile search */}
              <form onSubmit={handleSearchSubmit} className="flex">
                <input
                  type="text"
                  placeholder="Search..."
                  value={localSearch}
                  onChange={(e) => {
                    setLocalSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full px-3 py-2 border-y border-l border-blue-100 bg-blue-50/30 text-gray-900 text-sm rounded-l-xl focus:outline-none focus:ring-1 focus:ring-brand-green"
                />
                {speechSupported && (
                  <div className="flex items-center gap-0.5 bg-blue-50/30 border-y border-blue-100 px-1 shrink-0">
                    <button
                      type="button"
                      onClick={toggleLanguage}
                      className="p-1.5 text-gray-500 hover:text-brand-green transition-colors flex items-center"
                      title={`Voice Language: ${speechLang}`}
                    >
                      <span className="text-[10px] font-bold">{speechLang === 'en-US' ? 'EN' : 'BN'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleVoiceSearch}
                      className={`p-1.5 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-brand-green'}`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <button type="submit" className="bg-brand-green text-white px-4 rounded-r-xl shrink-0">
                  <Search className="w-4 h-4" />
                </button>
              </form>

              {/* Mobile Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden divide-y divide-gray-100 -mt-4 mb-2">
                  {suggestions.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        handleSuggestionClick(p.id);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 text-left transition-colors"
                    >
                      <img
                        referrerPolicy="no-referrer"
                        src={p.images[0]}
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded-md border border-gray-100"
                      />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-400 capitalize">{p.category.replace(/-/g, ' ')}</p>
                      </div>
                      <span className="text-xs font-bold text-brand-green">৳{p.salePrice || p.price}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Main Nav Links */}
              <div className="space-y-4">
                <p className="text-[10px] uppercase text-black font-black tracking-widest px-1">Navigation</p>
                <div className="grid gap-1">
                  {[
                    { view: 'home', label: 'Home', icon: <Tag className="w-4 h-4" /> },
                    { view: 'tracking', label: 'Track My Order', icon: <Truck className="w-4 h-4" /> },
                    { view: 'help', label: 'Help Center', icon: <Headphones className="w-4 h-4" /> },
                    { view: 'sell', label: 'Sell on AFD HOUSE', icon: <Tag className="w-4 h-4" /> },
                    { view: 'cart', label: 'My Cart', count: cartCount, icon: <ShoppingCart className="w-4 h-4" /> },
                    { view: 'wishlist', label: 'My Wishlist', count: wishlistCount, icon: <Heart className="w-4 h-4" /> }
                  ].map((link, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setView(link.view);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center justify-between w-full p-3 rounded-xl transition-colors ${currentView === link.view ? 'bg-brand-green/10 text-brand-green font-black' : 'text-black hover:bg-gray-100 font-bold'}`}
                    >
                      <div className="flex items-center gap-3">
                        {link.icon || <ChevronDown className="w-4 h-4" />}
                        <span className="text-sm">{link.label}</span>
                      </div>
                      {link.count !== undefined && link.count > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                          {link.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Departments / Categories */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] uppercase text-black font-black tracking-widest">Departments</p>
                </div>
                <div className="grid gap-1">
                  <button
                    onClick={() => {
                      setActiveCategory('all');
                      setActiveSubCategory('all');
                      setView('listing');
                      setMobileMenuOpen(false);
                    }}
                    className={`text-xs text-left p-3 rounded-xl font-black w-full ${activeCategory === 'all' && currentView === 'listing' ? 'bg-brand-green/10 text-brand-green' : 'text-black hover:bg-gray-100'}`}
                  >
                    All Collections
                  </button>
                  {categories.map((cat) => {
                    const isSelected = activeCategory === cat.slug;
                    const subcats = subcategories.filter(sc => sc.categoryId === cat.slug);
                    return (
                      <div key={cat.id} className="space-y-1">
                        <button
                          onClick={() => {
                            if (activeCategory === cat.slug) {
                              setActiveCategory(cat.slug);
                              setActiveSubCategory('all');
                              setView('listing');
                              setMobileMenuOpen(false);
                            } else {
                              setActiveCategory(cat.slug);
                            }
                          }}
                          className={`text-xs text-left p-3 rounded-xl flex items-center justify-between font-black w-full transition-all ${
                            isSelected && currentView === 'listing' 
                              ? 'bg-brand-green/10 text-brand-green font-black' 
                              : 'text-black hover:bg-gray-100'
                          }`}
                        >
                          <span>{cat.name}</span>
                          {subcats.length > 0 && (
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSelected ? 'rotate-180 text-brand-green' : 'text-gray-400'}`} />
                          )}
                        </button>

                        {isSelected && subcats.length > 0 && (
                          <div className="pl-4 pr-1 py-1 space-y-1 bg-gray-50/50 dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800">
                            <button
                              onClick={() => {
                                setActiveCategory(cat.slug);
                                setActiveSubCategory('all');
                                setView('listing');
                                setMobileMenuOpen(false);
                              }}
                              className={`w-full text-left p-2 rounded-lg text-[11px] font-black hover:text-brand-green ${activeSubCategory === 'all' ? 'text-brand-green' : 'text-gray-500'}`}
                            >
                              All in {cat.name}
                            </button>
                            {subcats.map((sub) => (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setActiveCategory(cat.slug);
                                  setActiveSubCategory(sub.slug);
                                  setView('listing');
                                  setMobileMenuOpen(false);
                                }}
                                className={`w-full text-left p-2 rounded-lg text-[11px] font-black hover:text-brand-green flex items-center justify-between ${activeSubCategory === sub.slug ? 'text-brand-green bg-brand-green/5' : 'text-gray-500'}`}
                              >
                                <span>{sub.name}</span>
                                <span className="text-[10px] opacity-60">➔</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Account Action */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              {isAdminUser && user ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green font-black">
                      {user.displayName?.charAt(0) || 'A'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-900 truncate max-w-[120px]">Store Owner</span>
                      <button onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="text-[10px] text-rose-500 font-black uppercase">Sign Out</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={toggleTheme}
                      className="p-2 text-gray-400 hover:text-brand-green"
                    >
                      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => { setView('admin'); setMobileMenuOpen(false); }}
                      className="p-2 text-gray-400 hover:text-brand-green"
                    >
                      <ShieldAlert className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-gray-400 font-bold">AFD HOUSE Guest checkout active</span>
                  <button 
                    onClick={toggleTheme}
                    className="p-3 bg-gray-100 dark:bg-slate-800 rounded-xl text-gray-500 dark:text-gray-400"
                  >
                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
