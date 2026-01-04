import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden selection:bg-white selection:text-black">

            {/* Static Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <h1 className="font-[family-name:var(--font-playfair)] text-[20rem] md:text-[30rem] text-white/[0.02] select-none leading-none tracking-tighter">
                    404
                </h1>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg w-full">

                {/* Content Container */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h2 className="font-[family-name:var(--font-playfair)] text-5xl md:text-6xl font-normal tracking-wide text-white/90">
                            Lost in Space
                        </h2>
                        <div className="w-16 h-[1px] bg-white/20 mx-auto" />
                        <p className="font-[family-name:var(--font-inter)] text-sm md:text-base text-neutral-400 font-light leading-relaxed max-w-md mx-auto tracking-wide">
                            The page you are looking for has drifted away. <br />
                            Let’s guide you back to luxury.
                        </p>
                    </div>

                    {/* Static Luxury Buttons */}
                    <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/" className="group">
                            <button className="h-12 px-8 bg-white text-black font-[family-name:var(--font-inter)] text-sm font-medium tracking-widest uppercase rounded-full hover:bg-neutral-200 transition-colors duration-300">
                                Return Home
                            </button>
                        </Link>

                        <Link href="/contact" className="group">
                            <button className="h-12 px-8 border border-white/20 text-white font-[family-name:var(--font-inter)] text-sm font-medium tracking-widest uppercase rounded-full hover:border-white hover:bg-white/5 transition-colors duration-300">
                                Support
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Static Footer */}
                <div className="absolute bottom-12 text-[10px] text-white/20 uppercase tracking-[0.3em] font-[family-name:var(--font-inter)]">
                    Eyoris Fashion
                </div>

            </div>
        </div>
    );
}
