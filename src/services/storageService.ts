import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { storage } from '../firebase';

export const storageService = {
  // Upload any file
  uploadFile: async (path: string, file: File) => {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Storage upload failed:', error);
      throw error;
    }
  },

  // Specialized upload for product images
  uploadProductImage: (productId: string, file: File) => {
    const timestamp = Date.now();
    return storageService.uploadFile(`products/${productId}/${timestamp}_${file.name}`, file);
  },

  // Specialized upload for category images
  uploadCategoryImage: (categoryId: string, file: File) => {
    return storageService.uploadFile(`categories/${categoryId}/${file.name}`, file);
  },

  // Delete file
  deleteFile: async (url: string) => {
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Storage deletion failed:', error);
    }
  }
};
