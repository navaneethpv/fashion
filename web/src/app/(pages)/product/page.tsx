"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import ProductFilters, { SizeFilterMode } from "../components/ProductFilters";
import Pagination from "../components/Pagination";

export const dynamic = "force-dynamic";

// Interface for Search Parameters coming from the URL
interface SearchParams {
  [key: string]: string | undefined;
  page?: string;
  category?: string; // Standard param
  articleType?: string; // Legacy param support
  gender?: string; // Filter: Men, Women, Kids
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string; // text search (name / brand / category / color)
  q?: string; // limit to 'q' to match standard search param convention
  brand?: string;
  size?: string;
  color?: string;
  subcategory?: string; // Added validation support
}

type ProductsApiResponse = {
  data: ProductForContext[];
  meta: ApiMeta;
};

async function getProducts(
  searchParams: SearchParams
): Promise<ProductsApiResponse> {
  const params = new URLSearchParams();
  if (searchParams.page) params.set("page", searchParams.page);
  // Set limit to 70 products per page for better browsing experience
  const limit = 70;
  params.set("limit", String(limit));

  // articleType maps to 'category' in backend
  const categoryParam = searchParams.category || searchParams.articleType;
  if (categoryParam)
    params.set("category", categoryParam);

  // Pass gender filter to backend (Normalize to Title Case for API)
  if (searchParams.gender) {
    const rawGender = searchParams.gender.trim();
    // Convert "men" -> "Men", "women" -> "Women", "kids" -> "Kids"
    const normalizedGender =
      rawGender.charAt(0).toUpperCase() + rawGender.slice(1).toLowerCase();
    params.set("gender", normalizedGender);
  }

  // Map 'subcategory' from URL to 'subCategory' for API
  if (searchParams.subcategory) {
    params.set("subCategory", searchParams.subcategory);
  }

  if (searchParams.sort) params.set("sort", searchParams.sort);
  if (searchParams.minPrice) params.set("minPrice", searchParams.minPrice);
  if (searchParams.maxPrice) params.set("maxPrice", searchParams.maxPrice);

  // Pass filters to backend for accurate pagination
  if (searchParams.brand) params.set("brand", searchParams.brand);
  if (searchParams.size) params.set("size", searchParams.size);
  if (searchParams.color) params.set("color", searchParams.color);

  // Search is now handled server-side
  const query = searchParams.q || searchParams.search;
  if (query) params.set("q", query);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  if (!API_URL) {
    console.error("NEXT_PUBLIC_API_URL is not configured");
    return { data: [], meta: { page: 1, pages: 1, total: 0 } };
  }

  try {
    const res = await fetch(`${API_URL}/api/products?${params.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) return { data: [], meta: { page: 1, pages: 1, total: 0 } };
    return await res.json();
  } catch (error) {
    console.error("API Fetch Error:", error);
    return { data: [], meta: { page: 1, pages: 1, total: 0 } };
  }
}

type ProductForContext = {
  _id?: string;
  slug?: string | null;
  name?: string | null;
  category?: string | null;
  brand?: string | null;
  gender?: string | null;
  masterCategory?: string | null;
  subCategory?: string | null;
  dominantColor?: { name?: string | null } | null;
  variants?: { size?: string | number | null }[] | null;
  price_cents?: number | null;
  price_before_cents?: number | null;
  images?: (string | { url?: string })[] | null;
  offer_tag?: string | null;
  rating?: number | null;
  createdAt?: string | null;
};

function inferSizeFilterMode(products: ProductForContext[]): SizeFilterMode {
  if (!products || products.length === 0) return "none";

  const masterCategories = new Set(
    products
      .map((p) => p.masterCategory?.toLowerCase().trim())
      .filter((v): v is string => !!v)
  );

  const hasApparel = masterCategories.has("apparel");
  const hasFootwear = masterCategories.has("footwear");
  const hasAccessories = masterCategories.has("accessories");

  if (hasAccessories && !hasApparel && !hasFootwear) {
    return "none";
  }

  if (hasApparel && !hasFootwear && !hasAccessories) {
    return "apparel";
  }

  if (hasFootwear && !hasApparel && !hasAccessories) {
    return "footwear";
  }

  let alphaCount = 0;
  let numericCount = 0;

  for (const p of products) {
    if (!p.variants) continue;
    for (const v of p.variants) {
      const rawSize = v?.size;
      if (rawSize == null) continue;
      const size = String(rawSize).trim();
      if (!size) continue;

      if (/^\d+(\.\d+)?$/.test(size)) {
        numericCount += 1;
      } else if (/[a-zA-Z]/.test(size)) {
        alphaCount += 1;
      }

      if (alphaCount + numericCount > 30) break;
    }
    if (alphaCount + numericCount > 30) break;
  }

  if (alphaCount > 0 && numericCount === 0) return "apparel";
  if (numericCount > 0 && alphaCount === 0) return "footwear";

  return "none";
}

function applyClientFilters(
  products: ProductForContext[],
  params: SearchParams
): ProductForContext[] {
  let filtered = [...products];

  const articleType = (params.category || params.articleType)?.trim();
  const gender = params.gender?.trim();
  const brand = params.brand?.trim().toLowerCase();
  const color = params.color?.trim().toLowerCase();
  const size = params.size?.trim().toLowerCase();
  // Search is handled by backend now

  // 1. ArticleType
  if (articleType) {
    if (articleType.toLowerCase() === "footwear") {
      filtered = filtered.filter(
        (p) => p.masterCategory?.trim().toLowerCase() === "footwear"
      );
    } else {
      // Backend handles normalization (e.g. "shirt" -> "Shirts"), so we don't strict filter here
      // filtered = filtered.filter((p) => p.category?.trim() === articleType);
    }
  }

  // 2. Gender filter
  // 2. Gender filter (Handled by Backend)

  // 3. Search (REMOVED - Backend handles it)

  // 4. Brand
  if (brand) {
    filtered = filtered.filter(
      (p) => p.brand && p.brand.toLowerCase() === brand
    );
  }

  // 5. Color
  if (color) {
    const selectedColors = color.split(",").map((c) => c.trim().toLowerCase());
    filtered = filtered.filter((p) =>
      p.dominantColor?.name && selectedColors.includes(p.dominantColor.name.toLowerCase())
    );
  }

  // 6. Size
  if (size) {
    const selectedSizes = size.split(",").map((s) => s.trim().toLowerCase());
    filtered = filtered.filter((p) =>
      (p.variants || []).some((v) =>
        selectedSizes.includes(String(v.size ?? "").trim().toLowerCase())
      )
    );
  }

  return filtered;
}

type ApiMeta = {
  page: number;
  pages: number;
  total: number;
  isSearchEmpty?: boolean;
};

type SortKey = "price_asc" | "price_desc" | "new" | "rating" | undefined;

// ... imports
import { SlidersHorizontal } from "lucide-react";
import FilterDrawer from "../components/FilterDrawer";
import { AnimatePresence, motion } from "framer-motion";
import ProductPageLoader from "../components/ProductPageLoader";

// ... (keep logic above ProductPageContent)

function ProductPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [products, setProducts] = useState<ProductForContext[]>([]);
  const [meta, setMeta] = useState<ApiMeta>({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState<boolean>(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const resolvedSearchParams: SearchParams = useMemo(
    () => ({
      page: searchParams.get("page") || undefined,
      category: searchParams.get("category") || undefined,
      articleType: searchParams.get("articleType") || undefined,
      gender: searchParams.get("gender") || undefined,
      sort: searchParams.get("sort") || undefined,
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,
      search: searchParams.get("search") || undefined,
      q: searchParams.get("q") || undefined,
      brand: searchParams.get("brand") || undefined,
      size: searchParams.get("size") || undefined,
      color: searchParams.get("color") || undefined,
      subcategory: searchParams.get("subcategory") || undefined,
    }),
    [searchParams]
  );

  // Sidebar handler (Immediate update)
  const handleSidebarFilterChange = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/product?${params.toString()}`, { scroll: false });
  };

  // ... (keep sortKey, useEffect, filteredProducts, sortedProducts, sizeFilterMode, genders, brands, colors, pageTitle logic)

  const sortKey = (resolvedSearchParams.sort as SortKey) || undefined;

  // Fetch products
  useEffect(() => {
    let isCancelled = false;

    async function fetchData() {
      setLoading(true);
      // Premium feel: Ensure loader shows for at least 800ms
      const minLoadTime = new Promise(resolve => setTimeout(resolve, 800));
      const request = getProducts(resolvedSearchParams);

      const [_, response] = await Promise.all([minLoadTime, request]);
      const { data, meta } = response;

      if (meta?.isSearchEmpty) {
        if (!isCancelled) {
          setProducts([]);
          setMeta(meta as ApiMeta);
          setLoading(false);
        }
        return;
      }

      if (!isCancelled) {
        setProducts((data as ProductForContext[]) || []);
        setMeta(meta as ApiMeta);
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [resolvedSearchParams]);

  const filteredProducts = useMemo(
    () => applyClientFilters(products, resolvedSearchParams),
    [products, resolvedSearchParams]
  );

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];

    // ... sort logic (keep as is)
    if (!sortKey) return list;

    if (sortKey === "price_asc") {
      return list.sort((a, b) => (a.price_cents ?? 0) - (b.price_cents ?? 0));
    }

    if (sortKey === "price_desc") {
      return list.sort((a, b) => (b.price_cents ?? 0) - (a.price_cents ?? 0));
    }

    if (sortKey === "new") {
      return list.sort((a, b) => {
        const da = a.createdAt ? Date.parse(a.createdAt) : 0;
        const db = b.createdAt ? Date.parse(b.createdAt) : 0;
        return db - da;
      });
    }

    if (sortKey === "rating") {
      return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }

    return list;
  }, [filteredProducts, sortKey]);

  const sizeFilterMode = inferSizeFilterMode(filteredProducts);

  const genders = ["Men", "Women", "Kids"];

  const brands = useMemo(
    () =>
      Array.from(
        new Set(
          filteredProducts
            .map((p) => p.brand?.trim())
            .filter((v): v is string => !!v)
        )
      ).sort(),
    [filteredProducts]
  );

  const colors = useMemo(
    () =>
      Array.from(
        new Set(
          filteredProducts
            .map((p) => p.dominantColor?.name?.trim())
            .filter((v): v is string => !!v)
        )
      ).sort(),
    [filteredProducts]
  );

  // Derive Page Title
  let pageTitle = "All Products";
  const currentSearch = resolvedSearchParams.q || resolvedSearchParams.search;

  if (currentSearch) {
    pageTitle = `Results for "${currentSearch}"`;
  } else if (resolvedSearchParams.subcategory) {
    // Format: "Formal Shirts"
    const sub = resolvedSearchParams.subcategory.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
    pageTitle = sub;
    if (resolvedSearchParams.gender) {
      pageTitle = `${resolvedSearchParams.gender}'s ${sub}`;
    }
  } else if (resolvedSearchParams.articleType) {
    pageTitle = resolvedSearchParams.articleType;
    if (resolvedSearchParams.gender) {
      pageTitle = `${resolvedSearchParams.gender}'s ${resolvedSearchParams.articleType}`;
    }
  }

  const hasActiveFiltersOrSort =
    !!resolvedSearchParams.gender ||
    !!resolvedSearchParams.brand ||
    !!resolvedSearchParams.color ||
    !!resolvedSearchParams.size ||
    !!resolvedSearchParams.minPrice ||
    !!resolvedSearchParams.maxPrice ||
    !!resolvedSearchParams.search ||
    !!resolvedSearchParams.q ||
    !!resolvedSearchParams.sort;

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(
      params.toString() ? `${pathname}?${params.toString()}` : pathname,
      { scroll: false }
    );
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    [
      "gender",
      "brand",
      "color",
      "size",
      "minPrice",
      "maxPrice",
      "search",
      "q",
      "sort",
    ].forEach((key) => params.delete(key));
    params.delete("q"); // Explicitly ensure 'q' is removed
    router.push(
      params.toString() ? `${pathname}?${params.toString()}` : pathname,
      { scroll: false }
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-gray-100">
      <Navbar />

      <AnimatePresence mode="wait">
        {loading && <ProductPageLoader key="loader" />}
      </AnimatePresence>

      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Filter Drawer (Mobile) */}
          <FilterDrawer
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            sizeFilterMode={sizeFilterMode}
            genders={genders}
            brands={brands}
            colors={colors}
          />

          {/* MOBILE STICKY FILTER PILL */}
          <motion.button
            initial={{ y: 100, opacity: 0, x: "-50%" }}
            animate={{ y: 0, opacity: 1, x: "-50%" }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
            onClick={() => setIsFilterOpen(true)}
            className="fixed bottom-8 left-1/2 z-50 md:hidden flex items-center gap-3 px-6 py-3 bg-black/90 backdrop-blur-md text-white rounded-full shadow-2xl hover:bg-black transition-colors"
            aria-label="Open Filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-xs font-medium tracking-[0.15em] uppercase">Filters</span>
          </motion.button>

          {/* 1) PREMIUM HEADER */}
          <header className="pt-16 pb-12 sm:pt-24 sm:pb-16 text-center max-w-4xl mx-auto px-6">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-4xl md:text-5xl font-serif font-medium text-gray-900 mb-4"
            >
              {pageTitle}
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-gray-500 uppercase tracking-[0.15em] text-xs md:text-sm font-medium"
            >
              {sortedProducts.length > 0 ? `${sortedProducts.length} Items` : "Collection"}
            </motion.p>
          </header>

          {/* 2) STICKY UTILITY BAR (Mobile & Desktop) */}
          <div className="sticky top-[60px] md:top-[80px] z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">

              {/* Left: Filter Toggle / Count */}
              <div className="flex items-center gap-6">

                <div className="hidden md:flex items-center gap-4 text-sm text-gray-500">
                  <span className="font-medium text-gray-900 hidden lg:inline">Filters</span>
                  <span className="h-4 w-px bg-gray-200"></span>
                  <span>{sortedProducts.length} Results</span>
                </div>
              </div>

              {/* Right: Sort */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 uppercase tracking-wider hidden sm:inline">Sort by</span>
                <div className="relative">
                  <select
                    className="appearance-none bg-transparent text-sm font-medium text-gray-900 pr-8 pl-2 py-1 focus:outline-none cursor-pointer hover:opacity-70 transition-opacity text-right"
                    value={sortKey || ""}
                    onChange={(e) => handleSortChange(e.target.value)}
                  >
                    <option value="">Recommended</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="new">New Arrivals</option>
                    <option value="rating">Top Rated</option>
                  </select>
                  {/* Tiny custom arrow to replace default browser arrow */}
                  {/* <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                    </div> */}
                </div>
              </div>
            </div>
          </div>

          <main className="max-w-[1600px] mx-auto px-4 md:px-8 py-12 flex gap-12">

            {/* Desktop Sidebar */}
            <aside className="hidden md:block w-64 flex-shrink-0 pt-2 sticky px-4 top-32 h-[calc(100vh-8rem)] overflow-y-auto pr-4 thin-scrollbar">
              <div className="flex justify-between items-baseline mb-8">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">Refine</span>
                {hasActiveFiltersOrSort && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-[10px] uppercase font-bold text-gray-400 hover:text-black transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <ProductFilters
                sizeFilterMode={sizeFilterMode}
                genders={genders}
                brands={brands}
                colors={colors}
                values={resolvedSearchParams}
                onChange={handleSidebarFilterChange}
              />
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
              {sortedProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12 md:gap-x-6 md:gap-y-16">
                    {sortedProducts.map((p, i) => (
                      <motion.div
                        key={p._id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "0px" }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                      >
                        <ProductCard
                          product={{
                            _id: p._id,
                            slug: (p.slug as string) || "",
                            name: (p.name as string) || "",
                            brand: (p.brand as string) || "",
                            price_cents: p.price_cents ?? 0,
                            price_before_cents:
                              p.price_before_cents ?? p.price_cents ?? 0,
                            images: p.images ?? [],
                            offer_tag: p.offer_tag ?? undefined,
                          }}
                        />
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-20 border-t border-gray-100 pt-12 text-center">
                    <Pagination page={meta.page} totalPages={meta.pages} />
                  </div>
                </>
              ) : (
                <div className="min-h-[400px] flex flex-col items-center justify-center text-center px-6">
                  <h3 className="font-serif text-2xl text-gray-900 mb-2">No matches found</h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    We couldn't find any items matching your filters. Try adjusting your search criteria.
                  </p>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-flex items-center justify-center bg-gray-900 text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200 hover:scale-105"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </main>
        </motion.div>
      )}
    </div>
  );
}

export default function ProductPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white">
          <Navbar />
          <div className="flex justify-center items-center h-[60vh]">
            <div className="text-gray-500">Loading products...</div>
          </div>
        </div>
      }
    >
      <ProductPageContent />
    </Suspense>
  );
}
