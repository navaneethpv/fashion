"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "./ProductCard";

interface TrendingSliderProps {
    products: any[];
}

export default function TrendingSlider({ products }: TrendingSliderProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (!products || products.length === 0) return null;

    return (
        <div className="relative group">
            {/* Left Button */}
            <button
                onClick={() => scroll('left')}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-full items-center justify-center shadow-lg text-gray-800 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white disabled:opacity-0"
                aria-label="Scroll left"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Right Button */}
            <button
                onClick={() => scroll('right')}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-full items-center justify-center shadow-lg text-gray-800 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white disabled:opacity-0"
                aria-label="Scroll right"
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            {/* Scroll Container */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0 scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {products.map((p, index) => (
                    <div
                        key={p._id || index}
                        className="snap-center shrink-0 w-[80vw] sm:w-[320px] md:w-[260px]"
                    >
                        <ProductCard
                            isPremium={true}
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
                {/* Spacer for right edge on mobile */}
                <div className="w-2 shrink-0 md:hidden" />
            </div>
        </div>
    );
}
