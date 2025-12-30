// /web/src/components/ProductCard.tsx

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Heart } from "lucide-react";

interface Product {
  _id?: string | null;
  slug: string;
  name: string;
  brand?: string;
  price_cents?: number;
  price_before_cents?: number | null;
  images?: string | Array<string | { url?: string }>;
  rating?: number;
  offer_tag?: string | null;
}

interface ProductCardProps {
  product: Product;
  isPremium?: boolean;
}

const PLACEHOLDER = "https://via.placeholder.com/300x200?text=No+Image";

export default function ProductCard({ product, isPremium = false }: ProductCardProps) {
  const [localProduct, setLocalProduct] = useState<Product>(product);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [burstPosition, setBurstPosition] = useState({ x: 0, y: 0 });
  const { user } = useUser();

  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  const baseUrl = base.replace(/\/$/, "");

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !localProduct._id) return;

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        await fetch(
          `${baseUrl}/api/wishlist/remove/${localProduct._id}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id }),
          }
        );
        setIsWishlisted(false);
      } else {
        await fetch(`${baseUrl}/api/wishlist/add`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            productId: localProduct._id,
          }),
        });
        setIsWishlisted(true);

        // Trigger heart burst animation when liked
        setBurstPosition({ x: 50, y: 50 }); // Center of image percentage
        setShowHeartBurst(true);
        setTimeout(() => setShowHeartBurst(false), 1000);
      }
    } catch (error) {
      console.error("Wishlist toggle failed:", error);
    } finally {
      setWishlistLoading(false);
    }
  };

  useEffect(() => {
    const hasImage =
      !!localProduct.images &&
      ((typeof localProduct.images === "string" &&
        localProduct.images.trim().length > 0) ||
        (Array.isArray(localProduct.images) && localProduct.images.length > 0));
    const hasId = !!localProduct._id;

    if (hasImage && hasId) return;

    const controller = new AbortController();
    const base = process.env.NEXT_PUBLIC_API_BASE || window.location.origin;

    async function fetchDetails() {
      try {
        const url = `${base.replace(/\/$/, "")}/products/${encodeURIComponent(
          product.slug
        )}`;
        const res = await axios.get(url, { signal: controller.signal });
        if (res?.data) setLocalProduct((prev) => ({ ...prev, ...res.data }));
      } catch (err: any) {
        if (err?.name === "CanceledError") return;
        if (process.env.NODE_ENV === "development")
          console.debug("ProductCard fetch failed", err);
      }
    }

    fetchDetails();
    return () => controller.abort();
  }, [product.slug, localProduct.images, localProduct._id]);

  function prefixIfRelative(url?: string) {
    if (!url) return PLACEHOLDER;
    if (/^https?:\/\//i.test(url)) return url;
    const base =
      process.env.NEXT_PUBLIC_API_BASE ||
      (typeof window !== "undefined" ? window.location.origin : "");
    return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
  }

  function resolveImageUrl(p?: Product) {
    if (!p) return PLACEHOLDER;
    const imgs = p.images;
    if (!imgs) return PLACEHOLDER;
    if (typeof imgs === "string")
      return imgs.trim() ? prefixIfRelative(imgs) : PLACEHOLDER;
    if (Array.isArray(imgs) && imgs.length > 0) {
      const first = imgs[0];
      if (!first) return PLACEHOLDER;
      if (typeof first === "string") return prefixIfRelative(first);
      return prefixIfRelative((first as any).url);
    }
    return PLACEHOLDER;
  }

  const imageUrl = resolveImageUrl(localProduct);
  const href = `/products/${localProduct.slug}${localProduct._id ? `?id=${localProduct._id}` : ""}`;

  return (
    <Link href={href} className="group block h-full">
      <div className="relative flex flex-col h-full bg-white border border-gray-100 p-5">
        {/* Image Container - Always 3:4 Aspect Ratio */}
        <div className="relative aspect-[2/3] overflow-hidden bg-gray-100 rounded-sm">
          <img
            src={imageUrl}
            alt={localProduct.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={(e) => {
              const t = e.currentTarget as HTMLImageElement;
              if (t.src !== PLACEHOLDER) t.src = PLACEHOLDER;
            }}
          />

          {/* Minimal Offer Tag - Only if meaningful */}
          {localProduct.offer_tag && (
            <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-red-600 text-[10px] uppercase font-bold px-2 py-1 tracking-wider">
              {localProduct.offer_tag}
            </span>
          )}

          {/* Premium Gradient Overlay on hover */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Quick Actions (Wishlist) - Desktop: Hover, Mobile: Always visible (handled via CSS/Size) */}
          {user && (
            <button
              onClick={toggleWishlist}
              disabled={wishlistLoading}
              className={`absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur shadow-sm 
                transition-all duration-300 z-10
                ${isWishlisted ? "opacity-100" : "opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"}
              `}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart
                className={`w-4 h-4 transition-colors duration-300 ${isWishlisted ? "fill-red-500 text-red-500" : "text-gray-900 hover:text-red-500"
                  }`}
              />
            </button>
          )}
        </div>

        {/* Info Section - Editorial Style */}
        <div className="pt-3 pb-1 flex flex-col gap-1">
          {/* Brand */}
          <h4 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest truncate">
            {localProduct.brand || "Eyoris"}
          </h4>

          {/* Name */}
          <h3 className="text-xs md:text-sm font-medium text-gray-900 truncate leading-tight group-hover:underline decoration-gray-400 underline-offset-4 decoration-1">
            {localProduct.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm font-semibold text-gray-900">
              ₹{((localProduct.price_cents ?? 0) / 100).toLocaleString()}
            </span>
            {localProduct.price_before_cents && (
              <span className="text-xs text-gray-400 line-through">
                ₹{((localProduct.price_before_cents ?? 0) / 100).toLocaleString()}
              </span>
            )}
            {/* Optional: Calculate discount % purely for text if needed, but keeping it clean for now */}
          </div>
        </div>
      </div>
    </Link>
  );
}
