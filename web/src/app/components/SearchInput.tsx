"use client"
import { useState, useEffect, useRef } from 'react';
import { Search, Camera, X, Tag, ShoppingBag } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SearchInputProps {
  onCameraClick: () => void;
}

interface Suggestion {
  type: 'brand' | 'category' | 'product';
  text: string;
  subText: string;
  image: string | null;
  slug?: string;
}

export default function SearchInput({ onCameraClick }: SearchInputProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Initialize with URL search param if present
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);

  // Sync with URL
  useEffect(() => {
    setQuery(searchParams.get('search') || '');
  }, [searchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced fetch for suggestions
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!query || query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const res = await fetch(`http://localhost:4000/api/products/suggestions?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          // Only show dropdown if we have focus (heuristic: usually this runs while specific typing)
          // But to be safe, we rely on the input focus or manual trigger.
          // Here we just update data, showDropdown state is managed by focus/change.
        }
      } catch (err) {
        console.error('Failed to fetch suggestions', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = (value: string) => {
    if (!value.trim()) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('search', value);
    // Reset page to 1 on new search
    params.set('page', '1');
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
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (focusedIndex >= 0 && suggestions[focusedIndex]) {
        e.preventDefault();
        handleSelect(suggestions[focusedIndex]);
      } else {
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const highlightMatch = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? 
            <span key={i} className="font-bold text-gray-900 bg-yellow-100/50">{part}</span> : 
            part
        )}
      </span>
    );
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
    if (item.type === 'brand') return <Tag className="w-5 h-5 text-gray-400" />;
    if (item.type === 'category') return <ShoppingBag className="w-5 h-5 text-gray-400" />;
    return <Search className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div ref={searchRef} className="flex-1 max-w-lg hidden md:flex relative group z-50">
      <form onSubmit={handleSubmit} className="w-full relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400 group-focus-within:text-black transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
          }}
          onKeyDown={handleKeyDown}
          className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-lg text-sm text-gray-900 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-200 focus:bg-white transition-all"
          placeholder="Search for products, brands..."
        />
        
        {query ? (
           <button 
             type="button"
             onClick={() => {
               setQuery('');
               setSuggestions([]);
               // Optional: Clear search from URL? Maybe not, just clear input.
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
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {suggestions.map((item, index) => (
            <div
              key={index}
              onClick={() => handleSelect(item)}
              className={`px-4 py-2.5 cursor-pointer flex items-center gap-3 transition-colors ${
                index === focusedIndex ? 'bg-gray-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded">
                {renderIcon(item)}
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-sm text-gray-700 leading-none mb-0.5">
                  {highlightMatch(item.text, query)}
                </span>
                <span className="text-xs text-blue-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  {item.subText}
                </span>
              </div>
            </div>
          ))}
          {/* View all option */}
          <div 
            onClick={() => handleSearch(query)}
            className="px-4 py-3 bg-gray-50 border-t border-gray-100 cursor-pointer text-xs font-semibold text-center text-primary hover:text-violet-700"
          >
            View all results for &quot;{query}&quot;
          </div>
        </div>
      )}
    </div>
  );
}