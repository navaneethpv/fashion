type Suggestion = {
    type: "brand" | "category" | "product"; // reusing existing type pattern if possible, or new "intent" type
    text: string;
    subText: string;
    isAi?: boolean;
};

// Mock AI Logic to generate intent-based suggestions
export async function fetchAiSuggestions(query: string): Promise<Suggestion[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const q = query.toLowerCase();
    const suggestions: Suggestion[] = [];

    // Simple heuristic generation based on keywords
    // Real implementation would call an LLM API

    if (q.includes("red")) {
        suggestions.push({ type: "product", text: "Red dresses for women", subText: "Trending in Party Wear", isAi: true });
        suggestions.push({ type: "product", text: "Red t-shirts under ₹1000", subText: "Budget Friendly", isAi: true });
    }
    else if (q.includes("shoe") || q.includes("footwear")) {
        suggestions.push({ type: "product", text: "Running shoes for men", subText: "Best Sellers", isAi: true });
        suggestions.push({ type: "product", text: "Casual sneakers white", subText: "New Arrivals", isAi: true });
    }
    else if (q.includes("party")) {
        suggestions.push({ type: "product", text: "Party wear sarees", subText: "Ethnic Wear", isAi: true });
        suggestions.push({ type: "product", text: "Party dresses black", subText: "Western Wear", isAi: true });
    }
    else if (q.includes("summer")) {
        suggestions.push({ type: "product", text: "Summer cotton kurti", subText: "Comfort Wear", isAi: true });
    }

    // Generic fallback if no specific keywords matched but query is long enough
    if (suggestions.length === 0 && q.length > 3) {
        suggestions.push({ type: "product", text: `${query} for men`, subText: "Popular in Men", isAi: true });
        suggestions.push({ type: "product", text: `${query} for women`, subText: "Popular in Women", isAi: true });
    }

    return suggestions;
}
