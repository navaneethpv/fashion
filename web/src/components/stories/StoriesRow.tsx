"use client";

import { useEffect, useState } from "react";
import ProductSpotlight from "./ProductSpotlight";
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
    };
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
                let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/stories`;
                if (productId) {
                    url += `?productId=${productId}`;
                }

                const res = await fetch(url);
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
            <section className={`py-6 md:py-8 ${className} animate-in fade-in duration-700`}>
                <div className="container mx-auto px-4 md:px-8">
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-6 tracking-tight">{title}</h3>

                    <div className="flex gap-5 overflow-x-auto pb-6 -mb-4 scrollbar-hide snap-x px-1">
                        {stories.map((story, index) => {
                            const isViewed = viewedStories.has(story._id);
                            // Fallback name logic if backend doesn't provide user info
                            const displayName = story.user?.firstName || `Buyer`;

                            return (
                                <button
                                    key={story._id}
                                    onClick={() => handleStoryClick(index, story._id)}
                                    className="group flex flex-col items-center gap-2 flex-shrink-0 snap-start focus:outline-none"
                                >
                                    {/* Story Ring Container */}
                                    <div className={clsx(
                                        "relative w-[72px] h-[72px] md:w-[84px] md:h-[84px] rounded-full p-[3px] transition-transform duration-300 ease-out group-hover:scale-105",
                                        isViewed
                                            ? "bg-gray-200"
                                            : "bg-gradient-to-tr from-yellow-400 via-orange-500 to-pink-500 shadow-sm group-hover:shadow-pink-500/30"
                                    )}>
                                        {/* Inner White Border & Image */}
                                        <div className="relative w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                                            <Image
                                                src={story.imageUrl}
                                                alt={`Story by ${displayName}`}
                                                fill
                                                className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        </div>
                                    </div>

                                    {/* User Name */}
                                    <span className={clsx(
                                        "text-xs font-medium text-center truncate w-16 md:w-20 transition-colors",
                                        isViewed ? "text-gray-400" : "text-gray-700 Group-hover:text-black"
                                    )}>
                                        {displayName}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {selectedStoryIndex !== null && (
                <ProductSpotlight
                    story={stories[selectedStoryIndex]}
                    onClose={() => setSelectedStoryIndex(null)}
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
