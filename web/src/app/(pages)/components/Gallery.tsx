"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

interface GalleryProps {
  images: (string | { url: string; dominant_color?: string })[]; // Handle both string and object
  name: string;
}

const PLACEHOLDER = "https://via.placeholder.com/600x600?text=No+Image";

function normalizeImageSrc(img: string | { url: string } | undefined) {
  if (!img) return PLACEHOLDER;
  const url = typeof img === "string" ? img : img.url;
  if (!url) return PLACEHOLDER;
  const trimmed = url.toString().trim();
  if (!trimmed) return PLACEHOLDER;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base =
    (process.env.NEXT_PUBLIC_API_BASE as string) ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base.replace(/\/$/, "")}/${trimmed.replace(/^\//, "")}`;
}

export default function Gallery({ images, name }: GalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Normalize all images upfront
  const safeImages = Array.isArray(images) && images.length > 0 ? images : [PLACEHOLDER];
  const normalizedImages = safeImages.map(normalizeImageSrc);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setSelectedIndex((prev) => (prev === 0 ? normalizedImages.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setSelectedIndex((prev) => (prev === normalizedImages.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [normalizedImages.length]);

  if (!normalizedImages.length) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes fadeInZoom {
          from { opacity: 0; transform: scale(1); }
          to { opacity: 1; transform: scale(1.03); }
        }
        .animate-fadeInZoom {
          animation: fadeInZoom 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 w-full">
        {/* Thumbnails: Bottom on mobile (order-2), Left on Desktop (order-1) */}
        <div className="order-2 lg:order-1 flex lg:flex-col gap-3 lg:gap-4 overflow-x-auto lg:overflow-y-auto lg:h-[580px] scrollbar-hide lg:w-[80px] shrink-0 no-scrollbar touch-pan-x">
          {normalizedImages.map((src, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              aria-label={`View image ${i + 1}`}
              className={`
                relative w-14 h-14 lg:w-[70px] lg:h-[70px] shrink-0 rounded-lg overflow-hidden transition-all duration-200
                ${i === selectedIndex
                  ? "border-2 border-black opacity-100"
                  : "border border-gray-200 hover:border-gray-400 hover:scale-[1.02] opacity-100"
                }
              `}
            >
              <Image
                src={src}
                alt={`${name} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 56px, 70px"
              />
            </button>
          ))}
        </div>

        {/* Main Image: Top on mobile (order-1), Right on Desktop (order-2) */}
        <div className="order-1 lg:order-2 w-full lg:flex-1 relative lg:sticky lg:top-24 self-start">
          <div
            className="relative aspect-[3/4] lg:h-[580px] w-full bg-gray-50/50 rounded-xl overflow-hidden shadow-sm border border-gray-100"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* 
                We use key={selectedIndex} to trigger the mount animation (fadeInZoom) 
                every time the image changes.
            */}
            <Image
              key={selectedIndex}
              src={normalizedImages[selectedIndex]}
              alt={name}
              fill
              priority={selectedIndex === 0}
              className={`
                object-cover
                transition-transform duration-700 ease-out
                ${isHovering ? "scale-[1.04]" : ""}
                animate-fadeInZoom
              `}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </div>
    </>
  );
}