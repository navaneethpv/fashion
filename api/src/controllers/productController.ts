import { Request, Response } from 'express';
import { Product } from '../models/Product';
import getColors from 'get-image-colors'; // We need this
import axios from 'axios'; // You might need to install this: npm install axios

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
    if (sort === 'price_asc') sortOption = { price_cents: 1 };
    if (sort === 'price_desc') sortOption = { price_cents: -1 };

    // Execute
    const products = await Product.find(query)
      .sort(sortOption)
      .limit(limit)
      .skip((page - 1) * limit)
      .select('name slug price_cents price_before_cents images category offer_tag');

    const total = await Product.countDocuments(query);

    res.json({
      data: products,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// GET /api/products/:slug
export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, slug, brand, category, price_cents, description, imageUrl, variants } = req.body;

    // 1. AI Color Extraction
    // We fetch the image buffer from the URL to analyze it
    let colorData = { hex: '#000000', r: 0, g: 0, b: 0 };
    
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      const colors = await getColors(buffer, 'image/jpeg');
      const dominant = colors[0];
      
      colorData = {
        hex: dominant.hex(),
        r: dominant.rgb()[0],
        g: dominant.rgb()[1],
        b: dominant.rgb()[2]
      };
      console.log(`🎨 AI extracted color: ${colorData.hex}`);
    } catch (err) {
      console.error("Failed to extract color from URL, using default black.");
    }

    // 2. Create Product
    const newProduct = new Product({
      name,
      slug,
      brand,
      category,
      description,
      price_cents,
      // We store the image with the AI-calculated data
      images: [{
        url: imageUrl,
        dominant_color: colorData.hex,
        r: colorData.r,
        g: colorData.g,
        b: colorData.b
      }],
      variants: variants || [],
      is_published: true,
      tags: [category, brand, 'New Arrival']
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create product', error: error.message });
  }
};