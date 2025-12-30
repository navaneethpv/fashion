"use client"
import { useState } from 'react';
import Image from "next/image";

interface GalleryProps {
  images: { url: string; dominant_color?: string }[];
  name: string;
}

const PLACEHOLDER = "https://via.placeholder.com/600x600?text=No+Image";

function normalizeImageSrc(url?: string) {
  if (!url) return PLACEHOLDER;
  const trimmed = url.toString().trim();
  if (!trimmed) return PLACEHOLDER;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = (process.env.NEXT_PUBLIC_API_BASE as string) || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base.replace(/\/$/, "")}/${trimmed.replace(/^\//, "")}`;
}

export default function Gallery({ images, name }: GalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fallback if no images
  if (!images || images.length === 0) return null;

  const mainSrc = normalizeImageSrc(
    typeof images?.[selectedIndex] === "string"
      ? (images![selectedIndex] as string)
      : (images?.[selectedIndex] as any)?.url
  );

  return (
    <>
      {/* Main Image */}
      <div className="relative flex-1 aspect-[3/4] bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 group">
        <Image
          src={mainSrc}
          alt={name || "Product image"}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          priority
        />
      </div>

      {/* Thumbnails */}
      <div className="flex gap-3 mt-6 overflow-x-auto pb-2 scrollbar-hide">
        {images?.map((img, i) => {
          const thumbSrc =
            typeof img === "string" ? img : (img as any)?.url;
          const src = normalizeImageSrc(thumbSrc);
          const isSelected = i === selectedIndex;

          return (
            <button
              key={i}
              type="button"
              aria-label={`Thumbnail ${i}`}
              className={`
                relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl transition-all duration-300
                ${isSelected
                  ? "ring-2 ring-black ring-offset-2 scale-105 opacity-100"
                  : "opacity-70 hover:opacity-100 hover:scale-105"
                }
              `}
              onClick={() => setSelectedIndex(i)}
            >
              <Image src={src} alt={`Thumbnail ${i}`} fill className="object-cover" />
            </button>
          );
        })}
      </div>
    </>
  );
}