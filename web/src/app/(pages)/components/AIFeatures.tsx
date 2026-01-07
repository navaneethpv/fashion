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
        <section className="max-w-7xl mx-auto px-6 py-10 md:py-12">
            {/* Editorial Label */}
            <div className="text-center mb-8">
                <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-400 uppercase">
                    AI Features
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {features.map((feature, idx) => (
                    <motion.div
                        key={idx}
                        onClick={feature.action}
                        whileHover={{ y: -2 }}
                        className="group cursor-pointer bg-white border border-neutral-100 hover:border-neutral-200 rounded-2xl p-6 md:p-8 flex items-center gap-6 text-left transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                    >
                        <div className="w-12 h-12 bg-neutral-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
                            {feature.icon}
                        </div>
                        <div>
                            <h3 className="text-base font-serif font-medium text-neutral-900 mb-1 group-hover:text-black">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-neutral-500 leading-relaxed font-light">
                                {feature.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
