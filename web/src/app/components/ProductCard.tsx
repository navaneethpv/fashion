// /web/src/components/ProductCard.tsx

"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

// --- FIXED: Interface now matches possible API shapes (string or array) ---
interface Product {
  _id?: string | null;
  slug: string;
  name: string;
  brand?: string;
  price_cents?: number;
  price_before_cents?: number | null;
  // API can送 either a single string URL, an array of strings, or an array of objects with { url }
  images?: string | Array<string | { url?: string }>;
  rating?: number;
  offer_tag?: string | null;
}

interface ProductCardProps {
  product: Product;
}

const PLACEHOLDER =
  "https://via.placeholder.com/300x200?text=No+Image";

export default function ProductCard({ product }: ProductCardProps) {
  const [localProduct, setLocalProduct] = useState<Product>(product);

  useEffect(() => {
    // If we already have an image and an id, no need to fetch
    const hasImage =
      !!localProduct.images &&
      ((typeof localProduct.images === "string" && localProduct.images.length > 0) ||
        (Array.isArray(localProduct.images) && localProduct.images.length > 0));
    const hasId = !!localProduct._id;

    if (hasImage && hasId) return;

    const controller = new AbortController();
    const base =
      (process.env.NEXT_PUBLIC_API_BASE as string) || window.location.origin;

    async function fetchDetails() {
      try {
        const url = `${base.replace(/\/$/, "")}/products/${encodeURIComponent(
          product.slug
        )}`;
        const res = await axios.get(url, { signal: controller.signal });
        const data = res?.data;
        if (data) {
          // merge fetched fields into local product
          setLocalProduct((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        if ((err as any)?.name === "CanceledError") return;
        // optional: console.debug only in dev
        if (process.env.NODE_ENV === "development") {
          console.debug("ProductCard: failed to fetch details", err);
        }
      }
    }

    fetchDetails();
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug]);

  // compute a safe image URL from various possible shapes
  function resolveImageUrl(p: Product) {
    if (!p) return PLACEHOLDER;
    const imgs = p.images;
    if (!imgs) return PLACEHOLDER;

    if (typeof imgs === "string") {
      if (imgs.trim().length === 0) return PLACEHOLDER;
      return prefixIfRelative(imgs);
    }

    if (Array.isArray(imgs) && imgs.length > 0) {
      const first = imgs[0];
      if (!first) return PLACEHOLDER;
      if (typeof first === "string") return prefixIfRelative(first);
      if (typeof first === "object" && (first as any).url) return prefixIfRelative((first as any).url);
    }

    return PLACEHOLDER;
  }

  function prefixIfRelative(url: string) {
    if (!url) return PLACEHOLDER;
    if (/^https?:\/\//i.test(url)) return url;
    const base = (process.env.NEXT_PUBLIC_API_BASE as string) || window.location.origin;
    return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
  }

  const imageUrl = resolveImageUrl(localProduct);
  const href = `/products/${localProduct.slug}${localProduct._id ? `?id=${localProduct._id}` : ""}`;

  return (
    <Link href={href} className="group">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <div className="relative">
          <img
            src={imageUrl}
            alt={localProduct.name}
            className="w-full h-48 object-cover"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src !== PLACEHOLDER) target.src = PLACEHOLDER;
            }}
          />
          {localProduct.offer_tag && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              {localProduct.offer_tag}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600">
            {localProduct.name}
          </h3>
          <p className="text-xs text-gray-500">{localProduct.brand}</p>
          <div className="mt-2 flex items-baseline">
            <span className="text-lg font-bold text-gray-900">
              ₹{((localProduct.price_cents ?? 0) / 100).toFixed(0)}
            </span>
            {localProduct.price_before_cents ? (
              <span className="ml-2 text-sm text-gray-400 line-through">
                ₹{((localProduct.price_before_cents ?? 0) / 100).toFixed(0)}
              </span>
            ) : null}
          </div>
          {localProduct.rating ? (
            <div className="mt-1 text-xs text-gray-600">
              Rating: {localProduct.rating.toFixed(1)} ★
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}