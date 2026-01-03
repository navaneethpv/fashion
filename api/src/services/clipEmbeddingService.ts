
import { AutoProcessor, CLIPVisionModelWithProjection, CLIPTextModelWithProjection, AutoTokenizer, RawImage } from '@xenova/transformers';
import axios from 'axios';

// Singleton instances
let processor: any = null;
let visionModel: any = null;
let textModel: any = null;
let tokenizer: any = null;

const MODEL_NAME = 'Xenova/clip-vit-base-patch32'; // Output: 512 dimensions

/**
 * Initializes the CLIP components if not already loaded.
 */
async function loadModels() {
    if (!processor) {
        console.log(`[CLIP] Loading model components: ${MODEL_NAME}...`);
        try {
            // Load all necessary components
            // We use separate models for vision and text to be explicit and efficient
            [processor, visionModel, textModel, tokenizer] = await Promise.all([
                AutoProcessor.from_pretrained(MODEL_NAME),
                CLIPVisionModelWithProjection.from_pretrained(MODEL_NAME),
                CLIPTextModelWithProjection.from_pretrained(MODEL_NAME),
                AutoTokenizer.from_pretrained(MODEL_NAME)
            ]);
            console.log(`[CLIP] Models loaded successfully.`);
        } catch (error) {
            console.error(`[CLIP] Failed to load models:`, error);
            return false;
        }
    }
    return true;
}

/**
 * Generates a 768-dimensional embedding for an image.
 */
export async function generateClipEmbedding(input: Buffer | string): Promise<number[] | undefined> {
    try {
        const loaded = await loadModels();
        if (!loaded) return undefined;

        // Robust Image Loading
        let rawImage;
        try {
            if (Buffer.isBuffer(input)) {
                // Convert Buffer to Blob for RawImage
                const blob = new Blob([input as any]);
                rawImage = await RawImage.fromBlob(blob);
            } else if (typeof input === 'string') {
                rawImage = await RawImage.read(input);
            } else {
                return undefined;
            }
        } catch (err) {
            console.warn(`[CLIP] Failed to process image input:`, err);
            return undefined;
        }

        // Process image
        const image_inputs = await processor(rawImage);

        // Generate Embeddings
        const { image_embeds } = await visionModel(image_inputs);

        // Return 768d vector (convert Tensor to array)
        if (image_embeds && image_embeds.data) {
            return Array.from(image_embeds.data);
        }

        return undefined;

    } catch (error: any) {
        console.warn(`[CLIP] Image embedding failed: ${error.message}`);
        return undefined;
    }
}

/**
 * Generates a 768-dimensional embedding for text.
 */
export async function generateClipTextEmbedding(text: string): Promise<number[] | undefined> {
    try {
        const loaded = await loadModels();
        if (!loaded) return undefined;

        // Tokenize
        const text_inputs = tokenizer([text], { padding: true, truncation: true });

        // Generate Embeddings
        const { text_embeds } = await textModel(text_inputs);

        if (text_embeds && text_embeds.data) {
            return Array.from(text_embeds.data);
        }
        return undefined;

    } catch (error: any) {
        console.warn(`[CLIP] Text embedding failed: ${error.message}`);
        return undefined;
    }
}
