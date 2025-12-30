"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

// Static data (Fallback)
const originalOffers = [
    {
        title: "Men’s Shirts Under ₹999",
        subtitle: "Smart casual shirts for work & weekends",
        image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=800&auto=format&fit=crop",
        link: "/product?gender=men&category=shirts&maxPrice=999",
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
        image: "https://images.unsplash.com/photo-1759772238511-61d666754843?q=80&w=709&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        link: "/product?color=Black",
    },
    {
        title: "Premium Styles",
        subtitle: "Elevated fits & finer fabrics",
        image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=800&auto=format&fit=crop",
        link: "/product?sort=price_desc",
    },
];

interface OfferCarouselProps { }

export default function OfferCarousel() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);

    // Prepare data
    const baseOffers = originalOffers;

    // 5 Sets for infinite looping
    const offers = [...baseOffers, ...baseOffers, ...baseOffers, ...baseOffers, ...baseOffers];

    // Auto-scroll logic
    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let animationFrameId: number;

        // Initial scroll position: Start at the middle set (Set 3 of 5)
        const initScroll = () => {
            const oneSetWidth = scrollContainer.scrollWidth / 5;
            if (scrollContainer.scrollLeft < 10) {
                scrollContainer.scrollLeft = oneSetWidth * 2;
            }
        };
        // Run init on mount
        initScroll();

        const animate = () => {
            if (!isPaused) {
                scrollContainer.scrollLeft += 1.5; // Speed of auto-scroll
            }

            // Infinite loop check
            const oneSetWidth = scrollContainer.scrollWidth / 5;

            // If scrolled past the 3rd set (into the 4th start), jump back to 2nd set (middle - 1)
            // Ideally jump to logically equivalent position.
            // Center is Set 3 (index 2).
            // Jump from Set 4 (index 3) to Set 3 (index 2)? No, jump to Set 3.

            // Logic:
            // [0] [1] [2] [3] [4]
            // We start at [2].
            // If we hit Start of [4], jump to Start of [3]?
            // No, strictly:
            // If scrollLeft >= oneSetWidth * 3 (Start of Set 4) -> jump to oneSetWidth * 2 (Start of Set 3)
            // If scrollLeft <= oneSetWidth (Start of Set 2) -> jump to oneSetWidth * 2 (Start of Set 3)

            if (scrollContainer.scrollLeft >= oneSetWidth * 3) {
                scrollContainer.scrollLeft = scrollContainer.scrollLeft - oneSetWidth;
            }
            else if (scrollContainer.scrollLeft <= oneSetWidth) {
                scrollContainer.scrollLeft = scrollContainer.scrollLeft + oneSetWidth;
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrameId);
    }, [isPaused]);

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="py-20 bg-white"
        >
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
                className="w-full relative group"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            >
                {/* Left Gradient Mask */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Right Gradient Mask */}
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Navigation Buttons */}
                <button
                    onClick={() => {
                        if (scrollRef.current) {
                            scrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
                        }
                    }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center shadow-lg text-gray-900 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white inset-y-0 my-auto"
                >
                    <ChevronRight className="w-6 h-6 rotate-180" />
                </button>

                <button
                    onClick={() => {
                        if (scrollRef.current) {
                            scrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
                        }
                    }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-md border border-white/40 rounded-full flex items-center justify-center shadow-lg text-gray-900 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white inset-y-0 my-auto"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>

                <div
                    ref={scrollRef}
                    className={`flex gap-6 overflow-x-auto pb-12 px-6 no-scrollbar ${isPaused ? 'snap-x snap-mandatory' : ''}`}
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
        </motion.section>
    );
}

