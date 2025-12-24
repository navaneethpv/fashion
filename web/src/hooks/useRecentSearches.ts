"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "eyoris_recent_searches";
const MAX_Items = 6;

export function useRecentSearches() {
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    useEffect(() => {
        // Load from local storage on mount
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setRecentSearches(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load recent searches", e);
        }
    }, []);

    const addSearch = (term: string) => {
        if (!term || term.trim().length === 0) return;
        const cleanTerm = term.trim();

        setRecentSearches((prev) => {
            // Remove duplicates (case-insensitive check but keep original case)
            const filtered = prev.filter(
                (item) => item.toLowerCase() !== cleanTerm.toLowerCase()
            );
            // Add to front, slice to max
            const updated = [cleanTerm, ...filtered].slice(0, MAX_Items);

            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const removeSearch = (term: string) => {
        setRecentSearches((prev) => {
            const updated = prev.filter((item) => item !== term);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    return {
        recentSearches,
        addSearch,
        removeSearch,
        clearRecentSearches,
    };
}
