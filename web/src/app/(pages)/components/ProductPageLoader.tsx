"use client";

import { motion } from "framer-motion";

export default function ProductPageLoader() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-white"
        >
            {/* Brand Group */}
            <motion.div
                animate={{ opacity: [0.85, 1, 0.85] }}
                transition={{
                    duration: 3.2,
                    ease: "easeInOut",
                    repeat: Infinity,
                }}
                className="flex flex-col items-center"
            >
                {/* Logo Mark */}
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-black flex items-center justify-center mb-4 lg:mb-6 transition-all duration-500">
                    <span className="text-white font-serif text-2xl lg:text-3xl leading-none">E</span>
                </div>

                {/* Brand Name */}
                <span className="font-serif text-lg lg:text-xl text-black leading-none mb-1 lg:mb-2 transition-all duration-500">
                    Eyoris
                </span>

                {/* Sub Brand */}
                <span className="text-[10px] lg:text-xs tracking-[0.25em] text-gray-500 transition-all duration-500">
                    FASHION
                </span>

                {/* Loading Status */}
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="text-[9px] lg:text-[10px] tracking-[0.2em] text-gray-400 uppercase mt-8 lg:mt-10 font-medium"
                >
                    Product Loading
                </motion.span>
            </motion.div>
        </motion.div>
    );
}
