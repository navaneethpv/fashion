"use client";

import { motion } from "framer-motion";
import { RotateCcw, Truck, Headphones } from "lucide-react";

const features = [
    {
        icon: RotateCcw,
        title: "7 Days Returns",
        description: "Easy returns within 7 days",
    },
    {
        icon: Truck,
        title: "Express Delivery",
        description: "Free shipping on orders over ₹999",
    },
    {
        icon: Headphones,
        title: "24/7 Support",
        description: "Expert assistance whenever you need",
    },
];

export default function ServiceFeatures() {
    return (
        <section className="py-16 md:py-24 border-b border-gray-100">
            <div className="max-w-[1400px] mx-auto px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-gray-400">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.6 }}
                            viewport={{ once: true }}
                            className="flex flex-col items-center text-center p-4 group"
                        >
                            <div className="mb-6 text-gray-900 transition-transform duration-500 group-hover:-translate-y-1">
                                <feature.icon className="w-8 h-8" strokeWidth={1} />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-gray-500 font-light">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
