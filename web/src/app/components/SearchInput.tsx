"use client"
import { useState, useEffect, useRef } from 'react';
import { Search, Camera, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface SearchInputProps {
  onCameraClick: () => void;
}

export default function SearchInput({ onCameraClick }: SearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce API call
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Minimum 3 characters to start searching
    if (query.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimeout.current = setTimeout(() => {
      fetchProducts(query);
    }, 300);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [query]);

  const fetchProducts = async (q: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/products?q=${encodeURIComponent(q)}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.data || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Direct navigation using the full, entered query
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
      setResults([]);
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
          onFocus={() => query.length >= 3 && fetchProducts(query)}
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
      {(loading || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-4 flex items-center justify-center text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Searching...
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {results.map((product) => (
                <Link
                  key={product.slug}
                  href={`/products/${product.slug}`}
                  onClick={() => setResults([])}
                  className="flex items-center p-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden mr-3">
                    <Image 
                      src={product.images[0].url} 
                      alt={product.name} 
                      fill 
                      className="object-cover" 
                      sizes="48px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">
                      {/* Displaying AI-relevant info: Category + Price */}
                      {product.category} • ${(product.price_cents / 100).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
              <Link
                href={`/products?q=${encodeURIComponent(query.trim())}`}
                onClick={() => setResults([])}
                className="block p-3 text-center text-sm font-bold text-primary hover:bg-violet-50 transition-colors"
              >
                View all results for "{query}" {/* Uses the full typed query */}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}