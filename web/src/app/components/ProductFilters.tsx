"use client"
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

export type SizeFilterMode = 'apparel' | 'footwear' | 'none';

interface ProductFiltersProps {
  sizeFilterMode?: SizeFilterMode;
  genders: string[];
  brands: string[];
  colors: string[];
  activeArticleType?: string;
}

export default function ProductFilters({
  sizeFilterMode = 'none',
  genders,
  brands,
  colors,
  activeArticleType,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Helper to update URL params
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.set('page', '1'); // Reset to page 1 on filter change
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (key: string, value: string) => {
    router.push(`/product?${createQueryString(key, value)}`);
  };

  return (
    <div className="space-y-8">
      {/* Sort By */}
      <div>
        <h3 className="font-bold text-sm mb-3 uppercase tracking-wider">Sort By</h3>
        <select 
          className="w-full p-2 border border-gray-300 rounded text-sm bg-white"
          value={searchParams.get('sort') || 'newest'}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Gender Filter */}
      {genders.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-3 uppercase tracking-wider">Gender</h3>
          <div className="space-y-2">
            {genders.map((gender) => {
              const isActive = searchParams.get('gender')?.toLowerCase() === gender.toLowerCase();
              return (
                <label key={gender} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="gender"
                    checked={isActive}
                    onChange={() => handleFilterChange('gender', isActive ? '' : gender)}
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span
                    className={`text-sm group-hover:text-primary transition-colors ${
                      isActive ? 'font-bold text-gray-900' : 'text-gray-600'
                    }`}
                  >
                    {gender}
                  </span>
                </label>
              );
            })}
            {/* Clear Filter */}
            {searchParams.get('gender') && (
              <button
                onClick={() => handleFilterChange('gender', '')}
                className="text-xs text-red-500 hover:underline mt-2"
              >
                Clear Gender
              </button>
            )}
          </div>
        </div>
      )}

      {/* Price Range (Simple manual inputs) */}
      <div>
        <h3 className="font-bold text-sm mb-3 uppercase tracking-wider">Price</h3>
        <div className="flex gap-2">
           <button onClick={() => handleFilterChange('maxPrice', '5000')} className="px-3 py-1 border text-xs rounded hover:bg-gray-100">Under ₹50</button>
           <button onClick={() => handleFilterChange('minPrice', '10000')} className="px-3 py-1 border text-xs rounded hover:bg-gray-100">₹100+</button>
        </div>
        {(searchParams.get('minPrice') || searchParams.get('maxPrice')) && (
           <button 
           onClick={() => {
             const params = new URLSearchParams(searchParams.toString());
             params.delete('minPrice');
             params.delete('maxPrice');
             router.push(`/product?${params.toString()}`);
           }}
           className="text-xs text-red-500 hover:underline mt-2"
         >
           Clear Price
         </button>
        )}
      </div>

      {/* Brand (derived from current products) */}
      {brands.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-3 uppercase tracking-wider">Brand</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
            {brands.map((brand) => {
              const isActive = searchParams.get('brand') === brand;
              return (
                <button
                  key={brand}
                  type="button"
                  className={`w-full text-left text-xs px-2 py-1 rounded ${
                    isActive
                      ? 'bg-gray-900 text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => handleFilterChange('brand', isActive ? '' : brand)}
                >
                  {brand}
                </button>
              );
            })}
          </div>
          {searchParams.get('brand') && (
            <button
              onClick={() => handleFilterChange('brand', '')}
              className="mt-2 text-xs text-red-500 hover:underline"
            >
              Clear Brand
            </button>
          )}
        </div>
      )}

      {/* Color (derived from current products) */}
      {colors.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-3 uppercase tracking-wider">Color</h3>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const isActive = searchParams.get('color') === color;
              return (
                <button
                  key={color}
                  type="button"
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    isActive
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                  onClick={() => handleFilterChange('color', isActive ? '' : color)}
                >
                  {color}
                </button>
              );
            })}
          </div>
          {searchParams.get('color') && (
            <button
              onClick={() => handleFilterChange('color', '')}
              className="mt-2 text-xs text-red-500 hover:underline"
            >
              Clear Color
            </button>
          )}
        </div>
      )}

      {/* Size (context-aware) */}
      {sizeFilterMode !== 'none' && (
        <div>
          <h3 className="font-bold text-sm mb-3 uppercase tracking-wider">Size</h3>
          <div className="flex flex-wrap gap-2">
            {(sizeFilterMode === 'apparel'
              ? ['XS', 'S', 'M', 'L', 'XL', 'XXL']
              : ['6', '7', '8', '9', '10']
            ).map((size) => {
              const isActive = searchParams.get('size') === size;
              return (
                <button
                  key={size}
                  type="button"
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    isActive
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                  onClick={() => handleFilterChange('size', isActive ? '' : size)}
                >
                  {size}
                </button>
              );
            })}
          </div>
          {searchParams.get('size') && (
            <button
              onClick={() => handleFilterChange('size', '')}
              className="mt-2 text-xs text-red-500 hover:underline"
            >
              Clear Size
            </button>
          )}
        </div>
      )}
    </div>
  );
}