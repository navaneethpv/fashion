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
      <div className="flex flex-wrap gap-2 mb-8 animate-in fade-in slide-in-from-top-2">
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
            className="group flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-full hover:bg-black transition-all shadow-sm hover:shadow-md"
          >
            <span>{chip.label}</span>
            <X className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        ))}
        <button
          onClick={() => {
            ['gender', 'brand', 'color', 'size', 'minPrice', 'maxPrice', 'sort'].forEach(k => onChange(k, undefined));
          }}
          className="px-2 text-xs font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-wider"
        >
          Clear All
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-10 pb-10">
      {renderActiveChips()}

      {/* --- Price Filter (Slider + Inputs) --- */}
      <div>
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
          Price Range
          <span className="h-px bg-gray-100 flex-1"></span>
        </h3>

        {/* Dual Range Slider Mockup (Visual) using 2 Range Inputs */}
        <div className="relative h-12 mb-6 group">
          {/* Track Background */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 rounded-full -translate-y-1/2 group-hover:bg-gray-200 transition-colors"></div>
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
            className="absolute top-1/2 w-5 h-5 bg-white border-[3px] border-black rounded-full shadow-lg -translate-y-1/2 pointer-events-none z-30 transition-transform group-hover:scale-110"
            style={{ left: `calc(${(localMin / PRICE_MAX) * 100}% - 10px)` }}
          />
          <div
            className="absolute top-1/2 w-5 h-5 bg-white border-[3px] border-black rounded-full shadow-lg -translate-y-1/2 pointer-events-none z-30 transition-transform group-hover:scale-110"
            style={{ left: `calc(${(localMax / PRICE_MAX) * 100}% - 10px)` }}
          />
        </div>

        {/* Inputs */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
            <input
              type="number"
              value={localMin}
              onChange={(e) => setLocalMin(Number(e.target.value))}
              onBlur={() => {
                let val = Math.max(PRICE_MIN, Math.min(localMin, localMax - 100));
                setLocalMin(val);
                commitPriceChange(val, localMax);
              }}
              className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:border-gray-200 focus:ring-0 transition-all text-left"
            />
          </div>
          <span className="text-gray-300 font-medium">-</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
            <input
              type="number"
              value={localMax}
              onChange={(e) => setLocalMax(Number(e.target.value))}
              onBlur={() => {
                let val = Math.min(PRICE_MAX, Math.max(localMax, localMin + 100));
                setLocalMax(val);
                commitPriceChange(localMin, val);
              }}
              className="w-full pl-7 pr-1 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:border-gray-200 focus:ring-0 transition-all text-left"
            />
          </div>
        </div>
      </div>

      {/* --- Sort By Options --- */}
      <div>
        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
          Sort By
          <span className="h-px bg-gray-100 flex-1"></span>
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Newest', value: 'newest' },
            { label: 'Price: Low to High', value: 'price_asc' },
            { label: 'Price: High to Low', value: 'price_desc' },
          ].map((opt) => {
            const isActive = (values.sort || 'newest') === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => onChange('sort', opt.value)}
                className={`px-4 py-2 text-xs font-bold rounded-full border transition-all duration-300
                ${isActive
                    ? 'bg-black text-white border-black shadow-lg'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-black hover:text-black'
                  }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>


      {/* Gender */}
      {genders.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            Gender
            <span className="h-px bg-gray-100 flex-1"></span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {genders.map((gender) => {
              const isActive = values['gender'] === gender;
              return (
                <button
                  key={gender}
                  onClick={() => updateFilter('gender', gender)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 border
                    ${isActive
                      ? 'bg-black text-white border-black shadow-md transform scale-105'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'
                    }`}
                >
                  {gender}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color */}
      {colors.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            Color
            <span className="h-px bg-gray-100 flex-1"></span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {Array.from(new Set(colors.map(c => c.trim().toLowerCase()))).map((normalizedColor) => {
              // Better Title Casing for multi-word colors
              const displayColor = normalizedColor
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

              const colorValue = displayColor;

              const activeRef = getActiveList('color');
              const isActive = activeRef.some(acc => acc.toLowerCase() === normalizedColor);

              const colorMap: Record<string, string> = {
                // Essentials
                'black': '#000000',
                'white': '#ffffff',
                'grey': '#808080',
                'gray': '#808080',
                'silver': '#C0C0C0',

                // Blues
                'blue': '#0000FF',
                'navy': '#000080',
                'navy blue': '#000080',
                'royal blue': '#4169E1',

                // Reds/Pinks
                'red': '#FF0000',
                'maroon': '#800000',
                'burgundy': '#800020',
                'pink': '#FFC0CB',
                'magenta': '#FF00FF',

                // Greens
                'green': '#008000',
                'olive': '#808000',
                'teal': '#008080',

                // Warm
                'yellow': '#FFFF00',
                'gold': '#FFD700',
                'orange': '#FFA500',
                'brown': '#A52A2A',
                'beige': '#F5F5DC',
                'cream': '#FFFDD0',
                'tan': '#D2B48C',
                'copper': '#B87333',
                'purple': '#800080'
              };
              const bg = colorMap[normalizedColor] || '#e5e7eb';
              const isWhite = bg.toLowerCase() === '#ffffff' || bg.toLowerCase() === '#fffdd0' || bg.toLowerCase() === '#f5f5dc';

              return (
                <div key={normalizedColor} className="flex flex-col items-center gap-2 mb-2">
                  <button
                    type="button"
                    title={displayColor}
                    className={`group relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                      ? 'ring-2 ring-black ring-offset-2 scale-110'
                      : 'hover:scale-110 hover:shadow-lg'
                      }`}
                    onClick={() => updateFilter('color', colorValue)}
                  >
                    <div
                      className="w-full h-full rounded-full border border-gray-100 shadow-sm"
                      style={{ backgroundColor: bg }}
                    />
                    {isActive && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className={`w-4 h-4 ${isWhite ? 'text-black' : 'text-white'}`} strokeWidth={3} />
                      </div>
                    )}
                  </button>

                  {/* Permanent Label (Pill Style) */}
                  <span
                    onClick={() => updateFilter('color', colorValue)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all cursor-pointer whitespace-nowrap shadow-sm
                      ${isActive
                        ? 'bg-black text-white'
                        : 'bg-white text-gray-900 border border-gray-100 hover:bg-gray-50'
                      }`}
                  >
                    {displayColor}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Size */}
      {sizeFilterMode !== 'none' && (
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            Size
            <span className="h-px bg-gray-100 flex-1"></span>
          </h3>
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
                  className={`w-11 h-11 flex items-center justify-center text-xs font-bold rounded-full border transition-all duration-300
                    ${isActive
                      ? 'bg-black text-white border-black shadow-lg transform scale-105'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black hover:bg-gray-50'
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
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
            Brand
            <span className="h-px bg-gray-100 flex-1"></span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => {
              const isActive = values['brand'] === brand;
              return (
                <button
                  key={brand}
                  onClick={() => updateFilter('brand', brand)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border duration-300
                         ${isActive
                      ? 'bg-black text-white border-black shadow-md'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'
                    }
                    `}
                >
                  {brand}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}