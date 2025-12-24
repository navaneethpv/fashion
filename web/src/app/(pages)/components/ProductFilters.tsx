"use client"
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { X, Check } from 'lucide-react';

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

  // Helper Key Checkers
  const isMultiSelect = (key: string) => key === 'color' || key === 'size';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get(key);

    if (isMultiSelect(key)) {
      let values = current ? current.split(',') : [];
      if (values.includes(value)) {
        values = values.filter((v) => v !== value);
      } else {
        values.push(value);
      }

      if (values.length > 0) {
        params.set(key, values.join(','));
      } else {
        params.delete(key);
      }
    } else {
      // Single select behavior (toggle off if same value, else replace)
      if (current === value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    params.set('page', '1');
    router.push(`/product?${params.toString()}`, { scroll: false });
  };

  const clearFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.set('page', '1');
    router.push(`/product?${params.toString()}`, { scroll: false });
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    ['gender', 'brand', 'color', 'size', 'minPrice', 'maxPrice', 'sort'].forEach(k => params.delete(k));
    router.push(`/product?${params.toString()}`, { scroll: false });
  };

  const getActiveFilters = (key: string) => {
    const val = searchParams.get(key);
    return val ? val.split(',') : [];
  };

  // Render Helpers
  const renderActiveChips = () => {
    const chips: { key: string; value: string; label: string }[] = [];

    // Collect active filters
    ['gender', 'brand', 'color', 'size'].forEach(key => {
      getActiveFilters(key).forEach(val => {
        chips.push({ key, value: val, label: val });
      });
    });

    if (chips.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-6">
        {chips.map((chip, idx) => (
          <button
            key={`${chip.key}-${chip.value}-${idx}`}
            onClick={() => updateFilter(chip.key, chip.value)}
            className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-xs font-medium text-gray-800 rounded-full hover:bg-gray-200 transition-colors"
          >
            {chip.label}
            <X className="w-3 h-3" />
          </button>
        ))}
        <button
          onClick={clearAll}
          className="text-xs text-red-500 hover:text-red-700 underline px-2"
        >
          Clear All
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Active Chips */}
      {renderActiveChips()}

      {/* Sort By */}
      <div>
        <h3 className="font-bold text-sm mb-3 uppercase tracking-wider">Sort By</h3>
        <select
          className="w-full p-2 border border-gray-300 rounded text-sm bg-white focus:ring-1 focus:ring-black focus:border-black outline-none"
          value={searchParams.get('sort') || 'newest'}
          onChange={(e) => updateFilter('sort', e.target.value)}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Gender Filter */}
      {genders.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <h3 className="font-bold text-sm mb-3 uppercase tracking-wider">Gender</h3>
          <div className="space-y-2">
            {genders.map((gender) => {
              const isActive = searchParams.get('gender') === gender;
              return (
                <label key={gender} className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isActive ? 'border-black bg-black' : 'border-gray-300 group-hover:border-gray-400'}`}>
                    {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span className={`text-sm ${isActive ? 'font-bold text-gray-900' : 'text-gray-600 group-hover:text-black'}`}>
                    {gender}
                  </span>
                  <input
                    type="radio" // Keeping radio behavior via UI, logic is single select
                    name="gender"
                    checked={isActive}
                    onChange={() => updateFilter('gender', gender)}
                    className="hidden" // Custom UI used
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Color Filter (Multi-Select) */}
      {colors.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <h3 className="font-bold text-sm mb-3 uppercase tracking-wider">Color</h3>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => {
              const activeRef = getActiveFilters('color');
              const isActive = activeRef.includes(color);

              // Color mapping for visual display (simplified)
              const colorMap: Record<string, string> = {
                'red': '#ef4444', 'blue': '#3b82f6', 'green': '#22c55e',
                'yellow': '#eab308', 'black': '#000000', 'white': '#ffffff',
                'pink': '#ec4899', 'purple': '#a855f7', 'grey': '#6b7280', 'orange': '#f97316',
                'navy': '#1e3a8a', 'beige': '#f5f5dc', 'maroon': '#800000', 'cream': '#fffdd0'
              };
              const bg = colorMap[color.toLowerCase()] || '#e5e7eb';
              const isWhite = bg === '#ffffff' || bg === '#fffdd0' || bg === '#f5f5dc';

              return (
                <button
                  key={color}
                  type="button"
                  title={color}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isActive
                      ? 'border-gray-900 scale-110 shadow-sm'
                      : 'border-transparent hover:border-gray-300'
                    }`}
                  onClick={() => updateFilter('color', color)}
                >
                  <div
                    className="w-full h-full rounded-full border border-black/10"
                    style={{ backgroundColor: bg }}
                  />
                  {isActive && (
                    <Check className={`absolute w-3 h-3 ${isWhite ? 'text-black' : 'text-white'}`} style={{ strokeWidth: 4 }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Filter (Multi-Select) */}
      {sizeFilterMode !== 'none' && (
        <div className="pt-4 border-t border-gray-100">
          <h3 className="font-bold text-sm mb-3 uppercase tracking-wider">Size</h3>
          <div className="flex flex-wrap gap-2">
            {(sizeFilterMode === 'apparel'
              ? ['XS', 'S', 'M', 'L', 'XL', 'XXL']
              : ['6', '7', '8', '9', '10']
            ).map((size) => {
              const activeRef = getActiveFilters('size');
              const isActive = activeRef.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  className={`min-w-[40px] px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${isActive
                      ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  onClick={() => updateFilter('size', size)}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Brand (Single Select as mostly used, but keeping UI clean) */}
      {brands.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <h3 className="font-bold text-sm mb-3 uppercase tracking-wider">Brand</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1 customize-scrollbar">
            {brands.map((brand) => {
              const isActive = searchParams.get('brand') === brand;
              return (
                <label key={brand} className="flex items-center gap-2 cursor-pointer group py-1">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => updateFilter('brand', brand)}
                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className={`text-sm ${isActive ? 'font-medium text-black' : 'text-gray-600 group-hover:text-black'}`}>
                    {brand}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="pt-4 border-t border-gray-100">
        <h3 className="font-bold text-sm mb-3 uppercase tracking-wider">Price</h3>
        <div className="flex gap-2">
          <button onClick={() => updateFilter('maxPrice', '1000')} className="px-3 py-1 border text-xs rounded hover:bg-gray-100">Under ₹1k</button>
          <button onClick={() => updateFilter('minPrice', '1000')} className="px-3 py-1 border text-xs rounded hover:bg-gray-100">₹1k+</button>
        </div>
      </div>

    </div>
  );
}