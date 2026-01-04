"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GridScan } from "@/components/GridScan";

export default function NotFound() {
    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden selection:bg-white selection:text-black">

            {/* Dynamic Background - GridScan */}
            <div className="absolute inset-0 z-0 opacity-40">
                <GridScan
                    enableWebcam={false}
                    gridScale={0.05}
                    lineStyle="solid"
                    linesColor="#ffffffff"
                    scanColor="#dd3535ff"
                    scanOpacity={0.4}
                    scanDirection="backward"
                    scanDuration={4}
                    enablePost={true}
                    bloomIntensity={0.5}
                    noiseIntensity={0.02}
                    interactive={false}
                />
            </div>

            {/* Background Watermark - Floating */}
            <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
            >
                <h1 className="font-[family-name:var(--font-playfair)] text-[20rem] md:text-[30rem] text-white/[0.015] select-none leading-none tracking-tighter mix-blend-overlay">
                    404
                </h1>
            </motion.div>

            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl w-full">

                {/* Content Stagger Container */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.3,
                                delayChildren: 0.2
                            }
                        }
                    }}
                    className="space-y-12"
                >
                    {/* Headline */}
                    <motion.div
                        variants={{
                            hidden: { opacity: 0, y: 30 },
                            visible: { opacity: 1, y: 0, transition: { duration: 1.5, ease: [0.22, 1, 0.36, 1] } }
                        }}
                        className="space-y-6"
                    >
                        <h2 className="font-[family-name:var(--font-playfair)] text-5xl md:text-7xl font-normal tracking-wide text-white/95">
                            Lost in Space
                        </h2>
                        <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto" />
                        <p className="font-[family-name:var(--font-inter)] text-sm md:text-base text-neutral-400 font-light leading-relaxed max-w-md mx-auto tracking-widest uppercase">
                            The page you are looking for has drifted away. <br className="hidden sm:block" />
                            Let’s guide you back to luxury.
                        </p>
                    </motion.div>

                    {/* Buttons */}
                    <motion.div
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } }
                        }}
                        className="flex flex-col sm:flex-row gap-6 justify-center items-center"
                    >
                        <Link href="/">
                            <motion.button
                                whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 1)", color: "#000" }}
                                whileTap={{ scale: 0.98 }}
                                className="h-14 px-10 border border-white/20 bg-transparent text-white font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.2em] uppercase rounded-full transition-colors duration-500 backdrop-blur-sm"
                            >
                                Return Home
                            </motion.button>
                        </Link>

                        <Link href="/contact">
                            <motion.button
                                whileHover={{ scale: 1.05, borderColor: "rgba(255, 255, 255, 0.5)" }}
                                whileTap={{ scale: 0.98 }}
                                className="h-14 px-10 text-neutral-400 font-[family-name:var(--font-inter)] text-xs font-medium tracking-[0.2em] uppercase transition-colors duration-300 hover:text-white"
                            >
                                Support
                            </motion.button>
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 2 }}
                    className="absolute -bottom-32 left-0 right-0 text-[10px] text-white/10 uppercase tracking-[0.4em] font-[family-name:var(--font-inter)]"
                >
                    Eyoris Fashion
                </motion.div>

            </div>
        </div>
    );
}
