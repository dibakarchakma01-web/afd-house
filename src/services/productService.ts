import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Product } from '../types';

export const productService = {
  // Get all products (Real-time)
  subscribeProducts: (callback: (products: Product[]) => void) => {
    return onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        callback(products);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'products')
    );
  },

  // Get active products for storefront
  subscribeActiveProducts: (callback: (products: Product[]) => void) => {
    const q = query(collection(db, 'products'), where('status', '==', 'active'));
    return onSnapshot(
      q,
      (snapshot) => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        callback(products);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'products')
    );
  },

  // Add a new product
  addProduct: async (product: Omit<Product, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return { id: docRef.id, ...product };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  },

  // Update product
  updateProduct: async (id: string, updates: Partial<Product>) => {
    try {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  },

  // Soft delete (archive)
  archiveProduct: (id: string) => productService.updateProduct(id, { status: 'archived' }),

  // Permanent delete
  deleteProduct: async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  }
};
