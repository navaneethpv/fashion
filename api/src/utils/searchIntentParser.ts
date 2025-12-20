// Flipkart-style intent-based search using structured filters
// Parses natural language search into structured query parameters

interface SearchIntent {
    category: string | null;
    gender: string | null;
    color: string | null;
    remainingText: string;
}

// Gender keyword mappings
const GENDER_KEYWORDS: Record<string, string> = {
    'men': 'Men',
    'man': 'Men',
    'male': 'Men',
    'mens': 'Men',
    'gents': 'Men',
    'gentleman': 'Men',

    'women': 'Women',
    'woman': 'Women',
    'female': 'Women',
    'womens': 'Women',
    'ladies': 'Women',
    'lady': 'Women',

    'kids': 'Kids',
    'kid': 'Kids',
    'children': 'Kids',
    'child': 'Kids',
    'boys': 'Kids',
    'boy': 'Kids',
    'girls': 'Kids',
    'girl': 'Kids'
};

// Common color keywords
const COLOR_KEYWORDS = [
    'red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'grey',
    'pink', 'purple', 'orange', 'brown', 'navy', 'maroon', 'olive'
];

/**
 * Parse search query into structured intent
 * Example: "top for women" → { category: "Tops", gender: "Women", color: null }
 */
export function parseSearchIntent(query: string): SearchIntent {
    if (!query || typeof query !== 'string') {
        return { category: null, gender: null, color: null, remainingText: '' };
    }

    let text = query.toLowerCase().trim();
    let gender: string | null = null;
    let color: string | null = null;

    console.log(`[SEARCH INTENT] Parsing: "${query}"`);

    // 1. Extract gender
    for (const [keyword, genderValue] of Object.entries(GENDER_KEYWORDS)) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        if (regex.test(text)) {
            gender = genderValue;
            text = text.replace(regex, '').trim();
            console.log(`[SEARCH INTENT] Detected gender: "${genderValue}" from "${keyword}"`);
            break;
        }
    }

    // 2. Extract color
    for (const colorKeyword of COLOR_KEYWORDS) {
        const regex = new RegExp(`\\b${colorKeyword}\\b`, 'gi');
        if (regex.test(text)) {
            color = colorKeyword;
            text = text.replace(regex, '').trim();
            console.log(`[SEARCH INTENT] Detected color: "${color}"`);
            break;
        }
    }

    // 3. Clean up common filler words
    text = text
        .replace(/\b(for|with|in|the|a|an)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

    console.log(`[SEARCH INTENT] After extraction, remaining: "${text}"`);

    // 4. Try to resolve category from remaining text
    // Import categoryNormalizer to reuse the comprehensive alias logic
    let category: string | null = null;
    if (text) {
        // The categoryNormalizer will handle all variations: shirt/shirts/tshirt/etc
        const { normalizeCategoryName } = require('./categoryNormalizer');
        category = normalizeCategoryName(text);
        console.log(`[SEARCH INTENT] Resolved category: "${text}" → "${category}"`);
    }

    return {
        category,
        gender,
        color,
        remainingText: text
    };
}

/**
 * Build MongoDB query from search intent
 */
export function buildQueryFromIntent(intent: SearchIntent): any {
    const query: any = { isPublished: { $ne: false } };

    if (intent.category) {
        query.category = { $regex: new RegExp(`^${intent.category}$`, 'i') };
    }

    if (intent.gender) {
        query.gender = intent.gender;
    }

    if (intent.color) {
        // Search in dominant color or variants
        query.$or = [
            { 'dominantColor.name': { $regex: new RegExp(intent.color, 'i') } },
            { 'variants.color': { $regex: new RegExp(intent.color, 'i') } }
        ];
    }

    console.log(`[SEARCH INTENT] Built query:`, JSON.stringify(query, null, 2));

    return query;
}
