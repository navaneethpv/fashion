"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Loader2, Zap, ChevronDown, Sparkle, RefreshCw } from "lucide-react";
import AddToCartButton from "./AddToCartButton";
import Modal from "./Modal";

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
  productCategory?: string;
  productSubCategory?: string;
  productName?: string;
}

export default function OutfitGenerator({
  productId,
  productGender,
  productCategory,
  productSubCategory,
  productName,
}: OutfitGeneratorProps) {
  // Simple Phase 1 State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OutfitResult | null>(null);
  const [styleVibe, setStyleVibe] = useState(STYLE_VIBES[0].value);
  const [showBlockModal, setShowBlockModal] = useState(false);

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

  // Exclusion Memory
  const excludedIdsRef = useRef<Set<string>>(new Set());

  // Non-Fashion Block List
  const NON_FASHION_KEYWORDS = [
    "cosmetic",
    "skincare",
    "lotion",
    "cream",
    "perfume",
    "fragrance",
    "makeup",
    "shampoo",
    "soap",
    "personal care",
    "beauty",
  ];

  const handleGenerate = async () => {
    // 1. Validate Category for Fashion Products
    const searchString = `${productName || ""} ${productCategory || ""} ${productSubCategory || ""}`.toLowerCase();
    const isBlocked = NON_FASHION_KEYWORDS.some((keyword) => searchString.includes(keyword));

    if (isBlocked) {
      setShowBlockModal(true);
      return;
    }

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

  const renderSection = (title: string, items: OutfitItem[], isAccessory = false) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="mb-10 last:mb-0 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards">
        <div className="flex items-center justify-between mb-4 px-1">
          <h5 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
            {title}
            {isAccessory && <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>}
          </h5>
          {!isAccessory && <div className="h-[1px] flex-1 ml-4 bg-gradient-to-r from-gray-200 to-transparent"></div>}
        </div>

        {/* Horizontal Scroll Container */}
        <div className="relative group/scroll">
          <div
            className="flex overflow-x-auto gap-4 pb-4 px-1 scroll-smooth scrollbar-hide snap-x snap-mandatory"
            style={{ cursor: "grab" }}
          >
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`flex-shrink-0 snap-start ${isAccessory ? 'w-[220px]' : 'w-[300px] md:w-[340px]'}`}
              >
                <div className="relative bg-white rounded-2xl border border-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex overflow-hidden group/card">

                  {/* Floating Role Badge */}
                  <div className="absolute top-2 left-2 z-20 pointer-events-none">
                    <span className="bg-white/90 backdrop-blur-md text-gray-900 text-[9px] font-bold px-2 py-1 rounded-full shadow-sm tracking-wider uppercase border border-gray-100">
                      {item.role}
                    </span>
                  </div>

                  {item.product ? (
                    <>
                      {/* Left: Image (Square) */}
                      <Link
                        href={`/products/${item.product.slug}`}
                        className={`relative bg-gray-50 flex-shrink-0 overflow-hidden group-hover/card:brightness-105 transition-all ${isAccessory ? 'w-24' : 'w-32 md:w-36'}`}
                      >
                        <img
                          src={resolveImageUrl(item.product.images)}
                          alt={item.product.name}
                          className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (target.src !== PLACEHOLDER_IMAGE) {
                              target.src = PLACEHOLDER_IMAGE;
                            }
                          }}
                        />
                      </Link>

                      {/* Right: Content */}
                      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                        <Link href={`/products/${item.product.slug}`} className="block">
                          {/* Brand */}
                          <p className="text-[9px] uppercase tracking-widest text-violet-600 font-bold mb-0.5 truncate">
                            {item.product.brand || 'Eyoris'}
                          </p>
                          {/* Name */}
                          <h4 className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2 mb-1 group-hover/card:text-violet-700 transition-colors">
                            {item.product.name}
                          </h4>
                          {/* Price */}
                          <p className="text-sm font-bold text-gray-900 mb-2">
                            ₹{(item.product.price_cents / 100).toFixed(0)}
                          </p>
                        </Link>

                        {/* Compact Action */}
                        <div className="mt-auto">
                          <AddToCartButton
                            productId={item.product._id}
                            price={item.product.price_cents}
                            variants={item.product.variants}
                            compact={true}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center p-6 text-center bg-gray-50 h-32">
                      <span className="text-lg mb-1 opacity-40">✨</span>
                      <p className="text-[10px] text-gray-400 font-medium">Coming Soon</p>
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
    <div className="mt-16 px-4 md:px-0 max-w-6xl mx-auto mb-20">
      {/* Premium Gradient Container */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-violet-50/90 via-white to-blue-50/90 backdrop-blur-xl border border-white/50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)]">

        {/* Soft Background Pattern */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-100/40 to-indigo-100/40 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="relative p-6 md:p-10 z-10">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <span className="text-xs font-bold tracking-[0.2em] text-violet-600 uppercase">AI Driven</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">
                Style Studio
              </h3>
              <p className="text-gray-500 font-medium mt-1 text-sm md:text-base">
                Curated looks tailored just for this item.
              </p>
            </div>

            {/* Floating Shuffle Button */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full font-bold shadow-lg shadow-violet-200 hover:shadow-violet-400 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-70 disabled:pointer-events-none overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient" />
              <div className="relative flex items-center gap-2">
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className={`w-4 h-4 ${result ? "group-hover:rotate-180" : ""} transition-transform duration-500`} />
                )}
                <span>{result ? "Shuffle Look" : "Generate Look"}</span>
              </div>
            </button>
          </div>

          {/* Mood Selector - Pill Chips */}
          <div className="mb-10 overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 mr-2 uppercase tracking-wide">Vibe:</span>
              {STYLE_VIBES.map((v) => {
                const isSelected = styleVibe === v.value;
                return (
                  <button
                    key={v.value}
                    onClick={() => setStyleVibe(v.value)}
                    disabled={loading}
                    className={`
                      relative px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 flex-shrink-0 flex items-center gap-2 border
                      ${isSelected
                        ? 'bg-gray-900 text-white border-transparent shadow-lg shadow-gray-200 transform scale-105'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-900 hover:text-gray-900'
                      }
                    `}
                  >
                    <span className="text-sm">{v.icon}</span>
                    <span>{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-white/50 rounded-2xl border border-white shadow-sm"></div>
              ))}
            </div>
          )}

          {/* Results Area */}
          {result && !loading && (
            <div className="space-y-4">
              {/* Main Outfit Items */}
              <div className="space-y-8">
                {groupedItems.tops && renderSection("Top Picks", groupedItems.tops)}
                {groupedItems.bottoms && renderSection("Matching Bottoms", groupedItems.bottoms)}
                {groupedItems.footwear && renderSection("Perfect Pairs", groupedItems.footwear)}
              </div>

              {/* Accessories Group - Distinct Styling */}
              {groupedItems.accessories && (
                <div className="mt-12 bg-white/60 rounded-3xl p-6 border border-white shadow-sm">
                  {renderSection("Complete the Look", groupedItems.accessories, true)}
                </div>
              )}

              {/* Empty State */}
              {(!groupedItems.tops && !groupedItems.bottoms && !groupedItems.accessories) && (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Sparkles className="w-6 h-6 text-gray-300" />
                  </div>
                  <h4 className="text-gray-900 font-bold mb-1">No styles found</h4>
                  <p className="text-gray-400 text-xs">Try a different vibe.</p>
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
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>

      {/* Block Logic Modal */}
      <Modal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        title="Outfit Not Available"
      >
        <div className="space-y-4">
          <p className="text-gray-600 leading-relaxed text-sm">
            Outfit suggestions are available only for fashion items like clothing, footwear, and accessories.
            <br /><br />
            Since this is a non-fashion item (e.g., cosmetic or skincare), our style AI cannot generate a look for it.
          </p>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setShowBlockModal(false)}
              className="px-6 py-2.5 bg-black text-white text-sm font-bold rounded-full hover:bg-gray-800 transition shadow-lg"
            >
              Got it
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
