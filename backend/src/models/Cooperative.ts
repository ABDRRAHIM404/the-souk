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
  createdAt: Date;
  updatedAt: Date;
}

const CooperativeSchema = new Schema<ICooperative>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: {
      city: { type: String, required: true },
      region: { type: String, required: true },
    },
    category: {
      type: String,
      enum: ["argan", "carpets", "saffron", "pottery", "food", "leather", "other"],
      required: true,
    },
    coverImage: { type: String, default: "" },
    photos: [{ type: String }],
    verified: { type: Boolean, default: false },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model<ICooperative>("Cooperative", CooperativeSchema);