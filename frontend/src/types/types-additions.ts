// ─── ADD THESE TO src/types/index.ts ─────────────────────────────────────────

export interface CartItem {
  productId: string;
  name: string;
  price: number;         // in MAD
  quantity: number;
  image?: string;
  cooperativeId: string;
  cooperativeName: string;
}

export interface OrderItem {
  product: {
    _id: string;
    name: string;
    images?: string[];
    price: number;
    category: string;
  };
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
  tourist: string | { _id: string; name: string; email: string; country?: string };
  cooperative: string | { _id: string; name: string; logo?: string; city?: string };
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
