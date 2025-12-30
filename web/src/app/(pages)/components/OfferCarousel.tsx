"use client";

import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

// Static data as requested
const offers = [
    {
        title: "Men’s Shirts Under ₹999",
        subtitle: "Smart casual shirts for work & weekends",
        image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=800&auto=format&fit=crop",
        link: "/product?gender=men&category=shirts",
    },
    {
        title: "Winter Collection",
        subtitle: "Premium jackets & sweatshirts",
        image: "https://images.unsplash.com/photo-1551028919-ac7675cf5c63?q=80&w=800&auto=format&fit=crop",
        link: "/product?category=Jackets",
    },
    {
        title: "Dark Color Picks",
        subtitle: "Black, charcoal & night-ready fits",
        image: "https://images.unsplash.com/photo-1483118714900-540cf339fd63?q=80&w=800&auto=format&fit=crop",
        link: "/product?colors=Black",
    },
    {
        title: "Premium Styles",
        subtitle: "Elevated fits & finer fabrics",
        image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=800&auto=format&fit=crop",
        link: "/product?sort=price_desc",
    },
    // Duplicating for seamless loop
    {
        title: "Men’s Shirts Under ₹999",
        subtitle: "Smart casual shirts for work & weekends",
        image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=800&auto=format&fit=crop",
        link: "/product?gender=men&category=shirts",
    },
    {
        title: "Winter Collection",
        subtitle: "Premium jackets & sweatshirts",
        image: "https://images.unsplash.com/photo-1551028919-ac7675cf5c63?q=80&w=800&auto=format&fit=crop",
        link: "/product?category=Jackets",
    },
    {
        title: "Dark Color Picks",
        subtitle: "Black, charcoal & night-ready fits",
        image: "https://images.unsplash.com/photo-1483118714900-540cf339fd63?q=80&w=800&auto=format&fit=crop",
        link: "/product?colors=Black",
    },
    {
        title: "Premium Styles",
        subtitle: "Elevated fits & finer fabrics",
        image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=800&auto=format&fit=crop",
        link: "/product?sort=price_desc",
    },
];

export default function OfferCarousel() {
    const controls = useAnimationControls();
    const [isPaused, setIsPaused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let animation: any;

        const startAnimation = () => {
            animation = controls.start({
                x: ["0%", "-50%"],
                transition: {
                    ease: "linear",
                    duration: 10, // Adjust speed here
                    repeat: Infinity,
                },
            });
        };

        if (!isPaused) {
            startAnimation();
        } else {
            controls.stop();
        }

        return () => {
            // Cleanup not strictly necessary for simple framer motion but good practice
        };
    }, [controls, isPaused]);

    return (
        <section className="py-16 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 mb-10">
                <span className="text-xs uppercase tracking-[4px] text-gray-500 font-bold">
                    Shop by Mood
                </span>
                <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mt-2">
                    Curated offers for how you dress today
                </h2>
            </div>

            <div
                className="w-full relative"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            >
                <motion.div
                    className="flex gap-6 w-max pl-6"
                    animate={controls}
                    ref={containerRef}
                    style={{ width: "max-content" }}
                    drag="x"
                    dragConstraints={containerRef} // Simple drag constraints
                    whileTap={{ cursor: "grabbing" }}
                >
                    {offers.map((offer, index) => (
                        <Link
                            key={index} // Using index because of duplication
                            href={offer.link}
                            className="relative group w-[280px] h-[380px] md:w-[320px] md:h-[420px] flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                        >
                            {/* Background Image using next/image */}
                            <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-110">
                                <Image
                                    src={offer.image}
                                    alt={offer.title}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    priority={index < 4}
                                />
                            </div>

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90" />

                            {/* Content */}
                            <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                {/* Badge */}
                                <div className="self-start">
                                    <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                        Limited Time
                                    </span>
                                </div>

                                {/* Text & CTA */}
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                                        {offer.title}
                                    </h3>
                                    <p className="text-sm text-gray-300 mb-6 line-clamp-2">
                                        {offer.subtitle}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-medium text-white/80 group-hover:text-white transition-colors">
                                            View curated styles <ChevronRight className="w-3 h-3" />
                                        </div>

                                        <button className="bg-white text-black text-xs font-bold px-5 py-2.5 rounded-full hover:bg-gray-200 transition-colors shadow-lg hover:shadow-white/20 flex items-center gap-1">
                                            SHOP NOW
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
