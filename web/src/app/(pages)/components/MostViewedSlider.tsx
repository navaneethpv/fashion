"use client";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import Link from "next/link";

export default function MostViewedSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
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

  // Auto-scroll logic
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationFrameId: number;

    const animate = () => {
      if (!isPaused) {
        // Slow drift
        scrollContainer.scrollLeft += 0.5;

        // Loop back if reached end (simple reset for now, or bi-directional loop if needed later)
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
          scrollContainer.scrollLeft = 0;
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

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
    <section className="py-20 bg-gradient-to-b from-purple-50/50 to-white relative overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 mb-12 flex items-end justify-between">
        <div>
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-2">
            Most Viewed
          </h2>
          <p className="text-gray-500 font-medium tracking-wide">
            Styles the world is falling for
          </p>
        </div>
        <Link
          href="/product"
          className="hidden md:flex items-center gap-2 px-6 py-2 rounded-full border border-gray-200 text-sm font-bold hover:bg-black hover:text-white transition-all duration-300"
        >
          VIEW ALL
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div
        className="relative group w-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Navigation Buttons */}
        <button
          onClick={() => scroll("left")}
          disabled={!canScrollLeft}
          className={`absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center shadow-xl text-gray-900 transition-all duration-300 ${!canScrollLeft ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100 hover:scale-110"
            }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => scroll("right")}
          disabled={!canScrollRight}
          className={`absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center shadow-xl text-gray-900 transition-all duration-300 ${!canScrollRight ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100 hover:scale-110"
            }`}
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Slider */}
        <div
          ref={scrollRef}
          className={`flex gap-6 overflow-x-auto pb-12 px-6 no-scrollbar ${isPaused ? "snap-x snap-mandatory" : ""
            }`}
          style={{ scrollbarWidth: 'none' }}
        >
          {mostViewedProducts.map((p, i) => (
            <div
              key={p._id || i}
              className="snap-center shrink-0 w-[75vw] sm:w-[320px] md:w-[360px]"
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
          {/* Spacer */}
          <div className="w-8 shrink-0" />
        </div>
      </div>
    </section>
  );
}
