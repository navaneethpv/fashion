// Normalize AI category output to match database taxonomy
// This file maps AI-detected category variations to actual database category names

export const VALID_CATEGORIES = [
    'Tshirts',      // Note: DB uses 'Tshirts' not 'T-Shirts'
    'Shirts',
    'Jeans',
    'Dresses',
    'Jackets',
    'Kurtis',
    'Kurtas',
    'Sarees',
    'Tops',
    'Shorts',
    'Trousers',
    'Sweaters',
    'Sweatshirts',
    'Heels',
    'Flats',
    'Sandals',
    'Sports Shoes',
    'Casual Shoes',
    'Formal Shoes',
    'Handbags',
    'Backpacks',
    'Wallets',
    'Watches',
    'Sunglasses',
    'Caps'
];

// Comprehensive alias mapping: AI variations → Database category
const CATEGORY_ALIASES: Record<string, string> = {
    // T-Shirts variations → Tshirts
    't-shirt': 'Tshirts',
    't-shirts': 'Tshirts',
    'tshirt': 'Tshirts',
    'tshirts': 'Tshirts',
    'tee': 'Tshirts',
    'tees': 'Tshirts',
    't shirt': 'Tshirts',
    't shirts': 'Tshirts',

    // Shirts variations
    'shirt': 'Shirts',
    'shirts': 'Shirts',

    // Jeans variations
    'jean': 'Jeans',
    'jeans': 'Jeans',
    'denim': 'Jeans',
    'denim jeans': 'Jeans',

    // Dresses variations
    'dress': 'Dresses',
    'dresses': 'Dresses',
    'gown': 'Dresses',
    'frock': 'Dresses',

    // Jackets variations
    'jacket': 'Jackets',
    'jackets': 'Jackets',
    'coat': 'Jackets',
    'blazer': 'Blazers',
    'blazers': 'Blazers',

    // Kurtis/Kurtas variations
    'kurti': 'Kurtis',
    'kurtis': 'Kurtis',
    'kurta': 'Kurtas',
    'kurtas': 'Kurtas',

    // Sarees variations
    'saree': 'Sarees',
    'sarees': 'Sarees',
    'sari': 'Sarees',
    'saris': 'Sarees',

    // Tops variations
    'top': 'Tops',
    'tops': 'Tops',
    'blouse': 'Tops',

    // Bottoms
    'short': 'Shorts',
    'shorts': 'Shorts',
    'trouser': 'Trousers',
    'trousers': 'Trousers',
    'pant': 'Trousers',
    'pants': 'Trousers',

    // Sweaters/Sweatshirts
    'sweater': 'Sweaters',
    'sweaters': 'Sweaters',
    'sweatshirt': 'Sweatshirts',
    'sweatshirts': 'Sweatshirts',
    'hoodie': 'Sweatshirts',
    'hoodies': 'Sweatshirts',

    // Footwear
    'heel': 'Heels',
    'heels': 'Heels',
    'high heel': 'Heels',
    'flat': 'Flats',
    'flats': 'Flats',
    'sandal': 'Sandals',
    'sandals': 'Sandals',
    'sneaker': 'Sports Shoes',
    'sneakers': 'Sports Shoes',
    'sports shoe': 'Sports Shoes',
    'sports shoes': 'Sports Shoes',
    'running shoes': 'Sports Shoes',
    'casual shoe': 'Casual Shoes',
    'casual shoes': 'Casual Shoes',
    'formal shoe': 'Formal Shoes',
    'formal shoes': 'Formal Shoes',
    'shoe': 'Casual Shoes',
    'shoes': 'Casual Shoes',

    // Accessories
    'handbag': 'Handbags',
    'handbags': 'Handbags',
    'bag': 'Handbags',
    'bags': 'Handbags',
    'purse': 'Handbags',
    'backpack': 'Backpacks',
    'backpacks': 'Backpacks',
    'wallet': 'Wallets',
    'wallets': 'Wallets',
    'watch': 'Watches',
    'watches': 'Watches',
    'sunglass': 'Sunglasses',
    'sunglasses': 'Sunglasses',
    'cap': 'Caps',
    'caps': 'Caps',
    'hat': 'Caps'
};

/**
 * Normalizes AI-detected category to match database categories
 * Handles variations in:
 * - Singular/plural (Shirt → Shirts)
 * - Hyphens/spaces (T-Shirt → Tshirts)
 * - Case differences (KURTI → Kurtis)
 * - Synonyms (Tee → Tshirts)
 */
export function normalizeCategoryName(aiCategory: string): string {
    if (!aiCategory) {
        console.warn('[CATEGORY NORMALIZER] Empty category, defaulting to Tshirts');
        return 'Tshirts';
    }

    const normalized = aiCategory.toLowerCase().trim();

    // Try alias lookup first
    if (CATEGORY_ALIASES[normalized]) {
        const result = CATEGORY_ALIASES[normalized];
        console.log(`[CATEGORY NORMALIZER] "${aiCategory}" → "${result}" (via alias)`);
        return result;
    }

    // Try case-insensitive exact match
    const exactMatch = VALID_CATEGORIES.find(
        cat => cat.toLowerCase() === normalized
    );
    if (exactMatch) {
        console.log(`[CATEGORY NORMALIZER] "${aiCategory}" → "${exactMatch}" (exact match)`);
        return exactMatch;
    }

    // Default fallback
    console.warn(`[CATEGORY NORMALIZER] Unknown category: "${aiCategory}", defaulting to Tshirts`);
    return 'Tshirts';
}
