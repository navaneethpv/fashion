import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import ProductFilters, { SizeFilterMode } from '../components/ProductFilters';
import Pagination from '../components/Pagination';

// Interface for Search Parameters coming from the URL
interface SearchParams {
  page?: string;
  category?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string;       // text search (name / brand / category / color)
  brand?: string;
  size?: string;
  color?: string;
}

async function getProducts(searchParams: SearchParams) {
  const params = new URLSearchParams();
  if (searchParams.page) params.set('page', searchParams.page);
  if (searchParams.category) params.set('category', searchParams.category);
  if (searchParams.sort) params.set('sort', searchParams.sort);
  if (searchParams.minPrice) params.set('minPrice', searchParams.minPrice);
  if (searchParams.maxPrice) params.set('maxPrice', searchParams.maxPrice);
  // Brand, size, color, and search are applied client-side for precise Myntra-like behavior

  try {
    const res = await fetch(`http://localhost:4000/api/products?${params.toString()}`, {
      cache: 'no-store'
    });
    
    if (!res.ok) return { data: [], meta: { page: 1, pages: 1, total: 0 } };
    return await res.json();
  } catch (error) {
    console.error("API Fetch Error:", error);
    return { data: [], meta: { page: 1, pages: 1, total: 0 } };
  }
}

type ProductForContext = {
  name?: string | null;
  category?: string | null;
  brand?: string | null;
  masterCategory?: string | null;
  subCategory?: string | null;
  dominantColor?: { name?: string | null } | null;
  variants?: { size?: string | number | null }[] | null;
};

function inferSizeFilterMode(products: ProductForContext[]): SizeFilterMode {
  if (!products || products.length === 0) return 'none';

  const masterCategories = new Set(
    products
      .map((p) => p.masterCategory?.toLowerCase().trim())
      .filter((v): v is string => !!v)
  );

  const hasApparel = masterCategories.has('apparel');
  const hasFootwear = masterCategories.has('footwear');
  const hasAccessories = masterCategories.has('accessories');

  if (hasAccessories && !hasApparel && !hasFootwear) {
    return 'none';
  }

  if (hasApparel && !hasFootwear && !hasAccessories) {
    return 'apparel';
  }

  if (hasFootwear && !hasApparel && !hasAccessories) {
    return 'footwear';
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

  if (alphaCount > 0 && numericCount === 0) return 'apparel';
  if (numericCount > 0 && alphaCount === 0) return 'footwear';

  return 'none';
}

function applyClientFilters(
  products: ProductForContext[],
  params: SearchParams
): ProductForContext[] {
  let filtered = [...products];

  const category = params.category?.trim();
  const brand = params.brand?.trim().toLowerCase();
  const color = params.color?.trim().toLowerCase();
  const size = params.size?.trim().toLowerCase();
  const search = params.search?.trim().toLowerCase();

  // 1. Category (backend also applies this, but keep it strict here)
  if (category) {
    filtered = filtered.filter((p) => p.category?.trim() === category);
  }

  // 2. Search across name / brand / category / subCategory / dominantColor.name
  if (search) {
    filtered = filtered.filter((p) => {
      const fields: Array<string | null | undefined> = [
        p.name,
        p.brand,
        p.category,
        p.subCategory,
        p.dominantColor?.name,
      ];
      return fields.some(
        (field) => field && field.toLowerCase().includes(search)
      );
    });
  }

  // 3. Brand
  if (brand) {
    filtered = filtered.filter(
      (p) => p.brand && p.brand.toLowerCase() === brand
    );
  }

  // 4. Color
  if (color) {
    filtered = filtered.filter(
      (p) =>
        p.dominantColor?.name &&
        p.dominantColor.name.toLowerCase() === color
    );
  }

  // 5. Size (exact size match inside variants)
  if (size) {
    filtered = filtered.filter((p) =>
      (p.variants || []).some((v) =>
        String(v.size ?? '').trim().toLowerCase() === size
      )
    );
  }

  return filtered;
}

// Next.js Server Component
export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams; // Await the promise
  const { data: products, meta } = await getProducts(resolvedSearchParams);

  const typedProducts = (products as ProductForContext[]) || [];
  const filteredProducts = applyClientFilters(typedProducts, resolvedSearchParams);
  const sizeFilterMode = inferSizeFilterMode(filteredProducts);

  // Derive available filter facets strictly from the current result set
  const categories = Array.from(
    new Set(
      filteredProducts
        .map((p) => p.category?.trim())
        .filter((v): v is string => !!v)
    )
  ).sort();

  const brands = Array.from(
    new Set(
      filteredProducts
        .map((p) => p.brand?.trim())
        .filter((v): v is string => !!v)
    )
  ).sort();

  const colors = Array.from(
    new Set(
      filteredProducts
        .map((p) => p.dominantColor?.name?.trim())
        .filter((v): v is string => !!v)
    )
  ).sort();

  // 👇 LOGIC FOR PAGE TITLE & HEADER 👇
  let pageTitle = 'All Products';
  if (resolvedSearchParams.search) {
      pageTitle = `Results for "${resolvedSearchParams.search}"`;
  } else if (resolvedSearchParams.category) {
      pageTitle = resolvedSearchParams.category;
  }
  // 👆 END LOGIC 👆

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">Filters</h2>
              </div>
              <ProductFilters
                sizeFilterMode={sizeFilterMode}
                categories={categories}
                brands={brands}
                colors={colors}
              />
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">
                {pageTitle} {/* Use the dynamically determined title */}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {/* Show total results if a search or filter is active */}
                Showing {filteredProducts.length} {meta.total > 0 && `of ${meta.total}`} results
              </p>
            </div>

            {filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {filteredProducts.map((p: any) => (
                    <ProductCard
                      key={p._id}
                      product={{
                        _id: p._id,
                        slug: p.slug,
                        name: p.name,
                        brand: p.brand,
                        price_cents: p.price_cents,
                        price_before_cents: p.price_before_cents,
                        images: p.images,
                        offer_tag: p.offer_tag
                      }}
                    />
                  ))}
                </div>
                <Pagination page={meta.page} totalPages={meta.pages} />
              </>
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900">No products found</h3>
                <p className="text-gray-500">Try adjusting your filters, or check your spelling if you searched.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}