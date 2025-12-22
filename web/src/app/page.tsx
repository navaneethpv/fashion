import Navbar from "./(pages)/components/Navbar";
import ProductCard from "./(pages)/components/ProductCard";
import AutoBanner from "./(pages)/components/AutoBanner";
import MostViewedSlider from "./(pages)/components/MostViewedSlider";
import Link from "next/link";
import OfferSection from "@/components/home/OfferSection";

// Fetch data directly from backend
async function getTrendingProducts() {
  try {
    const res = await fetch(
      "http://localhost:4000/api/products?limit=8&sort=price_desc",
      {
        cache: "no-store",
      }
    );
    if (!res.ok) throw new Error("Failed to fetch");
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

export default async function Home() {
  const products = await getTrendingProducts();

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />

      {/* Auto-Rotating Banner */}
      <AutoBanner />

      {/* Curated Offer / Campaign Section */}
      <OfferSection />

      {/* Trending Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Trending Now</h2>
          <Link
            href="/product"
            className="text-primary font-semibold hover:underline"
          >
            View All
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-8 gap-4">
            {products.map((p: any) => (
              <ProductCard
                key={p._id || p.id}
                product={{
                  _id: p._id,
                  slug: p.slug,
                  name: p.name,
                  price_cents: p.price_cents,
                  price_before_cents: p.price_before_cents,
                  images: p.images,
                  brand: p.brand,
                  offer_tag: p.offer_tag,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-gray-500 bg-gray-50 rounded-xl">
            Backend is sleeping. Please run `npm run dev` in /api folder.
          </div>
        )}
      </section>

      {/* Most Viewed Section - Interactive Slider */}
      <MostViewedSlider products={products} />
    </div>
  );
}
