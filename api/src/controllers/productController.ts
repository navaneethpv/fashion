import { Request, Response } from "express";
import { Product } from "../models/Product";
import axios from "axios";
import { uploadImageBuffer, analyzeImageUrl } from "../utils/imageUpload";
import { getProductTagsFromGemini } from '../utils/geminiTagging'
import { Review } from "../models/Review"
interface ImageResult {
    url: string;
    dominant_color: string;
    r: number;
    g: number;
    b: number;
}

// Utility to process a single image source (URL or Buffer)
async function processSingleImage(source: { buffer?: Buffer, url?: string, mimeType?: string }): Promise<any> {
    const { buffer, url, mimeType } = source;
    let finalUrl: string = '';
    let colorData = { hex: '#000000', r: 0, g: 0, b: 0 };
    let finalBuffer: Buffer | undefined = buffer;

    if (buffer) {
        // Option A: File Upload (Cloudinary upload)
        const result = await uploadImageBuffer(buffer); 
        finalUrl = result.url;
        colorData = result.colorData;
    } else if (url) {
        // Option B: URL Input (Download and analyze)
        const result = await analyzeImageUrl(url);
        finalUrl = result.url;
        colorData = result.colorData;
        
        // Re-download buffer for Gemini analysis (if needed)
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        finalBuffer = Buffer.from(response.data, 'binary');
    } else {
        throw new Error("No image source provided.");
    }
    
    // AI Tagging (Call Gemini only if we have a buffer, typically for the main image)
    let aiTags = { dominant_color_name: '', style_tags: [], material_tags: [] };
    if (finalBuffer) {
        aiTags = await getProductTagsFromGemini(finalBuffer, mimeType || 'image/jpeg');
    }

    return { url: finalUrl, colorData, aiTags };
}


// GET /api/products (Public/Admin Listing)
export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24; 
    const { category, sort, q, minPrice, maxPrice } = req.query; // 'q' is the search query

    let matchQuery: any = { is_published: true };

    // Filters
    if (category) matchQuery.category = category;
    
    // 👇 SEARCH IMPLEMENTATION FIX 👇
    if (q) {
        // Use MongoDB's $text operator for search index
        matchQuery.$text = { $search: String(q) };
    }
    // 👆 END SEARCH FIX 👆
    
    if (minPrice || maxPrice) {
      matchQuery.price_cents = {};
      if (minPrice) matchQuery.price_cents.$gte = Number(minPrice);
      if (maxPrice) matchQuery.price_cents.$lte = Number(maxPrice);
    }
    
    let sortOption: any = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price_cents: 1 };
    if (sort === "price_desc") sortOption = { price_cents: -1 };

    // --- AGGREGATION PIPELINE ---
    let pipeline: any[] = [
      { $match: matchQuery },
      { $addFields: { totalStock: { $sum: "$variants.stock" } }},
    ];

    // CRUCIAL: If using a $text search, MongoDB requires the score to be used for sorting
    if (q) {
      pipeline.push({ $sort: { score: { $meta: "textScore" }, ...sortOption } });
    } else {
      pipeline.push({ $sort: sortOption });
    }
    
    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: limit },
      { $project: {
          name: 1, slug: 1, price_cents: 1, price_before_cents: 1,
          images: { $slice: ["$images", 1] }, 
          category: 1, offer_tag: 1, totalStock: 1
      }}
    );
    
    const products = await Product.aggregate(pipeline);
    const total = await Product.countDocuments(matchQuery);

    res.json({
      data: products,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
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


// POST /api/products - Admin (FINAL MULTI-IMAGE/AI VERSION)
export const createProduct = async (req: Request, res: Response) => {
  try {
    // ⚠️ CRITICAL FIX: Destructure all body fields sent by the frontend FormData
    const { 
        name, slug, brand, category, price_cents, description, 
        imageUrls, variants 
    } = req.body;
    
    const uploadedFiles = req.files as Express.Multer.File[] || [];

    // Cast and Parse
    const priceInCents = parseFloat(price_cents as string) * 100;
    const parsedVariants = variants ? JSON.parse(variants as string) : [];
    const urlArray: string[] = imageUrls ? JSON.parse(imageUrls as string) : [];
    
    // 1. Process All Images (Uploaded Files + URLs)
    const imagePromises: Promise<any>[] = [];
    
    // A. Process uploaded files (Buffers in req.files)
    for (const file of uploadedFiles) {
        imagePromises.push(processSingleImage({ buffer: file.buffer, mimeType: file.mimetype }));
    }

    // B. Process input URLs
    for (const url of urlArray) {
        imagePromises.push(processSingleImage({ url }));
    }

    const imageResults = await Promise.all(imagePromises);

    // 2. Extract Tags from the first image processed
    let mainProductTags = { dominant_color_name: '', style_tags: [], material_tags: [] };
    const firstImageResult = imageResults[0];
    if (firstImageResult) {
      mainProductTags = firstImageResult.aiTags;
    }

    // 3. Format Image Data for Mongoose
    const mongooseImageDocs = imageResults.map(result => ({
        url: result.url,
        dominant_color: result.colorData.hex,
        r: result.colorData.r,
        g: result.colorData.g,
        b: result.colorData.b
    }));

    if (mongooseImageDocs.length === 0) {
        return res.status(400).json({ message: 'No valid images were processed.' });
    }

    // 4. Create Product
    const newProduct = new Product({
      name, slug, brand, category, description, 
      price_cents: priceInCents,
      images: mongooseImageDocs, 
      variants: parsedVariants,
      is_published: true,
      tags: [
          category as string, brand as string, 'New Arrival',
          mainProductTags.dominant_color_name.toLowerCase(),
          ...(mainProductTags.style_tags as string[]).map(t => t.toLowerCase()),
          ...(mainProductTags.material_tags as string[]).map(t => t.toLowerCase()),
      ].filter(Boolean)
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error: any) {
    if (error.code === 11000) {
        return res.status(409).json({ message: "Product slug already exists." });
    }
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