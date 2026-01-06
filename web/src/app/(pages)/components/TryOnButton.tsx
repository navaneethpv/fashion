"use client";

import { Sparkles, Info } from "lucide-react";
import { useState } from "react";
import VirtualTryOnModal from "./VirtualTryOnModal";

interface TryOnButtonProps {
    productName: string;
    productImage: string;
}

export default function TryOnButton({ productName, productImage }: TryOnButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="flex flex-col gap-2 w-full">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="group relative flex items-center justify-center gap-2 w-full py-4 border-2 border-black rounded-full bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-300 shadow-sm"
                >
                    <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
                    <span>Try it on (AI)</span>

                    {/* Subtle Glow Effect on Hover */}
                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-md bg-black/5 -z-10" />
                </button>

                <div className="flex items-center justify-center gap-1.5 px-1 py-1">
                    <Info className="w-3 h-3 text-gray-400" />
                    <p className="text-[10px] text-gray-400 font-medium tracking-wide">
                        Upload a clear image for best results
                    </p>
                </div>
            </div>

            <VirtualTryOnModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                productName={productName}
                productImage={productImage}
            />
        </>
    );
}
