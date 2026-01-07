"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, User } from "lucide-react";
import Image from "next/image";
import StoryProgress from "./StoryProgress";
import StoryCTA from "./StoryCTA";

interface Story {
    _id: string;
    imageUrl: string;
    caption?: string;
    productId: any; // Populated product
    userId: string;
    createdAt: string;
}

interface StoryViewerProps {
    stories: Story[];
    initialIndex?: number;
    onClose: () => void;
}

export default function StoryViewer({ stories, initialIndex = 0, onClose }: StoryViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isPaused, setIsPaused] = useState(false);

    const currentStory = stories[currentIndex];
    const STORY_DURATION = 5000;

    // Handle navigation
    const nextStory = useCallback(() => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        } else {
            onClose();
        }
    }, [currentIndex, stories.length, onClose]);

    const prevStory = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    }, [currentIndex]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") nextStory();
            if (e.key === "ArrowLeft") prevStory();
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [nextStory, prevStory, onClose]);

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
            {/* Background Blur (Desktop) */}
            <div className="absolute inset-0 hidden sm:block opacity-30">
                <Image
                    src={currentStory.imageUrl}
                    alt="Blur"
                    fill
                    className="object-cover blur-3xl"
                />
            </div>

            {/* Main Container - Mobile Dimensions on Desktop */}
            <div
                className="relative w-full h-full sm:w-[400px] sm:h-[90vh] sm:rounded-2xl overflow-hidden bg-black shadow-2xl"
                onMouseDown={() => setIsPaused(true)}
                onMouseUp={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            >
                {/* Progress Bars */}
                <StoryProgress
                    activeIndex={currentIndex}
                    total={stories.length}
                    duration={STORY_DURATION}
                    onComplete={nextStory}
                    isPaused={isPaused}
                    current={currentIndex} // Just for key re-triggering implicitly
                />

                {/* Header (User Info + Close) */}
                <div className="absolute top-8 left-0 right-0 z-20 px-4 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                            <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h4 className="text-white text-sm font-bold shadow-black drop-shadow-md">Verified Buyer</h4>
                            <span className="text-white/70 text-[10px] uppercase font-medium">Wearing Eyoris</span>
                        </div>
                    </div>

                    {/* Close Button (Enable Pointer Events) */}
                    <button
                        onClick={onClose}
                        className="pointer-events-auto p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-white drop-shadow-md" />
                    </button>
                </div>

                {/* Content Layer (Image + Caption) */}
                <div className="absolute inset-0 z-0">
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={currentStory._id}
                            initial={{ opacity: 0.5, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className="relative w-full h-full"
                        >
                            <Image
                                src={currentStory.imageUrl}
                                alt="Story"
                                fill
                                className="object-cover"
                                priority
                            />

                            {/* Caption Overlay */}
                            {currentStory.caption && (
                                <div className="absolute bottom-28 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-10 pb-4 px-4">
                                    <p className="text-white text-sm font-medium text-center italic">
                                        "{currentStory.caption}"
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Touch Navigation Zones */}
                <div className="absolute inset-0 z-10 flex">
                    <div className="w-1/3 h-full" onClick={prevStory} />
                    <div className="w-2/3 h-full" onClick={nextStory} />
                </div>

                {/* Product CTA */}
                {currentStory.productId && (
                    <StoryCTA
                        product={currentStory.productId}
                        onNavigate={onClose}
                    />
                )}
            </div>
        </div>
    );
}
