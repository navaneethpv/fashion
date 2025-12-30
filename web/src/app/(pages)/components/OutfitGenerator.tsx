"use client";

import { useState, useRef, useEffect } from "react";
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
  // Simple Phase 1 State
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

  // Exclusion Memory using useRef (persists across re-renders but resets on reload)
  const excludedIdsRef = useRef<Set<string>>(new Set());

  // Reset exclusions only on mount or strict conditions (User requested NOT to reset on base product change)
  // so we initialize once.

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
      }

      // Convert Set to Array for API
      const excludeIds = Array.from(excludedIdsRef.current);
      console.log("[OUTFIT DEBUG] Frontend Sending Exclusions:", excludeIds);

      const res = await fetch(`${API_URL}/api/outfit/simple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, excludeIds }),
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

      if (!data || typeof data !== "object") {
        console.warn("Invalid response format:", data);
        setResult(null);
      } else {
        const items = data.outfitItems ?? [];
        setResult({ ...data, outfitItems: items });

        // Update exclusion memory with new items
        items.forEach((item: any) => {
          if (item.product && item.product._id) {
            console.log("[OUTFIT DEBUG] Adding to exclusion:", item.product._id);
            excludedIdsRef.current.add(item.product._id);
          }
        });
        console.log("[OUTFIT DEBUG] Updated Exclusion Set Size:", excludedIdsRef.current.size);
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

  // Helper to group items by role
  const groupedItems = (result?.outfitItems ?? []).reduce((acc: any, item: OutfitItem) => {
    const roleKey = item.role.toLowerCase();
    const group =
      roleKey.includes('top') ? 'tops' :
        roleKey.includes('bottom') ? 'bottoms' :
          roleKey.includes('footwear') ? 'footwear' : 'accessories';

    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  const renderSection = (title: string, items: OutfitItem[]) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="mb-8 last:mb-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h5 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 px-1">
          <span className="w-1 h-6 bg-violet-600 rounded-full inline-block"></span>
          {title}
        </h5>

        {/* Horizontal Scroll Container with Cue Gradients */}
        <div className="relative group/scroll">
          {/* Left Fade Cue */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white/90 to-transparent z-10 pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300"></div>
          {/* Right Fade Cue */}
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/90 to-transparent z-10 pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300"></div>

          <div
            className="flex overflow-x-auto gap-5 pb-6 pt-2 px-1 scroll-smooth scrollbar-hide snap-x snap-mandatory"
            style={{ cursor: "grab" }}
          >
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-[240px] md:w-[260px] snap-start"
              >
                <div className="relative bg-white rounded-2xl p-4 shadow-sm border border-violet-100/50 hover:shadow-xl hover:shadow-violet-200/50 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col group/card">
                  {/* Role Badge & Visual Tag */}
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                      {item.role}
                    </span>
                    {/* Random Visual Badge Logic - purely visual */}
                    {Math.random() > 0.6 && (
                      <div className="px-2 py-1 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-sm text-[9px] font-bold text-white flex items-center gap-1">
                        {Math.random() > 0.5 ? 'TRENDING' : 'POPULAR'}
                      </div>
                    )}
                    {/* Valid new items */}
                    {!item.product && (
                      <span className="text-[9px] text-gray-400">Preview</span>
                    )}
                  </div>

                  {item.product ? (
                    <>
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="block flex-1"
                      >
                        {/* Product Image */}
                        <div className="relative overflow-hidden rounded-xl mb-4 bg-gray-50 aspect-[4/5] flex items-center justify-center">
                          <img
                            src={resolveImageUrl(item.product.images)}
                            alt={item.product.name}
                            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500 ease-out"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              if (target.src !== PLACEHOLDER_IMAGE) {
                                target.src = PLACEHOLDER_IMAGE;
                              }
                            }}
                          />
                        </div>

                        {/* Product Info */}
                        <div className="mb-4">
                          <p className="font-semibold text-gray-800 text-sm mb-1 line-clamp-2 leading-snug group-hover/card:text-violet-700 transition-colors">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">
                            {item.product.brand}
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            ₹{(item.product.price_cents / 100).toFixed(0)}
                          </p>
                        </div>
                      </Link>

                      {/* Add to Cart Button - Compact */}
                      <div className="mt-auto">
                        <AddToCartButton
                          productId={item.product._id}
                          price={item.product.price_cents}
                          variants={item.product.variants}
                        // compact prop if available, otherwise default
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-xs text-gray-400 italic mb-2">
                        More styles arriving soon
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-16 relative">
      {/* Premium Container with Glassmorphism & Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-50/90 via-white to-purple-50/90 backdrop-blur-md border border-violet-200/50 shadow-2xl shadow-violet-100/40">

        <div className="relative px-6 md:px-12 lg:px-16 py-8 md:py-12">
          {/* Premium Header */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-100/50 rounded-2xl">
                  <Sparkles className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
                  Style Studio <span className="text-violet-600">Collection</span>
                </h3>
              </div>
              <p className="text-sm md:text-base text-gray-600 font-medium max-w-lg leading-relaxed">
                Curated ensembles designed to complement your choice. Mix and match to define your look.
              </p>
            </div>

            {/* Premium Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="group relative px-8 py-4 bg-gray-900 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <span className="relative flex items-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                    <span>Styling...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-yellow-300" />
                    <span>{result ? "Shuffle Look" : "Generate Collection"}</span>
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Loading State with Horizontal Skeletons */}
          {loading && (
            <div className="space-y-8 animate-pulse">
              {[1, 2].map(row => (
                <div key={row}>
                  <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
                  <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex-shrink-0 w-[240px] h-[320px] bg-gray-100 rounded-2xl" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Outfit Results Display - Grouped Sections */}
          {result && !loading && (
            <div className="fade-in-animation min-h-[400px]">
              {/* Result Message */}
              <div className="mb-6 invisible h-0 md:visible md:h-auto">
                {/* Reserved for future filters or summary */}
              </div>

              {groupedItems.tops && renderSection("Top Picks", groupedItems.tops)}
              {groupedItems.bottoms && renderSection("Try These Bottoms", groupedItems.bottoms)}
              {groupedItems.footwear && renderSection("Complete the Look", groupedItems.footwear)}

              {/* Empty State Fallback */}
              {(!groupedItems.tops && !groupedItems.bottoms && !groupedItems.footwear) && (
                <div className="py-20 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-500 font-medium">No matching styles found right now.</p>
                  <button onClick={handleGenerate} className="text-violet-600 font-bold text-sm mt-2 hover:underline">Try Again</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Global Pulse Animation for Skeletons etc */}
      <style jsx global>{`
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
