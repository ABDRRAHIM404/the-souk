import mongoose, { Document, Schema } from "mongoose";

// ─── Sub-document interfaces ──────────────────────────────────────────────────

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  priceAtPurchase: number; // snapshot of price at time of order
}

export interface IShippingAddress {
  fullName: string;
  address: string;
  city: string;
  country: string;
  phone: string;
}

// ─── Main interface ───────────────────────────────────────────────────────────

export interface IOrder extends Document {
  tourist: mongoose.Types.ObjectId;
  cooperative: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  total: number;
  paymentMethod: "cash_on_delivery";
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtPurchase: { type: Number, required: true },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    tourist: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cooperative: { type: Schema.Types.ObjectId, ref: "Cooperative", required: true },
    items: { type: [OrderItemSchema], required: true, validate: [(v: IOrderItem[]) => v.length > 0, "Order must have at least one item"] },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cash_on_delivery"], default: "cash_on_delivery" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Index for fast lookups
OrderSchema.index({ tourist: 1, createdAt: -1 });
OrderSchema.index({ cooperative: 1, createdAt: -1 });

export default mongoose.model<IOrder>("Order", OrderSchema);
