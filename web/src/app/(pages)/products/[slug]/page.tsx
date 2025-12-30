// /web/src/app/products/[slug]/page.tsx

import { notFound } from "next/navigation";

// ✅ UI components from your FIRST style
import Navbar from "../../components/Navbar";
import Gallery from "../../components/Gallery";
import OutfitGenerator from "../../components/OutfitGenerator";
import CollapsibleSection from "../../components/CollapsibleSection";
import ProductReviews from "../../components/productReview";
import AddToCartButton from "../../components/AddToCartButton";
import { Star, Truck, ShieldCheck } from "lucide-react";
import ProductSlider from "../../components/ProductSlider";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

// (Your interfaces extended slightly for optional fields)
interface ImageType {
  url: string;
}
interface VariantType {
  size: string;
  color: string;
  sku: string;
  stock: number;
}
interface DominantColorType {
  hex: string;
  name?: string;
}
interface AiTagsType {
  style_tags: string[];
  material_tags: string[];
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  brand: string;
  gender?: string;
  category?: string;
  subCategory?: string;
  description: string;
  price_cents: number;
  price_before_cents?: number;
  images: ImageType[];
  variants: VariantType[];
  dominantColor: DominantColorType;
  aiTags: AiTagsType;
  rating?: number;
  reviewsCount?: number;

  // Optional extra fields that first layout uses
  fabric?: string;
  careInstructions?: string;

  // Related products (Freshly fetched)
  relatedAccessories?: any[];
  similarProducts?: any[];
}

// --- DO NOT TOUCH: your fetching + slug logic ---

async function getProduct(id?: string, slug?: string): Promise<Product | null> {
  if (!id && !slug) return null;

  const base =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:4000";
  const baseUrl = base.replace(/\/$/, "");

  const candidates: string[] = [];
  if (slug) {
    candidates.push(`${baseUrl}/api/products/slug/${encodeURIComponent(slug)}`);
  }
  if (id) {
    candidates.push(`${baseUrl}/api/products/admin/${encodeURIComponent(id)}`);
    candidates.push(`${baseUrl}/api/products/${encodeURIComponent(id)}`);
  }
  if (slug) {
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
      if (res.status === 401 || res.status === 403) {
        console.warn(`Auth required for ${url}, trying next candidate`);
        continue;
      }
      console.error(`API Error for ${url}: ${res.status} - ${res.statusText}`);
      return null;
    } catch (err) {
      console.error(`Request to ${url} failed:`, err);
    }
  }

  // FALLBACK: query the list endpoint and find the product by id or slug
  try {
    const listUrl = `${baseUrl}/api/products`;
    console.log(`Falling back to list endpoint: ${listUrl}`);
    const listRes = await fetch(listUrl, { next: { revalidate: 60 } });
    if (!listRes.ok) {
      console.warn(`List endpoint returned ${listRes.status}`);
      return null;
    }
    const json = await listRes.json();
    const items = Array.isArray(json)
      ? json
      : json?.data ?? json?.products ?? null;
    if (!Array.isArray(items)) {
      console.warn("Unexpected list response shape", Object.keys(json || {}));
      return null;
    }
    const found = items.find((it: any) => {
      if (
        id &&
        (it._id === id || it.id === id || String(it._id) === String(id))
      )
        return true;
      if (slug && it.slug === slug) return true;
      return false;
    });
    if (found) return found;
    console.warn("Product not found in list response");
  } catch (err) {
    console.error("Fallback list fetch failed:", err);
  }

  return null;
}

// (helper kept in case you want it later, but Gallery already handles images)
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
  if (typeof images === "string") return prefixIfRelative(images);
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (!first) return PLACEHOLDER;
    if (typeof first === "string") return prefixIfRelative(first);
    if (typeof first === "object" && first.url)
      return prefixIfRelative(first.url);
  }
  return PLACEHOLDER;
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const paramsResolved = await params;
  const searchParamsResolved = await searchParams;
  const product = await getProduct(
    searchParamsResolved?.id,
    paramsResolved.slug
  );

  if (!product) {
    return notFound();
  }

  const discount = product.price_before_cents
    ? Math.round(
      ((product.price_before_cents - product.price_cents) /
        product.price_before_cents) *
      100
    )
    : 0;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* 🛑 TOP SECTION: GALLERY + MAIN INFO 🛑 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column: Gallery */}
          <div className="scroll self-start">
            {/* Uses your product.images directly */}
            <Gallery images={product.images} name={product.name} />
          </div>

          {/* Right Column: Details */}
          <div>
            {/* Brand + Title + Rating */}
            <div className="mb-6">
              <h1 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-2">
                {product.brand}
              </h1>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">
                {product.name}
              </h2>

              {typeof product.rating === "number" && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                    <span className="font-bold text-sm">
                      {product.rating.toFixed(1)}
                    </span>
                    <Star className="w-3 h-3 fill-current text-yellow-500" />
                    <span className="text-xs text-gray-500 border-l border-gray-300 pl-2 ml-1">
                      {product.reviewsCount ?? 0} Ratings
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100 my-6" />

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-gray-900">
                  ₹{(product.price_cents / 100).toFixed(0)}
                </span>
                {product.price_before_cents && (
                  <span className="text-xl text-gray-400 line-through">
                    ₹{(product.price_before_cents / 100).toFixed(0)}
                  </span>
                )}
                {discount > 0 && (
                  <span className="text-sm font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded">
                    {discount}% OFF
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Inclusive of all taxes
              </p>
            </div>

            {/* Sizes & Add Button */}
            <AddToCartButton
              productId={product._id}
              price={product.price_cents}
              variants={product.variants}
            />

            {/* Delivery & Trust */}
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mt-10">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" /> <span>Free Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> <span>30 Day Returns</span>
              </div>
            </div>

            <div className="h-px bg-gray-100 my-6" />
          </div>
        </div>

        {/* BOTTOM SECTIONS */}
        <div className="max-w-4xl mx-auto pt-8">
          {/* 1. PRODUCT DETAILS */}
          {CollapsibleSection && (
            <CollapsibleSection title="Product Details" defaultOpen={true}>
              <div className="prose prose-sm text-gray-600">
                <p>{product.description}</p>

                <div className="mt-4">
                  {/* Big primary swatch + meta */}
                  <div className="flex items-center justify gap-4">
                    {product.variants?.[0]?.color ? (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                        Color:{" "}
                        <span
                          className="inline-block px-3 py-3 rounded bg-gray-100 text-gray-700 text-xs"
                          style={
                            product.variants[0]?.color
                              ? { backgroundColor: product.variants[0].color }
                              : undefined
                          }
                        ></span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        No color information available
                      </div>
                    )}
                  </div>
                </div>

                {/* Swatch grid */}
              </div>
            </CollapsibleSection>
          )}

          {/* 2. REVIEWS */}
          {CollapsibleSection && ProductReviews && (
            <CollapsibleSection
              title={`Customer Reviews (${product.reviewsCount || 0})`}
            >
              <ProductReviews productId={product._id} />
            </CollapsibleSection>
          )}

          {/* 3. AI ASSISTANT / OUTFIT SUGGESTION */}
          <div className="mt-8">
            <OutfitGenerator
              productId={product._id}
              productGender={product.gender}
              productCategory={product.category}
              productSubCategory={product.subCategory}
              productName={product.name}
            />
          </div>

          {/* 4. CROSS-SELL SLIDERS */}
          {product.relatedAccessories &&
            product.relatedAccessories.length > 0 && (
              <div className="mt-12 border-t border-gray-100 pt-8">
                <ProductSlider
                  title="Complete the Look"
                  products={product.relatedAccessories}
                />
              </div>
            )}

          {product.similarProducts && product.similarProducts.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-8">
              <ProductSlider
                title="You May Also Like"
                products={product.similarProducts}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
