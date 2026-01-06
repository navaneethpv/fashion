"use client";

import { Camera, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AIFeatures() {
    const router = useRouter();

    const features = [
        {
            title: "Visual Search",
            description: "Find similar products using a photo",
            icon: <Camera className="w-6 h-6 text-neutral-800" />,
            action: () => router.push("/?visual-search=open"),
        },
        {
            title: "Outfit Generator",
            description: "Get complete outfit ideas instantly",
            icon: <Sparkles className="w-6 h-6 text-neutral-800" />,
            action: () => router.push("/product"), // Navigates to collection for context
        },
    ];

    return (
        <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
            {/* Editorial Header */}
            <div className="flex items-center gap-4 mb-12">
                <div className="h-[1px] flex-1 bg-neutral-100" />
                <h2 className="text-[10px] font-bold tracking-[0.4em] text-neutral-500 uppercase">
                    AI Features
                </h2>
                <div className="h-[1px] flex-1 bg-neutral-100" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {features.map((feature, idx) => (
                    <motion.div
                        key={idx}
                        onClick={feature.action}
                        whileHover={{ y: -1 }}
                        className="group cursor-pointer bg-neutral-100/40 border border-neutral-200/50 hover:bg-neutral-100/80 rounded-3xl p-8 md:p-10 flex flex-col items-center justify-center text-center transition-all duration-300 ease-out shadow-sm shadow-neutral-100/20"
                    >
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform duration-500">
                            {feature.icon}
                        </div>
                        <h3 className="text-lg font-serif font-medium text-neutral-900 mb-1">
                            {feature.title}
                        </h3>
                        <p className="text-sm text-neutral-500 font-medium leading-relaxed">
                            {feature.description}
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
