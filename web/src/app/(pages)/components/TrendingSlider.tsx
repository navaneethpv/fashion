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
            const scrollAmount = 400;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (!products || products.length === 0) return null;

    return (
        <div className="relative group">
            {/* Minimal Header (Embedded in component for autonomy) */}
            <div className="mb-12 text-center">
                <h3 className="text-3xl md:text-4xl font-serif text-gray-900 mb-2">Curated for You</h3>
                <p className="text-gray-500 text-sm tracking-wider uppercase">Best of the Season</p>
            </div>

            {/* Left Button */}
            <button
                onClick={() => scroll('left')}
                className="hidden md:flex absolute -left-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center text-gray-400 hover:text-black transition-colors disabled:opacity-0"
                aria-label="Scroll left"
            >
                <ChevronLeft className="w-8 h-8 font-light" strokeWidth={1} />
            </button>

            {/* Right Button */}
            <button
                onClick={() => scroll('right')}
                className="hidden md:flex absolute -right-8 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center text-gray-400 hover:text-black transition-colors disabled:opacity-0"
                aria-label="Scroll right"
            >
                <ChevronRight className="w-8 h-8 font-light" strokeWidth={1} />
            </button>

            {/* Scroll Container */}
            <div
                ref={scrollRef}
                className="flex gap-8 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0 scroll-smooth items-stretch"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {products.map((p, index) => (
                    <div
                        key={p._id || index}
                        className="snap-center shrink-0 w-[80vw] sm:w-[300px] md:w-[340px]"
                    >
                        <ProductCard
                            isPremium={true} // Using existing premium card logic, ensuring it matches
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
        </div>
    );
}
