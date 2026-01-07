"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, Star, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductSpotlight from "@/components/stories/ProductSpotlight";

export default function EditorialFeatureSection() {
    const [activeStory, setActiveStory] = useState<any | null>(null);
    const [showScoreModal, setShowScoreModal] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);

    // Fetch one recent approved story for the preview
    useEffect(() => {
        const fetchHighlightStory = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/stories?limit=1`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        setActiveStory(data[0]);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch highlight story", e);
            }
        };
        fetchHighlightStory();
    }, []);

    // Placeholder if no story exists
    const renderEmptyStory = () => (
        <div className="w-full h-full border border-dashed border-gray-300 rounded-[2rem] flex flex-col items-center justify-center text-center p-8 bg-neutral-50/50">
            <h4 className="font-serif text-2xl text-gray-900 mb-2">
                Your style could be here.
            </h4>
            <p className="text-sm text-gray-500 font-light mb-6 max-w-[200px]">
                Verified buyers can share their look after delivery.
            </p>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-900 border-b border-gray-900 pb-0.5">
                Upload Your Story &rarr;
            </span>
        </div>
    );

    return (
        <section className="container mx-auto px-6 py-20 md:py-24">

            {/* 1. Editoral Header */}
            <div className="text-center mb-16 space-y-4">
                <span className="text-[10px] font-bold tracking-[0.25em] text-gray-400 uppercase block">
                    Community & Style Intelligence
                </span>
                <h2 className="font-serif text-4xl md:text-5xl text-gray-900 leading-tight">
                    Style, Seen Through Real People
                </h2>
                <p className="text-gray-500 font-light text-lg italic">
                    Real looks, real confidence — beyond studio perfection.
                </p>
            </div>

            {/* 2. Two-Panel Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 max-w-5xl mx-auto">

                {/* LEFT PANEL: Stories Gateway */}
                <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.4 }}
                    className="relative w-full aspect-[4/5] md:aspect-[3/4] cursor-pointer group"
                    onClick={() => activeStory && setViewerOpen(true)}
                >
                    {activeStory ? (
                        <>
                            <div className="absolute inset-0 bg-gray-100 rounded-[2rem] overflow-hidden shadow-sm group-hover:shadow-xl transition-shadow duration-500">
                                <Image
                                    src={activeStory.imageUrl}
                                    alt="Customer Story"
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />

                                {/* Overlay Content */}
                                <div className="absolute bottom-0 left-0 right-0 p-8 text-white bg-gradient-to-t from-black/60 to-transparent">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                                            Verified Buyer
                                        </div>
                                    </div>
                                    <h4 className="font-serif text-2xl mb-1">
                                        {activeStory.user?.firstName || "Shopper"}'s Look
                                    </h4>
                                    <p className="text-xs font-medium uppercase tracking-widest opacity-90 mb-6">
                                        Wearing Eyoris
                                    </p>

                                    <div className="flex items-center gap-2 text-sm font-medium hover:underline decoration-white/50 underline-offset-4">
                                        View Stories <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        renderEmptyStory()
                    )}
                </motion.div>

                {/* RIGHT PANEL: Style Confidence Score */}
                <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.4 }}
                    className="relative w-full aspect-[4/5] md:aspect-[3/4] bg-neutral-50 rounded-[2rem] p-10 md:p-12 flex flex-col justify-center items-center text-center cursor-pointer border border-neutral-100 shadow-sm group"
                    onClick={() => setShowScoreModal(true)}
                >
                    <div className="w-full flex-1 flex flex-col items-center justify-center">
                        <span className="font-serif text-7xl md:text-8xl text-gray-900 mb-6 block">
                            82<span className="text-4xl text-gray-300 mx-2">/</span><span className="text-4xl text-gray-400">100</span>
                        </span>

                        <h4 className="font-serif text-2xl text-gray-900 mb-4">
                            Style Confidence Score
                        </h4>

                        <p className="text-gray-500 font-light leading-relaxed max-w-sm mx-auto mb-8">
                            Calculated from real wear, fit accuracy, return behavior, and customer styling.
                        </p>

                        <div className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-900 border-b border-gray-900 pb-0.5 group-hover:opacity-70 transition-opacity">
                            How This Works <Info className="w-4 h-4" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Score Modal */}
            <AnimatePresence>
                {showScoreModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => setShowScoreModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowScoreModal(false)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <h3 className="font-serif text-2xl text-gray-900 mb-4">About Style Confidence</h3>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                We use AI to analyze thousands of data points — from fabric drape and sizing accuracy to customer return rates and review sentiment — to give you an honest reliability score for every item.
                            </p>

                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl">
                                    <div className="bg-white p-2 rounded-full shadow-sm">
                                        <Star className="w-4 h-4 text-black" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-900">Fit Accuracy</h4>
                                        <p className="text-xs text-gray-500">How true to size the item fits based on returns.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl">
                                    <div className="bg-white p-2 rounded-full shadow-sm">
                                        <Image src="/logo.png" width={16} height={16} alt="icon" className="w-4 h-4 opacity-50" />
                                        {/* Using generic icon/placeholder if logo not avail, or generic shape */}
                                        <div className="w-4 h-4 bg-gray-400 rounded-full" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-gray-900">Visual Consistency</h4>
                                        <p className="text-xs text-gray-500">Matches between studio photos and user uploads.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Story Viewer (Gateway Mode) */}
            {viewerOpen && activeStory && (
                <ProductSpotlight
                    story={activeStory}
                    onClose={() => setViewerOpen(false)}
                // Logic to navigate to full stories list could be added here
                // For now, it just opens the single highlight story
                />
            )}
        </section>
    );
}
