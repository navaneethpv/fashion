"use client"
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import Link from 'next/link';

export default function WishlistTab() {
  const { user } = useUser();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWishlist();
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/wishlist?userId=${user?.id}`);
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
      await fetch(`http://localhost:4000/api/wishlist/remove/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      
      setWishlist(prev => prev.filter(item => item.productId._id !== productId));
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <div className="text-center py-16">
        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h3>
        <p className="text-gray-600 mb-6">Start adding products you love!</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:bg-violet-700 transition"
        >
          <ShoppingBag className="w-5 h-5" />
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-gray-600">
        {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlist.map((item) => {
          const product = item.productId;
          return (
            <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-lg transition">
              {/* Product Image */}
              <Link href={`/products/${product.slug}`} className="relative block aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </Link>

              {/* Product Info */}
              <div className="p-4">
                <Link href={`/products/${product.slug}`}>
                  <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2 hover:text-primary transition">
                    {product.name}
                  </h3>
                </Link>
                
                <p className="text-xs text-gray-500 mb-2">{product.brand}</p>

                {/* Price */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-bold text-gray-900">
                    ₹{(product.price_cents / 100).toFixed(2)}
                  </span>
                  {product.price_before_cents && (
                    <span className="text-sm text-gray-400 line-through">
                      ₹{(product.price_before_cents / 100).toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center gap-1 mb-3">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-700">{product.rating}</span>
                    <span className="text-xs text-gray-500">({product.reviewsCount || 0})</span>
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => removeFromWishlist(product._id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 transition"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
