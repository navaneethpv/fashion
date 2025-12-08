import { notFound } from "next/navigation";
import Navbar from "../../components/Navbar";
import Gallery from "../../components/Gallery";
import OutfitGenerator from "../../components/OutfitGenerator";
import CollapsibleSection from "../../components/CollapsibleSection";
import ProductReviews from "../../components/productReview"; 
import AddToCartButton from "../../components/AddToCartButton";
import { Star, Truck, ShieldCheck } from "lucide-react";


async function getProduct(slug: string) {
  try {
    const res = await fetch(`http://localhost:4000/api/products/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return notFound();

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
          <div className="sticky top-24 self-start">
            <Gallery images={product.images} name={product.name} />
          </div>

          {/* Right Column: Details */}
          <div>
            <div className="mb-6">
              <h1 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                {product.brand}
              </h1>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 leading-tight">
                {product.name}
              </h2>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                  <span className="font-bold text-sm">
                    {product.rating ? product.rating.toFixed(1) : "—"}
                  </span>
                  <Star className="w-3 h-3 fill-current text-yellow-500" />
                  <span className="text-xs text-gray-500 border-l border-gray-300 pl-2 ml-1">
                    {product.reviews_count} Ratings
                  </span>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100 my-6" />

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-gray-900">
                  ${(product.price_cents / 100).toFixed(2)}
                </span>
                {product.price_before_cents && (
                  <span className="text-xl text-gray-400 line-through">
                    ${(product.price_before_cents / 100).toFixed(2)}
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
        <div className="max-w-4xl mx-auto pt-8">
          {/* 1. PRODUCT DETAILS / DESCRIPTION */}
          {CollapsibleSection && (
            <CollapsibleSection title="Product Details" defaultOpen={true}>
              <div className="prose prose-sm text-gray-600">
                <p>{product.description}</p>
                <p>Fabric: {product.fabric || "100% Cotton"}</p>
                <p>Care: {product.careInstructions || "Machine wash cold."}</p>
              </div>
            </CollapsibleSection>
          )}

          {/* 2. REVIEWS */}
          {CollapsibleSection && ProductReviews && (
            <CollapsibleSection
              title={`Customer Reviews (${product.reviews_count || 0})`}
            >
              <ProductReviews productId={product._id} />
            </CollapsibleSection>
          )}

          {/* 3. AI ASSISTANT / OUTFIT SUGGESTION */}
          <div className="mt-8">
            {/* 👇 CRITICAL FIX: Pass the MongoDB _id for API call 👇 */}
            <OutfitGenerator productId={product._id} />
          </div>
        </div>
      </main>
    </div>
  );
}