"use client";

import { useEffect, useState } from "react";
import ProductSpotlight from "./ProductSpotlight";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
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
    hasLiked?: boolean;
}

interface StoriesRowProps {
    productId?: string;
    title?: string;
    className?: string;
}

export default function StoriesRow({ productId, title = "Styled by Customers", className = "" }: StoriesRowProps) {
    const [stories, setStories] = useState<Story[]>([]);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewedStories, setViewedStories] = useState<Set<string>>(new Set());
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        // Load viewed stories from local storage
        const stored = localStorage.getItem("viewedStoryIds");
        if (stored) {
            try {
                setViewedStories(new Set(JSON.parse(stored)));
            } catch (e) {
                console.error("Failed to parse viewed stories", e);
            }
        }

        // Check if social guide has been seen
        const guideSeen = localStorage.getItem("socialGuideSeen");
        if (!guideSeen) {
            setShowGuide(true);
        }
    }, []);

    const dismissGuide = () => {
        setShowGuide(false);
        localStorage.setItem("socialGuideSeen", "true");
    };

    useEffect(() => {
        const fetchStories = async () => {
            try {
                let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/stories`;
                if (productId) {
                    url += `?productId=${productId}`;
                }

                console.log("Fetching stories from:", url);
                const res = await fetch(url, { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setStories(data);
                }
            } catch (error) {
                console.error("Failed to fetch stories:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStories();
    }, [productId]);

    const handleStoryClick = (index: number, storyId: string) => {
        setSelectedStoryIndex(index);

        // Mark as viewed
        if (!viewedStories.has(storyId)) {
            const newViewed = new Set(viewedStories);
            newViewed.add(storyId);
            setViewedStories(newViewed);
            localStorage.setItem("viewedStoryIds", JSON.stringify(Array.from(newViewed)));
        }
    };

    // Skeleton Loader
    if (loading) {
        return (
            <section className={`py-6 md:py-8 ${className}`}>
                <div className="container mx-auto px-4 md:px-8">
                    <div className="h-6 w-48 bg-gray-100 rounded-md mb-6 animate-pulse" />
                    <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-100 animate-pulse" />
                                <div className="w-12 h-3 bg-gray-100 rounded-md animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (stories.length === 0) {
        return (
            <section className={`py-8 ${className} animate-in fade-in`}>
                <div className="container mx-auto px-4 md:px-8">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-6">{title}</h3>
                    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 text-gray-300">
                            <Plus className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">No stories yet</p>
                        <p className="text-xs text-gray-500 mt-1">Be the first to share your style!</p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <>
            <section className={`py-12 md:py-16 ${className} animate-in fade-in duration-700`}>
                <div className="container mx-auto px-4 md:px-8">

                    {/* Social Features Guide (First-time only) */}
                    <AnimatePresence>
                        {showGuide && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-neutral-50/80 border border-neutral-200/60 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
                                    <div className="space-y-3 max-w-2xl">
                                        <div className="flex items-center gap-2">
                                            <span className="px-1.5 py-0.5 bg-white border border-neutral-200 rounded text-[9px] font-bold text-neutral-500 uppercase tracking-wide shadow-sm">
                                                New
                                            </span>
                                            <h4 className="font-serif text-lg text-neutral-900">
                                                Join the Style Community
                                            </h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-500 leading-relaxed font-light">
                                            <div>
                                                <strong className="text-neutral-900 font-medium block mb-0.5">How to share your look</strong>
                                                Verified buyers can upload a photo from <span className="text-neutral-800 underline decoration-dotted underline-offset-2">Order History</span> after delivery.
                                            </div>
                                            <div>
                                                <strong className="text-neutral-900 font-medium block mb-0.5">Why it matters</strong>
                                                Your stories help calculate the <span className="text-neutral-800">Style Confidence Score</span>, helping others verify fit & quality.
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={dismissGuide}
                                        className="absolute top-4 right-4 md:static md:flex-shrink-0 px-4 py-2 text-xs font-bold uppercase tracking-widest text-neutral-900 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors shadow-sm"
                                        aria-label="Dismiss guide"
                                    >
                                        Got it
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Editorial Header */}
                    <div className="mb-10 pl-1">
                        <h3 className="font-serif text-3xl md:text-3xl text-gray-900 mb-2 tracking-tight">
                            {title}
                        </h3>
                        <p className="text-gray-500 text-sm tracking-wide font-light">
                            Real outfits worn after delivery
                        </p>
                    </div>

                    {/* Lookbook Scroll */}
                    <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 md:px-0 md:-mx-0 scrollbar-hide snap-x">
                        {stories.map((story, index) => {
                            // Name Formatting: First Name + Last Initial
                            const firstName = story.user?.firstName || "Shopper";
                            const lastInitial = story.user?.lastName ? `${story.user.lastName[0]}.` : "";
                            const displayName = `${firstName} ${lastInitial}`;

                            return (
                                <button
                                    key={story._id}
                                    onClick={() => handleStoryClick(index, story._id)}
                                    className="group relative flex flex-col flex-shrink-0 w-[200px] md:w-[240px] text-left focus:outline-none snap-start"
                                >
                                    {/* Portrait Card */}
                                    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 mb-4 shadow-sm transition-shadow duration-300 group-hover:shadow-md">

                                        {/* Visual Progress Ring Hint (Static for feed) */}
                                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full border border-white/30 p-0.5 opacity-80">
                                            <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 24 24">
                                                <circle className="text-transparent" strokeWidth="2" stroke="currentColor" fill="transparent" r="10" cx="12" cy="12" />
                                                <circle className="text-white" strokeWidth="2" strokeDasharray={60} strokeDashoffset={15} strokeLinecap="round" stroke="currentColor" fill="transparent" r="10" cx="12" cy="12" />
                                            </svg>
                                        </div>

                                        <Image
                                            src={story.imageUrl}
                                            alt={`Styled by ${displayName}`}
                                            fill
                                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                        />

                                        {/* Subtle Overlay on Hover */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                            <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-medium tracking-wide translate-y-2 group-hover:translate-y-0 transition-all duration-300 px-4 text-center">
                                                Used to improve Style Confidence
                                            </span>
                                        </div>
                                    </div>

                                    {/* Editorial Label */}
                                    <div className="pl-1 space-y-0.5">
                                        <h4 className="text-sm font-medium text-gray-900">
                                            {displayName}
                                        </h4>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest flex items-center gap-1">
                                            Verified Buyer
                                        </p>
                                    </div>
                                </button>
                            );
                        })}

                        {/* Editorial Empty State / CTA Card */}
                        <Link
                            href="/profile"
                            className="group relative flex flex-col flex-shrink-0 w-[200px] md:w-[240px] text-left focus:outline-none snap-start"
                        >
                            <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-gray-50 border border-dashed border-gray-300 flex flex-col items-center justify-center p-6 text-center transition-all duration-300 group-hover:bg-gray-100 group-hover:border-gray-400">
                                <h4 className="font-serif text-lg text-gray-900 mb-2">
                                    Your look could inspire others
                                </h4>
                                <span className="text-sm border-b border-gray-900 pb-0.5 group-hover:opacity-70 transition-opacity mt-4 inline-block">
                                    Upload your story &rarr;
                                </span>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {selectedStoryIndex !== null && (
                <ProductSpotlight
                    key={stories[selectedStoryIndex]._id}
                    story={stories[selectedStoryIndex]}
                    onClose={() => setSelectedStoryIndex(null)}
                    hasNext={selectedStoryIndex < stories.length - 1}
                    hasPrev={selectedStoryIndex > 0}
                    onNext={() => {
                        if (selectedStoryIndex < stories.length - 1) {
                            setSelectedStoryIndex(selectedStoryIndex + 1);
                        }
                    }}
                    onPrev={() => {
                        if (selectedStoryIndex > 0) {
                            setSelectedStoryIndex(selectedStoryIndex - 1);
                        }
                    }}
                />
            )}
        </>
    );
}
