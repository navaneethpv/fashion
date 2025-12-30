"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check } from 'lucide-react';

export type FilterValues = Record<string, string | undefined>;
export type SizeFilterMode = 'apparel' | 'footwear' | 'none';

interface ProductFiltersProps {
  sizeFilterMode?: SizeFilterMode;
  genders: string[];
  brands: string[];
  colors: string[];
  activeArticleType?: string;
  values: FilterValues;
  onChange: (key: string, value: string | undefined) => void;
}

const PRICE_MIN = 0;
const PRICE_MAX = 10000;

export default function ProductFilters({
  sizeFilterMode = 'none',
  genders,
  brands,
  colors,
  values,
  onChange,
}: ProductFiltersProps) {

  // -- Price Logic --
  const [localMin, setLocalMin] = useState(PRICE_MIN);
  const [localMax, setLocalMax] = useState(PRICE_MAX);

  // Sync local state with props (e.g. when cleared externally)
  useEffect(() => {
    const vMin = parseInt(values.minPrice || String(PRICE_MIN));
    const vMax = parseInt(values.maxPrice || String(PRICE_MAX));
    setLocalMin(isNaN(vMin) ? PRICE_MIN : vMin);
    setLocalMax(isNaN(vMax) ? PRICE_MAX : vMax);
  }, [values.minPrice, values.maxPrice]);

  // Update parent only only interaction end/commit
  const commitPriceChange = (min: number, max: number) => {
    onChange('minPrice', min === PRICE_MIN ? undefined : String(min));
    onChange('maxPrice', max === PRICE_MAX ? undefined : String(max));
  };

  // -- Helper Functions --
  const isMultiSelect = (key: string) => key === 'color' || key === 'size';

  const updateFilter = (key: string, value: string) => {
    const current = values[key];

    if (isMultiSelect(key)) {
      let currentValues = current ? current.split(',') : [];
      if (currentValues.includes(value)) {
        currentValues = currentValues.filter((v) => v !== value);
      } else {
        currentValues.push(value);
      }

      onChange(key, currentValues.length > 0 ? currentValues.join(',') : undefined);
    } else {
      // Single Select (Toggle)
      onChange(key, current === value ? undefined : value);
    }
  };

  const getActiveList = (key: string) => {
    const val = values[key];
    return val ? val.split(',') : [];
  };

  // -- Render Chips --
  const renderActiveChips = () => {
    const chips: { key: string; value: string; label: string }[] = [];
    ['gender', 'brand', 'color', 'size'].forEach(key => {
      getActiveList(key).forEach(val => chips.push({ key, value: val, label: val }));
    });

    // Add Price Chip if active
    if (values.minPrice || values.maxPrice) {
      chips.push({
        key: 'price',
        value: 'price',
        label: `₹${values.minPrice || PRICE_MIN} - ₹${values.maxPrice || PRICE_MAX}`
      });
    }

    if (chips.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-6">
        {chips.map((chip, idx) => (
          <button
            key={`${chip.key}-${chip.value}-${idx}`}
            onClick={() => {
              if (chip.key === 'price') {
                onChange('minPrice', undefined);
                onChange('maxPrice', undefined);
              } else {
                updateFilter(chip.key, chip.value);
              }
            }}
            className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-xs font-medium text-gray-800 rounded-full hover:bg-gray-200 transition-colors"
          >
            {chip.label}
            <X className="w-3 h-3" />
          </button>
        ))}
        <button
          onClick={() => {
            // Clear all logic handled by parent usually, but providing a helper if needed?
            // Actually the parent "Clear All" is better. Here we just trigger individual.
            // But if we want a local clear:
            ['gender', 'brand', 'color', 'size', 'minPrice', 'maxPrice', 'sort'].forEach(k => onChange(k, undefined));
          }}
          className="text-xs text-red-500 hover:text-red-700 underline px-2"
        >
          Clear All
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {renderActiveChips()}

      {/* --- Price Filter (Slider + Inputs) --- */}
      <div>
        <h3 className="font-bold text-sm mb-4 uppercase tracking-wider">Price Range</h3>

        {/* Dual Range Slider Mockup (Visual) using 2 Range Inputs */}
        <div className="relative h-12 mb-2">
          {/* Track Background */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 rounded-full -translate-y-1/2"></div>
          {/* Active Track */}
          <div
            className="absolute top-1/2 h-1 bg-black rounded-full -translate-y-1/2 pointer-events-none"
            style={{
              left: `${(localMin / PRICE_MAX) * 100}%`,
              right: `${100 - (localMax / PRICE_MAX) * 100}%`
            }}
          ></div>

          {/* Range Input 1 (Min) */}
          <input
            type="range"
            min={PRICE_MIN} max={PRICE_MAX} step={100}
            value={localMin}
            onChange={(e) => {
              const val = Math.min(Number(e.target.value), localMax - 100);
              setLocalMin(val);
              // Defer onChange commit to mouseUp or just update local?
              // "Slider updates local state ONLY" -> "Apply filters ONLY when user clicks Apply".
              // But we MUST update the parent `values` if we want the Inputs to sync?
              // Actually, Drawer `tempParams` ARE the local state. 
              // So we CAN call `onChange` immediately.
              // The request said: "Apply filters ONLY on Apply". `onChange` here updates `tempParams` (local Drawer state). So it IS deferred.
              commitPriceChange(val, localMax);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto z-20"
            style={{ zIndex: localMin > PRICE_MAX - 100 ? 50 : 20 }} // Bring to front rules
          />
          {/* Range Input 2 (Max) */}
          <input
            type="range"
            min={PRICE_MIN} max={PRICE_MAX} step={100}
            value={localMax}
            onChange={(e) => {
              const val = Math.max(Number(e.target.value), localMin + 100);
              setLocalMax(val);
              commitPriceChange(localMin, val);
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto z-20"
          />

          {/* Visual Thumbs (positioned by state) */}
          <div
            className="absolute top-1/2 w-5 h-5 bg-white border-2 border-black rounded-full shadow-md -translate-y-1/2 pointer-events-none z-30"
            style={{ left: `calc(${(localMin / PRICE_MAX) * 100}% - 10px)` }}
          />
          <div
            className="absolute top-1/2 w-5 h-5 bg-white border-2 border-black rounded-full shadow-md -translate-y-1/2 pointer-events-none z-30"
            style={{ left: `calc(${(localMax / PRICE_MAX) * 100}% - 10px)` }}
          />
        </div>

        {/* Inputs */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <span className="text-xs text-gray-500 mb-1 block">Min</span>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500 text-sm">₹</span>
              <input
                type="number"
                value={localMin}
                onChange={(e) => {
                  const val = Number(e.target.value); // Allow typing freely?
                  setLocalMin(val);
                }}
                onBlur={() => {
                  let val = Math.max(PRICE_MIN, Math.min(localMin, localMax - 100));
                  setLocalMin(val);
                  commitPriceChange(val, localMax);
                }}
                className="w-full pl-6 pr-2 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="flex-1">
            <span className="text-xs text-gray-500 mb-1 block">Max</span>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500 text-sm">₹</span>
              <input
                type="number"
                value={localMax}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setLocalMax(val);
                }}
                onBlur={() => {
                  let val = Math.min(PRICE_MAX, Math.max(localMax, localMin + 100));
                  setLocalMax(val);
                  commitPriceChange(localMin, val);
                }}
                className="w-full pl-6 pr-2 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- Sort By Options --- */}
      <div className="pt-4 border-t border-gray-100">
        <h3 className="font-bold text-sm mb-3 uppercase tracking-wider">Sort By</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Newest', value: 'newest' },
            { label: 'Price: Low to High', value: 'price_asc' },
            { label: 'Price: High to Low', value: 'price_desc' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange('sort', opt.value)}
              className={`px-3 py-2 text-sm rounded-lg border transition-all ${(values.sort || 'newest') === opt.value
                ? 'bg-black text-white border-black'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>


      {/* Gender */}
      {genders.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <h3 className="font-bold text-sm mb-3 uppercase tracking-wider">Gender</h3>
          <div className="space-y-2">
            {genders.map((gender) => {
              const isActive = values['gender'] === gender;
              return (
                <label key={gender} className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isActive ? 'border-black bg-black' : 'border-gray-300 group-hover:border-gray-400'}`}>
                    {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <span className={`text-sm ${isActive ? 'font-bold text-gray-900' : 'text-gray-600 group-hover:text-black'}`}>
                    {gender}
                  </span>
                  <input
                    type="radio"
                    name="gender"
                    checked={isActive}
                    onChange={() => updateFilter('gender', gender)}
                    className="hidden"
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Color */}
      {colors.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <h3 className="font-bold text-sm mb-3 uppercase tracking-wider">Color</h3>
          <div className="flex flex-wrap gap-3">
            {Array.from(new Set(colors.map(c => c.trim().toLowerCase()))).map((normalizedColor) => {
              // Find original casing for display/value if needed, or just use Title Case
              // We prefer Title Case for display
              const displayColor = normalizedColor.charAt(0).toUpperCase() + normalizedColor.slice(1);
              const colorValue = displayColor; // Send Title Case to backend to match regex expected

              const activeRef = getActiveList('color');
              // Check if "Black" or "black" is in active list (case-insensitive check)
              const isActive = activeRef.some(acc => acc.toLowerCase() === normalizedColor);

              const colorMap: Record<string, string> = {
                'red': '#ef4444', 'blue': '#3b82f6', 'green': '#22c55e',
                'yellow': '#eab308', 'black': '#000000', 'white': '#ffffff',
                'pink': '#ec4899', 'purple': '#a855f7', 'grey': '#6b7280', 'gray': '#6b7280', 'orange': '#f97316',
                'navy': '#1e3a8a', 'beige': '#f5f5dc', 'maroon': '#800000', 'cream': '#fffdd0',
                'brown': '#8B4513', 'silver': '#C0C0C0', 'gold': '#FFD700', 'olive': '#808000'
              };
              const bg = colorMap[normalizedColor] || '#e5e7eb';
              const isWhite = bg === '#ffffff' || bg === '#fffdd0' || bg === '#f5f5dc';

              return (
                <button
                  key={normalizedColor}
                  type="button"
                  title={displayColor}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isActive
                    ? 'border-gray-900 scale-110 shadow-sm'
                    : 'border-transparent hover:border-gray-300'
                    }`}
                  onClick={() => updateFilter('color', colorValue)}
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

      {/* Size */}
      {sizeFilterMode !== 'none' && (
        <div className="pt-4 border-t border-gray-100">
          <h3 className="font-bold text-sm mb-3 uppercase tracking-wider">Size</h3>
          <div className="flex flex-wrap gap-2">
            {(sizeFilterMode === 'apparel'
              ? ['XS', 'S', 'M', 'L', 'XL', 'XXL']
              : ['6', '7', '8', '9', '10']
            ).map((size) => {
              const activeRef = getActiveList('size');
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

      {/* Brand */}
      {brands.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <h3 className="font-bold text-sm mb-3 uppercase tracking-wider">Brand</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1 customize-scrollbar">
            {brands.map((brand) => {
              const isActive = values['brand'] === brand;
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
    </div>
  );
}