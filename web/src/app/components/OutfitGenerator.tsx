"use client";

import { useState } from "react";
import Link from "next/link";
import { useKeenSlider } from "keen-slider/react";
import { Wand2, Loader2, Zap, ChevronDown, ArrowRight } from "lucide-react";
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
    <div className="mt-12 border border-violet-100 bg-gradient-to-r from-violet-50 to-white rounded-2xl p-6 md:p-8 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <Wand2 className="w-5 h-5 text-primary" />
            AI Stylist: Outfit Generator
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            AI builds a full matching outfit from your wardrobe.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-primary text-white bg-violet-500 px-6 py-2.5 rounded-lg font-bold text-sm shadow-lg hover:bg-violet-700 transition flex items-center gap-2 disabled:opacity-70 hover:cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {result ? "Regenerate" : "Generate"}
        </button>
      </div>

      {/* Filter Inputs */}
      <div className="flex gap-4 pb-4 mb-4 border-b border-violet-100">
        <div className="flex-1">
          <label className="text-xs font-bold text-gray-900 uppercase block mb-1">
            Style Vibe
          </label>
          <div className="relative">
            <select
              value={styleVibe}
              onChange={(e) => setStyleVibe(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg appearance-none text-sm pr-8 bg-white focus:border-primary text-gray-700"
            >
              {STYLE_VIBES.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-2.5 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Loader */}
      {loading && (
        <div className="text-center py-8 text-gray-900 ">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          Generating your outfit...
        </div>
      )}

      {/* Carousel Display */}
      {result && (
        <div className="space-y-6">
          <h4 className="text-2xl font-bold text-gray-900">{result.outfitTitle}</h4>

          <div ref={sliderRef} className="keen-slider">
            {(result.outfitItems ?? []).length > 0 ? (
              (result.outfitItems ?? []).map((item, idx) => (
                <div key={idx} className="keen-slider__slide bg-white border rounded-xl p-4 shadow-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">{item.role}</p>

                  {item.product ? (
                    <>
                      <Link href={`/products/${item.product.slug}`} className="block">
                        <img
                          src={resolveImageUrl(item.product.images)}
                          alt={item.product.name}
                          className="w-full h-44 object-cover rounded-lg mb-3"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (target.src !== PLACEHOLDER_IMAGE) {
                              target.src = PLACEHOLDER_IMAGE;
                            }
                          }}
                        />
                        <p className="font-bold text-gray-900">{item.product.name}</p>
                        <p className="text-sm text-gray-600">{item.product.brand}</p>
                        <p className="text-sm font-bold mt-1">₹{(item.product.price_cents / 100).toFixed(0)}</p>
                      </Link>
                      <AddToCartButton
                        productId={item.product._id}
                        price={item.product.price_cents}
                        variants={item.product.variants}
                      />
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No matching item found.</p>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-sm text-gray-600">
                No outfit items suggested.
              </div>
            )}
          </div>

          <p className="text-gray-600 text-sm bg-gray-50 p-4 rounded-lg shadow-sm">
            {result.overallStyleExplanation}
          </p>
        </div>
      )}
    </div>
  );
}
