"use client";
import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import ProductFilters, { FilterValues, SizeFilterMode } from './ProductFilters';
import { useRouter, useSearchParams } from 'next/navigation';

interface FilterDrawerProps {
    sizeFilterMode?: SizeFilterMode;
    genders: string[];
    brands: string[];
    colors: string[];
    isOpen: boolean;
    onClose: () => void;
}

export default function FilterDrawer({
    sizeFilterMode = 'none',
    genders,
    brands,
    colors,
    isOpen,
    onClose,
}: FilterDrawerProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [tempParams, setTempParams] = useState<FilterValues>({});

    // Initialize temp state when opening or when URL changes (if closed, to stay in sync start)
    useEffect(() => {
        if (isOpen) {
            const current: FilterValues = {};
            searchParams.forEach((value, key) => {
                current[key] = value;
            });
            setTempParams(current);
        }
    }, [isOpen, searchParams]);

    const handleChange = (key: string, value: string | undefined) => {
        setTempParams((prev) => {
            const next = { ...prev };
            if (value === undefined) {
                delete next[key];
            } else {
                next[key] = value;
            }
            return next;
        });
    };

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString());

        // We need to merge tempParams into URL. 
        // We should clear old filters that might be removed?
        // The tempParams only contains *current* filters.
        // But what if we removed a filter? it won't be in tempParams.
        // So we should first clear "filterable" keys from params, then add from tempParams.
        // Keys managed by filters: gender, brand, color, size, minPrice, maxPrice, sort
        const managedKeys = ['gender', 'brand', 'color', 'size', 'minPrice', 'maxPrice', 'sort'];
        managedKeys.forEach(k => params.delete(k));

        Object.entries(tempParams).forEach(([key, value]) => {
            if (value && managedKeys.includes(key)) {
                params.set(key, value);
            }
        });

        params.set('page', '1');
        router.push(`/product?${params.toString()}`, { scroll: false });
        onClose();
    };

    const handleClear = () => {
        // Clear local state
        setTempParams({});
    };

    // Lock body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end sm:justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ease-out"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-in-right rounded-l-[0px] sm:rounded-l-[2rem] overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 bg-white z-10 sticky top-0">
                    <div>
                        <h2 className="text-xl font-black tracking-tight text-gray-900 uppercase">
                            Filters
                        </h2>
                        <p className="text-xs text-gray-500 font-medium tracking-wide mt-1">
                            Refine your selection
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-black hover:text-white transition-all duration-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-8 py-4 customize-scrollbar">
                    <ProductFilters
                        sizeFilterMode={sizeFilterMode}
                        genders={genders}
                        brands={brands}
                        colors={colors}
                        values={tempParams}
                        onChange={handleChange}
                    />
                </div>

                {/* Sticky Footer */}
                <div className="border-t border-gray-100 bg-white/80 backdrop-blur-md p-6 flex items-center gap-4 z-10 sticky bottom-0">
                    <button
                        onClick={handleClear}
                        className="flex-1 py-4 text-xs font-bold text-gray-900 uppercase tracking-widest border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-[2] py-4 text-xs font-bold text-white bg-black rounded-full hover:bg-gray-900 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        View Results <SlidersHorizontal className="w-4 h-4" />
                    </button>
                </div>

            </div>

            <style jsx global>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
        </div>
    );
}
