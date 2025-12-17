"use client";

import { useState } from "react";
import Link from "next/link";
import { useKeenSlider } from "keen-slider/react";
import { Sparkles, Loader2, Zap, ChevronDown, Sparkle } from "lucide-react";
import AddToCartButton from "./AddToCartButton";

interface OutfitItem {
  role: string;
  suggestedType: string;
  colorSuggestion: string;
  colorHexSuggestion: string;
  reason: string;
  product?: any; // 👉 contains DB product
}

interface OutfitResult {
  outfitTitle: string;
  outfitItems: OutfitItem[];
  overallStyleExplanation: string;
}

const STYLE_VIBES = [
  { value: "simple_elegant", label: "Simple & Elegant" },
  { value: "street_casual", label: "Street & Casual" },
  { value: "office_formal", label: "Office & Formal" },
  { value: "party_bold", label: "Party & Bold" },
];

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/300x200?text=No+Image";

// Helper to resolve image URL from various formats (string, array of strings, array of objects)
function resolveImageUrl(images: any): string {
  if (!images) return PLACEHOLDER_IMAGE;
  
  const base = process.env.NEXT_PUBLIC_API_BASE || 
               process.env.NEXT_PUBLIC_API_URL || 
               "http://localhost:4000";
  
  function prefixIfRelative(url?: string): string {
    if (!url) return PLACEHOLDER_IMAGE;
    if (/^https?:\/\//i.test(url)) return url;
    return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
  }
  
  // Handle string URL
  if (typeof images === "string") {
    return images.trim() ? prefixIfRelative(images) : PLACEHOLDER_IMAGE;
  }
  
  // Handle array
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (!first) return PLACEHOLDER_IMAGE;
    
    // Array of strings
    if (typeof first === "string") {
      return prefixIfRelative(first);
    }
    
    // Array of objects with url property
    if (typeof first === "object" && first.url) {
      return prefixIfRelative(first.url);
    }
  }
  
  return PLACEHOLDER_IMAGE;
}

interface OutfitGeneratorProps {
  productId: string;
  productGender?: string | null;
}

export default function OutfitGenerator({ productId, productGender }: OutfitGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OutfitResult | null>(null);
  const [styleVibe, setStyleVibe] = useState(STYLE_VIBES[0].value);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    slides: { perView: 1.3, spacing: 15 },
    breakpoints: {
      "(min-width: 640px)": { slides: { perView: 2.5, spacing: 20 } },
      "(min-width: 1024px)": { slides: { perView: 4, spacing: 25 } },
    },
  });

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);

    const normalizedGender: "male" | "female" | null = (() => {
      if (!productGender) return null;
      const g = productGender.toLowerCase().trim();
      if (/(men|man|male|boy)/i.test(g)) return "male";
      if (/(women|woman|female|girl|lady|ladies)/i.test(g)) return "female";
      return null;
    })();

    const userPreferences = {
      gender: normalizedGender,
      styleVibe,
      avoidColors: ["neon green", "bright yellow"],
      preferredBrightness: "medium",
      maxItems: 4,
    };

    try {
      const res = await fetch("http://localhost:4000/api/ai/outfit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, userPreferences }),
      });

      const data = await res.json();
      // ensure outfitItems is always an array to avoid runtime map errors
      if (!data || typeof data !== "object") {
        setResult(null);
      } else {
        data.outfitItems = data.outfitItems ?? [];
        setResult(data);
      }
      setTimeout(() => instanceRef.current?.update(), 50);
    } catch (e) {
      console.error(e);
      alert("AI failed to suggest an outfit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-16 relative">
      {/* Premium Container with Glassmorphism & Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-50/80 via-purple-50/60 to-pink-50/80 backdrop-blur-sm border border-violet-200/50 shadow-xl shadow-violet-100/50">
        {/* Subtle animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-purple-500/5 animate-pulse" />
        
        <div className="relative p-8 md:p-10">
          {/* Premium Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-violet-400/20 blur-xl rounded-full" />
                  <Sparkles className="relative w-7 h-7 text-violet-600" strokeWidth={2} />
                </div>
                <h3 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-violet-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                  AI Stylist – Outfit Generator
                </h3>
              </div>
              <p className="text-sm md:text-base text-gray-600 font-medium ml-10">
                Instantly style this product with matching fashion picks
              </p>
            </div>
            
            {/* Premium Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="group relative px-8 py-4 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white font-bold text-sm md:text-base rounded-2xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 overflow-hidden"
            >
              {/* Animated gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <span className="relative flex items-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Styling...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>{result ? "Regenerate Outfit" : "Generate Outfit"}</span>
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Style Vibe Control - Premium Styling */}
          <div className="mb-8">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-3 flex items-center gap-2">
              <Sparkle className="w-3.5 h-3.5 text-violet-500" />
              Choose Style Mood
            </label>
            <div className="relative max-w-md">
              <select
                value={styleVibe}
                onChange={(e) => setStyleVibe(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3.5 bg-white/90 backdrop-blur-sm border-2 border-violet-200 rounded-xl text-sm font-medium text-gray-800 appearance-none focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {STYLE_VIBES.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-violet-500 pointer-events-none" />
            </div>
          </div>

          {/* Loading State with Skeleton Cards */}
          {loading && (
            <div className="space-y-6 fade-in-animation">
              <div className="text-center py-6">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-violet-600" />
                <p className="text-gray-700 font-medium">Styling your outfit...</p>
                <p className="text-sm text-gray-500 mt-1">Our AI is curating the perfect match</p>
              </div>
              
              {/* Skeleton Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white/60 rounded-xl p-4 border border-violet-100 animate-pulse">
                    <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-3" />
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outfit Results Display */}
          {result && !loading && (
            <div className="space-y-6 fade-in-animation">
              <div className="flex items-center gap-3 flex-wrap">
                <h4 className="text-xl md:text-2xl font-bold text-gray-900">{result.outfitTitle}</h4>
                <div className="px-3 py-1 bg-gradient-to-r from-violet-100 to-purple-100 rounded-full">
                  <span className="text-xs font-bold text-violet-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI CURATED
                  </span>
                </div>
              </div>

              <div ref={sliderRef} className="keen-slider">
                {(result.outfitItems ?? []).length > 0 ? (
                  (result.outfitItems ?? []).map((item, idx) => (
                    <div 
                      key={idx} 
                      className="keen-slider__slide"
                      style={{ 
                        animation: `slideIn 0.6s ease-out ${idx * 0.1}s both`
                      }}
                    >
                      <div className="bg-white/90 backdrop-blur-sm border-2 border-violet-100 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:border-violet-300 transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                        {/* Role Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-violet-600 uppercase tracking-wider bg-violet-50 px-3 py-1 rounded-full">
                            {item.role}
                          </span>
                          {/* AI Pick Badge */}
                          <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full">
                            <Sparkle className="w-3 h-3 text-white" />
                            <span className="text-xs font-bold text-white">AI PICK</span>
                          </div>
                        </div>

                        {item.product ? (
                          <>
                            <Link href={`/products/${item.product.slug}`} className="block flex-1 group">
                              <div className="relative overflow-hidden rounded-xl mb-4 bg-gray-100">
                                <img
                                  src={resolveImageUrl(item.product.images)}
                                  alt={item.product.name}
                                  className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    if (target.src !== PLACEHOLDER_IMAGE) {
                                      target.src = PLACEHOLDER_IMAGE;
                                    }
                                  }}
                                />
                              </div>
                              <p className="font-bold text-gray-900 text-sm mb-1 line-clamp-2 group-hover:text-violet-600 transition-colors">
                                {item.product.name}
                              </p>
                              <p className="text-xs text-gray-500 mb-2">{item.product.brand}</p>
                              <p className="text-lg font-black text-gray-900 mb-4">
                                ₹{(item.product.price_cents / 100).toFixed(0)}
                              </p>
                            </Link>
                            <AddToCartButton
                              productId={item.product._id}
                              price={item.product.price_cents}
                              variants={item.product.variants}
                            />
                          </>
                        ) : (
                          <div className="flex-1 flex items-center justify-center py-8">
                            <p className="text-sm text-gray-400 italic">No matching item found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-100 mb-4">
                      <Sparkles className="w-8 h-8 text-violet-600" />
                    </div>
                    <p className="text-gray-700 font-medium mb-2">No outfit items found</p>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      Our AI couldn't find matching items at this time. Try adjusting your style mood or check back later.
                    </p>
                  </div>
                )}
              </div>

              {/* Style Explanation */}
              {result.overallStyleExplanation && (
                <div className="mt-8 p-6 bg-gradient-to-r from-violet-50/80 to-purple-50/80 backdrop-blur-sm rounded-2xl border border-violet-200/50 shadow-sm">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-sm leading-relaxed font-medium">
                      {result.overallStyleExplanation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .fade-in-animation {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
