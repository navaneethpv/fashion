// /api/src/models/Product.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IDominantColor {
  hex: string;
  rgb: number[];
}

export interface IAITags {
  // UPDATED: Renamed to match the new Gemini JSON mode output
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
  images: string[];
  dominantColor: IDominantColor;
  aiTags: IAITags;
  variants?: any[];
  rating?: number;
  reviewsCount?: number;
  isPublished?: boolean;
  // ... other fields
}


const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  price_cents: { type: Number, required: true },
  price_before_cents: { type: Number },
  brand: { type: String, required: true },
  category: { type: String, required: true, index: true },
  images: [{ type: String, required: true }],
  dominantColor: {
    hex: { type: String },
    rgb: { type: [Number] },
  },
  aiTags: {
    // UPDATED: The schema now matches the new Gemini output structure
    dominant_color_name: { type: String },
    style_tags: { type: [String] },
    material_tags: { type: [String] },
  },
  // ... other schema fields
}, { timestamps: true });

ProductSchema.index({ name: 'text', category: 'text' });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
export default Product;