// /api/src/models/Product.ts

import { Schema, model, Document } from 'mongoose';

export interface IVariant extends Document {
  size: string;
  color: string;
  sku: string;
  stock: number;
}
export interface IProduct extends Document {
  name: string;
  slug: string;
  brand: string;
  description: string;
  category: string;
  subCategory: string;
  price_cents: number;
  price_before_cents: number;
  images: { url: string }[];
  variants: IVariant[];
  dominantColor: {
    hex: string;
    rgb: { r: number; g: number; b: number };
  };
  aiTags: {
    semanticColor?: string;
    style_tags?: string[];
    material_tags?: string[];
  };
  rating: number;
  reviewsCount: number;
  isPublished: boolean;
}
const ImageSchema = new Schema({
  url: { type: String, required: true },
}, { _id: false });
const VariantSchema = new Schema({
  size: { type: String, required: true },
  color: { type: String, required: true },
  sku: { type: String, unique: true, sparse: true },
  stock: { type: Number, required: true, default: 0 },
}, { _id: false });
const ProductSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  brand: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, index: true },
  subCategory: { type: String },
  price_cents: { type: Number, required: true },
  price_before_cents: { type: Number },
  images: [ImageSchema],
  variants: [VariantSchema],
  dominantColor: {
    hex: { type: String },
    rgb: { r: { type: Number }, g: { type: Number }, b: { type: Number } },
  },
  aiTags: {
    semanticColor: { type: String },
    style_tags: [{ type: String }],
    material_tags: [{ type: String }],
  },
  rating: { type: Number, default: 0 },
  reviewsCount: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });
ProductSchema.index({ name: 'text', description: 'text', 'aiTags.semanticColor': 'text' });
export const Product = model<IProduct>('Product', ProductSchema);