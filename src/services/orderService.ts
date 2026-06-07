import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where,
  onSnapshot,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Order } from '../types';

export const orderService = {
  // Subscribe to all orders (Admin)
  subscribeAllOrders: (callback: (orders: Order[]) => void) => {
    return onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        callback(orders);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'orders')
    );
  },

  // Subscribe to user orders
  subscribeUserOrders: (userId: string, callback: (orders: Order[]) => void) => {
    const q = query(collection(db, 'orders'), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        callback(orders);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'orders')
    );
  },

  // Place a new order
  placeOrder: async (order: Omit<Order, 'id'>) => {
    try {
      const batch = writeBatch(db);
      
      // 1. Create Order Document
      const orderRef = doc(collection(db, 'orders'));
      batch.set(orderRef, {
        ...order,
        id: orderRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // 2. Reduce Stock for each product
      order.products.forEach(p => {
        const productRef = doc(db, 'products', p.productId);
        batch.update(productRef, {
          stock: increment(-p.quantity),
          updatedAt: new Date().toISOString()
        });
      });

      await batch.commit();
      return orderRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  },

  // Update order status
  updateOrderStatus: async (id: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', id), {
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  }
};
