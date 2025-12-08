"use client"
import { useState, useEffect } from 'react';
import { Wand2, Loader2, Shirt, MoveRight, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface ProductSuggestion {
    _id: string;
    slug: string;
    name: string;
    brand: string;
    category: string;
    price_cents: number;
    images: { url: string }[];
}

export default function OutfitGenerator({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setSuggestions([]);
    try {
      const res = await fetch(`http://localhost:4000/api/ai/recommendations?productId=${productId}`);
      const data = await res.json();
      setSuggestions(data.suggestions);
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Use useEffect to fetch suggestions automatically when the component mounts
  useEffect(() => {
      fetchRecommendations();
  }, [productId]);


  const SuggestionCard = ({ product }: { product: ProductSuggestion }) => (
    <Link href={`/products/${product.slug}`} className="block text-center hover:scale-[1.03] transition-transform">
      <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm mb-2 relative aspect-[3/4] overflow-hidden">
        <Image 
          src={product.images[0].url} 
          alt={product.name} 
          fill 
          className="object-cover rounded-lg"
          sizes="(max-width: 768px) 30vw, 15vw"
        />
      </div>
      <p className="text-xs font-bold text-gray-900 truncate">{product.brand}</p>
      <p className="text-[10px] text-gray-500 truncate">{product.name}</p>
      <p className="text-sm font-bold text-gray-900">${(product.price_cents / 100).toFixed(2)}</p>
    </Link>
  );

  return (
    <div className="mt-12 border border-violet-100 bg-gradient-to-r from-violet-50 to-white rounded-2xl p-6 md:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <Wand2 className="w-5 h-5 text-primary" />
            AI Stylist: Complete the Look
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            We found {suggestions.length} items that pair perfectly with this one.
          </p>
        </div>
        <button 
            onClick={fetchRecommendations}
            disabled={loading}
            className="text-sm font-bold text-primary hover:underline flex items-center disabled:opacity-70"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Generate New'}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-6">
          <Loader2 className="w-6 h-6 text-primary animate-spin mb-3" /> 
          <p className="text-sm text-gray-500">Curating the perfect outfit...</p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
            No unique matching outfits found.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {suggestions.map((product) => (
                <SuggestionCard key={product._id} product={product} />
            ))}
        </div>
      )}
    </div>
  );
}