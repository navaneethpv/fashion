// /web/src/app/products/[slug]/page.tsx

import { notFound } from "next/navigation";
import ProductActions from '../../components/ProductActions';

// (Your interfaces are correct and do not need to be changed)
interface ImageType { url: string; }
interface VariantType { size: string; color: string; sku: string; stock: number; }
interface DominantColorType { hex: string; name?: string; }
interface AiTagsType { style_tags: string[]; material_tags: string[]; }
interface Product {
  _id: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  price_cents: number;
  price_before_cents?: number;
  images: ImageType[];
  variants: VariantType[];
  dominantColor: DominantColorType;
  aiTags: AiTagsType;
  rating?: number;
  reviewsCount?: number;
}

// --- THIS FUNCTION IS NOW CORRECTED AND SIMPLIFIED ---
async function getProduct(id?: string, slug?: string): Promise<Product | null> {
  if (!id && !slug) return null;

  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  const baseUrl = base.replace(/\/$/, "");

  // Build candidates in order: admin/id, direct id, slug route, slug path
  const candidates: string[] = [];
  if (id) {
    candidates.push(`${baseUrl}/api/products/admin/${encodeURIComponent(id)}`);
    candidates.push(`${baseUrl}/api/products/${encodeURIComponent(id)}`);
  }
  if (slug) {
    candidates.push(`${baseUrl}/api/products/slug/${encodeURIComponent(slug)}`);
    candidates.push(`${baseUrl}/api/products/${encodeURIComponent(slug)}`);
  }

  for (const url of candidates) {
    try {
      console.log(`Trying product endpoint: ${url}`);
      const res = await fetch(url, { next: { revalidate: 60 } });
      if (res.ok) {
        return res.json();
      }
      if (res.status === 404) {
        console.warn(`Not found at ${url}, trying next candidate`);
        continue;
      }
      console.error(`API Error for ${url}: ${res.status} - ${res.statusText}`);
      return null;
    } catch (err) {
      console.error(`Request to ${url} failed:`, err);
    }
  }

  return null;
}

// Add helper to normalize image value (string | array<string> | array<{url}>)
function resolveImageSrc(images: any): string | null {
  const PLACEHOLDER = "https://via.placeholder.com/600x600?text=No+Image";
  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  const prefixIfRelative = (u?: string) => {
    if (!u) return PLACEHOLDER;
    if (/^https?:\/\//i.test(u)) return u;
    return `${base.replace(/\/$/, "")}/${u.replace(/^\//, "")}`;
  };

  if (!images) return PLACEHOLDER;
  // images may be a string
  if (typeof images === "string") return prefixIfRelative(images);
  // images may be an array of strings
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (!first) return PLACEHOLDER;
    if (typeof first === "string") return prefixIfRelative(first);
    if (typeof first === "object" && first.url) return prefixIfRelative(first.url);
  }
  return PLACEHOLDER;
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { id?: string };
}) {
  const product = await getProduct(searchParams?.id, params.slug);

  if (!product) {
    notFound();
  }

  const discountPercentage = product.price_before_cents
    ? Math.round(((product.price_before_cents - product.price_cents) / product.price_before_cents) * 100)
    : 0;

  const imageSrc = resolveImageSrc((product as any).images);

  return (
    <div className="bg-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
          <div className="flex flex-col items-center">
            {imageSrc && (
              <img
                src={imageSrc}
                alt={product.name}
                className="w-full max-w-lg h-auto object-cover rounded-lg shadow-lg"
              />
            )}
          </div>

          <div className="flex flex-col">
            <p className="text-sm font-medium text-gray-500">{product.brand}</p>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mt-1">{product.name}</h1>
            
            <div className="flex items-baseline mt-4">
              <span className="text-3xl font-extrabold text-gray-900">₹{(product.price_cents / 100).toFixed(0)}</span>
              {product.price_before_cents && (
                <>
                  <span className="text-xl text-gray-500 line-through ml-3">₹{(product.price_before_cents / 100).toFixed(0)}</span>
                  <span className="ml-3 text-sm font-semibold text-green-600">({discountPercentage}% OFF)</span>
                </>
              )}
            </div>
            
            {product.rating && product.reviewsCount && (
              <div className="flex items-center mt-3">
                <span className="text-yellow-400">{'★'.repeat(Math.round(product.rating))}</span>
                <span className="text-gray-300">{'★'.repeat(5 - Math.round(product.rating))}</span>
                <span className="ml-3 text-sm text-gray-600 hover:underline cursor-pointer">{product.reviewsCount} reviews</span>
              </div>
            )}

            <p className="text-base text-gray-700 mt-6">{product.description}</p>
            
            <div className="mt-8">
              <ProductActions product={product} />
            </div>

            <div className="mt-8 border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900">Style Details</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                    {product.aiTags?.style_tags?.map(tag => (
                        <span key={tag} className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full capitalize">{tag}</span>
                    ))}
                </div>
                 {product.dominantColor?.hex && (
                    <div className="flex items-center mt-4">
                        <span className="text-sm text-gray-600 mr-2">Color:</span>
                        <span className="w-6 h-6 rounded-full border border-gray-300" style={{ backgroundColor: product.dominantColor.hex }}></span>
                    </div>
                )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}