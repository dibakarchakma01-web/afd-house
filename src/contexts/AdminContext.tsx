import React, { createContext, useContext, useEffect, useState } from 'react';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { Product, Order, Category, SubCategory, Coupon, Review, Brand } from '../types';
import { collection, onSnapshot, getDocs, writeBatch, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { INITIAL_CATEGORIES, INITIAL_SUBCATEGORIES, INITIAL_PRODUCTS, INITIAL_COUPONS, INITIAL_REVIEWS, INITIAL_BRANDS } from '../data';
import { useAuth } from './AuthContext.tsx';

export const getProductWithSubcategory = (p: Product): Product => {
  let category = p.category;
  let subcategory = p.subcategory || '';

  // Map old/other categories to the new three ones
  if (category === 'kids-zone' || category === 'baby' || category === 'kids' || category === 'baby-care-products') {
    category = 'baby-care-products';
  } else if (category === 'womens-fashion' || category === 'women') {
    category = 'womens-fashion';
  } else {
    category = 'mens-fashion';
  }

  // Assign appropriate subcategories based on name
  const nameLower = p.name.toLowerCase();
  if (category === 'mens-fashion') {
    if (nameLower.includes('chest') || nameLower.includes('crossbody')) {
      subcategory = 'chest-bag';
    } else if (nameLower.includes('travel') || nameLower.includes('backpack') || nameLower.includes('messenger') || nameLower.includes('bag')) {
      subcategory = 'travel-bag';
    } else if (nameLower.includes('wallet') || nameLower.includes('money') || nameLower.includes('card')) {
      subcategory = 'money-bag';
    } else {
      subcategory = 'jacket';
    }
  } else if (category === 'womens-fashion') {
    if (nameLower.includes('side') || nameLower.includes('clutch') || nameLower.includes('tote')) {
      subcategory = 'side-bag';
    } else if (nameLower.includes('bag') || nameLower.includes('purse') || nameLower.includes('clutch')) {
      subcategory = 'pas-bag';
    } else {
      subcategory = 'jewellery';
    }
  } else if (category === 'baby-care-products') {
    if (nameLower.includes('shoe') || nameLower.includes('sneaker') || nameLower.includes('footwear')) {
      subcategory = 'shoes';
    } else if (nameLower.includes('jacket') || nameLower.includes('parka') || nameLower.includes('hoodie')) {
      subcategory = 'sweater-jackets';
    } else {
      subcategory = 'sweater';
    }
  }

  return { ...p, category, subcategory };
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

      // Check if database was already marked as seeded or initialized
      const seedStateSnap = await getDoc(doc(db, 'settings', 'seed_state'));
      if (seedStateSnap.exists() && seedStateSnap.data()?.seeded) {
        console.log('AdminContext: Database has already been initialized/seeded. Skipping seed.');
        return;
      }

      // Automatic category upgrade/migration if old collections exist
      const catSnap = await getDocs(collection(db, 'categories'));
      const hasOldCategories = catSnap.docs.some(d => {
        const data = d.data();
        return data.slug === 'electronics-gadgets' || data.slug === 'home-living' || d.id === '4';
      });

      if (hasOldCategories) {
        console.log('AdminContext: Upgrading existing categories and subcategories in Firestore...');
        const batch = writeBatch(db);

        // Delete all old categories
        catSnap.docs.forEach(d => {
          batch.delete(d.ref);
        });

        // Delete all old subcategories
        const subSnap = await getDocs(collection(db, 'subcategories'));
        subSnap.docs.forEach(d => {
          batch.delete(d.ref);
        });

        // Seed clean new categories and subcategories
        INITIAL_CATEGORIES.forEach(c => batch.set(doc(db, 'categories', c.id), c, { merge: true }));
        INITIAL_SUBCATEGORIES.forEach(sc => batch.set(doc(db, 'subcategories', sc.id), sc, { merge: true }));

        // Also normalize any existing products to fit the new category slugs perfectly
        const prodSnap = await getDocs(collection(db, 'products'));
        if (!prodSnap.empty) {
          prodSnap.docs.forEach(d => {
            const p = d.data() as Product;
            const updatedProduct = getProductWithSubcategory(p);
            batch.set(d.ref, updatedProduct, { merge: true });
          });
        }

        await batch.commit();
        console.log('AdminContext: Database categories and subcategories upgraded successfully!');
      }

      const prodSnap = await getDocs(collection(db, 'products'));
      // Only seed if database is completely empty
      if (prodSnap.empty) {
        console.log('AdminContext: Catalog empty. Seeding initial data...');
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
        
        // Save seed state document
        batch.set(doc(db, 'settings', 'seed_state'), { seeded: true });

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
    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Product));
        setProducts(items.map(getProductWithSubcategory));
      },
      (error) => {
        console.error('Error fetching products list:', error);
      }
    );

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snap) => {
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    const unsubSubcategories = onSnapshot(collection(db, 'subcategories'), (snap) => {
      if (!snap.empty) {
        setSubcategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubCategory)));
      } else {
        setSubcategories([]);
      }
    });

    const unsubBrands = onSnapshot(collection(db, 'brands'), (snap) => {
      setBrands(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand)));
    });

    const unsubReviews = onSnapshot(collection(db, 'reviews'), (snap) => {
      setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubSubcategories();
      unsubBrands();
      unsubReviews();
    };
  }, []);

  // Auto-seed database with catalog data on startup if Firestore is empty
  useEffect(() => {
    seedDatabase();
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
