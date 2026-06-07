import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, ShoppingCart, ArrowRightLeft } from 'lucide-react';
import { Product } from '../types';

interface ComparisonModalProps {
  products: Product[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onAddToCart: (product: Product) => void;
}

export default function ComparisonModal({
  products,
  onClose,
  onRemove,
  onAddToCart,
}: ComparisonModalProps) {
  if (products.length === 0) return null;

  const labels = [
    { key: 'category', label: 'Category' },
    { key: 'brand', label: 'Brand' },
    { key: 'rating', label: 'Rating' },
    { key: 'status', label: 'Status' },
    { key: 'sku', label: 'SKU' },
    { key: 'price', label: 'Original Price' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Compare Specifications</h2>
                <p className="text-xs text-gray-500 font-medium">Analyzing items side-by-side</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Comparison Table Container */}
          <div className="flex-1 overflow-x-auto p-6">
            <div className="min-w-[600px] grid grid-cols-[150px_1fr_1fr] gap-4">
              {/* Labels Column */}
              <div className="flex flex-col gap-8 pt-[220px]">
                {labels.map((item) => (
                  <div key={item.key} className="h-10 flex items-center">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Product Columns */}
              {products.map((product) => (
                <div key={product.id} className="flex flex-col gap-8">
                  {/* Product Header Info */}
                  <div className="h-[220px] flex flex-col items-center">
                    <div className="relative group mb-4">
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="w-32 h-32 object-cover rounded-2xl shadow-lg border-2 border-gray-100 dark:border-gray-800"
                      />
                      <button
                        onClick={() => onRemove(product.id)}
                        className="absolute -top-2 -right-2 p-1.5 bg-brand-red text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from comparison"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-center px-4">
                      <h3 className="text-sm font-black text-gray-900 dark:text-white line-clamp-2 h-10 mb-1 leading-snug">
                        {product.name}
                      </h3>
                      <div className="text-lg font-black text-brand-green">
                        ৳{product.salePrice || product.price}
                      </div>
                    </div>
                  </div>

                  {/* Attributes */}
                  <div className="h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">{product.category.replace('-', ' ')}</span>
                  </div>
                  <div className="h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{product.brand}</span>
                  </div>
                  <div className="h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-black text-gray-900 dark:text-white">{product.rating}</span>
                      <span className="text-[10px] text-gray-500 font-bold">({product.reviewsCount})</span>
                    </div>
                  </div>
                  <div className="h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4">
                    <span className={`text-[10px] uppercase font-black tracking-widest ${product.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {product.status}
                    </span>
                  </div>
                  <div className="h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 font-mono">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{product.sku}</span>
                  </div>
                  <div className="h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4">
                     <span className="text-sm font-bold text-gray-400 line-through">৳{product.price}</span>
                  </div>

                  {/* Action */}
                  <div className="mt-4">
                    <button
                      onClick={() => onAddToCart(product)}
                      className="w-full flex items-center justify-center gap-3 bg-brand-green hover:bg-brand-green-dark text-white p-4 rounded-2xl font-black text-sm transition-all shadow-xl shadow-brand-green/20"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}

              {/* Placeholder for 2nd product if only 1 selected */}
              {products.length === 1 && (
                <div className="flex flex-col gap-8">
                  <div className="h-[220px] flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl bg-gray-50/50 dark:bg-gray-800/30">
                    <div className="text-center p-6">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ArrowRightLeft className="w-6 h-6 text-gray-300" />
                      </div>
                      <p className="text-xs font-bold text-gray-400">Select another item to compare</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
