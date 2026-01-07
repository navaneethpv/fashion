"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, ChevronRight, ChevronLeft, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

interface Story {
    _id: string;
    imageUrl: string;
    caption?: string;
    productId: any;
    userId: string;
    createdAt: string;
    user?: {
        firstName?: string;
        lastName?: string;
    };
}

interface ProductSpotlightProps {
    story: Story;
    onClose: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    hasNext?: boolean;
    hasPrev?: boolean;
}

export default function ProductSpotlight({ story, onClose, onNext, onPrev, hasNext, hasPrev }: ProductSpotlightProps) {
    // Construct the "Playlist" of views: [Styled Image, Main Product Image, ...Other Images]
    const productImages = story.productId.images || [];

    // Helper to get URL string
    const getImgUrl = (img: any) => (typeof img === 'string' ? img : img?.url || "");

    const views = [
        { type: 'styled', url: story.imageUrl, label: 'Styled by Verified Buyer' },
        ...productImages.slice(0, 3).map((img: any, i: number) => ({
            type: 'product',
            url: getImgUrl(img),
            label: i === 0 ? 'Official Look' : 'Detail View'
        }))
    ];

    const [activeViewIndex, setActiveViewIndex] = useState(0);
    const activeView = views[activeViewIndex];
    const [isPaused, setIsPaused] = useState(false);

    // Timeline Logic
    // Using simple CSS animation via keyframes isn't easy to reset from JS without removing valid DOM.
    // Using standard requestAnimationFrame or standard React state is safer for explicit control.
    // Requirement: 15s duration.
    const DURATION = 15000;

    // We use key props on the component itself (in parent) to reset state completely on story switch.
    // So we just need a simple onMount timer here.

    // However, we need to support "Pause".
    // Let's use a CSS animation approach for the visual bar because it handles "pause" property natively and smoothly.
    // But we also need an actual timer to trigger the close.
    // Syncing JS timer + CSS animation is tricky if paused.

    // Better approach: JS sets the progress, requestAnimationFrame updates it.
    const [progress, setProgress] = useState(0);
    const lastTimeRef = useRef<number | null>(null);

    useEffect(() => {
        let animationFrameId: number;

        const animate = (time: number) => {
            if (!isPaused) {
                if (lastTimeRef.current === null) {
                    lastTimeRef.current = time;
                }
                const delta = time - lastTimeRef.current;
                // If we paused, delta would be huge on resume if we didn't reset lastTime.
                // Actually, we should accumulate elapsed time.

                // Simpler: Just track 'elapsed'.
            }
            animationFrameId = requestAnimationFrame(animate);
        };
        // cancelAnimationFrame(animationFrameId);

        // Let's go with a simpler interval approach for 15s, it's fine for this UI.
        // 15 seconds / 100 steps = 150ms per step.
        // Or 60fps.
    }, [isPaused]); // This is getting complicated.

    // SIMPLIFIED TIMELINE:
    // Using CSS animation for the visual bar is robust. 
    // For the actual logic, we can listen to `onAnimationEnd` of the visual bar!

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight" && hasNext) onNext?.();
            if (e.key === "ArrowLeft" && hasPrev) onPrev?.();
            if (e.key === "ArrowUp") setActiveViewIndex(prev => Math.max(0, prev - 1));
            if (e.key === "ArrowDown") setActiveViewIndex(prev => Math.min(views.length - 1, prev + 1));
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, onNext, onPrev, views.length, hasNext, hasPrev]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">

            {/* 0. Timeline (Top) */}
            <div className="absolute top-0 left-0 right-0 z-30 flex justify-center pt-2">
                <div
                    className="relative w-full max-w-md h-0.5 bg-gray-800 rounded-full overflow-hidden"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                >
                    <div
                        className="h-full bg-white origin-left"
                        style={{
                            width: '100%',
                            animation: `progress ${DURATION}ms linear forwards`,
                            animationPlayState: isPaused ? 'paused' : 'running'
                        }}
                        onAnimationEnd={onClose}
                    />
                </div>
                <div className="absolute top-4 text-[10px] text-gray-500 font-medium tracking-wide uppercase opacity-0 lg:opacity-60 transition-opacity">
                    Auto-closes in {DURATION / 1000}s
                </div>
            </div>

            <style jsx>{`
        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>

            {/* 1. Header: Context & Close */}
            <div className="absolute top-6 left-0 right-0 z-20 flex items-start justify-between px-6 pointer-events-none">
                <div className="flex flex-col gap-1 pointer-events-auto">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 w-fit">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">Verified Buyer</span>
                    </div>
                    <div className="px-1 filter drop-shadow-md">
                        <span className="text-sm font-medium text-white">
                            {story.user?.firstName || "Shopper"} {story.user?.lastName ? `${story.user.lastName[0]}.` : ""}
                            <span className="opacity-60 mx-1.5">•</span>
                            <span className="opacity-80 text-xs">Order Delivered</span>
                        </span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    aria-label="Close"
                    className="pointer-events-auto p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors border border-white/10 backdrop-blur-md"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* 2. Main Stage */}
            <div
                className="relative w-full h-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 p-4 md:p-12"
            >

                {/* Navigation Arrows */}
                {hasPrev && (
                    <button
                        onClick={onPrev}
                        aria-label="Previous product story"
                        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/5 hover:bg-white/10 hover:scale-110 border border-white/10 text-white backdrop-blur-sm transition-all shadow-lg hidden md:flex"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}

                {hasNext && (
                    <button
                        onClick={onNext}
                        aria-label="Next product story"
                        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 p-3 rounded-full bg-white/5 hover:bg-white/10 hover:scale-110 border border-white/10 text-white backdrop-blur-sm transition-all shadow-lg hidden md:flex"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}

                {/* Central visual */}
                <div
                    className="relative w-full max-w-lg aspect-[3/4] md:aspect-[4/5] flex-shrink-0 group"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeView.url}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0.2 } }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-gray-900"
                        >
                            <Image
                                src={activeView.url}
                                alt={activeView.label}
                                fill
                                className="object-cover"
                                priority
                            />

                            {/* View Label Badge */}
                            <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                                    {activeView.label}
                                </span>
                            </div>

                            {/* Caption (Only for styled view) */}
                            {activeView.type === 'styled' && story.caption && (
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-20">
                                    <p className="text-white text-sm md:text-base font-medium italic text-center leading-relaxed opacity-90">
                                        "{story.caption}"
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* 3. Vertical Rail (Desktop) / Horizontal Rail (Mobile) */}
                <div className="absolute right-24 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-3 z-30">
                    {views.map((view, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveViewIndex(idx)}
                            className={clsx(
                                "relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all duration-300",
                                activeViewIndex === idx
                                    ? "border-white scale-110 shadow-lg shadow-white/20"
                                    : "border-transparent opacity-50 hover:opacity-100 hover:scale-105"
                            )}
                        >
                            <Image src={view.url} alt="Thumbnail" fill className="object-cover" />
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. Persistent Product Card (Footer) */}
            <div
                className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 w-[90%] md:w-auto z-30"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <div className="flex items-center gap-4 p-2 pr-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 border border-white/20 md:min-w-[360px]">
                    {/* Thumbnail */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                        <Image
                            src={getImgUrl(story.productId.images?.[0])}
                            alt={story.productId.name}
                            fill
                            className="object-cover"
                        />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm truncate">{story.productId.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex flex-col">
                                {/* Price Display v2 */}
                                <span className="text-sm font-semibold text-gray-900 leading-none">
                                    ₹{(Number(story.productId.price_cents ?? story.productId.price) / 100).toLocaleString('en-IN')}
                                </span>
                                {story.productId.price_before_cents && Number(story.productId.price_before_cents) > 0 && (
                                    <span className="text-[10px] text-gray-400 line-through">
                                        ₹{(Number(story.productId.price_before_cents) / 100).toLocaleString('en-IN')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action */}
                    <Link
                        href={`/products/${story.productId.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-gray-800 transition-colors shadow-lg shadow-black/20"
                    >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>View</span>
                    </Link>
                </div>
            </div>

        </div>
    );
}
