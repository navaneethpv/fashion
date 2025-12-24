"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Camera, X, Tag, ShoppingBag, Clock, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRecentSearches } from "../../../hooks/useRecentSearches";
import { fetchAiSuggestions } from "../../../utils/aiSuggestions";

interface SearchInputProps {
  onCameraClick: () => void;
}

interface Suggestion {
  type: "brand" | "category" | "product";
  text: string;
  subText: string;
  image: string | null;
  slug?: string;
  isAi?: boolean;
}

export default function SearchInput({ onCameraClick }: SearchInputProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { recentSearches, addSearch, removeSearch, clearRecentSearches } = useRecentSearches();

  // Initialize with URL search param if present
  const [query, setQuery] = useState(searchParams.get("q") || searchParams.get("search") || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [loadingAi, setLoadingAi] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Sync with URL
  useEffect(() => {
    setQuery(searchParams.get("q") || searchParams.get("search") || "");
  }, [searchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced fetch for suggestions
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!query || query.trim().length < 2) {
        setSuggestions([]);
        setLoadingAi(false);
        return;
      }

      setLoadingAi(true);

      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      try {
        // Parallel fetch: Basic keywords + AI Suggestions
        const basicPromise = API_URL
          ? fetch(`${API_URL}/api/products/suggestions?q=${encodeURIComponent(query)}`).then(res => res.ok ? res.json() : [])
          : Promise.resolve([]);

        const aiPromise = fetchAiSuggestions(query);

        const [basicData, aiData] = await Promise.all([basicPromise, aiPromise]);

        // Merge: Basic first, then AI
        setSuggestions([...basicData, ...aiData]);
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
      } finally {
        setLoadingAi(false);
      }
    }, 500); // Increased debounce for AI

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = (value: string) => {
    if (!value.trim()) return;

    // Save to recent searches
    addSearch(value);

    // Navigate to product page with q param
    const params = new URLSearchParams();
    params.set("q", value);
    router.push(`/product?${params.toString()}`);
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    handleSearch(query);
  };

  const handleSelect = (item: Suggestion) => {
    setQuery(item.text);
    handleSearch(item.text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      // Logic to navigate through Recent (if visible) OR Suggestions
      // Simplified: usually focusIndex logic works on the *rendered* list. 
      // Need to adjust focus logic to account for recent searches? 
      // For now, let's keep focus logic on the active suggestions array. 
      // If recent searches are shown, they are not in `suggestions` state array.
      // This is a limitation. To fix, one would merge reasonable items into a display list.
      // For MVP, focus navigation on Suggestions list is priority.
      setFocusedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      if (focusedIndex >= 0 && suggestions[focusedIndex]) {
        e.preventDefault();
        handleSelect(suggestions[focusedIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
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

  const renderIcon = (item: Suggestion) => {
    if (item.isAi) return <Sparkles className="w-5 h-5 text-violet-500 fill-violet-100" />;
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

  const showRecent = query === "" && recentSearches.length > 0;
  const showSuggestions = query.length >= 2 && suggestions.length > 0;

  return (
    <div
      ref={searchRef}
      className="flex-1 max-w-lg hidden md:flex relative group z-50"
    >
      <form onSubmit={handleSubmit} className="w-full relative">
        <button
          type="submit"
          className="absolute inset-y-0 left-0 pl-3 flex items-center cursor-pointer group"
        >
          <Search className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
        </button>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-lg text-sm text-gray-900 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-200 focus:bg-white transition-all"
          placeholder="Search for products, brands..."
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
            }}
            className="absolute inset-y-0 right-10 flex items-center px-2 cursor-pointer text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={onCameraClick}
          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:text-primary transition-colors"
        >
          <Camera className="h-5 w-5 text-gray-500 hover:text-primary" />
        </button>
      </form>

      {/* Suggestion Dropdown */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-2"
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          {/* Recent Searches Section */}
          {showRecent && (
            <div className="mb-2">
              <div className="px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Searches</span>
                <button onClick={clearRecentSearches} className="text-xs text-red-500 hover:underline">Clear All</button>
              </div>
              {recentSearches.map((term) => (
                <div
                  key={term}
                  onClick={() => handleSearch(term)}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    <span className="text-sm text-gray-700 font-medium">{term}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeSearch(term); }}
                    className="p-1 hover:bg-gray-200 rounded-full text-gray-400 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {suggestions.length > 0 && <div className="border-t border-gray-100 my-2" />}
            </div>
          )}

          {/* AI & Keyword Suggestions */}
          {showSuggestions ? (
            <>
              {loadingAi && suggestions.length === 0 && (
                <div className="px-4 py-4 text-center text-sm text-gray-500 animate-pulse">
                  <Sparkles className="w-4 h-4 inline mr-2 text-violet-500" />
                  Genering smart suggestions...
                </div>
              )}

              {suggestions.map((item, index) => (
                <div
                  key={index}
                  onClick={() => handleSelect(item)}
                  className={`px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-colors ${index === focusedIndex ? "bg-gray-50" : "hover:bg-gray-50"
                    } ${item.isAi ? 'bg-violet-50/30 hover:bg-violet-50' : ''}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded ${item.isAi ? 'bg-white' : 'bg-gray-100'}`}>
                    {renderIcon(item)}
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-sm text-gray-700 leading-none mb-0.5 flex items-center gap-2">
                      {highlightMatch(item.text, query)}
                      {item.isAi && <span className="text-[10px] font-bold text-violet-600 px-1.5 py-0.5 bg-violet-100 rounded-full">New</span>}
                    </span>
                    <span className={`text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis ${item.isAi ? 'text-violet-500' : 'text-blue-600'}`}>
                      {item.subText}
                    </span>
                  </div>
                </div>
              ))}
            </>
          ) : query.length >= 2 && loadingAi ? (
            <div className="px-4 py-4 text-center text-sm text-gray-500 animate-pulse">
              Searching...
            </div>
          ) : null}

          {query.length >= 2 && !loadingAi && suggestions.length === 0 && (
            <div className="px-4 py-3 text-center text-sm text-gray-500">
              No suggestions found. Press Enter to search.
            </div>
          )}

          {/* View all option (only if query exists) */}
          {query && (
            <div
              onClick={() => handleSearch(query)}
              className="px-4 py-3 bg-gray-50 border-t border-gray-100 cursor-pointer text-xs font-semibold text-center text-primary hover:text-violet-700"
            >
              View all results for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
