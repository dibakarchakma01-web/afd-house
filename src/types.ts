export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: 'customer' | 'admin';
  phoneNumber?: string;
  shippingAddress?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: string; // e.g. "mens-fashion"
  subcategory?: string; // e.g. "t-shirts"
  brand: string; // e.g. "ZunoMaster"
  sku: string;
  price: number;
  salePrice?: number; // maps to discountPrice
  discountPrice?: number; // discount price
  stock: number; // stock level quantity
  images: string[]; // multi images
  thumbnail: string; // direct thumbnail
  rating: number;
  reviewsCount: number;
  tags?: string[]; // e.g. ["headphones", "tech"]
  status: 'active' | 'inactive' | 'archived';
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export interface SubCategory {
  id: string;
  categoryId: string; // References Category.id or Category.slug
  name: string;
  slug: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images?: string[]; // images uploaded by customer
  createdAt: string;
  updatedAt?: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  expiryDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderProduct {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  products: OrderProduct[];
  total: number;
  discount: number;
  finalTotal: number;
  couponCode?: string;
  paymentMethod: 'bKash' | 'Nagad' | 'SSLCommerz' | 'Stripe' | 'COD';
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shippingAddress: string;
  deliveryNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatThread {
  id: string; // identical to userId
  userId: string;
  userName: string;
  lastMessage: string;
  lastMessageAt: string;
  status: 'open' | 'closed';
  createdAt: string;
}

export interface ChatMessage {
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin';
  message: string;
  createdAt: string;
}

export interface WebsiteSettings {
  logoURL: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
  homepageBanners: {
    id: string;
    imageUrl: string;
    title: string;
    subtitle?: string;
    link?: string;
  }[];
  heroTitle: string;
  heroSubtitle: string;
}
