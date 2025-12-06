interface RGB {
  r: number;
  g: number;
  b: number;
}

// Euclidean Distance in 3D Color Space
export const calculateColorDistance = (color1: RGB, color2: RGB): number => {
  return Math.sqrt(
    Math.pow(color2.r - color1.r, 2) +
    Math.pow(color2.g - color1.g, 2) +
    Math.pow(color2.b - color1.b, 2)
  );
};

// Convert Distance to Similarity Score (0 to 100%)
// Max distance in RGB space is sqrt(255^2 * 3) ≈ 441
export const distanceToSimilarity = (distance: number): number => {
  const maxDistance = 441.67; 
  const similarity = 1 - (distance / maxDistance);
  return Math.max(0, Math.min(1, similarity)); // Clamp between 0 and 1
};