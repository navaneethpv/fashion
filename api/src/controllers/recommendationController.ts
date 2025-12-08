import { Request, Response } from 'express';
import { Product } from '../models/Product';
import mongoose from 'mongoose';

// Map an item category to a complementary category (e.g., Top -> Bottom)
const COMPLEMENTARY_CATEGORY_MAP: { [key: string]: string[] } = {
  'T-Shirts': ['Jeans', 'Joggers', 'Pants'],
  'Jackets': ['T-Shirts', 'Shirts'],
  'Dresses': ['Accessories'],
  'Jeans': ['T-Shirts', 'Hoodies', 'Jackets'],
  'Joggers': ['T-Shirts', 'Hoodies', 'Jackets'],
  'Shirts': ['Jeans', 'Joggers'],
  'Sneakers': ['Socks', 'Accessories'],
  'Accessories': ['T-Shirts', 'Hoodies', 'Jackets', 'Dresses'],
};

// GET /api/ai/recommendations?productId=:id
export const getOutfitRecommendations = async (req: Request, res: Response) => {
  try {
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required for recommendations.' });
    }

    // 1. Fetch the main product
    const currentProduct = await Product.findById(productId);

    if (!currentProduct) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // 2. Define Suggestion Criteria
    const currentCategory = currentProduct.category as string;
    const styleTags = currentProduct.tags;
    const excludeId = currentProduct._id;

    // Get complementary categories or fall back to main category suggestions
    const targetCategories = COMPLEMENTARY_CATEGORY_MAP[currentCategory] || [currentCategory];

    // Build the query
    const recommendationQuery: any = {
      _id: { $ne: excludeId }, // Exclude the current product
      is_published: true,
      $or: [
        // Rule 1: Match Complementary Category AND Share Style Tags (High Priority)
        { 
          category: { $in: targetCategories },
          tags: { $in: styleTags.slice(0, 3) } // Match top 3 style tags
        },
        // Rule 2: Fallback to same Category AND Share Style Tags (e.g., another T-Shirt)
        { 
          category: currentCategory, 
          tags: { $in: styleTags.slice(0, 3) }
        },
        // Rule 3: Match Complementary Category only (General suggestions)
        {
          category: { $in: targetCategories }
        }
      ]
    };
    
    // 3. Execute Query
    // Use aggregation to allow for random selection after filtering
    const recommendations = await Product.aggregate([
      { $match: recommendationQuery },
      { $sample: { size: 4 } }, // Get a random sample of 4
      { $project: {
          name: 1, slug: 1, price_cents: 1, brand: 1, category: 1, tags: 1,
          images: { $slice: ["$images", 1] }
      }}
    ]);


    // 4. Return Results
    res.json({
      baseProduct: { slug: currentProduct.slug, tags: styleTags, category: currentCategory },
      suggestions: recommendations
    });

  } catch (error) {
    console.error('Recommendation API Error:', error);
    res.status(500).json({ message: 'Failed to generate recommendations' });
  }
};