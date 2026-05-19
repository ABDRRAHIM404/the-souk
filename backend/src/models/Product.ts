import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  cooperative: mongoose.Types.ObjectId;
  postedBy: mongoose.Types.ObjectId;
  name: string;
  description: string;
  category: string;
  price: number;
  fairTradeCertified: boolean;
  images: string[];
  stock: number;
  origin: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    cooperative: { type: Schema.Types.ObjectId, ref: "Cooperative", required: true },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["argan", "carpets", "saffron", "pottery", "food", "leather", "other"],
      required: true,
    },
    price: { type: Number, required: true, min: 0 },
    fairTradeCertified: { type: Boolean, default: true },
    images: [{ type: String }],
    stock: { type: Number, default: 1 },
    origin: { type: String, default: "" },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>("Product", ProductSchema);