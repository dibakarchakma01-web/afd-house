import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  FolderOpen, 
  Tag, 
  Calendar, 
  Users, 
  MessageSquare, 
  CreditCard, 
  Star, 
  Trash2, 
  Edit2, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  Clock, 
  AlertTriangle, 
  CheckSquare, 
  TrendingUp, 
  Barcode, 
  BookOpen, 
  Image, 
  Award,
  Globe,
  Activity,
  ShoppingCart,
  ShieldCheck,
  Mail,
  RefreshCw,
  BarChart3,
  Settings,
  Eye,
  Printer,
  Archive,
  Menu,
  X,
  PieChart,
  ClipboardList,
  Store,
  LogOut
} from 'lucide-react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product, Category, Order, Coupon, Review, ChatThread, ChatMessage, Notification, Brand, WebsiteSettings } from '../types';
import { useAdmin } from '../contexts/AdminContext';
import { useAuth } from '../contexts/AuthContext';
import { AnalyticsDashboard } from '../components/Admin/AnalyticsDashboard';

interface AdminDashboardViewProps {
  onBackToShop?: () => void;
  onLogout?: () => void;
}

export default function AdminDashboardView({ onBackToShop, onLogout }: AdminDashboardViewProps = {}) {
  const { 
    products, setProducts, 
    orders, setOrders, 
    categories, setCategories, 
    subcategories, setSubcategories,
    brands, setBrands, 
    coupons, setCoupons, 
    reviews, setReviews, 
    customers: contextCustomers, 
    loading: adminLoading 
  } = useAdmin();
  const { user, isAdmin, isStaff, logoutAdmin } = useAuth();

  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'inventory' | 'products' | 'categories' | 'brands' | 'orders' | 'coupons' | 'reviews' | 'chats' | 'customers' | 'carts' | 'settings'>('dashboard');

  // Website Settings state
  const [websiteSettings, setWebsiteSettings] = useState<WebsiteSettings | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Form states for settings
  const [settingsForm, setSettingsForm] = useState<WebsiteSettings>({
    logoURL: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    socialLinks: { facebook: '', twitter: '', instagram: '', youtube: '' },
    homepageBanners: [],
    heroTitle: '',
    heroSubtitle: ''
  });

  // Local state extensions
  const [allCarts, setAllCarts] = useState<any[]>([]);
  const [customerQuery, setCustomerQuery] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  
  // Customer Edit Form states
  const [cNameForm, setCNameForm] = useState('');
  const [cEmailForm, setCEmailForm] = useState('');
  const [cPhoneForm, setCPhoneForm] = useState('');
  const [cAddressForm, setCAddressForm] = useState('');

  // Indicators mapping
  const [notificationSuccess, setNotificationSuccess] = useState<string | null>(null);
  
  // Custom interactive notification states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Sync Carts real-time (Customers are provided by useAdmin)
  useEffect(() => {
    if (!user) return;

    // Fetch Website Settings
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'website'));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data() as WebsiteSettings;
          setWebsiteSettings(data);
          setSettingsForm(data);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'settings/website');
      }
    };
    fetchSettings();

    const unsubCarts = onSnapshot(
      collection(db, 'cart'),
      (snap) => {
        const list: any[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setAllCarts(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'cart');
      }
    );

    return () => {
      unsubCarts();
    };
  }, [user]);

  // Map context customers to local state
  const customers = contextCustomers;

  // Products manager state variables
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: '',
    salePrice: '',
    stock: '',
    category: '',
    subcategory: '',
    brand: '',
    sku: '',
    imageURL: '',
    tags: '',
    status: 'active' as 'active' | 'inactive',
    isFeatured: false,
    isNewArrival: false,
    isBestSeller: false,
  });
  const [isEditingProduct, setIsEditingProduct] = useState(false);

  // Categories manager state variables
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catImage, setCatImage] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Subcategories local form states
  const [subCatName, setSubCatName] = useState('');
  const [subCatSlug, setSubCatSlug] = useState('');
  const [subCatCategoryId, setSubCatCategoryId] = useState('');
  const [editingSubCategoryId, setEditingSubCategoryId] = useState<string | null>(null);

  // BRANDS CRUD local state variables
  const [bName, setBName] = useState('');
  const [bSlug, setBSlug] = useState('');
  const [bLogo, setBLogo] = useState('');
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);

  // Coupons manager state variables
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    expiryDate: '',
  });

  // Chats Support Console state integration
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [replyInput, setReplyInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // 1. Core Financial Performance Metrics states
  const totalRevenue = orders.filter((o) => o.status !== 'Cancelled').reduce((sum, o) => sum + o.finalTotal, 0);
  const totalOrders = orders.length;
  const uniqueCustomers = Array.from(new Set(orders.map((o) => o.customerEmail))).length;

  // 2. Specific Inventory requirements metrics statics
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === 'active' || p.status === undefined).length;
  const outOfStockProducts = products.filter((p) => p.stock <= 0).length;
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 10).length;

  // 3. Live Top Selling products list parsed dynamically from orders
  const topSellingProducts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.status !== 'Cancelled') {
        o.products.forEach((op) => {
          counts[op.productId] = (counts[op.productId] || 0) + op.quantity;
        });
      }
    });

    return Object.entries(counts)
      .map(([id, qty]) => {
        const p = products.find((prod) => prod.id === id);
        return {
          id,
          name: p ? p.name : 'Out-of-catalog Product',
          category: p ? p.category : 'General',
          price: p ? (p.salePrice || p.price) : 0,
          thumbnail: p ? p.images[0] : '',
          unitsSold: qty,
          revenue: qty * (p ? (p.salePrice || p.price) : 0)
        };
      })
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5);
  }, [orders, products]);

  // Sync Support Threads Real-Time on mount
  useEffect(() => {
    const unsubscribeThreads = onSnapshot(
      collection(db, 'chats'),
      (snap) => {
        const list: ChatThread[] = [];
        snap.forEach((doc) => {
          list.push(doc.data() as ChatThread);
        });
        setChatThreads(list.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'chats');
      }
    );
    return () => unsubscribeThreads();
  }, []);

  // Listen to messages when thread is selected
  useEffect(() => {
    if (!selectedThreadId) return;

    const q = query(collection(db, 'chats', selectedThreadId, 'messages'));
    const unsubscribeMsgs = onSnapshot(
      q,
      (snap) => {
        const list: any[] = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setChatMessages(list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'chats/' + selectedThreadId + '/messages');
      }
    );

    return () => unsubscribeMsgs();
  }, [selectedThreadId]);

  // Scroll support window down
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-'); // Replace multiple - with single -
  };

  // PRODUCTS SUBMISSION EVENT HANDLER (Add or Edit)
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.stock || !productForm.category || !productForm.imageURL) return;

    const productId = isEditingProduct ? productForm.id : 'p' + Math.floor(10000 + Math.random() * 90000);
    const calculatedSlug = productForm.slug.trim() || slugify(productForm.name);
    const calculatedSku = productForm.sku.trim() || 'SKU-' + Math.floor(100000 + Math.random() * 900000);

    const completeProduct: Product = {
      id: productId,
      name: productForm.name,
      slug: calculatedSlug,
      description: productForm.description,
      shortDescription: productForm.shortDescription || productForm.description.slice(0, 80) + '...',
      price: Number(productForm.price),
      salePrice: productForm.salePrice ? Number(productForm.salePrice) : undefined,
      discountPrice: productForm.salePrice ? Number(productForm.price) - Number(productForm.salePrice) : 0,
      stock: Number(productForm.stock),
      category: productForm.category,
      subcategory: productForm.subcategory || '',
      brand: productForm.brand || 'Unbranded',
      sku: calculatedSku,
      images: [productForm.imageURL],
      thumbnail: productForm.imageURL,
      rating: isEditingProduct ? products.find((p) => p.id === productForm.id)?.rating || 5 : 5,
      reviewsCount: isEditingProduct ? products.find((p) => p.id === productForm.id)?.reviewsCount || 0 : 0,
      tags: productForm.tags ? productForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      status: productForm.status,
      isFeatured: productForm.isFeatured,
      isNewArrival: productForm.isNewArrival,
      isBestSeller: productForm.isBestSeller,
      createdAt: isEditingProduct ? products.find((p) => p.id === productForm.id)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'products', productId), completeProduct);
      
      if (isEditingProduct) {
        setProducts(products.map((p) => (p.id === productId ? completeProduct : p)));
        showToast(`Product "${completeProduct.name}" specs updated!`, 'success');
      } else {
        setProducts([...products, completeProduct]);
        showToast(`Product "${completeProduct.name}" listed successfully!`, 'success');
      }

      // Reset Form fields
      setProductForm({
        id: '',
        name: '',
        slug: '',
        description: '',
        shortDescription: '',
        price: '',
        salePrice: '',
        stock: '',
        category: '',
        subcategory: '',
        brand: '',
        sku: '',
        imageURL: '',
        tags: '',
        status: 'active',
        isFeatured: false,
        isNewArrival: false,
        isBestSeller: false,
      });
      setIsEditingProduct(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${productId}`);
      showToast('Error saving product specifications!', 'error');
    }
  };

  const handleEditProductClick = (p: Product) => {
    setProductForm({
      id: p.id,
      name: p.name,
      slug: p.slug || '',
      description: p.description,
      shortDescription: p.shortDescription || '',
      price: String(p.price),
      salePrice: p.salePrice ? String(p.salePrice) : '',
      stock: String(p.stock),
      category: p.category,
      subcategory: p.subcategory || '',
      brand: p.brand || '',
      sku: p.sku || '',
      imageURL: p.images[0] || '',
      tags: p.tags ? p.tags.join(', ') : '',
      status: p.status || 'active',
      isFeatured: !!p.isFeatured,
      isNewArrival: !!p.isNewArrival,
      isBestSeller: !!p.isBestSeller,
    });
    setIsEditingProduct(true);
    setActiveTab('products');
  };

  const handleArchiveProduct = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'archived' ? 'active' : 'archived';
    try {
      await updateDoc(doc(db, 'products', id), { status: nextStatus });
      setProducts(products.map(p => p.id === id ? { ...p, status: nextStatus as any } : p));
      showToast(nextStatus === 'archived' ? 'Product archived successfully' : 'Product active again!', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${id}`);
      showToast('Error changing product status!', 'error');
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const idToDelete = productToDelete;
    const previousProducts = [...products];

    // Optimistically update UI immediately
    setProducts(products.filter((p) => p.id !== idToDelete));
    setProductToDelete(null);
    showToast('Product deleted successfully', 'success');

    try {
      await deleteDoc(doc(db, 'products', idToDelete));
    } catch (err) {
      console.error('Failed to delete product from database:', err);
      // Rollback if delete fails
      setProducts(previousProducts);
      handleFirestoreError(err, OperationType.DELETE, `products/${idToDelete}`);
      showToast('Error permanently deleting product!', 'error');
    }
  };

  // CATEGORIES SUBMISSION
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug || !catImage) return;

    const cSlug = slugify(catSlug);
    const catId = editingCategoryId || 'cat-' + Math.floor(100 + Math.random() * 900);
    const newCat: Category = {
      id: catId,
      name: catName,
      slug: cSlug,
      image: catImage,
    };

    try {
      await setDoc(doc(db, 'categories', catId), newCat);
      if (editingCategoryId) {
        setCategories(categories.map(c => c.id === catId ? newCat : c));
        setEditingCategoryId(null);
      } else {
        setCategories([...categories, newCat]);
      }
      setCatName('');
      setCatSlug('');
      setCatImage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `categories/${catId}`);
    }
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatImage(cat.image);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Category? All nested subcategories will lose their parent relation.')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      setCategories(categories.filter(c => c.id !== id));
      if (editingCategoryId === id) {
        setEditingCategoryId(null);
        setCatName('');
        setCatSlug('');
        setCatImage('');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
    }
  };

  // SUBCATEGORIES SUBMISSION & CRUD MUTATIONS
  const handleSubCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCatName || !subCatSlug || !subCatCategoryId) return;

    const sSlug = slugify(subCatSlug);
    const subId = editingSubCategoryId || 'sub-' + Math.floor(100 + Math.random() * 900);
    const newSub = {
      id: subId,
      name: subCatName,
      slug: sSlug,
      categoryId: subCatCategoryId
    };

    try {
      await setDoc(doc(db, 'subcategories', subId), newSub);
      if (editingSubCategoryId) {
        setSubcategories(subcategories.map(s => s.id === subId ? newSub : s));
        setEditingSubCategoryId(null);
      } else {
        setSubcategories([...subcategories, newSub]);
      }
      setSubCatName('');
      setSubCatSlug('');
      setSubCatCategoryId('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `subcategories/${subId}`);
    }
  };

  const handleEditSubCategory = (sub: any) => {
    setEditingSubCategoryId(sub.id);
    setSubCatName(sub.name);
    setSubCatSlug(sub.slug);
    setSubCatCategoryId(sub.categoryId);
  };

  const handleDeleteSubCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Subcategory?')) return;
    try {
      await deleteDoc(doc(db, 'subcategories', id));
      setSubcategories(subcategories.filter(s => s.id !== id));
      if (editingSubCategoryId === id) {
        setEditingSubCategoryId(null);
        setSubCatName('');
        setSubCatSlug('');
        setSubCatCategoryId('');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `subcategories/${id}`);
    }
  };

  // BRANDS SYSTEM CRUD MUTATIONS
  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName || !bSlug) return;

    const brandId = editingBrandId || 'brand-' + Math.floor(1000 + Math.random() * 9000);
    const formattedSlug = slugify(bSlug);
    const brandPayload: Brand = {
      id: brandId,
      name: bName,
      slug: formattedSlug,
      logo: bLogo || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=150',
    };

    try {
      await setDoc(doc(db, 'brands', brandId), brandPayload);
      if (setBrands) {
        if (editingBrandId) {
          setBrands(brands.map((b) => (b.id === brandId ? brandPayload : b)));
        } else {
          setBrands([...brands, brandPayload]);
        }
      }
      setBName('');
      setBSlug('');
      setBLogo('');
      setEditingBrandId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `brands/${brandId}`);
    }
  };

  const startEditBrand = (b: Brand) => {
    setEditingBrandId(b.id);
    setBName(b.name);
    setBSlug(b.slug);
    setBLogo(b.logo || '');
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!confirm('Delete this corporate brand definition? Products linked to it will remain visible but classified as unbranded.')) return;
    try {
      await deleteDoc(doc(db, 'brands', brandId));
      if (setBrands) {
        setBrands(brands.filter((b) => b.id !== brandId));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `brands/${brandId}`);
    }
  };

  // TRANSIT ORDERS STATUS CHANGED
  const handleStatusChange = async (orderId: string, status: Order['status'], customerUserId?: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      // Update local React state instantly
      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
      
      // Seed notifications trigger logic inside cloud
      if (customerUserId) {
        const notifId = 'notif-' + Math.floor(10000 + Math.random() * 90000);
        const alertObj: Notification = {
          id: notifId,
          userId: customerUserId,
          title: `Order status ${status}`,
          message: `Your high priority order ID: ${orderId} has been successfully updated to status: ${status}.`,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'notifications', notifId), alertObj);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${orderId}`);
    }
  };

  // COUPONS SYSTEM CRUD
  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountValue || !couponForm.expiryDate) return;

    const promoCode = couponForm.code.trim().toUpperCase();
    const newCoupon: Coupon = {
      code: promoCode,
      discountType: couponForm.discountType,
      discountValue: Number(couponForm.discountValue),
      expiryDate: couponForm.expiryDate,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'coupons', promoCode), newCoupon);
      setCoupons([...coupons, newCoupon]);
      setCouponForm({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        expiryDate: '',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `coupons/${promoCode}`);
    }
  };

  const toggleCouponStatus = async (code: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'coupons', code), { isActive: !current });
      setCoupons(coupons.map((c) => (c.code === code ? { ...c, isActive: !current } : c)));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `coupons/${code}`);
    }
  };

  // CHAT OPERATOR DESPATCH MSG
  const handleSendReplyChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedThreadId) return;

    const operatorMsgId = 'opmsg-' + Math.floor(10000 + Math.random() * 90000);
    const chatPayload: ChatMessage = {
      senderId: 'admin',
      senderName: 'AFD HOUSE Operator Support',
      senderRole: 'admin',
      message: replyInput.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Post to nested messages array
      await setDoc(doc(db, 'chats', selectedThreadId, 'messages', operatorMsgId), chatPayload);

      // 2. Refresh thread metadata triggers
      await updateDoc(doc(db, 'chats', selectedThreadId), {
        lastMessage: replyInput.trim(),
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
      });

      setReplyInput('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `chats/${selectedThreadId}/messages/${operatorMsgId}`);
    }
  };

  // Customer management functions
  const handleEditCustomerClick = (cust: any) => {
    setEditingCustomer(cust);
    setCNameForm(cust.name || '');
    setCEmailForm(cust.email || '');
    setCPhoneForm(cust.phoneNumber || '');
    setCAddressForm(cust.shippingAddress || '');
  };

  const handleEditCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      await setDoc(doc(db, 'users', editingCustomer.uid), {
        ...editingCustomer,
        name: cNameForm,
        email: cEmailForm,
        phoneNumber: cPhoneForm,
        shippingAddress: cAddressForm,
      }, { merge: true });

      setEditingCustomer(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${editingCustomer.uid}`);
    }
  };

  const toggleCustomerRole = async (cust: any) => {
    const nextRole = cust.role === 'admin' ? 'customer' : 'admin';
    if (!confirm(`Are you sure you want to change role of "${cust.name || cust.email}" to ${nextRole}?`)) return;

    try {
      await setDoc(doc(db, 'users', cust.uid), {
        ...cust,
        role: nextRole
      }, { merge: true });

      // Keep admins mirror collection updated
      if (nextRole === 'admin') {
        await setDoc(doc(db, 'admins', cust.uid), {
          uid: cust.uid,
          email: cust.email,
          createdAt: new Date().toISOString()
        });
      } else {
        await deleteDoc(doc(db, 'admins', cust.uid));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${cust.uid}`);
    }
  };

  const sendCartReminderNotification = async (userId: string, totalVal: number) => {
    const notifId = 'notif-' + Math.floor(10000 + Math.random() * 90000);
    const notificationPayload = {
      id: notifId,
      userId,
      title: '🛒 Pending Items in Your Cart!',
      message: `Greetings! You have premium products waiting in your cart worth ৳${totalVal.toLocaleString()}. Claim them now before stocks run dry!`,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'notifications', notifId), notificationPayload);
      setNotificationSuccess(userId);
      setTimeout(() => setNotificationSuccess(null), 3500);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `notifications/${notifId}`);
    }
  };

  const forceClearCartItem = async (cartItemId: string) => {
    if (!confirm('Are you sure you want to remove this active item from customer cart records?')) return;
    try {
      await deleteDoc(doc(db, 'cart', cartItemId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `cart/${cartItemId}`);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'website'), settingsForm);
      setWebsiteSettings(settingsForm);
      alert('Website settings updated successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/website');
    }
  };

  const handleReviewAction = async (reviewId: string, action: 'approve' | 'reject' | 'delete') => {
    try {
      if (action === 'delete') {
        if (!confirm('Permanently delete this review?')) return;
        await deleteDoc(doc(db, 'reviews', reviewId));
        setReviews(reviews.filter(r => r.id !== reviewId));
      } else {
        await updateDoc(doc(db, 'reviews', reviewId), { status: action });
        setReviews(reviews.map(r => r.id === reviewId ? { ...r, status: action } : r));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `reviews/${reviewId}`);
    }
  };

  const handlePrintInvoice = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    // Simple print implementation
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${order.id}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; }
              .details { margin-top: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
              .total { text-align: right; margin-top: 30px; font-weight: bold; font-size: 1.2em; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>AFD HOUSE</h1>
              <div>
                <p>Order ID: ${order.id}</p>
                <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div class="details">
              <h3>Customer Details:</h3>
              <p>Name: ${order.customerName}</p>
              <p>Email: ${order.customerEmail}</p>
              <p>Address: ${order.shippingAddress}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${order.products.map(p => `
                  <tr>
                    <td>${p.name}</td>
                    <td>৳${p.price}</td>
                    <td>${p.quantity}</td>
                    <td>৳${p.price * p.quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total">
              <p>Subtotal: ৳${order.total}</p>
              <p>Discount: ৳${order.discount}</p>
              <p>Final Total: ৳${order.finalTotal}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Group active cart records dynamically for monitoring
  const groupedCarts = useMemo(() => {
    const groups: Record<string, any[]> = {};
    allCarts.forEach((item) => {
      if (!item.userId) return;
      if (!groups[item.userId]) {
        groups[item.userId] = [];
      }
      groups[item.userId].push(item);
    });

    return Object.entries(groups).map(([userId, items]) => {
      const parentCustomer = customers.find((c) => c.uid === userId);
      
      const cartProducts = items.map((cartItem) => {
        const prod = products.find((p) => p.id === cartItem.productId);
        return {
          cartItemId: cartItem.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
          product: prod,
          updatedAt: cartItem.updatedAt || cartItem.createdAt
        };
      });

      const totalValue = cartProducts.reduce((sum, cp) => {
        if (cp.product) {
          return sum + (cp.product.salePrice || cp.product.price) * cp.quantity;
        }
        return sum;
      }, 0);

      return {
        userId,
        customerName: parentCustomer?.name || 'Guest/Anonymous User',
        customerEmail: parentCustomer?.email || 'No email registered',
        customerPhone: parentCustomer?.phoneNumber || 'No phone registered',
        products: cartProducts,
        totalValue,
        lastUpdated: items[0]?.updatedAt || items[0]?.createdAt || new Date().toISOString()
      };
    });
  }, [allCarts, customers, products]);

  // Extended financial insights for analytical charts
  const deliveredRevenue = orders.filter((o) => o.status === 'Delivered').reduce((sum, o) => sum + o.finalTotal, 0);
  const transitRevenue = orders.filter((o) => ['Processing', 'Shipped'].includes(o.status)).reduce((sum, o) => sum + o.finalTotal, 0);
  const totalDiscountsApplied = orders.reduce((sum, o) => sum + (o.discount || 0), 0);
  const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  
  // Conversion Rate is Completed Checkout Orders divided by Carts plus Orders total
  const cartConversionRate = useMemo(() => {
    const completedOrdersCount = orders.filter(o => o.status === 'Delivered').length;
    const activeCartsCount = groupedCarts.length;
    if (completedOrdersCount === 0 && activeCartsCount === 0) return 0;
    return (completedOrdersCount / (completedOrdersCount + activeCartsCount)) * 100;
  }, [orders, groupedCarts]);

  // Product categories performance mapping
  const categoryRevenue = useMemo(() => {
    const revs: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.status !== 'Cancelled') {
        o.products.forEach((op) => {
          const p = products.find((prod) => prod.id === op.productId);
          const cat = p ? p.category : 'general';
          revs[cat] = (revs[cat] || 0) + (op.price * op.quantity);
        });
      }
    });
    return Object.entries(revs)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [orders, products]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50/30 dark:bg-slate-950/20 font-sans -mx-4 sm:-mx-6 lg:-mx-8 -my-8 pb-0">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-bounce cursor-pointer max-w-md" onClick={() => setToast(null)}>
          <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-bold duration-300 ${
            toast.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/85 border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-sans' 
              : 'bg-rose-50 dark:bg-rose-955 border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 font-sans'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-550 animate-pulse shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-550 animate-pulse shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Confirmation Modal before Deleting */}
      {productToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 max-w-sm w-full border border-gray-150 dark:border-slate-800 shadow-2xl animate-scaleUp">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-red-100 dark:bg-red-950/50 p-4 rounded-full text-red-650 dark:text-red-450 animate-pulse">
                <Trash2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 px-2">
                <h3 className="text-md font-black text-gray-900 dark:text-white leading-snug">
                  Are you sure you want to delete this product?
                </h3>
                <p className="text-[11px] text-gray-450 dark:text-gray-400 leading-normal">
                  This action is irreversible and will permanently delete the product from the catalog.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full pt-2">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="px-4 py-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-755 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition cursor-pointer border border-gray-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteProduct}
                  className="px-4 py-3 bg-red-650 hover:bg-red-750 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-600/15 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fadeIn"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-gray-150 dark:border-slate-800 transition-transform duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full shadow-none'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full border border-gray-150 dark:border-slate-800 overflow-hidden flex items-center justify-center bg-white shrink-0 shadow-sm">
                <img 
                  src="/logo.png" 
                  alt="AFD House Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="text-lg font-black text-indigo-600 dark:text-indigo-400 tracking-tighter leading-none">AFD HOUSE</h1>
                <p className="text-[8px] text-gray-400 font-extrabold uppercase tracking-[0.2em] mt-0.5">Control Panel</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1 custom-scrollbar">
            {[
              { tab: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { tab: 'analytics', label: 'Analytics', icon: BarChart3 },
              { tab: 'inventory', label: 'Inventory', icon: ClipboardList },
              { tab: 'products', label: 'Products', icon: ShoppingBag },
              { tab: 'categories', label: 'Categories', icon: FolderOpen },
              { tab: 'brands', label: 'Brands', icon: Globe },
              { tab: 'orders', label: 'Orders', icon: CreditCard },
              { tab: 'customers', label: 'Customers', icon: Users },
              { tab: 'carts', label: 'Live Carts', icon: ShoppingCart },
              { tab: 'coupons', label: 'Coupons', icon: Tag },
              { tab: 'reviews', label: 'Reviews', icon: Star },
              { tab: 'chats', label: 'Support Desk', icon: MessageSquare },
              { tab: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => {
                     setActiveTab(item.tab as any);
                     if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-extrabold transition-all duration-300 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20'
                      : 'text-gray-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 hover:text-indigo-600 dark:hover:text-indigo-400 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span className="uppercase tracking-wider">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-6 mt-6 border-t border-gray-100 dark:border-slate-805 space-y-4">
            <div className="flex flex-col gap-1.5">
              {onBackToShop && (
                <button
                  type="button"
                  onClick={onBackToShop}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 transition-all border border-transparent hover:border-teal-100 dark:hover:border-teal-900/40"
                >
                  <Store className="w-4 h-4 text-teal-550" />
                  <span>Back To Shop</span>
                </button>
              )}
              <button
                type="button"
                onClick={onLogout || logoutAdmin}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955 transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/40"
              >
                <LogOut className="w-4 h-4 text-rose-550" />
                <span>Sign Out</span>
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800">
               <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
                 {user?.email?.charAt(0).toUpperCase()}
               </div>
               <div className="min-w-0 flex-1">
                 <p className="text-[10px] font-black text-gray-900 dark:text-white truncate">{user?.displayName || 'Admin'}</p>
                 <p className="text-[9px] text-gray-400 font-mono truncate">Staff Account</p>
               </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        
        {/* Mobile Navigation Header */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-150 dark:border-slate-800">
           <button 
             onClick={() => setIsSidebarOpen(true)}
             className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
           >
             <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
           </button>
           <h1 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.3em]">AFD HOUSE</h1>
           <div className="w-10 h-10" />
        </header>

        <div className="p-4 md:p-10 space-y-10 custom-scrollbar">
          
          {/* Header Title with Breadcrumbs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded uppercase tracking-widest">Admin Hub</span>
                <span className="text-gray-300">/</span>
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest capitalize">{activeTab}</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight capitalize">
                {activeTab === 'dashboard' ? 'Overview' : activeTab.replace('-', ' ')}
              </h2>
            </div>
          </div>

          {/* Tab Content Components */}
          
          {/* ---- Tab: Analytics Hub ---- */}
          {activeTab === 'analytics' && (
            <AnalyticsDashboard orders={orders} products={products} />
          )}

          {/* ---- Tab: Inventory Intelligence ---- */}
          {activeTab === 'inventory' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-7 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                     <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600">Stock Integrity Report</h3>
                     <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Real-time inventory levels across all collections</p>
                  </div>
                  <ClipboardList className="w-5 h-5 text-indigo-500" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {products.sort((a,b) => a.stock - b.stock).map(p => {
                      const isLow = p.stock > 0 && p.stock <= 10;
                      const isOut = p.stock <= 0;
                      return (
                        <div key={p.id} className={`p-4 border rounded-2xl flex items-center gap-4 transition-all ${isOut ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800/30' : isLow ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30' : 'bg-white dark:bg-slate-800/50 border-gray-100 dark:border-slate-700'}`}>
                           <img src={p.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-100/50" />
                           <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-gray-900 dark:text-white truncate">{p.name}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                 <div className="flex-1 h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, (p.stock / 50) * 100)}%` }} />
                                 </div>
                                 <span className={`text-[10px] font-black ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>{p.stock}</span>
                              </div>
                           </div>
                           <button onClick={() => handleEditProductClick(p)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition shadow-sm border border-gray-100 dark:border-slate-600">
                             <Edit2 className="w-3.5 h-3.5 text-gray-400 hover:text-indigo-600" />
                           </button>
                        </div>
                      );
                   })}
                </div>
              </div>
            </div>
          )}

          {/* ---- Tab 1: Statics Overview Dashboard ---- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* STATS KPIs OVERVIEW */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Sales Revenue', count: `৳${totalRevenue.toLocaleString()}`, trend: `Delivered: ৳${deliveredRevenue.toLocaleString()}`, theme: 'border-l-indigo-600' },
              { label: 'Avg Order Value (AOV)', count: `৳${Math.round(averageOrderValue).toLocaleString()}`, trend: `Based on ${orders.length} orders`, theme: 'border-l-blue-600' },
              { label: 'Cart Conversion Rate', count: `${cartConversionRate.toFixed(1)}%`, trend: `${groupedCarts.length} open customer carts`, theme: 'border-l-teal-600' },
              { label: 'Total Discounts applied', count: `৳${totalDiscountsApplied.toLocaleString()}`, trend: 'Coupon marketing value', theme: 'border-l-amber-600' }
            ].map((stat, i) => (
              <div
                key={i}
                className={`p-4 border border-gray-150 dark:border-slate-805 bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex flex-col justify-between h-28 border-l-4 ${stat.theme}`}
              >
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white mt-1.5 tracking-tight">{stat.count}</p>
                </div>
                <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-teal-600 shrink-0" />
                  <span className="truncate">{stat.trend}</span>
                </p>
              </div>
            ))}
          </div>

          {/* REAL TIME INVENTORY LEVEL & SUPPORT COUNTS */}
          <div>
            <h4 className="font-bold text-xs text-gray-400 uppercase tracking-widest mb-3.5 flex items-center gap-1">
              <Activity className="w-4 h-4 text-orange-500" />
              <span>Real-Time Inventory & Core Entities alerts</span>
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Products Catalog', count: totalProducts, subtitle: `${activeProducts} active online`, subClass: 'text-gray-400' },
                { label: 'Registered Customers', count: customers.length, subtitle: `${customers.filter(c => c.role === 'admin').length} admins promoted`, subClass: 'text-teal-600 font-semibold' },
                { label: 'Low Stock warnings', count: lowStockProducts, subtitle: 'Only 1 to 10 units left!', subClass: 'text-amber-655 font-bold', alert: lowStockProducts > 0 },
                { label: 'Active Support chats', count: chatThreads.filter(t => t.status !== 'closed').length, subtitle: `${chatThreads.length} total support logs`, subClass: 'text-indigo-600 font-bold' }
              ].map((inv, i) => (
                <div
                  key={i}
                  className={`p-4 border bg-white dark:bg-slate-900/60 rounded-2xl flex flex-col justify-between h-28 ${
                    inv.alert 
                      ? 'border-rose-150 dark:border-rose-95/30 bg-rose-50/5' 
                      : 'border-gray-150 dark:border-slate-805'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{inv.label}</p>
                      <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-1">{inv.count}</p>
                    </div>
                    {inv.alert && <AlertTriangle className="w-4 h-4 text-orange-500 animate-bounce cursor-pointer" onClick={() => setActiveTab('products')} />}
                  </div>
                  <p className={`text-[10px] ${inv.subClass}`}>{inv.subtitle}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CHRONOLOGICAL CHART STATS & TOP REVENUE SELLERS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 p-5 border border-gray-155 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-505" />
                    <span>Monthly Sales Analytics & Transit Revenue</span>
                  </h3>
                  <p className="text-[11px] text-gray-400">Chronological transaction logs.</p>
                </div>
                <span className="text-[10px] bg-green-500/10 text-green-600 px-2.5 py-0.8 rounded-lg font-bold font-mono">
                  Transit: ৳{transitRevenue.toLocaleString()}
                </span>
              </div>

              <div className="relative h-64 border-b border-l border-gray-100 dark:border-slate-850 flex items-end justify-between pt-10 px-4 gap-2">
                {[
                  { month: 'Jan', val: 125000 },
                  { month: 'Feb', val: 180000 },
                  { month: 'Mar', val: 240000 },
                  { month: 'Apr', val: 320000 },
                  { month: 'May', val: 290000 },
                  { month: 'Jun', val: totalRevenue, highlight: true }
                ].map((item, id) => {
                  const maxVal = 350000;
                  const pctHeight = Math.min(100, Math.max(10, (item.val / maxVal) * 100));

                  return (
                    <div key={id} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative">
                      <span className="absolute top-0 opacity-0 group-hover:opacity-100 bg-gray-950 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded shadow-lg pointer-events-none transition duration-100 transform -translate-y-2 select-none z-30">
                        ৳{item.val.toLocaleString()}
                      </span>

                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          item.highlight
                            ? 'bg-indigo-605'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                        style={{ height: `${pctHeight}%` }}
                      />
                      <span className="text-[9px] font-bold text-gray-400 select-none">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border border-gray-155 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-4 shadow-sm">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Top Selling Products</span>
                </h3>
                <p className="text-[11px] text-gray-400">Total metrics generated dynamically from checkout transactions.</p>
              </div>

              {topSellingProducts.length === 0 ? (
                <div className="py-14 text-center text-gray-400">
                  <span className="text-2xl block mb-2">📦</span>
                  <p className="text-xs font-semibold">No transactions logged yet.</p>
                  <p className="text-[10px] mt-0.5">Top Sellers are compiled when clients purchase products.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {topSellingProducts.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-gray-100 dark:border-slate-850">
                      {p.thumbnail && (
                        <img src={p.thumbnail} alt={p.name} className="w-10 h-10 object-cover rounded-lg border leading-none font-sans text-[8px] border-gray-150" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-gray-900 dark:text-white truncate" title={p.name}>{p.name}</p>
                        <p className="text-[10px] text-teal-600 dark:text-teal-400 font-bold mt-1 font-mono">{p.unitsSold} units • ৳{(p.revenue).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ADVANCED INTEGRATION REVENUE AND E-COMMERCE FUNNEL GRIDS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Sales Conversion Funnel SVG Graphic */}
            <div className="p-5 border border-gray-155 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-4 shadow-sm">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-teal-500" />
                  <span>Interactive Store Conversion Funnel</span>
                </h3>
                <p className="text-[11px] text-gray-400">Visualizing conversion leaks from account creation to completed order delivery.</p>
              </div>

              <div className="py-2 flex flex-col gap-3 font-mono">
                {[
                  { stage: '1. Total Accounts Registered', count: `${customers.length} Accounts`, width: '100%', pct: 100, color: 'bg-indigo-600/90' },
                  { stage: '2. Customer Accounts Active', count: `${customers.filter(c => c.phoneNumber || c.shippingAddress).length} Verified Profiles`, width: '82%', pct: 82, color: 'bg-blue-500' },
                  { stage: '3. Shoppers with Active Carts', count: `${groupedCarts.length} Carts`, width: `${Math.max(15, Math.min(100, (groupedCarts.length / (customers.length || 1)) * 100))}%`, pct: Math.round((groupedCarts.length / (customers.length || 1)) * 100), color: 'bg-teal-500' },
                  { stage: '4. Checkout Orders Placed', count: `${orders.length} Placed`, width: `${Math.max(10, Math.min(100, (orders.length / (customers.length || 1)) * 100))}%`, pct: Math.round((orders.length / (customers.length || 1)) * 100), color: 'bg-amber-500' },
                  { stage: '5. Dispatch Completed Deliveries', count: `${orders.filter(o => o.status === 'Delivered').length} Delivered`, width: `${Math.max(8, Math.min(100, (orders.filter(o => o.status === 'Delivered').length / (customers.length || 1)) * 105))}%`, pct: Math.round((orders.filter(o => o.status === 'Delivered').length / (customers.length || 1)) * 100), color: 'bg-emerald-500' },
                ].map((funnelStep, index) => (
                  <div key={index} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-gray-700 dark:text-gray-300">{funnelStep.stage}</span>
                      <span className="text-gray-455">{funnelStep.count} ({funnelStep.pct}%)</span>
                    </div>
                    <div className="w-full h-8 bg-slate-100 dark:bg-slate-950/80 rounded-xl overflow-hidden relative border border-gray-105 dark:border-slate-850">
                      <div 
                        className={`h-full ${funnelStep.color} flex items-center px-3.5 transition-all duration-1000`} 
                        style={{ width: funnelStep.width }}
                      >
                        <span className="text-[10px] text-white font-extrabold select-none truncate">
                          {funnelStep.pct}% Conversion rate
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department / Category Performance insights */}
            <div className="p-5 border border-gray-155 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-4 shadow-sm">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  <span>Category Revenue Contributions</span>
                </h3>
                <p className="text-[11px] text-gray-400">Total gross earnings breakdown compiled from customer sales logs.</p>
              </div>

              {categoryRevenue.length === 0 ? (
                <div className="py-20 text-center text-gray-400">
                  <span className="text-3xl block mb-2 font-sans">🏬</span>
                  <p className="text-xs font-semibold">No category transactions available yet.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {categoryRevenue.map((cat, i) => {
                    const totalSalesValue = categoryRevenue.reduce((sum, item) => sum + item.value, 0);
                    const percentContrib = totalSalesValue > 0 ? (cat.value / totalSalesValue) * 100 : 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold font-mono">
                          <span className="text-gray-850 dark:text-gray-205 capitalize">{cat.name.replace(/-/g, ' ')}</span>
                          <span className="text-indigo-650 dark:text-indigo-400">৳{cat.value.toLocaleString()} ({percentContrib.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full h-3 bg-slate-105 dark:bg-slate-950 rounded-full overflow-hidden border border-gray-105/40">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-650 rounded-full" 
                            style={{ width: `${percentContrib}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---- Tab 2: Products Master Catalogue ---- */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          
          {/* UPGRADED COMPREHENSIVE PRODUCT CRUD FORM PANEL */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
              {isEditingProduct ? <Edit2 className="w-4.5 h-4.5 text-indigo-650" /> : <Plus className="w-4.5 h-4.5 text-indigo-650" />}
              <span>{isEditingProduct ? '⚙ Edit Product Item' : '➕ List New Product'}</span>
            </h3>

            <form onSubmit={handleProductSubmit} className="p-5 border border-gray-150 dark:border-slate-805 bg-white dark:bg-slate-900 rounded-2.5xl space-y-3.5 shadow-sm">
              
              {/* Product Title Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Slim Fit Cotton Chino"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-gray-909 dark:text-white focus:outline-none"
                />
              </div>

              {/* Dynamic slug indicator */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block flex items-center gap-0.5">
                    <span>Slug Target</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. slim-fit-chin"
                    value={productForm.slug}
                    onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-gray-909"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block flex items-center gap-0.5">
                    <Barcode className="w-3.5 h-3.5" />
                    <span>SKU Code</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ZUNO-SL-01"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-gray-909"
                  />
                </div>
              </div>

              {/* Descriptions & Short Descriptions */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block flex items-center gap-0.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Short Description (Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Premium breathable cotton stretch trousers"
                  value={productForm.shortDescription}
                  onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Detailed Specifications</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Material specs, dynamic sizes, fabric counts, washing care instructions..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-gray-909"
                />
              </div>

              {/* Price blocks */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Regular Price (৳)</label>
                  <input
                    type="number"
                    required
                    placeholder="1850"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Discount Price (৳)</label>
                  <input
                    type="number"
                    placeholder="1490 or empty"
                    value={productForm.salePrice}
                    onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Dep and Brand picker lists */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Category</label>
                  <select
                    value={productForm.category}
                    required
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value, subcategory: '' })}
                    className="w-full text-xs px-2.5 py-2.5 rounded-xl border border-gray-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer capitalize font-semibold"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Sub Category</label>
                  <select
                    value={productForm.subcategory}
                    onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                    className="w-full text-xs px-2.5 py-2.5 rounded-xl border border-gray-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer capitalize font-semibold"
                    disabled={!productForm.category}
                  >
                    <option value="">-- Choose Subcategory (Optional) --</option>
                    {subcategories.filter(sc => sc.categoryId === productForm.category).map((s) => (
                      <option key={s.id} value={s.slug}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Brand Selection</label>
                  <select
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full text-xs px-2.5 py-2.5 rounded-xl border border-gray-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer font-semibold"
                  >
                    <option value="">Unbranded/Custom</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stock and Status picker */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Stock Level</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 100"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-gray-909"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Display Status</label>
                  <select
                    value={productForm.status}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value as any })}
                    className="w-full text-xs px-2.5 py-2.5 rounded-xl border border-gray-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                  >
                    <option value="active">🟢 Active In Store</option>
                    <option value="inactive">🔴 Inactive/Draft</option>
                  </select>
                </div>
              </div>

              {/* Image URL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block flex items-center gap-0.5">
                  <Image className="w-3.5 h-3.5" />
                  <span>Main Image snapshot URL</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={productForm.imageURL}
                  onChange={(e) => setProductForm({ ...productForm, imageURL: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>

              {/* Keywords / Indexing tags */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Indexing Search Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. stretch, cotton, chino, slimfit"
                  value={productForm.tags}
                  onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {/* Special toggling options flags */}
              <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-500 select-none pt-2 font-mono">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isFeatured}
                    onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                    className="accent-indigo-650"
                  />
                  <span>Featured</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isNewArrival}
                    onChange={(e) => setProductForm({ ...productForm, isNewArrival: e.target.checked })}
                    className="accent-indigo-650"
                  />
                  <span>New Arrival</span>
                </label>

                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isBestSeller}
                    onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })}
                    className="accent-indigo-650"
                  />
                  <span>Best Seller</span>
                </label>
              </div>

              {/* Submit Buttons selection operations */}
              <div className="flex gap-2.5 pt-4">
                {isEditingProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      setProductForm({
                        id: '',
                        name: '',
                        slug: '',
                        description: '',
                        shortDescription: '',
                        price: '',
                        salePrice: '',
                        stock: '',
                        category: '',
                        brand: '',
                        sku: '',
                        imageURL: '',
                        tags: '',
                        status: 'active',
                        isFeatured: false,
                        isNewArrival: false,
                        isBestSeller: false,
                      });
                      setIsEditingProduct(false);
                    }}
                    className="flex-1 bg-slate-105 hover:bg-slate-200 border border-transparent dark:border-slate-700 text-gray-600 dark:text-gray-300 font-bold py-2.5 rounded-xl text-xs uppercase transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 bg-indigo-605 hover:bg-indigo-705 text-white font-extrabold py-3.2 rounded-xl text-xs uppercase shadow shadow-indigo-650/15"
                >
                  {isEditingProduct ? '⚙ Save Changes' : '➕ List Product'}
                </button>
              </div>
            </form>
          </div>

          {/* TABLE DISPLAY CATALOG GRID LIST WITH ALERTS AND METAS */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-extrabold text-gray-905 dark:text-white uppercase tracking-wider">Catalog Inventory List ({products.length})</h3>

            <div className="border border-gray-155 dark:border-slate-850 rounded-2.5xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm overflow-x-auto select-none">
              <table className="w-full text-xs text-left divide-y divide-gray-105 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-950/40 text-gray-400 font-extrabold text-[9.5px] tracking-wider uppercase border-b border-gray-150">
                  <tr>
                    <th className="p-4">Catalog Item Specifications</th>
                    <th className="p-4">SKU Code / Brand</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock level</th>
                    <th className="p-4 text-center min-w-[140px]">Operation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-850 font-medium text-gray-700 dark:text-gray-300">
                  {products.map((p) => {
                    const isOutOfStock = p.stock <= 0;
                    const isLow = p.stock > 0 && p.stock <= 10;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                        
                        {/* Name and Thumbnail on left */}
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded-lg border border-gray-150 shrink-0 select-none"
                          />
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-gray-900 dark:text-white truncate max-w-[155px]">{p.name}</p>
                            <span className="text-[10px] text-gray-400 font-mono leading-none block mt-0.5">{p.id}</span>
                          </div>
                        </td>

                        {/* SKU and Brand */}
                        <td className="p-4">
                          <p className="font-mono text-gray-400 font-semibold">{p.sku || 'N/A'}</p>
                          <span className="text-[10px] text-indigo-650 dark:text-indigo-400 font-bold block mt-0.5 capitalize">{p.brand || 'No Brand'}</span>
                        </td>

                        {/* Category list */}
                        <td className="p-4 capitalize truncate max-w-[90px]">{p.category.replace(/-/g, ' ')}</td>

                        {/* Price */}
                        <td className="p-4 font-mono font-bold text-indigo-605">
                          ৳{p.salePrice || p.price}
                        </td>

                        {/* Stock alerts and indicators */}
                        <td className="p-4">
                          {isOutOfStock ? (
                            <span className="text-[10px] bg-rose-50 text-rose-500 border border-rose-100 rounded-lg px-2 py-0.5 font-bold uppercase">Sold Out</span>
                          ) : isLow ? (
                            <div>
                              <span className="text-amber-650 font-mono font-bold text-sm block leading-none">{p.stock}</span>
                              <span className="text-[8px] text-amber-500 font-extrabold uppercase mt-0.5 block tracking-tight">Low Stock!</span>
                            </div>
                          ) : (
                            <span className="font-mono font-bold text-gray-800 dark:text-gray-305 text-sm">{p.stock}</span>
                          )}
                        </td>

                        {/* Edit and Trash bin triggers */}
                        <td className="p-4 whitespace-nowrap text-center align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleArchiveProduct(p.id, p.status)}
                              className={`p-1.5 transition shadow-sm border rounded-lg cursor-pointer ${
                                p.status === 'archived'
                                  ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-200 dark:border-amber-900/40'
                                  : 'bg-gray-55 dark:bg-slate-800 text-gray-550 dark:text-gray-400 hover:text-amber-600 border-gray-200 dark:border-slate-705'
                              }`}
                              title={p.status === 'archived' ? "Unarchive Product" : "Archive Product"}
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditProductClick(p)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-650 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-slate-705 transition cursor-pointer flex items-center gap-1 font-bold text-xs"
                              title="Edit product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id)}
                              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition cursor-pointer flex items-center gap-1 font-bold text-xs shadow-sm shadow-red-650/10"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---- Tab 3: Categories Division ---- */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          {/* Left Column Forms */}
          <div className="lg:col-span-1 space-y-6">
            {/* Category Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>{editingCategoryId ? '⚙️ Edit Category' : '➕ Create Department Category'}</span>
              </h3>

              <form onSubmit={handleCategorySubmit} className="p-5 border border-gray-150 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-sm space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kids Outerwear"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-205 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Category Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. kids-outerwear"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-205 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Category Image URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://images.unsplash.com/photo-..."
                    value={catImage}
                    onChange={(e) => setCatImage(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-205 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl text-xs uppercase cursor-pointer"
                  >
                    {editingCategoryId ? 'Update Category' : 'Create Category'}
                  </button>
                  {editingCategoryId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(null);
                        setCatName('');
                        setCatSlug('');
                        setCatImage('');
                      }}
                      className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 font-extrabold px-4 rounded-xl text-xs uppercase"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Sub Category Form */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>{editingSubCategoryId ? '⚙️ Edit Sub Category' : '➕ Create Sub Category'}</span>
              </h3>

              <form onSubmit={handleSubCategorySubmit} className="p-5 border border-gray-150 dark:border-slate-850 bg-white dark:bg-slate-900 rounded-2xl shadow-sm space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Parent Category</label>
                  <select
                    required
                    value={subCatCategoryId}
                    onChange={(e) => setSubCatCategoryId(e.target.value)}
                    className="w-full text-xs px-2.5 py-2.5 rounded-xl border border-gray-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer capitalize font-semibold dark:text-white"
                  >
                    <option value="">-- Choose Parent --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sub Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Graphic T-Shirts"
                    value={subCatName}
                    onChange={(e) => setSubCatName(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-205 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sub Category Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. graphic-t-shirts"
                    value={subCatSlug}
                    onChange={(e) => setSubCatSlug(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-205 dark:border-slate-700 rounded-xl font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3 rounded-xl text-xs uppercase cursor-pointer"
                  >
                    {editingSubCategoryId ? 'Update Sub Category' : 'Create Sub Category'}
                  </button>
                  {editingSubCategoryId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSubCategoryId(null);
                        setSubCatName('');
                        setSubCatSlug('');
                        setSubCatCategoryId('');
                      }}
                      className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 font-extrabold px-4 rounded-xl text-xs uppercase"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Department tree overview columns */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Nested Catalog Architecture</h3>

            <div className="space-y-4">
              {categories.map((cat) => {
                const subcats = subcategories.filter((s) => s.categoryId === cat.slug);
                return (
                  <div
                    key={cat.id}
                    className="p-5 border border-gray-150 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 rounded-2xl space-y-4 shadow-sm animate-fadeIn"
                  >
                    <div className="flex items-center justify-between gap-4 border-b border-gray-50 dark:border-slate-800 pb-3">
                      <div className="flex items-center gap-4">
                        <img
                          src={cat.image}
                          alt={cat.name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 object-cover rounded-xl border border-gray-100 shrink-0"
                        />
                        <div>
                          <h4 className="text-sm font-extrabold text-gray-900 dark:text-white capitalize">{cat.name}</h4>
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">slug: {cat.slug}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditCategory(cat)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg transition cursor-pointer"
                          title="Edit category info"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-rose-600 rounded-lg transition cursor-pointer"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Subcategories under this category */}
                    <div className="pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-2">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Subcategories ({subcats.length})</p>
                      
                      {subcats.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {subcats.map((sub) => (
                            <div 
                              key={sub.id} 
                              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between gap-2 border border-slate-100 dark:border-slate-800"
                            >
                              <div>
                                <span className="text-xs font-bold text-gray-800 dark:text-white">{sub.name}</span>
                                <span className="text-[9px] text-gray-400 block font-mono">/s/{sub.slug}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditSubCategory(sub)}
                                  className="p-1 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded transition cursor-pointer"
                                  title="Edit Subcategory"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSubCategory(sub.id)}
                                  className="p-1 hover:bg-rose-50 dark:hover:bg-slate-700 text-rose-605 rounded transition cursor-pointer"
                                  title="Delete Subcategory"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No subcategories defined yet. Create one on the left!</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---- Tab 3b: NEW BRAND MANAGEMENT SYSTEM ---- */}
      {activeTab === 'brands' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          {/* Add/Edit Brands Form */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
              {editingBrandId ? '⚙ Edit Corporate Brand' : '➕ Create Store Brand'}
            </h3>

            <form onSubmit={handleBrandSubmit} className="p-5 border border-gray-150 dark:border-slate-805 bg-white dark:bg-slate-900 rounded-2xl shadow-sm space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Brand Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adidas"
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-gray-905 border border-gray-205 dark:border-slate-700 rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Brand Slug</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. adidas"
                  value={bSlug}
                  onChange={(e) => setBSlug(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-gray-905 border border-gray-205 dark:border-slate-700 rounded-xl focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Brand Logo Link</label>
                <input
                  type="url"
                  placeholder="https://brands.com/logo.png"
                  value={bLogo}
                  onChange={(e) => setBLogo(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-gray-905 border border-gray-205 dark:border-slate-700 rounded-xl focus:outline-none font-mono"
                />
              </div>

              <div className="flex gap-2">
                {editingBrandId && (
                  <button
                    type="button"
                    onClick={() => {
                      setBName('');
                      setBSlug('');
                      setBLogo('');
                      setEditingBrandId(null);
                    }}
                    className="flex-1 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-gray-500 py-2.5 rounded-xl uppercase hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 bg-indigo-605 hover:bg-indigo-705 text-white font-extrabold py-3.2 rounded-xl text-xs uppercase shadow"
                >
                  {editingBrandId ? '⚙ Update' : 'Apply Brand'}
                </button>
              </div>
            </form>
          </div>

          {/* List display brands */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Corporate Brands Library ({brands.length})</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {brands.map((b) => {
                const brandItemCount = products.filter((p) => p.brand?.toLowerCase() === b.name.toLowerCase()).length;
                return (
                  <div
                    key={b.id}
                    className="p-4 border border-gray-150 dark:border-slate-855 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={b.logo || 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=150'}
                        alt={b.name}
                        className="w-12 h-12 object-cover rounded-xl border shrink-0 bg-white"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=150';
                        }}
                      />
                      <div>
                        <h4 className="text-xs font-black text-gray-900 dark:text-white capitalize">{b.name}</h4>
                        <p className="text-[10px] text-gray-400 font-mono">slug: {b.slug}</p>
                        <span className="text-[9px] bg-indigo-50 dark:bg-slate-850 text-indigo-650 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded tracking-wide font-mono block mt-1 w-fit">{brandItemCount} Products linked</span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 shrink-0 pl-2">
                      <button
                        onClick={() => startEditBrand(b)}
                        className="p-1.8 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg transition"
                        title="Edit brand specifications"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBrand(b.id)}
                        className="p-1.8 bg-rose-50 dark:bg-slate-800 text-rose-600 rounded-lg transition"
                        title="Delete brand specifications"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---- Tab 4: Orders Transit Control ---- */}
      {activeTab === 'orders' && (
        <div className="space-y-4 animate-fadeIn">
          <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Orders Status Dispatch Panel ({orders.length})</h3>

          <div className="border border-gray-150 dark:border-slate-855 rounded-2.5xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm overflow-x-auto select-none">
            <table className="w-full text-xs text-left divide-y divide-gray-105 dark:divide-slate-800 border-b border-gray-150">
              <thead className="bg-slate-50 dark:bg-slate-950/40 text-gray-400 font-extrabold text-[9.5px] tracking-wider uppercase">
                <tr>
                  <th className="p-4">Billing Order Reference ID</th>
                  <th className="p-4">Purchased Items Details</th>
                  <th className="p-4">Purchaser Info Details</th>
                  <th className="p-4 flex items-center h-12">Amount Billing</th>
                  <th className="p-4 text-center">Status Action Updates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-850 text-gray-700 dark:text-gray-300 font-medium">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20">
                    <td className="p-4">
                      <p className="font-bold text-gray-900 dark:text-white font-mono">{ord.id}</p>
                      <p className="text-[10px] text-gray-400 mt-1 font-mono">{new Date(ord.createdAt).toLocaleString()}</p>
                    </td>
                    <td className="p-4 max-w-[200px] truncate">
                      {ord.products.map((item, index) => (
                        <p key={index} className="text-[10px] text-gray-500 italic truncate max-w-[190px]">
                          {index + 1}. {item.name} (x{item.quantity})
                        </p>
                      ))}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-800 dark:text-gray-200 capitalize">{ord.customerName}</p>
                      <p className="text-[9.5px] text-gray-400 font-mono">{ord.customerEmail}</p>
                    </td>
                    <td className="p-4 font-mono font-bold text-gray-900 dark:text-white">৳{ord.finalTotal}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedOrderId(ord.id)}
                          className="p-2 bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:text-indigo-600 rounded-lg transition"
                          title="View Details & Timeline"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePrintInvoice(ord.id)}
                          className="p-2 bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:text-indigo-600 rounded-lg transition"
                          title="Print Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <select
                          value={ord.status}
                          onChange={(e) => handleStatusChange(ord.id, e.target.value as any, ord.userId)}
                          className={`text-[10px] px-2 py-1.5 rounded-lg font-bold cursor-pointer focus:outline-none ${
                            ord.status === 'Delivered'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : ord.status === 'Cancelled'
                              ? 'bg-rose-500/10 text-rose-600'
                              : 'bg-amber-500/10 text-amber-600'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- Tab 4b: Customers Accounts Manager ---- */}
      {activeTab === 'customers' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Registered Customer Accounts ({customers.length})</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manage user profiles, edit billing information, and establish administrative privileges.</p>
            </div>
            {editingCustomer && (
              <button 
                onClick={() => setEditingCustomer(null)}
                className="text-xs font-bold text-rose-600 hover:underline flex items-center gap-1 bg-rose-50 dark:bg-rose-950/20 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/30 shrink-0"
              >
                Close Profile Editor
              </button>
            )}
          </div>

          {/* Inline Profile Editor Section */}
          {editingCustomer && (
            <div className="p-5 border border-indigo-150 bg-indigo-50/5 dark:border-indigo-950/20 rounded-2.5xl space-y-4 animate-slideIn">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Edit2 className="w-4 h-4" />
                <span>Editing Contact: {editingCustomer.name || editingCustomer.email}</span>
              </h4>
              
              <form onSubmit={handleEditCustomerSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Full Name</label>
                  <input
                    type="text"
                    required
                    value={cNameForm}
                    onChange={(e) => setCNameForm(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-205 dark:border-slate-805 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Primary Email</label>
                  <input
                    type="email"
                    required
                    value={cEmailForm}
                    onChange={(e) => setCEmailForm(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-205 dark:border-slate-805 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Mobile Phone</label>
                  <input
                    type="text"
                    value={cPhoneForm}
                    onChange={(e) => setCPhoneForm(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-205 dark:border-slate-805 text-gray-900 dark:text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Shipping Address</label>
                  <input
                    type="text"
                    value={cAddressForm}
                    onChange={(e) => setCAddressForm(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-gray-205 dark:border-slate-805 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2 md:col-span-4 flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingCustomer(null)}
                    className="text-xs px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-gray-300 font-extrabold rounded-xl"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="text-xs px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Accounts Table List */}
          <div className="border border-gray-150 dark:border-slate-855 rounded-2.5xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm overflow-x-auto select-none">
            <table className="w-full text-xs text-left divide-y divide-gray-105 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-950/40 text-gray-400 font-extrabold text-[9.5px] tracking-wider uppercase">
                <tr>
                  <th className="p-4">Customer Account Profile</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Delivery Shipping Address</th>
                  <th className="p-4">Corporate Role Access</th>
                  <th className="p-4 text-center">Manage Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-850 text-gray-700 dark:text-gray-300 font-medium">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center text-gray-400 font-bold">
                      No customer directories synced yet.
                    </td>
                  </tr>
                ) : (
                  customers.map((cust) => {
                    const isAdmin = cust.role === 'admin';
                    return (
                      <tr key={cust.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-extrabold text-indigo-605 shadow-inner select-none uppercase">
                            {cust.name ? cust.name.charAt(0) : cust.email?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white capitalize">{cust.name || 'Anonymous User'}</p>
                            <span className="text-[10px] text-gray-400 font-mono block mt-0.5">{cust.email || 'No email registered'}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono font-bold text-gray-500">
                          {cust.phoneNumber || 'None listed'}
                        </td>
                        <td className="p-4 max-w-[220px] truncate" title={cust.shippingAddress}>
                          {cust.shippingAddress || 'No transit route saved'}
                        </td>
                        <td className="p-4">
                          <span className={`text-[9px] font-mono px-2 py-0.8 rounded-lg font-bold uppercase ${
                            isAdmin 
                              ? 'bg-red-500/10 text-red-600 border border-red-500/20' 
                              : 'bg-slate-100 text-gray-500 dark:bg-slate-850 dark:text-gray-400'
                          }`}>
                            {cust.role || 'customer'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.8">
                            <button
                              onClick={() => handleEditCustomerClick(cust)}
                              className="p-1.8 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:text-indigo-705 rounded-xl transition shadow-sm border border-indigo-100/10"
                              title="Edit user parameters"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => toggleCustomerRole(cust)}
                              className={`p-1.8 rounded-xl transition shadow-sm border ${
                                isAdmin 
                                  ? 'bg-orange-50 dark:bg-slate-800 text-orange-600 border-orange-100/20' 
                                  : 'bg-emerald-50 dark:bg-slate-800 text-emerald-600 border-emerald-100/20'
                              }`}
                              title={isAdmin ? "Demote to Buyer Role" : "Grant Admin Privileges"}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- Tab 4c: Live Active Shopping Cart Monitoring ---- */}
      {activeTab === 'carts' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Live Shopping Baskets Monitor ({groupedCarts.length} active carts)</h3>
            <p className="text-xs text-gray-400 mt-0.5">Observe purchase intents in real-time. Disseminate notifications alerts and manage outstanding cart items.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {groupedCarts.length === 0 ? (
              <div className="py-24 border border-dashed border-gray-205 dark:border-slate-800 rounded-3xl text-center text-gray-400">
                <ShoppingCart className="w-10 h-10 mx-auto text-gray-300 mb-2 animate-pulse" />
                <p className="text-xs font-bold">No active shopping carts found.</p>
                <p className="text-[10px] mt-0.5">Active selections will populate here as store guests populate their baskets.</p>
              </div>
            ) : (
              groupedCarts.map((item, cartIdx) => {
                const hasSuccessfulNotification = notificationSuccess === item.userId;
                return (
                  <div 
                    key={cartIdx}
                    className="p-5 border border-gray-150 dark:border-slate-805 bg-white dark:bg-slate-900 rounded-2.5xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                  >
                    {/* Customer overview */}
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-teal-600 font-mono">
                          {cartIdx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-white capitalize">{item.customerName}</p>
                          <p className="text-[9.5px] font-mono text-gray-400">{item.customerEmail} • {item.customerPhone}</p>
                        </div>
                      </div>

                      {/* Stacked contents of cart */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.products.map((cp: any, idx: number) => (
                          <div 
                            key={idx} 
                            className="bg-slate-50 dark:bg-slate-950/40 border border-gray-100 dark:border-slate-855 px-2.5 py-1.5 rounded-xl flex items-center gap-2"
                          >
                            {cp.product?.thumbnail && (
                              <img src={cp.product.thumbnail} alt={cp.product.name} className="w-6 h-6 object-cover rounded-lg border border-gray-105 shrink-0" />
                            )}
                            <div className="min-w-0 max-w-[130px] sm:max-w-[200px]">
                              <p className="text-[10px] font-extrabold text-gray-850 dark:text-gray-300 truncate" title={cp.product?.name}>{cp.product?.name || 'Loading item'}</p>
                              <span className="text-[9px] text-gray-400 block leading-none font-mono">
                                ৳{(cp.product?.salePrice || cp.product?.price || 0)} x{cp.quantity}
                              </span>
                            </div>
                            <button
                              onClick={() => forceClearCartItem(cp.cartItemId)}
                              className="text-rose-505 hover:bg-rose-50 p-1 rounded-md shrink-0 transition"
                              title="Force clear this product coordinate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial value actions side */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-gray-105 shrink-0">
                      <div className="text-left md:text-right">
                        <p className="text-[9px] font-bold text-gray-405 uppercase tracking-widest leading-none">Gross basket value</p>
                        <p className="text-lg font-black text-indigo-650 dark:text-indigo-400 mt-1 font-mono">৳{item.totalValue.toLocaleString()}</p>
                        <p className="text-[9.5px] text-gray-400 mt-0.5 font-mono">activity: {new Date(item.lastUpdated).toLocaleTimeString()}</p>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() => sendCartReminderNotification(item.userId, item.totalValue)}
                          disabled={hasSuccessfulNotification}
                          className={`text-xs font-black min-w-[170px] uppercase py-2.5 px-4.5 rounded-xl flex items-center justify-center gap-1.5 shadow transition-all duration-300 ${
                            hasSuccessfulNotification 
                              ? 'bg-teal-605 text-white shadow-teal-100' 
                              : 'bg-indigo-605 hover:bg-indigo-705 text-white'
                          }`}
                        >
                          {hasSuccessfulNotification ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Reminder Transmitted</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5" />
                              <span>Send Checkout Reminder</span>
                            </>
                          )}
                        </button>
                        {hasSuccessfulNotification && (
                          <div className="absolute top-full right-0 mt-1 bg-teal-500 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow animate-bounce z-40">
                            Sent to customer's inbox successfully!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ---- Tab 5: Coupons Campaign Vouchers ---- */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
          {/* Add Coupon form */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">➕ Create Campaign Voucher</h3>

            <form onSubmit={handleCouponSubmit} className="p-5 border border-gray-150 dark:border-slate-805 bg-white dark:bg-slate-900 rounded-2xl shadow-sm space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Voucher Code (Uppercase)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SAVINGS20"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-gray-950 dark:text-white rounded-xl focus:outline-none font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Reduction Shape</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as any })}
                    className="w-full text-xs px-2 py-2.5 border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Flat price (৳)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Deduction Value</label>
                  <input
                    type="number"
                    required
                    placeholder="20"
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 border border-gray-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Expiration Date</label>
                <input
                  type="date"
                  required
                  value={couponForm.expiryDate}
                  onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                  className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 text-gray-950 dark:text-white rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-605 hover:bg-indigo-705 text-white font-extrabold py-3.2 rounded-xl text-xs uppercase shadow"
              >
                Apply Promo Code
              </button>
            </form>
          </div>

          {/* List display coupons */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-extrabold text-gray-905 dark:text-white uppercase tracking-wider">Campaign Coupons List ({coupons.length})</h3>

            <div className="border border-gray-150 dark:border-slate-855 rounded-2.5xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm overflow-x-auto select-none">
              <table className="w-full text-xs text-left divide-y divide-gray-105 dark:divide-slate-850 border-b border-gray-155">
                <thead className="bg-slate-50 dark:bg-slate-950/40 text-gray-400 font-extrabold text-[9.5px] tracking-wider uppercase">
                  <tr>
                    <th className="p-4">Coupon Code</th>
                    <th className="p-4">Deduction Shape</th>
                    <th className="p-4">Expiry Date</th>
                    <th className="p-4 text-center">Status Toggler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-850 text-gray-750 dark:text-gray-300 font-medium">
                  {coupons.map((c) => (
                    <tr key={c.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20">
                      <td className="p-4 font-bold font-mono text-gray-900 dark:text-white uppercase">{c.code}</td>
                      <td className="p-4 font-bold font-mono">
                        {c.discountType === 'percentage' ? `${c.discountValue}% Off` : `৳${c.discountValue} Flat Discount`}
                      </td>
                      <td className="p-4 text-gray-400 font-mono">{new Date(c.expiryDate).toLocaleDateString()}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleCouponStatus(c.code, c.isActive)}
                          className={`text-xs px-3.5 py-1.8 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 mx-auto ${
                            c.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                          <span>{c.isActive ? 'Active Campaign' : 'Paused'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---- Tab 6: Reviews Auditing list ---- */}
      {activeTab === 'reviews' && (
        <div className="space-y-4 animate-fadeIn">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Verified Reviews Audit list ({reviews.length})</h3>

          <div className="border border-gray-150 dark:border-slate-855 rounded-2.5xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm overflow-x-auto select-none">
            <table className="w-full text-xs text-left divide-y divide-gray-105 dark:divide-slate-800 border-b border-gray-155">
              <thead className="bg-slate-50 dark:bg-slate-950/40 text-gray-400 font-extrabold text-[9.5px] tracking-wider uppercase">
                <tr>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">Product Catalog link</th>
                  <th className="p-4">Feedback Remarks</th>
                  <th className="p-4 flex items-center h-12">Stars Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-850 text-gray-700 dark:text-gray-300 font-medium">
                {reviews.map((rev) => {
                  const correlatedProduct = products.find((p) => p.id === rev.productId);
                  return (
                    <tr key={rev.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-955/20">
                      <td className="p-4">
                        <p className="font-bold text-gray-900 dark:text-white capitalize">{rev.userName}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-1 leading-none">{rev.userId}</p>
                      </td>
                      <td className="p-4">
                        <div className="min-w-0 max-w-[180px]">
                          <p className="font-bold text-gray-950 dark:text-white truncate" title={correlatedProduct ? correlatedProduct.name : rev.productId}>
                            {correlatedProduct ? correlatedProduct.name : rev.productId}
                          </p>
                          <span className="text-[9px] text-indigo-650 dark:text-indigo-400 font-bold block leading-none mt-0.5 font-mono">{rev.productId}</span>
                        </div>
                      </td>
                      <td className="p-4 max-w-[200px] truncate" title={rev.comment}>
                        {rev.comment}
                      </td>
                      <td className="p-4">
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating ? 'fill-amber-400' : 'text-gray-150 dark:text-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---- Tab 7: Chats Desk Help Threads ---- */}
      {activeTab === 'chats' && (
        <div className="grid grid-cols-1 md:grid-cols-3 border border-gray-150 dark:border-slate-850 rounded-2.5xl bg-white dark:bg-slate-900 min-h-[480px] overflow-hidden shadow animate-fadeIn">
          
          {/* Threads list panel */}
          <div className="border-r border-gray-155 dark:border-slate-850 select-none bg-slate-50/40 dark:bg-slate-950/20">
            <div className="p-4 border-b border-gray-105 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/50">
              <span className="text-[10px] uppercase font-extrabold text-indigo-650 tracking-wider">Verified client accounts</span>
              <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mt-1">Operator Support Threads ({chatThreads.length})</h4>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-slate-855 max-h-[380px] overflow-y-auto">
              {chatThreads.map((thread) => {
                const isActive = selectedThreadId === thread.uid;
                return (
                  <button
                    key={thread.uid}
                    onClick={() => setSelectedThreadId(thread.uid)}
                    className={`w-full text-left p-4 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      isActive ? 'bg-indigo-650/10 text-indigo-650' : 'hover:bg-slate-100/50 dark:hover:bg-slate-955/20'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-gray-900 dark:text-white truncate">{thread.userName || 'Buyer'}</p>
                      <p className="text-[10px] text-gray-500 truncate mt-1">{thread.lastMessage || 'Empty thread transcript'}</p>
                    </div>
                    {thread.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-red-650 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                        {thread.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Chats transcripts room */}
          <div className="md:col-span-2 flex flex-col justify-between h-[480px]">
            {selectedThreadId ? (
              <>
                {/* Scroll content */}
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/15 dark:bg-transparent">
                  {chatMessages.map((msg: any) => {
                    const isAdminAuthor = msg.senderId === 'admin';
                    return (
                      <div
                        key={msg.id || msg.createdAt}
                        className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                          isAdminAuthor
                            ? 'bg-indigo-605 text-white ml-auto rounded-tr-none'
                            : 'bg-slate-105 dark:bg-slate-805 text-gray-905 dark:text-white rounded-tl-none'
                        }`}
                      >
                        <p className="font-semibold block text-[10px] mb-1 text-slate-400 uppercase tracking-wider">{msg.senderName}</p>
                        <p className="whitespace-pre-line">{msg.message || msg.text || ''}</p>
                        <span className="text-[9px] text-slate-400 block text-right mt-1.5 font-mono">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Sender Form footer */}
                <form onSubmit={handleSendReplyChat} className="p-4 border-t border-gray-150 dark:border-slate-850 flex gap-2 shrink-0 bg-slate-50/50 dark:bg-slate-950/60">
                  <input
                    type="text"
                    required
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    placeholder="Type dispatch response answer..."
                    className="flex-1 text-xs px-4.5 py-3 rounded-xl border border-gray-205 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-905 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-650 hover:bg-indigo-705 text-white font-bold text-xs px-5 py-3 rounded-xl shadow cursor-pointer transition uppercase"
                  >
                    Send Reply
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 self-center">
                <span className="text-3xl block mb-2">📬</span>
                <p className="text-xs font-bold text-gray-650 dark:text-gray-300">No support thread selected.</p>
                <p className="text-[10px] text-gray-400 mt-1 max-w-xs leading-relaxed">
                  Click on an active user thread on the left to start real-time chat supporting and resolve pending product queries.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- Tab 8: Website Settings ---- */}
      {activeTab === 'settings' && (
        <div className="space-y-8 animate-fadeIn max-w-4xl">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Website Content & Global Settings</h3>
            <p className="text-xs text-gray-400 mt-0.5">Control your brand identity, contact information, and homepage marketing banners.</p>
          </div>

          <form onSubmit={handleUpdateSettings} className="space-y-6 pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Branding */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">Branding & Identity</h4>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Logo URL</label>
                  <input 
                    type="text" 
                    value={settingsForm.logoURL}
                    onChange={(e) => setSettingsForm({...settingsForm, logoURL: e.target.value})}
                    className="w-full text-xs p-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Hero Main Title</label>
                  <input 
                    type="text" 
                    value={settingsForm.heroTitle}
                    onChange={(e) => setSettingsForm({...settingsForm, heroTitle: e.target.value})}
                    className="w-full text-xs p-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Hero Subtitle</label>
                  <textarea 
                    value={settingsForm.heroSubtitle}
                    onChange={(e) => setSettingsForm({...settingsForm, heroSubtitle: e.target.value})}
                    className="w-full text-xs p-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 h-20"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="p-6 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 rounded-3xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600">Contact & Support</h4>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Business Email</label>
                  <input 
                    type="email" 
                    value={settingsForm.contactEmail}
                    onChange={(e) => setSettingsForm({...settingsForm, contactEmail: e.target.value})}
                    className="w-full text-xs p-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</label>
                  <input 
                    type="text" 
                    value={settingsForm.contactPhone}
                    onChange={(e) => setSettingsForm({...settingsForm, contactPhone: e.target.value})}
                    className="w-full text-xs p-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Office Address</label>
                  <input 
                    type="text" 
                    value={settingsForm.address}
                    onChange={(e) => setSettingsForm({...settingsForm, address: e.target.value})}
                    className="w-full text-xs p-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-10 py-3.5 rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none uppercase text-xs tracking-widest"
              >
                Save Global Settings
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Order Detail Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Order #{selectedOrderId}</h3>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Transaction Details & Logistics Timeline</p>
              </div>
              <button onClick={() => setSelectedOrderId(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
               {(() => {
                 const order = orders.find(o => o.id === selectedOrderId);
                 if (!order) return null;
                 const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
                 const currentIdx = statuses.indexOf(order.status);
                 
                 return (
                   <div className="space-y-8 text-xs">
                     {/* Timeline */}
                     <div className="relative pb-4">
                        <div className="flex justify-between relative z-10">
                          {statuses.map((s, i) => {
                            const isPast = i <= currentIdx;
                            return (
                              <div key={s} className="flex flex-col items-center gap-2 flex-1 relative">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10 ${
                                  isPast ? 'bg-indigo-606 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400'
                                }`}>
                                   {isPast ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                </div>
                                <span className={`font-black uppercase text-[8px] tracking-widest ${isPast ? 'text-indigo-600' : 'text-gray-400'}`}>{s}</span>
                                {i < statuses.length - 1 && (
                                   <div className={`absolute left-1/2 w-full h-[2.5px] top-4 -z-0 ${i < currentIdx ? 'bg-indigo-600' : 'bg-gray-100 dark:bg-slate-800'}`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        <div className="space-y-4">
                           <h4 className="font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded inline-block">Client Info</h4>
                           <div className="space-y-1 text-gray-600 dark:text-gray-400 font-medium">
                              <p className="text-gray-900 dark:text-white font-bold">{order.customerName}</p>
                              <p className="font-mono">{order.customerEmail}</p>
                              <p className="pt-2 italic">"{order.shippingAddress}"</p>
                              {order.deliveryNotes && (
                                <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400 rounded">
                                  <p className="text-[10px] uppercase font-black text-amber-700 dark:text-amber-500 mb-1">Customer Delivery Note:</p>
                                  <p className="text-gray-700 dark:text-gray-300 italic">{order.deliveryNotes}</p>
                                </div>
                              )}
                           </div>
                        </div>

                        <div className="space-y-4">
                           <h4 className="font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded inline-block">Payment Billing</h4>
                           <div className="space-y-1 font-mono">
                              <p>Method: <span className="font-bold text-gray-900 dark:text-white uppercase">{order.paymentMethod}</span></p>
                              <p>Status: <span className={`font-bold ${order.paymentStatus === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>{order.paymentStatus}</span></p>
                              <p className="pt-2 text-lg font-black text-indigo-650">৳{order.finalTotal.toLocaleString()}</p>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4 pt-4">
                        <h4 className="font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded inline-block">Order manifest</h4>
                        <div className="border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                           <table className="w-full">
                              <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                  <th className="p-3 text-left">Item</th>
                                  <th className="p-3 text-center">Qty</th>
                                  <th className="p-3 text-right">Price</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {order.products.map((p, idx) => (
                                  <tr key={idx}>
                                    <td className="p-3 font-bold">{p.name}</td>
                                    <td className="p-3 text-center font-mono">{p.quantity}</td>
                                    <td className="p-3 text-right font-mono">৳{p.price.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                   </div>
                 );
               })()}
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-950/20 flex justify-end gap-3">
               <button 
                 onClick={() => {
                   handlePrintInvoice(selectedOrderId);
                   setSelectedOrderId(null);
                 }}
                 className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none"
               >
                 <Printer className="w-3.5 h-3.5" />
                 Print Transit Invoice
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </main>
</div>
);
}
