import mongoose, { Document, Schema } from "mongoose";

export interface ICooperative extends Document {
  owner: mongoose.Types.ObjectId;
  name: string;
  description: string;
  location: {
    city: string;
    region: string;
  };
  category: string;
  coverImage: string;
  photos: string[];
  verified: boolean;
  followers: mongoose.Types.ObjectId[];
  impactStatement: string;
  artisanCount: number;
  foundedYear?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CooperativeSchema = new Schema<ICooperative>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, default: "", trim: true },
    description: { type: String, default: "" },
    location: {
      city: { type: String, default: "" },
      region: { type: String, default: "" },
    },
    category: {
      type: String,
      enum: ["argan", "carpets", "saffron", "pottery", "food", "leather", "other"],
      default: "other",
    },
    coverImage: { type: String, default: "" },
    photos: [{ type: String }],
    verified: { type: Boolean, default: false },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    impactStatement: { type: String, default: "" },
    artisanCount: { type: Number, default: 0, min: 0 },
    foundedYear: { type: Number, min: 1900 },
  },
  { timestamps: true }
);

export default mongoose.model<ICooperative>("Cooperative", CooperativeSchema);
