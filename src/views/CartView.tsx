import { ShoppingBag, ArrowLeft, Trash2, Tag, ArrowRight } from 'lucide-react';
import { CartItem, Coupon } from '../types';

interface CartViewProps {
  cart: CartItem[];
  onUpdateQty: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onSelectProduct: (productId: string) => void;
  onBackToShop: () => void;
  onProceedToCheckout: () => void;
  couponCode: string;
  setCouponCode: (code: string) => void;
  coupon: Coupon | null;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
}

export default function CartView({
  cart,
  onUpdateQty,
  onRemoveItem,
  onSelectProduct,
  onBackToShop,
  onProceedToCheckout,
  couponCode,
  setCouponCode,
  coupon,
  onApplyCoupon,
  onRemoveCoupon,
}: CartViewProps) {
  
  const isCartEmpty = cart.length === 0;

  // Pricing math checks
  const subtotal = cart.reduce((acc, item) => {
    const price = item.product.salePrice || item.product.price;
    return acc + price * item.quantity;
  }, 0);

  // Discount reduction check
  let discountValue = 0;
  if (coupon) {
    if (coupon.discountType === 'percentage') {
      discountValue = Math.round((subtotal * coupon.discountValue) / 100);
    } else {
      discountValue = coupon.discountValue;
    }
  }

  const finalTotal = Math.max(0, subtotal - discountValue);

  if (isCartEmpty) {
    return (
      <div className="text-center py-20 glass-card rounded-3xl p-8 max-w-lg mx-auto font-sans animate-fadeIn">
        <div className="w-16 h-16 bg-indigo-500/10 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/10">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-extrabold text-gray-800 dark:text-gray-100">Your Basket is Empty</h2>
        <p className="text-xs text-gray-400 mt-1 mb-6">Looks like you haven’t added any branded items to your shopping cart yet.</p>
        <button
          onClick={onBackToShop}
          className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs tracking-wider uppercase px-6 py-2.5 rounded-lg shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 font-sans animate-fadeIn">
      {/* Back button */}
      <div>
        <button
          onClick={onBackToShop}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-indigo-650 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cart items list */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Shopping Cart</span>
            <span className="bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded text-xs font-bold font-mono">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          </h2>

          <div className="divide-y divide-gray-100 dark:divide-slate-800/40 glass-card rounded-2xl overflow-hidden">
            {cart.map((item) => {
              const product = item.product;
              const price = product.salePrice || product.price;
              const lineTotal = price * item.quantity;
              return (
                <div key={product.id} className="p-4 sm:p-5 flex gap-4 items-center">
                  
                  {/* Pfp product */}
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 dark:bg-slate-900 rounded-xl overflow-hidden shrink-0 border border-gray-150 dark:border-slate-800 cursor-pointer"
                    onClick={() => onSelectProduct(product.id)}
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover hover:scale-105 duration-200"
                    />
                  </div>

                  {/* Title specs */}
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white hover:text-indigo-600 cursor-pointer truncate"
                      onClick={() => onSelectProduct(product.id)}
                    >
                      {product.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 capitalize mt-0.5">{product.category.replace('-', ' ')}</p>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">৳{price}</p>
                  </div>

                  {/* Quantities modifier */}
                  <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-750 bg-gray-50/50 dark:bg-gray-800 rounded-lg p-1">
                    <button
                      onClick={() => onUpdateQty(product.id, item.quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center text-gray-500 font-extrabold hover:bg-gray-100 rounded text-xs transition"
                      title="Reduce item count"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-bold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQty(product.id, item.quantity + 1)}
                      disabled={item.quantity >= product.stock}
                      className="w-6 h-6 flex items-center justify-center text-gray-500 font-extrabold hover:bg-gray-100 rounded text-xs transition disabled:text-gray-300"
                      title="Increase item count"
                    >
                      +
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="hidden sm:block text-right shrink-0">
                    <p className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200">৳{lineTotal}</p>
                  </div>

                  {/* Trash element */}
                  <button
                    onClick={() => onRemoveItem(product.id)}
                    className="p-2 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing checklist box */}
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">Order Pricing Summary</h2>
          
          <div className="p-6 glass-card rounded-2xl space-y-6">
            <div className="space-y-3.5 text-xs text-gray-500 divide-y divide-gray-150 dark:divide-slate-800/50">
              
              <div className="flex items-center justify-between">
                <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} items)</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200 text-sm">৳{subtotal}</span>
              </div>

              {coupon && (
                <div className="flex items-center justify-between text-orange-600 dark:text-orange-400 pt-3">
                  <span className="flex items-center gap-1">
                    <span>Discount Coupon ({coupon.code})</span>
                    <button onClick={onRemoveCoupon} className="text-rose-400 hover:text-rose-600 text-xs font-semibold cursor-pointer">
                      (Remove)
                    </button>
                  </span>
                  <span className="font-mono font-bold">- ৳{discountValue}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 text-sm">
                <span className="text-gray-850 dark:text-gray-100 font-bold">Estimated Total</span>
                <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-sans">৳{finalTotal}</span>
              </div>
            </div>

            {/* Coupons Form */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 leading-none">
                <Tag className="w-4 h-4 text-indigo-500" />
                <span>Promo / Coupon Code?</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Insert Code, e.g., EID30"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={!!coupon}
                  className="w-full text-xs px-3 py-2 border-none glass-input text-gray-900 dark:text-white rounded-xl focus:outline-none uppercase disabled:bg-gray-100/50"
                />
                <button
                  onClick={() => onApplyCoupon(couponCode)}
                  disabled={!!coupon || !couponCode.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white font-bold px-4 rounded-xl text-xs uppercase cursor-pointer"
                >
                  Apply
                </button>
              </div>
              <p className="text-[10px] text-gray-400">Available: <span className="font-semibold text-indigo-500">ZUNO10</span> (10% off), <span className="font-semibold text-orange-500">EID30</span> (30% off, Apparels only)</p>
            </div>

            {/* Checkout proceed */}
            <button
              onClick={onProceedToCheckout}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/25 text-center flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Click to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
