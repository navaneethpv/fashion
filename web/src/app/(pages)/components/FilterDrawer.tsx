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
        <div className="fixed inset-0 z-[100] flex justify-start">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div className="relative w-full max-w-sm sm:max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-in-left">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <SlidersHorizontal className="w-5 h-5" />
                        Filters
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
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
                <div className="border-t border-gray-100 bg-white p-4 px-6 flex items-center gap-4 z-10">
                    <button
                        onClick={handleClear}
                        className="flex-1 py-3 text-sm font-bold text-gray-700 hover:text-black border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                    >
                        Clear All
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 py-3 text-sm font-bold text-white bg-black rounded-full hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                    >
                        Apply Filters
                    </button>
                </div>

            </div>

            <style jsx global>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}
