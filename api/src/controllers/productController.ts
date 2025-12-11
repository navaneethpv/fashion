// /api/src/controllers/productController.ts

import { Request, Response } from "express";
import mongoose from 'mongoose'; // <-- FIXED: Added missing mongoose import
import { Product } from "../models/Product";
import axios from "axios";
import { uploadImageBuffer, analyzeImageUrl } from "../utils/imageUpload";
import { getProductTagsFromGemini } from '../utils/geminiTagging';
import { Review } from "../models/Review";

async function processSingleImage(source: { buffer?: Buffer, url?: string, mimeType?: string }) {
    let finalUrl = '';
    // FIXED: The type now correctly expects both hex and rgb
    let colorData: { hex: string; rgb: { r: number; g: number; b: number; }; };
    let finalBuffer: Buffer | undefined = source.buffer;

    if (source.buffer) {
        const result = await uploadImageBuffer(source.buffer); 
        finalUrl = result.url;
        colorData = result.colorData;
    } else if (source.url) {
        const result = await analyzeImageUrl(source.url);
        finalUrl = result.url;
        colorData = result.colorData;
        const response = await axios.get(source.url, { responseType: 'arraybuffer' });
        finalBuffer = Buffer.from(response.data, 'binary');
    } else {
        throw new Error("No image source provided.");
    }
    
    let aiTags = { semanticColor: '', style_tags: [], material_tags: [] };
    if (finalBuffer) {
        aiTags = await getProductTagsFromGemini(finalBuffer, source.mimeType || 'image/jpeg');
    }

    return { url: finalUrl, dominantColor: colorData, aiTags };
}

// GET /api/products (Public Listing)
// GET /api/products (Public + Admin Listing)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;
    const { category, sort, q, minPrice, maxPrice } = req.query;

    let matchQuery: any = { isPublished: true };

    if (category) matchQuery.category = category;
    if (q) matchQuery.$text = { $search: String(q) };

    if (minPrice || maxPrice) {
      matchQuery.price_cents = {};
      if (minPrice) matchQuery.price_cents.$gte = Number(minPrice) * 100;
      if (maxPrice) matchQuery.price_cents.$lte = Number(maxPrice) * 100;
    }

    let sortOption: any = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price_cents: 1 };
    if (sort === "price_desc") sortOption = { price_cents: -1 };

    const pipeline: any[] = [{ $match: matchQuery }];

    if (q) {
      pipeline.push({ $sort: { score: { $meta: "textScore" } } });
    } else {
      pipeline.push({ $sort: sortOption });
    }

    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: limit },

      // 🟢 FIXED: Now includes variants (size + stock) for admin stock calculation
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          price_cents: 1,
          price_before_cents: 1,
          brand: 1,
          rating: 1,

          // public & admin both need image
          images: { $arrayElemAt: ["$images.url", 0] },

          // 🟢 critical fix: include variants
          variants: {
            $map: {
              input: "$variants",
              as: "v",
              in: {
                size: "$$v.size",
                stock: "$$v.stock"
              }
            }
          }
        }
      }
    );

    const products = await Product.aggregate(pipeline);
    const total = await Product.countDocuments(matchQuery);

    res.json({
      data: products,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


// --- Other controller functions (getProductBySlug, createProduct, etc.) ---
// Make sure they are also updated to use the new schema (name, slug, variants, dominantColor, etc.)
// The full corrected code for this entire file was provided in the previous step.
// This getProducts function is the most critical one for fixing the current error.

// (Paste the rest of your corrected controller functions here...)
export const getProductBySlug = async (req: Request, res: Response) => {
    try {
        const product = await Product.findOne({ slug: req.params.slug });
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


// POST /api/products - Admin
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, slug, brand, category, price_cents, description, imageUrls, variants } = req.body;
    
    const uploadedFiles = req.files as Express.Multer.File[] || [];
    const parsedVariants = variants ? JSON.parse(variants as string) : [];
    const urlArray: string[] = imageUrls ? JSON.parse(imageUrls as string) : [];
    
    const imagePromises = [
        ...uploadedFiles.map(file => processSingleImage({ buffer: file.buffer, mimeType: file.mimetype })),
        ...urlArray.map(url => processSingleImage({ url }))
    ];

    if (imagePromises.length === 0) {
      return res.status(400).json({ message: 'At least one image is required.' });
    }

    const imageResults = await Promise.all(imagePromises);
    const firstImageResult = imageResults[0];

    const newProduct = new Product({
      name, slug, brand, category, description,
      price_cents: parseFloat(price_cents as string),
      images: imageResults.map(r => ({ url: r.url })),
      variants: parsedVariants,
      dominantColor: firstImageResult.dominantColor,
      aiTags: firstImageResult.aiTags,
      isPublished: true,
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error: any) {
    if (error.code === 11000) return res.status(409).json({ message: "Product slug already exists." });
    console.error("Product Creation Error:", error);
    res.status(500).json({ message: "Failed to create product." });
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

export const getProductByIdAdmin = async (req: Request, res: Response) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
}

// PUT /api/products/:id
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        delete updateData._id;
        delete updateData.images;
        
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) return res.status(404).json({ message: "Product not found" });
        res.json(updatedProduct);
    } catch (error: any) {
        if (error.code === 11000) return res.status(409).json({ message: "Slug already exists." });
        res.status(500).json({ message: "Failed to update product." });
    }
}

export const createReview = async (req: Request, res: Response) => {
    try {
        const { userId, productId, rating, comment } = req.body;
        if (!userId || !productId || !rating || !comment) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const newReview = new Review({ userId, productId, rating, comment });
        await newReview.save();
        const stats = await Review.aggregate([
            // FIXED: Use mongoose.Types.ObjectId to correctly match the ID
            { $match: { productId: new mongoose.Types.ObjectId(productId) } },
            { $group: {
                _id: '$productId',
                averageRating: { $avg: '$rating' },
                count: { $sum: 1 }
            }}
        ]);
        if (stats.length > 0) {
            await Product.findByIdAndUpdate(productId, {
                rating: parseFloat(stats[0].averageRating.toFixed(1)),
                reviewsCount: stats[0].count
            });
        }
        res.status(201).json(newReview);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to submit review' });
    }
};

export const getReviews = async (req: Request, res: Response) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId }).sort({ createdAt: -1 }).limit(10);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch reviews' });
    }
};