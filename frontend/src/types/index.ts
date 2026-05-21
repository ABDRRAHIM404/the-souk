// ── Enums ──────────────────────────────────────────────────────────────────

export type UserRole = "tourist" | "coop_owner";

export type ProductCategory =
  | "argan"
  | "carpets"
  | "saffron"
  | "pottery"
  | "food"
  | "leather"
  | "other";

export type SortOption = "newest" | "price_asc" | "price_desc";

// ── User ───────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  country?: string;
  wishlist: string[]; // Product IDs
  cooperativeId?: string; // populated for coop_owner role
  createdAt: string;
  updatedAt: string;
}

// ── Cooperative ────────────────────────────────────────────────────────────

export interface Cooperative {
  _id: string;
  owner: User | string;
  name: string;
  description: string;
  location: {
    city: string;
    region: string;
  };
  // Convenience flat accessors (may be populated by backend or derived)
  city?: string;
  region?: string;
  category: ProductCategory;
  coverImage?: string;
  logo?: string;
  photos: string[];
  verified: boolean;
  isCertified?: boolean;
  followers: string[]; // User IDs
  followersCount?: number;
  productCount?: number;
  artisanCount?: number;
  foundedYear?: number;
  impactStatement?: string;
  reviews?: Review[];
  createdAt: string;
  updatedAt: string;
}

// ── Product ────────────────────────────────────────────────────────────────

export interface Product {
  _id: string;
  cooperative: Cooperative | string;
  postedBy: User | string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number; // in MAD
  fairTradeCertified: boolean;
  /** Alias — some pages use isFairTrade; normalise at source when backend is updated */
  isFairTrade?: boolean;
  images: string[];
  stock: number;
  origin: string;
  isAvailable: boolean;
  materials?: string[];
  impactStatement?: string;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Review ─────────────────────────────────────────────────────────────────

export interface Review {
  _id: string;
  product: Product | string;
  reviewer: User | string;
  rating: number; // 1-5
  comment: string;
  photo?: string;
  createdAt: string;
}

// ── API Payloads ───────────────────────────────────────────────────────────

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  country?: string;
  // coop_owner extras
  cooperativeName?: string;
  cooperativeCity?: string;
  cooperativeCategory?: ProductCategory;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  origin: string;
  stock: number;
  fairTradeCertified?: boolean;
}

export interface CreateReviewPayload {
  rating: number;
  comment: string;
  photo?: string;
}

export interface UpdateCoopPayload {
  name?: string;
  description?: string;
  location?: { city: string; region: string };
  city?: string;
  region?: string;
  category?: ProductCategory;
  impactStatement?: string;
  artisanCount?: number;
  foundedYear?: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  cooperativeId: string;
  cooperativeName: string;
}

export interface OrderItem {
  product: Product | string;
  quantity: number;
  priceAtPurchase: number;
}

export interface ShippingAddress {
  fullName: string;
  address: string;
  city: string;
  country: string;
  phone: string;
}

export interface Order {
  _id: string;
  tourist: User | string;
  cooperative: Cooperative | string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  total: number;
  paymentMethod: "cash_on_delivery";
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  shippingAddress: ShippingAddress;
}

// ── API Response wrappers ──────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pages: number;
}

// ── Filter state (MarketplacePage) ─────────────────────────────────────────

export interface ProductFilters {
  category?: ProductCategory | "";
  region?: string;
  sort?: SortOption;
  page?: number;
  limit?: number;
  cooperative?: string; // filter by cooperative ID
}

// ── Auth context shape ─────────────────────────────────────────────────────

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}
