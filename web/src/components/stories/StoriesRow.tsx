"use client";

import { useEffect, useState } from "react";
import StoryViewer from "./StoryViewer";
import Image from "next/image";

interface Story {
    _id: string;
    imageUrl: string;
    caption?: string;
    productId: any;
    userId: string;
    createdAt: string;
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

    if (loading || stories.length === 0) return null;

    return (
        <>
            <section className={`py-8 ${className} animate-in fade-in duration-500`}>
                <div className="container mx-auto px-4 md:px-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">{title}</h3>

                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                        {stories.map((story, index) => (
                            <button
                                key={story._id}
                                onClick={() => setSelectedStoryIndex(index)}
                                className="group relative flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-500 snap-start transition-transform hover:scale-105"
                            >
                                <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white">
                                    <Image
                                        src={story.imageUrl}
                                        alt="Story"
                                        fill
                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {selectedStoryIndex !== null && (
                <StoryViewer
                    stories={stories}
                    initialIndex={selectedStoryIndex}
                    onClose={() => setSelectedStoryIndex(null)}
                />
            )}
        </>
    );
}
