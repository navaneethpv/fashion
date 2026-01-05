// /api/src/controllers/productController.ts

import { Request, Response } from "express";
import mongoose from 'mongoose';
import axios from "axios";
import fs from 'fs';
import path from 'path';

import { Product } from "../models/Product";
import { getProductTagsFromGemini } from '../utils/geminiTagging';
import { Review } from "../models/Review";
import { getGarmentColorFromGemini } from '../utils/geminiColorAnalyzer';


import { normalizeCategoryName as normalizeAIIntent, VALID_CATEGORIES as AI_VALID_CATEGORIES } from '../utils/categoryNormalizer';
import { getAllArticleTypes, resolveArticleTypes, resolveBroadTerms } from '../utils/articleTypeResolver';
import { VALID_CATEGORIES, VALID_SUBCATEGORIES, normalizeCategoryInput, normalizeSubCategoryInput } from "../utils/categoryConstants";

import { getSuggestedCategoryAndSubCategoryFromGemini } from "../utils/geminiTagging";

import imagekit from "../config/imagekit";

/**
 * Upload a buffer to ImageKit.
 */
function uploadToImageKit(buffer: Buffer, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    imagekit.upload(
      {
        file: buffer, // ImageKit supports buffer directly
        fileName: filename,
        folder: "/products", // Optional: organize in a folder
      },
      (err, result) => {
        if (err) {
          console.error("ImageKit Upload Error:", err);
          return reject(err);
        }
        if (result && result.url) {
          resolve(result.url); // Return the public URL
        } else {
          reject(new Error("ImageKit upload failed: No URL returned"));
        }
      }
    );
  });
}

/**
 * Robust single-image processor.
 * Accepts { buffer?, url?, mimeType? }
 * Returns { url, dominantColor: { name, hex, rgb }, aiTags }
 */

async function processSingleImage(
  source: { buffer?: Buffer, url?: string, mimeType?: string },
  context: { name: string, category: string } = { name: 'Fashion Item', category: 'Clothing' }
) {
  let finalUrl = '';
  let buffer: Buffer | undefined = source.buffer;
  let mimeType = source.mimeType || 'image/jpeg';
  // Removed imageEmbedding logic

  console.log(`[DEBUG] processSingleImage processing: ${source.url ? 'URL' : 'BUFFER'}`);


  try {
    // --- Step 1: Get the Image Buffer and Upload ---
    if (source.url) {
      try {
        // ✅ DIRECT URL HANDLING: Use the URL for display, but download for AI analysis
        if (!/^https?:\/\//.test(source.url)) {
          throw new Error("Invalid URL format. Must start with http:// or https://");
        }

        // If it's already an ImageKit URL (or Cloudinary/firebase), we might just use it.
        // But for consistency and persistence, we might want to re-upload or just keep it.
        // For now, let's treat external URLs as things we want to IMPORT into our system if possible,
        // OR just rely on the external URL. 
        // IF we want to persist everything in ImageKit, we should download and upload.
        // Let's assume we maintain the external URL if it is provided, unless we want to own it.
        // But the user requested "upload products", implying they might paste a link and want it saved.
        // Let's stick to the current logic: Use the URL as is for `finalUrl`, but download for AI.
        // WAIT: The valid request was "upload products". If they provide a URL, do we host it?
        // If it's a temporary URL, we lose it.
        // Better approach: Download it and Upload to ImageKit to ensure persistence.

        // Let's Download -> Upload to ImageKit
        console.log(`[PROCESS_IMAGE] Downloading image for persistence & AI: ${source.url}`);
        const response = await axios.get(source.url, { responseType: 'arraybuffer', timeout: 10000 });
        buffer = Buffer.from(response.data);
        if (response.headers['content-type']) {
          mimeType = response.headers['content-type'];
        }

        // Generate filename
        const ext = mimeType.split('/')[1] || 'jpg';
        const filename = `product-${Date.now()}-${Math.round(Math.random() * 1000)}.${ext}`;

        // Upload to ImageKit
        finalUrl = await uploadToImageKit(buffer, filename);
        console.log(`[PROCESS_IMAGE] Uploaded remote image to ImageKit: ${finalUrl}`);

      } catch (networkError: any) {
        console.warn(`[WARN] Failed to download/validate/upload URL: ${source.url}. Reason: ${networkError.message}`);
        // Fallback: If download fails, check if the URL itself is accessible. If so, just use it.
        // But for this robust implementation, let's just fail if we can't process it, 
        // OR just return the original URL if we trust it.
        // Let's use the original URL as fallback if download fails, but warn.
        finalUrl = source.url;
      }
    } else if (buffer) {
      // If a file buffer was provided directly (from an upload)
      const ext = mimeType.split('/')[1] || 'jpg';
      const filename = `product-${Date.now()}-${Math.round(Math.random() * 1000)}.${ext}`;

      finalUrl = await uploadToImageKit(buffer, filename);
      console.log(`[PROCESS_IMAGE] Uploaded buffer to ImageKit: ${finalUrl}`);
    } else {
      throw new Error("No image source (URL or buffer) was provided.");
    }

    if (!finalUrl) {
      throw new Error('Image save failed.');
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
          getProductTagsFromGemini(buffer, mimeType, context.name, context.category)
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
  const resolved = normalizeAIIntent(query);

  // Check if the resolved category is actually in our valid list
  if (resolved && VALID_CATEGORIES.includes(resolved)) {
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
    const originalQuery = q; // Save before clearing for multi-category search

    // Helper: Escape Regex special characters
    const escapeRegex = (text: string) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

    // --- Flipkart-style Intent-Based Search ---
    // Parse natural language search into structured filters
    let inferredGender: string | null = null;
    let inferredCategory: string | null = null;
    let isSearch = false;

    if (q && typeof q === 'string') {
      const { parseSearchIntent } = require('../utils/searchIntentParser');
      const intent = parseSearchIntent(q);

      if (intent.gender) inferredGender = intent.gender;
      if (intent.category) inferredCategory = intent.category;

      isSearch = true;
    }

    const pipeline: any[] = [];
    const matchStage: any = { isPublished: true };

    // --- 1. Apply Filters (Manual overrides Inferred) ---

    // Gender
    const rawGender = (req.query.gender as string) || inferredGender;
    if (rawGender) {
      matchStage.gender = new RegExp(`^${rawGender}$`, 'i');
    }

    // Category
    let finalCategory = (category as string) || (req.query.articleType as string) || inferredCategory;
    if (finalCategory) {
      const queryLower = originalQuery && typeof originalQuery === 'string' ? originalQuery.toLowerCase() : '';
      // Special Footwear Handling
      if (queryLower && (queryLower.includes('footwear') || queryLower.includes('chappals') || queryLower.includes('chappal'))) {
        matchStage.category = {
          $in: ['Heels', 'Flats', 'Sandals', 'Sports Sandals', 'Sports Shoes',
            'Casual Shoes', 'Formal Shoes', 'Flip Flops', 'Booties']
        };
      } else {
        const normalized = normalizeCategoryInput(finalCategory);
        if (normalized && VALID_CATEGORIES.includes(normalized)) {
          matchStage.category = normalized;
        } else {
          matchStage.category = new RegExp(`^${finalCategory}$`, 'i');
        }
      }
    }

    // SubCategory
    if (req.query.subCategory) {
      const sub = req.query.subCategory as string;
      const subClean = sub.replace(/-/g, ' ').trim();
      matchStage.subCategory = new RegExp(`^${subClean}$`, 'i');
    }

    // MasterCategory
    if (req.query.masterCategory) matchStage.masterCategory = new RegExp(`^${req.query.masterCategory}$`, 'i');

    // Brand
    if (req.query.brand) {
      const brands = (req.query.brand as string).split(',').map(b => new RegExp(`^${b.trim()}$`, 'i'));
      matchStage.brand = { $in: brands };
    }

    // Size
    if (req.query.size) {
      const sizes = (req.query.size as string).split(',').map(s => new RegExp(`^${s.trim()}$`, 'i'));
      matchStage["variants.size"] = { $in: sizes };
    }

    // Color
    if (req.query.color) {
      const colors = (req.query.color as string).split(',').map(c => new RegExp(`^${c.trim()}$`, 'i'));
      matchStage["dominantColor.name"] = { $in: colors };
    }

    // Price
    if (minPrice || maxPrice) {
      matchStage.price_cents = {};
      if (minPrice) matchStage.price_cents.$gte = Number(minPrice) * 100;
      if (maxPrice) matchStage.price_cents.$lte = Number(maxPrice) * 100;
    }

    // Exclude innerwear (unless searching for it)
    if (!q || /accessory|accessories/i.test(q as string)) {
      const innerwearTerms = ['briefs', 'bras', 'lingerie', 'underwear', 'innerwear', 'panties', 'thong', 'boxers', 'trunks', 'vest', 'brief'];
      const innerwearRegex = new RegExp(innerwearTerms.join('|'), 'i');
      // Only exclude if NO explicit category/subcategory filter contradicts this
      if (!matchStage.category && !matchStage.subCategory) {
        matchStage.$nor = [
          { category: { $regex: innerwearRegex } },
          { subCategory: { $regex: innerwearRegex } },
          { masterCategory: { $regex: innerwearRegex } },
          { name: { $regex: innerwearRegex } }
        ];
      }
    }


    // --- 2. Advanced Keyword Search Logic ---
    let searchStage: any = {};
    if (isSearch && typeof q === 'string') {
      const queryClean = q.trim();

      // Split into tokens, ignore small words (<=2 chars) unless they are numbers or specific codes
      const tokens = queryClean.split(/\s+/)
        .map(t => t.trim())
        .filter(t => t.length > 2 || /^[0-9]+$/.test(t)); // Keep numbers like '501'

      if (tokens.length > 0) {
        // "AND" Logic: Every token must match AT LEAST ONE field
        const andConditions = tokens.map(token => {
          const tokenRegex = new RegExp(escapeRegex(token), 'i');
          return {
            $or: [
              { name: tokenRegex },
              { description: tokenRegex },
              { brand: tokenRegex },
              { category: tokenRegex },
              { subCategory: tokenRegex },
              { masterCategory: tokenRegex },
              { "dominantColor.name": tokenRegex },
              { "aiTags.style_tags": tokenRegex },
              { "aiTags.material_tags": tokenRegex },
              { "aiTags.pattern": tokenRegex },
              { "aiTags.sleeve": tokenRegex }
            ]
          };
        });

        // Allow Accessories Special Case (OR logic for "Accessories" keyword itself to catch various items)
        if (/accessory|accessories/i.test(q)) {
          const accTerms = [
            'Jewellery', 'Bingle', 'Bangle', 'Necklace', 'Handbag', 'Purse', 'Sunglass',
            'Belt', 'Watch', 'Hat', 'Cap', 'Accessory', 'Accessories',
            'Earring', 'Ring', 'Wallet', 'Perfume', 'Tie', 'Cufflink', 'Scarf'
          ];
          const accRegex = new RegExp(accTerms.join('|'), 'i');
          // If query is JUST "accessories", replace the AND logic with this wide net
          // If query is "red accessories", keep "red" AND (accessories_group)

          // For now, simpler approach: If accessories search, just add broad match to existing Match Stage
          matchStage.$or = [
            { category: accRegex },
            { subCategory: accRegex },
            { masterCategory: accRegex }
          ];
          // Remove 'accessory' from tokens to avoid double filtering if mapped
        } else {
          searchStage = { $and: andConditions };
        }
      }
    }

    // Merge Search Stage into Match Stage
    const finalMatchStage = { ...matchStage, ...searchStage };


    pipeline.push({ $match: finalMatchStage });

    // --- 3. Relevance Scoring ---
    if (isSearch && typeof q === 'string') {
      const exactRegex = new RegExp(`^${escapeRegex(q)}$`, 'i');
      const startsWithRegex = new RegExp(`^${escapeRegex(q)}`, 'i');
      const generalRegex = new RegExp(escapeRegex(q), 'i');

      pipeline.push({
        $addFields: {
          searchScore: {
            $switch: {
              branches: [
                // 1. Exact Name Match (Highest)
                { case: { $regexMatch: { input: "$name", regex: exactRegex } }, then: 100 },
                // 2. Name Starts With
                { case: { $regexMatch: { input: "$name", regex: startsWithRegex } }, then: 80 },
                // 3. Name Contains
                { case: { $regexMatch: { input: "$name", regex: generalRegex } }, then: 60 },
                // 4. Category/SubCategory/Brand Match
                {
                  case: {
                    $or: [
                      { $regexMatch: { input: "$category", regex: generalRegex } },
                      { $regexMatch: { input: "$subCategory", regex: generalRegex } },
                      { $regexMatch: { input: "$brand", regex: generalRegex } }
                    ]
                  }, then: 50
                },
                // 5. AI Tags / Description Match
                {
                  case: {
                    $or: [
                      { $in: [new RegExp(q, 'i'), { $ifNull: ["$aiTags.style_tags", []] }] }, // basic check
                      { $regexMatch: { input: "$description", regex: generalRegex } }
                    ]
                  }, then: 30
                }
              ],
              default: 10 // Basic Keyword Match via the AND filter
            }
          }
        }
      });
      pipeline.push({ $sort: { searchScore: -1, createdAt: -1 } });
    } else {
      // Default Sort
      const sortOptions: any = {};
      if (sort === 'price_asc') sortOptions.price_cents = 1;
      else if (sort === 'price_desc') sortOptions.price_cents = -1;
      else if (sort === 'newest') sortOptions.createdAt = -1;
      else sortOptions.createdAt = -1;
      pipeline.push({ $sort: sortOptions });
    }

    // --- 4. Projection & Pagination ---
    pipeline.push(
      {
        $project: {
          _id: 1, name: 1, slug: 1, category: 1, gender: 1, subCategory: 1,
          masterCategory: 1, price_cents: 1, price_before_cents: 1, brand: 1,
          rating: 1, images: 1, dominantColor: 1, variants: 1, // Keep full variants for cart
          searchScore: 1
        }
      }
    );

    pipeline.push({
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }]
      }
    });

    // Execute Main Search
    let result = await Product.aggregate(pipeline);
    let data = result[0].data || [];
    let total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

    // --- 5. FALLBACK LOGIC ---
    // If no results found, search was attempted, and we need a fallback
    if (total === 0 && isSearch) {
      console.log(`[SEARCH] No exact matches for "${q}". Attempting fallback...`);

      // A. Try Category Fallback
      const fallbackCategory = resolveSearchCategory(q as string);
      if (fallbackCategory) {
        console.log(`[SEARCH] Fallback: Found category "${fallbackCategory}"`);
        const fallbackResult = await Product.find({
          category: fallbackCategory,
          isPublished: true
        })
          .sort({ createdAt: -1 })
          .limit(limit)
          .select('name slug category price_cents images brand'); // Lean select for fallback

        if (fallbackResult.length > 0) {
          data = fallbackResult;
          total = data.length; // Approximate
        }
      }

      // B. If still empty, return "Latest Products" (Generic Fallback)
      if (data.length === 0) {
        console.log(`[SEARCH] Fallback: Fetching latest products.`);
        data = await Product.find({ isPublished: true })
          .sort({ createdAt: -1 })
          .limit(40) // Limit to 40 for fallback
          .select('name slug category price_cents images brand');
        total = data.length;
      }
    }

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
    const product = await Product.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } }, // Increment view count
      { new: true }
    ).lean();
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
    res.status(500).json({ message: "Server Error" });
  }
};

// ----------------- Controller: getSubCategoriesForMaster -----------------
export const getSubCategoriesForMaster = async (req: Request, res: Response) => {
  try {
    const { category } = req.params; // This is the 'masterCategory' in DB terms
    if (!category) return res.status(400).json({ message: "Category parameter is required" });

    // Case-insensitive regex for masterCategory
    const regex = new RegExp(`^${category}$`, 'i');

    const subCategories = await Product.distinct("category", {
      masterCategory: regex,
      isPublished: true
    });

    res.json(subCategories.sort());
  } catch (error) {
    console.error("Get SubCategories Error:", error);
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
        imageTasks.push(processSingleImage(
          { buffer: file.buffer, mimeType: file.mimetype },
          { name: name || 'Product', category: category || 'Clothing' }
        ));
      }
    }

    for (const url of urlArray) {
      if (typeof url === 'string' && url.trim()) {
        imageTasks.push(processSingleImage(
          { url: url.trim() },
          { name: name || 'Product', category: category || 'Clothing' }
        ));
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

    // Fail-safe: If all images failed, we proceed but with a warning.
    if (successes.length === 0) {
      console.warn('[createProduct] ⚠️ No images processed successfully. Creating product with fallback defaults.');
      // Do NOT return error. Proceed with defaults.
    }

    // Try to find a result that has AI data (likely from a file upload) to use for product metadata
    const firstImageResult = successes.length > 0 ? (successes.find((s: any) => s.dominantColor) || successes[0]) : {
      url: "",
      dominantColor: undefined,
      imageEmbedding: undefined,
      aiTags: { style_tags: [] }
    };

    // Collect ALL successful image URLs
    const validImageUrls = successes.map((s: any) => s.url).filter((u: any) => u && typeof u === 'string');

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

    // --- CATEGORY VALIDATION (DYNAMIC DB-BASED) ---
    // 1. Check if the Category (Input "SubCategory") exists in the DB
    // We treat the input 'category' as the DB 'category' field.
    const normalizedCategoryInput = String(category).trim();

    // Check if this category exists in the DB (Case Insensitive)
    const categoryExists = await Product.exists({
      category: new RegExp(`^${normalizedCategoryInput}$`, 'i')
    });

    // Valid if it exists OR if it matches one of the known valid list (fallback for bootstrapping new categories)
    // We keep VALID_CATEGORIES as a fallback only if DB is empty, but primary is DB.
    // Actually, per instructions: "If category exists in DB → accept it."

    let dbCategory = normalizedCategoryInput;
    if (categoryExists) {
      // Fetch the canonical casing from one document
      const canonical = await Product.findOne({ category: new RegExp(`^${normalizedCategoryInput}$`, 'i') }).select('category').lean();
      if (canonical) dbCategory = canonical.category;
    } else {
      // If it's not in DB, is it in the static list? (Legacy support / Bootstrapping)
      const staticMatch = VALID_CATEGORIES.find(c => c.toLowerCase() === normalizedCategoryInput.toLowerCase());
      if (staticMatch) {
        dbCategory = staticMatch;
      } else {
        // If totally new and not in static list, we reject it to prevent pollution
        return res.status(400).json({
          message: `Invalid category "${category}". Please use an existing category.`
        });
      }
    }

    const normalizedCategory = dbCategory;

    // 2. Validate user "SubCategory" (Input) vs DB "subCategory"
    // Though requirements focused mainly on Category, let's just ensure clean input.
    let normalizedSubCategory = "";
    if (req.body.subCategory) {
      normalizedSubCategory = String(req.body.subCategory).trim();
      // Optional: Check if this subCategory is valid for the category?
      // The prompt says "If subCategory exists for that category → accept it."
      // We won't block based on subCategory distinctness for now to be flexible, just trimming.
    }
    // ---------------------------

    const newProduct = new Product({
      name: String(name).trim(),
      slug: String(slug).trim(),
      brand: String(brand).trim(),
      category: normalizedCategory,
      subCategory: normalizedSubCategory || undefined,
      gender: String(gender).trim(), // Required field, validated above
      masterCategory: masterCategory ? String(masterCategory).trim() : undefined,
      description: String(description || '').trim(),
      price: priceNumber / 100, // price in decimal (e.g., rupees)
      price_cents: priceNumber,
      price_before_cents: req.body.price_before_cents ? Number(req.body.price_before_cents) : Math.round(priceNumber * 1.3),
      variants: parsedVariants.length ? parsedVariants : [{ size: "One Size", color: "Default", sku: `${slug}-OS`, stock: 10 }],
      images: validImageUrls.length > 0 ? validImageUrls : [], // ✅ Save ALL images
      dominantColor: firstImageResult.dominantColor || undefined,
      imageEmbedding: firstImageResult.imageEmbedding, // ✅ Save Embedding
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

    // --- VALIDATION FOR UPDATE ---
    if (updateData.category) {
      const normCat = normalizeCategoryInput(updateData.category);
      if (!VALID_CATEGORIES.includes(normCat)) {
        return res.status(400).json({ message: `Invalid category: ${updateData.category}` });
      }
      updateData.category = normCat;

      // If updating category but NOT subcategory, we might end up with invalid state.
      // Ideally, we should check against the *new* category if subCategory is also being updated.
      // If subCategory NOT in updateData, it keeps old value (which might be invalid for new category).
      // For strictness, if category changes, client SHOULD send subCategory too or we accept it might be mismatched temporarily.
      // But let's check if subCategory IS provided:
    }

    if (updateData.subCategory) {
      // If we have a category in update, use it. Else... strictly we need to fetch product to know parent category?
      // For efficiency, assume client sends consistent data.
      // If category is in updateData, validate against it.
      if (updateData.category) {
        const cat = updateData.category; // already normalized above
        const sub = normalizeSubCategoryInput(updateData.subCategory);
        const allowed = VALID_SUBCATEGORIES[cat] || [];
        if (allowed.length > 0) {
          const match = allowed.find(s => s.toLowerCase() === sub.toLowerCase());
          if (!match) return res.status(400).json({ message: `Invalid subCategory for ${cat}` });
          updateData.subCategory = match;
        } else {
          updateData.subCategory = sub;
        }
      }
    }
    // ----------------------------

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
    const { userId, productId, rating, comment, userName, userAvatar } = req.body;
    if (!userId || !productId || !rating || !comment || !userName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const newReview = new Review({ userId, productId, rating, comment, userName, userAvatar });
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
    const productId = req.params.productId || req.query.productId;
    if (!productId) {
      return res.status(400).json({ message: 'Missing productId' });
    }
    const reviews = await Review.find({ productId })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);

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


// ----------------- Controller: getHomeProducts (Dynamic) -----------------
export const getHomeProducts = async (req: Request, res: Response) => {
  try {
    // Exclusion Regexes
    const innerwearRegex = /briefs|bras|lingerie|underwear|innerwear|panties|thong|boxers|trunks|vest|brief|baniyan/i;
    // Exclude sprays, skincare, lotions, etc. Keep lipsticks and other makeup.
    const excludedCosmeticsRegex = /spray|skincare|lotion|cream|serum|moisturizer|cleanser|facewash|face wash|body wash|shampoo|conditioner|soap|oil/i;

    const exclusionFilter = {
      $nor: [
        { category: innerwearRegex },
        { subCategory: innerwearRegex },
        { name: innerwearRegex },
        { category: excludedCosmeticsRegex },
        { subCategory: excludedCosmeticsRegex },
        { name: excludedCosmeticsRegex }
      ]
    };

    const matchStage = {
      isPublished: true,
      stock: { $gt: 0 },
      ...exclusionFilter
    };

    // 1. Trending (Random 12)
    const trending = await Product.aggregate([
      { $match: matchStage },
      { $sample: { size: 12 } }
    ]);

    // 2. Most Viewed (Random 10)
    const mostViewed = await Product.aggregate([
      { $match: matchStage },
      { $sample: { size: 10 } }
    ]);

    // 3. Offers (Random 8)
    const offers = await Product.aggregate([
      { $match: matchStage },
      { $sample: { size: 8 } }
    ]);

    res.json({
      trending,
      mostViewed,
      offers
    });

  } catch (error) {
    console.error("getHomeProducts error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};


// ----------------- Controller: getMostViewedProducts -----------------
export const getMostViewedProducts = async (req: Request, res: Response) => {
  try {
    const products = await Product.find({
      isPublished: true,
      stock: { $gt: 0 }
    })
      .sort({ views: -1 }) // Sort by views descending
      .limit(10)          // Top 10
      .select('name slug price_cents price_before_cents images brand offer_tag'); // Optimize select

    res.json(products);
  } catch (error) {
    console.error("getMostViewedProducts error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
