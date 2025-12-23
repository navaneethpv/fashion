"use client"
import { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { ShoppingBag, Loader2, Check, X, AlertTriangle, Ruler, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Variant {
    size: string;
    stock: number;
    // other fields ignored for this component
}

interface AddToCartButtonProps {
  productId: string;
  price: number;
  variants: Variant[];
}

export default function AddToCartButton({ variants = [], productId, price }: AddToCartButtonProps) {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("");

  // --- STOCK LOGIC ---
  // ensure variants is an array before calling find
  const selectedVariant = Array.isArray(variants) ? variants.find(v => v.size === selectedSize) : undefined;
  const availableStock = selectedVariant ? (selectedVariant.stock ?? 0) : 0;
  const isOutOfStock = !!selectedSize && availableStock <= 0;
  const isLowStock = availableStock > 0 && availableStock <= 10;
  const isAnySizeInStock = variants.some(v => v.stock > 0);
  // --- END STOCK LOGIC ---
 
  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
    const baseUrl = base.replace(/\/$/, "");

  const handleAddToCart = async () => {
    // 1. Auth Check
    if (!isLoaded) return;
    if (!user) {
      clerk.openSignIn();
      return;
    }

    // 2. Validation
    if (!selectedSize || availableStock <= 0) {
        alert("Please select an available size.");
        return;
    }

    setLoading(true);

    try {
      // 3. API Call
      const res = await fetch(`${baseUrl}/api/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId: productId,
          variant: selectedSize, // Use selectedSize as variantSku
          quantity: 1
        })
      });

      if (res.ok) {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 2000);
      } else {
        alert("Failed to add to cart");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Size Selector */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-bold text-gray-900 uppercase">Select Size</h3>
          <button 
            // Mock Size Guide Modal function call
            onClick={() => alert("Showing Size Guide Modal")}
            className="text-xs font-medium hover:underline flex items-center"
            style={{ color: 'rgba(13, 13, 13, 1)' }}
          >
            <Ruler className="w-3 h-3 mr-1" /> Size Guide
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {variants.map((v: Variant, i: number) => (
            <button
              key={i}
              onClick={() => setSelectedSize(v.size)}
              disabled={v.stock <= 0} // 🛑 DISABLE: If stock is 0
              className={`w-12 h-12 rounded-lg border flex items-center justify-center font-bold text-sm transition ${
                v.stock <= 0 
                ? 'border-gray-100 text-gray-400 line-through cursor-not-allowed' // Out of Stock Style
                : selectedSize === v.size 
                  ? 'border-black bg-black text-white' 
                  : 'border-gray-200 text-gray-900 hover:border-black'
              }`}
            >
              {v.size}
            </button>
          ))}
          {variants.length === 0 && <span className="text-sm text-gray-500">One Size</span>}
        </div>
      </div>

      {/* 🛑 STOCK MESSAGE 🛑 */}
      <div className="mt-4">
        {isOutOfStock && (
          <span className="text-sm font-bold text-red-600 flex items-center">
            <X className="w-4 h-4 mr-1" /> Out of Stock for this size.
          </span>
        )}
        {isLowStock && (
          <span className="text-sm font-bold text-orange-600 flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1" /> Only {availableStock} left!
          </span>
        )}
        {availableStock > 10 && selectedSize && (
            <span className="text-sm font-bold text-green-600">
                In Stock
            </span>
        )}
        {!isAnySizeInStock && (
             <span className="text-lg font-bold text-red-600">
                Product is completely Out of Stock.
             </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button 
          onClick={handleAddToCart}
          disabled={!selectedSize || availableStock <= 0 || loading || success} // 🛑 DISABLE: If no size/out of stock/saving
          className={`flex-1 h-14 rounded-xl font-bold text-lg transition shadow-xl flex items-center justify-center gap-2 ${
            success 
              ? 'bg-green-600 text-white shadow-green-200' 
              : 'bg-gray-900 text-white hover:bg-black shadow-gray-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : success ? (
            <>
              <Check className="w-5 h-5" /> Added
            </>
          ) : (
            <>
               <ShoppingBag className="w-5 h-5" /> Add to Bag
            </>
          )}
        </button>
        {/* Wishlist Button (Keep existing) */}
        <button className="w-14 h-14 flex items-center justify-center border border-gray-200 rounded-xl hover:bg-gray-50 transition">
          <Heart className="w-6 h-6 text-gray-600" />
        </button>
      </div>
    </div>
  );
}