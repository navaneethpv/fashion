import { Request, Response } from 'express';
import { Product, IProduct } from '../models/Product';
import { generateAIOutfits } from '../utils/aiOutfitGenerator';

// 🛑 NEW: POST /api/ai/outfit
export const generateOutfit = async (req: Request, res: Response) => {
  try {
    // ⚠️ FIX: Ensure userPreferences is destructured and passed correctly ⚠️
    const { productId, userPreferences } = req.body; 

    // 1. Fetch Product Data (same as before)
    const baseProduct = await Product.findById(productId);
    if (!baseProduct) {
        return res.status(404).json({ message: 'Base product not found in catalog.' });
    }

    // Narrow baseProduct to IProduct type and ensure TypeScript understands tags is present
    const product = baseProduct as IProduct;
    const tags = Array.isArray(product.tags) ? product.tags : [];

    const attributes = {
      fit: tags.includes('oversized') ? 'oversized' : 'regular',
      pattern: tags.includes('printed') ? 'printed' : 'solid',
      fabric: tags.find(t => t.toLowerCase().includes('cotton')) ? 'cotton' : 'blend',
      occasion: tags.includes('party') ? 'party' : 'casual',
    };

    const base: any = {
      type: product.category as string,
      color: product.images[0]?.dominant_color || 'unknown',
      colorHex: product.images[0]?.dominant_color || '#000000',
      ...attributes,
    };

    // 2. Format Input Data for Gemini
    const inputData = {
      baseItem: {
        id: product._id.toString(),
        category: product.category as string,
        ...base,
        priceRange: (product.price_cents > 30000) ? 'high' : 'mid',
        season: 'summer'
      },
      // 🛑 USE PASSED-IN PREFERENCES 🛑
      userPreferences: userPreferences || { gender: 'unisex', styleVibe: 'street', avoidColors: [] }
      // 🛑 END USE PASSED-IN PREFERENCES 🛑
    };
    
    // 3. Call Gemini (same as before)
    const outfitResult = await generateAIOutfits(inputData);
    
    // 4. Return Result (same as before)
    res.json(outfitResult);

  } catch (error) {
    console.error('API Error during outfit generation:', error);
    res.status(500).json({ message: 'Failed to communicate with AI stylist.' });
  }
};