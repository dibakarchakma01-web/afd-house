import React, { useState } from 'react';
import { ArrowLeft, ShoppingCart, Heart, Shield, Award, Truck, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { Product, Review } from '../types';
import ReviewSection from '../components/ReviewSection';
import ProductCard from '../components/ProductCard';

interface ProductDetailViewProps {
  productId: string;
  products: Product[];
  reviews: Review[];
  onAddReview: (comment: string, rating: number, images?: string[]) => void;
  onEditReview: (reviewId: string, comment: string, rating: number, images?: string[]) => void;
  onDeleteReview: (reviewId: string) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
  onCompare?: (id: string) => void;
  isComparing?: boolean;
  compareIds?: string[];
  onBack: () => void;
  user: any;
  onLoginRequest: () => void;
  onSelectProduct: (id: string) => void;
  setView?: (view: string) => void;
}

export default function ProductDetailView({
  productId,
  products,
  reviews,
  onAddReview,
  onEditReview,
  onDeleteReview,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  onCompare,
  isComparing,
  compareIds = [],
  onBack,
  user,
  onLoginRequest,
  onSelectProduct,
  setView,
}: ProductDetailViewProps) {
  const product = products.find((p) => p.id === productId);
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  // Hover magnification styling
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ transform: 'scale(1)' });

  if (!product) {
    return (
      <div className="text-center py-16 font-sans">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Product Not Found</p>
        <button onClick={onBack} className="text-xs text-indigo-600 hover:underline mt-2">
          Back to Catalog Directory
        </button>
      </div>
    );
  }

  const { name, description, price, salePrice, stock, category, brand, sku, images, rating, reviewsCount, tags } = product;

  const finalPrice = salePrice || price;
  const isDiscounted = !!salePrice && salePrice < price;
  const savingAmount = price - finalPrice;
  const isOutOfStock = stock <= 0;
  const isStockLow = stock > 0 && stock <= 10;

  // Filter reviews specifically for THIS product
  const productReviews = reviews.filter((r) => r.productId === productId);

  // Recommendations mapping (same category fallback)
  const relatedProducts = products
    .filter((p) => p.category === category && p.id !== productId)
    .slice(0, 4);

  // Magnifier pointer coordinates trigger calculation
  const handleMouseMoveMagnifier = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transform: 'scale(2.2)',
      transformOrigin: `${x}% ${y}%`,
    });
  };

  const handleMouseLeaveMagnifier = () => {
    setZoomStyle({ transform: 'scale(1)', transformOrigin: 'center' });
  };

  return (
    <div className="space-y-12 pb-16 font-sans animate-fadeIn select-none">
      {/* Back CTA Button */}
      <div className="flex items-center justify-between border-b border-gray-105 dark:border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="group flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 transition"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Products</span>
        </button>
        {setView && (
          <button
            onClick={() => setView('listing')}
            className="text-xs text-indigo-650 hover:underline font-bold"
          >
            Browse Other Categories →
          </button>
        )}
      </div>

      {/* Hero Specs Grid splitting Gallery vs Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        
        {/* Pictures galleries with interactive pointer magnifier zoom */}
        <div className="space-y-4">
          <div 
            className="relative pt-[100%] overflow-hidden bg-slate-50 dark:bg-slate-900 border border-gray-150 dark:border-slate-850 rounded-3xl cursor-zoom-in group"
            onMouseMove={handleMouseMoveMagnifier}
            onMouseLeave={handleMouseLeaveMagnifier}
          >
            <img
              referrerPolicy="no-referrer"
              src={images[activeImgIdx]}
              alt={name}
              style={zoomStyle}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-100 ease-out"
            />
            
            {/* Subtle Zoom tooltip badge overlay */}
            <div className="absolute bottom-3 right-3 bg-black/75 text-white text-[9px] font-bold px-2 py-1 rounded bg-black/60 backdrop-blur-sm pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              Hover to Zoom
            </div>

            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center pointer-events-none">
                <span className="bg-gray-950 text-white border border-gray-800 font-bold text-sm px-4 py-2 rounded-xl">
                  SOLD OUT
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails list row selection */}
          {images.length > 1 && (
            <div className="flex flex-wrap gap-2.5 pt-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveImgIdx(idx);
                    setZoomStyle({ transform: 'scale(1)', transformOrigin: 'center' });
                  }}
                  className={`w-18 h-18 overflow-hidden bg-white rounded-xl border-2 transition-all shrink-0 cursor-pointer ${
                    idx === activeImgIdx
                      ? 'border-indigo-600 scale-[1.03] shadow-md'
                      : 'border-transparent bg-slate-50 hover:border-gray-300'
                  }`}
                  title={`View image gallery index ${idx + 1}`}
                >
                  <img
                    referrerPolicy="no-referrer"
                    src={img}
                    alt={`${name} spec index ${idx}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text descriptions and actionable tools details info */}
        <div className="flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono tracking-widest bg-indigo-50 dark:bg-slate-800/40 px-2.5 py-1 rounded capitalize border border-indigo-100 dark:border-white/10">
                Department: {category.replace(/-/g, ' ')}
              </span>
              {brand && (
                <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 font-mono tracking-widest bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded uppercase border border-transparent dark:border-white/5">
                  Brand: {brand}
                </span>
              )}
              {sku && (
                <span className="text-[9px] font-mono text-gray-400 font-semibold" title="Stock Keeping Unit SKU">
                  SKU: {sku}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-905 dark:text-white leading-tight tracking-tight">
              {name}
            </h1>

            {/* Price section block */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-sans font-black text-indigo-605 dark:text-indigo-400">৳{finalPrice}</span>
              {isDiscounted && (
                <>
                  <span className="text-sm text-gray-400 line-through">৳{price}</span>
                  <span className="text-xs bg-orange-50 text-orange-705 dark:bg-orange-950/20 dark:text-orange-400 font-bold px-2 py-0.5 rounded-lg border border-orange-100 dark:border-orange-900/35">
                    Save ৳{savingAmount}
                  </span>
                </>
              )}
            </div>

            <p className="text-sm text-gray-650 dark:text-gray-300 leading-relaxed font-normal whitespace-pre-line">
              {description}
            </p>

            {/* Tags collection inside detail layout */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-0.5 bg-slate-50 dark:bg-slate-805 text-gray-450 dark:text-gray-400 text-[10px] font-semibold px-2.5 py-1 rounded-md border border-gray-150 dark:border-slate-800">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* High level features checklist guarantee */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-gray-500 border-t border-b border-gray-150 dark:border-slate-800/40 py-4.5">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>100% Genuine Branded Authenticity Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-orange-500 shrink-0" />
                <span>AFD HOUSE Premium Quality Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-500 shrink-0" />
                <span>Home Delivery: Dhaka (48hr), Nationwide (3-5d)</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>7 Days Hassle-Free Exchange Policy</span>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {/* Stock indicators alert levels */}
            {isOutOfStock ? (
              <p className="text-sm font-bold text-rose-500 font-sans uppercase tracking-wider">Temporarily Sold Out</p>
            ) : isStockLow ? (
              <div className="bg-amber-50/50 dark:bg-amber-955/15 text-amber-800 dark:text-amber-400 px-3.5 py-2.5 rounded-xl border border-amber-100 dark:border-amber-900/25 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-550 shrink-0" />
                <span>Emergency stock warning! Only {stock} items left in stock. Place orders soon!</span>
              </div>
            ) : (
              <p className="text-xs text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">✓ Active In Stock ({stock} available)</p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                disabled={isOutOfStock}
                onClick={() => onAddToCart(product)}
                className="flex-1 bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600/20 disabled:bg-gray-150 disabled:dark:bg-slate-800 disabled:text-gray-400 font-bold text-sm px-6 py-4.5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:pointer-events-none"
                title="Add to Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>

              <button
                disabled={isOutOfStock}
                onClick={() => {
                  onAddToCart(product);
                  setView('checkout');
                }}
                className="flex-[2] bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-150 disabled:dark:bg-slate-800 disabled:text-gray-400 text-white font-black text-sm px-6 py-4.5 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center cursor-pointer disabled:pointer-events-none tracking-wide"
              >
                Buy Now
              </button>

              <button
                onClick={() => onToggleWishlist(product)}
                className={`p-4 rounded-2xl border duration-200 transition-all cursor-pointer ${
                  isWishlisted
                    ? 'border-orange-200/50 bg-orange-50 text-orange-500 dark:bg-orange-950/20 hover:scale-103'
                    : 'border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-400 hover:text-orange-500 hover:scale-103'
                }`}
                title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5.5 h-5.5 ${isWishlisted ? 'fill-orange-500' : ''}`} />
              </button>

              {onCompare && (
                <button
                  onClick={() => onCompare(productId)}
                  className={`p-4 rounded-2xl border duration-200 transition-all cursor-pointer ${
                    isComparing
                      ? 'border-indigo-200/50 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 hover:scale-103'
                      : 'border-gray-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-400 hover:text-indigo-600 hover:scale-103'
                  }`}
                  title="Compare Product"
                >
                  <ArrowRightLeft className={`w-5.5 h-5.5 ${isComparing ? 'stroke-[3]' : ''}`} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Complete Customer review system with edit/delete rules */}
      <section className="border-t border-gray-150 dark:border-slate-800 pt-10">
        <h2 className="text-lg sm:text-xl font-extrabold text-gray-905 dark:text-white tracking-tight mb-6">
          Verified Reviews & Customer Feedback
        </h2>
        <ReviewSection
          productId={productId}
          reviews={productReviews}
          onAddReview={onAddReview}
          onEditReview={onEditReview}
          onDeleteReview={onDeleteReview}
          user={user}
          onLoginRequest={onLoginRequest}
        />
      </section>

      {/* Related Products Recommendations slider */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-gray-150 dark:border-slate-800 pt-10 space-y-6">
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-905 dark:text-white tracking-tight">
            You might also like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                isWishlisted={isWishlisted}
                onSelect={(id) => {
                  onSelectProduct(id);
                  setActiveImgIdx(0);
                  setZoomStyle({ transform: 'scale(1)', transformOrigin: 'center' });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onCompare={onCompare}
                isComparing={compareIds?.includes(p.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
