import React, { useState, useEffect } from 'react';
import { Search, MapPin, Package, Truck, CheckCircle2, ChevronRight, AlertTriangle, Printer, Clock, Settings } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Order } from '../types';

interface OrderTrackingViewProps {
  user: any;
}

export default function OrderTrackingView({ user }: OrderTrackingViewProps) {
  const [typedId, setTypedId] = useState('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Prefetch client orders for easy clicking
  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      try {
        const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const list: Order[] = [];
        snap.forEach((doc) => {
          list.push(doc.data() as Order);
        });
        setMyOrders(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (e) {
        handleFirestoreError(e, OperationType.LIST, 'orders');
      }
    };
    fetchOrders();
  }, [user]);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedId.trim()) return;

    setIsLoading(true);
    setErrorStatus(null);
    try {
      const q = query(collection(db, 'orders'), where('id', '==', typedId.trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        setErrorStatus(`We couldn't trace any order matching "${typedId}". Verify formatting.`);
        setActiveOrder(null);
      } else {
        let matched: Order | null = null;
        snap.forEach((doc) => {
          matched = doc.data() as Order;
        });
        setActiveOrder(matched);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `orders/${typedId}`);
      setErrorStatus('Error fetching order metadata. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (order: Order) => {
    setActiveOrder(order);
    setTypedId(order.id);
    setErrorStatus(null);
  };

  const handlePrintInvoice = (order: Order) => {
    // Simple print implementation
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>AFD HOUSE Invoice - ${order.id}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }
              .header h1 { color: #6366f1; margin: 0; }
              .details { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .details-box h3 { border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { text-align: left; padding: 12px; border-bottom: 2px solid #eee; background: #f9fafb; }
              td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
              .total-section { text-align: right; margin-top: 30px; border-top: 2px solid #6366f1; padding-top: 20px; }
              .total-row { display: flex; justify-content: flex-end; gap: 40px; margin-bottom: 5px; }
              .footer { margin-top: 50px; text-align: center; font-size: 0.8em; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>AFD HOUSE</h1>
              <div style="text-align: right">
                <p><strong>Order ID:</strong> ${order.id}</p>
                <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Payment:</strong> ${order.paymentMethod} (${order.paymentStatus})</p>
              </div>
            </div>
            <div class="details">
              <div class="details-box">
                <h3>Billed To:</h3>
                <p><strong>${order.customerName}</strong></p>
                <p>${order.customerEmail}</p>
              </div>
              <div class="details-box">
                <h3>Shipping Address:</h3>
                <p>${order.shippingAddress}</p>
                 ${order.deliveryNotes ? `<p><strong>Notes:</strong> ${order.deliveryNotes}</p>` : ''}
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Product Specification</th>
                  <th>Unit Price</th>
                  <th style="text-align: center">Qty</th>
                  <th style="text-align: right">Amount Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.products.map(p => `
                  <tr>
                    <td>${p.name}</td>
                    <td>৳${p.price.toLocaleString()}</td>
                    <td style="text-align: center">${p.quantity}</td>
                    <td style="text-align: right">৳${(p.price * p.quantity).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total-section">
              <div class="total-row"><span>Subtotal:</span> <strong>৳${order.total.toLocaleString()}</strong></div>
              <div class="total-row"><span>Discount Applied:</span> <strong>৳${order.discount.toLocaleString()}</strong></div>
              <div class="total-row" style="font-size: 1.3em; color: #6366f1; margin-top: 10px;">
                <span>Payable Amount:</span> <strong>৳${order.finalTotal.toLocaleString()}</strong>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for choosing AFD HOUSE - Your Professional E-commerce Partner</p>
              <p>This is a computer-generated invoice. No signature required.</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
         printWindow.print();
      }, 500);
    }
  };

  // Tracker Steps helpers
  const TRACK_STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];
  const getStepIndex = (status: string) => TRACK_STEPS.indexOf(status);

  return (
    <div className="space-y-8 pb-16 font-sans animate-fadeIn">
      <div className="max-w-xl mx-auto text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Track Your Active Shipments
        </h2>
        <p className="text-xs text-gray-400">Insert your AFD HOUSE invoice serial number to track transit timelines in real-time.</p>
      </div>

      {/* Lookup Bar */}
      <div className="max-w-xl mx-auto">
        <form onSubmit={handleTrackSubmit} className="flex">
          <input
            type="text"
            required
            placeholder="Insert Order Code, example: AH-123456"
            value={typedId}
            onChange={(e) => setTypedId(e.target.value)}
            className="flex-1 px-4 py-2.8 border-none glass-input text-gray-900 dark:text-white text-sm rounded-l-xl focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-650 hover:bg-indigo-755 disabled:bg-gray-200 text-white font-bold px-6 py-2.8 rounded-r-xl text-xs uppercase transition tracking-wider cursor-pointer"
          >
            {isLoading ? 'Wait...' : 'Track'}
          </button>
        </form>

        {errorStatus && (
          <p className="text-xs text-rose-500 font-medium text-center mt-3 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100 flex items-center justify-center gap-1.5 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorStatus}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User active selections list */}
        {user && myOrders.length > 0 && (
          <div className="space-y-4 lg:col-span-1">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">My Recent Purchases</h3>
            
            <div className="space-y-3.5 select-none overflow-y-auto max-h-[350px] pr-1.5">
              {myOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => handleCardClick(ord)}
                  className={`p-4 border rounded-xl cursor-pointer duration-200 shadow-sm flex items-center justify-between ${
                    activeOrder?.id === ord.id
                      ? 'border-indigo-505 bg-indigo-50/15 dark:bg-slate-800/60'
                      : 'border-white/10 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{ord.id}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(ord.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      ord.status === 'Delivered'
                        ? 'bg-green-500/10 text-green-600'
                        : ord.status === 'Cancelled'
                        ? 'bg-rose-500/10 text-rose-600'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {ord.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Active Tracking Progress Tree */}
        <div className={`lg:col-span-${user && myOrders.length > 0 ? '2' : '3'} space-y-4`}>
          {activeOrder ? (
            <div className="p-6 glass-card rounded-2xl space-y-8 animate-fadeIn">
              
              {/* Tracker Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-150 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 leading-none">
                    <span>Invoice Trace ID:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 select-all">{activeOrder.id}</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Placed on {new Date(activeOrder.createdAt).toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintInvoice(activeOrder)}
                    className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 rounded-xl transition"
                    title="Print Receipt"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <div className="bg-indigo-600 px-3.5 py-1.5 text-white text-xs font-extrabold tracking-wide uppercase rounded-xl">
                    {activeOrder.paymentMethod} • {activeOrder.paymentStatus.toUpperCase()}
                  </div>
                </div>
              </div>

              {activeOrder.status === 'Cancelled' ? (
                /* Cancelled State banner */
                <div className="p-5 border border-rose-100 dark:border-rose-950 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 rounded-2xl text-center space-y-2 animate-fadeIn">
                  <span className="text-3xl">✖</span>
                  <h4 className="text-sm font-bold uppercase tracking-wider">This Transaction has Been Cancelled</h4>
                  <p className="text-xs max-w-sm mx-auto leading-relaxed text-gray-400">
                    If this cancellation was unintended, contact our Live Chat Operators at the bottom right corner of the dashboard instantly.
                  </p>
                </div>
              ) : (
                /* Interactive steps roadmap */
                <div className="flex flex-col sm:flex-row items-start justify-between gap-6 relative select-none">
                  {TRACK_STEPS.map((step, idx) => {
                    const trackingIdx = getStepIndex(activeOrder.status);
                    const isDone = idx <= trackingIdx;
                    const isActive = idx === trackingIdx;

                    return (
                      <div key={step} className="flex-1 flex sm:flex-col items-center text-center gap-3 w-full relative">
                        {/* Connecting road lines (Large Screens only) */}
                        {idx < TRACK_STEPS.length - 1 && (
                          <div className="hidden sm:block absolute top-5 left-1/2 right-[-50%] h-0.8 bg-gray-150 rounded-full z-0">
                            <div className={`h-full bg-indigo-500 duration-500 transition-all ${idx < trackingIdx ? 'w-full' : 'w-0'}`} />
                          </div>
                        )}

                        {/* Bullet nodes */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center z-10 font-bold border-2 transition-all duration-500 shrink-0 ${
                          isActive 
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-500/30 scale-110' 
                            : isDone
                            ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-400'
                        }`}>
                          {idx === 0 && <Package className={`w-5 h-5 ${isActive ? 'animate-bounce' : ''}`} />}
                          {idx === 1 && <Settings className={`w-5 h-5 ${isActive ? 'animate-spin' : ''}`} />}
                          {idx === 2 && <Truck className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />}
                          {idx === 3 && <CheckCircle2 className={`w-5 h-5 ${isActive ? 'animate-bounce' : ''}`} />}
                        </div>

                        {/* Title text */}
                        <div className="text-left sm:text-center mt-1">
                          <p className={`text-[11px] font-black uppercase tracking-wider leading-tight ${isActive ? 'text-indigo-600 dark:text-indigo-400' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                            {step}
                          </p>
                          <p className="text-[9px] font-bold text-gray-400 mt-1 leading-none uppercase tracking-widest">
                            {isActive ? 'In Progress' : isDone ? 'Completed' : 'Upcoming'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Recipient Full specs summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-indigo-50/10 dark:bg-slate-800/30 p-4 rounded-xl text-xs text-gray-500 border border-white/5">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Purchaser Details</p>
                  <p className="font-bold text-gray-800 dark:text-gray-200">{activeOrder.customerName}</p>
                  <p>{activeOrder.customerEmail}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">Shipping Recipient Address</p>
                  <p className="font-normal text-gray-700 dark:text-gray-300 leading-normal">{activeOrder.shippingAddress}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 glass-card rounded-2xl flex flex-col items-center justify-center">
              <Package className="w-12 h-12 text-gray-400 mb-2.5 animate-pulse" />
              <p className="text-sm font-semibold text-gray-750 dark:text-gray-305">No active tracking selected</p>
              <p className="text-xs text-gray-400 max-w-xs mt-1">
                {user ? 'Select any invoices on the left menu, or insert code directly.' : 'Input your 6-digit transaction invoice ID to trace active parcel paths.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
