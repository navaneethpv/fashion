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
  { value: "casual", label: "Casual", icon: "👕" },
  { value: "formal", label: "Formal", icon: "👔" },
  { value: "party", label: "Party", icon: "🎉" },
  { value: "sporty", label: "Sporty", icon: "🏃" },
  { value: "streetwear", label: "Streetwear", icon: "🧢" },
  { value: "business", label: "Business", icon: "💼" },
];

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/300x200?text=No+Image";

// Helper to resolve image URL from various formats
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
        body: JSON.stringify({ productId, excludeIds, mood: styleVibe }),
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
          roleKey.includes('footwear') ? 'footwear' :
            roleKey.includes('accessory') ? 'accessories' : 'other';

    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  const renderSection = (title: string, items: OutfitItem[]) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="mb-12 last:mb-0 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="flex items-center gap-4 mb-6 px-1">
          <h5 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            {title}
          </h5>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="relative group/scroll">
          {/* Right Fade Cue */}
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex overflow-x-auto gap-6 pb-12 pt-4 px-1 scroll-smooth scrollbar-hide snap-x snap-mandatory"
            style={{ cursor: "grab" }}
          >
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-[200px] md:w-[260px] snap-start"
              >
                <div className="relative bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 h-full flex flex-col group/card overflow-hidden">

                  {/* Floating Role Badge - Top Left */}
                  <div className="absolute top-2 left-2 z-20">
                    <span className="bg-black/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase shadow-sm">
                      {item.role}
                    </span>
                  </div>

                  {item.product ? (
                    <>
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="block flex-1"
                      >
                        {/* Product Image - Fashion Contain Mode */}
                        <div className="relative h-[220px] bg-gray-50 flex items-center justify-center p-4">
                          <img
                            src={resolveImageUrl(item.product.images)}
                            alt={item.product.name}
                            className="w-full h-full object-contain group-hover/card:scale-105 transition-transform duration-500 will-change-transform"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              if (target.src !== PLACEHOLDER_IMAGE) {
                                target.src = PLACEHOLDER_IMAGE;
                              }
                            }}
                          />
                        </div>

                        {/* Product Info - Clean Layout */}
                        <div className="p-4">
                          {/* Brand - Small Uppercase */}
                          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">
                            {item.product.brand || 'Eyoris'}
                          </p>

                          {/* Name */}
                          <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 mb-2 group-hover/card:text-violet-700 transition-colors">
                            {item.product.name}
                          </p>

                          {/* Price Row */}
                          <div className="flex items-center justify-between mt-auto">
                            <p className="text-base font-semibold text-gray-900">
                              ₹{(item.product.price_cents / 100).toFixed(0)}
                            </p>
                          </div>
                        </div>
                      </Link>

                      {/* Add to Cart - Always Visible */}
                      <div className="px-4 pb-4 mt-auto">
                        <AddToCartButton
                          productId={item.product._id}
                          price={item.product.price_cents}
                          variants={item.product.variants}
                          compact={true}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50 h-[320px]">
                      <span className="text-2xl mb-2 opacity-50">✨</span>
                      <p className="text-xs text-gray-400 font-medium">Coming Soon</p>
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
    <div className="mt-14 relative px-4 md:px-0">
      {/* Premium Container */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/80 backdrop-blur-xl border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.06)]">

        <div className="p-6 md:p-10 lg:p-12">
          {/* Header Section */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="p-2 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-xl text-xl">✨</span>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  Style Studio Collection
                </h3>
              </div>
              <p className="text-gray-500 font-medium ml-1">
                Curated ensembles designed to elevate your wardrobe.
              </p>
            </div>

            {/* Premium CTA Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="group relative px-8 py-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden w-full md:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Styling...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 text-yellow-300 group-hover:rotate-12 transition-transform duration-300" />
                    <span>{result ? "Shuffle New Look" : "Generate Collection"}</span>
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Mood Selector - Premium Pills */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse"></span>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select Vibe</span>
            </div>

            <div className="flex flex-wrap gap-3">
              {STYLE_VIBES.map((v) => {
                const isSelected = styleVibe === v.value;
                return (
                  <button
                    key={v.value}
                    onClick={() => setStyleVibe(v.value)}
                    disabled={loading}
                    className={`
                      relative px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 border
                      ${isSelected
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-lg shadow-violet-200 scale-105 ring-2 ring-violet-200 ring-offset-2'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                      disabled:opacity-50 disabled:scale-100
                    `}
                  >
                    <span className="text-lg">{v.icon}</span>
                    <span>{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading State Skeleton */}
          {loading && (
            <div className="space-y-8 animate-pulse">
              {[1, 2].map(row => (
                <div key={row} className="space-y-4">
                  <div className="h-6 w-40 bg-gray-200 rounded-lg ml-1" />
                  <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex-shrink-0 w-[200px] md:w-[260px] h-[340px] bg-gray-100 rounded-xl" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results Area */}
          {result && !loading && (
            <div className="space-y-2">
              {groupedItems.tops && renderSection("Top Picks", groupedItems.tops)}
              {groupedItems.bottoms && renderSection("Matching Bottoms", groupedItems.bottoms)}
              {groupedItems.footwear && renderSection("Complete the Look", groupedItems.footwear)}
              {groupedItems.accessories && renderSection("Accessories", groupedItems.accessories)}

              {/* Empty State */}
              {(!groupedItems.tops && !groupedItems.bottoms) && (
                <div className="py-24 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-gray-400" />
                  </div>
                  <h4 className="text-gray-900 font-bold mb-2">No styles found</h4>
                  <p className="text-gray-500 text-sm">Try selecting a different vibe or product.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

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
