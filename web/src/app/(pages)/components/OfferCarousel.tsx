"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

// Static data
const originalOffers = [
    {
        title: "Men’s Shirts Under ₹999",
        subtitle: "Smart casual shirts for work & weekends",
        image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=800&auto=format&fit=crop",
        link: "/product?gender=men&category=shirts",
    },
    {
        title: "Winter Collection",
        subtitle: "Premium jackets & sweatshirts",
        image: "https://images.unsplash.com/photo-1574784619102-f7e342f21aa0?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        link: "/product?category=Jackets",
    },
    {
        title: "Dark Color Picks",
        subtitle: "Black, charcoal & night-ready fits",
        image: "https://images.unsplash.com/photo-1550614000-4b9519e09d9f?q=80&w=800&auto=format&fit=crop",
        link: "/product?color=Black",
    },
    {
        title: "Premium Styles",
        subtitle: "Elevated fits & finer fabrics",
        image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=800&auto=format&fit=crop",
        link: "/product?sort=price_desc",
    },
];

// 3 Sets for infinite looping (Prev | Current | Next)
const offers = [...originalOffers, ...originalOffers, ...originalOffers];

export default function OfferCarousel() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);

    // Auto-scroll logic
    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let animationFrameId: number;

        // Initial scroll position: Start at the middle set
        // We do this inside a timeout to ensure layout is ready or check if scrollLeft is 0
        const initScroll = () => {
            const oneSetWidth = scrollContainer.scrollWidth / 3;
            if (scrollContainer.scrollLeft < 10) {
                scrollContainer.scrollLeft = oneSetWidth;
            }
        };
        // Run init on mount
        initScroll();

        const animate = () => {
            if (!isPaused) {
                scrollContainer.scrollLeft += 0.8; // Speed of auto-scroll
            }

            // Infinite loop check
            const oneSetWidth = scrollContainer.scrollWidth / 3;

            // If scrolled past the second set (into the third), jump back to first
            if (scrollContainer.scrollLeft >= oneSetWidth * 2) {
                scrollContainer.scrollLeft = oneSetWidth;
            }
            // If scrolled backward past the first set (into "zero"), jump forward to second
            else if (scrollContainer.scrollLeft <= 0) {
                scrollContainer.scrollLeft = oneSetWidth;
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrameId);
    }, [isPaused]);

    return (
        <section className="py-20 bg-white">
            <div className="max-w-[1400px] mx-auto px-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <span className="text-sm font-bold tracking-[6px] text-gray-400 uppercase mb-3 block">
                        Editorial Picks
                    </span>
                    <h2 className="text-4xl md:text-5xl font-serif text-gray-900 tracking-tight">
                        Curated Styles
                    </h2>
                </div>
                <div className="hidden md:flex gap-2">
                    {/* Decorative line or controls could go here */}
                    <div className="h-px w-32 bg-gray-200 self-center"></div>
                </div>
            </div>

            {/* Carousel Container */}
            <div
                className="w-full overflow-hidden"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            >
                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-12 px-6 no-scrollbar"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none'
                    }}
                >
                    {offers.map((offer, index) => (
                        <div
                            key={index}
                            className="snap-center shrink-0 first:pl-2 last:pr-2"
                        >
                            <Link
                                href={offer.link}
                                className="group relative block w-[85vw] md:w-[400px] aspect-[3/4] overflow-hidden rounded-[2rem] shadow-sm transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]"
                                draggable="false"
                            >
                                {/* Image */}
                                <Image
                                    src={offer.image}
                                    alt={offer.title}
                                    fill
                                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                    sizes="(max-width: 768px) 85vw, 400px"
                                    priority={index >= 4 && index < 8} // Prioritize the middle set
                                    draggable="false"
                                />

                                {/* Dark Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

                                {/* Glass Content Box */}
                                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                                    <div className="transform transition-transform duration-500 translate-y-4 group-hover:translate-y-0">

                                        {/* Floating Badge */}
                                        <div className="mb-4 opacity-0 transform -translate-y-4 transition-all duration-500 delay-100 group-hover:opacity-100 group-hover:translate-y-0">
                                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white text-xs font-bold tracking-wider uppercase">
                                                Featured Collection
                                            </span>
                                        </div>

                                        <h3 className="text-3xl font-bold text-white mb-2 leading-tight">
                                            {offer.title}
                                        </h3>
                                        <p className="text-gray-300 text-sm md:text-base font-medium mb-6 line-clamp-2 opacity-90">
                                            {offer.subtitle}
                                        </p>

                                        {/* CTA Button */}
                                        <div className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full text-sm font-bold tracking-wide transition-all duration-300 hover:bg-gray-100 hover:gap-3">
                                            SHOP NOW
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

