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
  compact?: boolean; // New Prop
}

export default function AddToCartButton({ variants = [], productId, price, compact = false }: AddToCartButtonProps) {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>("");

  // --- STOCK LOGIC ---
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
        window.dispatchEvent(new Event("cart-updated"));
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

  const handleWishlistToggle = async () => {
    if (!isLoaded || !user) {
      clerk.openSignIn();
      return;
    }
    setWishlistLoading(true);
    try {
      // 1. Try Add
      const res = await fetch(`${baseUrl}/api/wishlist/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId })
      });

      if (res.ok) {
        window.dispatchEvent(new Event("wishlist-updated"));
        // Optional: show toast/alert
      } else if (res.status === 400) {
        // 2. If duplicate, Try Remove
        const resDel = await fetch(`${baseUrl}/api/wishlist/remove/${productId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        });
        if (resDel.ok) {
          window.dispatchEvent(new Event("wishlist-updated"));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className={compact ? "space-y-3" : "space-y-6"}>
      {/* Size Selector */}
      <div className={compact ? "mb-2" : "mb-8"}>
        <div className="flex justify-between items-center mb-2">
          {!compact && <h3 className="text-sm font-bold text-gray-900 uppercase">Select Size</h3>}
          {compact ? (
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Size</span>
          ) : (
            <button
              // Mock Size Guide Modal function call
              onClick={() => alert("Showing Size Guide Modal")}
              className="text-xs font-medium hover:underline flex items-center"
              style={{ color: 'rgba(13, 13, 13, 1)' }}
            >
              <Ruler className="w-3 h-3 mr-1" /> Size Guide
            </button>
          )}

        </div>
        <div className="flex flex-wrap gap-2">
          {variants.map((v: Variant, i: number) => (
            <button
              key={i}
              onClick={() => setSelectedSize(v.size)}
              disabled={v.stock <= 0}
              className={`rounded-lg border flex items-center justify-center font-bold transition 
                ${compact ? "w-8 h-8 text-xs" : "w-12 h-12 text-sm"}
                ${v.stock <= 0
                  ? 'border-gray-100 text-gray-400 line-through cursor-not-allowed'
                  : selectedSize === v.size
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 text-gray-900 hover:border-black'
                }`}
            >
              {v.size}
            </button>
          ))}
          {variants.length === 0 && <span className="text-xs text-gray-500">One Size</span>}
        </div>
      </div>

      {/* 🛑 STOCK MESSAGE 🛑 */}
      <div className={compact ? "mt-1 mb-2" : "mt-4"}>
        {isOutOfStock && (
          <span className="text-xs font-bold text-red-600 flex items-center">
            Out of Stock
          </span>
        )}
        {isLowStock && (
          <span className="text-xs font-bold text-orange-600 flex items-center">
            Only {availableStock} left!
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleAddToCart}
          disabled={!selectedSize || availableStock <= 0 || loading || success}
          className={`flex-1 rounded-lg font-bold transition shadow-sm flex items-center justify-center gap-2 
            ${compact ? "h-9 text-xs" : "h-14 text-lg shadow-xl"}
            ${success
              ? 'bg-green-600 text-white shadow-green-200'
              : 'bg-gray-900 text-white hover:bg-black shadow-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {loading ? (
            <Loader2 className={compact ? "w-3 h-3 animate-spin" : "w-5 h-5 animate-spin"} />
          ) : success ? (
            <>
              <Check className={compact ? "w-3 h-3" : "w-5 h-5"} /> {compact ? "Added" : "Added"}
            </>
          ) : (
            <>
              <ShoppingBag className={compact ? "w-3 h-3" : "w-5 h-5"} /> {compact ? "Add" : "Add to Bag"}
            </>
          )}
        </button>
        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          disabled={wishlistLoading}
          className={`flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition ${compact ? "w-9 h-9" : "w-14 h-14 rounded-xl"}`}
        >
          <Heart className={`${compact ? "w-4 h-4" : "w-6 h-6"} ${wishlistLoading ? "text-gray-300 animate-pulse" : "text-gray-600"}`} />
        </button>
      </div>
    </div>
  );
}