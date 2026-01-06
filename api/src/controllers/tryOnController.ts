import { Request, Response } from 'express';
import { generateVirtualTryOn } from '../utils/tryOnAI';

/**
 * Handles the virtual try-on preview generation logic.
 * This is an AI-driven implementation.
 */
export const generateTryOnPreview = async (req: Request, res: Response) => {
    try {
        const { userImage, productImage, productType } = req.body;

        // 1. Validation
        if (!userImage || !productImage || !productType) {
            return res.status(400).json({
                message: 'Missing required fields: userImage, productImage, and productType are required.'
            });
        }

        const validTypes = ['bangle', 'ring', 'necklace'];
        if (!validTypes.includes(productType.toLowerCase())) {
            return res.status(400).json({
                message: `Invalid productType. Must be one of: ${validTypes.join(', ')}`
            });
        }

        // 2. AI Generation Logic (Multimodal)
        console.log(`Generating ${productType} try-on for product: ${productImage}`);

        const generatedImageUrl = await generateVirtualTryOn(
            userImage,
            productImage,
            productType
        );

        return res.status(200).json({
            success: true,
            generatedImageUrl,
            message: 'Preview generated successfully'
        });

    } catch (error: any) {
        console.error('Try-On Preview Error:', error);
        return res.status(500).json({
            message: 'Failed to generate try-on preview.',
            error: error.message || 'Unknown error'
        });
    }
};
