import React from 'react';
import { Star, Heart, ShoppingCart, ArrowRightLeft } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
  onSelect: (productId: string) => void;
  onCompare?: (productId: string) => void;
  isComparing?: boolean;
}

export const ProductCard = React.memo(({
  product,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  isWishlisted,
  onSelect,
  onCompare,
  isComparing,
}: ProductCardProps) => {
  const { id, name, price, salePrice, stock, images, rating, reviewsCount, isBestSeller, isNewArrival } = product;

  // Calculative stats
  const finalPrice = salePrice || price;
  const isDiscounted = !!salePrice && salePrice < price;
  const discountPct = isDiscounted ? Math.round(((price - salePrice!) / price) * 100) : 0;
  const isOutOfStock = stock <= 0;
  const isStockLow = stock > 0 && stock <= 10;

  return (
    <div className="group relative glass-card rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300 flex flex-col h-full font-sans">
      
      {/* Badge List Overlay */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none select-none">
        {isDiscounted && (
          <span className="bg-brand-red text-white text-[10px] font-black px-3 py-1 rounded-md shadow-lg">
            -{discountPct}%
          </span>
        )}
        {isBestSeller && (
          <span className="bg-brand-green text-white text-[10px] font-black px-3 py-1 rounded-md shadow-lg">
            Best Seller
          </span>
        )}
        {isNewArrival && (
          <span className="bg-teal-600 text-white text-[10px] font-black px-3 py-1 rounded-md shadow-lg">
            New Arrival
          </span>
        )}
      </div>

      {/* Actions Top Right */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`p-2 rounded-full border border-gray-100 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/85 backdrop-blur-md hover:scale-110 duration-200 shadow-md ${
            isWishlisted ? 'text-rose-500 hover:text-rose-600' : 'text-gray-400 hover:text-rose-500 dark:text-gray-300'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
        </button>

        {onCompare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCompare(id);
            }}
            className={`p-2 rounded-full border border-gray-100 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/85 backdrop-blur-md hover:scale-110 duration-200 shadow-md ${
              isComparing ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/50' : 'text-gray-400 hover:text-indigo-500 dark:text-gray-300'
            }`}
            title="Compare Product"
          >
            <ArrowRightLeft className={`w-4 h-4 ${isComparing ? 'stroke-[3]' : ''}`} />
          </button>
        )}
      </div>

      {/* Image container with anchor */}
      <div
        className="relative pt-[100%] overflow-hidden bg-gray-50 dark:bg-gray-900 cursor-pointer"
        onClick={() => onSelect(id)}
      >
        <img
          referrerPolicy="no-referrer"
          loading="lazy"
          src={images[0].includes('unsplash.com') ? `${images[0]}${images[0].includes('?') ? '&' : '?'}auto=format&fit=crop&w=400&q=75` : images[0]}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 duration-500 transition-all"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-gray-950 text-white border border-gray-800 tracking-wider font-semibold text-xs py-1.5 px-3 rounded-lg">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      {/* Body specifications */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 divide-y divide-gray-50 dark:divide-gray-700/50">
        
        <div className="pb-2 sm:pb-3 flex-1 cursor-pointer" onClick={() => onSelect(id)}>
          {/* Ratings */}
          <div className="flex items-center gap-1.5 mb-1 sm:mb-1.5">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 ${
                    i < Math.round(rating) ? 'fill-amber-400' : 'text-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-[9px] sm:text-[11px] text-gray-500 font-bold">({reviewsCount})</span>
          </div>

          {/* Title limit 2 lines */}
          <h2 className="text-[13px] sm:text-sm font-bold text-gray-900 tracking-tight leading-snug group-hover:text-brand-green line-clamp-2 h-8 sm:h-10 mb-1 sm:mb-2 transition-colors">
            {name}
          </h2>

          {/* Pricing labels */}
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-base sm:text-lg font-black text-brand-green">৳{finalPrice}</span>
            {isDiscounted && (
              <span className="text-[10px] sm:text-xs text-gray-400 line-through font-bold">৳{price}</span>
            )}
          </div>
        </div>

        {/* Footer info: buy alerts & triggers */}
        <div className="pt-2 sm:pt-3 flex flex-col gap-2 border-t border-gray-50 mt-auto">
          {/* Stock info */}
          <div className="flex items-center">
            {isOutOfStock ? (
              <span className="text-[10px] sm:text-xs text-rose-500 font-black">Sold Out</span>
            ) : isStockLow ? (
              <span className="text-[8px] sm:text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-lg border border-amber-100 font-bold whitespace-nowrap">
                Only {stock} Left!
              </span>
            ) : (
              <span className="text-[8px] sm:text-[10px] text-emerald-600 font-bold uppercase tracking-wider">In Stock</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              disabled={isOutOfStock}
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
              className="flex-1 flex justify-center items-center gap-1.5 bg-brand-green/10 hover:bg-brand-green/20 text-brand-green disabled:bg-gray-100 disabled:text-gray-400 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black transition-all active:scale-95 disabled:pointer-events-none cursor-pointer border border-brand-green/20 disabled:border-transparent"
              title="Add to Cart"
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              disabled={isOutOfStock}
              onClick={(e) => {
                e.stopPropagation();
                if (onBuyNow) {
                  onBuyNow(product);
                } else {
                  onAddToCart(product);
                }
              }}
              className="flex-[2] flex justify-center items-center bg-brand-green hover:bg-brand-green-dark disabled:bg-gray-100 disabled:text-gray-400 text-white text-[10px] sm:text-xs font-black py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:pointer-events-none"
              title="Buy Now"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProductCard;
