import { Request, Response } from 'express';
import getColors from 'get-image-colors';
import { Product } from '../models/Product';
import { calculateColorDistance, distanceToSimilarity } from '../utils/colorMath';

export const searchByImageColor = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // 1. Extract Dominant Color from Uploaded Image
    // get-image-colors works with buffers if type is specified
    const colors = await getColors(req.file.buffer, 'image/jpeg'); 
    const dominant = colors[0]; // The most prominent color
    
    const queryColor = {
      hex: dominant.hex(),
      r: dominant.rgb()[0],
      g: dominant.rgb()[1],
      b: dominant.rgb()[2]
    };

    // 2. Fetch Candidates
    // Optimization: Only fetch fields needed for math. Limit to 2000 recent items.
    const candidates = await Product.find({ is_published: true })
      .select('name slug price_cents images category')
      .limit(2000) 
      .lean();

    // 3. The Algorithm: Vector Ranking
    const results = candidates.map((product: any) => {
      const productImage = product.images[0];
      
      // If product has no color data (seeds might fail rare cases), skip
      if (!productImage || productImage.r === undefined) return null;

      const productRGB = { 
        r: productImage.r, 
        g: productImage.g, 
        b: productImage.b 
      };

      const distance = calculateColorDistance(queryColor, productRGB);
      const similarity = distanceToSimilarity(distance);

      return {
        ...product,
        similarity,
        distance // helpful for debugging
      };
    })
    .filter(Boolean) // Remove nulls
    .sort((a: any, b: any) => b.similarity - a.similarity) // Descending match
    .slice(0, 48); // Top 48 results

    res.json({
      queryColor,
      results
    });

  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Image analysis failed', error: error.message });
  }
};