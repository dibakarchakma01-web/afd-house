import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const authService = {
  // Login with Email/Password
  login: (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass),
  
  // Register with Email/Password
  register: async (email: string, pass: string, name: string) => {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', res.user.uid), {
      uid: res.user.uid,
      name,
      email,
      role: 'user',
      createdAt: new Date().toISOString()
    });
    return res;
  },

  // Google Login
  loginWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    try {
      const userDoc = await getDoc(doc(db, 'users', res.user.uid));
      
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', res.user.uid), {
          uid: res.user.uid,
          name: res.user.displayName || 'Google User',
          email: res.user.email,
          role: 'user',
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('Post-login profile check failed (likely offline):', err);
    }
    return res;
  },

  // Logout
  logout: () => signOut(auth),

  // Subscription for auth state
  onAuthChange: (callback: (user: User | null) => void) => onAuthStateChanged(auth, callback),

  // Get user role
  getUserProfile: async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      return snap.exists() ? snap.data() : null;
    } catch (err) {
      console.warn('Failed to fetch user profile (likely offline):', err);
      return null;
    }
  }
};
