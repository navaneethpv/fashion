import { Request, Response } from "express";
import { Product } from "../models/Product";
import { Review } from '../models/Review';
import getColors from "get-image-colors"; // We need this
import axios from "axios"; // You might need to install this: npm install axios
import { uploadImageBuffer, analyzeImageUrl } from "../utils/imageUpload";
import { upload } from "../config/multer"; // Import multer config


// GET /api/products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 100; // Increased limit for Admin view
    const { category, sort, q, minPrice, maxPrice } = req.query;

    let matchQuery: any = { is_published: true };

    // Filters (Same as before)
    if (category) matchQuery.category = category;
    if (q) matchQuery.$text = { $search: String(q) };
    if (minPrice || maxPrice) {
      matchQuery.price_cents = {};
      if (minPrice) matchQuery.price_cents.$gte = Number(minPrice);
      if (maxPrice) matchQuery.price_cents.$lte = Number(maxPrice);
    }
    
    // Sort (Same as before)
    let sortOption: any = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price_cents: 1 };
    if (sort === "price_desc") sortOption = { price_cents: -1 };


    // 🛑 NEW: AGGREGATION PIPELINE FOR TOTAL STOCK 🛑
    const products = await Product.aggregate([
      // 1. Match/Filter (Applies search, category, etc.)
      { $match: matchQuery },

      // 2. Add totalStock field
      { $addFields: { 
          totalStock: { 
              $sum: "$variants.stock" 
          } 
      }},
      
      // 3. Sort
      { $sort: sortOption },

      // 4. Pagination
      { $skip: (page - 1) * limit },
      { $limit: limit },

      // 5. Project/Select (Select only necessary fields + the new totalStock field)
      { $project: {
          name: 1,
          slug: 1,
          price_cents: 1,
          price_before_cents: 1,
          images: { $slice: ["$images", 1] }, // Only send first image
          category: 1,
          offer_tag: 1,
          variants: 1, // Keep variants for detailed stock check on client side for now
          totalStock: 1 // CRITICAL: Include the new field
      }}
    ]);

    // Count documents separately for pagination meta
    const total = await Product.countDocuments(matchQuery);

    res.json({
      data: products,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// GET /api/products/:slug
export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

interface ImageResult {
  url: string;
  dominant_color: string;
  r: number;
  g: number;
  b: number;
}

// POST /api/products - Admin (NEW MULTI-IMAGE VERSION)
export const createProduct = async (req: Request, res: Response) => {
  try {
    // Note: req.body fields have been updated to match the FormData keys
    const { name, slug, brand, category, price_cents, description, imageUrls, variants } = req.body;
    
    // Multer places uploaded files in req.files (an array)
    // We cast it to the correct type.
    const uploadedFiles = req.files as Express.Multer.File[] | undefined;
    
    // Parse imageUrls string back into an array of strings
    const urlArray: string[] = imageUrls ? JSON.parse(imageUrls) : [];

    let finalImages: ImageResult[] = [];

    // 1. Process File Uploads (if any)
    if (uploadedFiles && uploadedFiles.length > 0) {
      const uploadPromises = uploadedFiles.map(file => uploadImageBuffer(file.buffer));
      const results = await Promise.all(uploadPromises);
      
      results.forEach(result => {
        finalImages.push({
          url: result.url,
          dominant_color: result.colorData.hex,
          r: result.colorData.r,
          g: result.colorData.g,
          b: result.colorData.b
        });
      });
    }

    // 2. Process URL Inputs (if any)
    if (urlArray.length > 0) {
      const urlPromises = urlArray.map((url: string) => analyzeImageUrl(url));
      const results = await Promise.all(urlPromises);

      results.forEach(result => {
        finalImages.push({
          url: result.url,
          dominant_color: result.colorData.hex,
          r: result.colorData.r,
          g: result.colorData.g,
          b: result.colorData.b
        });
      });
    }

    // 3. Validation Check
    if (finalImages.length === 0) {
      return res.status(400).json({ message: 'At least one image file or URL is required.' });
    }

    // 4. Create Product
    const newProduct = new Product({
      name, slug, brand, category, description, price_cents,
      images: finalImages, // Save the array of processed images
      variants: variants ? JSON.parse(variants) : [],
      is_published: true,
      tags: [category, brand, 'New Arrival']
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Product slug already exists." });
    }
    console.error(error);
    res.status(500).json({ message: 'Failed to create product due to server error.' });
  }
};

// ... existing code

// DELETE /api/products/:id
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

export const getProductByIdAdmin = async (req: Request, res: Response) => {
    try {
        const product = await Product.findById(req.params.id); // Fetch by MongoDB ID
        if (!product) return res.status(404).json({ message: "Product not found" });
        
        // Return product object with an added 'price' field for easy editing on frontend
        const productObject = product.toObject();
        // @ts-ignore
        productObject.price = (productObject.price_cents / 100).toFixed(2); 

        res.json(productObject);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
}

// 2. PUT /api/products/:id (New Update endpoint)
export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Clean up data before update
        updateData.price_cents = parseFloat(updateData.price) * 100;
        delete updateData.price; 
        delete updateData._id;

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $set: updateData }, // $set updates the fields you send
            { new: true, runValidators: true } // Return new doc and run Mongoose validation
        );

        if (!updatedProduct) return res.status(404).json({ message: "Product not found" });

        res.json(updatedProduct);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Slug already exists." });
        }
        res.status(500).json({ message: "Failed to update product." });
    }
}
export const updateProductWithImages = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, slug, brand, category, price_cents, description, variants, existingImageUrls, newImageUrls } = req.body;
        
        const uploadedFiles = req.files as Express.Multer.File[] | undefined;
        
        // 1. Start with existing/kept images
        const keptUrls: string[] = existingImageUrls ? JSON.parse(existingImageUrls) : [];
        const finalImages: ImageResult[] = [];
        
        // 2. Process Kept Images (Re-fetch color data if needed, but for simplicity, we rely on the schema here)
        // We need the full ImageRecord from the DB to maintain color data
        const oldProduct = await Product.findById(id);
        if (!oldProduct) return res.status(404).json({ message: "Product not found" });

        oldProduct.images.forEach(img => {
            if (keptUrls.includes(img.url)) {
                finalImages.push(img.toObject() as ImageResult);
            }
        });

        // 3. Process New File Uploads
        if (uploadedFiles && uploadedFiles.length > 0) {
            const uploadPromises = uploadedFiles.map(file => uploadImageBuffer(file.buffer));
            const results = await Promise.all(uploadPromises);
            results.forEach(result => {
                finalImages.push({ url: result.url, dominant_color: result.colorData.hex, r: result.colorData.r, g: result.colorData.g, b: result.colorData.b });
            });
        }

        // 4. Process New URL Inputs
        const urlArray: string[] = newImageUrls ? JSON.parse(newImageUrls) : [];
        if (urlArray.length > 0) {
            const urlPromises = urlArray.map((url: string) => analyzeImageUrl(url));
            const results = await Promise.all(urlPromises);
            results.forEach(result => {
                finalImages.push({ url: result.url, dominant_color: result.colorData.hex, r: result.colorData.r, g: result.colorData.g, b: result.colorData.b });
            });
        }
        
        // 5. Build Final Update Object
        const updateData = {
            name, slug, brand, category, description,
            price_cents: parseFloat(price_cents) * 100,
            variants: variants ? JSON.parse(variants) : [],
            images: finalImages // The final merged and uploaded image array
        };

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) return res.status(404).json({ message: "Product not found after update." });

        res.json(updatedProduct);

    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Slug already exists." });
        }
        console.error(error);
        res.status(500).json({ message: "Failed to update product with new images/data." });
    }
}

export const createReview = async (req: Request, res: Response) => {
    try {
        const { userId, productId, rating, comment } = req.body;

        if (!userId || !productId || !rating || !comment) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // 1. Create the new Review
        const newReview = new Review({ userId, productId, rating, comment });
        await newReview.save();

        // 2. Recalculate Product's Average Rating
        const stats = await Review.aggregate([
            { $match: { productId: newReview.productId } },
            { $group: {
                _id: '$productId',
                averageRating: { $avg: '$rating' },
                count: { $sum: 1 }
            }}
        ]);

        const avgRating = stats[0]?.averageRating || 0;
        const count = stats[0]?.count || 0;

        // 3. Update Product Document
        await Product.findByIdAndUpdate(newReview.productId, {
            rating: parseFloat(avgRating.toFixed(1)),
            reviews_count: count
        });

        res.status(201).json(newReview);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to submit review' });
    }
};

// GET /api/reviews/:productId
export const getReviews = async (req: Request, res: Response) => {
    try {
        const { productId } = req.params;
        // Fetch last 10 reviews
        const reviews = await Review.find({ productId }).sort({ createdAt: -1 }).limit(10);
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch reviews' });
    }
};