"use client";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import Link from "next/link";

export default function MostViewedSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Local state for fetched products
  const [mostViewedProducts, setProducts] = useState<any[]>([]);

  useEffect(() => {
    async function fetchMostViewed() {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const url = `${base.replace(/\/$/, "")}/api/products/most-viewed`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setProducts(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch most viewed:", err);
      }
    }
    fetchMostViewed();
  }, []);

  // Check scroll buttons
  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      // Strict checks with 1px buffer for cross-browser safety
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollPosition);
      window.addEventListener('resize', checkScrollPosition);
      // Initial check
      checkScrollPosition();

      return () => {
        el.removeEventListener('scroll', checkScrollPosition);
        window.removeEventListener('resize', checkScrollPosition);
      };
    }
  }, [mostViewedProducts]); // Re-run when products load/change

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "right" ? scrollAmount : -scrollAmount,
        behavior: "smooth"
      });
    }
  };

  if (mostViewedProducts.length === 0) return null;

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 mb-12 text-center">
        <h2 className="text-3xl md:text-4xl font-serif text-gray-900 mb-2">
          Trending Now
        </h2>
        <p className="text-gray-500 text-sm tracking-wider uppercase">
          Most Coveted Pieces
        </p>
      </div>

      <div className="relative group w-full">
        {/* Navigation Buttons - Strict Logic & Styling */}
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className={`hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full items-center justify-center transition-all duration-300 border border-gray-100 bg-white ${!canScrollLeft
              ? "opacity-30 cursor-not-allowed pointer-events-none shadow-none text-gray-400"
              : "opacity-100 shadow-lg text-gray-800 hover:bg-black hover:text-white"
            }`}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={1.5} />
        </button>

        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className={`hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full items-center justify-center transition-all duration-300 border border-gray-100 bg-white ${!canScrollRight
              ? "opacity-30 cursor-not-allowed pointer-events-none shadow-none text-gray-400"
              : "opacity-100 shadow-lg text-gray-800 hover:bg-black hover:text-white"
            }`}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" strokeWidth={1.5} />
        </button>

        {/* Slider */}
        <div
          ref={scrollRef}
          className="flex gap-8 overflow-x-auto pb-12 px-6 no-scrollbar snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none' }}
        >
          {mostViewedProducts.map((p, i) => (
            <div
              key={p._id || i}
              className="snap-center shrink-0 w-[80vw] sm:w-[320px] md:w-[340px]"
            >
              <ProductCard
                product={{
                  _id: p._id,
                  slug: p.slug,
                  name: p.name,
                  price_cents: p.price_cents,
                  price_before_cents: p.price_before_cents,
                  images: p.images,
                  brand: p.brand,
                  offer_tag: p.offer_tag,
                }}
                isPremium={true}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
