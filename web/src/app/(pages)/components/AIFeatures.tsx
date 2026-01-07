import { useState, useEffect } from "react";
import { Camera, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function AIFeatures() {
    const router = useRouter();
    const [showGuide, setShowGuide] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem("aiFeaturesSeen");
        if (!seen) {
            setShowGuide(true);
        }
    }, []);

    const dismissGuide = () => {
        setShowGuide(false);
        localStorage.setItem("aiFeaturesSeen", "true");
    };

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
        <section className="max-w-7xl mx-auto px-6 py-10 md:py-16">
            {/* Editorial Label */}
            <div className="text-center mb-10">
                <span className="text-[10px] font-bold tracking-[0.3em] text-neutral-400 uppercase">
                    Personal Style, Powered by AI
                </span>
            </div>

            <AnimatePresence>
                {showGuide && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="mb-8 overflow-hidden"
                    >
                        <div className="bg-neutral-50/80 border border-neutral-200/60 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
                            <div className="max-w-xl">
                                <h4 className="font-serif text-lg text-neutral-900 mb-1">
                                    Discover AI-powered shopping
                                </h4>
                                <p className="text-sm text-neutral-500 leading-relaxed">
                                    Use visual search to find similar products, or generate complete outfits instantly.
                                    <span className="opacity-60 ml-1">Optional tools designed to help you shop faster.</span>
                                </p>
                            </div>
                            <button
                                onClick={dismissGuide}
                                className="flex-shrink-0 px-4 py-2 text-xs font-bold uppercase tracking-widest text-neutral-900 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors"
                                aria-label="Dismiss guide"
                            >
                                Got it
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {features.map((feature, idx) => (
                    <motion.div
                        key={idx}
                        onClick={feature.action}
                        whileHover={{ y: -2 }}
                        className={`group cursor-pointer bg-white border border-neutral-100 hover:border-neutral-200 rounded-2xl p-6 md:p-10 flex items-start gap-6 text-left transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] ${showGuide ? 'ring-1 ring-neutral-200' : ''}`}
                    >
                        <div className="w-12 h-12 bg-neutral-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500 mt-1">
                            {feature.icon}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-serif font-medium text-neutral-900 group-hover:text-black">
                                    {feature.title}
                                </h3>
                                <span className="px-1.5 py-0.5 bg-neutral-100 rounded text-[9px] font-bold text-neutral-500 uppercase tracking-wide">
                                    AI-powered
                                </span>
                            </div>
                            <p className="text-sm text-neutral-500 leading-relaxed font-light mb-1">
                                {feature.description}
                            </p>
                            <p className="text-xs text-neutral-400 font-light">
                                {idx === 0 ? "Understands colors, patterns, and silhouettes" : "Creates balanced outfits using fashion rules"}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
