"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, ChevronRight, ShoppingBag } from "lucide-react";
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
    };
}

interface ProductSpotlightProps {
    story: Story;
    onClose: () => void;
    onNext?: () => void;
    onPrev?: () => void;
}

export default function ProductSpotlight({ story, onClose, onNext, onPrev }: ProductSpotlightProps) {
    // Construct the "Playlist" of views: [Styled Image, Main Product Image, ...Other Images]
    const productImages = story.productId.images || [];

    // Helper to get URL string whether it's an object or string
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

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") onNext?.();
            if (e.key === "ArrowLeft") onPrev?.();
            if (e.key === "ArrowUp") setActiveViewIndex(prev => Math.max(0, prev - 1));
            if (e.key === "ArrowDown") setActiveViewIndex(prev => Math.min(views.length - 1, prev + 1));
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose, onNext, onPrev, views.length]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">

            {/* 1. Header: Context & Close */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs font-semibold text-white tracking-wide uppercase">Verified Purchase</span>
                    </div>
                    <span className="text-xs text-white/50 font-medium">
                        Order #{(story as any).orderId?.slice(-6).toUpperCase() || "8392A1"}
                    </span>
                </div>

                <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* 2. Main Stage */}
            <div className="relative w-full h-full max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 p-4 md:p-12">

                {/* Central visual */}
                <div className="relative w-full max-w-lg aspect-[3/4] md:aspect-[4/5] flex-shrink-0">
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
                <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-3 z-30">
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
            <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 w-[90%] md:w-auto z-30">
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
                            <span className="text-sm font-semibold text-gray-900">
                                ₹{(story.productId.price / 100).toLocaleString('en-IN')}
                            </span>
                            {/* Show saved amount if applicable could go here */}
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
