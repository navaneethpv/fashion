import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import OfferSection from '@/components/home/OfferSection';

// Fetch data directly from backend
async function getTrendingProducts() {
  try {
    const res = await fetch('http://localhost:4000/api/products?limit=8&sort=price_desc', { 
      cache: 'no-store' 
    });
    if (!res.ok) throw new Error('Failed to fetch');
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

      {/* Hero Section */}
      <section className="relative h-[500px] w-full bg-linear-to-r from-violet-100 to-pink-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center">
          <div className="max-w-xl z-10">
            <span className="text-accent font-bold tracking-wider text-sm uppercase mb-2 block">
              New Collection
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-tight mb-6">
              VIBE WITH <br/> <span className="text-primary">COLOR.</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-md">
              Discover the new season's hottest trends. Use our AI Color Match to find your perfect fit.
            </p>
            <div className="flex gap-4">
               <Link href="/product" className="bg-gray-900 text-white px-8 py-3.5 rounded-full font-bold hover:bg-gray-800 transition">
                Shop Now
              </Link>
              <button className="bg-white text-gray-900 border border-gray-200 px-8 py-3.5 rounded-full font-bold hover:bg-gray-50 transition flex items-center gap-2">
                 Try AI Search <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Abstract Hero Visual */}
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070')] bg-cover bg-center opacity-80 mask-image-gradient" />
          <div className="absolute inset-0 bg-linear-to-r from-violet-100 via-violet-100/80 to-transparent z-0 pointer-events-none" />
        </div>
      </section>
      
      {/* Curated Offer / Campaign Section */}
      <OfferSection />

      {/* Trending Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Trending Now</h2>
          <Link href="/product" className="text-primary font-semibold hover:underline">View All</Link>
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
                  offer_tag: p.offer_tag
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
    </div>
  );
}