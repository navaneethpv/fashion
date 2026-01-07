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
    }, []);

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

                    {/* Editorial Header */}
                    <div className="mb-10 pl-1">
                        <h3 className="font-serif text-3xl md:text-4xl text-gray-900 mb-2 tracking-tight">
                            {title}
                        </h3>
                        <p className="text-gray-500 text-sm md:text-base tracking-wide font-light">
                            Real looks from verified Eyoris buyers
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
                                        <Image
                                            src={story.imageUrl}
                                            alt={`Styled by ${displayName}`}
                                            fill
                                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                        />

                                        {/* Subtle Overlay on Hover */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                                    </div>

                                    {/* Editorial Label */}
                                    <div className="pl-1 space-y-0.5">
                                        <h4 className="text-sm font-medium text-gray-900">
                                            {displayName}
                                        </h4>
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide opacity-80">
                                            Wearing Eyoris
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
                                <h4 className="font-serif text-xl text-gray-900 mb-2">
                                    Share your style
                                </h4>
                                <p className="text-sm text-gray-500 font-light leading-relaxed mb-6">
                                    Verified buyers can add their look after delivery
                                </p>
                                <span className="text-sm border-b border-gray-900 pb-0.5 group-hover:opacity-70 transition-opacity">
                                    Upload your story &rarr;
                                </span>
                            </div>
                            {/* Spacer for label alignment */}
                            <div className="pl-1 space-y-0.5 opacity-0">
                                <h4 className="text-sm font-medium">Placeholder</h4>
                                <p className="text-xs">Wearing Eyoris</p>
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
