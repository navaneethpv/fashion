// Normalize AI category output to match database taxonomy
// This file maps AI-detected category variations to actual database category names
// Comprehensive coverage for ALL 145+ database categories

export const VALID_CATEGORIES = [
    // Clothing - Upper Body
    'Tshirts', 'Shirts', 'Tops', 'Sweatshirts', 'Sweaters', 'Jackets',
    'Blazers', 'Nehru Jackets', 'Rain Jacket', 'Shrug',
    'Camisoles', 'Tunics', 'Lounge Tshirts',

    // Clothing - Indian Wear
    'Kurtis', 'Kurtas', 'Kurta Sets', 'Sarees', 'Lehenga Choli',
    'Salwar', 'Salwar and Dupatta', 'Dupatta', 'Churidar', 'Patiala',

    // Clothing - Bottoms
    'Jeans', 'Trousers', 'Shorts', 'Skirts', 'Leggings', 'Jeggings',
    'Capris', 'Track Pants', 'Lounge Pants', 'Lounge Shorts', 'Rain Trousers',
    'Tights',

    // Dresses & Sets
    'Dresses', 'Jumpsuit', 'Rompers', 'Clothing Set',

    // Outerwear & Formal
    'Waistcoat',

    // Innerwear & Sleepwear
    'Night suits', 'Nightdress', 'Robe', 'Bath Robe', 'Baby Dolls',
    'Bra', 'Shapewear', 'Stockings', 'Boxers', 'Briefs', 'Trunk', 'Innerwear Vests',

    // Footwear
    'Heels', 'Flats', 'Sandals', 'Sports Shoes', 'Casual Shoes', 'Formal Shoes',
    'Flip Flops', 'Booties', 'Sports Sandals',

    // Bags & Luggage
    'Handbags', 'Backpacks', 'Rucksacks', 'Laptop Bag', 'Messenger Bag',
    'Clutches', 'Duffel Bag', 'Trolley Bag', 'Waist Pouch', 'Mobile Pouch',

    // Accessories - Fashion
    'Wallets', 'Watches', 'Sunglasses', 'Caps', 'Hat', 'Belts', 'Ties',
    'Ties and Cufflinks', 'Cufflinks', 'Suspenders', 'Gloves', 'Mufflers',
    'Scarves', 'Stoles', 'Headband', 'Hair Accessory', 'Socks', 'Umbrellas',
    'Wristbands', 'Water Bottle', 'Travel Accessory',

    // Jewellery
    'Jewellery Set', 'Necklace and Chains', 'Earrings', 'Bracelet', 'Bangle',
    'Ring', 'Pendant',

    // Sports
    'Swimwear', 'Tracksuits', 'Basketballs', 'Footballs',

    // Beauty & Personal Care
    'Perfume and Body Mist', 'Deodorant', 'Makeup Remover', 'Compact',
    'Foundation and Primer', 'Concealer', 'Highlighter and Blush', 'Eyeshadow',
    'Kajal and Eyeliner', 'Mascara', 'Lipstick', 'Lip Gloss', 'Lip Liner',
    'Lip Plumper', 'Lip Care', 'Nail Polish', 'Nail Essentials',
    'Face Wash and Cleanser', 'Face Moisturisers', 'Face Serum and Gel',
    'Face Scrub and Exfoliator', 'Mask and Peel', 'Eye Cream', 'Sunscreen',
    'Toner', 'Body Lotion', 'Body Wash and Scrub', 'Hair Colour',
    'Mens Grooming Kit',

    // Gifts & Sets
    'Fragrance Gift Set', 'Accessory Gift Set', 'Free Gifts',

    // Home & Tech
    'Cushion Covers', 'Ipad', 'Tablet Sleeve',

    // Shoe Accessories
    'Shoe Accessories', 'Shoe Laces',

    // Other
    'Beauty Accessory', 'Key chain'
];

// Comprehensive alias mapping: AI variations → Database category
const CATEGORY_ALIASES: Record<string, string> = {
    // T-Shirts variations → Tshirts
    't-shirt': 'Tshirts', 't-shirts': 'Tshirts', 'tshirt': 'Tshirts',
    'tshirts': 'Tshirts', 'tee': 'Tshirts', 'tees': 'Tshirts',
    't shirt': 'Tshirts', 't shirts': 'Tshirts',

    // Shirts variations
    'shirt': 'Shirts', 'shirts': 'Shirts',

    // Jeans/Denim variations
    'jean': 'Jeans', 'jeans': 'Jeans', 'denim': 'Jeans', 'denim jeans': 'Jeans',

    // Dresses variations
    'dress': 'Dresses', 'dresses': 'Dresses', 'gown': 'Dresses', 'frock': 'Dresses',

    // Jackets/Coats variations
    'jacket': 'Jackets', 'jackets': 'Jackets', 'coat': 'Jackets',
    'blazer': 'Blazers', 'blazers': 'Blazers',

    // Kurtis/Kurtas variations
    'kurti': 'Kurtis', 'kurtis': 'Kurtis', 'kurta': 'Kurtas', 'kurtas': 'Kurtas',

    // Sarees variations
    'saree': 'Sarees', 'sarees': 'Sarees', 'sari': 'Sarees', 'saris': 'Sarees',

    // Tops variations
    'top': 'Tops', 'tops': 'Tops', 'blouse': 'Tops',

    // Bottoms
    'short': 'Shorts', 'shorts': 'Shorts',
    'trouser': 'Trousers', 'trousers': 'Trousers', 'pant': 'Trousers', 'pants': 'Trousers',
    'skirt': 'Skirts', 'skirts': 'Skirts',
    'legging': 'Leggings', 'leggings': 'Leggings',

    // Sweaters/Sweatshirts
    'sweater': 'Sweaters', 'sweaters': 'Sweaters',
    'sweatshirt': 'Sweatshirts', 'sweatshirts': 'Sweatshirts',
    'hoodie': 'Sweatshirts', 'hoodies': 'Sweatshirts',

    // Footwear
    'heel': 'Heels', 'heels': 'Heels', 'high heel': 'Heels', 'high heels': 'Heels',
    'flat': 'Flats', 'flats': 'Flats',
    'sandal': 'Sandals', 'sandals': 'Sandals',
    'sneaker': 'Sports Shoes', 'sneakers': 'Sports Shoes',
    'sports shoe': 'Sports Shoes', 'sports shoes': 'Sports Shoes',
    'running shoes': 'Sports Shoes', 'running shoe': 'Sports Shoes',
    'casual shoe': 'Casual Shoes', 'casual shoes': 'Casual Shoes',
    'formal shoe': 'Formal Shoes', 'formal shoes': 'Formal Shoes',
    'shoe': 'Casual Shoes', 'shoes': 'Casual Shoes',
    'flip flop': 'Flip Flops', 'flipflops': 'Flip Flops', 'flipflop': 'Flip Flops',
    'slipper': 'Flip Flops', 'slippers': 'Flip Flops',

    // Bags & Luggage
    'handbag': 'Handbags', 'handbags': 'Handbags', 'bag': 'Handbags',
    'bags': 'Handbags', 'purse': 'Handbags', 'purses': 'Handbags',
    'backpack': 'Backpacks', 'backpacks': 'Backpacks', 'rucksack': 'Rucksacks',
    'laptop bag': 'Laptop Bag', 'laptopbag': 'Laptop Bag',
    'messenger bag': 'Messenger Bag',
    'clutch': 'Clutches', 'clutches': 'Clutches',
    'duffel': 'Duffel Bag', 'duffelbag': 'Duffel Bag',
    'suitcase': 'Trolley Bag', 'luggage': 'Trolley Bag',

    // Accessories
    'wallet': 'Wallets', 'wallets': 'Wallets',
    'watch': 'Watches', 'watches': 'Watches',
    'sunglass': 'Sunglasses', 'sunglasses': 'Sunglasses', 'shades': 'Sunglasses',
    'cap': 'Caps', 'caps': 'Caps', 'hat': 'Hat', 'hats': 'Hat',
    'belt': 'Belts', 'belts': 'Belts',
    'tie': 'Ties', 'ties': 'Ties',
    'scarf': 'Scarves', 'scarves': 'Scarves',
    'muffler': 'Mufflers', 'mufflers': 'Mufflers',
    'sock': 'Socks', 'socks': 'Socks',
    'umbrella': 'Umbrellas', 'umbrellas': 'Umbrellas',

    // Jewellery
    'necklace': 'Necklace and Chains', 'necklaces': 'Necklace and Chains',
    'chain': 'Necklace and Chains', 'chains': 'Necklace and Chains',
    'earring': 'Earrings', 'earrings': 'Earrings',
    'bracelet': 'Bracelet', 'bracelets': 'Bracelet',
    'bangle': 'Bangle', 'bangles': 'Bangle',
    'ring': 'Ring', 'rings': 'Ring',
    'pendant': 'Pendant', 'pendants': 'Pendant',
    'jewelry': 'Jewellery Set', 'jewellery': 'Jewellery Set',

    // Beauty & Cosmetics
    'perfume': 'Perfume and Body Mist', 'fragrance': 'Perfume and Body Mist',
    'body mist': 'Perfume and Body Mist', 'deodorant': 'Deodorant', 'deo': 'Deodorant',
    'lipstick': 'Lipstick', 'lipsticks': 'Lipstick',
    'nail polish': 'Nail Polish', 'nailpolish': 'Nail Polish',
    'foundation': 'Foundation and Primer',
    'mascara': 'Mascara',
    'eyeliner': 'Kajal and Eyeliner', 'kajal': 'Kajal and Eyeliner',
    'eyeshadow': 'Eyeshadow',
    'facewash': 'Face Wash and Cleanser', 'face wash': 'Face Wash and Cleanser',
    'moisturiser': 'Face Moisturisers', 'moisturizer': 'Face Moisturisers',
    'sunscreen': 'Sunscreen', 'sunblock': 'Sunscreen',
    'body lotion': 'Body Lotion', 'lotion': 'Body Lotion',

    // Sleepwear
    'nightwear': 'Night suits', 'nightsuit': 'Night suits', 'pyjama': 'Night suits',
    'nightdress': 'Nightdress', 'nightgown': 'Nightdress',
    'robe': 'Robe', 'bathrobe': 'Bath Robe',

    // Sports
    'swimsuit': 'Swimwear', 'tracksuit': 'Tracksuits',
    'basketball': 'Basketballs', 'football': 'Footballs', 'soccer ball': 'Footballs'
};

/**
 * Normalizes AI-detected category to match database categories
 * Handles variations in:
 * - Singular/plural (Shirt → Shirts)
 * - Hyphens/spaces (T-Shirt → Tshirts)
 * - Case differences (KURTI → Kurtis)
 * - Synonyms (Tee → Tshirts, Purse → Handbags)
 */
export function normalizeCategoryName(aiCategory: string): string {
    if (!aiCategory) {
        console.warn('[CATEGORY NORMALIZER] Empty category, defaulting to Tops');
        return 'Tops';
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

    // Flipkart-style prefix intent matching for search
    // Try prefix matching in aliases
    for (const [alias, validCategory] of Object.entries(CATEGORY_ALIASES)) {
        if (alias.startsWith(normalized) || normalized.startsWith(alias)) {
            console.log(`[CATEGORY NORMALIZER] "${aiCategory}" → "${validCategory}" (prefix match alias: "${alias}")`);
            return validCategory;
        }
    }

    // Try prefix matching in valid categories
    for (const validCat of VALID_CATEGORIES) {
        const validCatLower = validCat.toLowerCase();
        if (validCatLower.startsWith(normalized) || normalized.startsWith(validCatLower)) {
            console.log(`[CATEGORY NORMALIZER] "${aiCategory}" → "${validCat}" (prefix match)`);
            return validCat;
        }
    }

    // Default fallback
    console.warn(`[CATEGORY NORMALIZER] Unknown category: "${aiCategory}", defaulting to Tops`);
    return 'Tops';
}
