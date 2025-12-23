"use client";

import { useState, useRef } from "react";
import Link from "next/link";
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

  const base = process.env.NEXT_PUBLIC_API_URL || "";

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

export default function OutfitGenerator({
  productId,
  productGender,
}: OutfitGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OutfitResult | null>(null);
  const [styleVibe, setStyleVibe] = useState(STYLE_VIBES[0].value);

  // Native scroll with custom drag
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = "grabbing";
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab";
    }
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab";
    }
  };

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
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
      }

      const res = await fetch(`${API_URL}/api/ai/outfit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, userPreferences }),
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: "Unknown error" }));
        console.error("API Error:", res.status, errorData);
        alert(
          `Failed to generate outfit: ${errorData.message || "Server error"}`
        );
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log("Outfit API Response:", data);

      // ensure outfitItems is always an array to avoid runtime map errors
      if (!data || typeof data !== "object") {
        console.warn("Invalid response format:", data);
        setResult(null);
      } else {
        data.outfitItems = data.outfitItems ?? [];
        console.log(
          `Received ${data.outfitItems.length} outfit items, ${
            data.outfitItems.filter((item: any) => item.product).length
          } with products`
        );
        setResult(data);
      }
    } catch (e) {
      console.error("Fetch error:", e);
      alert(
        "AI failed to suggest an outfit. Please check your connection and try again."
      );
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

        <div className="relative px-6 md:px-12 lg:px-16 py-8 md:py-10">
          {/* Premium Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-violet-400/20 blur-xl rounded-full" />
                  <Sparkles
                    className="relative w-7 h-7 text-violet-600"
                    strokeWidth={2}
                  />
                </div>
                <h3 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-violet-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                  Create a Complete Look
                </h3>
              </div>
              <p className="text-sm md:text-base text-gray-600 font-medium ml-10">
                Choose one item you love. Our Style Studio intelligently curates
                complementary pieces to complete your outfit.
              </p>
            </div>

            {/* Premium Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="group relative px-8 py-4 md:py-1 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white font-bold text-sm md:text-base rounded-2xl shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 overflow-hidden"
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
                    <span>{result ? "Refine Style" : "Generate Look"}</span>
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
                <p className="text-gray-700 font-medium">
                  Curating your look...
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Our Style Studio is designing the perfect match
                </p>
              </div>

              {/* Skeleton Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white/80 rounded-2xl p-6 border border-violet-100/50 shadow-md animate-pulse"
                  >
                    <div className="w-full h-64 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl mb-4" />
                    <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
                    <div className="h-5 bg-gray-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outfit Results Display */}
          {result && !loading && (
            <div className="space-y-6 fade-in-animation">
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="text-xl md:text-2xl font-bold text-gray-900">
                    Your Curated Look
                  </h4>
                  <div className="px-3 py-1.5 bg-gradient-to-r from-violet-100 to-purple-100 rounded-full shadow-sm">
                    <span className="text-xs font-bold text-violet-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      {result.outfitTitle}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  A thoughtfully styled outfit designed to complement your
                  choice.
                </p>
              </div>

              {(result.outfitItems ?? []).length > 0 ? (
                <>
                  {/* Native Horizontal Scroll with Custom Drag */}
                  <div
                    ref={scrollRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    className="flex overflow-x-auto gap-6 scroll-smooth scrollbar-hide snap-x snap-mandatory pb-4"
                    style={{ cursor: "grab", userSelect: "none" }}
                  >
                    {(result.outfitItems ?? []).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex-shrink-0 w-[85vw] sm:w-[45vw] md:w-[40vw] lg:w-[32vw] xl:w-[28vw] snap-center"
                        style={{
                          animation: `slideIn 0.6s ease-out ${idx * 0.1}s both`,
                        }}
                      >
                        <div className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-lg shadow-violet-100/50 hover:shadow-2xl hover:shadow-violet-200/60 hover:-translate-y-2 transition-all duration-500 h-full flex flex-col mr-4 border border-transparent bg-gradient-to-br from-white via-white to-violet-50/30 before:absolute before:inset-0 before:rounded-3xl before:p-[1px] before:bg-gradient-to-br before:from-violet-200/40 before:via-pink-200/40 before:to-violet-200/40 before:-z-10">
                          {/* Role Badge & AI Pick Badge */}
                          <div className="flex items-center justify-between mb-5 relative z-10">
                            <span className="text-[9px] font-bold text-gray-700 uppercase tracking-widest bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-gray-200/50">
                              {item.role}
                            </span>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 rounded-full shadow-lg shadow-violet-500/40">
                              <Sparkle className="w-3 h-3 text-white fill-white" />
                              <span className="text-[9px] font-extrabold text-white tracking-wide">
                                AI
                              </span>
                            </div>
                          </div>

                          {item.product ? (
                            <>
                              <Link
                                href={`/products/${item.product.slug}`}
                                className="block flex-1 group/card"
                              >
                                {/* Product Image */}
                                <div className="relative overflow-hidden rounded-2xl mb-5 bg-gradient-to-br from-gray-50 to-violet-50/20 flex items-center justify-center aspect-square shadow-inner">
                                  <img
                                    src={resolveImageUrl(item.product.images)}
                                    alt={item.product.name}
                                    className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700 ease-out"
                                    onError={(e) => {
                                      const target =
                                        e.currentTarget as HTMLImageElement;
                                      if (target.src !== PLACEHOLDER_IMAGE) {
                                        target.src = PLACEHOLDER_IMAGE;
                                      }
                                    }}
                                  />
                                </div>

                                {/* Product Info */}
                                <div className="mb-5 flex-1 space-y-2">
                                  <p className="font-medium text-gray-900 text-base mb-1.5 line-clamp-2 min-h-[3rem] leading-snug group-hover/card:text-violet-700 transition-colors duration-300">
                                    {item.product.name}
                                  </p>
                                  <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">
                                    {item.product.brand}
                                  </p>
                                  <p className="text-2xl font-bold text-gray-900 mt-2">
                                    ₹
                                    {(item.product.price_cents / 100).toFixed(
                                      0
                                    )}
                                  </p>
                                </div>
                              </Link>

                              {/* Add to Cart Button */}
                              <div className="mt-auto">
                                <AddToCartButton
                                  productId={item.product._id}
                                  price={item.product.price_cents}
                                  variants={item.product.variants}
                                />
                              </div>
                            </>
                          ) : (
                            <div className="flex-1 flex items-center justify-center py-8">
                              <p className="text-sm text-gray-400 italic">
                                No matching item found
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-100 mb-4">
                    <Sparkles className="w-8 h-8 text-violet-600" />
                  </div>
                  <p className="text-gray-700 font-medium mb-2">
                    No outfit items found
                  </p>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Our AI couldn't find matching items at this time. Try
                    adjusting your style mood or check back later.
                  </p>
                </div>
              )}

              {/* Style Explanation */}
              {result.overallStyleExplanation && (
                <div className="mt-10 p-6 md:p-8 bg-gradient-to-r from-violet-50/90 to-purple-50/90 backdrop-blur-sm rounded-2xl border border-violet-200/50 shadow-md">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5">
                      <Sparkles className="w-5 h-5 text-violet-600" />
                    </div>
                    <p className="text-gray-700 text-sm md:text-base leading-relaxed font-medium">
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

        /* Hide scrollbar while maintaining scroll functionality */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
