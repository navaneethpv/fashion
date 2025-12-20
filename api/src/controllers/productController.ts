// /api/src/controllers/productController.ts

import { Request, Response } from "express";
import mongoose from 'mongoose';
import axios from "axios";
import cloudinary from "../config/cloudinary";
import { Product } from "../models/Product";
import { getProductTagsFromGemini } from '../utils/geminiTagging';
import { Review } from "../models/Review";
import { getGarmentColorFromGemini } from '../utils/geminiColorAnalyzer';
import { normalizeCategoryName, VALID_CATEGORIES } from '../utils/categoryNormalizer';

import { getSuggestedCategoryAndSubCategoryFromGemini } from "../utils/geminiTagging";

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
 * Returns { url, dominantColor: { name, hex, rgb }, aiTags }
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
    let dominantColor = { name: 'Gray', hex: '#808080', rgb: [] as number[] }; // Default gray (fallback)
    let aiTags = { semanticColor: 'N/A', style_tags: [], material_tags: [] };
    let colorDetectionStatus = 'fallback'; // Track whether color was AI-detected or fallback

    if (buffer) {
      try {
        console.log(`[COLOR_DETECTION] Starting Gemini color analysis for image: ${finalUrl}`);

        // Use Promise.all to run color and AI analysis concurrently for speed.
        const [geminiColorResult, aiResult] = await Promise.all([
          getGarmentColorFromGemini(buffer, mimeType),
          getProductTagsFromGemini(buffer, mimeType)
        ]);

        // Map Gemini color output to Product.dominantColor format
        if (geminiColorResult && geminiColorResult.dominant_color_name && geminiColorResult.dominant_color_hex) {
          dominantColor = {
            name: geminiColorResult.dominant_color_name,
            hex: geminiColorResult.dominant_color_hex,
            rgb: [] // Empty array as per requirements
          };
          colorDetectionStatus = 'ai_detected';
          console.log(`[COLOR_DETECTION] ✅ AI color detected: ${dominantColor.name} (${dominantColor.hex}) for image: ${finalUrl}`);
        } else {
          console.warn(`[COLOR_DETECTION] ⚠️ Gemini returned incomplete color data for image: ${finalUrl}. Using fallback gray.`);
          console.warn(`[COLOR_DETECTION] Gemini response:`, JSON.stringify(geminiColorResult, null, 2));
        }

        if (aiResult) {
          aiTags = aiResult;
          console.log(`[COLOR_DETECTION] ✅ AI tags extracted successfully for image: ${finalUrl}`);
        }
      } catch (analysisError: any) {
        // Detailed error logging for diagnosis
        const errorType = analysisError.constructor?.name || 'UnknownError';
        const errorMessage = analysisError.message || 'No error message';
        const errorStack = analysisError.stack ? `\nStack: ${analysisError.stack}` : '';

        console.error(`[COLOR_DETECTION] ❌ Gemini color detection FAILED for image: ${finalUrl}`);
        console.error(`[COLOR_DETECTION] Error Type: ${errorType}`);
        console.error(`[COLOR_DETECTION] Error Message: ${errorMessage}`);

        // Check for specific error types to provide actionable diagnostics
        if (errorMessage.includes('API key') || errorMessage.includes('GEMINI_API_KEY')) {
          console.error(`[COLOR_DETECTION] 🔑 DIAGNOSIS: Missing or invalid Gemini API key. Check GEMINI_API_KEY environment variable.`);
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
          console.error(`[COLOR_DETECTION] 🔑 DIAGNOSIS: Gemini API rate limit exceeded. Check API quota/limits.`);
        } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
          console.error(`[COLOR_DETECTION] 🔑 DIAGNOSIS: Network/timeout error. Check internet connection and Gemini API availability.`);
        } else if (errorMessage.includes('JSON') || errorMessage.includes('parse')) {
          console.error(`[COLOR_DETECTION] 🔑 DIAGNOSIS: Failed to parse Gemini response. Check API response format.`);
        } else {
          console.error(`[COLOR_DETECTION] 🔑 DIAGNOSIS: Unknown error. Full error:${errorStack}`);
        }

        console.warn(`[COLOR_DETECTION] ⚠️ Using fallback gray color (#808080) for image: ${finalUrl}`);
        // We don't re-throw here because we still have the image URL - image upload succeeds.
      }
    } else {
      console.warn(`[COLOR_DETECTION] ⚠️ No buffer available for color detection. Using fallback gray color for image: ${finalUrl}`);
    }

    // Log final status
    if (colorDetectionStatus === 'fallback') {
      console.log(`[COLOR_DETECTION] 📊 Final status: FALLBACK color used (${dominantColor.name}, ${dominantColor.hex}) for image: ${finalUrl}`);
    }

    return { url: finalUrl, dominantColor, aiTags };

  } catch (err: any) {
    // This top-level catch will handle critical failures (like the initial download).
    console.error(`[ERROR] Critical failure in processSingleImage: ${err.message}`);
    // Re-throw so Promise.allSettled in the controller can catch it as a 'rejected' promise.
    throw err;
  }
}




// Normalize user search terms to handle variations like "Tshirt", "T-shirt", "Tees"
function normalizeSearchQuery(query: string): string {
  return query.toLowerCase().replace(/[-\s]/g, '');
}

// Try to resolve search query to a category using the same alias logic as visual search  
function resolveSearchCategory(query: string): string | null {
  const normalized = normalizeSearchQuery(query);

  // Try to normalize as if it's a category name
  const resolved = normalizeCategoryName(query);

  // Check if the resolved category is actually in our valid list
  if (VALID_CATEGORIES.includes(resolved)) {
    return resolved;
  }

  return null;
}

// ----------------- Controller: getProducts -----------------
export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;
    const skip = (page - 1) * limit;
    const { category, sort, minPrice, maxPrice } = req.query;
    let { q } = req.query;

    // --- Flipkart-style Intent-Based Search ---
    // Parse natural language search into structured filters
    let inferredGender: string | null = null;
    let inferredCategory: string | null = null;

    if (q && typeof q === 'string') {
      const { parseSearchIntent } = require('../utils/searchIntentParser');
      const intent = parseSearchIntent(q);

      if (intent.gender) {
        inferredGender = intent.gender;
      }
      if (intent.category) {
        inferredCategory = intent.category;
      }

      // Clear q since we've extracted intent into structured filters
      q = '';
    }

    const pipeline: any[] = [];

    // 1. Match Stage (Base Filters)
    const matchStage: any = { isPublished: true };

    // Apply Filters (Manual overrides Inferred)
    const finalGender = (req.query.gender as string) || inferredGender;
    if (finalGender) matchStage.gender = finalGender;

    const finalCategory = (category as string) || (req.query.articleType as string) || inferredCategory;
    if (finalCategory) matchStage.category = finalCategory;

    if (req.query.subCategory) matchStage.subCategory = req.query.subCategory;
    if (req.query.masterCategory) matchStage.masterCategory = req.query.masterCategory;
    if (req.query.brand) matchStage.brand = req.query.brand;
    if (req.query.size) matchStage.sizes = req.query.size;
    // articleType is handled via finalCategory above

    if (minPrice || maxPrice) {
      matchStage.price_cents = {};
      if (minPrice) matchStage.price_cents.$gte = Number(minPrice) * 100;
      if (maxPrice) matchStage.price_cents.$lte = Number(maxPrice) * 100;
    }

    // Exclude innerwear logic (Restored)
    // Only filter when there's no search query (q parameter)
    if (!q) {
      // Innerwear terms to exclude (case-insensitive matching)
      const innerwearTerms = ['briefs', 'bras', 'lingerie', 'underwear', 'innerwear', 'panties', 'thong', 'boxers', 'trunks', 'vest', 'brief'];
      const innerwearRegex = new RegExp(innerwearTerms.join('|'), 'i');

      // Exclude products where category, subCategory, or masterCategory matches any innerwear term
      matchStage.$nor = [
        { category: { $regex: innerwearRegex } },
        { subCategory: { $regex: innerwearRegex } },
        { masterCategory: { $regex: innerwearRegex } },
        { name: { $regex: innerwearRegex } }
      ];
    }

    // Search Logic (Regex + Scoring) - Enhanced with normalization
    let isSearch = false;
    let resolvedCategory: string | null = null;
    if (q && typeof q === 'string') {
      isSearch = true;

      // Try to resolve query to a category (e.g., "Tshirt" → "Tshirts")
      resolvedCategory = resolveSearchCategory(q);
      console.log(`[SEARCH] Query: "${q}" → Resolved Category: "${resolvedCategory}"`);

      // If we resolved a category and no explicit category filter exists, use it
      if (resolvedCategory && !matchStage.category) {
        matchStage.category = resolvedCategory;
        console.log(`[SEARCH] Applied resolved category: "${resolvedCategory}"`);
      }

      const escapeRegex = (text: string) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

      // Create normalized search for better matching
      const normalizedQ = normalizeSearchQuery(q);
      const normalizedRegex = new RegExp(escapeRegex(normalizedQ), 'i');

      const exactRegex = new RegExp(`^${escapeRegex(q)}$`, 'i');
      const startsWithRegex = new RegExp(`^${escapeRegex(q)}`, 'i');
      const generalRegex = new RegExp(escapeRegex(q), 'i');

      matchStage.$or = [
        { name: generalRegex },
        { brand: generalRegex },
        { category: generalRegex },
        { subCategory: generalRegex },
        { masterCategory: generalRegex },
        { description: generalRegex }
      ];

      pipeline.push({ $match: matchStage });

      // 2. Add Scoring Field
      pipeline.push({
        $addFields: {
          searchScore: {
            $switch: {
              branches: [
                // Exact Name Match -> Score 100
                { case: { $regexMatch: { input: "$name", regex: exactRegex } }, then: 100 },
                // Name Starts With -> Score 80
                { case: { $regexMatch: { input: "$name", regex: startsWithRegex } }, then: 80 },
                // Name Contains -> Score 60
                { case: { $regexMatch: { input: "$name", regex: generalRegex } }, then: 60 },
                // Brand/Category Match -> Score 40
                {
                  case: {
                    $or: [
                      { $regexMatch: { input: "$brand", regex: generalRegex } },
                      { $regexMatch: { input: "$category", regex: generalRegex } }
                    ]
                  }, then: 40
                }
              ],
              default: 20 // Description or other matches
            }
          }
        }
      });

      // 3. Sort by Score
      pipeline.push({ $sort: { searchScore: -1, createdAt: -1 } });

    } else {
      // No search, just match
      pipeline.push({ $match: matchStage });

      // Default Sort
      const sortOptions: any = {};
      if (sort === 'price_asc') sortOptions.price_cents = 1;
      else if (sort === 'price_desc') sortOptions.price_cents = -1;
      else if (sort === 'newest') sortOptions.createdAt = -1;
      else sortOptions.createdAt = -1; // Default

      pipeline.push({ $sort: sortOptions });
    }

    // 4. Project fields
    pipeline.push(
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          category: 1,
          gender: 1,
          subCategory: 1,
          masterCategory: 1,
          price_cents: 1,
          price_before_cents: 1,
          brand: 1,
          rating: 1,
          images: "$images",
          dominantColor: 1,
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

    // 5. Pagination
    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }]
      }
    });

    // Normalize search intent to match existing category logic without refactoring
    console.log(`[SEARCH DEBUG] Page: ${page}, Query: "${q}", Category: "${matchStage.category}", Resolved: "${resolvedCategory}"`);
    console.log(`[SEARCH DEBUG] Match Stage:`, JSON.stringify(matchStage, null, 2));

    // Execute Pipeline
    const result = await Product.aggregate(pipeline);

    // Extract results
    const data = result[0].data || [];
    const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

    console.log(`[SEARCH DEBUG] Results - Total: ${total}, Page: ${page}, Data Count: ${data.length}`);

    res.json({
      data,
      meta: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: 'Server error', error });
  }
};


// ----------------- Controller: Search Suggestions -----------------
export const getSearchSuggestions = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') return res.json([]);

    const escapeRegex = (text: string) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const regex = new RegExp(escapeRegex(q), 'i');

    // 1. Find matching Brands (distinct)
    // We only want unique brands that match the query
    const brandMatches = await Product.aggregate([
      { $match: { brand: regex, isPublished: true } },
      { $group: { _id: { $toLower: "$brand" }, original: { $first: "$brand" } } },
      { $limit: 3 }
    ]);

    // 2. Find matching Categories (distinct)
    // Checking both category and subCategory fields
    const catMatches = await Product.aggregate([
      {
        $match: {
          $or: [{ category: regex }, { subCategory: regex }],
          isPublished: true
        }
      },
      {
        $project: {
          match: {
            $cond: {
              if: { $regexMatch: { input: "$category", regex: regex } },
              then: "$category",
              else: "$subCategory"
            }
          }
        }
      },
      { $group: { _id: { $toLower: "$match" }, original: { $first: "$match" } } },
      { $limit: 3 }
    ]);

    // 3. Find specific products (fallback/mix)
    const productMatches = await Product.find({
      name: regex,
      isPublished: true
    })
      .select('name brand category images slug')
      .limit(5)
      .lean();

    // Format results
    const results: { type: string; text: string; subText: string; image: string | null; slug?: string }[] = [];

    // Add Brands
    brandMatches.forEach(b => {
      results.push({
        type: 'brand',
        text: b.original,
        subText: 'in Brand',
        image: null // Frontend can show brand icon
      });
    });

    // Add Categories
    catMatches.forEach(c => {
      results.push({
        type: 'category',
        text: c.original,
        subText: 'in Category',
        image: null // Frontend can show category icon
      });
    });

    // Add Products
    productMatches.forEach(p => {
      // Logic for product image
      let thumb = null;
      if (p.images && p.images.length > 0) {
        const first = p.images[0];
        thumb = typeof first === 'string' ? first : (first as any).url;
      }

      results.push({
        type: 'product',
        text: p.name,
        subText: `in ${p.category}`,
        image: thumb,
        slug: p.slug
      });
    });

    // Dedupe slightly by text to avoid redundancy if brand == product name start
    const uniqueResults = results.filter((item, index, self) =>
      index === self.findIndex((t) => (
        t.text.toLowerCase() === item.text.toLowerCase() && t.type === item.type
      ))
    );

    res.json(uniqueResults.slice(0, 8)); // Return top 8 mixed suggestions
  } catch (error) {
    console.error("Search Suggestion Error:", error);
    res.status(500).json([]);
  }
};


// ----------------- Controller: getProductBySlug -----------------
// ----------------- Controller: getProductBySlug -----------------
export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).lean();
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Fetch related data in parallel
    const queries: Promise<any>[] = [];

    // 1. Related Accessories (Complete the Look) - Only for Women/Girls
    const isFemale = ['Women', 'Girls'].includes(product.gender || '');
    if (isFemale) {
      const accessoriesQuery = Product.find({
        gender: product.gender,
        category: { $in: ['Watches', 'Jewellery', 'Bangles', 'Necklaces', 'Handbags', 'Sunglasses'] },
        _id: { $ne: product._id },
        isPublished: true
      })
        .select('name slug price_cents images brand')
        .limit(6)
        .lean();
      queries.push(accessoriesQuery);
    } else {
      queries.push(Promise.resolve([]));
    }

    // 2. Similar Products (You May Also Like)
    const similarQuery = Product.find({
      gender: product.gender,
      category: product.category,
      _id: { $ne: product._id },
      isPublished: true
    })
      .select('name slug price_cents images brand')
      .sort({ rating: -1, createdAt: -1 })
      .limit(10)
      .lean();
    queries.push(similarQuery);

    const [relatedAccessories, similarProducts] = await Promise.all(queries);

    // Attach to product object (Backward Compatible)
    const enhancedProduct = {
      ...product,
      relatedAccessories: relatedAccessories || [],
      similarProducts: similarProducts || []
    };

    res.json(enhancedProduct);
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

    const { name, slug, brand, category, price_cents, description, imageUrls, variants, gender, masterCategory, isFashionItem } = req.body;

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
    if (failures.length) console.warn('[createProduct] image processing failure reasons (sample):', failures.slice(0, 5));

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

    // Validate gender (required for outfit generation, must be one of: Men, Women, Kids)
    const validGenders = ["Men", "Women", "Kids"];
    if (!gender) {
      return res.status(400).json({
        message: `Gender is required. Must be one of: ${validGenders.join(", ")}`
      });
    }
    const genderTrimmed = String(gender).trim();
    if (!validGenders.includes(genderTrimmed)) {
      return res.status(400).json({
        message: `Invalid gender "${genderTrimmed}". Must be one of: ${validGenders.join(", ")}`
      });
    }

    const newProduct = new Product({
      name: String(name).trim(),
      slug: String(slug).trim(),
      brand: String(brand).trim(),
      category: String(category).trim(),
      subCategory: (req.body.subCategory || "").toString().trim() || undefined,
      gender: String(gender).trim(), // Required field, validated above
      masterCategory: masterCategory ? String(masterCategory).trim() : undefined,
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
      isFashionItem: isFashionItem !== undefined ? Boolean(isFashionItem) : true, // Default to true for admin-created products
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
    delete updateData.images; // We don't support image updates here yet

    // Sync price and price_cents
    if (updateData.price !== undefined) {
      const priceVal = Number(updateData.price);
      if (!isNaN(priceVal)) {
        updateData.price = priceVal;
        // Heuristic: if price is small (e.g. < 1000) assume it's decimal (rupees), * 100 for cents
        // If it's large, assume it's already cents? No, the Edit page sends the decimal value.
        // Let's standardise: Edit page sends "1299.00" (rupees).
        // Backend expects price (decimal) and price_cents (integer).
        updateData.price_cents = Math.round(priceVal * 100);

        // Also check price_before_cents logic if needed, but let's stick to fixing the main price first.
      }
    }

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
      {
        $group: {
          _id: '$productId',
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
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


// GET /api/products/categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Product.distinct("category", {
      isPublished: true,
      category: { $ne: "" },
    });

    res.json(categories.sort());
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

// GET /api/products/subcategories/:category
export const getSubcategoriesByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;

    if (!category) {
      return res.status(400).json({ message: "Category parameter is required" });
    }

    const subCategories = await Product.distinct("subCategory", {
      category: category,
      isPublished: true,
      subCategory: { $ne: "" },
    });

    res.json(subCategories.sort());
  } catch (err) {
    console.error("Error fetching subcategories by category:", err);
    res.status(500).json({ message: "Failed to fetch subcategories" });
  }
};


export const aiSuggestSubCategory = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "Image file required" });
    }

    const categories = await Product.distinct("category", {
      isPublished: true,
      category: { $ne: "" },
    });

    const subCategories = await Product.distinct("subCategory", {
      isPublished: true,
      subCategory: { $ne: "" },
    });

    if (!subCategories.length) {
      return res.json({ category: "", subCategory: "" });
    }

    const suggested = await getSuggestedCategoryAndSubCategoryFromGemini(
      file.buffer,
      file.mimetype,
      categories.length > 0 ? categories : undefined,
      subCategories
    );

    res.json({
      category: suggested.category,
      subCategory: suggested.subCategory
    });
  } catch (err) {
    console.error("AI Suggest Error:", err);
    res.status(500).json({ message: "AI category failed" });
  }
};
