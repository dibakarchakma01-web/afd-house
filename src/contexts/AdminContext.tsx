import React, { createContext, useContext, useEffect, useState } from 'react';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { Product, Order, Category, SubCategory, Coupon, Review, Brand } from '../types';
import { collection, onSnapshot, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { INITIAL_CATEGORIES, INITIAL_SUBCATEGORIES, INITIAL_PRODUCTS, INITIAL_COUPONS, INITIAL_REVIEWS, INITIAL_BRANDS } from '../data';
import { useAuth } from './AuthContext.tsx';

export const getProductWithSubcategory = (p: Product): Product => {
  let subcategory = p.subcategory || '';
  if (!subcategory) {
    const nameLower = p.name.toLowerCase();
    if (nameLower.includes('headphone') || nameLower.includes('earbud')) {
      subcategory = 'headphones';
    } else if (nameLower.includes('watch') || nameLower.includes('band')) {
      subcategory = 'smart-watches';
    } else if (nameLower.includes('suit') || nameLower.includes('blazer')) {
      subcategory = 'suits-blazers';
    } else if (nameLower.includes('denim') || nameLower.includes('jacket')) {
      subcategory = 'denim-jackets';
    } else if (nameLower.includes('t-shirt') || nameLower.includes('tee')) {
      subcategory = 't-shirts';
    } else if (nameLower.includes('polo')) {
      subcategory = 'polo-shirts';
    } else if (nameLower.includes('saree') || nameLower.includes('sari')) {
      subcategory = 'saree';
    } else if (nameLower.includes('top') || nameLower.includes('kurti')) {
      subcategory = 'tops-kurtis';
    } else if (nameLower.includes('toy') || nameLower.includes('game')) {
      subcategory = 'toys';
    } else if (nameLower.includes('bedsheet') || nameLower.includes('pillow')) {
      subcategory = 'bedsheets';
    } else if (nameLower.includes('gym') || nameLower.includes('dumbell')) {
      subcategory = 'gym';
    } else if (nameLower.includes('perfume') || nameLower.includes('scent')) {
      subcategory = 'perfumes';
    }
  }
  return { ...p, subcategory };
};

interface AdminContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  subcategories: SubCategory[];
  setSubcategories: React.Dispatch<React.SetStateAction<SubCategory[]>>;
  brands: Brand[];
  setBrands: React.Dispatch<React.SetStateAction<Brand[]>>;
  coupons: Coupon[];
  setCoupons: React.Dispatch<React.SetStateAction<Coupon[]>>;
  reviews: Review[];
  setReviews: React.Dispatch<React.SetStateAction<Review[]>>;
  customers: any[];
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
  loading: boolean;
  refreshData: () => void;
}

const AdminContext = createContext<AdminContextType>({
  products: [],
  setProducts: () => {},
  orders: [],
  setOrders: () => {},
  categories: [],
  setCategories: () => {},
  subcategories: [],
  setSubcategories: () => {},
  brands: [],
  setBrands: () => {},
  coupons: [],
  setCoupons: () => {},
  reviews: [],
  setReviews: () => {},
  customers: [],
  setCustomers: () => {},
  loading: true,
  refreshData: () => {},
});

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin, isStaff, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>(() => INITIAL_PRODUCTS.map(getProductWithSubcategory));
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [subcategories, setSubcategories] = useState<SubCategory[]>(INITIAL_SUBCATEGORIES);
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const seedDatabase = async () => {
    try {
      console.log('AdminContext: Checking catalog status...');
      const prodSnap = await getDocs(collection(db, 'products'));
      // If empty or has very few products (meaning we updated the catalog), re-seed
      if (prodSnap.size < 40) {
        console.log(`AdminContext: Catalog incomplete (${prodSnap.size}/50). Seeding/Updating initial data...`);
        const batch = writeBatch(db);
        
        // Use a consistent seeding strategy
        INITIAL_CATEGORIES.forEach(c => batch.set(doc(db, 'categories', c.id), c, { merge: true }));
        INITIAL_SUBCATEGORIES.forEach(sc => batch.set(doc(db, 'subcategories', sc.id), sc, { merge: true }));
        INITIAL_BRANDS.forEach(b => batch.set(doc(db, 'brands', b.id), b, { merge: true }));
        INITIAL_PRODUCTS.map(getProductWithSubcategory).forEach(p => batch.set(doc(db, 'products', p.id), p, { merge: true }));
        INITIAL_COUPONS.forEach(c => batch.set(doc(db, 'coupons', c.code), c, { merge: true }));
        INITIAL_REVIEWS.forEach(r => batch.set(doc(db, 'reviews', r.id), r, { merge: true }));
        
        // Seed a demo order for the dashboard
        if (user) {
          const demoOrderId = 'ORD-DEMO-99';
          const demoOrder: Order = {
            id: demoOrderId,
            userId: user.uid,
            customerEmail: user.email || 'customer@example.com',
            customerName: user.displayName || 'Demo Customer',
            products: [
              {
                productId: INITIAL_PRODUCTS[0].id,
                name: INITIAL_PRODUCTS[0].name,
                price: INITIAL_PRODUCTS[0].salePrice || INITIAL_PRODUCTS[0].price,
                quantity: 1,
                image: INITIAL_PRODUCTS[0].thumbnail
              }
            ],
            total: INITIAL_PRODUCTS[0].salePrice || INITIAL_PRODUCTS[0].price,
            discount: 0,
            finalTotal: (INITIAL_PRODUCTS[0].salePrice || INITIAL_PRODUCTS[0].price) + 60,
            status: 'Delivered',
            paymentMethod: 'COD',
            paymentStatus: 'Paid',
            shippingAddress: 'Gulshan, Dhaka, Bangladesh',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          batch.set(doc(db, 'orders', demoOrderId), demoOrder, { merge: true });

          // Seed user profile
          batch.set(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            name: user.displayName || 'Admin User',
            role: 'admin',
            createdAt: new Date().toISOString()
          }, { merge: true });
        }
        
        await batch.commit();
        console.log('AdminContext: Data seeding completed successfully.');
      }
    } catch (err: any) {
      if (err?.message?.includes('offline') || err?.code === 'unavailable') {
        console.warn('AdminContext: Firestore is offline, skipping seeding for now.');
      } else {
        console.error('Seeding failed:', err);
      }
    }
  };

  // 1. Public Subscriptions (Products, Categories, SubCategories, Brands, Reviews)
  useEffect(() => {
    const unsubProducts = productService.subscribeProducts((loadedProducts) => {
      if (loadedProducts.length > 0) {
        setProducts(loadedProducts.map(getProductWithSubcategory));
      }
    });

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snap) => {
      if (!snap.empty) {
        setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      }
    });

    const unsubSubcategories = onSnapshot(collection(db, 'subcategories'), (snap) => {
      if (!snap.empty) {
        setSubcategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubCategory)));
      } else {
        setSubcategories(INITIAL_SUBCATEGORIES);
      }
    });

    const unsubBrands = onSnapshot(collection(db, 'brands'), (snap) => {
      if (!snap.empty) {
        setBrands(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand)));
      }
    });

    const unsubReviews = onSnapshot(collection(db, 'reviews'), (snap) => {
      if (!snap.empty) {
        setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      }
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubSubcategories();
      unsubBrands();
      unsubReviews();
    };
  }, []);

  // 2. Sensitive Subscriptions (Orders, Customers, Coupons) & Seeding
  useEffect(() => {
    if (authLoading) return;

    // Only proceed if user is admin or staff
    if (!isAdmin && !isStaff) {
      setOrders([]);
      setCustomers([]);
      // Keep coupons fallback
      setLoading(false);
      return;
    }

    // Admins can seed
    if (isAdmin) {
      seedDatabase();
    }

    const unsubOrders = orderService.subscribeAllOrders(setOrders);

    const unsubCoupons = onSnapshot(collection(db, 'coupons'), (snap) => {
      if (!snap.empty) {
        const items: Coupon[] = [];
        snap.forEach(doc => {
          const data = doc.data();
          items.push({
            code: data.code,
            discountValue: data.discountValue,
            discountType: data.discountType,
            isActive: data.isActive,
            expiryDate: data.expiryDate,
            description: data.description,
            createdAt: data.createdAt || new Date().toISOString()
          } as Coupon);
        });
        setCoupons(items);
      }
    });

    const unsubCustomers = onSnapshot(collection(db, 'users'), (snap) => {
      if (!snap.empty) {
        setCustomers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });

    setLoading(false);

    return () => {
      unsubOrders();
      unsubCoupons();
      unsubCustomers();
    };
  }, [user, isAdmin, isStaff, authLoading]);

  const refreshData = () => {
  };

  return (
    <AdminContext.Provider value={{ 
      products, setProducts, 
      orders, setOrders, 
      categories, setCategories, 
      subcategories, setSubcategories,
      brands, setBrands, 
      coupons, setCoupons, 
      reviews, setReviews, 
      customers, setCustomers, 
      loading, refreshData 
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => useContext(AdminContext);
