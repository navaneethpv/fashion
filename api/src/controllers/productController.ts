import { Request, Response } from "express";
import { Product } from "../models/Product";
import getColors from "get-image-colors"; // We need this
import axios from "axios"; // You might need to install this: npm install axios
import { uploadImageBuffer, analyzeImageUrl } from "../utils/imageUpload";
import { upload } from "../config/multer"; // Import multer config

// GET /api/products
export const getProducts = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 24;
    const { category, sort, q, minPrice, maxPrice } = req.query;

    let query: any = { is_published: true };

    // Filters
    if (category) query.category = category;
    if (q) query.$text = { $search: String(q) };
    if (minPrice || maxPrice) {
      query.price_cents = {};
      if (minPrice) query.price_cents.$gte = Number(minPrice);
      if (maxPrice) query.price_cents.$lte = Number(maxPrice);
    }

    // Sort
    let sortOption: any = { createdAt: -1 }; // Default: Newest
    if (sort === "price_asc") sortOption = { price_cents: 1 };
    if (sort === "price_desc") sortOption = { price_cents: -1 };

    // Execute
    const products = await Product.find(query)
      .sort(sortOption)
      .limit(limit)
      .skip((page - 1) * limit)
      .select(
        "name slug price_cents price_before_cents images category offer_tag"
      );

    const total = await Product.countDocuments(query);

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

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      slug,
      brand,
      category,
      price_cents,
      description,
      imageUrl,
      variants,
    } = req.body;

    let finalImageUrl: string = "";
    let colorData: { hex: string; r: number; g: number; b: number } = {
      hex: "#000000",
      r: 0,
      g: 0,
      b: 0,
    };
    console.log("Received Body:", req.body);
    console.log("Received File:", req.file);
    // 1. Handle Image Source (File Upload OR Link Input)
    if (req.file) {
      // <-- This check determines if the file made it
      try {
        // If it successfully hits this block, it means Multer worked.
        const result = await uploadImageBuffer(req.file.buffer);
        finalImageUrl = result.url;
        colorData = result.colorData;
      } catch (err) {
        console.error("Cloudinary Upload/Color failed:", err);
        return res
          .status(500)
          .json({ message: "Image upload failed. Check Cloudinary keys." });
      }
    } else if (imageUrl) {
      try {
        const result = await analyzeImageUrl(imageUrl);
        finalImageUrl = result.url;
        colorData = result.colorData;
      } catch (err) {
        console.error("URL Analysis Failed:", err);
        return res
          .status(400)
          .json({ message: "Image URL is invalid or inaccessible." });
      }
    } else {
      return res
        .status(400)
        .json({ message: "No image file or URL provided." });
    }

    // 2. Create Product
    const newProduct = new Product({
      name,
      slug,
      brand,
      category,
      description,
      price_cents,
      images: [
        {
          url: finalImageUrl,
          dominant_color: colorData.hex,
          r: colorData.r,
          g: colorData.g,
          b: colorData.b,
        },
      ],
      variants: variants ? JSON.parse(variants) : [],
      is_published: true,
      tags: [category, brand, "New Arrival"],
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error: any) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({
          message: "Product slug already exists. Please try a different name.",
        });
    }
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to create product due to server error." });
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
