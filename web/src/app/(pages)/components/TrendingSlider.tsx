"use client";

import ProductCard from "./ProductCard";

interface TrendingSliderProps {
    products: any[];
}

export default function TrendingSlider({ products }: TrendingSliderProps) {
    if (!products || products.length === 0) return null;

    return (
        <div
            className="flex gap-4 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            {products.map((p, index) => (
                <div
                    key={p._id || index}
                    className="snap-center shrink-0 w-[80vw] sm:w-[320px] md:w-[280px]"
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
    );
}
