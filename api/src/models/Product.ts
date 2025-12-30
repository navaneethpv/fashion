import mongoose, { Document, Schema } from "mongoose";

export interface IDominantColor {
  hex: string;
  rgb: number[];
}

export interface IAITags {
  dominant_color_name: string;
  style_tags: string[];
  material_tags: string[];
}


export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  price_cents: number;
  price_before_cents?: number;
  brand: string;
  category: string;
  subCategory?: string;
  gender?: string;
  masterCategory?: string;
  isFashionItem?: boolean;
  images: string[];
  stock: number; // ✅ ADDED
  views?: number; // ✅ ADDED
  dominantColor: IDominantColor & { name?: string };
  aiTags: IAITags;
  variants?: any[];
  rating?: number;
  reviewsCount?: number;
  isPublished?: boolean;
}


const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    price_cents: { type: Number, required: true },
    price_before_cents: { type: Number },
    brand: { type: String, required: true },
    category: { type: String, required: true, index: true },
    subCategory: { type: String },
    gender: { type: String, index: true },
    masterCategory: { type: String },
    isFashionItem: { type: Boolean, default: false },

    images: [{ type: String, required: true }],

    stock: {
      type: Number,
      required: true,
      default: 0,
    },

    views: {
      type: Number,
      default: 0
    },

    dominantColor: {
      hex: { type: String },
      rgb: { type: [Number] },
      name: { type: String },
    },

    aiTags: {
      dominant_color_name: { type: String },
      style_tags: { type: [String] },
      material_tags: { type: [String] },
    },

    variants: [{ type: Schema.Types.Mixed }],
    rating: { type: Number },
    reviewsCount: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", category: "text" });

export const Product = mongoose.model<IProduct>("Product", ProductSchema);
export default Product;
