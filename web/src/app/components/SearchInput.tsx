"use client"
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Camera } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface SearchInputProps {
  onCameraClick: () => void;
}

interface ProductForSuggestions {
  name: string;
  slug: string;
  images?: string[] | { url?: string }[];
}

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

export default function SearchInput({ onCameraClick }: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [allProducts, setAllProducts] = useState<ProductForSuggestions[]>([]);
  const [suggestions, setSuggestions] = useState<ProductForSuggestions[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebouncedValue(query);

  const router = useRouter();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLDivElement>(null);

  const createSearchQuery = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }
      params.set('page', '1');
      return params.toString();
    },
    [searchParams]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ensureProductsLoaded = useCallback(async () => {
    if (allProducts.length > 0 || loading) return;
    try {
      setLoading(true);
      const res = await fetch('http://localhost:4000/api/products?limit=200');
      if (!res.ok) return;
      const data = await res.json();
      const list: ProductForSuggestions[] = (data.data || []).map((p: ProductForSuggestions) => ({
        name: p.name,
        slug: p.slug,
        images: p.images,
      }));
      setAllProducts(list);
    } finally {
      setLoading(false);
    }
  }, [allProducts.length, loading]);

  // Build suggestions client-side from cached products
  useEffect(() => {
    const raw = query.trim();
    const q = debouncedQuery.trim().toLowerCase();

    // Clear immediately when raw input is empty
    if (!raw) {
      setSuggestions([]);
      return;
    }

    if (!q || allProducts.length === 0) {
      setSuggestions([]);
      return;
    }

    const max = 8;
    const next = allProducts
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, max);

    setSuggestions(next);
  }, [debouncedQuery, query, allProducts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = query.trim();
    if (value) {
      const qs = createSearchQuery(value);
      router.push(`/product?${qs}`);
      setSuggestions([]);
    }
  };

  return (
    <div ref={searchRef} className="flex-1 max-w-lg hidden md:flex relative group">
      <form onSubmit={handleSearchSubmit} className="w-full">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400 group-focus-within:text-primary" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-md text-sm text-gray-900 shadow-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-200 transition-all"
          placeholder="Search for cargo, minimalist, black tees..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={ensureProductsLoaded}
        />
        <button 
          type="button" 
          onClick={onCameraClick}
          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:text-primary transition-colors"
        >
          <Camera className="h-5 w-5 text-gray-500 hover:text-primary" />
        </button>
      </form>

      {/* Suggestion Dropdown */}
      {(loading || suggestions.length > 0) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-3 text-xs text-gray-500">Loading suggestions…</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {suggestions.map((s) => (
                <Link
                  key={s.slug}
                  href={`/products/${s.slug}`}
                  onClick={() => setSuggestions([])}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 transition-colors text-sm"
                >
                  <div className="relative h-12 w-12 rounded-md overflow-hidden bg-gray-100 shrink-0 mr-3">
                    <Image
                      src={
                        Array.isArray(s.images) && s.images[0]
                          ? (typeof s.images[0] === 'string'
                              ? s.images[0]
                              : (s.images[0] as { url?: string }).url || '/placeholder.png')
                          : '/placeholder.png'
                      }
                      alt={s.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <span className="truncate text-gray-900">{s.name}</span>
                </Link>
              ))}
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    const qs = createSearchQuery(query.trim());
                    router.push(`/product?${qs}`);
                    setSuggestions([]);
                  }}
                  className="w-full px-3 py-2 text-center text-xs font-semibold text-primary hover:bg-violet-50 transition-colors"
                >
                  View all results for “{query}”
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}