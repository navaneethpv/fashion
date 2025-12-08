import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import ProductFilters from '../components/ProductFilters';
import Pagination from '../components/Pagination';

// Interface for Search Parameters
interface SearchParams {
  page?: string;
  category?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  q?: string; // The search query
}

async function getProducts(searchParams: SearchParams) {
  const params = new URLSearchParams();
  if (searchParams.page) params.set('page', searchParams.page);
  if (searchParams.category) params.set('category', searchParams.category);
  if (searchParams.sort) params.set('sort', searchParams.sort);
  if (searchParams.minPrice) params.set('minPrice', searchParams.minPrice);
  if (searchParams.maxPrice) params.set('maxPrice', searchParams.maxPrice);
  if (searchParams.q) params.set('q', searchParams.q);

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

// Next.js Server Component
export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams; // Await the promise
  const { data: products, meta } = await getProducts(resolvedSearchParams);

  // 👇 LOGIC FOR PAGE TITLE & HEADER 👇
  let pageTitle = 'All Products';
  if (resolvedSearchParams.q) {
      pageTitle = `Search Results for "${resolvedSearchParams.q}"`;
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
              <ProductFilters />
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">
                {pageTitle} {/* Use the dynamically determined title */}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {/* Show total results if a search or filter is active */}
                Showing {products.length} {meta.total > 0 && `of ${meta.total}`} results
              </p>
            </div>

            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {products.map((p: any) => (
                    <ProductCard
                      key={p.slug}
                      product={{
                        slug: p.slug,
                        name: p.name,
                        brand: p.brand,
                        price_cents: p.price_cents,
                        price_before_cents: p.price_before_cents,
                        image: p.images[0].url,
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