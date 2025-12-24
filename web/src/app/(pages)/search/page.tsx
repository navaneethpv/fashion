"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Camera, Search, X, Tag, ShoppingBag } from "lucide-react";
import Link from "next/link";
import ProductCard from "../components/ProductCard";
import ImageSearchModal from "../components/ImageSearchModal";

// Force dynamic rendering
export const dynamic = "force-dynamic";

interface Suggestion {
    type: "brand" | "category" | "product";
    text: string;
    subText: string;
    image: string | null;
    slug?: string;
}

function SearchPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    const initialQuery = searchParams.get("q") || searchParams.get("search") || "";
    const [query, setQuery] = useState(initialQuery);

    // Suggestion State
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    const [isCameraOpen, setIsCameraOpen] = useState(false);

    // Auto-focus on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Sync state with URL params if they change externally
    useEffect(() => {
        const q = searchParams.get("q") || searchParams.get("search") || "";
        if (q !== query) {
            setQuery(q);
        }
    }, [searchParams]);

    // Fetch suggestions
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (!query || query.trim().length < 2) {
                setSuggestions([]);
                return;
            }

            setIsFetching(true);
            const API_URL = process.env.NEXT_PUBLIC_API_URL;
            if (!API_URL) return;

            try {
                const res = await fetch(
                    `${API_URL}/api/products/suggestions?q=${encodeURIComponent(query)}`
                );
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data);
                }
            } catch (err) {
                console.error("Failed to fetch suggestions", err);
            } finally {
                setIsFetching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleSearch = (overrideQuery?: string) => {
        const text = overrideQuery ?? query;
        if (!text.trim()) return;
        const params = new URLSearchParams();
        params.set("q", text.trim());
        router.push(`/product?${params.toString()}`);
    };

    const handleSuggestionClick = (suggestion: Suggestion) => {
        setQuery(suggestion.text);
        handleSearch(suggestion.text);
    };

    const handleClear = () => {
        setQuery("");
        setSuggestions([]);
        inputRef.current?.focus();
        router.replace("/search");
    };

    const renderIcon = (item: Suggestion) => {
        if (item.image) {
            return (
                <img
                    src={item.image}
                    alt={item.text}
                    className="w-8 h-8 object-cover rounded"
                />
            );
        }
        if (item.type === "brand") return <Tag className="w-5 h-5 text-gray-400" />;
        if (item.type === "category")
            return <ShoppingBag className="w-5 h-5 text-gray-400" />;
        return <Search className="w-5 h-5 text-gray-400" />;
    };

    const highlightMatch = (text: string, highlight: string) => {
        if (!highlight.trim()) return text;
        const parts = text.split(new RegExp(`(${highlight})`, "gi"));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span key={i} className="font-bold text-gray-900 bg-yellow-100/50">
                            {part}
                        </span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 pb-20">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
                <Link href="/" className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                </Link>

                <div className="flex-1 relative">
                    <button
                        onClick={() => handleSearch()}
                        className="absolute inset-y-0 left-0 pl-3 flex items-center cursor-pointer hover:text-primary transition-colors group"
                    >
                        <Search className="h-4 w-4 text-gray-400 group-hover:text-primary" />
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Search for clothes..."
                        className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-sm text-gray-900 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                    />
                    {query && (
                        <button
                            onClick={handleClear}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setIsCameraOpen(true)}
                    className="p-2 text-gray-600 hover:text-primary hover:bg-violet-50 rounded-full transition-colors"
                >
                    <Camera className="w-6 h-6" />
                </button>
            </header>

            {/* Suggestions or Placeholder */}
            <main className="px-0 py-2">
                {query.length >= 2 && suggestions.length > 0 ? (
                    <div className="bg-white">
                        {suggestions.map((item, index) => (
                            <div
                                key={index}
                                onClick={() => handleSuggestionClick(item)}
                                className="px-4 py-3 border-b border-gray-50 flex items-center gap-4 active:bg-gray-50 cursor-pointer"
                            >
                                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg">
                                    {renderIcon(item)}
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="text-sm text-gray-900 leading-snug">
                                        {highlightMatch(item.text, query)}
                                    </span>
                                    <span className="text-xs text-blue-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                        {item.subText}
                                    </span>
                                </div>
                                <div className="p-2 -mr-2">
                                    <div className="-rotate-45">
                                        <ArrowLeft className="w-4 h-4 text-gray-300" />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div
                            onClick={() => handleSearch()}
                            className="px-4 py-4 text-center text-sm font-bold text-primary active:bg-violet-50 cursor-pointer border-b border-gray-50"
                        >
                            See all results for "{query}"
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center mt-20 text-center opacity-50 px-4">
                        {isFetching ? (
                            <div className="animate-pulse flex flex-col items-center">
                                <Search className="w-16 h-16 text-gray-200 mb-4 animate-bounce" />
                                <p className="text-gray-500 font-medium">Searching suggestions...</p>
                            </div>
                        ) : (
                            <>
                                <Search className="w-16 h-16 text-gray-200 mb-4" />
                                <p className="text-gray-500 font-medium">Type to search for products...</p>
                            </>
                        )}
                    </div>
                )}
            </main>

            <ImageSearchModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
            />
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="p-4 text-center">Loading search...</div>}>
            <SearchPageContent />
        </Suspense>
    );
}
