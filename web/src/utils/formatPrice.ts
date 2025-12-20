// Display currency updated to Indian Rupees (₹)

/**
 * Formats a price number to Indian Rupee currency
 * @param price - Price in rupees
 * @returns Formatted price string with ₹ symbol
 */
export const formatPrice = (price: number): string => {
    return `₹${price.toFixed(2)}`;
};

/**
 * Formats a price number to Indian Rupee currency without decimals
 * @param price - Price in rupees
 * @returns Formatted price string with ₹ symbol
 */
export const formatPriceInt = (price: number): string => {
    return `₹${Math.round(price)}`;
};
