"use client";

import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

// Static data as requested
// Static data as requested
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
        image: "https://images.unsplash.com/photo-1550614000-4b9519e09d9f?q=80&w=800&auto=format&fit=crop", // Replaced with reliable dark theme image
        link: "/product?color=Black",
    },
    {
        title: "Premium Styles",
        subtitle: "Elevated fits & finer fabrics",
        image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=800&auto=format&fit=crop",
        link: "/product?sort=price_desc",
    },
];

// Triple buffer for seamless looping (Start -> Middle -> End)
const offers = [...originalOffers, ...originalOffers, ...originalOffers];

export default function OfferCarousel() {
    const [width, setWidth] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const controls = useAnimationControls();
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (scrollRef.current) {
            // Measure the total scrollable width and divide by 3 (since we have 3 sets)
            // This gives us the exact length of one original set including gaps
            const totalWidth = scrollRef.current.scrollWidth;
            setWidth(totalWidth / 3);
        }
    }, []);

    useEffect(() => {
        if (width > 0) {
            controls.start({
                x: -width,
                transition: {
                    duration: 20, // Adjust speed here (seconds for one full loop of the original set)
                    ease: "linear",
                    repeat: Infinity,
                    repeatType: "loop",
                },
            });
        }
    }, [width, controls]);

    // Handle pause/resume
    useEffect(() => {
        if (isPaused) {
            controls.stop();
        } else {
            if (width > 0) {
                // Must resume from current position logic is tricky with simple declative animate.
                // However, Framer Motion's simple 'animate' prop handles this if we just re-run it?
                // Actually, 'controls.stop()' stops it in place. 'controls.start' restarts.
                // For a true pause/resume without jumping reset, we generally need more complex handling
                // or just accept the jump, or use 'animation-play-state' via CSS, or
                // use motion value listeners.
                //
                // SIMPLEST ROBUST FIX:
                // Instead of controls.stop(), we can just use the hover to set duration to huge or 
                // use a motionValue x and manually step it? No.
                // 
                // Let's try the simple re-start approach first. If it resets, we might need a better trick.
                // Actually, framer-motion `stop` freezes it. `start` will start from current `x`?
                // No, `start` with a target will animate FROM current to target.
                // If we want it to be seamless loop, we need to animate to -width.

                controls.start({
                    x: -width,
                    transition: {
                        duration: 20, // This needs to be calculated based on remaining distance to keep speed constant
                        ease: "linear",
                        repeat: Infinity,
                        repeatType: "loop",
                    },
                });
            }
        }
    }, [isPaused, width, controls]);

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
                {/* Mask container to hide overflow */}
                <div className="overflow-hidden">
                    <motion.div
                        ref={scrollRef}
                        className="flex gap-6 w-max px-6" // w-max ensures it takes full horizontal width
                        initial={{ x: 0 }}
                        animate={controls}
                    >
                        {offers.map((offer, index) => (
                            <Link
                                key={index}
                                href={offer.link}
                                className="relative group w-[280px] h-[380px] md:w-[320px] md:h-[420px] flex-shrink-0 cursor-pointer overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300"
                                draggable="false"
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
                                        draggable="false"
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
            </div>
        </section>
    );
}

