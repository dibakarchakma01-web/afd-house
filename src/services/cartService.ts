import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CartItem } from '../types';

export const cartService = {
  // Sync cart with Firestore
  syncCart: async (userId: string, items: CartItem[]) => {
    try {
      // In a real app, we might want to store each item in a subcollection
      // or the whole array in a single doc. The user request suggests cart/userId items[]
      await setDoc(doc(db, 'carts', userId), {
        userId,
        items,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `carts/${userId}`);
    }
  },

  // Subscribe to user cart
  subscribeCart: (userId: string, callback: (items: CartItem[]) => void) => {
    return onSnapshot(
      doc(db, 'carts', userId),
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data().items as CartItem[]);
        } else {
          callback([]);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, `carts/${userId}`)
    );
  }
};
