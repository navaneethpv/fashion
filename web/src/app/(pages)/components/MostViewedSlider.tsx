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
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScrollPosition);
      return () => el.removeEventListener('scroll', checkScrollPosition);
    }
  }, []);

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
        {/* Navigation Buttons - Minimalist */}
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className={`hidden md:flex absolute -left-12 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center text-gray-400 hover:text-black transition-all ${!canScrollLeft ? "opacity-0" : "opacity-100"}`}
        >
          <ChevronLeft className="w-8 h-8 font-light" strokeWidth={1} />
        </button>

        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className={`hidden md:flex absolute -right-12 top-1/2 -translate-y-1/2 z-20 w-12 h-12 items-center justify-center text-gray-400 hover:text-black transition-all ${!canScrollRight ? "opacity-0" : "opacity-100"}`}
        >
          <ChevronRight className="w-8 h-8 font-light" strokeWidth={1} />
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
