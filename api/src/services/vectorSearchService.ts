import { Product, IProduct } from '../models/Product';
import mongoose from 'mongoose';

interface VectorSearchOptions {
    limit?: number;
    category?: string;
    gender?: string;
}

export interface VectorSearchResult extends IProduct {
    searchScore: number;
}

/**
 * Searches for products similar to the query embedding using MongoDB Vector Search.
 * 
 * @param queryEmbedding - The vector embedding of the query image/text.
 * @param options - Optional filters (category, gender) and limit.
 * @returns Array of products with searchScore, sorted by similarity.
 */
export const searchProductsByVector = async (
    queryEmbedding: number[],
    options: VectorSearchOptions = {}
): Promise<VectorSearchResult[]> => {
    try {
        if (!queryEmbedding || queryEmbedding.length === 0) {
            console.warn("[VECTOR SEARCH] Empty query embedding provided. Skipping search.");
            return [];
        }

        const limit = options.limit || 20;

        // 1. $vectorSearch Stage
        // Note: 'numCandidates' is required and should be >= limit.
        const vectorSearchStage = {
            $vectorSearch: {
                index: "image_embedding_vector_index",
                path: "imageEmbedding",
                queryVector: queryEmbedding,
                numCandidates: Math.max(100, limit * 5), // Ensure enough candidates
                limit: limit
            }
        };

        const pipeline: any[] = [vectorSearchStage];

        // 2. $match Stage (Post-filter)
        // We filter AFTER vector search because $vectorSearch must be the first stage.
        // Ideally, pre-filtering with 'filter' option in $vectorSearch is better for performance if index supports it,
        // but standard $match after is simpler for Phase 4 as per instructions to "Apply filters AFTER vector search".
        const matchStage: any = {
            isPublished: true
        };

        if (options.category) {
            matchStage.category = new RegExp(`^${options.category}$`, 'i');
        }

        if (options.gender) {
            matchStage.gender = new RegExp(`^${options.gender}$`, 'i');
        }

        pipeline.push({ $match: matchStage });

        // 3. $project Stage (Format output)
        pipeline.push({
            $project: {
                _id: 1,
                name: 1,
                slug: 1,
                price: 1,
                price_cents: 1,
                images: 1,
                category: 1,
                gender: 1,
                brand: 1,
                dominantColor: 1,
                searchScore: { $meta: "vectorSearchScore" } // Include similarity score
            }
        });

        // Execute Aggregation
        const results = await Product.aggregate(pipeline);

        return results as VectorSearchResult[];

    } catch (error) {
        console.error("[VECTOR SEARCH] Error executing vector search:", error);
        // Fail gracefully as per instructions
        return [];
    }
};
