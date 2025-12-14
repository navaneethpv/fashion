// /api/src/controllers/productController.ts

import { Request, Response } from "express";
import mongoose from 'mongoose';
import axios from "axios";
import getColors from "get-image-colors";
import cloudinary from "../config/cloudinary";
import { Product } from "../models/Product";
import { getProductTagsFromGemini } from '../utils/geminiTagging';
import { Review } from "../models/Review";

/**
 * Upload a buffer to Cloudinary using upload_stream.
 */
function uploadBufferToCloudinary(buffer: Buffer, folder = 'eyoris/products') {
  return new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, use_filename: true, unique_filename: false, resource_type: 'image' },
      (err: any, result: any) => {
        if (err) return reject(err);
        return resolve(result);
      }
    );
    stream.end(buffer);
  });
}

/**
 * Robust single-image processor.
 * Accepts { buffer?, url?, mimeType? }
 * Returns { url, dominantColor: { hex, rgb }, aiTags }
 */

async function processSingleImage(source: { buffer?: Buffer, url?: string, mimeType?: string }) {
  let finalUrl = '';
  let buffer: Buffer | undefined = source.buffer;
  let mimeType = source.mimeType || 'image/jpeg';

  try {
    // --- Step 1: Get the Image Buffer and Upload to Cloudinary ---
    if (source.url) {
      try {
        // First, try to download the image from the URL.
        const response = await axios.get(source.url, {
          responseType: 'arraybuffer',
          timeout: 15000, // 15-second timeout for the download
        });
        buffer = Buffer.from(response.data);
        mimeType = response.headers['content-type'] || mimeType;

        // If download is successful, upload the buffer to Cloudinary.
        const uploadResult = await uploadBufferToCloudinary(buffer);
        finalUrl = uploadResult.secure_url;

      } catch (networkError: any) {
        // THIS IS THE FIX: Catch DNS errors like EAI_AGAIN here.
        console.warn(`[WARN] Failed to download image from URL: ${source.url}. Reason: ${networkError.message}`);
        // We will re-throw the error to let the controller know this image failed.
        throw new Error(`Could not fetch image from ${source.url}`);
      }
    } else if (buffer) {
      // If a file buffer was provided directly (from an upload), upload it.
      const uploadResult = await uploadBufferToCloudinary(buffer);
      finalUrl = uploadResult.secure_url;
    } else {
      throw new Error("No image source (URL or buffer) was provided.");
    }

    if (!finalUrl) {
      throw new Error('Image upload to Cloudinary failed.');
    }

    // --- Step 2: Analyze the image (if we have a buffer) ---
    // These steps are best-effort and should not crash the entire process if they fail.
    let dominantColor = { hex: '#808080', rgb: [128, 128, 128] }; // Default gray
    let aiTags = { semanticColor: 'N/A', style_tags: [], material_tags: [] };

    if (buffer) {
      try {
        // Use Promise.all to run color and AI analysis concurrently for speed.
        const [colorResult, aiResult] = await Promise.all([
          getColors(buffer, { count: 1, type: mimeType }),
          getProductTagsFromGemini(buffer, mimeType)
        ]);

        if (colorResult && colorResult.length > 0) {
          const c = colorResult[0].rgb();
          dominantColor = { hex: colorResult[0].hex(), rgb: [c[0], c[1], c[2]] };
        }
        if (aiResult) {
          aiTags = aiResult;
        }
      } catch (analysisError: any) {
        console.warn(`[WARN] Non-critical analysis failed for image ${finalUrl}. Reason: ${analysisError.message}`);
        // We don't re-throw here because we still have the image URL.
      }
    }

    return { url: finalUrl, dominantColor, aiTags };

  } catch (err: any) {
    // This top-level catch will handle critical failures (like the initial download).
    console.error(`[ERROR] Critical failure in processSingleImage: ${err.message}`);
    // Re-throw so Promise.allSettled in the controller can catch it as a 'rejected' promise.
    throw err;
  }
}



// ----------------- Controller: getProducts -----------------
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
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          category: 1,
          price_cents: 1,
          price_before_cents: 1,
          brand: 1,
          rating: 1,
          images: "$images",
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


// ----------------- Controller: getProductBySlug -----------------
export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("getProductBySlug error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


// ----------------- Controller: createProduct (Admin) -----------------
export const createProduct = async (req: Request, res: Response) => {
  try {
    // debug logs (development-friendly)
    console.log('[createProduct] req.files length:', Array.isArray(req.files) ? (req.files as any[]).length : 0);
    console.log('[createProduct] imageUrls raw:', req.body.imageUrls);

    const { name, slug, brand, category, price_cents, description, imageUrls, variants } = req.body;

    const uploadedFiles = (req.files as Express.Multer.File[]) || [];
    // parse variants safely
    let parsedVariants: any[] = [];
    if (variants) {
      try {
        parsedVariants = typeof variants === 'string' ? JSON.parse(variants) : variants;
        if (!Array.isArray(parsedVariants)) parsedVariants = [];
      } catch (e) {
        parsedVariants = [];
      }
    }

    // parse image urls
    let urlArray: string[] = [];
    if (imageUrls) {
      try {
        urlArray = typeof imageUrls === 'string' ? JSON.parse(imageUrls) : imageUrls;
        if (!Array.isArray(urlArray)) urlArray = [];
      } catch (e) {
        urlArray = [];
      }
    }

    // build tasks (buffers first then urls)
    const imageTasks: Promise<any>[] = [];

    for (const file of uploadedFiles) {
      if (file && file.buffer) {
        imageTasks.push(processSingleImage({ buffer: file.buffer, mimeType: file.mimetype }));
      }
    }

    for (const url of urlArray) {
      if (typeof url === 'string' && url.trim()) {
        imageTasks.push(processSingleImage({ url: url.trim() }));
      }
    }

    if (imageTasks.length === 0) {
      return res.status(400).json({ message: 'At least one image (file or imageUrl) is required.' });
    }

    // run tasks in parallel and inspect results
    const settled = await Promise.allSettled(imageTasks);
    const successes = settled.filter(s => s.status === 'fulfilled').map((s: any) => s.value);
    const failures = settled
      .filter(s => s.status === 'rejected')
      .map((s: any) => (s.reason && s.reason.message) ? s.reason.message : String(s));

    console.log('[createProduct] image processing successes:', successes.length, 'failures:', failures.length);
    if (failures.length) console.warn('[createProduct] image processing failure reasons (sample):', failures.slice(0,5));

    if (successes.length === 0) {
      return res.status(500).json({
        message: 'Failed to process any images. Check image URLs or uploaded files.',
        details: process.env.NODE_ENV !== 'production' ? { failures } : undefined,
      });
    }

    const firstImageResult = successes[0];

    // parse price safely: accept cents or decimal rupees
    const priceNumber = (() => {
      const raw = price_cents ?? req.body.price;
      if (!raw) return null;
      const asNum = Number(raw);
      if (isNaN(asNum)) return null;
      return asNum > 1000 ? Math.round(asNum) : Math.round(asNum * 100);
    })();

    if (!priceNumber) {
      return res.status(400).json({ message: 'Invalid price. Provide price_cents (integer) or price (decimal rupees).' });
    }


    const newProduct = new Product({
      name: String(name).trim(),
      slug: String(slug).trim(),
      brand: String(brand).trim(),
      category: String(category).trim(),
      subCategory: (req.body.subCategory || "").toString().trim() || undefined,
      description: String(description || '').trim(),
      price: priceNumber / 100, // price in decimal (e.g., rupees)
      price_cents: priceNumber,
      price_before_cents: req.body.price_before_cents ? Number(req.body.price_before_cents) : Math.round(priceNumber * 1.3),
      variants: parsedVariants.length ? parsedVariants : [{ size: "One Size", color: "Default", sku: `${slug}-OS`, stock: 10 }],
      images: [firstImageResult.url], // Set images as array of string URLs
      dominantColor: firstImageResult.dominantColor || undefined,
      tags: firstImageResult.aiTags.style_tags || [],
      rating: req.body.rating ? Number(req.body.rating) : parseFloat((Math.random() * (5 - 3.8) + 3.8).toFixed(1)),
      reviewsCount: req.body.reviewsCount ? Number(req.body.reviewsCount) : 0,
      isPublished: req.body.isPublished !== undefined ? Boolean(req.body.isPublished) : true,
    });

    await newProduct.save();
    const responseData = newProduct.toObject();
    (responseData as any).tags = newProduct.aiTags.style_tags || [];
    return res.status(201).json(responseData);
  } catch (error: any) {
    if (error?.code === 11000) return res.status(409).json({ message: "Product slug already exists." });
    console.error("Product Creation Error:", error);
    return res.status(500).json({ 
      message: "Failed to create product.", 
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined 
    }); 
  }

};


// ----------------- Other controllers -----------------
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("deleteProduct error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getProductByIdAdmin = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    console.error("getProductByIdAdmin error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

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
    if (error?.code === 11000) return res.status(409).json({ message: "Slug already exists." });
    console.error("updateProduct error:", error);
    res.status(500).json({ message: "Failed to update product." });
  }
};


export const createReview = async (req: Request, res: Response) => {
  try {
    const { userId, productId, rating, comment } = req.body;
    if (!userId || !productId || !rating || !comment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const newReview = new Review({ userId, productId, rating, comment });
    await newReview.save();
    const stats = await Review.aggregate([
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
    console.error("createReview error:", error);
    res.status(500).json({ message: 'Failed to create review' });
  }
};


export const getReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.query;
    if (!productId) {
      return res.status(400).json({ message: 'Missing productId' });
    }
    const reviews = await Review.find({ productId }).populate('userId', 'name avatar');
    res.json(reviews);
  } catch (error) {
    console.error("getReviews error:", error);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

// GET /api/products/subcategories
export const getSubCategories = async (req: Request, res: Response) => {
  try {
    const subCategories = await Product.distinct("subCategory", {
      isPublished: true,
      subCategory: { $ne: "" },
    });

    res.json(subCategories.sort());
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch subcategories" });
  }
};

