import React, { useState, useEffect } from 'react';
import { User, ShoppingBag, Bell, Compass, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Order, Notification } from '../types';

interface CustomerDashboardProps {
  user: any;
  onSelectProduct: (id: string) => void;
  setView: (view: string) => void;
}

export interface UserProfileForm {
  name: string;
  phone: string;
  address: string;
}

export default function CustomerDashboard({ user, onSelectProduct, setView }: CustomerDashboardProps) {
  const [profileForm, setProfileForm] = useState<UserProfileForm>({ name: '', phone: '', address: '' });
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Prefetch profile info, orders, and notifications
  useEffect(() => {
    if (!user) return;

    // 1. Fetch user custom details from firestore
    const fetchProfile = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setProfileForm({
            name: data.name || user.displayName || '',
            phone: data.phoneNumber || '',
            address: data.shippingAddress || '',
          });
        } else {
          setProfileForm({
            name: user.displayName || '',
            phone: '',
            address: '',
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'users/' + user.uid);
      }
    };
    fetchProfile();

    // 2. Query Orders
    const fetchOrders = async () => {
      try {
        const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const list: Order[] = [];
        snap.forEach((doc) => {
          list.push(doc.data() as Order);
        });
        setOrders(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, 'orders');
      }
    };
    fetchOrders();

    // 3. Listen to Notifications Snapshot (Real-time updates)
    const notifQuery = query(collection(db, 'notifications'), where('userId', '==', user.uid));
    const unsubscribeNotif = onSnapshot(
      notifQuery,
      (snapshot) => {
        const list: Notification[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Notification);
        });
        setNotifications(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'notifications');
      }
    );

    return () => unsubscribeNotif();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    setSaveSuccess(false);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          uid: user.uid,
          name: profileForm.name,
          email: user.email,
          role: 'customer',
          phoneNumber: profileForm.phone,
          shippingAddress: profileForm.address,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      
      {/* Greetings Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-indigo-900/40 to-orange-950/20 border border-white/10 p-6 md:p-8 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Profile avatar"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full border-2 border-white/25 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-xl font-bold font-sans">
              {(profileForm.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Assalamu Alaikum, {profileForm.name || 'Member'}!</h2>
            <p className="text-xs text-indigo-200 mt-1">Manage your active payments, invoice histories, and notifications tracking.</p>
          </div>
        </div>

        <button
          onClick={() => setView('home')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.8 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <Compass className="w-4 h-4 text-orange-400" />
          <span>Shop Collections</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Profile Form Modifier */}
        <div className="space-y-4 lg:col-span-1">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Customer Profile Settings</h3>
          
          <form onSubmit={handleUpdateProfile} className="p-6 glass-card rounded-2xl space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Email Address (Immutable)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full text-xs px-3 py-2 border-none glass-input text-gray-400 dark:text-gray-550 rounded-xl cursor-not-allowed opacity-60"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Display Name</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full text-xs px-3 py-2 border-none glass-input text-gray-900 dark:text-white rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Contact Number</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="e.g. 01700000000"
                className="w-full text-xs px-3 py-2 border-none glass-input text-gray-900 dark:text-white rounded-xl focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Default Shipping Address</label>
              <textarea
                rows={2}
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                placeholder="Insert house, village, sector, area zip code..."
                className="w-full text-xs px-3 py-2 border-none glass-input text-gray-900 dark:text-white rounded-xl focus:outline-none"
              />
            </div>

            {saveSuccess && (
              <p className="text-xs text-teal-600 dark:text-teal-400 font-medium bg-emerald-500/10 py-2 rounded-lg text-center flex items-center justify-center gap-1 border border-emerald-500/15">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Custom profile configurations applied!</span>
              </p>
            )}

            <button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm py-2.5 rounded-xl transition shadow shadow-indigo-600/20 cursor-pointer"
            >
              {isUpdating ? 'Applying...' : 'Save Profile Details'}
            </button>
          </form>
        </div>

        {/* Right Side: Tabular layouts for Purchases vs Notifications stream */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Notifications Alert banner */}
          {notifications.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 leading-none">
                <Bell className="w-4.5 h-4.5 text-orange-500 animate-swing" />
                <span>Account Notifications</span>
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="p-3 border border-orange-500/10 dark:border-orange-950/20 bg-orange-500/5 dark:bg-orange-950/10 rounded-xl text-xs flex gap-2.5 shadow-xs"
                  >
                    <span className="text-orange-500 font-bold shrink-0">ℹ</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 dark:text-gray-200">{notif.title}</p>
                      <p className="text-gray-500 mt-0.5 font-normal leading-relaxed">{notif.message}</p>
                    </div>
                    <span className="text-[9px] text-gray-400 font-mono shrink-0">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History Lists */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 leading-none">
              <ShoppingBag className="w-4.5 h-4.5 text-teal-600" />
              <span>Purchase History ({orders.length})</span>
            </h3>

            {orders.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-2xl">
                <span className="text-3xl text-gray-300">📦</span>
                <p className="text-xs font-semibold text-gray-500 mt-2">Zero matching histories.</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Explore our garments, watches, or gadgets catalogs and place your first transaction!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 glass-card rounded-2.5xl space-y-4"
                  >
                    {/* Invoice Base bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-150 dark:border-slate-800/40 pb-3 text-xs">
                      <div>
                        <p className="font-extrabold text-gray-900 dark:text-white flex items-center gap-1">
                          <span>Invoice:</span>
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 select-all">{ord.id}</span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{new Date(ord.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-0.8 rounded-lg font-bold uppercase tracking-wider text-[10px] ${
                          ord.status === 'Delivered'
                            ? 'bg-emerald-55/15 text-emerald-600 border border-emerald-500/10'
                            : ord.status === 'Cancelled'
                            ? 'bg-rose-55/15 text-rose-600 border border-rose-500/10'
                            : 'bg-amber-55/15 text-amber-600 border border-amber-500/10'
                        }`}>
                          {ord.status}
                        </span>

                        <span className="bg-white/40 dark:bg-slate-800/40 text-gray-650 dark:text-gray-350 px-2.5 py-0.8 rounded-lg font-bold text-[10px] border border-white/20 dark:border-white/10">
                          ৳{ord.finalTotal}
                        </span>
                      </div>
                    </div>

                    {/* Ordered products thumbnails checklist */}
                    <div className="flex gap-3 overflow-x-auto select-none py-1 h-14">
                      {ord.products.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => onSelectProduct(p.productId)}
                          className="w-12 h-12 rounded-lg overflow-hidden border border-gray-150 dark:border-slate-800 shrink-0 cursor-pointer"
                          title={`${p.name} (${p.quantity} Unit)`}
                        >
                          <img
                            src={p.image}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover hover:scale-108 duration-150"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Order tracing shortcut */}
                    <div className="flex justify-between items-center text-xs">
                      <p className="text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate max-w-xs">{ord.shippingAddress}</span>
                      </p>

                      <button
                        onClick={() => setView('tracking')}
                        className="text-xs font-bold text-indigo-650 dark:text-indigo-405 hover:underline cursor-pointer"
                      >
                        ✈ Track Transit Steps
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
