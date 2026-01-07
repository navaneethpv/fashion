"use client";

import { Sparkles, Camera } from "lucide-react";

export default function SocialFeaturesNotice() {
    return (
        <section className="container mx-auto px-6 py-12 md:py-16">
            <div className="bg-neutral-50 rounded-3xl p-8 md:p-12 border border-neutral-100 flex flex-col md:flex-row items-center gap-10 md:gap-16">

                {/* Content Side */}
                <div className="flex-1 space-y-6 text-center md:text-left">
                    <div className="space-y-3">
                        <span className="text-[10px] font-bold tracking-[0.25em] text-neutral-400 uppercase block">
                            New Social Features
                        </span>
                        <h2 className="font-serif text-3xl md:text-4xl text-neutral-900 leading-tight">
                            See real styles. <br className="hidden md:block" />
                            Measure your confidence.
                        </h2>
                        <p className="text-neutral-500 font-light text-base md:text-lg max-w-xl leading-relaxed">
                            Explore real looks shared by verified buyers and
                            see how confidently each style matches the product.
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 md:gap-12 pt-4">
                        <div className="flex flex-col items-center md:items-start gap-2">
                            <div className="flex items-center gap-2 text-neutral-900 font-medium">
                                <div className="p-1.5 bg-white rounded-md shadow-sm border border-neutral-100">
                                    <Camera className="w-4 h-4" />
                                </div>
                                <span>Customer Stories</span>
                            </div>
                            <p className="text-xs text-neutral-400 pl-9 max-w-[200px] text-center md:text-left">
                                Available on delivered orders
                            </p>
                        </div>

                        <div className="flex flex-col items-center md:items-start gap-2">
                            <div className="flex items-center gap-2 text-neutral-900 font-medium">
                                <div className="p-1.5 bg-white rounded-md shadow-sm border border-neutral-100">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <span>Style Confidence Score</span>
                            </div>
                            <p className="text-xs text-neutral-400 pl-9 max-w-[240px] text-center md:text-left">
                                Calculated from fit, match & consistency
                            </p>
                        </div>
                    </div>
                </div>

                {/* Visual / Branding Side (Subtle) */}
                <div className="hidden md:flex flex-shrink-0 relative">
                    <div className="w-px h-32 bg-gradient-to-b from-transparent via-neutral-200 to-transparent" />
                </div>

                <div className="hidden md:block text-right">
                    <p className="font-serif text-9xl text-neutral-200/50 leading-none select-none">
                        &
                    </p>
                </div>
            </div>
        </section>
    );
}
