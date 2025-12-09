// /web/src/components/ProductActions.tsx

'use client';

import { useState } from 'react';

interface VariantType { size: string; color: string; sku: string; stock: number; }
interface Product {
  _id: string;
  name: string;
  variants: VariantType[];
}

interface ProductActionsProps {
  product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size.');
      return;
    }
    console.log(`Adding to cart: ${product.name}, Size: ${selectedSize}`);
    alert(`Added ${product.name} (Size: ${selectedSize}) to your cart!`);
  };

  return (
    <>
      <div>
        <h3 className="text-sm font-medium text-gray-900">Size</h3>
        <div className="flex flex-wrap gap-3 mt-4">
          {product.variants.map((variant) => (
            <button
              key={variant.sku}
              onClick={() => setSelectedSize(variant.size)}
              disabled={variant.stock === 0}
              className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                selectedSize === variant.size
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-900 hover:bg-gray-50'
              } ${ variant.stock === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through' : '' }`}
            >
              {variant.size}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleAddToCart}
        className="mt-10 w-full bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Add to Bag
      </button>
    </>
  );
}