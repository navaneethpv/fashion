"use client";

import { ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface StoryCTAProps {
    product: {
        _id: string;
        name: string;
        slug: string;
        price: number;
        images: string[] | { url: string }[];
    };
    onNavigate: () => void;
}

export default function StoryCTA({ product, onNavigate }: StoryCTAProps) {
    if (!product) return null;

    const imageUrl = typeof product.images[0] === 'string'
        ? product.images[0]
        : product.images[0]?.url || "";

    return (
        <div className="absolute bottom-8 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-500 delay-200">
            <Link
                href={`/products/${product.slug}`}
                onClick={onNavigate}
                className="group relative flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-xl overflow-hidden hover:bg-white/20 transition-all"
            >
                {/* Product Thumbnail */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white flex-shrink-0">
                    <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                    />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium opacity-80 uppercase tracking-wide">Shop This Look</p>
                    <h4 className="text-white text-sm font-bold truncate pr-2">{product.name}</h4>
                    <p className="text-white text-xs font-semibold mt-0.5">
                        ₹{(product.price / 100).toLocaleString('en-IN')}
                    </p>
                </div>

                {/* Action Icon */}
                <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center mr-1 group-hover:scale-110 transition-transform">
                    <ShoppingBag className="w-4 h-4" />
                </div>
            </Link>
        </div>
    );
}
