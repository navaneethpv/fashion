"use client";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";
import Link from "next/link";

interface MostViewedSliderProps {
  products: any[];
}

export default function MostViewedSlider({ products }: MostViewedSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [lastX, setLastX] = useState(0);
  const [lastMoveTime, setLastMoveTime] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position to enable/disable arrows
  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5); // Small threshold to account for rounding
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  // Monitor scroll position
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      checkScrollPosition();
      scrollElement.addEventListener("scroll", checkScrollPosition);
      return () =>
        scrollElement.removeEventListener("scroll", checkScrollPosition);
    }
  }, []);

  // Momentum scrolling
  useEffect(() => {
    if (!isDragging && Math.abs(velocity) > 0.5) {
      const momentum = setInterval(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft += velocity;
          setVelocity((v) => v * 0.95); // Deceleration

          if (Math.abs(velocity) < 0.5) {
            clearInterval(momentum);
          }
        }
      }, 16);

      return () => clearInterval(momentum);
    }
  }, [isDragging, velocity]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      const newScrollLeft =
        scrollRef.current.scrollLeft +
        (direction === "right" ? scrollAmount : -scrollAmount);
      scrollRef.current.scrollTo({ left: newScrollLeft, behavior: "smooth" });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    setLastX(e.pageX);
    setLastMoveTime(Date.now());
    setVelocity(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();

    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2.5; // Increased sensitivity for smoother feel
    scrollRef.current.scrollLeft = scrollLeft - walk;

    // Calculate velocity for momentum
    const currentTime = Date.now();
    const timeDelta = currentTime - lastMoveTime;
    if (timeDelta > 0) {
      const newVelocity = ((lastX - e.pageX) / timeDelta) * 16; // Normalize to 60fps
      setVelocity(newVelocity);
    }
    setLastX(e.pageX);
    setLastMoveTime(currentTime);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Prevent text selection while dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = "none";
    } else {
      document.body.style.userSelect = "";
    }
    return () => {
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  return (
    <section className="py-12 bg-gradient-to-r from-purple-50 via-pink-50 to-violet-50 relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-1">
              🔥 Most Viewed
            </h2>
            <p className="text-gray-600">Popular picks everyone's loving</p>
          </div>
          <Link
            href="/product"
            className="text-primary font-bold hover:underline text-sm md:text-base"
          >
            See All →
          </Link>
        </div>

        {/* Slider Container */}
        <div className="relative group">
          {/* Left Arrow */}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300 -translate-x-1/2 ${canScrollLeft
                ? "opacity-0 group-hover:opacity-100 hover:bg-gray-50 hover:scale-110 cursor-pointer"
                : "opacity-30 cursor-not-allowed"
              }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Scrollable Container */}
          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            className={`flex gap-3 sm:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide scroll-smooth ${isDragging ? "cursor-grabbing select-none" : "cursor-grab"
              }`}
            style={{
              scrollBehavior: isDragging ? "auto" : "smooth",
            }}
          >
            {products.slice(0, 8).map((p: any) => (
              <div
                key={p._id}
                className="flex-shrink-0 w-64 snap-start transform transition-transform duration-200 hover:scale-[1.02]"
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
                />
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all duration-300 translate-x-1/2 ${canScrollRight
                ? "opacity-0 group-hover:opacity-100 hover:bg-gray-50 hover:scale-110 cursor-pointer"
                : "opacity-30 cursor-not-allowed"
              }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
