"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import AddToCartButton from '../components/AddToCartButton';

export default function WishlistPage() {
  const { user, isLoaded } = useUser();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  const baseUrl = base.replace(/\/$/, "");

  // Fetch wishlist on mount
  useEffect(() => {
    if (isLoaded && user) {
      fetchWishlist();
    } else if (isLoaded && !user) {
      setLoading(false);
    }
  }, [isLoaded, user]);

  const fetchWishlist = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/wishlist?userId=${user?.id}`);
      const data = await response.json();
      setWishlist(data.wishlist || []);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      await fetch(`${baseUrl}/api/wishlist/remove/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });

      // Remove from local state
      setWishlist(prev => prev.filter(item => item.productId._id !== productId));
      // Dispatch event to update navbar count
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  // Loading Skeleton
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="h-8 w-48 bg-gray-100 rounded-lg mb-8 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[4/5] bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Not Signed In
  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Sign in to view your wishlist</h2>
          <p className="text-gray-500 mb-8 font-medium">Save items you love to create your dream collection.</p>
          {/* Clerk handles the actual sign-in modal/redirect, button is cosmetic trigger here if needed, 
               but usually Navbar has the main Sign In. 
               We can render nothing or a generic message. */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        {/* Header Section */}
        <div className="mb-16 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-serif font-medium text-gray-900 tracking-tight mb-3">
            Your Wishlist
          </h1>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-gray-500 font-light text-lg">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'saved styles'}
            </p>
            <div className="h-px flex-1 bg-gray-100 mx-8 hidden md:block"></div>
          </div>
        </div>

        {/* Wishlist Grid */}
        {wishlist.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in duration-500 bg-gray-50/30 rounded-3xl border border-gray-100/50">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm ring-1 ring-gray-100 rotate-3">
              <Heart className="w-8 h-8 text-gray-300 fill-gray-50" />
            </div>
            <h3 className="text-2xl font-serif font-medium text-gray-900 mb-3">Your collection is empty</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto font-light leading-relaxed">
              Tap the heart on any product to save it here. Start building your personal wardrobe!
            </p>
            <Link
              href="/products"
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gray-900 text-white rounded-full font-medium shadow-lg shadow-gray-200 hover:shadow-xl hover:scale-[1.02] hover:bg-black transition-all duration-300"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : (
          // Product Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-y-12 gap-x-8">
            {wishlist.map((item) => {
              const product = item.productId;
              // Fallback for deleted products
              if (!product) return null;

              return (
                <div
                  key={item._id}
                  className="group relative flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  {/* Image Card */}
                  <div className="relative aspect-[3/4] bg-gray-50 rounded-xl overflow-hidden mb-5 shadow-sm group-hover:shadow-md transition-all duration-500">
                    <Link href={`/products/${product.slug}`} className="block h-full w-full">
                      <img
                        src={product.images?.[0] || "https://via.placeholder.com/400"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 will-change-transform"
                      />
                    </Link>

                    {/* Remove Action - Top Right */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        removeFromWishlist(product._id);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white shadow-sm transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Move to Bag - Bottom Overlay (Desktop Hover) */}
                    <div className="absolute inset-x-4 bottom-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 hidden md:block">
                      <AddToCartButton
                        productId={product._id}
                        price={product.price_cents}
                        variants={product.variants || []}
                        compact={true}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col flex-1 px-1">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <div className="flex-1">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-1.5">
                          {product.brand || 'Eyoris Basics'}
                        </p>
                        <Link href={`/products/${product.slug}`}>
                          <h3 className="font-serif text-base text-gray-900 hover:text-gray-600 transition-colors line-clamp-2 leading-tight">
                            {product.name}
                          </h3>
                        </Link>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-medium text-gray-900">
                        ₹{(product.price_cents / 100).toFixed(0)}
                      </span>
                      {product.price_before_cents && (
                        <span className="text-xs text-gray-400 line-through font-light">
                          ₹{(product.price_before_cents / 100).toFixed(0)}
                        </span>
                      )}
                    </div>

                    {/* Mobile Only: Add to Bag (since hover doesn't work well) */}
                    <div className="mt-4 md:hidden">
                      <AddToCartButton
                        productId={product._id}
                        price={product.price_cents}
                        variants={product.variants || []}
                        compact={true}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
